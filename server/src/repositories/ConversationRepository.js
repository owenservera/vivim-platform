/**
 * Conversation Repository
 *
 * Data access layer for conversation operations
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { fileStorage } from '../lib/file-storage.js';
import { recordOperation } from '../services/sync-service.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create or update a conversation
 * @param {Object} data - Conversation data
 * @param {Object} userClient - Optional user-specific Prisma client
 * @returns {Promise<Object>} Created or updated conversation
 */
export async function createConversation(data, userClient = null) {
  const db = userClient || getPrismaClient();

  try {
    logger.debug({ sourceUrl: data.sourceUrl }, 'createConversation: Checking for existing record');
    const existing = await db.conversation.findUnique({
      where: { sourceUrl: data.sourceUrl },
    });

    if (existing) {
      logger.info({ id: existing.id, sourceUrl: data.sourceUrl }, 'createConversation: Found existing record');
    } else {
      logger.debug({ sourceUrl: data.sourceUrl }, 'createConversation: No existing record found');
    }

    const conversationData = {
      provider: data.provider,
      title: data.title,
      model: data.model,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt || new Date()),
      capturedAt: new Date(data.capturedAt || new Date()),
      
      messageCount: data.messageCount || data.stats?.totalMessages || data.messages?.length || 0,
      userMessageCount: data.userMessageCount || data.stats?.userMessageCount || 0,
      aiMessageCount: data.aiMessageCount || data.stats?.aiMessageCount || 0,
      totalWords: data.totalWords || data.stats?.totalWords || 0,
      totalCharacters: data.totalCharacters || data.stats?.totalCharacters || 0,
      totalTokens: data.totalTokens || data.stats?.totalTokens || null,
      totalCodeBlocks: data.totalCodeBlocks || data.stats?.totalCodeBlocks || 0,
      totalMermaidDiagrams: data.totalMermaidDiagrams || data.stats?.totalMermaidDiagrams || 0,
      totalImages: data.totalImages || data.stats?.totalImages || 0,
      totalTables: data.totalTables || data.stats?.totalTables || 0,
      totalLatexBlocks: data.totalLatexBlocks || data.stats?.totalLatexBlocks || 0,
      totalToolCalls: data.totalToolCalls || data.stats?.totalToolCalls || 0,
      
      metadata: data.metadata || {},
    };

    let conversation;
    let operationType;

    if (existing) {
      logger.info({ id: existing.id, sourceUrl: data.sourceUrl }, 'Updating existing conversation in database');
      
      await db.message.deleteMany({
        where: { conversationId: existing.id },
      });

      conversation = await db.conversation.update({
        where: { id: existing.id },
        data: {
          ...conversationData,
          messages: {
            create: (data.messages || []).map((msg, index) => ({
              id: msg.id,
              role: msg.role,
              author: msg.author,
              messageIndex: msg.messageIndex ?? index,
              parts: msg.parts || [],
              createdAt: new Date(msg.createdAt || msg.timestamp || new Date()),
              status: msg.status || 'completed',
              tokenCount: msg.tokenCount,
              metadata: msg.metadata || {},
            })),
          },
        },
      });
      operationType = 'UPDATE';
    } else {
      conversation = await db.conversation.create({
        data: {
          id: data.id,
          sourceUrl: data.sourceUrl,
          ...conversationData,
          messages: {
            create: (data.messages || []).map((msg, index) => ({
              id: msg.id,
              role: msg.role,
              author: msg.author,
              messageIndex: msg.messageIndex ?? index,
              parts: msg.parts || [],
              createdAt: new Date(msg.createdAt || msg.timestamp || new Date()),
              status: msg.status || 'completed',
              tokenCount: msg.tokenCount,
              metadata: msg.metadata || {},
            })),
          },
        },
      });
      logger.info({ id: conversation.id }, 'Conversation saved to database');
      operationType = 'INSERT';
    }
    
    return conversation;
  } catch (error) {
    if (error.message.includes('Can\'t reach database server')) {
       logger.warn('💾 [DATABASE OFFLINE] Saving conversation to local filesystem instead...');
       await fileStorage.saveConversation(data);
       logger.info('✅ [FS_STORAGE] Conversation saved to local file');
       return data;
    }
    logger.error({ error: error.message }, 'Failed to save conversation to DB');
    throw error;
  }
}

