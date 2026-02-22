/**
 * Authentication Middleware
 *
 * Implements API key-based authentication for sensitive endpoints
 */

import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { UnauthorizedError } from './errorHandler.js';

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

// In production, API keys should be stored securely (e.g., environment variables, vault)
const API_KEYS = process.env.API_KEYS?.split(',') || [];
const MASTER_KEY = process.env.MASTER_API_KEY || null;

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Verify API key against stored keys
 * @param {string} apiKey - API key to verify
 * @returns {boolean} True if valid
 */
function isValidApiKey(apiKey) {
  if (!apiKey) {
return false;
}
  
  // Check master key first
  if (MASTER_KEY && apiKey === MASTER_KEY) {
    return true;
  }
  
  // Check individual API keys
  return API_KEYS.includes(apiKey);
}

/**
 * Extract API key from request
 * @param {Object} req - Express request object
 * @returns {string|null} API key or null if not found
 */
function extractApiKey(req) {
  // Check header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Check custom header as fallback
  if (req.headers['x-api-key']) {
    return req.headers['x-api-key'];
  }

  // Check query parameter as fallback (less secure, but needed for SSE)
  if (req.query.api_key) {
    return req.query.api_key;
  }

  return null;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Require API key authentication
 * @param {Array<string>} [permissions] - Required permissions (currently unused)
 */
export function requireApiKey(permissions = []) {
  return (req, res, next) => {
    // Check if already authenticated (e.g. via dev bypass or other middleware)
    if (req.auth && req.auth.isAuthenticated) {
      return next();
    }

    const apiKey = extractApiKey(req);

    if (!isValidApiKey(apiKey)) {
      const log = req.log || logger;
      log.warn({ 
        path: req.path, 
        method: req.method,
        hasKey: !!apiKey,
        ip: req.ip 
      }, 'Unauthorized API access attempt');
      
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing API key',
        code: 'UNAUTHORIZED'
      });
    }

    req.auth = {
      isAuthenticated: true,
      apiKey: `${apiKey.substring(0, 8)}...`,
      permissions: permissions,
    };
    
    return next();
  };
}

/**
 * Optional authentication - allows both authenticated and unauthenticated requests
 */
export function optionalAuth(req, res, next) {
  const apiKey = extractApiKey(req);
  
  if (apiKey && isValidApiKey(apiKey)) {
    req.auth = {
      isAuthenticated: true,
      apiKey: `${apiKey.substring(0, 8)  }...`, // Mask for logging
      permissions: [],
    };
  } else {
    req.auth = {
      isAuthenticated: false,
      apiKey: null,
      permissions: [],
    };
  }
  
  next();
}

// ============================================================================
// AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if user has required permissions
 * @param {Object} req - Express request object
 * @param {Array<string>} requiredPermissions - Permissions required
 * @returns {boolean} True if authorized
 */
export function hasPermission(req, requiredPermissions = []) {
  if (!req.auth?.isAuthenticated) {
    return false;
  }
  
  // For now, we don't implement fine-grained permissions
  // This can be expanded in the future
  return true;
}

// ============================================================================
// DID-BASED AUTHENTICATION (Phase 1)
// ============================================================================

import { verify } from 'tweetnacl';
import { decodeBase64 } from 'tweetnacl-util';
import { identityService } from '../services/identity-service.js';
import { getUserDbPath, getUserClient } from '../lib/user-database-manager.js';

/**
 * Authenticate using DID
 */
export async function authenticateDID(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const did = req.headers['x-did'] || authHeader.replace('Bearer did:', 'did:');
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const deviceId = req.headers['x-device-id'];

    if (!did) {
      return res.status(401).json({
        success: false,
        error: 'DID required',
        code: 'MISSING_DID'
      });
    }

    if (!identityService.validateDID(did)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid DID format',
        code: 'INVALID_DID'
      });
    }

    if (req.method !== 'GET' && signature) {
      const isValid = await verifyRequestSignature(req, did, signature, timestamp);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid signature',
          code: 'INVALID_SIGNATURE'
        });
      }
    }

    const didDoc = await identityService.resolveDID(did);
    if (!didDoc) {
      return res.status(401).json({
        success: false,
        error: 'Could not resolve DID',
        code: 'DID_RESOLUTION_FAILED'
      });
    }

    const publicKey = identityService.didToPublicKey(did);
    const user = await identityService.getOrCreateUser(
      did, 
      Buffer.from(publicKey).toString('base64')
    );

    const databasePath = getUserDbPath(did);

    let userClient = null;
    try {
      userClient = await getUserClient(did);
    } catch (clientError) {
      logger.warn({ did, error: clientError.message }, 'User client not available yet (user DB may not exist)');
    }

    req.user = {
      did,
      userId: user.id,
      deviceId,
      publicKey: Buffer.from(publicKey).toString('base64'),
      databasePath,
      userClient,
    };

    next();
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Authentication failed');
    if (!res || !res.status) {
      return next(error);
    }
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

async function verifyRequestSignature(req, did, signature, timestamp) {
  try {
    if (timestamp) {
      const requestTime = parseInt(timestamp);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (Math.abs(now - requestTime) > fiveMinutes) {
        return false;
      }
    }

    const message = [req.method, req.path, timestamp || Date.now().toString()];
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      message.push(JSON.stringify(req.body));
    }

    const publicKey = identityService.didToPublicKey(did);
    if (!publicKey) return false;

    return verify(
      new TextEncoder().encode(message.join(':')),
      decodeBase64(signature),
      publicKey
    );
  } catch (error) {
    return false;
  }
}

/**
 * Require minimum verification level
 */
export function requireVerification(minLevel) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { getPrismaClient } = await import('../lib/database.js');
    const prisma = getPrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { verificationLevel: true }
    });

    if (!user || user.verificationLevel < minLevel) {
      return res.status(403).json({
        success: false,
        error: `Verification level ${minLevel} required`,
        code: 'INSUFFICIENT_VERIFICATION',
        currentLevel: user?.verificationLevel || 0
      });
    }

    next();
  };
}

/**
 * Require moderator role
 */
export function requireModerator() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { getPrismaClient } = await import('../lib/database.js');
    const prisma = getPrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true, settings: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const settings = user.settings || {};
    const isModerator = settings.moderator === true || settings.role === 'moderator' || settings.role === 'admin';
    
    if (!isModerator) {
      return res.status(403).json({
        success: false,
        error: 'Moderator access required'
      });
    }

    next();
  };
}