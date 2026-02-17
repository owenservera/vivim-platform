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
import { randomUUID } from 'crypto';

const pinoConfig = {
  level: config.logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  levelKey: 'level',
};

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
    : pinoConfig
);

let correlationCounter = 0;

export function generateCorrelationId() {
  return `corr_${Date.now()}_${++correlationCounter}_${randomUUID().slice(0, 8)}`;
}

export function createLogger(context) {
  return logger.child(context);
}

export function createRequestLogger(req) {
  if (!req || !req.headers) {
    return logger.child({ correlationId: generateCorrelationId() });
  }
  const correlationId = req.headers['x-correlation-id'] || req.id || generateCorrelationId();
  return logger.child({
    correlationId,
    requestId: req.id,
    ip: req.ip,
    method: req.method,
    path: req.path,
  });
}

export function createOperationLogger(operation, context = {}) {
  const operationId = `op_${Date.now()}_${randomUUID().slice(0, 8)}`;
  return logger.child({
    operationId,
    operation,
    ...context,
  });
}

export default logger;
