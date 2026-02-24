/**
 * Admin Authentication Middleware
 *
 * Provides authentication and authorization for admin API endpoints
 */

import { logger } from '../lib/logger.js';

// ============================================================================
// ADMIN CONFIGURATION
// ============================================================================

const ADMIN_API_KEYS = process.env.ADMIN_API_KEYS?.split(',')?.filter(Boolean) || [];
const MASTER_ADMIN_KEY = process.env.MASTER_ADMIN_KEY || null;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate admin API key
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid admin key
 */
function isValidAdminKey(apiKey) {
  if (!apiKey) {
    return false;
  }

  // Check master admin key first
  if (MASTER_ADMIN_KEY && apiKey === MASTER_ADMIN_KEY) {
    return true;
  }

  // Check individual admin keys
  return ADMIN_API_KEYS.includes(apiKey);
}

/**
 * Extract API key from request
 * @param {Object} req - Express request object
 * @returns {string|null} API key or null
 */
function extractAdminKey(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check custom header
  if (req.headers['x-admin-api-key']) {
    return req.headers['x-admin-api-key'];
  }

  // Check query parameter (least secure, but needed for some tools)
  if (req.query.admin_key) {
    return req.query.admin_key;
  }

  return null;
}

/**
 * Check if request is from localhost/internal network
 * @param {Object} req - Express request
 * @returns {boolean} True if from trusted source
 */
function isTrustedSource(req) {
  const ip = req.ip || req.connection?.remoteAddress;

  // localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return true;
  }

  // private networks
  if (ip?.startsWith('192.168.') || ip?.startsWith('10.') || ip?.startsWith('172.')) {
    return true;
  }

  return false;
}

// ============================================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require admin authentication
 * Validates API key or session-based admin access
 */
export function requireAdminAuth() {
  return async (req, res, next) => {
    const log = req.log || logger;

    // Check for API key authentication
    const adminKey = extractAdminKey(req);

    if (adminKey) {
      if (isValidAdminKey(adminKey)) {
        req.adminAuth = {
          isAuthenticated: true,
          authType: 'api_key',
          key: `${adminKey.substring(0, 8)}...`,
          permissions: ['*'], // Full admin permissions
        };

        log.info(
          {
            path: req.path,
            authType: 'api_key',
            ip: req.ip,
          },
          'Admin API access granted via API key'
        );

        return next();
      } else {
        log.warn(
          {
            path: req.path,
            hasKey: !!adminKey,
            ip: req.ip,
          },
          'Invalid admin API key attempt'
        );

        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid admin API key',
          code: 'INVALID_ADMIN_KEY',
        });
      }
    }

    // Check for session-based authentication with admin role
    if (req.user && req.user.role === 'admin') {
      req.adminAuth = {
        isAuthenticated: true,
        authType: 'session',
        userId: req.user.userId || req.user.id,
        permissions: ['*'],
      };

      log.info(
        {
          path: req.path,
          authType: 'session',
          userId: req.user.userId,
        },
        'Admin access granted via session'
      );

      return next();
    }

    // Check if request is from trusted source (localhost/development)
    const isDevMode = process.env.NODE_ENV !== 'production';
    if (isDevMode && isTrustedSource(req)) {
      // In dev mode, allow localhost access but log it
      req.adminAuth = {
        isAuthenticated: true,
        authType: 'dev_trusted',
        permissions: ['*'],
      };

      log.warn(
        {
          path: req.path,
          authType: 'dev_trusted',
          ip: req.ip,
        },
        'Admin access granted via trusted source (dev mode)'
      );

      return next();
    }

    // No valid authentication found
    log.warn(
      {
        path: req.path,
        hasKey: !!adminKey,
        hasUser: !!req.user,
        ip: req.ip,
      },
      'Unauthorized admin access attempt'
    );

    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required',
      code: 'ADMIN_AUTH_REQUIRED',
    });
  };
}

/**
 * Require specific admin permission
 * @param {string} permission - Required permission (e.g., 'database.query', 'users.manage')
 */
export function requireAdminPermission(permission) {
  return async (req, res, next) => {
    const log = req.log || logger;

    // Ensure admin authentication ran first
    if (!req.adminAuth?.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED',
      });
    }

    // Master key has all permissions
    if (req.adminAuth.permissions.includes('*')) {
      return next();
    }

    // Check specific permission
    if (!req.adminAuth.permissions.includes(permission)) {
      log.warn(
        {
          path: req.path,
          permission,
          userId: req.adminAuth.userId,
        },
        'Insufficient admin permissions'
      );

      return res.status(403).json({
        success: false,
        error: `Admin permission '${permission}' required`,
        code: 'INSUFFICIENT_ADMIN_PERMISSION',
      });
    }

    next();
  };
}

/**
 * Require read-only admin access
 */
export function requireAdminRead() {
  return async (req, res, next) => {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(403).json({
        success: false,
        error: 'Read-only admin access required',
        code: 'READONLY_ADMIN_REQUIRED',
      });
    }

    next();
  };
}

/**
 * Middleware to require database query permission
 * Additional security layer for the sensitive /query endpoint
 */
export function requireDatabaseQueryPermission() {
  return async (req, res, next) => {
    const log = req.log || logger;

    // Ensure admin authentication ran first
    if (!req.adminAuth?.isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
        code: 'ADMIN_AUTH_REQUIRED',
      });
    }

    // Master key required for database queries in production
    if (process.env.NODE_ENV === 'production') {
      const adminKey = extractAdminKey(req);
      const isMasterKey = MASTER_ADMIN_KEY && adminKey === MASTER_ADMIN_KEY;

      if (!isMasterKey) {
        log.warn(
          {
            path: req.path,
            userId: req.adminAuth.userId,
            authType: req.adminAuth.authType,
          },
          'Attempted database query without master key in production'
        );

        return res.status(403).json({
          success: false,
          error: 'Master admin key required for database queries in production',
          code: 'MASTER_KEY_REQUIRED',
        });
      }
    }

    // Log database query attempts
    log.info(
      {
        path: req.path,
        method: req.method,
        userId: req.adminAuth.userId,
        authType: req.adminAuth.authType,
      },
      'Database query permission granted'
    );

    next();
  };
}

export default {
  requireAdminAuth,
  requireAdminPermission,
  requireAdminRead,
  requireDatabaseQueryPermission,
};
