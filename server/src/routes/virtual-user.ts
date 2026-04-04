/**
 * Virtual User API Routes
 * 
 * RESTful API endpoints for virtual user identification and management.
 * Supports no-login chatbot functionality with full memory and context features.
 * 
 * Endpoints:
 * - POST   /api/v1/virtual/identify     - Identify or create virtual user
 * - POST   /api/v1/virtual/consent      - Provide consent for data storage
 * - GET    /api/v1/virtual/profile      - Get virtual user profile
 * - GET    /api/v1/virtual/memories     - Get virtual user memories
 * - POST   /api/v1/virtual/memories     - Create memory
 * - GET    /api/v1/virtual/conversations - Get conversations
 * - POST   /api/v1/virtual/conversations - Create conversation
 * - POST   /api/v1/virtual/chat         - Chat with AI (with context)
 * - POST   /api/v1/virtual/merge        - Merge virtual users
 * - DELETE /api/v1/virtual/account      - Delete virtual user account
 * - GET    /api/v1/virtual/export       - Export all virtual user data
 * 
 * @module routes/virtual-user
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../lib/logger.js';
import { virtualUserManagerService } from '../services/virtual-user-manager.js';
import { virtualMemoryAdapterService } from '../services/virtual-memory-adapter.js';
import { deviceFingerprintingService } from '../services/device-fingerprinting-service.js';

const router = Router();

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

const IdentifyRequestSchema = z.object({
  fingerprint: z.string(),
  signals: z.object({
    canvas: z.string().optional(),
    canvasWinding: z.string().optional(),
    webglVendor: z.string().optional(),
    webglRenderer: z.string().optional(),
    webglVersion: z.string().optional(),
    webglShadingLanguageVersion: z.string().optional(),
    webglExtensions: z.string().optional(),
    webglUnmaskedVendor: z.string().optional(),
    webglUnmaskedRenderer: z.string().optional(),
    audio: z.string().optional(),
    fonts: z.array(z.string()).optional(),
    screenResolution: z.string().optional(),
    screenColorDepth: z.number().optional(),
    screenPixelRatio: z.number().optional(),
    screenOrientation: z.string().optional(),
    batteryLevel: z.number().optional(),
    batteryCharging: z.boolean().optional(),
    touchPoints: z.number().optional(),
    hardwareConcurrency: z.number().optional(),
    deviceMemory: z.number().optional(),
    userAgent: z.string().optional(),
    language: z.string().optional(),
    languages: z.array(z.string()).optional(),
    timezone: z.string().optional(),
    timezoneOffset: z.number().optional(),
    platform: z.string().optional(),
    cookiesEnabled: z.boolean().optional(),
    doNotTrack: z.string().optional(),
    maxTouchPoints: z.number().optional(),
    pdfViewerEnabled: z.boolean().optional()
  }),
  existingSessionToken: z.string().optional()
});

const ConsentRequestSchema = z.object({
  virtualUserId: z.string().uuid(),
  sessionToken: z.string(),
  consentGiven: z.boolean(),
  dataRetentionPolicy: z.enum(['7_days', '30_days', '90_days', '1_year', 'indefinite'])
});

const CreateMemoryRequestSchema = z.object({
  sessionToken: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  memoryType: z.enum([
    'EPISODIC', 'SEMANTIC', 'PROCEDURAL', 'FACTUAL',
    'PREFERENCE', 'IDENTITY', 'RELATIONSHIP', 'GOAL', 'PROJECT', 'CUSTOM'
  ]).optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  importance: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional()
});

const CreateConversationRequestSchema = z.object({
  sessionToken: z.string(),
  title: z.string().optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const ChatRequestSchema = z.object({
  sessionToken: z.string(),
  message: z.string(),
  conversationId: z.string().uuid().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().optional()
});

const MergeUsersRequestSchema = z.object({
  sourceVirtualUserId: z.string().uuid(),
  targetVirtualUserId: z.string().uuid(),
  sessionToken: z.string(),
  reason: z.enum(['confidence_match', 'manual', 'duplicate_detection']).optional()
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Validate virtual user session
 */
async function validateSession(req: Request, res: Response, next: Function) {
  const sessionToken = req.body.sessionToken || req.query.sessionToken as string;
  
  if (!sessionToken) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Session token required'
    });
  }
  
  try {
    const virtualUser = await virtualUserManagerService.findVirtualUserBySessionToken(sessionToken);
    
    if (!virtualUser) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired session'
      });
    }
    
    if (!virtualUser.consentGiven) {
      return res.status(403).json({
        error: 'CONSENT_REQUIRED',
        message: 'User consent required before accessing services',
        virtualUserId: virtualUser.id
      });
    }
    
    // Attach virtual user to request
    (req as any).virtualUser = virtualUser;
    (req as any).sessionToken = sessionToken;
    
    next();
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Session validation failed');
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate session'
    });
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/v1/virtual/identify
 * Identify or create a virtual user based on device fingerprint
 */
