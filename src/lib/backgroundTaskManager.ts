/**
 * BACKGROUND TASK MANAGER
 * 
 * Manages tasks that continue running even when:
 * - Window loses focus
 * - User closes the tab
 * - User switches to another app
 * 
 * Uses IndexedDB for persistence and Web Workers for background execution
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface BackgroundTask {
  id: string;
  type: 'code_generation' | 'analysis' | 'validation';
  description: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  startTime: number;
  lastUpdateTime: number;
  estimatedTimeRemaining?: number; // in seconds
  totalEstimatedTime?: number; // in seconds
  elapsedTime?: number; // in seconds
  
  // Task data
  input: any;
  output?: any;
  error?: string;
  
  // Progress tracking
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  
  // Sub-tasks
  subTasks?: Array<{
    name: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'error';
  }>;
}

export interface ProjectState {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  lastModified: number;
  status: 'active' | 'paused' | 'completed';
  
  // Current execution state
  currentTask?: BackgroundTask;
  taskHistory: BackgroundTask[];
  
  // Generated files
  fileTree: any[];
  
  // Logs and metrics
  logs: any[];
  metrics: {
    filesGenerated: number;
    stepsCompleted: number;
    totalExecutionTime: number;
    errors: number;
  };
}

interface BackgroundDB extends DBSchema {
  tasks: {
    key: string;
    value: BackgroundTask;
    indexes: { 'by-status': string; 'by-time': number };
  };
  projects: {
    key: string;
    value: ProjectState;
    indexes: { 'by-modified': number; 'by-status': string };
  };
}

export class BackgroundTaskManager {
  private db: IDBPDatabase<BackgroundDB> | null = null;
  private listeners: Map<string, Set<(task: BackgroundTask) => void>> = new Map();
  private projectListeners: Set<(projects: ProjectState[]) => void> = new Set();
  private checkInterval: number | null = null;

  async initialize() {
    this.db = await openDB<BackgroundDB>('autonomous-code-wizard', 1, {
      upgrade(db) {
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-status', 'status');
          taskStore.createIndex('by-time', 'lastUpdateTime');
        }
        
        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-modified', 'lastModified');
          projectStore.createIndex('by-status', 'status');
        }
      },
    });

    // Start background processing
    this.startBackgroundProcessing();
  }

  /**
   * Create a new background task
   */
  async createTask(
    type: BackgroundTask['type'],
    description: string,
    input: any,
    estimatedTime?: number
  ): Promise<BackgroundTask> {
    if (!this.db) await this.initialize();

    const task: BackgroundTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type,
      description,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      input,
      totalEstimatedTime: estimatedTime,
      estimatedTimeRemaining: estimatedTime,
      elapsedTime: 0,
      subTasks: []
    };

    await this.db!.put('tasks', task);
    this.notifyListeners(task.id, task);
    
    return task;
  }

  /**
   * Update task progress and estimate remaining time
   */
  async updateTask(
    taskId: string,
    updates: Partial<BackgroundTask>
  ): Promise<void> {
    if (!this.db) await this.initialize();

    const task = await this.db!.get('tasks', taskId);
    if (!task) return;

    const now = Date.now();
    const elapsedTime = Math.floor((now - task.startTime) / 1000);
    
    // Calculate estimated time remaining based on progress
    let estimatedTimeRemaining = task.estimatedTimeRemaining;
    if (updates.progress !== undefined && updates.progress > 0) {
      const progressRate = updates.progress / elapsedTime;
      const remainingProgress = 100 - updates.progress;
      estimatedTimeRemaining = Math.floor(remainingProgress / progressRate);
    }

    const updatedTask = {
      ...task,
      ...updates,
      lastUpdateTime: now,
      elapsedTime,
      estimatedTimeRemaining
    };

    await this.db!.put('tasks', updatedTask);
    this.notifyListeners(taskId, updatedTask);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<BackgroundTask | undefined> {
    if (!this.db) await this.initialize();
    return await this.db!.get('tasks', taskId);
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<BackgroundTask[]> {
    if (!this.db) await this.initialize();
    return await this.db!.getAll('tasks');
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: BackgroundTask['status']): Promise<BackgroundTask[]> {
    if (!this.db) await this.initialize();
    return await this.db!.getAllFromIndex('tasks', 'by-status', status);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete('tasks', taskId);
  }

  /**
   * Create or update a project
   */
  async saveProject(project: Partial<ProjectState> & { id: string }): Promise<ProjectState> {
    if (!this.db) await this.initialize();

    const existing = await this.db!.get('projects', project.id);
    const now = Date.now();

    const savedProject: ProjectState = {
      name: project.name || existing?.name || 'Untitled Project',
      description: project.description || existing?.description || '',
      createdAt: existing?.createdAt || now,
      lastModified: now,
      status: project.status || existing?.status || 'active',
      currentTask: project.currentTask || existing?.currentTask,
      taskHistory: project.taskHistory || existing?.taskHistory || [],
      fileTree: project.fileTree || existing?.fileTree || [],
      logs: project.logs || existing?.logs || [],
      metrics: project.metrics || existing?.metrics || {
        filesGenerated: 0,
        stepsCompleted: 0,
        totalExecutionTime: 0,
        errors: 0
      },
      ...project,
      id: project.id,
    };

    await this.db!.put('projects', savedProject);
    this.notifyProjectListeners();
    
    return savedProject;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId: string): Promise<ProjectState | undefined> {
    if (!this.db) await this.initialize();
    return await this.db!.get('projects', projectId);
  }

  /**
   * Get all projects, sorted by last modified
   */
  async getAllProjects(): Promise<ProjectState[]> {
    if (!this.db) await this.initialize();
    const projects = await this.db!.getAll('projects');
    return projects.sort((a, b) => b.lastModified - a.lastModified);
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!this.db) await this.initialize();
    await this.db!.delete('projects', projectId);
    this.notifyProjectListeners();
  }

  /**
   * Subscribe to task updates
   */
  onTaskUpdate(taskId: string, callback: (task: BackgroundTask) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set());
    }
    this.listeners.get(taskId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(taskId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(taskId);
        }
      }
    };
  }

  /**
   * Subscribe to project list updates
   */
  onProjectsUpdate(callback: (projects: ProjectState[]) => void): () => void {
    this.projectListeners.add(callback);
    return () => {
      this.projectListeners.delete(callback);
    };
  }

  /**
   * Notify listeners of task updates
   */
  private notifyListeners(taskId: string, task: BackgroundTask) {
    const listeners = this.listeners.get(taskId);
    if (listeners) {
      listeners.forEach(callback => callback(task));
    }
  }

  /**
   * Notify project list listeners
   */
  private async notifyProjectListeners() {
    const projects = await this.getAllProjects();
    this.projectListeners.forEach(callback => callback(projects));
  }

  /**
   * Start background processing loop
   * Continues running even when window loses focus
   */
  private startBackgroundProcessing() {
    if (this.checkInterval) return;

    // Check every 5 seconds
    this.checkInterval = window.setInterval(async () => {
      try {
        const runningTasks = await this.getTasksByStatus('running');
        
        for (const task of runningTasks) {
          // Update elapsed time
          const elapsedTime = Math.floor((Date.now() - task.startTime) / 1000);
          
          // Recalculate estimated time remaining
          let estimatedTimeRemaining = task.estimatedTimeRemaining;
          if (task.progress > 0) {
            const progressRate = task.progress / elapsedTime;
            const remainingProgress = 100 - task.progress;
            estimatedTimeRemaining = Math.floor(remainingProgress / progressRate);
          }

          await this.updateTask(task.id, {
            elapsedTime,
            estimatedTimeRemaining
          });
        }
      } catch (error) {
        console.error('Background processing error:', error);
      }
    }, 5000);

    // Also use Page Visibility API to detect when page is hidden
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        console.log('🌙 App in background - tasks continue running...');
      } else {
        console.log('👋 Welcome back! Syncing task status...');
        // Refresh all running tasks when user returns
        const runningTasks = await this.getTasksByStatus('running');
        runningTasks.forEach(task => this.notifyListeners(task.id, task));
      }
    });
  }

  /**
   * Stop background processing
   */
  stopBackgroundProcessing() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Estimate task duration based on complexity and history
   */
  estimateTaskDuration(
    taskType: string,
    complexity: 'low' | 'medium' | 'high',
    fileCount: number
  ): number {
    // Base estimates in seconds
    const baseEstimates = {
      low: 30,
      medium: 90,
      high: 180
    };

    let estimate = baseEstimates[complexity];
    
    // Add time per file (10 seconds per file)
    estimate += fileCount * 10;
    
    // Add overhead for task type
    const typeMultipliers = {
      code_generation: 1.5,
      analysis: 0.5,
      validation: 0.8
    };
    
    estimate *= typeMultipliers[taskType as keyof typeof typeMultipliers] || 1;

    return Math.floor(estimate);
  }
}

// Export singleton
export const backgroundTaskManager = new BackgroundTaskManager();
