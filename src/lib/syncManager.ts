import { GitHubService, GitHubRepo, SyncStatus, SyncConflict } from './githubService';

export interface FileNode {
  name: string;
  type: "file" | "folder";
  children?: FileNode[];
  content?: string;
  path?: string;
  sha?: string;
}

export interface SyncManagerConfig {
  autoSyncInterval: number; // milliseconds
  conflictResolutionMode: 'manual' | 'auto-local' | 'auto-remote';
  enableRealTimeSync: boolean;
}

export class SyncManager {
  private githubService: GitHubService;
  private repo: GitHubRepo | null = null;
  private branch: string = 'main';
  private localFiles: Map<string, { content: string; sha?: string }> = new Map();
  private syncStatus: SyncStatus = {
    connected: false,
    lastSync: null,
    pendingChanges: 0,
    conflicts: [],
    currentBranch: 'main',
    status: 'synced'
  };
  private config: SyncManagerConfig = {
    autoSyncInterval: 30000, // 30 seconds
    conflictResolutionMode: 'manual',
    enableRealTimeSync: true
  };
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private progressListeners: Set<(progress: number) => void> = new Set();

  constructor(token: string, config?: Partial<SyncManagerConfig>) {
    this.githubService = new GitHubService(token);
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  // Connection Management
  async connect(repo: GitHubRepo, branch: string = 'main'): Promise<void> {
    this.repo = repo;
    this.branch = branch;
    this.syncStatus.currentBranch = branch;
    this.syncStatus.connected = true;
    
    if (this.config.enableRealTimeSync) {
      this.startAutoSync();
    }
    
    this.notifyListeners();
  }

  disconnect(): void {
    this.repo = null;
    this.branch = 'main';
    this.syncStatus = {
      connected: false,
      lastSync: null,
      pendingChanges: 0,
      conflicts: [],
      currentBranch: 'main',
      status: 'synced'
    };
    this.stopAutoSync();
    this.notifyListeners();
  }

  // File Management
  updateLocalFiles(files: FileNode[]): void {
    this.localFiles.clear();
    this.flattenFiles(files).forEach(file => {
      this.localFiles.set(file.path, { 
        content: file.content || '', 
        sha: file.sha 
      });
    });
    this.updatePendingChanges();
  }

  private flattenFiles(files: FileNode[], basePath: string = ''): Array<{ path: string; content: string; sha?: string }> {
    const result: Array<{ path: string; content: string; sha?: string }> = [];
    
    for (const file of files) {
      const filePath = basePath ? `${basePath}/${file.name}` : file.name;
      
      if (file.type === 'file' && file.content !== undefined) {
        result.push({ 
          path: filePath, 
          content: file.content, 
          sha: file.sha 
        });
      } else if (file.type === 'folder' && file.children) {
        result.push(...this.flattenFiles(file.children, filePath));
      }
    }
    
    return result;
  }

  private updatePendingChanges(): void {
    this.syncStatus.pendingChanges = this.localFiles.size;
    this.syncStatus.status = this.syncStatus.pendingChanges > 0 ? 'pending' : 'synced';
    this.notifyListeners();
  }

  // Synchronization
  async sync(forceSync: boolean = false): Promise<{ success: boolean; conflicts: SyncConflict[]; errors: string[] }> {
    if (!this.repo) {
      throw new Error('No repository connected');
    }

    this.syncStatus.status = 'pending';
    this.notifyListeners();

    try {
      const [owner, repoName] = this.repo.full_name.split('/');
      const result = await this.githubService.syncRepository(
        owner,
        repoName,
        this.localFiles,
        this.branch
      );

      this.syncStatus.lastSync = new Date();
      
      if (result.conflicts.length > 0) {
        this.syncStatus.conflicts = result.conflicts;
        this.syncStatus.status = 'conflicted';
      } else {
        this.syncStatus.conflicts = [];
        this.syncStatus.status = 'synced';
        this.syncStatus.pendingChanges = 0;
      }

      this.notifyListeners();
      return { success: true, conflicts: result.conflicts, errors: result.errors };
    } catch (error) {
      this.syncStatus.status = 'error';
      this.notifyListeners();
      throw error;
    }
  }

  async resolveConflicts(resolutions: Array<{
    conflict: SyncConflict;
    resolution: 'local' | 'remote' | 'merged';
    mergedContent?: string;
  }>): Promise<void> {
    if (!this.repo) {
      throw new Error('No repository connected');
    }

    const [owner, repoName] = this.repo.full_name.split('/');
    
    for (const { conflict, resolution, mergedContent } of resolutions) {
      const result = await this.githubService.resolveConflict(
        owner,
        repoName,
        conflict,
        resolution,
        mergedContent,
        this.branch
      );

      // Update local files based on resolution
      if (result.action === 'update') {
        this.localFiles.set(result.path, { content: result.content || '' });
      } else if (result.action === 'delete') {
        this.localFiles.delete(result.path);
      }
    }

    this.syncStatus.conflicts = [];
    this.syncStatus.status = 'synced';
    this.syncStatus.lastSync = new Date();
    this.notifyListeners();
  }

  // Auto-sync Management
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.syncStatus.connected && this.config.enableRealTimeSync) {
        try {
          await this.sync();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        }
      }
    }, this.config.autoSyncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Progress Tracking
  private notifyProgress(progress: number): void {
    this.progressListeners.forEach(listener => listener(progress));
  }

  // Event Listeners
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onProgress(listener: (progress: number) => void): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // Getters
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  getRepo(): GitHubRepo | null {
    return this.repo;
  }

  getBranch(): string {
    return this.branch;
  }

  isConnected(): boolean {
    return this.syncStatus.connected;
  }

  // Configuration
  updateConfig(config: Partial<SyncManagerConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableRealTimeSync && this.syncStatus.connected) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  getConfig(): SyncManagerConfig {
    return { ...this.config };
  }

  // Branch Management
  async switchBranch(branchName: string): Promise<void> {
    if (!this.repo) {
      throw new Error('No repository connected');
    }

    const [owner, repoName] = this.repo.full_name.split('/');
    
    // Verify branch exists
    await this.githubService.getBranch(owner, repoName, branchName);
    
    this.branch = branchName;
    this.syncStatus.currentBranch = branchName;
    this.syncStatus.lastSync = null; // Reset sync status for new branch
    
    // Trigger a sync to get the latest files from the new branch
    await this.sync();
  }

  async createBranch(branchName: string, fromBranch?: string): Promise<void> {
    if (!this.repo) {
      throw new Error('No repository connected');
    }

    const [owner, repoName] = this.repo.full_name.split('/');
    const sourceBranch = fromBranch || this.branch;
    
    // Get the SHA of the source branch
    const branchInfo = await this.githubService.getBranch(owner, repoName, sourceBranch);
    
    // Create the new branch
    await this.githubService.createBranch(owner, repoName, branchName, branchInfo.commit.sha);
    
    // Switch to the new branch
    await this.switchBranch(branchName);
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.progressListeners.clear();
  }
}