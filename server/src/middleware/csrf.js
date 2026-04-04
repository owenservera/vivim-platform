import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';

const CSRF_TOKEN_COOKIE = 'csrf_token';
const TOKEN_LENGTH = 32;
const TOKEN_HEADER = 'x-csrf-token';

const STATELESS_PATHS = [
  '/stripe/webhook',
  '/api/v1/health',
  '/api/v1/auth/google',
  '/api/v1/auth/google/callback',
  '/api/v1/feed-analytics',
  '/api/v1/errors',
  '/api/v1/debug',
  '/api/v1/import',
  '/import/',
  '/api/v1/ai/complete',
  '/api/v1/ai/stream',
  '/api/v1/ai/agent',
  '/api/v1/ai/chat/',
  '/api/v1/ai/settings/',
  '/api/v1/sharing/',
  '/api/v2/',
  '/api/v3/',
];

function generateToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

export function isStatelessPath(path) {
  return STATELESS_PATHS.some(p => path.startsWith(p));
}

export function csrfProtection(req, res, next) {
  if (isStatelessPath(req.path)) {
    return next();
  }

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  try {
    const tokenFromHeader = req.headers[TOKEN_HEADER];
    const tokenFromCookie = req.cookies[CSRF_TOKEN_COOKIE];

    if (!tokenFromCookie) {
      logger.warn({ path: req.path, method: req.method, ip: req.ip }, 'CSRF validation failed: missing cookie');
      return next(new Error('CSRF validation failed'));
    }

    if (!tokenFromHeader || tokenFromHeader !== tokenFromCookie) {
      logger.warn({ path: req.path, method: req.method, ip: req.ip }, 'CSRF validation failed: token mismatch');
      return next(new Error('CSRF validation failed'));
    }

    const newToken = generateToken();
    res.cookie(CSRF_TOKEN_COOKIE, newToken, {
      httpOnly: false,
      secure: !config.isDevelopment,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    req.csrfToken = newToken;
    next();
  } catch (error) {
    logger.error({ err: error }, 'CSRF middleware error');
    next(new Error('CSRF validation failed'));
  }
}

export function setCsrfCookie(req, res, next) {
  if (isStatelessPath(req.path)) {
    return next();
  }

  try {
    const existingToken = req.cookies[CSRF_TOKEN_COOKIE];

    if (existingToken) {
      res.cookie(CSRF_TOKEN_COOKIE, existingToken, {
        httpOnly: false,
        secure: !config.isDevelopment,
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000
      });
      req.csrfToken = existingToken;
      return next();
    }

    const token = generateToken();
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false,
      secure: !config.isDevelopment,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000
    });

    req.csrfToken = token;
    next();
  } catch (error) {
    logger.error({ err: error }, 'Error setting CSRF cookie');
    next();
  }
}

export function getCsrfToken(req) {
  return req.csrfToken || req.cookies[CSRF_TOKEN_COOKIE];
}
