// apps/server/src/services/ai-storage-service.js

import {
  createConversation,
  addMessageToConversation,
  findConversationById,
} from '../repositories/ConversationRepository.js';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { librarianWorker } from '../context/librarian-worker.js';

const prisma = getPrismaClient();

// Configuration for idle detection
const IDLE_TIMEOUT_MINUTES = parseInt(process.env.CONVERSATION_IDLE_TIMEOUT_MINUTES || '5', 10);
const ENABLE_IDLE_DETECTION = process.env.ENABLE_IDLE_DETECTION === 'true';

/**
 * AI Storage Service
 *
 * Orchestrates persisting AI chat sessions to the database using existing repositories.
 * Uses context builder for intelligent conversation context extraction.
 */
export class AiStorageService {
  /**
   * Start a new AI conversation in the database
   */
  async startConversation(data) {
    const { provider, model, ownerId, title = 'New AI Chat', initialMessages = [] } = data;

    const conversationId = uuidv4();
    const sourceUrl = `internal://chat/${conversationId}`;

    logger.info({ conversationId, provider, model }, 'Starting new AI conversation storage');

    const conversationData = {
      id: conversationId,
      provider,
      sourceUrl,
      title,
      model,
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      capturedAt: new Date().toISOString(),
      messages: initialMessages.map((msg, index) => ({
        id: uuidv4(),
        role: msg.role,
        parts: Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }],
        messageIndex: index,
        createdAt: new Date().toISOString(),
      })),
      metadata: {
        isInternalChat: true,
        aiGenerated: true,
      },
    };

    const conversation = await createConversation(conversationData);

    // Link conversation to topics from initial messages
    if (initialMessages.length > 0 && ownerId) {
      const allContent = initialMessages.map((m) => m.content || '').join(' ');
      await this.linkTopicsToConversation(conversationId, ownerId, allContent);
    }

    return conversation;
  }

  /**
   * Append a message to an existing conversation
   */
  async appendMessage(conversationId, message) {
    logger.debug({ conversationId, role: message.role }, 'Appending message to AI conversation');

    const result = await addMessageToConversation(conversationId, {
      role: message.role,
      parts: Array.isArray(message.content)
        ? message.content
        : [{ type: 'text', text: message.content }],
      status: message.status || 'completed',
      finishReason: message.finishReason,
      tokenCount: message.tokenCount,
      metadata: message.metadata || {},
    });

    // Link topics from new message content
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { ownerId: true, updatedAt: true },
      });

      if (conversation?.ownerId) {
        const content = message.content || '';
        await this.linkTopicsToConversation(conversationId, conversation.ownerId, content);
      }

      // Invalidate context bundle for this conversation
      await this.invalidateConversationContext(conversationId);

      // Check if conversation is idle and trigger librarian for assistant messages
      if (ENABLE_IDLE_DETECTION && message.role === 'assistant') {
        await this.checkAndTriggerLibrarian(conversationId, conversation);
      }
    } catch (e) {
      logger.warn({ error: e.message }, 'Failed to link topics or invalidate context');
    }

    return result;
  }

  /**
   * Check if conversation is idle and trigger librarian worker
   * Conversation is considered idle when no user activity for IDLE_TIMEOUT_MINUTES
   */
  async checkAndTriggerLibrarian(conversationId, conversation) {
    if (!conversation?.updatedAt) {
      logger.debug({ conversationId }, 'No updatedAt timestamp, skipping librarian trigger');
      return;
    }

    const now = new Date();
    const lastActivity = new Date(conversation.updatedAt);
    const minutesSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60);

    if (minutesSinceActivity >= IDLE_TIMEOUT_MINUTES) {
      logger.info(
        {
          conversationId,
          minutesSinceActivity: Math.round(minutesSinceActivity),
        },
        'Conversation is idle, triggering librarian worker'
      );

      try {
        await librarianWorker.onConversationIdle(conversationId);
        logger.info({ conversationId }, 'Librarian worker triggered successfully');
      } catch (error) {
        logger.error(
          { conversationId, error: error.message },
          'Failed to trigger librarian worker'
        );
      }
    } else {
      logger.debug(
        {
          conversationId,
          minutesSinceActivity: Math.round(minutesSinceActivity),
        },
        'Conversation is still active, skipping librarian trigger'
      );
    }
  }

  /**
   * Extract keywords from content and link to conversation
   */
  async linkTopicsToConversation(conversationId, userId, content) {
    if (!content || !userId) {
      return;
    }

    // Simple keyword extraction (can be enhanced with NLP)
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    // Get unique keywords (frequency-based)
    const wordFreq = {};
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }

    // Sort by frequency and take top keywords
    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    for (const keyword of topKeywords) {
      // Find or create topic profile
      let topicProfile = await prisma.topicProfile.findUnique({
        where: { userId_slug: { userId, slug: keyword } },
      });

      if (!topicProfile) {
        // Create topic profile with default values
        topicProfile = await prisma.topicProfile.create({
          data: {
            userId,
            slug: keyword,
            label: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            domain: 'ai-generated',
            importanceScore: 0.3,
            embedding: new Array(768).fill(0), // Placeholder embedding
            firstEngagedAt: new Date(),
            lastEngagedAt: new Date(),
          },
        });
      }

      // Link conversation to topic (if not already linked)
      await prisma.topicConversation.upsert({
        where: {
          topicId_conversationId: {
            topicId: topicProfile.id,
            conversationId,
          },
        },
        update: {
          relevanceScore: { increment: 0.05 },
        },
        create: {
          topicId: topicProfile.id,
          conversationId,
          relevanceScore: 0.3,
        },
      });

      // Update topic engagement stats
      await prisma.topicProfile.update({
        where: { id: topicProfile.id },
        data: {
          totalConversations: { increment: 1 },
          lastEngagedAt: new Date(),
        },
      });
    }
  }

  /**
   * Invalidate context bundle when conversation changes
   */
  async invalidateConversationContext(conversationId) {
    try {
      await prisma.contextBundle.updateMany({
        where: {
          conversationId,
          bundleType: 'conversation',
        },
        data: { isDirty: true },
      });
      logger.debug({ conversationId }, 'Invalidated conversation context bundle');
    } catch (e) {
      logger.warn({ error: e.message }, 'Failed to invalidate context bundle');
    }
  }

  /**
   * Get context for AI completion
   */
  async getContextForCompletion(conversationId, options = {}) {
    const { strategy, model, maxTokens, maxMessages } = options;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { messageIndex: 'asc' },
          take: maxMessages || 50,
        },
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Get context bundles for this conversation
    const whereClause = conversation.ownerId
      ? {
          OR: [{ conversationId }, { userId: conversation.ownerId }],
        }
      : { conversationId };

    const bundles = await prisma.contextBundle.findMany({
      where: whereClause,
      orderBy: { compiledAt: 'desc' },
    });

    // Format messages for AI
    const messages = conversation.messages.map((m) => ({
      role: m.role,
      content: Array.isArray(m.parts)
        ? m.parts.map((p) => p.text || p.content || '').join('')
        : m.parts,
    }));

    return {
      messages,
      stats: {
        totalMessages: conversation.messageCount,
        totalTokens: conversation.totalTokens || 0,
        bundlesCount: bundles.length,
        contextTokens: bundles.reduce((sum, b) => sum + b.tokenCount, 0),
      },
      bundles: bundles.map((b) => ({
        type: b.bundleType,
        content: b.compiledPrompt,
        tokens: b.tokenCount,
      })),
    };
  }

  /**
   * Fork a conversation to start a new chat with intelligent context
   */
  async forkConversation(sourceId, prompt, ownerId, provider, model, options = {}) {
    logger.info({ sourceId, ownerId }, 'Forking conversation with intelligent context');

    const sourceConversation = await findConversationById(sourceId);
    if (!sourceConversation) {
      throw new Error(`Source conversation ${sourceId} not found`);
    }

    const forkedConversation = await this.startConversation({
      provider,
      model,
      ownerId,
      title: `Forked: ${sourceConversation.title}`,
      initialMessages: [...(sourceConversation.messages || []), { role: 'user', content: prompt }],
    });

    logger.info(
      {
        sourceId,
        forkedId: forkedConversation.id,
        messageCount: forkedConversation.messages?.length || 0,
      },
      'Successfully forked conversation'
    );

    return forkedConversation;
  }
}

export const aiStorageService = new AiStorageService();
