/**
 * Unified Learning Service - Always-on learning that works with or without Supabase
 * Automatically syncs between local storage and Supabase when available
 */

import { supabaseService, TaskHistory, CodePattern, DecisionLog } from './supabaseService';
import { localLearning, LocalTaskHistory, LocalPattern } from './localLearningStorage';
import { logger } from './logger';

export class UnifiedLearningService {
  private useSupabase: boolean = false;
  private syncInProgress: boolean = false;

  constructor() {
    try {
      this.useSupabase = supabaseService.isReady();
      
      // Start background sync if Supabase is available
      if (this.useSupabase) {
        this.startBackgroundSync();
      }
      
      logger.info('Learning', `Learning service initialized - ${this.useSupabase ? 'Supabase + Local' : 'Local only'}`);
    } catch (error) {
      logger.error('Learning', 'Failed to initialize learning service', String(error));
      this.useSupabase = false; // Fallback to local only
    }
  }

  /**
   * Check if learning is ready (always true now!)
   */
  isReady(): boolean {
    return true; // Always ready with local storage fallback
  }

  /**
   * Save task history to both local and Supabase
   */
  async saveTaskHistory(task: TaskHistory): Promise<void> {
    // Always save locally first (immediate)
    localLearning.saveTaskHistory(task as LocalTaskHistory);
    logger.debug('Learning', 'Task saved to local storage');
    
    // Also save to Supabase if available (async, non-blocking)
    if (this.useSupabase) {
      try {
        await supabaseService.saveTaskHistory(task);
        logger.debug('Learning', 'Task synced to Supabase');
      } catch (error) {
        logger.warning('Learning', 'Failed to sync task to Supabase, keeping local copy');
      }
    }
  }

  /**
   * Get task history (prefers Supabase, falls back to local)
   */
  async getTaskHistory(limit: number = 50): Promise<TaskHistory[]> {
    if (this.useSupabase) {
      try {
        const tasks = await supabaseService.getTaskHistory(limit);
        if (tasks.length > 0) {
          logger.debug('Learning', `Retrieved ${tasks.length} tasks from Supabase`);
          return tasks;
        }
      } catch (error) {
        logger.warning('Learning', 'Supabase query failed, using local storage');
      }
    }
    
    const localTasks = localLearning.getTaskHistory(limit);
    logger.debug('Learning', `Retrieved ${localTasks.length} tasks from local storage`);
    return localTasks;
  }

  /**
   * Get similar tasks
   */
  async getSimilarTasks(description: string, limit: number = 5): Promise<TaskHistory[]> {
    if (this.useSupabase) {
      try {
        const tasks = await supabaseService.getSimilarTasks(description, limit);
        if (tasks.length > 0) return tasks;
      } catch (error) {
        logger.warning('Learning', 'Supabase similarity search failed, using local');
      }
    }
    
    return localLearning.getSimilarTasks(description, limit);
  }

  /**
   * Save code pattern
   */
  async saveCodePattern(pattern: CodePattern): Promise<void> {
    // Always save locally
    localLearning.saveCodePattern(pattern as LocalPattern);
    logger.debug('Learning', `Pattern '${pattern.pattern_name}' saved locally`);
    
    // Sync to Supabase if available
    if (this.useSupabase) {
      try {
        await supabaseService.saveCodePattern(pattern);
        logger.debug('Learning', `Pattern '${pattern.pattern_name}' synced to Supabase`);
      } catch (error) {
        logger.warning('Learning', 'Failed to sync pattern to Supabase');
      }
    }
  }

  /**
   * Get code patterns
   */
  async getCodePatterns(patternType?: string): Promise<CodePattern[]> {
    if (this.useSupabase) {
      try {
        const patterns = await supabaseService.getCodePatterns(patternType);
        if (patterns.length > 0) {
          logger.debug('Learning', `Retrieved ${patterns.length} patterns from Supabase`);
          return patterns;
        }
      } catch (error) {
        logger.warning('Learning', 'Supabase pattern query failed, using local');
      }
    }
    
    const localPatterns = localLearning.getCodePatterns(patternType);
    logger.debug('Learning', `Retrieved ${localPatterns.length} patterns from local storage`);
    return localPatterns;
  }

