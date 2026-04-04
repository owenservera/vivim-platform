/**
 * Sentry Express Middleware
 *
 * Provides Express-specific integrations for Sentry:
 * - Request ID binding
 * - User context extraction
 * - Transaction naming
 */

import * as Sentry from '@sentry/node';

/**
 * Add request data to Sentry context
 */
export function sentryRequestContext(req, res, next) {
  // Set transaction name based on route
  Sentry.getCurrentScope().setTransactionName(`${req.method} ${req.path}`);

  // Add request context
  Sentry.getCurrentScope().setContext('request', {
    method: req.method,
    path: req.path,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id,
  });

  // Add user context if available
  if (req.user) {
    Sentry.getCurrentScope().setUser({
      id: req.user.id,
      username: req.user.username,
      // Note: Email is filtered automatically by Sentry config
    });
  }

  // Add custom tags
  Sentry.getCurrentScope().setTag('route', req.path);
  Sentry.getCurrentScope().setTag('method', req.method);

  next();
}

/**
 * Capture errors in async routes
 */
export function sentryAsyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      Sentry.captureException(error);
      next(error);
    }
  };
}

/**
 * Start performance transaction for a route
 */
export function startTransaction(name, op = 'http.server') {
  return Sentry.startSpan({ name, op });
}

export default {
  sentryRequestContext,
  sentryAsyncHandler,
  startTransaction,
};
