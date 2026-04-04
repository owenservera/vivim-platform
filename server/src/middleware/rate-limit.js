/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiting for API endpoints
 */

const logger = require('../lib/logger.js').logger;
const log = logger.child({ middleware: 'rate-limit' });

// Store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Create rate limiting middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    maxRequests = 100, // 100 requests per window
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later.',
  } = options;

  return (req, res, next) => {
    const key = getRateLimitKey(req);
    const now = Date.now();

    // Clean up old entries
    cleanupOldEntries(now, windowMs);

    // Get current count for this key
    const entry = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      // Window has expired, reset count
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      // Increment count
      entry.count++;
    }

    // Store updated entry
    rateLimitStore.set(key, entry);

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);

      log.warn({
        key,
        count: entry.count,
        max: maxRequests,
        remainingTime,
      }, 'Rate limit exceeded');

      return res.status(429).json({
        error: 'Too Many Requests',
        message,
        retryAfter: remainingTime,
      });
    }

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req) {
  const userId = req.userId || req.user?.id || req.user?.userId || req.session?.userId;
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // Use user ID if authenticated, otherwise use IP
  return `rate-limit:${userId || ip}`;
}

/**
 * Clean up old rate limit entries
 */
function cleanupOldEntries(now, windowMs) {
  const expirationThreshold = now - windowMs;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < expirationThreshold) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit for import endpoints (more restrictive)
 */
const importRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 5, // 5 import requests per 5 minutes
  message: 'You can only upload 5 files every 5 minutes. Please wait before trying again.',
});

/**
 * Rate limit for job status polling (less restrictive)
 */
const pollRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 polls per minute (1 per second)
  message: 'You are polling too frequently. Please slow down.',
});

/**
 * Rate limit for general API (least restrictive)
 */
const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300, // 300 requests per minute
});

/**
 * Check current rate limit status for a key
 */
function checkRateLimitStatus(key) {
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return {
      limited: false,
      remaining: 0,
      resetTime: null,
    };
  }

  const now = Date.now();
  return {
    limited: entry.count >= 100, // Default max
    remaining: Math.max(0, 100 - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for a key (for testing/admin)
 */
function resetRateLimit(key) {
  rateLimitStore.delete(key);
  log.info({ key }, 'Rate limit reset');
}

/**
 * Get rate limit statistics
 */
function getRateLimitStats() {
  return {
    totalEntries: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
      key: key.replace(/rate-limit:.*/, '***'), // Anonymize
      count: entry.count,
      resetTime: entry.resetTime,
    })),
  };
}

module.exports = {
  createRateLimiter,
  importRateLimiter,
  pollRateLimiter,
  apiRateLimiter,
  checkRateLimitStatus,
  resetRateLimit,
  getRateLimitStats,
};
