/**
 * Chatbot Routes
 * 
 * API endpoints for company chatbot:
 * - Virtual user identification
 * - Chat with dual-engine orchestration
 * - Conversation history
 * - Feedback
 * 
 * @created March 27, 2026
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const router = Router();
const prisma = new PrismaClient();

// Middleware: Virtual user auto-auth
const virtualUserAutoAuth = async (req: Request, res: Response, next: Function) => {
  const sessionToken = req.headers['x-session-token'] as string;
  const virtualUserId = req.headers['x-virtual-user-id'] as string;

  if (!sessionToken && !virtualUserId) {
    return res.status(401).json({ error: 'Session token or virtual user ID required' });
  }

  try {
    let virtualUser;

    if (sessionToken) {
      // Validate session
      const session = await prisma.virtualSession.findUnique({
        where: { sessionToken },
        include: { virtualUser: true },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }

      virtualUser = session.virtualUser;
    } else if (virtualUserId) {
      virtualUser = await prisma.virtualUser.findUnique({
        where: { id: virtualUserId },
      });

      if (!virtualUser) {
        return res.status(404).json({ error: 'Virtual user not found' });
      }
    }

    (req as any).virtualUser = virtualUser;
    next();
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Virtual user auth failed');
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * POST /api/v1/chatbot/:tenantSlug/identify
 * Identify or create virtual user for chatbot
 */
