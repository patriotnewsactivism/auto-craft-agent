export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
}

export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
  content?: string;
}

const GITHUB_API = "https://api.github.com";

export class GitHubService {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `token ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  async listRepositories(): Promise<GitHubRepo[]> {
    return this.fetch("/user/repos?sort=updated&per_page=100");
  }

  async getRepoContents(owner: string, repo: string, path: string = ""): Promise<GitHubContent[]> {
    return this.fetch(`/repos/${owner}/${repo}/contents/${path}`);
  }

  async getFileContent(downloadUrl: string): Promise<string> {
    const response = await fetch(downloadUrl);
    return response.text();
  }

  async createRepository(name: string, description: string, isPrivate: boolean = false) {
    return this.fetch("/user/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      }),
    });
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ) {
    try {
      // Handle UTF-8 encoding properly
      const encodedContent = btoa(
        Array.from(new TextEncoder().encode(content))
          .map(byte => String.fromCharCode(byte))
          .join('')
      );
      
      const body: { message: string; content: string; sha?: string } = {
        message,
        content: encodedContent,
      };
      
      if (sha) {
        body.sha = sha;
      }

      return await this.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error(`Failed to create/update file ${path}:`, error);
      throw error;
    }
  }

  async getFileSha(owner: string, repo: string, path: string): Promise<string | undefined> {
    try {
      const content = await this.fetch(`/repos/${owner}/${repo}/contents/${path}`);
      return content.sha as string | undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes('GitHub API error')) {
        return undefined;
      }
      throw error;
    }
  }

  async syncToGitHub(
    owner: string,
    repo: string,
    files: Array<{ path: string; content: string }>,
    commitMessage: string = "Sync from Autonomous Code Wizard"
  ): Promise<{ pushed: string[]; failed: string[]; errors: string[] }> {
    const pushed: string[] = [];
    const failed: string[] = [];
    const errors: string[] = [];

    console.log(`?? Starting GitHub sync to ${owner}/${repo}...`);
    console.log(`?? Syncing ${files.length} files`);

    if (!files || files.length === 0) {
      throw new Error("No files to sync. Please generate some files first.");
    }

    // Validate token first
    try {
      await this.fetch('/user');
      console.log('? GitHub authentication successful');
    } catch (error) {
      throw new Error(`GitHub authentication failed. Please check your token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Verify repo exists and we have access
    try {
      await this.fetch(`/repos/${owner}/${repo}`);
      console.log(`? Repository ${owner}/${repo} is accessible`);
    } catch (error) {
      throw new Error(`Cannot access repository ${owner}/${repo}. Please check permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Batch files to avoid rate limiting
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 1000; // 1 second

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      console.log(`?? Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)}`);

      const batchPromises = batch.map(async (file) => {
        try {
          console.log(`?? Uploading: ${file.path}`);
          
          // Validate file
          if (!file.content) {
            console.warn(`?? Skipping empty file: ${file.path}`);
            failed.push(file.path);
            errors.push(`${file.path}: Empty content`);
            return;
          }

          // Get existing file SHA (if it exists)
          const sha = await this.getFileSha(owner, repo, file.path);
          
          if (sha) {
            console.log(`?? Updating existing file: ${file.path}`);
          } else {
            console.log(`? Creating new file: ${file.path}`);
          }

          await this.createOrUpdateFile(owner, repo, file.path, file.content, commitMessage, sha);
          pushed.push(file.path);
          console.log(`? Successfully synced: ${file.path}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`? Failed to sync ${file.path}:`, errorMsg);
          failed.push(file.path);
          errors.push(`${file.path}: ${errorMsg}`);
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < files.length) {
        console.log(`?? Waiting before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    console.log(`? GitHub sync completed!`);
    console.log(`   - Pushed: ${pushed.length} files`);
    if (failed.length > 0) {
      console.log(`   - Failed: ${failed.length} files`);
      console.log(`   - Errors:`, errors);
    }

    return { pushed, failed, errors };
  }

  async syncFromGitHub(
    owner: string,
    repo: string,
    path: string = ""
  ): Promise<Array<{ path: string; content: string; type: "file" | "dir" }>> {
    const allFiles: Array<{ path: string; content: string; type: "file" | "dir" }> = [];

    async function fetchRecursive(currentPath: string): Promise<void> {
      const contents = await this.fetch(`/repos/${owner}/${repo}/contents/${currentPath}`);
      const items = Array.isArray(contents) ? contents : [contents];

      for (const item of items) {
        if (item.type === "file") {
          // Re-fetch file to get base64 content with auth (works for private repos)
          const fileObj = await this.fetch(`/repos/${owner}/${repo}/contents/${item.path}`);
          const base64 = fileObj.content as string | undefined;
          const encoding = fileObj.encoding as string | undefined;
          if (base64 && encoding === "base64") {
            const bytes = Uint8Array.from(atob(base64.replace(/\n/g, "")), c => c.charCodeAt(0));
            const content = new TextDecoder().decode(bytes);
            allFiles.push({ path: item.path, content, type: "file" });
          }
        } else if (item.type === "dir") {
          await fetchRecursive.call(this, item.path);
        }
      }
    }

    await fetchRecursive.call(this, path);
    return allFiles;
  }

  async getRepoInfo(owner: string, repo: string) {
    return this.fetch(`/repos/${owner}/${repo}`);
  }
}
