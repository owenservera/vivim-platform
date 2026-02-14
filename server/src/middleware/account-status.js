/**
 * Account Status Middleware
 * 
 * Checks if user account is active before allowing access.
 * Must be used after auth middleware.
 */

import { canUserAccess } from '../services/account-lifecycle-service.js';

export async function requireActiveAccount(req, res, next) {
  if (!req.user?.userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const { allowed, reason } = await canUserAccess(req.user.userId);
  
  if (!allowed) {
    return res.status(403).json({
      success: false,
      error: 'Account access denied',
      reason
    });
  }

  next();
}
