/**
 * ACU to Memory Auto-Conversion Pipeline
 *
 * Automatically converts high-quality ACUs to memories for the second brain.
 */

import { getPrismaClient } from '../lib/database.js';
import { getContextEventBus } from '../context/index.js';
import { logger, createOperationLogger } from '../lib/logger.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

const prisma = getPrismaClient();
const eventBus = getContextEventBus();

const CONVERSION_THRESHOLDS = {
  minQualityScore: 0.7,
  minEngagementScore: 3,
  minWordCount: 50,
  maxAgeDays: 30,
};

const BATCH_SIZE = 50;

interface ConversionResult {
  success: boolean;
  memoryId?: string;
  error?: string;
}

export async function convertACUToMemory(
  acuId: string,
  options: {
    category?: string;
    importance?: number;
    force?: boolean;
  } = {}
): Promise<ConversionResult> {
  const operationLog = createOperationLogger('convertACUToMemory', { acuId, options });
  operationLog.debug({ msg: 'Starting ACU to memory conversion', acuId });

  try {
    const acu = await prisma.atomicChatUnit.findUnique({
      where: { id: acuId },
      include: {
        conversation: {
          include: {
            topicConversations: { include: { topic: true } },
            entityConversations: { include: { entity: true } },
          },
        },
      },
    });

    if (!acu) {
      operationLog.warn({ msg: 'ACU not found', acuId });
      return { success: false, error: 'ACU not found' };
    }

    if (!options.force) {
      const existingMemory = await prisma.memory.findFirst({
        where: { userId: acu.authorDid, sourceAcuId: acuId },
      });

      if (existingMemory) {
        operationLog.debug({ msg: 'Already converted', memoryId: existingMemory.id });
        return { success: true, memoryId: existingMemory.id };
      }
    }

    let category = options.category;
    if (!category && acu.conversation?.topicConversations?.length > 0) {
      category = acu.conversation.topicConversations[0].topic.slug;
    }
    category = category || 'general';

    const importance = options.importance ?? (await calculateImportance(acu));

    const relationships: string[] = [];
    if (acu.conversation?.entityConversations) {
      for (const ec of acu.conversation.entityConversations) {
        relationships.push(ec.entity.id);
      }
    }

    const memory = await prisma.memory.create({
      data: {
        userId: acu.authorDid,
        content: acu.content,
        category: category.toLowerCase(),
        importance,
        sourceAcuId: acuId,
        sourceConversationId: acu.conversationId,
        isActive: true,
        relationships,
      },
    });

    operationLog.info({ msg: 'ACU converted to memory', memoryId: memory.id, category });

    eventBus.emit('memory:created', acu.authorDid, {
      memoryId: memory.id,
      sourceAcuId: acuId,
      type: 'acu_conversion',
    });

    await serverErrorReporter.reportInfo(
      `ACU converted to memory: ${acuId}`,
      { memoryId: memory.id, category },
      operationLog.operationId
    );

    return { success: true, memoryId: memory.id };
  } catch (error) {
    operationLog.error({ msg: 'Failed to convert ACU to memory', error: (error as Error).message });
    await serverErrorReporter.reportServerError(
      'convertACUToMemory failed',
      error as Error,
      { acuId },
      'high',
      operationLog.operationId
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function processEngagementConversion(userId: string): Promise<{
  processed: number;
  converted: number;
  errors: number;
}> {
  const operationLog = createOperationLogger('processEngagementConversion', { userId });
  operationLog.debug({ msg: 'Processing engagement conversion', userId });

  let processed = 0;
  let converted = 0;
  let errors = 0;

  try {
    const highEngagementACUs = await prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        author_did: string;
        quality_overall: number;
        created_at: Date;
      }>
    >`
      SELECT 
        acu.id,
        acu.content,
        acu.author_did,
        acu.quality_overall,
        acu.created_at
      FROM atomic_chat_units acu
      JOIN user_interactions ui ON acu.id = ui.content_id
      WHERE ui.user_id = ${userId}
        AND ui.action IN ('like', 'bookmark', 'share')
        AND acu.quality_overall >= ${CONVERSION_THRESHOLDS.minQualityScore}
        AND LENGTH(acu.content) >= ${CONVERSION_THRESHOLDS.minWordCount}
        AND acu.created_at > NOW() - INTERVAL '${CONVERSION_THRESHOLDS.maxAgeDays} days'
      GROUP BY acu.id, acu.content, acu.author_did, acu.quality_overall, acu.created_at
      HAVING COUNT(ui.id) >= ${CONVERSION_THRESHOLDS.minEngagementScore}
      LIMIT ${BATCH_SIZE}
    `;

    operationLog.debug({ msg: 'Found high engagement ACUs', count: highEngagementACUs.length });

    for (const acu of highEngagementACUs) {
      processed++;
      const result = await convertACUToMemory(acu.id);
      if (result.success) {
        converted++;
      } else {
        errors++;
      }
    }

    operationLog.info({ msg: 'Engagement conversion complete', processed, converted, errors });

    return { processed, converted, errors };
  } catch (error) {
    operationLog.error({ msg: 'Engagement conversion failed', error: (error as Error).message });
    await serverErrorReporter.reportServerError(
      'processEngagementConversion failed',
      error as Error,
      { userId },
      'high',
      operationLog.operationId
    );
  }

  return { processed, converted, errors };
}

export async function runPeriodicConsolidation(): Promise<{
  processed: number;
  converted: number;
}> {
  const operationLog = createOperationLogger('runPeriodicConsolidation');
  operationLog.debug({ msg: 'Starting periodic consolidation' });

  let processed = 0;
  let converted = 0;

  try {
    const eligibleACUs = await prisma.$queryRaw<
      Array<{
        id: string;
        author_did: string;
      }>
    >`
      SELECT DISTINCT acu.id, acu.author_did
      FROM atomic_chat_units acu
      WHERE acu.quality_overall >= ${CONVERSION_THRESHOLDS.minQualityScore}
        AND LENGTH(acu.content) >= ${CONVERSION_THRESHOLDS.minWordCount}
        AND acu.created_at > NOW() - INTERVAL '${CONVERSION_THRESHOLDS.maxAgeDays} days'
        AND NOT EXISTS (
          SELECT 1 FROM memories m 
          WHERE m.source_ac_uid = acu.id
        )
      ORDER BY acu.quality_overall DESC
      LIMIT ${BATCH_SIZE}
    `;

    operationLog.debug({ msg: 'Found eligible ACUs', count: eligibleACUs.length });

    for (const acu of eligibleACUs) {
      processed++;
      const result = await convertACUToMemory(acu.id);
      if (result.success) {
        converted++;
      }
    }

    operationLog.info({ msg: 'Periodic consolidation complete', processed, converted });
  } catch (error) {
    operationLog.error({ msg: 'Periodic consolidation failed', error: (error as Error).message });
    await serverErrorReporter.reportServerError(
      'runPeriodicConsolidation failed',
      error as Error,
      {},
      'medium',
      operationLog.operationId
    );
  }

  return { processed, converted };
}

async function calculateImportance(acu: any): Promise<number> {
  let score = 0.5;

  if (acu.qualityOverall) {
    score += (acu.qualityOverall - 0.5) * 0.3;
  }

  const engagementCount = await prisma.userInteraction.count({
    where: {
      contentId: acu.id,
      action: { in: ['like', 'bookmark', 'share', 'comment'] },
    },
  });
  score += Math.min(0.2, engagementCount * 0.05);

  const wordCount = acu.content?.split(/\s+/).length || 0;
  if (wordCount > 200) score += 0.1;
  if (wordCount > 500) score += 0.1;

  return Math.min(1, Math.max(0, score));
}

export async function convertConversationToMemories(conversationId: string): Promise<{
  success: boolean;
  memoriesCreated: number;
  error?: string;
}> {
  const operationLog = createOperationLogger('convertConversationToMemories', { conversationId });
  operationLog.debug({ msg: 'Converting conversation to memories', conversationId });

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        atomicChatUnits: {
          where: { qualityOverall: { gte: CONVERSION_THRESHOLDS.minQualityScore } },
          orderBy: { messageIndex: 'asc' },
        },
      },
    });

    if (!conversation) {
      operationLog.warn({ msg: 'Conversation not found' });
      return { success: false, error: 'Conversation not found', memoriesCreated: 0 };
    }

    let memoriesCreated = 0;

    for (const acu of conversation.atomicChatUnits) {
      const result = await convertACUToMemory(acu.id);
      if (result.success) {
        memoriesCreated++;
      }
    }

    operationLog.info({ msg: 'Conversation converted', memoriesCreated });

    return { success: true, memoriesCreated };
  } catch (error) {
    operationLog.error({ msg: 'Conversation conversion failed', error: (error as Error).message });
    await serverErrorReporter.reportServerError(
      'convertConversationToMemories failed',
      error as Error,
      { conversationId },
      'high',
      operationLog.operationId
    );
    return { success: false, error: (error as Error).message, memoriesCreated: 0 };
  }
}

