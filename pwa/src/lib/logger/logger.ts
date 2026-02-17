type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  debug(message: string, data?: LogContext) {
    if (import.meta.env.DEV) {
      console.debug(this.format('debug', message, data));
    }
  }

  info(message: string, data?: LogContext) {
    console.info(this.format('info', message, data));
  }

  warn(message: string, data?: LogContext) {
    console.warn(this.format('warn', message, data));
  }

  error(message: string, error?: Error, data?: LogContext) {
    console.error(this.format('error', message, {
      ...data,
      stack: error?.stack,
      message: error?.message
    }));
  }

  private format(level: LogLevel, message: string, data?: LogContext) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    });
  }

  child(additionalContext: LogContext) {
    return new Logger({ ...this.context, ...additionalContext });
  }
}

export function createLogger(context: LogContext = {}) {
  return new Logger(context);
}

export const logger = createLogger({ source: 'pwa' });