router.post('/identify', async (req: Request, res: Response) => {
  try {
    // Validate request
    const parseResult = IdentifyRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const { fingerprint, signals, existingSessionToken } = parseResult.data;
    
    // Get IP and User Agent from request
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || undefined;
    const userAgent = req.headers['user-agent'];
    
    // Identify or create virtual user
    const result = await virtualUserManagerService.identifyOrCreateVirtualUser({
      fingerprint,
      signals,
      ipAddress,
      userAgent,
      existingSessionToken
    });
    
    // Set session cookie
    res.cookie('virtual_session', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    logger.info({
      virtualUserId: result.virtualUserId,
      isNewUser: result.isNewUser,
      confidence: result.identification.score
    }, 'Virtual user identified');
    
    res.json({
      success: true,
      virtualUserId: result.virtualUserId,
      sessionToken: result.sessionToken,
      identification: result.identification,
      profile: result.profile,
      consentRequired: result.consentRequired,
      isNewUser: result.isNewUser
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Virtual user identification failed');
    res.status(500).json({
      error: 'IDENTIFICATION_FAILED',
      message: 'Failed to identify virtual user'
    });
  }
});

/**
 * POST /api/v1/virtual/consent
 * Provide consent for data storage
 */
router.post('/consent', async (req: Request, res: Response) => {
  try {
    const parseResult = ConsentRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const { virtualUserId, sessionToken, consentGiven, dataRetentionPolicy } = parseResult.data;
    
    // Verify session
    const virtualUser = await virtualUserManagerService.findVirtualUserBySessionToken(sessionToken);
    if (!virtualUser || virtualUser.id !== virtualUserId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Invalid session for this user'
      });
    }
    
    // Update consent
    await virtualUserManagerService.updateConsent(virtualUserId, consentGiven, dataRetentionPolicy);
    
    logger.info({ virtualUserId, consentGiven }, 'Virtual user consent updated');
    
    res.json({
      success: true,
      consentGiven,
      dataRetentionPolicy
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Consent update failed');
    res.status(500).json({
      error: 'CONSENT_UPDATE_FAILED',
      message: 'Failed to update consent'
    });
  }
});

/**
 * GET /api/v1/virtual/profile
 * Get virtual user profile
 */
router.get('/profile', validateSession, async (req: Request, res: Response) => {
  try {
    const virtualUser = (req as any).virtualUser;
    
    const profile = await virtualUserManagerService.getVirtualUserProfile(virtualUser.id);
    
    // Get recent conversations
    const conversations = await prisma.virtualConversation.findMany({
      where: { virtualUserId: virtualUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Get memory statistics
    const memoryStats = await virtualMemoryAdapterService.getStatistics(virtualUser.id);
    
    res.json({
      success: true,
      profile,
      recentConversations: conversations,
      memoryStats
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to get profile');
    res.status(500).json({
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to get virtual user profile'
    });
  }
});

/**
 * GET /api/v1/virtual/memories
 * Get virtual user memories
 */
router.get('/memories', validateSession, async (req: Request, res: Response) => {
  try {
    const virtualUser = (req as any).virtualUser;
    const { type, category, tags, minImportance, limit, offset } = req.query;
    
    const memories = await virtualMemoryAdapterService.getMemories(virtualUser.id, {
      memoryType: type as any,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      minImportance: minImportance ? parseFloat(minImportance as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });
    
    res.json({
      success: true,
      memories,
      total: memories.length
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to get memories');
    res.status(500).json({
      error: 'MEMORIES_FETCH_FAILED',
      message: 'Failed to get memories'
    });
  }
});

/**
 * POST /api/v1/virtual/memories
 * Create a new memory
 */
router.post('/memories', validateSession, async (req: Request, res: Response) => {
  try {
    const parseResult = CreateMemoryRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const virtualUser = (req as any).virtualUser;
    const { content, summary, memoryType, category, subcategory, tags, importance, metadata } = parseResult.data;
    
    const memory = await virtualMemoryAdapterService.createMemory(virtualUser.id, {
      content,
      summary,
      memoryType,
      category,
      subcategory,
      tags,
      importance,
      metadata
    });
    
    // Update user's memory count
    await virtualUserManagerService.incrementMemoryCount(virtualUser.id);
    
    logger.info({ memoryId: memory.id, virtualUserId: virtualUser.id }, 'Virtual memory created');
    
    res.json({
      success: true,
      memory
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to create memory');
    res.status(500).json({
      error: 'MEMORY_CREATE_FAILED',
      message: 'Failed to create memory'
    });
  }
});

/**
 * GET /api/v1/virtual/conversations
 * Get virtual user conversations
 */
router.get('/conversations', validateSession, async (req: Request, res: Response) => {
  try {
    const virtualUser = (req as any).virtualUser;
    const { limit, offset } = req.query;
    
    const conversations = await prisma.virtualConversation.findMany({
      where: { virtualUserId: virtualUser.id },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 20,
      skip: offset ? parseInt(offset as string) : 0
    });
    
    res.json({
      success: true,
      conversations,
      total: conversations.length
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to get conversations');
    res.status(500).json({
      error: 'CONVERSATIONS_FETCH_FAILED',
      message: 'Failed to get conversations'
    });
  }
});

/**
 * POST /api/v1/virtual/conversations
 * Create a new conversation
 */
router.post('/conversations', validateSession, async (req: Request, res: Response) => {
  try {
    const parseResult = CreateConversationRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const virtualUser = (req as any).virtualUser;
    const { title, provider, model, metadata } = parseResult.data;
    
    const conversation = await prisma.virtualConversation.create({
      data: {
        virtualUserId: virtualUser.id,
        title: title || 'New Conversation',
        provider: provider || 'openai',
        model: model || 'gpt-4',
        metadata: metadata || {}
      }
    });
    
    // Update user's conversation count
    await virtualUserManagerService.incrementConversationCount(virtualUser.id);
    
    logger.info({ conversationId: conversation.id, virtualUserId: virtualUser.id }, 'Virtual conversation created');
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to create conversation');
    res.status(500).json({
      error: 'CONVERSATION_CREATE_FAILED',
      message: 'Failed to create conversation'
    });
  }
});

/**
 * POST /api/v1/virtual/chat
 * Send a message and get AI response with full context
 */
router.post('/chat', validateSession, async (req: Request, res: Response) => {
  try {
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const virtualUser = (req as any).virtualUser;
    const { message, conversationId, model, temperature, stream } = parseResult.data;
    
    // TODO: Implement full chat with context assembly
    // For now, return a simple response
    
    res.json({
      success: true,
      response: {
        message: 'Chat functionality with context assembly is under development',
        conversationId: conversationId || 'new'
      }
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Chat failed');
    res.status(500).json({
      error: 'CHAT_FAILED',
      message: 'Failed to process chat'
    });
  }
});

/**
 * POST /api/v1/virtual/merge
 * Merge two virtual users
 */
router.post('/merge', validateSession, async (req: Request, res: Response) => {
  try {
    const parseResult = MergeUsersRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request body',
        details: parseResult.error.errors
      });
    }
    
    const virtualUser = (req as any).virtualUser;
    const { sourceVirtualUserId, targetVirtualUserId, reason } = parseResult.data;
    
    // Verify the target user is the current user
    if (targetVirtualUserId !== virtualUser.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Can only merge into your own account'
      });
    }
    
    const result = await virtualUserManagerService.mergeVirtualUsers({
      sourceVirtualUserId,
      targetVirtualUserId,
      reason: reason || 'manual',
      sessionToken: (req as any).sessionToken
    });
    
    logger.info({ 
      sourceVirtualUserId, 
      targetVirtualUserId,
      reason 
    }, 'Virtual users merged');
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Merge failed');
    res.status(500).json({
      error: 'MERGE_FAILED',
      message: (error as Error).message
    });
  }
});

/**
 * DELETE /api/v1/virtual/account
 * Delete virtual user account
 */
router.delete('/account', validateSession, async (req: Request, res: Response) => {
  try {
    const virtualUser = (req as any).virtualUser;
    
    await virtualUserManagerService.deleteVirtualUser(virtualUser.id);
    
    // Clear session cookie
    res.clearCookie('virtual_session');
    
    logger.info({ virtualUserId: virtualUser.id }, 'Virtual user account deleted');
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Account deletion failed');
    res.status(500).json({
      error: 'DELETION_FAILED',
      message: 'Failed to delete account'
    });
  }
});

/**
 * GET /api/v1/virtual/export
 * Export all virtual user data (GDPR compliance)
 */
router.get('/export', validateSession, async (req: Request, res: Response) => {
  try {
    const virtualUser = (req as any).virtualUser;
    
    // Gather all user data
    const [user, memories, conversations, acus, notebooks] = await Promise.all([
      virtualUserManagerService.getVirtualUserById(virtualUser.id),
      virtualMemoryAdapterService.getMemories(virtualUser.id, { limit: 1000 }),
      prisma.virtualConversation.findMany({ where: { virtualUserId: virtualUser.id } }),
      prisma.virtualACU.findMany({ where: { virtualUserId: virtualUser.id }, take: 1000 }),
      prisma.virtualNotebook.findMany({ where: { virtualUserId: virtualUser.id } })
    ]);
    
    const exportData = {
      profile: user,
      memories,
      conversations,
      acus,
      notebooks,
      exportedAt: new Date().toISOString()
    };
    
    logger.info({ virtualUserId: virtualUser.id }, 'Virtual user data exported');
    
    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Export failed');
    res.status(500).json({
      error: 'EXPORT_FAILED',
      message: 'Failed to export data'
    });
  }
});

// Need to import prisma client
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export { router as virtualUserRoutes };
