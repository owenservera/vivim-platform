/**
 * Request Logger Middleware
 *
 * Logs all incoming requests with timing
 */

import { createRequestLogger } from '../lib/logger.js';

export function requestLogger(req, res, next) {
  const log = createRequestLogger(req);

  // Manifest-Style Ordered Feedback
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  process.stdout.write(
    ` \x1b[34m[REQ]\x1b[0m \x1b[1mWHAT:\x1b[0m ${req.method} ${req.path.slice(0, 20)} | \x1b[1mWHERE:\x1b[0m ${req.ip.slice(0, 15)} | \x1b[1mWHEN:\x1b[0m ${timestamp} | \x1b[1mBY_WHO:\x1b[0m ${req.id.slice(0, 8)}\n`
  );

  // Log detailed JSON for pino
  log.info({ query: req.query }, 'Incoming request');

  // Record start time
  const startTime = Date.now();

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    process.stdout.write(
      ` \x1b[35m[RES]\x1b[0m \x1b[1mHOW:\x1b[0m ${statusColor}${res.statusCode}\x1b[0m | \x1b[1mDURATION:\x1b[0m ${duration}ms | \x1b[1mBY_WHO:\x1b[0m ${req.id.slice(0, 8)}\n`
    );

    log[level](
      {
        statusCode: res.statusCode,
        duration,
        contentLength: res.getHeader('content-length'),
      },
      'Request completed'
    );
  });

  next();
}
