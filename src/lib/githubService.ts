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
  default_branch: string;
  clone_url: string;
  ssh_url: string;
}

export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  download_url?: string;
  content?: string;
  sha: string;
  size: number;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface SyncConflict {
  path: string;
  localContent: string;
  remoteContent: string;
  localSha?: string;
  remoteSha: string;
  type: 'content' | 'deletion' | 'creation';
}

export interface SyncStatus {
  connected: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  conflicts: SyncConflict[];
  currentBranch: string;
  status: 'synced' | 'pending' | 'conflicted' | 'error';
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
    sha?: string,
    branch: string = "main"
  ) {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));
    const body: { message: string; content: string; sha?: string; branch?: string } = {
      message,
      content: encodedContent,
      branch,
    };
    if (sha) body.sha = sha;

    return this.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return this.fetch(`/repos/${owner}/${repo}/branches`);
  }

  async createBranch(owner: string, repo: string, branchName: string, fromSha: string) {
    return this.fetch(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      }),
    });
  }

  async getBranch(owner: string, repo: string, branch: string) {
    return this.fetch(`/repos/${owner}/${repo}/branches/${branch}`);
  }

  async getCommits(owner: string, repo: string, branch: string = "main", per_page: number = 10): Promise<GitHubCommit[]> {
    return this.fetch(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=${per_page}`);
  }

  async getFileContents(owner: string, repo: string, path: string, branch: string = "main"): Promise<GitHubContent> {
    return this.fetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
  }

  async deleteFile(owner: string, repo: string, path: string, message: string, sha: string, branch: string = "main") {
    return this.fetch(`/repos/${owner}/${repo}/contents/${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        sha,
        branch,
      }),
    });
  }

  async compareCommits(owner: string, repo: string, base: string, head: string) {
    return this.fetch(`/repos/${owner}/${repo}/compare/${base}...${head}`);
  }

  async createPullRequest(owner: string, repo: string, title: string, head: string, base: string, body?: string) {
    return this.fetch(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        head,
        base,
        body: body || "",
      }),
    });
  }

  async mergePullRequest(owner: string, repo: string, pullNumber: number, commitTitle?: string, commitMessage?: string) {
    return this.fetch(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commit_title: commitTitle,
        commit_message: commitMessage,
        merge_method: "merge",
      }),
    });
  }

  // Advanced sync methods
  async syncRepository(
    owner: string,
    repo: string,
    localFiles: Map<string, { content: string; sha?: string }>,
    branch: string = "main"
  ): Promise<{ conflicts: SyncConflict[]; synced: string[]; errors: string[] }> {
    const conflicts: SyncConflict[] = [];
    const synced: string[] = [];
    const errors: string[] = [];

    try {
      // Get all remote files
      const remoteContents = await this.getRepoContentsRecursive(owner, repo, "", branch);
      const remoteFiles = new Map<string, GitHubContent>();
      
      remoteContents.forEach(file => {
        if (file.type === "file") {
          remoteFiles.set(file.path, file);
        }
      });

      // Compare local vs remote
      for (const [path, localFile] of localFiles) {
        const remoteFile = remoteFiles.get(path);
        
        if (!remoteFile) {
          // File only exists locally - create it
          try {
            await this.createOrUpdateFile(owner, repo, path, localFile.content, `Add ${path}`, undefined, branch);
            synced.push(path);
          } catch (error) {
            errors.push(`Failed to create ${path}: ${error}`);
          }
        } else {
          // File exists both locally and remotely - check for conflicts
          const remoteContent = remoteFile.download_url ? 
            await this.getFileContent(remoteFile.download_url) : "";
          
          if (remoteContent !== localFile.content) {
            if (localFile.sha && localFile.sha !== remoteFile.sha) {
              // Conflict detected
              conflicts.push({
                path,
                localContent: localFile.content,
                remoteContent,
                localSha: localFile.sha,
                remoteSha: remoteFile.sha,
                type: 'content'
              });
            } else {
              // Update remote with local changes
              try {
                await this.createOrUpdateFile(owner, repo, path, localFile.content, `Update ${path}`, remoteFile.sha, branch);
                synced.push(path);
              } catch (error) {
                errors.push(`Failed to update ${path}: ${error}`);
              }
            }
          }
        }
      }

      // Check for files that exist remotely but not locally
      for (const [path, remoteFile] of remoteFiles) {
        if (!localFiles.has(path)) {
          conflicts.push({
            path,
            localContent: "",
            remoteContent: remoteFile.download_url ? await this.getFileContent(remoteFile.download_url) : "",
            remoteSha: remoteFile.sha,
            type: 'deletion'
          });
        }
      }

    } catch (error) {
      errors.push(`Sync failed: ${error}`);
    }

    return { conflicts, synced, errors };
  }

  async resolveConflict(
    owner: string,
    repo: string,
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merged',
    mergedContent?: string,
    branch: string = "main"
  ) {
    const content = resolution === 'local' ? conflict.localContent :
                   resolution === 'remote' ? conflict.remoteContent :
                   mergedContent || conflict.localContent;

    if (conflict.type === 'deletion' && resolution === 'remote') {
      // Delete the local file (handled by caller)
      return { action: 'delete', path: conflict.path };
    }

    await this.createOrUpdateFile(
      owner,
      repo,
      conflict.path,
      content,
      `Resolve conflict in ${conflict.path}`,
      conflict.remoteSha,
      branch
    );

    return { action: 'update', path: conflict.path, content };
  }

  private async getRepoContentsRecursive(
    owner: string,
    repo: string,
    path: string = "",
    branch: string = "main"
  ): Promise<GitHubContent[]> {
    const contents = await this.fetch(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    const result: GitHubContent[] = [];

    for (const item of Array.isArray(contents) ? contents : [contents]) {
      if (item.type === "file") {
        result.push(item);
      } else if (item.type === "dir") {
        const subContents = await this.getRepoContentsRecursive(owner, repo, item.path, branch);
        result.push(...subContents);
      }
    }

    return result;
  }
}
