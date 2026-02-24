/**
 * Global Error Handler Middleware
 *
 * Catches all errors and returns consistent error responses
 */

import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

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

  // Prepare error context
  const errorContext = {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || req.session?.userId || null,
    requestId: req.id,
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
  };

  // Log error
  log.error(
    {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode || 500,
      stack: config.isDevelopment ? error.stack : undefined,
      ...errorContext,
    },
    'Error handled by global handler'
  );

  // Report error to centralized error reporting system
  const fullErrorMessage = `UNHANDLED_EXCEPTION [${req.method} ${req.path}]: ${error.message}`;
  serverErrorReporter
    .reportServerError(
      fullErrorMessage,
      error,
      {
        ...errorContext,
        errorName: error.name,
        errorCode: error.code,
        stack: error.stack,
      },
      error.statusCode >= 500 ? 'critical' : 'high'
    )
    .catch((reportErr) => {
      logger.error(
        { reportError: reportErr.message },
        'Failed to report error to centralized system'
      );
    });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Format response
  const response = formatError(error);

  res.status(statusCode).json(response);
}
