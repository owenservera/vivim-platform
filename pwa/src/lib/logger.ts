/**
 * VIVIM Unified Logging System
 * Provides a single, stable source of truth for both Client and Server logs.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export type LogSource = 'client' | 'server';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  source: LogSource;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
    cause?: unknown;
  };
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 2000;
  private storageKey = 'openscroll_unified_logs';
  private listeners: Array<(log: LogEntry) => void> = [];
  private eventSource: EventSource | null = null;
  private reconnectTimeout: any = null;
  private reconnectAttempt = 0;
  private isConnecting = false;
  private isInternalLog = false; // Flag to prevent recursion

  private constructor() {
    this.loadLogs();
    this.setupConsoleCapture();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // ============================================================================
  // LOG MANAGEMENT
  // ============================================================================

  private generateId(source: LogSource): string {
    return `${source}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      // Use original console if logger isn't ready
      console.warn('Failed to load logs:', e);
    }
  }

  private saveLogs() {
    try {
      const trimmed = this.logs.slice(-this.maxLogs);
      localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
    } catch (e) {
      // Ignore storage errors (quota exceeded, etc)
    }
  }

  private addEntry(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.saveLogs();
    this.notifyListeners(entry);
  }

  // ============================================================================
  // OBSERVER PATTERN
  // ============================================================================

  addListener(listener: (log: LogEntry) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (log: LogEntry) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(log: LogEntry) {
    // Throttled notification could be added here if needed for high volume
    this.listeners.forEach(l => {
      try { l(log); } catch (e) { /* silent */ }
    });
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  log(level: LogLevel, module: string, message: string, source: LogSource = 'client', data?: unknown, error?: Error) {
    const entry: LogEntry = {
      id: this.generateId(source),
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      source,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    this.addEntry(entry);

    if (source === 'client') {
      this.isInternalLog = true;
      const consoleMethod = level === LogLevel.ERROR ? 'error' :
                           level === LogLevel.WARN ? 'warn' :
                           level === LogLevel.DEBUG ? 'debug' : 'log';
      
      // Use original console directly to avoid recursion via wrapper
      if ((console as any)._original && (console as any)._original[consoleMethod]) {
        (console as any)._original[consoleMethod](`[${level}] [${module}]`, message, data || '');
      } else {
        console[consoleMethod](`[${level}] [${module}]`, message, data || '');
      }
      this.isInternalLog = false;
    }
  }

  debug(module: string, message: string, data?: unknown) { this.log(LogLevel.DEBUG, module, message, 'client', data); }
  info(module: string, message: string, data?: unknown) { this.log(LogLevel.INFO, module, message, 'client', data); }
  warn(module: string, message: string, data?: unknown) { this.log(LogLevel.WARN, module, message, 'client', data); }
  error(module: string, message: string, error?: Error, data?: unknown) { this.log(LogLevel.ERROR, module, message, 'client', data, error); }

  getLogs(): LogEntry[] {
    return [...this.logs].reverse();
  }

  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.storageKey);
    this.notifyListeners({ id: 'clear', message: 'Logs cleared', level: LogLevel.INFO, module: 'SYSTEM', source: 'client', timestamp: new Date().toISOString() });
  }

  // ============================================================================
  // SERVER LOG STREAMING
  // ============================================================================

  connectToServer(apiUrl: string) {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) return;

    this.disconnectFromServer();
    this.isConnecting = true;
    
    // Robustly construct stream URL avoiding double segments
    const rootUrl = apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
    const streamUrl = `${rootUrl}/api/v1/logs/stream`;
    
    this.info('SYSTEM', `Connecting to server logs: ${streamUrl}`);

    try {
      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempt = 0;
        this.info('SYSTEM', 'Connected to server logs');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const entry: LogEntry = {
            id: this.generateId('server'),
            timestamp: data.timestamp || new Date().toISOString(),
            level: (data.level?.toUpperCase() as LogLevel) || LogLevel.INFO,
            module: data.module || 'SERVER',
            message: data.message || '',
            source: 'server',
            data: data.data,
            error: data.error
          };
          this.addEntry(entry);
        } catch (e) {
          this.error('SYSTEM', 'Failed to parse server log', e as Error);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        this.disconnectFromServer();
        
        if (this.reconnectAttempt < 5) { // Reduced attempts to avoid heavy overhead
          const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempt), 30000);
          this.reconnectAttempt++;
          // Non-blocking reconnection
          this.reconnectTimeout = setTimeout(() => this.connectToServer(apiUrl), delay);
        }
      };
    } catch (e) {
      this.isConnecting = false;
      this.error('SYSTEM', 'Failed to initialize server logs', e as Error);
    }
  }

  disconnectFromServer() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ============================================================================
  // CONSOLE CAPTURE
  // ============================================================================

  private setupConsoleCapture() {
    // Store original methods on console object itself for access in this.log
    (console as any)._original = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };

    const wrap = (level: LogLevel, original: any) => (...args: any[]) => {
      // Call original first
      original(...args);
      
      // Prevent recursion
      if (this.isInternalLog) return;
      
      try {
        const message = args.map(a => {
          if (typeof a === 'object') {
            try { return JSON.stringify(a); } catch (e) { return '[Object]'; }
          }
          return String(a);
        }).join(' ');

        // Heuristic to avoid double logging or infinite loops
        if (message.startsWith('[') && message.includes('] [')) return;

        this.log(level, 'CONSOLE', message, 'client', args.find(a => typeof a === 'object'));
      } catch (e) {
        // Silent failure to prevent console loops
      }
    };

    console.log = wrap(LogLevel.INFO, (console as any)._original.log);
    console.warn = wrap(LogLevel.WARN, (console as any)._original.warn);
    console.error = wrap(LogLevel.ERROR, (console as any)._original.error);
    console.debug = wrap(LogLevel.DEBUG, (console as any)._original.debug);
    console.info = wrap(LogLevel.INFO, (console as any)._original.info);
  }
}

export const logger = Logger.getInstance();

// Unified logging interface
export const log = {
  api: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'API', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'API', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'API', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'API', msg, 'client', data, error),
    getLogs: () => logger.getAllLogs()
  },
  storage: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'STORAGE', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'STORAGE', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'STORAGE', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'STORAGE', msg, 'client', data, error),
    getLogs: () => logger.getAllLogs()
  },
  dag: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'DAG', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'DAG', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'DAG', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'DAG', msg, 'client', data, error)
  },
  crypto: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'CRYPTO', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'CRYPTO', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'CRYPTO', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'CRYPTO', msg, 'client', data, error)
  },
  capture: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'CAPTURE', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'CAPTURE', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'CAPTURE', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'CAPTURE', msg, 'client', data, error)
  },
  sync: {
    debug: (msg: string, data?: unknown) => logger.log(LogLevel.DEBUG, 'SYNC', msg, 'client', data),
    info: (msg: string, data?: unknown) => logger.log(LogLevel.INFO, 'SYNC', msg, 'client', data),
    warn: (msg: string, data?: unknown) => logger.log(LogLevel.WARN, 'SYNC', msg, 'client', data),
    error: (msg: string, error?: Error, data?: unknown) => logger.log(LogLevel.ERROR, 'SYNC', msg, 'client', data, error)
  }
};
