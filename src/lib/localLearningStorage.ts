/**
 * Local Learning Storage - Always-on learning system with localStorage fallback
 * Ensures AI learns even without Supabase configuration
 */

import { TaskHistory, CodePattern, DecisionLog } from './supabaseService';
import { safeStorage } from './safeStorage';

export interface LocalPattern extends CodePattern {
  lastUsed?: string;
  userFeedback?: 'positive' | 'negative' | 'neutral';
}

export interface LocalTaskHistory extends TaskHistory {
  userRating?: number;
  notes?: string;
}

export class LocalLearningStorage {
  private static readonly TASKS_KEY = 'ai_task_history';
  private static readonly PATTERNS_KEY = 'ai_code_patterns';
  private static readonly DECISIONS_KEY = 'ai_decisions';
  private static readonly INSIGHTS_KEY = 'ai_insights';
  private static readonly LEARNING_STATS_KEY = 'ai_learning_stats';

  /**
   * Save task history locally
   */
  saveTaskHistory(task: LocalTaskHistory): void {
    try {
      const tasks = this.getTaskHistory();
      tasks.unshift({
        ...task,
        id: task.id || Date.now().toString(),
        created_at: task.created_at || new Date().toISOString()
      });
      
      // Keep only last 100 tasks
      const limited = tasks.slice(0, 100);
      safeStorage.setJSON(LocalLearningStorage.TASKS_KEY, limited, { useBackup: true });
      
      this.updateLearningStats('tasksCompleted', 1);
      if (task.success) {
        this.updateLearningStats('successfulTasks', 1);
      }
    } catch (error) {
      console.error('Failed to save task history locally:', error);
    }
  }

  /**
   * Get task history from local storage
   */
  getTaskHistory(limit?: number): LocalTaskHistory[] {
    try {
      const tasks = safeStorage.getJSON<LocalTaskHistory[]>(LocalLearningStorage.TASKS_KEY, [], { useBackup: true });
      return limit ? tasks.slice(0, limit) : tasks;
    } catch (error) {
      console.error('Failed to get task history:', error);
      return [];
    }
  }

