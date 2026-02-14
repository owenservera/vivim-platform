/**
 * Unified Authentication Middleware
 * Supports both Google OAuth (session) and DID-based auth
 */

import passport from './google-auth.js';
import { identityService } from '../services/identity-service.js';
import { canUserAccess } from '../services/account-lifecycle-service.js';

export async function requireAuth(req, res, next) {
  let userId = null;
  let did = null;

  if (req.isAuthenticated() && req.user?.userId) {
    userId = req.user.userId;
  } else {
    did = req.headers['x-did'] || (req.headers['authorization'] || '').replace('Bearer did:', 'did:');
    if (did && identityService.validateDID(did)) {
      const publicKey = identityService.didToPublicKey(did);
      if (publicKey) {
        const user = await identityService.getOrCreateUser(did, Buffer.from(publicKey).toString('base64'));
        if (user) {
          userId = user.id;
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
    const did = req.headers['x-did'];
    if (did && identityService.validateDID(did)) {
      const publicKey = identityService.didToPublicKey(did);
      if (publicKey) {
        const user = await identityService.getOrCreateUser(did, Buffer.from(publicKey).toString('base64'));
        if (user) {
          userId = user.id;
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