export async function getConversionStats(userId: string): Promise<{
  totalMemories: number;
  fromACU: number;
  recentConversions: number;
  topCategories: Array<{ category: string; count: number }>;
}> {
  const operationLog = createOperationLogger('getConversionStats', { userId });

  try {
    const [totalMemories, fromACU, recentConversions, topCategories] = await Promise.all([
      prisma.memory.count({ where: { userId, isActive: true } }),
      prisma.memory.count({ where: { userId, sourceAcuId: { not: null } } }),
      prisma.memory.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.memory.groupBy({
        by: ['category'],
        where: { userId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    operationLog.debug({
      msg: 'Retrieved conversion stats',
      totalMemories,
      fromACU,
      recentConversions,
    });

    return {
      totalMemories,
      fromACU,
      recentConversions,
      topCategories: topCategories.map((c) => ({ category: c.category, count: c._count.id })),
    };
  } catch (error) {
    operationLog.error({ msg: 'Failed to get conversion stats', error: (error as Error).message });
    return { totalMemories: 0, fromACU: 0, recentConversions: 0, topCategories: [] };
  }
}

eventBus.on('feed:engagement', async (userId, event) => {
  const operationLog = createOperationLogger('feedEngagementListener', {
    userId,
    action: event.action,
  });
  operationLog.debug({ msg: 'Feed engagement event received', action: event.action });

  if (event.action === 'bookmark' || event.action === 'like') {
    await processEngagementConversion(userId);
  }
});

eventBus.on('memory:extract_from_feed', async (userId, event) => {
  const operationLog = createOperationLogger('memoryExtractListener', {
    userId,
    contentId: event.contentId,
  });
  operationLog.debug({ msg: 'Memory extract event received', contentId: event.contentId });

  if (event.contentType === 'acu' || event.contentType === 'conversation') {
    await convertACUToMemory(event.contentId);
  }
});

export const acuMemoryPipeline = {
  convertACUToMemory,
  processEngagementConversion,
  runPeriodicConsolidation,
  convertConversationToMemories,
  getConversionStats,
};

export default acuMemoryPipeline;
