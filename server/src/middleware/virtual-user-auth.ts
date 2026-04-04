/**
 * Virtual User Middleware
 * 
 * Automatic virtual user identification and session management middleware.
 * Can be used to protect routes that require virtual user authentication.
 * 
 * @module middleware/virtual-user-auth
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { virtualUserManagerService } from '../services/virtual-user-manager.js';

export interface VirtualUserRequest extends Request {
  virtualUser?: any;
  virtualSession?: any;
  sessionToken?: string;
}

/**
 * Extract session token from request
 * Priority: Header > Cookie > Query
 */
function extractSessionToken(req: Request): string | undefined {
  // 1. Try header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Try cookie
  const cookieToken = req.cookies?.virtual_session;
  if (cookieToken) {
    return cookieToken;
  }
  
  // 3. Try query parameter
  const queryToken = req.query.session_token as string;
  if (queryToken) {
    return queryToken;
  }
  
  return undefined;
}

/**
 * Middleware to automatically identify and authenticate virtual users
 * 
 * Usage:
 *   app.use('/api/v1/virtual/*', virtualUserAutoAuth);
 * 
 * Or for specific routes:
 *   app.post('/api/v1/virtual/chat', virtualUserAutoAuth, chatHandler);
 */
export async function virtualUserAutoAuth(
  req: VirtualUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = extractSessionToken(req);
    
    if (!sessionToken) {
      // No session token - continue without virtual user
      // Routes can check req.virtualUser to see if authenticated
      next();
      return;
    }
    
    // Validate session
    const virtualUser = await virtualUserManagerService.findVirtualUserBySessionToken(sessionToken);
    
    if (!virtualUser) {
      // Invalid or expired session - continue without virtual user
      next();
      return;
    }
    
    // Check if session is expired
    const session = await prisma.virtualSession.findUnique({
      where: { sessionToken }
    });
    
    if (!session || !session.isActive || session.expiresAt < new Date()) {
      // Expired session - continue without virtual user
      next();
      return;
    }
    
    // Update last activity
    await prisma.virtualSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });
    
    // Update user's last seen
    await prisma.virtualUser.update({
      where: { id: virtualUser.id },
      data: { lastSeenAt: new Date() }
    });
    
    // Attach to request
    req.virtualUser = virtualUser;
    req.virtualSession = session;
    req.sessionToken = sessionToken;
    
    logger.debug({ virtualUserId: virtualUser.id }, 'Virtual user authenticated via middleware');
    
    next();
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Virtual user auth middleware failed');
    // Don't block request - continue without virtual user
    next();
  }
}

/**
 * Middleware to require virtual user authentication
 * 
 * Usage:
 *   app.post('/api/v1/virtual/memories', requireVirtualUser, createMemoryHandler);
 */
export async function requireVirtualUser(
  req: VirtualUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.virtualUser) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Virtual user authentication required'
    });
    return;
  }
  
  // Check consent
  if (!req.virtualUser.consentGiven) {
    res.status(403).json({
      error: 'CONSENT_REQUIRED',
      message: 'User consent required before accessing this resource',
      virtualUserId: req.virtualUser.id
    });
    return;
  }
  
  next();
}

/**
 * Middleware to optionally authenticate virtual user
 * If authentication succeeds, attach user to request
 * If it fails, continue without user (for optional auth scenarios)
 */
export async function optionalVirtualUser(
  req: VirtualUserRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await virtualUserAutoAuth(req, res, next);
}

/**
 * Middleware to check if virtual user owns a resource
 * 
 * Usage:
 *   app.get('/api/v1/virtual/conversations/:id', 
 *     requireVirtualUser,
 *     checkVirtualUserOwnership('VirtualConversation'),
 *     getConversationHandler
 *   );
 */
export function checkVirtualUserOwnership(modelName: string) {
  return async (req: VirtualUserRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.virtualUser) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }
    
    const resourceId = req.params.id;
    if (!resourceId) {
      res.status(400).json({
        error: 'BAD_REQUEST',
        message: 'Resource ID required'
      });
      return;
    }
    
    try {
      // Dynamic model lookup
      const model = prisma[modelName as keyof typeof prisma];
      if (!model) {
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Invalid model name'
        });
        return;
      }
      
      const resource = await (model as any).findUnique({
        where: { id: resourceId }
      });
      
      if (!resource) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Resource not found'
        });
        return;
      }
      
      if (resource.virtualUserId !== req.virtualUser.id) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Access denied to this resource'
        });
        return;
      }
      
      // Attach resource to request
      req.resource = resource;
      
      next();
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Ownership check failed');
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to verify ownership'
      });
    }
  };
}

/**
 * Middleware to rate limit virtual user actions
 * Prevents abuse from single virtual users
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimitVirtualUsers(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return (req: VirtualUserRequest, res: Response, next: NextFunction): void => {
    const identifier = req.virtualUser?.id || req.ip || 'anonymous';
    const now = Date.now();
    
    const limit = rateLimitMap.get(identifier);
    
    if (!limit || now > limit.resetAt) {
      // New window
      rateLimitMap.set(identifier, {
        count: 1,
        resetAt: now + windowMs
      });
      next();
      return;
    }
    
    if (limit.count >= maxRequests) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
        retryAfter: Math.ceil((limit.resetAt - now) / 1000)
      });
      return;
    }
    
    limit.count++;
    next();
  };
}

// Import Prisma client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default {
  virtualUserAutoAuth,
  requireVirtualUser,
  optionalVirtualUser,
  checkVirtualUserOwnership,
  rateLimitVirtualUsers
};
