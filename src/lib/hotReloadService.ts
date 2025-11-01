import { logger } from './logger';
import { VirtualFileSystem } from './virtualFileSystem';

/**
 * Hot Module Reloading Service
 * Provides instant updates without full page refresh, preserving application state
 */

export interface HMRModule {
  id: string;
  path: string;
  dependencies: string[];
  acceptCallback?: (module: any) => void;
  disposeCallback?: (data: any) => void;
  data: any;
}

export interface HMRUpdate {
  type: 'update' | 'remove' | 'error';
  path: string;
  code?: string;
  error?: Error;
  timestamp: number;
}

export class HotReloadService {
  private vfs: VirtualFileSystem;
  private modules: Map<string, HMRModule>;
  private moduleCache: Map<string, any>;
  private updateQueue: HMRUpdate[];
  private isProcessing: boolean = false;
  private watchers: Set<(update: HMRUpdate) => void>;
  private viteHMR: any = null;

  constructor(vfs: VirtualFileSystem) {
    this.vfs = vfs;
    this.modules = new Map();
    this.moduleCache = new Map();
    this.updateQueue = [];
    this.watchers = new Set();

    // Check if Vite HMR is available
    if (import.meta.hot) {
      this.viteHMR = import.meta.hot;
      this.setupViteHMR();
    }

    this.setupFileWatcher();
  }

  /**
   * Set up Vite HMR integration
   */
  private setupViteHMR(): void {
    if (!this.viteHMR) return;

    this.viteHMR.on('vite:beforeUpdate', (payload: any) => {
      logger.debug('HMR', 'Vite update received', payload);
    });

    this.viteHMR.on('vite:error', (payload: any) => {
      logger.error('HMR', 'Vite HMR error', payload);
      this.notifyWatchers({
        type: 'error',
        path: payload.err?.id || 'unknown',
        error: payload.err,
        timestamp: Date.now(),
      });
    });

    logger.info('HMR', 'Vite HMR integration active');
  }

  /**
   * Set up file watcher for virtual file system
   */
  private setupFileWatcher(): void {
    // Watch all files in VFS
    this.vfs.watch('**/*', async (file) => {
      logger.debug('HMR', 'File changed', file.path);
      
      // Queue update
      this.queueUpdate({
        type: 'update',
        path: file.path,
        code: file.content,
        timestamp: Date.now(),
      });
    });

    logger.info('HMR', 'File watcher initialized');
  }

  /**
   * Register a module for HMR
   */
  register(path: string, dependencies: string[] = []): HMRModule {
    const module: HMRModule = {
      id: this.generateModuleId(path),
      path,
      dependencies,
      data: {},
    };

    this.modules.set(path, module);
    logger.debug('HMR', 'Module registered', path);

    return module;
  }

  /**
   * Accept updates for a module
   */
  accept(path: string, callback?: (module: any) => void): void {
    const module = this.modules.get(path);
    if (module) {
      module.acceptCallback = callback;
      logger.debug('HMR', 'Module accepts updates', path);
    }
  }

  /**
   * Dispose callback for module cleanup
   */
  dispose(path: string, callback: (data: any) => void): void {
    const module = this.modules.get(path);
    if (module) {
      module.disposeCallback = callback;
      logger.debug('HMR', 'Module dispose registered', path);
    }
  }

