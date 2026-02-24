/**
 * Enhanced Error Handling Middleware
 * Provides comprehensive error tracking for all API endpoints
 */

import { logger } from '../lib/logger.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';
import { config } from '../config/index.js';

/**
 * Async handler wrapper that automatically catches and reports errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Request timing middleware for performance tracking
 */
export const requestTimer = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    res.locals.responseTime = duration;

    // Log slow requests
    if (duration > 1000) {
      logger.warn(
        {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
        },
        'Slow request detected'
      );

      // Report performance issue for very slow requests
      if (duration > 5000) {
        serverErrorReporter.reportPerformanceIssue(
          'response_time',
          duration,
          5000,
          { endpoint: req.path, method: req.method },
          'medium',
          req.id
        );
      }
    }
  });

  next();
};

/**
 * Validation error handler
 */
export const handleValidationError = (err, req, res, next) => {
  if (err.name === 'ZodError' || err.name === 'ValidationError') {
    const fields =
      err.errors?.map((e) => ({
        field: e.path?.join('.') || 'unknown',
        error: e.message,
        value: e.input,
      })) || [];

    serverErrorReporter.reportValidationError(
      req.path,
      fields,
      err,
      { requestBody: req.body },
      'low',
      req.id
    );

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: fields,
    });
  }

  next(err);
};

/**
 * API error handler with comprehensive reporting
 */
export const apiErrorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  const responseTime = res.locals?.responseTime || 0;

  // Determine error type and status code
  const statusCode = err.statusCode || err.status || 500;
  const errorType = getErrorType(err);

  // Prepare error context
  const errorContext = {
    requestId,
    endpoint: req.path,
    method: req.method,
    statusCode,
    responseTime,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || req.session?.userId,
    query: req.query,
    requestBody: sanitizeRequestBody(req.body),
    timestamp: new Date().toISOString(),
  };

  // Report error based on type and severity
  if (statusCode >= 500) {
    serverErrorReporter.reportAPIError(
      req.path,
      req.method,
      statusCode,
      err,
      errorContext,
      'critical',
      requestId
    );
  } else if (statusCode >= 400) {
    serverErrorReporter.reportAPIError(
      req.path,
      req.method,
      statusCode,
      err,
      errorContext,
      statusCode >= 403 ? 'high' : 'medium',
      requestId
    );
  }

  // Log error
  logger.error(
    {
      error: err.message,
      code: errorType,
      statusCode,
      stack: config.isDevelopment ? err.stack : undefined,
      ...errorContext,
    },
    'API error handled'
  );

  // Send response
  res.status(statusCode).json({
    success: false,
    error: getErrorMessage(err, statusCode),
    code: errorType,
    requestId,
    ...(config.isDevelopment && { stack: err.stack, details: err.details }),
  });
};

/**
 * Get error type from error object
 */
function getErrorType(err) {
  if (err.name === 'ZodError') {
    return 'VALIDATION_ERROR';
  }
  if (err.name === 'JsonWebTokenError') {
    return 'AUTH_ERROR';
  }
  if (err.name === 'UnauthorizedError') {
    return 'UNAUTHORIZED';
  }
  if (err.code === 'ECONNREFUSED') {
    return 'CONNECTION_ERROR';
  }
  if (err.code === 'ETIMEDOUT') {
    return 'TIMEOUT_ERROR';
  }
  if (err.code === 'ENOENT') {
    return 'NOT_FOUND_ERROR';
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        return 'UNIQUE_CONSTRAINT_ERROR';
      case 'P2025':
        return 'RECORD_NOT_FOUND_ERROR';
      default:
        return 'DATABASE_ERROR';
    }
  }
  return err.code || 'INTERNAL_ERROR';
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(err, statusCode) {
  if (err.message) {
    // Don't expose internal error details in production
    if (config.isProduction && statusCode >= 500) {
      return 'An unexpected error occurred';
    }
    return err.message;
  }

  switch (statusCode) {
    case 400:
      return 'Bad request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Resource not found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Validation failed';
    case 429:
      return 'Too many requests';
    case 500:
      return 'Internal server error';
    case 502:
      return 'Bad gateway';
    case 503:
      return 'Service unavailable';
    default:
      return 'An error occurred';
  }
}

/**
 * Sanitize request body for logging (remove sensitive data)
 */
function sanitizeRequestBody(body) {
  if (!body) {
    return undefined;
  }

  const sensitive = ['password', 'secret', 'token', 'apiKey', 'api_key', 'creditCard', 'ssn'];
  const sanitized = { ...body };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Not found handler
 */
export const notFoundHandler = (req, res) => {
  const requestId = req.id || 'unknown';

  serverErrorReporter.reportAPIError(
    req.path,
    req.method,
    404,
    new Error(`Route not found: ${req.method} ${req.path}`),
    {
      requestId,
      endpoint: req.path,
      method: req.method,
      statusCode: 404,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
    'low',
    requestId
  );

  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND',
    message: `Cannot ${req.method} ${req.path}`,
    requestId,
    ...(config.enableSwagger && { documentationUrl: '/api-docs' }),
  });
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (req, res, next) => {
  const requestId = req.id || 'unknown';

  serverErrorReporter.reportSecurityIssue(
    'rate_limit_exceeded',
    {
      ip: req.ip,
      endpoint: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
    },
    undefined,
    requestId
  );

  res.status(429).json({
    success: false,
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '60',
    requestId,
  });
};

/**
 * Authentication error handler
 */
export const authErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.message?.includes('Unauthorized')) {
    const requestId = req.id || 'unknown';

    serverErrorReporter.reportAuthError(
      'Authentication failed',
      err,
      {
        action: 'token_validation',
        reason: err.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
      'medium',
      requestId
    );

    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing authentication token',
      requestId,
    });
  }

  next(err);
};