/**
 * Find conversation by ID
 * @param {string} id - Conversation ID
 * @returns {Promise<Object|null>} Conversation or null
 */
export async function findConversationById(id) {
  try {
    const conversation = await getPrismaClient().conversation.findUnique({
      where: { id },
      include: { messages: true },
    });

    return conversation;
  } catch (error) {
    logger.error({ error: error.message, id }, 'Failed to find conversation');
    throw error;
  }
}

/**
 * Find conversation by source URL
 * @param {string} sourceUrl - Source URL
 * @param {Object} userClient - Optional user-specific Prisma client
 * @returns {Promise<Object|null>} Conversation or null
 */
export async function findBySourceUrl(sourceUrl, userClient = null) {
  const db = userClient || getPrismaClient();
  
  try {
    const conversation = await db.conversation.findUnique({
      where: { sourceUrl },
    });

    return conversation;
  } catch (error) {
    logger.error({ error: error.message, sourceUrl }, 'Failed to find conversation');
    throw error;
  }
}

/**
 * List conversations with filters and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Conversations with pagination
 */
export async function listConversations(options = {}) {
  const {
    provider,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = 'desc',
    startDate,
    endDate,
  } = options;

  try {
    const where = {};

    // Filter by provider
    if (provider) {
      where.provider = provider;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
where.createdAt.gte = new Date(startDate);
}
      if (endDate) {
where.createdAt.lte = new Date(endDate);
}
    }

    const [conversations, total] = await Promise.all([
      getPrismaClient().conversation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { [orderBy]: orderDirection },
      }),
      getPrismaClient().conversation.count({ where }),
    ]);

    return {
      conversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + conversations.length < total,
      },
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to list conversations');
    throw error;
  }
}

/**
 * Update conversation
 * @param {string} id - Conversation ID
 * @param {Object} data - Update data
 * @returns {Promise<Object>} Updated conversation
 */
export async function updateConversation(id, data) {
  try {
    const conversation = await getPrismaClient().conversation.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    logger.info({ conversationId: id }, 'Conversation updated');

    return conversation;
  } catch (error) {
    logger.error({ error: error.message, id }, 'Failed to update conversation');
    throw error;
  }
}

/**
 * Delete conversation
 * @param {string} id - Conversation ID
 * @returns {Promise<Object>} Deleted conversation
 */
export async function deleteConversation(id) {
  try {
    const conversation = await getPrismaClient().conversation.delete({
      where: { id },
    });

    logger.info({ conversationId: id }, 'Conversation deleted');

    return conversation;
  } catch (error) {
    logger.error({ error: error.message, id }, 'Failed to delete conversation');
    throw error;
  }
}

/**
 * Add a message to an existing conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
export async function addMessageToConversation(conversationId, messageData) {
  return withTransaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({
      where: { id: conversationId },
      include: { _count: { select: { messages: true } } },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const messageIndex = messageData.messageIndex ?? conversation._count.messages;

    const message = await tx.message.create({
      data: {
        id: messageData.id || uuidv4(),
        conversationId,
        role: messageData.role,
        author: messageData.author,
        messageIndex,
        parts: messageData.parts || [],
        createdAt: new Date(messageData.createdAt || new Date()),
        status: messageData.status || 'completed',
        finishReason: messageData.finishReason,
        tokenCount: messageData.tokenCount,
        metadata: messageData.metadata || {},
      },
    });

    // Update conversation stats
    const isUser = messageData.role === 'user';
    const isAi = messageData.role === 'assistant';

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        messageCount: { increment: 1 },
        userMessageCount: isUser ? { increment: 1 } : undefined,
        aiMessageCount: isAi ? { increment: 1 } : undefined,
        totalTokens: messageData.tokenCount ? { increment: messageData.tokenCount } : undefined,
      },
    });

    // Record sync operation for the new message
    await recordOperation({
      entityType: 'message',
      entityId: message.id,
      operation: 'INSERT',
      payload: message,
      tableName: 'messages',
      recordId: message.id,
    }, tx);

    return message;
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Create multiple conversations in a transaction
 * @param {Array} conversations - Array of conversation data
 * @returns {Promise<Array>} Created conversations
 */