  /**
   * Find similar tasks using keyword matching
   */
  getSimilarTasks(description: string, limit: number = 5): LocalTaskHistory[] {
    const allTasks = this.getTaskHistory();
    const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    const scored = allTasks.map(task => {
      const taskText = task.task_description.toLowerCase();
      const matches = keywords.filter(kw => taskText.includes(kw)).length;
      return { task, score: matches };
    });
    
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.task);
  }

  /**
   * Save code pattern locally
   */
  saveCodePattern(pattern: LocalPattern): void {
    try {
      const patterns = this.getCodePatterns();
      
      // Check if pattern already exists
      const existingIndex = patterns.findIndex(p => 
        p.pattern_name === pattern.pattern_name && p.pattern_type === pattern.pattern_type
      );
      
      if (existingIndex >= 0) {
        // Update existing pattern
        patterns[existingIndex] = {
          ...patterns[existingIndex],
          ...pattern,
          times_used: (patterns[existingIndex].times_used || 0) + 1,
          lastUsed: new Date().toISOString()
        };
      } else {
        // Add new pattern
        patterns.push({
          ...pattern,
          id: pattern.id || Date.now().toString(),
          created_at: pattern.created_at || new Date().toISOString(),
          lastUsed: new Date().toISOString()
        });
      }
      
      // Keep only top 200 patterns by success rate and usage
      const sorted = patterns.sort((a, b) => {
        const scoreA = (a.success_rate * 0.7) + ((a.times_used || 0) * 0.3 / 100);
        const scoreB = (b.success_rate * 0.7) + ((b.times_used || 0) * 0.3 / 100);
        return scoreB - scoreA;
      });
      
      safeStorage.setJSON(LocalLearningStorage.PATTERNS_KEY, sorted.slice(0, 200), { useBackup: true });
      this.updateLearningStats('patternsLearned', 1);
    } catch (error) {
      console.error('Failed to save code pattern:', error);
    }
  }

  /**
   * Get code patterns from local storage
   */
  getCodePatterns(patternType?: string): LocalPattern[] {
    try {
      let patterns = safeStorage.getJSON<LocalPattern[]>(LocalLearningStorage.PATTERNS_KEY, [], { useBackup: true });
      
      if (patternType) {
        patterns = patterns.filter(p => p.pattern_type === patternType);
      }
      
      return patterns.sort((a, b) => b.success_rate - a.success_rate);
    } catch (error) {
      console.error('Failed to get code patterns:', error);
      return [];
    }
  }

  /**
   * Get most successful patterns
   */
  getMostSuccessfulPatterns(limit: number = 10): LocalPattern[] {
    const patterns = this.getCodePatterns();
    return patterns
      .filter(p => (p.times_used || 0) > 1)
      .sort((a, b) => {
        // Score based on success rate and usage
        const scoreA = (a.success_rate * 0.8) + ((a.times_used || 0) * 0.2 / 100);
        const scoreB = (b.success_rate * 0.8) + ((b.times_used || 0) * 0.2 / 100);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Update pattern usage statistics
   */
  updatePatternUsage(patternName: string, success: boolean): void {
    const patterns = this.getCodePatterns();
    const pattern = patterns.find(p => p.pattern_name === patternName);
    
    if (pattern) {
      const timesUsed = (pattern.times_used || 0) + 1;
      const successRate = success 
        ? ((pattern.success_rate * (pattern.times_used || 0)) + 1) / timesUsed
        : (pattern.success_rate * (pattern.times_used || 0)) / timesUsed;
      
      pattern.times_used = timesUsed;
      pattern.success_rate = successRate;
      pattern.lastUsed = new Date().toISOString();
      
      this.saveCodePattern(pattern);
    }
  }

  /**
   * Log AI decision
   */
  logDecision(decision: DecisionLog): void {
    try {
      const decisions = this.getDecisions();
      decisions.unshift({
        ...decision,
        id: decision.id || Date.now().toString(),
        created_at: decision.created_at || new Date().toISOString()
      });
      
      // Keep only last 500 decisions
      safeStorage.setJSON(LocalLearningStorage.DECISIONS_KEY, decisions.slice(0, 500), { useBackup: true });
      this.updateLearningStats('decisionsMade', 1);
    } catch (error) {
      console.error('Failed to log decision:', error);
    }
  }

  /**
   * Get all decisions
   */
  getDecisions(taskId?: string): DecisionLog[] {
    try {
      let decisions = safeStorage.getJSON<DecisionLog[]>(LocalLearningStorage.DECISIONS_KEY, [], { useBackup: true });
      
      if (taskId) {
        decisions = decisions.filter(d => d.task_id === taskId);
      }
      
      return decisions;
    } catch (error) {
      console.error('Failed to get decisions:', error);
      return [];
    }
  }

  /**
   * Calculate success rate
   */
  getSuccessRate(): number {
    const tasks = this.getTaskHistory();
    if (tasks.length === 0) return 0;
    
    const successful = tasks.filter(t => t.success).length;
    return successful / tasks.length;
  }

  /**
   * Save insights for display
   */
  saveInsights(insights: string[]): void {
    try {
      safeStorage.setJSON(LocalLearningStorage.INSIGHTS_KEY, insights, { useBackup: true });
    } catch (error) {
      console.error('Failed to save insights:', error);
    }
  }

  /**
   * Get saved insights
   */
  getInsights(): string[] {
    try {
      return safeStorage.getJSON<string[]>(LocalLearningStorage.INSIGHTS_KEY, [], { useBackup: true });
    } catch (error) {
      return [];
    }
  }

  /**
   * Update learning statistics
   */
  private updateLearningStats(key: string, increment: number): void {
    try {
      const stats = safeStorage.getJSON<any>(LocalLearningStorage.LEARNING_STATS_KEY, {}, { useBackup: true });
      
      stats[key] = (stats[key] || 0) + increment;
      stats.lastUpdate = new Date().toISOString();
      
      safeStorage.setJSON(LocalLearningStorage.LEARNING_STATS_KEY, stats, { useBackup: true });
    } catch (error) {
      console.error('Failed to update learning stats:', error);
    }
  }

  /**
   * Get learning statistics
   */
  getLearningStats(): {
    tasksCompleted: number;
    successfulTasks: number;
    patternsLearned: number;
    decisionsMade: number;
    lastUpdate: string;
  } {
    const defaultStats = {
      tasksCompleted: 0,
      successfulTasks: 0,
      patternsLearned: 0,
      decisionsMade: 0,
      lastUpdate: new Date().toISOString()
    };
    
    try {
      return safeStorage.getJSON(LocalLearningStorage.LEARNING_STATS_KEY, defaultStats, { useBackup: true });
    } catch (error) {
      return defaultStats;
    }
  }

  /**
   * Export all learning data for backup
   */
  exportLearningData(): {
    tasks: LocalTaskHistory[];
    patterns: LocalPattern[];
    decisions: DecisionLog[];
    stats: any;
  } {
    return {
      tasks: this.getTaskHistory(),
      patterns: this.getCodePatterns(),
      decisions: this.getDecisions(),
      stats: this.getLearningStats()
    };
  }

  /**
   * Import learning data from backup
   */
  importLearningData(data: {
    tasks?: LocalTaskHistory[];
    patterns?: LocalPattern[];
    decisions?: DecisionLog[];
  }): void {
    try {
      if (data.tasks) {
        safeStorage.setJSON(LocalLearningStorage.TASKS_KEY, data.tasks, { useBackup: true });
      }
      if (data.patterns) {
        safeStorage.setJSON(LocalLearningStorage.PATTERNS_KEY, data.patterns, { useBackup: true });
      }
      if (data.decisions) {
        safeStorage.setJSON(LocalLearningStorage.DECISIONS_KEY, data.decisions, { useBackup: true });
      }
    } catch (error) {
      console.error('Failed to import learning data:', error);
    }
  }

  /**
   * Clear all learning data (use with caution)
   */
  clearAllData(): void {
    localStorage.removeItem(LocalLearningStorage.TASKS_KEY);
    localStorage.removeItem(LocalLearningStorage.PATTERNS_KEY);
    localStorage.removeItem(LocalLearningStorage.DECISIONS_KEY);
    localStorage.removeItem(LocalLearningStorage.INSIGHTS_KEY);
    localStorage.removeItem(LocalLearningStorage.LEARNING_STATS_KEY);
  }
}

// Export lazy singleton instance to avoid blocking module loading
let _localLearning: LocalLearningStorage | null = null;

function getLocalLearning(): LocalLearningStorage {
  if (!_localLearning) {
    try {
      _localLearning = new LocalLearningStorage();
    } catch (error) {
      console.error('[ACW LocalStorage] Failed to initialize:', error);
      _localLearning = new LocalLearningStorage(); // Try again
    }
  }
  return _localLearning;
}

export const localLearning = new Proxy({} as LocalLearningStorage, {
  get(target, prop) {
    const storage = getLocalLearning();
    const value = (storage as any)[prop];
    return typeof value === 'function' ? value.bind(storage) : value;
  }
});
