/**
 * Request ID Middleware
 *
 * Adds a unique identifier to each request for tracing
 */

import { v4 as uuidv4 } from 'uuid';

export function requestId(req, res, next) {
  // Use existing ID from header or generate new one
  req.id = req.headers['x-request-id'] || uuidv4();

  // Expose ID in response header
  res.setHeader('X-Request-ID', req.id);

  next();
}
