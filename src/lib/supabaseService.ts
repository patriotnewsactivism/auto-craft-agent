import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TaskHistory {
  id?: string;
  task_description: string;
  complexity: string;
  steps_taken: string[];
  files_generated: string[];
  success: boolean;
  patterns_learned: string[];
  innovation_score: number;
  execution_time: number;
  created_at?: string;
}

export interface CodePattern {
  id?: string;
  pattern_name: string;
  pattern_type: string;
  use_cases: string[];
  code_template: string;
  success_rate: number;
  times_used: number;
  created_at?: string;
}

export interface ProjectContext {
  id?: string;
  project_name: string;
  description: string;
  current_phase: string;
  tech_stack: string[];
  file_structure: any;
  next_steps: string[];
  learnings: string[];
  updated_at?: string;
}

export interface DecisionLog {
  id?: string;
  task_id: string;
  decision_point: string;
  options_considered: string[];
  chosen_option: string;
  reasoning: string;
  outcome_success: boolean;
  created_at?: string;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  constructor() {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_key');

      if (supabaseUrl && supabaseKey) {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.isConfigured = true;
      }
    } catch (error) {
      console.error('[ACW Supabase] Failed to initialize Supabase client:', error);
      this.client = null;
      this.isConfigured = false;
    }
  }

  isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  // Task History Management
  async saveTaskHistory(task: TaskHistory): Promise<void> {
    if (!this.isReady()) return;
    
    const { error } = await this.client!
      .from('task_history')
      .insert([task]);
    
    if (error) console.error('Error saving task history:', error);
  }

  async getTaskHistory(limit: number = 50): Promise<TaskHistory[]> {
    if (!this.isReady()) return [];
    
    const { data, error } = await this.client!
      .from('task_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching task history:', error);
      return [];
    }
    
    return data || [];
  }

  async getSimilarTasks(description: string, limit: number = 5): Promise<TaskHistory[]> {
    if (!this.isReady()) return [];
    
    // Use text similarity search (requires pg_trgm extension in Supabase)
    const { data, error } = await this.client!
      .from('task_history')
      .select('*')
      .textSearch('task_description', description)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error finding similar tasks:', error);
      return [];
    }
    
    return data || [];
  }

  // Code Pattern Management
  async saveCodePattern(pattern: CodePattern): Promise<void> {
    if (!this.isReady()) return;
    
    const { error } = await this.client!
      .from('code_patterns')
      .insert([pattern]);
    
    if (error) console.error('Error saving code pattern:', error);
  }

  async getCodePatterns(patternType?: string): Promise<CodePattern[]> {
    if (!this.isReady()) return [];
    
    let query = this.client!.from('code_patterns').select('*');
    
    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }
    
    const { data, error } = await query.order('success_rate', { ascending: false });
    
    if (error) {
      console.error('Error fetching code patterns:', error);
      return [];
    }
    
    return data || [];
  }

  async updatePatternUsage(patternId: string, success: boolean): Promise<void> {
    if (!this.isReady()) return;
    
    const { data: pattern, error: fetchError } = await this.client!
      .from('code_patterns')
      .select('*')
      .eq('id', patternId)
      .single();
    
    if (fetchError || !pattern) return;
    
    const timesUsed = (pattern.times_used || 0) + 1;
    const successRate = success 
      ? ((pattern.success_rate * pattern.times_used) + 1) / timesUsed
      : (pattern.success_rate * pattern.times_used) / timesUsed;
    
    const { error } = await this.client!
      .from('code_patterns')
      .update({ times_used: timesUsed, success_rate: successRate })
      .eq('id', patternId);
    
    if (error) console.error('Error updating pattern usage:', error);
  }

  // Project Context Management
  async saveProjectContext(context: ProjectContext): Promise<void> {
    if (!this.isReady()) return;
    
    const { error } = await this.client!
      .from('project_contexts')
      .upsert([{ ...context, updated_at: new Date().toISOString() }]);
    
    if (error) console.error('Error saving project context:', error);
  }

  async getProjectContext(projectName: string): Promise<ProjectContext | null> {
    if (!this.isReady()) return null;
    
    const { data, error } = await this.client!
      .from('project_contexts')
      .select('*')
      .eq('project_name', projectName)
      .single();
    
    if (error) {
      console.error('Error fetching project context:', error);
      return null;
    }
    
    return data;
  }

  async getAllProjects(): Promise<ProjectContext[]> {
    if (!this.isReady()) return [];
    
    const { data, error } = await this.client!
      .from('project_contexts')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    
    return data || [];
  }

  // Decision Logging
  async logDecision(decision: DecisionLog): Promise<void> {
    if (!this.isReady()) return;
    
    const { error } = await this.client!
      .from('decision_logs')
      .insert([decision]);
    
    if (error) console.error('Error logging decision:', error);
  }

  async getDecisionsForTask(taskId: string): Promise<DecisionLog[]> {
    if (!this.isReady()) return [];
    
    const { data, error } = await this.client!
      .from('decision_logs')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching decisions:', error);
      return [];
    }
    
    return data || [];
  }

  // Analytics and Learning
  async getSuccessRate(): Promise<number> {
    if (!this.isReady()) return 0;
    
    const { data, error } = await this.client!
      .from('task_history')
      .select('success');
    
    if (error || !data || data.length === 0) return 0;
    
    const successful = data.filter(t => t.success).length;
    return successful / data.length;
  }

  async getMostSuccessfulPatterns(limit: number = 10): Promise<CodePattern[]> {
    if (!this.isReady()) return [];
    
    const { data, error } = await this.client!
      .from('code_patterns')
      .select('*')
      .gt('times_used', 2) // Only patterns used more than twice
      .order('success_rate', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching successful patterns:', error);
      return [];
    }
    
    return data || [];
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