router.post('/:tenantSlug/identify', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { fingerprint, signals, existingSessionToken } = req.body;

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Try existing session first
    if (existingSessionToken) {
      const session = await prisma.virtualSession.findUnique({
        where: { sessionToken: existingSessionToken },
        include: { virtualUser: true },
      });

      if (session && session.isActive && session.expiresAt > new Date()) {
        // Update last activity
        await prisma.virtualSession.update({
          where: { id: session.id },
          data: { lastActivityAt: new Date() },
        });

        return res.json({
          virtualUserId: session.virtualUserId,
          sessionToken: existingSessionToken,
          identification: {
            confidence: 95,
            level: 'HIGH',
            isExisting: true,
          },
          profile: {
            displayName: session.virtualUser.displayName,
            conversationCount: session.virtualUser.conversationCount,
            memoryCount: session.virtualUser.memoryCount,
            firstSeenAt: session.virtualUser.firstSeenAt,
            lastSeenAt: session.virtualUser.lastSeenAt,
          },
          consentRequired: !session.virtualUser.consentGiven,
          isNewUser: false,
        });
      }
    }

    // Search for existing user by fingerprint
    const existingUser = await prisma.virtualUser.findUnique({
      where: { fingerprint },
    });

    if (existingUser) {
      // Create new session
      const session = await createSession(existingUser.id, fingerprint);

      return res.json({
        virtualUserId: existingUser.id,
        sessionToken: session.sessionToken,
        identification: {
          confidence: 85,
          level: 'HIGH',
          isExisting: true,
        },
        profile: {
          displayName: existingUser.displayName,
          conversationCount: existingUser.conversationCount,
          memoryCount: existingUser.memoryCount,
          firstSeenAt: existingUser.firstSeenAt,
          lastSeenAt: existingUser.lastSeenAt,
        },
        consentRequired: !existingUser.consentGiven,
        isNewUser: false,
      });
    }

    // Create new virtual user
    const newUser = await prisma.virtualUser.create({
      data: {
        fingerprint,
        displayName: generateDisplayName(),
        fingerprintSignals: signals || {},
        tenantId: tenant.id,
        consentGiven: false,
      },
    });

    // Create session
    const session = await createSession(newUser.id, fingerprint);

    logger.info({ virtualUserId: newUser.id, tenantId: tenant.id }, 'New virtual user created');

    res.json({
      virtualUserId: newUser.id,
      sessionToken: session.sessionToken,
      identification: {
        confidence: 100,
        level: 'HIGH',
        isExisting: false,
      },
      profile: {
        displayName: newUser.displayName,
        conversationCount: 0,
        memoryCount: 0,
        firstSeenAt: newUser.firstSeenAt,
        lastSeenAt: newUser.lastSeenAt,
      },
      consentRequired: true,
      isNewUser: true,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Virtual user identification failed');
    res.status(500).json({
      error: 'Identification failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/chatbot/:tenantSlug/consent
 * Provide consent for data storage
 */
router.post('/:tenantSlug/consent', async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const { virtualUserId, sessionToken, consentGiven, dataRetentionPolicy } = req.body;

    if (consentGiven === undefined) {
      return res.status(400).json({ error: 'consentGiven required' });
    }

    await prisma.virtualUser.update({
      where: { id: virtualUserId },
      data: {
        consentGiven,
        consentTimestamp: consentGiven ? new Date() : null,
        dataRetentionPolicy: dataRetentionPolicy || '90_days',
      },
    });

    logger.info({ virtualUserId, consentGiven }, 'Consent updated');

    res.json({
      status: 'updated',
      consentGiven,
      dataRetentionPolicy: dataRetentionPolicy || '90_days',
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Consent update failed');
    res.status(500).json({
      error: 'Consent update failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/chatbot/:tenantSlug/chat
 * Chat with dual-engine orchestration
 */
router.post('/:tenantSlug/chat', virtualUserAutoAuth, async (req: Request, res: Response) => {
  try {
    const { tenantSlug } = req.params;
    const virtualUserId = (req as any).virtualUser.id;
    const { message, conversationId, modelId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get or create conversation
    let conv = conversationId
      ? await prisma.virtualConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
        })
      : null;

    if (!conv) {
      conv = await prisma.virtualConversation.create({
        data: {
          virtualUserId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          metadata: {},
        },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
      });
    }

    // Add user message
    await prisma.virtualMessage.create({
      data: {
        conversationId: conv.id,
        role: 'user',
        content: message,
      },
    });

    // TODO: Integrate with DualEngineOrchestrator
    // For now, return a placeholder response
    const response = {
      role: 'assistant' as const,
      content: `Thank you for your message: "${message}". This is a placeholder response. The dual-engine orchestrator integration is pending.`,
    };

    // Add assistant response
    await prisma.virtualMessage.create({
      data: {
        conversationId: conv.id,
        role: 'assistant',
        content: response.content,
        metadata: {
          modelId: modelId || tenant.defaultModel,
        },
      },
    });

    // Update conversation
    await prisma.virtualConversation.update({
      where: { id: conv.id },
      data: {
        messageCount: { increment: 2 },
        metadata: {
          lastMessageAt: new Date().toISOString(),
        },
      },
    });

    res.json({
      response,
      conversationId: conv.id,
      context: {
        avatar: (req as any).virtualUser.currentAvatar || 'STRANGER',
        corpusConfidence: 0.8,
        citations: [],
        engineWeights: { corpus: 0.7, user: 0.3 },
        proactiveInsights: 0,
      },
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Chat failed');
    res.status(500).json({
      error: 'Chat failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/chatbot/:tenantSlug/history
 * Get conversation history
 */
router.get('/:tenantSlug/history', virtualUserAutoAuth, async (req: Request, res: Response) => {
  try {
    const virtualUserId = (req as any).virtualUser.id;
    const { limit = 20, offset = 0 } = req.query;

    const conversations = await prisma.virtualConversation.findMany({
      where: { virtualUserId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.virtualConversation.count({
      where: { virtualUserId },
    });

    res.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c.messageCount,
        createdAt: c.createdAt,
        lastMessageAt: c.metadata?.lastMessageAt || c.createdAt,
        preview: c.messages.slice(0, 2).map((m: any) => m.content).join(' '),
      })),
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
      },
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'History fetch failed');
    res.status(500).json({
      error: 'History fetch failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/chatbot/:tenantSlug/feedback
 * Submit feedback for a response
 */
router.post('/:tenantSlug/feedback', virtualUserAutoAuth, async (req: Request, res: Response) => {
  try {
    const { conversationId, messageId, thumbsUp, comment } = req.body;

    if (thumbsUp === undefined) {
      return res.status(400).json({ error: 'thumbsUp required' });
    }

    // Update message with feedback
    await prisma.virtualMessage.update({
      where: { id: messageId },
      data: {
        metadata: {
          thumbsUp,
          comment,
          feedbackAt: new Date().toISOString(),
        },
      },
    });

    logger.info({ messageId, thumbsUp }, 'Feedback submitted');

    res.json({
      status: 'submitted',
      messageId,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Feedback submission failed');
    res.status(500).json({
      error: 'Feedback submission failed',
      message: (error as Error).message,
    });
  }
});

/**
 * Helper: Create session for virtual user
 */
async function createSession(virtualUserId: string, fingerprint: string) {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session = await prisma.virtualSession.create({
    data: {
      virtualUserId,
      sessionToken,
      fingerprint,
      expiresAt,
      isActive: true,
    },
  });

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
  };
}

/**
 * Helper: Generate display name for new virtual users
 */
function generateDisplayName(): string {
  const adjectives = ['Curious', 'Friendly', 'Smart', 'Creative', 'Thoughtful', 'Enthusiastic'];
  const nouns = ['Explorer', 'Learner', 'Thinker', 'Creator', 'Seeker', 'Dreamer'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 10000);

  return `${adj} ${noun} #${num}`;
}

// Import crypto for session token generation
import * as crypto from 'crypto';

export { router as chatbotRoutes };
