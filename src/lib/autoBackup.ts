/**
 * AUTO-BACKUP SERVICE
 * 
 * Automatically backs up your work to prevent data loss:
 * - Saves to localStorage every 30 seconds
 * - Exports to ZIP automatically after major milestones
 * - Creates recovery points you can restore from
 */

import { ExportService } from './exportService';
import { backgroundTaskManager, ProjectState } from './backgroundTaskManager';

export interface BackupPoint {
  id: string;
  timestamp: number;
  description: string;
  fileCount: number;
  projectState: ProjectState;
}

export class AutoBackupService {
  private backupInterval: number | null = null;
  private backupIntervalMs: number = 30000; // 30 seconds
  private maxBackups: number = 10;

  /**
   * Start automatic backup
   */
  startAutoBackup(getCurrentState: () => ProjectState | null) {
    if (this.backupInterval) return;

    console.log('🛡️ Auto-backup enabled - Your work is safe!');
    
    this.backupInterval = window.setInterval(async () => {
      const state = getCurrentState();
      if (state && state.fileTree.length > 0) {
        await this.createBackup(state);
      }
    }, this.backupIntervalMs);

    // Also backup before page unload
    window.addEventListener('beforeunload', () => {
      const state = getCurrentState();
      if (state) {
        this.createBackupSync(state);
      }
    });
  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('🛡️ Auto-backup disabled');
    }
  }

  /**
   * Create a backup point
   */
  async createBackup(state: ProjectState): Promise<BackupPoint> {
    const backup: BackupPoint = {
      id: `backup-${Date.now()}`,
      timestamp: Date.now(),
      description: `Auto-backup at ${new Date().toLocaleTimeString()}`,
      fileCount: state.fileTree.length,
      projectState: state
    };

    // Save to localStorage
    const backups = this.getBackups();
    backups.unshift(backup);
    
    // Keep only last N backups
    const trimmedBackups = backups.slice(0, this.maxBackups);
    localStorage.setItem('auto_backups', JSON.stringify(trimmedBackups));

    // Also save to IndexedDB for larger capacity
    await backgroundTaskManager.saveProject(state);

    console.log(`💾 Auto-backup created: ${backup.fileCount} files`);
    return backup;
  }

  /**
   * Synchronous backup for page unload
   */
  private createBackupSync(state: ProjectState): void {
    try {
      const backup: BackupPoint = {
        id: `backup-${Date.now()}`,
        timestamp: Date.now(),
        description: `Emergency backup on close`,
        fileCount: state.fileTree.length,
        projectState: state
      };

      const backups = this.getBackups();
      backups.unshift(backup);
      localStorage.setItem('auto_backups', JSON.stringify(backups.slice(0, this.maxBackups)));
      console.log('💾 Emergency backup created');
    } catch (error) {
      console.error('Failed to create emergency backup:', error);
    }
  }

  /**
   * Get all backup points
   */
  getBackups(): BackupPoint[] {
    try {
      const saved = localStorage.getItem('auto_backups');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load backups:', error);
      return [];
    }
  }

  /**
   * Restore from a backup point
   */
  async restoreBackup(backupId: string): Promise<ProjectState | null> {
    const backups = this.getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (backup) {
      console.log(`🔄 Restoring backup from ${new Date(backup.timestamp).toLocaleString()}`);
      return backup.projectState;
    }
    
    return null;
  }

  /**
   * Delete a backup point
   */
  deleteBackup(backupId: string): void {
    const backups = this.getBackups();
    const filtered = backups.filter(b => b.id !== backupId);
    localStorage.setItem('auto_backups', JSON.stringify(filtered));
  }

  /**
   * Clear all backups
   */
  clearAllBackups(): void {
    localStorage.removeItem('auto_backups');
    console.log('🗑️ All backups cleared');
  }

  /**
   * Export backup to ZIP
   */
  async exportBackupToZip(backupId: string): Promise<void> {
    const backup = await this.restoreBackup(backupId);
    if (backup && backup.fileTree.length > 0) {
      const timestamp = new Date(backup.timestamp).toISOString().replace(/[:.]/g, '-');
      await ExportService.exportAsZip(backup.fileTree, `backup-${timestamp}`);
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; total: number; percentage: number } {
    let used = 0;
    
    // Calculate localStorage usage
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Most browsers have ~5-10MB localStorage limit
    const total = 10 * 1024 * 1024; // 10 MB
    const percentage = (used / total) * 100;

    return {
      used,
      total,
      percentage
    };
  }
}

// Export singleton
export const autoBackupService = new AutoBackupService();