  /**
   * Queue an HMR update
   */
  private queueUpdate(update: HMRUpdate): void {
    this.updateQueue.push(update);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Process update queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift()!;
        await this.processUpdate(update);
      }
    } catch (error) {
      logger.error('HMR', 'Queue processing error', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single update
   */
  private async processUpdate(update: HMRUpdate): Promise<void> {
    try {
      const module = this.modules.get(update.path);

      if (!module) {
        logger.debug('HMR', 'Module not registered, skipping', update.path);
        return;
      }

      logger.info('HMR', `Processing ${update.type} for`, update.path);

      switch (update.type) {
        case 'update':
          await this.handleUpdate(module, update);
          break;
        case 'remove':
          await this.handleRemove(module);
          break;
        case 'error':
          await this.handleError(update);
          break;
      }

      // Notify watchers
      this.notifyWatchers(update);

    } catch (error) {
      logger.error('HMR', 'Update processing error', error);
      this.notifyWatchers({
        type: 'error',
        path: update.path,
        error: error as Error,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle module update
   */
  private async handleUpdate(module: HMRModule, update: HMRUpdate): Promise<void> {
    // Call dispose callback if exists
    if (module.disposeCallback) {
      const disposeData = {};
      module.disposeCallback(disposeData);
      module.data = disposeData;
    }

    // Invalidate module cache
    this.moduleCache.delete(module.path);

    // Re-evaluate module with new code
    if (update.code) {
      try {
        const newModule = await this.evaluateModule(module.path, update.code);
        this.moduleCache.set(module.path, newModule);

        // Call accept callback if exists
        if (module.acceptCallback) {
          module.acceptCallback(newModule);
        }

        logger.info('HMR', 'Module updated successfully', module.path);

        // Update dependent modules
        await this.updateDependents(module.path);

      } catch (error) {
        logger.error('HMR', 'Module evaluation error', error);
        throw error;
      }
    }
  }

  /**
   * Handle module removal
   */
  private async handleRemove(module: HMRModule): Promise<void> {
    // Call dispose callback
    if (module.disposeCallback) {
      module.disposeCallback(module.data);
    }

    // Remove from caches
    this.modules.delete(module.path);
    this.moduleCache.delete(module.path);

    logger.info('HMR', 'Module removed', module.path);
  }

  /**
   * Handle error
   */
  private async handleError(update: HMRUpdate): Promise<void> {
    logger.error('HMR', 'Module error', update.error);
    
    // Could show error overlay here
    this.showErrorOverlay(update.path, update.error);
  }

  /**
   * Evaluate module code
   */
  private async evaluateModule(path: string, code: string): Promise<any> {
    try {
      // Create a safe evaluation context
      const moduleExports: any = {};
      const moduleObj = { exports: moduleExports };

      // Wrap in function to create module scope
      const wrappedCode = `
        (function(module, exports, require) {
          ${code}
          return module.exports;
        })
      `;

      // Create function
      const moduleFunction = new Function('return ' + wrappedCode)();

      // Mock require function
      const require = (id: string) => {
        const cached = this.moduleCache.get(id);
        if (cached) return cached;
        throw new Error(`Module not found: ${id}`);
      };

      // Execute module
      const result = moduleFunction(moduleObj, moduleExports, require);

      return result || moduleExports;

    } catch (error) {
      logger.error('HMR', 'Module evaluation failed', error);
      throw error;
    }
  }

  /**
   * Update dependent modules
   */
  private async updateDependents(path: string): Promise<void> {
    const dependents: HMRModule[] = [];

    // Find modules that depend on this one
    for (const [, module] of this.modules) {
      if (module.dependencies.includes(path)) {
        dependents.push(module);
      }
    }

    // Update each dependent
    for (const dependent of dependents) {
      const file = await this.vfs.readFile(dependent.path);
      if (file) {
        await this.handleUpdate(dependent, {
          type: 'update',
          path: dependent.path,
          code: file.content,
          timestamp: Date.now(),
        });
      }
    }

    logger.debug('HMR', `Updated ${dependents.length} dependents`);
  }

  /**
   * Generate module ID
   */
  private generateModuleId(path: string): string {
    return `hmr:${path}:${Date.now()}`;
  }

  /**
   * Show error overlay
   */
  private showErrorOverlay(path: string, error: any): void {
    // This would create a visual error overlay in the preview
    logger.error('HMR', `Error in ${path}`, error?.message || error);
    
    // Could dispatch custom event for UI to catch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hmr-error', {
        detail: { path, error },
      }));
    }
  }

  /**
   * Clear error overlay
   */
  clearErrorOverlay(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hmr-error-cleared'));
    }
  }

  /**
   * Watch for updates
   */
  watch(callback: (update: HMRUpdate) => void): () => void {
    this.watchers.add(callback);
    
    // Return unwatch function
    return () => {
      this.watchers.delete(callback);
    };
  }

  /**
   * Notify watchers
   */
  private notifyWatchers(update: HMRUpdate): void {
    this.watchers.forEach(watcher => {
      try {
        watcher(update);
      } catch (error) {
        logger.error('HMR', 'Watcher error', error);
      }
    });
  }

  /**
   * Invalidate module cache
   */
  invalidate(path: string): void {
    this.moduleCache.delete(path);
    const module = this.modules.get(path);
    
    if (module?.disposeCallback) {
      module.disposeCallback(module.data);
    }

    logger.debug('HMR', 'Module invalidated', path);
  }

  /**
   * Get module
   */
  getModule(path: string): HMRModule | undefined {
    return this.modules.get(path);
  }

  /**
   * Check if module is registered
   */
  hasModule(path: string): boolean {
    return this.modules.has(path);
  }

  /**
   * Get all registered modules
   */
  getAllModules(): HMRModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Clear all modules
   */
  clear(): void {
    // Dispose all modules
    for (const module of this.modules.values()) {
      if (module.disposeCallback) {
        module.disposeCallback(module.data);
      }
    }

    this.modules.clear();
    this.moduleCache.clear();
    this.updateQueue = [];

    logger.info('HMR', 'All modules cleared');
  }
}

// Export factory function
export const createHotReloadService = (vfs: VirtualFileSystem) => {
  return new HotReloadService(vfs);
};
