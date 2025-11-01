/**
 * Performance Optimization Utilities
 * Implements caching, streaming, and efficient data handling
 */

import { logger } from './logger';

/**
 * Streaming response handler for AI
 * Provides real-time feedback instead of waiting for complete response
 */
export class StreamingService {
  private decoder = new TextDecoder();

  async streamAIResponse(
    apiCall: () => Promise<Response>,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await apiCall();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = this.decoder.decode(value, { stream: true });
        onChunk(chunk);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

/**
 * Request batching and debouncing
 * Reduces API calls and improves performance
 */
export class RequestOptimizer {
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private batchQueue = new Map<string, Array<() => Promise<any>>>();
  private batchTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    delay: number = 300
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        fn(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Batch multiple requests together
   */
  async batch<T>(
    key: string,
    fn: () => Promise<T>,
    delay: number = 100
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueue.has(key)) {
        this.batchQueue.set(key, []);
      }

      this.batchQueue.get(key)!.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Clear existing timer
      const existingTimer = this.batchTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer to execute batch
      const timer = setTimeout(async () => {
        const batch = this.batchQueue.get(key) || [];
        this.batchQueue.delete(key);
        this.batchTimers.delete(key);

        // Execute all in parallel
        await Promise.all(batch.map(fn => fn()));
      }, delay);

      this.batchTimers.set(key, timer);
    });
  }
}

/**
 * Memory-efficient large file handler
 * Processes files in chunks to avoid memory issues
 */
export class ChunkProcessor {
  private chunkSize = 1024 * 1024; // 1MB chunks

  async processLargeFile(
    content: string,
    processor: (chunk: string, index: number) => Promise<void>
  ): Promise<void> {
    const totalChunks = Math.ceil(content.length / this.chunkSize);
    
    logger.info('ChunkProcessor', `Processing ${totalChunks} chunks`);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, content.length);
      const chunk = content.slice(start, end);
      
      await processor(chunk, i);
      
      // Allow UI to update between chunks
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    logger.success('ChunkProcessor', 'All chunks processed');
  }
}

/**
 * Virtual scrolling for large lists
 * Only renders visible items for better performance
 */
export class VirtualScroller {
  private itemHeight: number;
  private containerHeight: number;
  private overscan: number;

  constructor(itemHeight: number, containerHeight: number, overscan: number = 3) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
  }

  getVisibleRange(scrollTop: number, totalItems: number): { start: number; end: number; offsetY: number } {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const end = Math.min(totalItems, start + visibleCount + this.overscan * 2);
    const offsetY = start * this.itemHeight;

    return { start, end, offsetY };
  }

  getTotalHeight(totalItems: number): number {
    return totalItems * this.itemHeight;
  }
}

/**
 * Code splitting helper
 * Dynamically imports components only when needed
 */
export class LazyLoader {
  private cache = new Map<string, Promise<any>>();

  async loadComponent<T>(
    importFn: () => Promise<{ default: T }>,
    cacheKey: string
  ): Promise<T> {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const promise = importFn().then(module => module.default);
    this.cache.set(cacheKey, promise);
    
    return promise;
  }
}

/**
 * Service Worker manager for offline support and caching
 */
export class ServiceWorkerManager {
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      logger.warning('ServiceWorker', 'Service Workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      logger.success('ServiceWorker', 'Service Worker registered');
      return registration;
    } catch (error) {
      logger.error('ServiceWorker', 'Registration failed', String(error));
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    const results = await Promise.all(
      registrations.map(reg => reg.unregister())
    );

    return results.every(r => r);
  }
}

/**
 * Performance monitor
 * Tracks and reports performance metrics
 */
export class PerformanceMonitor {
  private marks = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      logger.warning('PerformanceMonitor', `Start mark ${startMark} not found`);
      return 0;
    }

    const duration = performance.now() - start;
    logger.debug('PerformanceMonitor', `${name}: ${duration.toFixed(2)}ms`);
    
    return duration;
  }

  getMemoryUsage(): { used: number; total: number; percentage: number } | null {
    if (!('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const percentage = (used / total) * 100;

    return { used, total, percentage };
  }
}

// Export singleton instances
export const streamingService = new StreamingService();
export const requestOptimizer = new RequestOptimizer();
export const chunkProcessor = new ChunkProcessor();
export const lazyLoader = new LazyLoader();
export const serviceWorkerManager = new ServiceWorkerManager();
export const performanceMonitor = new PerformanceMonitor();