  /**
   * Get most successful patterns
   */
  async getMostSuccessfulPatterns(limit: number = 10): Promise<CodePattern[]> {
    if (this.useSupabase) {
      try {
        const patterns = await supabaseService.getMostSuccessfulPatterns(limit);
        if (patterns.length > 0) return patterns;
      } catch (error) {
        logger.warning('Learning', 'Supabase successful patterns query failed, using local');
      }
    }
    
    return localLearning.getMostSuccessfulPatterns(limit);
  }

  /**
   * Update pattern usage
   */
  async updatePatternUsage(patternId: string, patternName: string, success: boolean): Promise<void> {
    localLearning.updatePatternUsage(patternName, success);
    
    if (this.useSupabase) {
      try {
        await supabaseService.updatePatternUsage(patternId, success);
      } catch (error) {
        logger.warning('Learning', 'Failed to update pattern usage in Supabase');
      }
    }
  }

  /**
   * Log decision
   */
  async logDecision(decision: DecisionLog): Promise<void> {
    localLearning.logDecision(decision);
    
    if (this.useSupabase) {
      try {
        await supabaseService.logDecision(decision);
      } catch (error) {
        logger.warning('Learning', 'Failed to log decision to Supabase');
      }
    }
  }

  /**
   * Get success rate
   */
  async getSuccessRate(): Promise<number> {
    if (this.useSupabase) {
      try {
        const rate = await supabaseService.getSuccessRate();
        if (rate > 0) return rate;
      } catch (error) {
        logger.warning('Learning', 'Supabase success rate query failed, using local');
      }
    }
    
    return localLearning.getSuccessRate();
  }

  /**
   * Get learning statistics
   */
  getLearningStats() {
    try {
      return localLearning.getLearningStats();
    } catch (error) {
      logger.error('Learning', 'Failed to get learning stats', String(error));
      // Return safe defaults
      return {
        tasksCompleted: 0,
        patternsLearned: 0,
        decisionsMade: 0,
        successRate: 0
      };
    }
  }

  /**
   * Background sync from local to Supabase
   */
  private startBackgroundSync(): void {
    // Sync every 5 minutes
    setInterval(() => {
      this.syncLocalToSupabase();
    }, 5 * 60 * 1000);
    
    logger.info('Learning', 'Background sync to Supabase enabled (every 5 minutes)');
  }

  /**
   * Manually sync local data to Supabase
   */
  async syncLocalToSupabase(): Promise<void> {
    if (!this.useSupabase || this.syncInProgress) return;
    
    this.syncInProgress = true;
    logger.info('Learning', 'Starting sync from local to Supabase...');
    
    try {
      // Sync tasks
      const localTasks = localLearning.getTaskHistory(50);
      const supabaseTasks = await supabaseService.getTaskHistory(50);
      const supabaseTaskIds = new Set(supabaseTasks.map(t => t.id));
      
      for (const task of localTasks) {
        if (task.id && !supabaseTaskIds.has(task.id)) {
          await supabaseService.saveTaskHistory(task);
        }
      }
      
      // Sync patterns
      const localPatterns = localLearning.getCodePatterns();
      const supabasePatterns = await supabaseService.getCodePatterns();
      const supabasePatternNames = new Set(
        supabasePatterns.map(p => `${p.pattern_name}:${p.pattern_type}`)
      );
      
      for (const pattern of localPatterns) {
        const key = `${pattern.pattern_name}:${pattern.pattern_type}`;
        if (!supabasePatternNames.has(key)) {
          await supabaseService.saveCodePattern(pattern);
        }
      }
      
      logger.success('Learning', 'Local data synced to Supabase successfully');
    } catch (error) {
      logger.logError('Learning', error, 'Failed to sync local data to Supabase');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Export all learning data
   */
  exportAllData() {
    return localLearning.exportLearningData();
  }

  /**
   * Import learning data
   */
  importData(data: any) {
    localLearning.importLearningData(data);
  }
}

// Export lazy singleton instance to avoid blocking module loading
let _unifiedLearning: UnifiedLearningService | null = null;

export const unifiedLearning = new Proxy({} as UnifiedLearningService, {
  get(target, prop) {
    if (!_unifiedLearning) {
      try {
        _unifiedLearning = new UnifiedLearningService();
      } catch (error) {
        console.error('[ACW Learning] Failed to initialize learning service:', error);
        // Return safe fallback methods
        return () => Promise.resolve([]);
      }
    }
    const value = (_unifiedLearning as any)[prop];
    return typeof value === 'function' ? value.bind(_unifiedLearning) : value;
  }
});
