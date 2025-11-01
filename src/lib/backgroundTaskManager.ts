/**
 * Background Task Manager with Service Worker
 * Allows tasks to continue running even when window is closed/minimized
 */

export interface BackgroundTask {
  id: string;
  type: 'code_generation' | 'analysis' | 'github_sync' | 'learning';
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  data: any;
  result?: any;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

class BackgroundTaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private worker: Worker | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private listeners: Map<string, Set<(task: BackgroundTask) => void>> = new Map();

  constructor() {
    this.init();
  }

  private async init() {
    // Initialize IndexedDB for persistent task storage
    await this.initDB();

    // Load existing tasks
    await this.loadTasks();

    // Register Service Worker for background execution
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('? Service Worker registered for background tasks');

        // Listen for messages from Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'task_update') {
            this.handleTaskUpdate(event.data.task);
          }
        });
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
      }
    }

    // Create Web Worker for heavy computation
    try {
      this.worker = new Worker(new URL('../workers/task.worker.ts', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (event) => {
        if (event.data.type === 'task_complete') {
          this.handleTaskComplete(event.data.taskId, event.data.result);
        } else if (event.data.type === 'task_error') {
          this.handleTaskError(event.data.taskId, event.data.error);
        } else if (event.data.type === 'task_progress') {
          this.handleTaskProgress(event.data.taskId, event.data.progress);
        }
      };
    } catch (error) {
      console.warn('Web Worker creation failed:', error);
    }

    // Process queued tasks on startup
    this.processQueue();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackgroundTasks', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
      };
    });
  }

  private async loadTasks(): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const tasks = request.result as BackgroundTask[];
        tasks.forEach(task => {
          this.tasks.set(task.id, task);
        });
        console.log(`?? Loaded ${tasks.length} persisted tasks`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BackgroundTasks', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async saveTask(task: BackgroundTask): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    store.put(task);
  }

  /**
   * Queue a new background task
   */
  async queueTask(
    type: BackgroundTask['type'],
    data: any
  ): Promise<string> {
    const task: BackgroundTask = {
      id: crypto.randomUUID(),
      type,
      status: 'queued',
      progress: 0,
      data,
      createdAt: Date.now()
    };

    this.tasks.set(task.id, task);
    await this.saveTask(task);

    console.log(`?? Task queued: ${task.id} (${type})`);

    // Start processing immediately
    this.processQueue();

    return task.id;
  }

  /**
   * Process queued tasks
   */
  private async processQueue() {
    const queued = Array.from(this.tasks.values()).filter(
      t => t.status === 'queued'
    );

    if (queued.length === 0) return;

    console.log(`?? Processing ${queued.length} queued tasks`);

    // Process tasks in parallel (max 3 at a time)
    const MAX_CONCURRENT = 3;
    const running = Array.from(this.tasks.values()).filter(
      t => t.status === 'running'
    ).length;

    const available = MAX_CONCURRENT - running;
    const toProcess = queued.slice(0, available);

    for (const task of toProcess) {
      this.executeTask(task.id);
    }
  }

  /**
   * Execute a task
   */
  private async executeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'running';
    task.startedAt = Date.now();
    await this.saveTask(task);
    this.notifyListeners(taskId, task);

    console.log(`?? Executing task: ${taskId} (${task.type})`);

    try {
      // If we have a Web Worker, use it
      if (this.worker) {
        this.worker.postMessage({
          type: 'execute_task',
          task
        });
      } else {
        // Fallback to direct execution
        await this.executeTaskDirect(task);
      }
    } catch (error) {
      this.handleTaskError(taskId, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Direct task execution (fallback)
   */
  private async executeTaskDirect(task: BackgroundTask) {
    // Import services dynamically to avoid circular dependencies
    const { AIService } = await import('./aiService');
    const { GitHubService } = await import('./githubService');

    switch (task.type) {
      case 'code_generation':
        const aiService = new AIService(task.data.model);
        const code = await aiService.generateCode(task.data.prompt, task.data.context);
        this.handleTaskComplete(task.id, { code });
        break;

      case 'analysis':
        const analysisService = new AIService();
        const analysis = await analysisService.analyzeTask(task.data.task);
        this.handleTaskComplete(task.id, analysis);
        break;

      case 'github_sync':
        const githubService = new GitHubService(task.data.token);
        const result = await githubService.syncToGitHub(
          task.data.owner,
          task.data.repo,
          task.data.files,
          task.data.commitMessage
        );
        this.handleTaskComplete(task.id, result);
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private handleTaskUpdate(task: BackgroundTask) {
    this.tasks.set(task.id, task);
    this.saveTask(task);
    this.notifyListeners(task.id, task);
  }

  private handleTaskComplete(taskId: string, result: any) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress = 100;
    task.result = result;
    task.completedAt = Date.now();

    this.saveTask(task);
    this.notifyListeners(taskId, task);

    console.log(`? Task completed: ${taskId}`);

    // Process next queued task
    this.processQueue();
  }

  private handleTaskError(taskId: string, error: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = error;
    task.completedAt = Date.now();

    this.saveTask(task);
    this.notifyListeners(taskId, task);

    console.error(`? Task failed: ${taskId}`, error);

    // Process next queued task
    this.processQueue();
  }

  private handleTaskProgress(taskId: string, progress: number) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = progress;
    this.saveTask(task);
    this.notifyListeners(taskId, task);
  }

  /**
   * Subscribe to task updates
   */
  subscribe(taskId: string, callback: (task: BackgroundTask) => void): () => void {
    if (!this.listeners.has(taskId)) {
      this.listeners.set(taskId, new Set());
    }
    this.listeners.get(taskId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(taskId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private notifyListeners(taskId: string, task: BackgroundTask) {
    const listeners = this.listeners.get(taskId);
    if (listeners) {
      listeners.forEach(callback => callback(task));
    }
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values()).filter(
      t => t.status === 'queued' || t.status === 'running'
    );
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (task.status === 'running') {
      // Send cancel message to worker
      if (this.worker) {
        this.worker.postMessage({
          type: 'cancel_task',
          taskId
        });
      }
    }

    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = Date.now();

    await this.saveTask(task);
    this.notifyListeners(taskId, task);
  }

  /**
   * Clear completed tasks
   */
  async clearCompleted() {
    const completed = Array.from(this.tasks.values()).filter(
      t => t.status === 'completed' || t.status === 'failed'
    );

    const db = await this.openDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');

    for (const task of completed) {
      store.delete(task.id);
      this.tasks.delete(task.id);
      this.listeners.delete(task.id);
    }

    console.log(`??? Cleared ${completed.length} completed tasks`);
  }
}

export const backgroundTaskManager = new BackgroundTaskManager();
