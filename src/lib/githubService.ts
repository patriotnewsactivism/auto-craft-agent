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
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    const body: { message: string; content: string; sha?: string } = {
      message,
      content: encodedContent,
    };
    if (sha) body.sha = sha;

    return this.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async getFileSha(owner: string, repo: string, path: string): Promise<string | undefined> {
    try {
      const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      if (response.status === 404) return undefined;
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      const content = await response.json();
      return content.sha as string | undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
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
  ): Promise<{ pushed: string[]; failed: string[] }> {
    const pushed: string[] = [];
    const failed: string[] = [];

    for (const file of files) {
      try {
        const sha = await this.getFileSha(owner, repo, file.path);
        await this.createOrUpdateFile(owner, repo, file.path, file.content, commitMessage, sha);
        pushed.push(file.path);
      } catch (error) {
        console.error(`Failed to sync ${file.path}:`, error);
        failed.push(file.path);
      }
    }

    return { pushed, failed };
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
