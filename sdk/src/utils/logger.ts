/**
 * VIVIM SDK Logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  timestamps?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * SDK Logger
 */
export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamps: boolean;
  private enableDebug: boolean;

  constructor(config: LoggerConfig = { level: 'info' }) {
    this.level = config.level;
    this.prefix = config.prefix || 'VIVIM';
    this.timestamps = config.timestamps ?? true;
    this.enableDebug = typeof process !== 'undefined' && process.env?.DEBUG === 'true';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = this.timestamps ? `[${new Date().toISOString()}] ` : '';
    const prefix = `[${this.prefix}:${level.toUpperCase()}] `;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp}${prefix}${message}${dataStr}`;
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.enableDebug && this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: `${this.prefix}:${prefix}`,
      timestamps: this.timestamps,
    });
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
  }
  return globalLogger;
}

export function setLogger(logger: Logger): void {
  globalLogger = logger;
}

export function createModuleLogger(module: string): Logger {
  return getLogger().child(module);
}
