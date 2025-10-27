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
    const body: {
      message: string;
      content: string;
      sha?: string;
    } = {
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
}