export async function createConversationsBatch(conversations) {
  return withTransaction(async (tx) => {
    const created = [];

    for (const data of conversations) {
      const conversation = await tx.conversation.create({
        data: {
          id: data.id,
          provider: data.provider,
          sourceUrl: data.sourceUrl,
          title: data.title,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt || new Date()),
          capturedAt: new Date(data.capturedAt || new Date()),
          messageCount: data.messageCount || data.stats?.totalMessages || 0,
          userMessageCount: data.userMessageCount || data.stats?.userMessageCount || 0,
          aiMessageCount: data.aiMessageCount || data.stats?.aiMessageCount || 0,
          totalWords: data.totalWords || data.stats?.totalWords || 0,
          totalCharacters: data.totalCharacters || data.stats?.totalCharacters || 0,
          totalCodeBlocks: data.totalCodeBlocks || data.stats?.totalCodeBlocks || 0,
          totalMermaidDiagrams: data.totalMermaidDiagrams || data.stats?.totalMermaidDiagrams || 0,
          totalImages: data.totalImages || data.stats?.totalImages || 0,
          totalTables: data.totalTables || data.stats?.totalTables || 0,
          metadata: data.metadata || {},
          messages: {
            create: (data.messages || []).map((msg, index) => ({
              id: msg.id,
              role: msg.role,
              author: msg.author,
              messageIndex: msg.messageIndex ?? index,
              parts: msg.parts || [],
              createdAt: new Date(msg.createdAt || new Date()),
              status: msg.status || 'completed',
              metadata: msg.metadata || {},
            })),
          },
        },
      });

      created.push(conversation);
    }

    logger.info({ count: created.length }, 'Batch conversations created');

    return created;
  });
}

// ============================================================================
// AGGREGATION QUERIES
// ============================================================================

/**
 * Get conversation statistics by provider
 * @returns {Promise<Array>} Provider statistics
 */
export async function getStatsByProvider() {
  try {
    const stats = await getPrismaClient().conversation.groupBy({
      by: ['provider'],
      _count: { id: true },
      _avg: {
        messageCount: true,
        totalWords: true,
      },
      orderBy: { _count: { id: 'desc' } },
    });

    return stats.map((stat) => ({
      provider: stat.provider,
      count: stat._count.id,
      avgMessageCount: stat._avg.messageCount || 0,
      avgWords: stat._avg.totalWords || 0,
    }));
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get provider stats');
    throw error;
  }
}

/**
 * Get recent conversations
 * @param {number} limit - Number of conversations to return
 * @returns {Promise<Array>} Recent conversations
 */
export async function getRecentConversations(limit = 10) {
  try {
    const conversations = await getPrismaClient().conversation.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return conversations;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get recent conversations');
    throw error;
  }
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search conversations by title
 * @param {string} query - Search query
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Matching conversations
 */
export async function searchByTitle(query, options = {}) {
  const { limit = 20, provider } = options;

  try {
    const conversations = await getPrismaClient().conversation.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
        ...(provider && { provider }),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return conversations;
  } catch (error) {
    logger.error({ error: error.message, query }, 'Search failed');
    throw error;
  }
}

export default {
  createConversation,
  findConversationById,
  findBySourceUrl,
  listConversations,
  updateConversation,
  deleteConversation,
  createConversationsBatch,
  getStatsByProvider,
  getRecentConversations,
  searchByTitle,
};
