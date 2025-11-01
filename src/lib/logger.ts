import { ExecutionLogEntry } from "@/components/DetailedExecutionLog";

/**
 * Enhanced logging service with app-specific prefixes and filtering
 * This helps distinguish app errors from browser extension errors
 */
class LoggerService {
  private logs: ExecutionLogEntry[] = [];
  private listeners: ((logs: ExecutionLogEntry[]) => void)[] = [];
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };

  constructor() {
    try {
      this.initializeConsoleOverrides();
    } catch (error) {
      // If console override fails, just use original console
      this.originalConsole.error('Logger initialization failed:', error);
    }
  }

  /**
   * Override console methods to filter out browser extension noise
   */
  private initializeConsoleOverrides() {
    const extensionPatterns = [
      /content_script\.js/,
      /extension/i,
      /chrome-extension:/,
      /A listener indicated an asynchronous response/,
      /Cannot read properties of null \(reading 'deref'\)/,
    ];

    // Override console.error to filter extension errors
    console.error = (...args: any[]) => {
      const errorString = args.join(' ');
      const isExtensionError = extensionPatterns.some(pattern => 
        pattern.test(errorString)
      );

      if (!isExtensionError) {
        this.originalConsole.error('[ACW Error]', ...args);
      }
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const warnString = args.join(' ');
      const isExtensionWarn = extensionPatterns.some(pattern => 
        pattern.test(warnString)
      );

      if (!isExtensionWarn) {
        this.originalConsole.warn('[ACW Warning]', ...args);
      }
    };
  }

  /**
   * Add a log entry
   */
  log(
    level: ExecutionLogEntry["level"],
    category: string,
    message: string,
    details?: string,
    data?: any
  ) {
    try {
      const entry: ExecutionLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        level,
        category,
        message,
        details,
        data,
      };

      this.logs.push(entry);
      
      // Keep logs limited to prevent memory issues
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-500); // Keep last 500 logs
      }
      
      this.notifyListeners();

      // Also log to console with app prefix
      const prefix = `[ACW ${category}]`;
      switch (level) {
        case "error":
          this.originalConsole.error(prefix, message, details || "", data || "");
          break;
        case "warning":
          this.originalConsole.warn(prefix, message, details || "", data || "");
          break;
        case "debug":
          this.originalConsole.debug(prefix, message, details || "", data || "");
          break;
        case "success":
        case "info":
        default:
          this.originalConsole.log(prefix, message, details || "", data || "");
      }

      return entry;
    } catch (error) {
      // If logging fails, just use console
      this.originalConsole.error('Logger.log failed:', error);
      return {
        id: Date.now().toString(),
        timestamp: new Date(),
        level,
        category,
        message,
        details,
        data
      };
    }
  }

  info(category: string, message: string, details?: string, data?: any) {
    return this.log("info", category, message, details, data);
  }

  success(category: string, message: string, details?: string, data?: any) {
    return this.log("success", category, message, details, data);
  }

  warning(category: string, message: string, details?: string, data?: any) {
    return this.log("warning", category, message, details, data);
  }

  error(category: string, message: string, details?: string, data?: any) {
    return this.log("error", category, message, details, data);
  }

  debug(category: string, message: string, details?: string, data?: any) {
    return this.log("debug", category, message, details, data);
  }

  /**
   * Get all logs
   */
  getLogs(): ExecutionLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to log updates
   */
  subscribe(listener: (logs: ExecutionLogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of log updates
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  /**
   * Log an error with stack trace
   */
  logError(category: string, error: Error | unknown, context?: string) {
    if (error instanceof Error) {
      this.error(
        category,
        error.message,
        context ? `${context}\n\nStack trace:\n${error.stack}` : error.stack,
        { name: error.name, cause: error.cause }
      );
    } else {
      this.error(
        category,
        "Unknown error",
        context ? `${context}\n\nError: ${String(error)}` : String(error)
      );
    }
  }

  /**
   * Log execution timing
   */
  logTiming(category: string, operation: string, durationMs: number) {
    this.info(
      category,
      `${operation} completed in ${durationMs}ms`,
      `Duration: ${(durationMs / 1000).toFixed(2)}s`,
      { operation, durationMs }
    );
  }

  /**
   * Log API call
   */
  logApiCall(
    endpoint: string,
    status: "start" | "success" | "error",
    details?: string
  ) {
    if (status === "start") {
      this.info("API", `Calling ${endpoint}`, details);
    } else if (status === "success") {
      this.success("API", `${endpoint} succeeded`, details);
    } else {
      this.error("API", `${endpoint} failed`, details);
    }
  }

  /**
   * Log AI operation
   */
  logAI(
    operation: string,
    status: "start" | "success" | "error",
    details?: string,
    data?: any
  ) {
    if (status === "start") {
      this.info("AI", `Starting: ${operation}`, details, data);
    } else if (status === "success") {
      this.success("AI", `Completed: ${operation}`, details, data);
    } else {
      this.error("AI", `Failed: ${operation}`, details, data);
    }
  }

  /**
   * Export logs as text
   */
  exportLogs(): string {
    return this.logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.category}]\n` +
          `${log.message}` +
          `${log.details ? "\nDetails: " + log.details : ""}` +
          `${log.data ? "\nData: " + JSON.stringify(log.data, null, 2) : ""}\n`
      )
      .join("\n");
  }
}

// Create singleton instance
export const logger = new LoggerService();

// Export class for testing
export { LoggerService };
