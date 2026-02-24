/**
 * Memory Consolidation Worker
 *
 * Consumes the 'consolidation' queue to:
 * 1. Summarize finished conversations
 * 2. Generate embeddings for Memories
 * 3. Store them in PostgreSQL with pgvector for semantic search
 */

import { queueService } from '../services/queue-service.js';
import { aiService } from '../services/ai-service.js';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = getPrismaClient();

// Worker logic: Process a 'Consolidate Conversation' job
export const processConsolidationJob = async (conversationId) => {
  logger.info({ conversationId }, 'Processing consolidation job');

  try {
    // 1. Fetch Conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Generate Summary (Episodic Memory)
    const summary = await aiService.summarizeConversation(conversation);
    logger.debug({ conversationId, summaryLen: summary.length }, 'Summary generated');

    // 3. Generate Embedding
    const embeddings = await aiService.generateEmbeddings(summary);
    if (embeddings.length === 0) {
      throw new Error('Failed to generate embedding');
    }

    // 4. Create Memory Record with embedding stored in PostgreSQL
    const memory = await prisma.memory.create({
      data: {
        id: uuidv4(),
        userId: conversation.ownerId || 'default-user',
        content: summary,
        type: 'EPISODIC',
        category: null,
        importance: 0.5,
        embedding: embeddings[0],
        sourceConversationIds: [conversationId],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 5. Mark Conversation as 'Processed'
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { state: 'ARCHIVED' },
    });

    logger.info({ memoryId: memory.id }, 'Consolidation complete');
  } catch (error) {
    logger.error({ conversationId, error: error.message }, 'Consolidation failed');
    throw error;
  }
};

// Register the worker
queueService.getQueue('consolidation').on('active', (job) => {
  // Logic handled in queue-service wrapper
});

// Helper to trigger consolidation
export const scheduleConsolidation = (conversationId) => {
  return queueService.add('consolidation', () => processConsolidationJob(conversationId));
};
