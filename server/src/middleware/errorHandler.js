/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent error responses
 */

import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

// ============================================================================
// ERROR CLASS HIERARCHY
// ============================================================================

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

// ============================================================================
// ERROR FORMATTER
// ============================================================================

function formatError(error) {
  // Operational errors (known errors)
  if (error.isOperational) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
      },
    };
  }

  // Programming errors (unexpected)
  // Don't expose details in production
  if (config.isProduction) {
    logger.error({ error: error.message, stack: error.stack }, 'Unexpected error');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }

  // Development: include stack trace
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: error.message,
      stack: error.stack,
    },
  };
}

// ============================================================================
// GLOBAL ERROR HANDLER
// ============================================================================

export function errorHandler(error, req, res, _next) {
  const log = req.id ? logger.child({ requestId: req.id }) : logger;

  // Log error
  log.error(
    {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode || 500,
      stack: config.isDevelopment ? error.stack : undefined,
    },
    'Error handled by global handler',
  );

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Format response
  const response = formatError(error);

  res.status(statusCode).json(response);
}
