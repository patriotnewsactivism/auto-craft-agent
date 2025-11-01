import localforage from 'localforage';
import { logger } from './logger';

/**
 * Virtual File System - Replit-style
 * Stores files in IndexedDB for persistence and fast access
 */

export interface VirtualFile {
  path: string;
  content: string;
  language: string;
  lastModified: number;
  size: number;
}

export interface VirtualDirectory {
  name: string;
  path: string;
  children: (VirtualFile | VirtualDirectory)[];
  type: 'file' | 'directory';
}

export class VirtualFileSystem {
  private store: LocalForage;
  private cache: Map<string, VirtualFile>;
  private watchers: Map<string, Set<(file: VirtualFile) => void>>;

  constructor() {
    this.store = localforage.createInstance({
      name: 'code-wizard-vfs',
      storeName: 'files',
    });
    this.cache = new Map();
    this.watchers = new Map();
  }

  /**
   * Write file to virtual file system
   */
  async writeFile(path: string, content: string): Promise<void> {
    logger.debug('VFS', `Writing file: ${path}`, `Size: ${content.length} bytes`);
    
    const file: VirtualFile = {
      path,
      content,
      language: this.detectLanguage(path),
      lastModified: Date.now(),
      size: new Blob([content]).size,
    };

    // Update cache
    this.cache.set(path, file);

    // Persist to IndexedDB
    await this.store.setItem(path, file);

    // Notify watchers
    this.notifyWatchers(path, file);

    logger.success('VFS', `File written: ${path}`);
  }

  /**
   * Read file from virtual file system
   */
  async readFile(path: string): Promise<string | null> {
    logger.debug('VFS', `Reading file: ${path}`);

    // Check cache first
    if (this.cache.has(path)) {
      const file = this.cache.get(path)!;
      logger.debug('VFS', `Cache hit for: ${path}`);
      return file.content;
    }

    // Load from IndexedDB
    const file = await this.store.getItem<VirtualFile>(path);
    if (file) {
      this.cache.set(path, file);
      logger.success('VFS', `File read: ${path}`);
      return file.content;
    }

    logger.warning('VFS', `File not found: ${path}`);
    return null;
  }

  /**
   * Get file metadata
   */
  async getFile(path: string): Promise<VirtualFile | null> {
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    const file = await this.store.getItem<VirtualFile>(path);
    if (file) {
      this.cache.set(path, file);
    }
    return file;
  }

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    logger.info('VFS', `Deleting file: ${path}`);
    
    this.cache.delete(path);
    await this.store.removeItem(path);
    
    logger.success('VFS', `File deleted: ${path}`);
  }

  /**
   * List all files
   */
  async listFiles(): Promise<VirtualFile[]> {
    const files: VirtualFile[] = [];
    
    await this.store.iterate<VirtualFile, void>((file) => {
      files.push(file);
    });

    logger.debug('VFS', `Listed ${files.length} files`);
    return files;
  }

  /**
   * List files in directory
   */
  async listDirectory(dirPath: string): Promise<VirtualFile[]> {
    const allFiles = await this.listFiles();
    const normalizedPath = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
    
    return allFiles.filter(file => 
      file.path.startsWith(normalizedPath) &&
      !file.path.substring(normalizedPath.length).includes('/')
    );
  }

  /**
   * Get directory tree structure
   */
  async getDirectoryTree(): Promise<VirtualDirectory> {
    const files = await this.listFiles();
    const root: VirtualDirectory = {
      name: 'root',
      path: '/',
      children: [],
      type: 'directory',
    };

    // Build tree structure
    for (const file of files) {
      this.addFileToTree(root, file);
    }

    return root;
  }

  /**
   * Add file to directory tree
   */
  private addFileToTree(root: VirtualDirectory, file: VirtualFile): void {
    const parts = file.path.split('/').filter(p => p);
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let dir = current.children.find(
        c => c.type === 'directory' && c.name === part
      ) as VirtualDirectory;

      if (!dir) {
        dir = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          children: [],
          type: 'directory',
        };
        current.children.push(dir);
      }

      current = dir;
    }

    // Add file
    current.children.push({
      ...file,
      name: parts[parts.length - 1],
      type: 'file',
    } as any);
  }

  /**
   * Watch file for changes
   */
  watchFile(path: string, callback: (file: VirtualFile) => void): () => void {
    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }
    this.watchers.get(path)!.add(callback);

    // Return unwatch function
    return () => {
      const callbacks = this.watchers.get(path);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.watchers.delete(path);
        }
      }
    };
  }

  /**
   * Notify file watchers
   */
  private notifyWatchers(path: string, file: VirtualFile): void {
    const callbacks = this.watchers.get(path);
    if (callbacks) {
      callbacks.forEach(cb => cb(file));
    }
  }

  /**
   * Import files from array
   */
  async importFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    logger.info('VFS', `Importing ${files.length} files`);
    
    for (const file of files) {
      await this.writeFile(file.path, file.content);
    }
    
    logger.success('VFS', `Imported ${files.length} files`);
  }

  /**
   * Export all files
   */
  async exportFiles(): Promise<Array<{ path: string; content: string }>> {
    const files = await this.listFiles();
    return files.map(f => ({ path: f.path, content: f.content }));
  }

  /**
   * Clear all files
   */
  async clear(): Promise<void> {
    logger.warning('VFS', 'Clearing all files');
    
    this.cache.clear();
    await this.store.clear();
    
    logger.success('VFS', 'All files cleared');
  }

  /**
   * Get storage usage
   */
  async getStorageInfo(): Promise<{
    fileCount: number;
    totalSize: number;
    largestFile: { path: string; size: number } | null;
  }> {
    const files = await this.listFiles();
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const largestFile = files.length > 0
      ? files.reduce((largest, f) => (f.size > largest.size ? f : largest))
      : null;

    return {
      fileCount: files.length,
      totalSize,
      largestFile: largestFile ? { path: largestFile.path, size: largestFile.size } : null,
    };
  }

  /**
   * Search files by content
   */
  async searchFiles(query: string): Promise<VirtualFile[]> {
    const files = await this.listFiles();
    const lowerQuery = query.toLowerCase();
    
    return files.filter(file =>
      file.path.toLowerCase().includes(lowerQuery) ||
      file.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      java: 'java',
      rs: 'rust',
      go: 'go',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  }

  /**
   * Rename file
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    logger.info('VFS', `Renaming file: ${oldPath} -> ${newPath}`);
    
    const content = await this.readFile(oldPath);
    if (content === null) {
      throw new Error(`File not found: ${oldPath}`);
    }

    await this.writeFile(newPath, content);
    await this.deleteFile(oldPath);
    
    logger.success('VFS', `File renamed: ${oldPath} -> ${newPath}`);
  }

  /**
   * Copy file
   */
  async copyFile(srcPath: string, destPath: string): Promise<void> {
    logger.info('VFS', `Copying file: ${srcPath} -> ${destPath}`);
    
    const content = await this.readFile(srcPath);
    if (content === null) {
      throw new Error(`File not found: ${srcPath}`);
    }

    await this.writeFile(destPath, content);
    
    logger.success('VFS', `File copied: ${srcPath} -> ${destPath}`);
  }
}

// Export singleton instance
export const vfs = new VirtualFileSystem();
