/**
 * Structured Logging with Pino
 *
 * Provides:
 * - Structured JSON logs
 * - Log levels (debug, info, warn, error)
 * - Request context binding
 * - Pretty printing in development
 */

import pino from 'pino';
import { config } from '../config/index.js';

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

const pinoConfig = {
  level: config.logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

// Use pretty printing in development, JSON in production
const isPretty = config.logFormat === 'pretty';

export const logger = pino(
  isPretty
    ? {
        ...pinoConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : pinoConfig,
);

// ============================================================================
// CHILD LOGGER CREATOR
// ============================================================================

/**
 * Create a child logger with bound context
 * @param {Object} context - Context to bind to all log entries
 * @returns {pino.Logger} Child logger instance
 */
export function createLogger(context) {
  return logger.child(context);
}

// ============================================================================
// REQUEST LOGGER
// ============================================================================

/**
 * Create a logger bound to a specific request
 * @param {Object} req - Express request object
 * @returns {pino.Logger} Request-scoped logger
 */
export function createRequestLogger(req) {
  return logger.child({
    requestId: req.id,
    ip: req.ip,
    method: req.method,
    path: req.path,
  });
}

export default logger;
