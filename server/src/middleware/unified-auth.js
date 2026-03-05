/**
 * Unified Authentication Middleware
 * Supports both Google OAuth (session) and DID-based auth
 */

import passport from './google-auth.js';
import { identityService } from '../services/identity-service.js';
import { canUserAccess } from '../services/account-lifecycle-service.js';
import { apiKeyService } from '../services/api-key-service.js';
import jwt from 'jsonwebtoken';

export async function requireAuth(req, res, next) {
  let userId = null;
  let did = null;

  if (req.isAuthenticated() && req.user?.userId) {
    userId = req.user.userId;
  } else {
    // Check API Key first
    const apiKeyHeader = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'] || '';
    let apiKey = apiKeyHeader;

    if (!apiKey && authHeader.startsWith('Bearer vk_live_')) {
      apiKey = authHeader.replace('Bearer ', '');
    }

    if (apiKey) {
      const user = await apiKeyService.verifyApiKey(apiKey);
      if (user) {
        userId = user.id;
        // Mock req.user for consistency
        req.user = { userId: user.id, email: user.email, did: user.did };
      }
    } else if (authHeader.startsWith('Bearer ') && !authHeader.startsWith('Bearer did:')) {
      // Check JWT
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        if (decoded.type === 'access') {
          userId = decoded.sub;
          did = decoded.did;
          req.user = { userId: decoded.sub, did: decoded.did, deviceId: decoded.deviceId };
        }
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ success: false, error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        // token invalid, fall through
      }
    }
    
    if (!userId) {
      did = req.headers['x-did'] || authHeader.replace('Bearer did:', 'did:');
      if (did && did.startsWith('did:') && identityService.validateDID(did)) {
        const publicKey = identityService.didToPublicKey(did);
        if (publicKey) {
          const user = await identityService.getOrCreateUser(
            did,
            Buffer.from(publicKey).toString('base64')
          );
          if (user) {
            userId = user.id;
          }
        }
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  const { allowed, reason } = await canUserAccess(userId);
  if (!allowed) {
    return res.status(403).json({ success: false, error: 'Account access denied', reason });
  }

  req.userId = userId;
  if (did) {
    req.user = { ...req.user, did, userId };
  }
  next();
}

export async function optionalAuth(req, res, next) {
  let userId = null;

  if (req.isAuthenticated() && req.user?.userId) {
    userId = req.user.userId;
  } else {
    const apiKeyHeader = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'] || '';
    let apiKey = apiKeyHeader;

    if (!apiKey && authHeader.startsWith('Bearer vk_live_')) {
      apiKey = authHeader.replace('Bearer ', '');
    }

    if (apiKey) {
      const user = await apiKeyService.verifyApiKey(apiKey);
      if (user) {
        userId = user.id;
        req.user = { userId: user.id, email: user.email, did: user.did };
      }
    } else if (authHeader.startsWith('Bearer ') && !authHeader.startsWith('Bearer did:')) {
      // Check JWT
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        if (decoded.type === 'access') {
          userId = decoded.sub;
          req.user = { userId: decoded.sub, did: decoded.did, deviceId: decoded.deviceId };
        }
      } catch (err) {
        // ignore
      }
    }
    
    if (!userId) {
      const did = req.headers['x-did'];
      if (did && identityService.validateDID(did)) {
        const publicKey = identityService.didToPublicKey(did);
        if (publicKey) {
          const user = await identityService.getOrCreateUser(
            did,
            Buffer.from(publicKey).toString('base64')
          );
          if (user) {
            userId = user.id;
          }
        }
      }
    }
  }

  if (userId) {
    const { allowed } = await canUserAccess(userId);
    if (allowed) {
      req.userId = userId;
    }
  }
  next();
}
