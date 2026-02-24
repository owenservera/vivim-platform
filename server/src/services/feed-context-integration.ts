/**
 * Feed-Context Integration Service
 *
 * Bridges the gap between feed engagement and context generation.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger, createOperationLogger } from '../lib/logger.js';
import { getContextEventBus } from '../context/index.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

const prisma = getPrismaClient();
const eventBus = getContextEventBus();

interface FeedEngagementEvent {
  userId: string;
  contentId: string;
  contentType: 'acu' | 'conversation' | 'memory';
  action: 'view' | 'like' | 'comment' | 'share' | 'bookmark' | 'dismiss';
  metadata?: {
    duration?: number;
    completionRate?: number;
    source?: string;
    timeOfDay?: number;
  };
}

interface TopicAffinityUpdate {
  userId: string;
  topicSlug: string;
  delta: number;
}

interface EntityAffinityUpdate {
  userId: string;
  entityId: string;
  delta: number;
}

const ENGAGEMENT_WEIGHTS = {
  view: 0.1,
  like: 0.3,
  comment: 0.5,
  share: 0.7,
  bookmark: 1.0,
  dismiss: -0.2,
};

const TOPIC_AFFINITY_DECAY = 0.95;
const MIN_AFFINITY_THRESHOLD = 0.01;

export async function processFeedEngagement(event: FeedEngagementEvent): Promise<{
  success: boolean;
  topicsUpdated?: TopicAffinityUpdate[];
  entitiesUpdated?: EntityAffinityUpdate[];
  bundlesInvalidated?: string[];
  error?: string;
}> {
  const operationLog = createOperationLogger('processFeedEngagement', {
    userId: event.userId,
    contentId: event.contentId,
    action: event.action,
  });

  operationLog.debug({ msg: 'Starting feed engagement processing', event });

  try {
    operationLog.debug({ msg: 'Fetching content details', contentId: event.contentId });
    const contentDetails = await getContentDetails(event.contentId, event.contentType);

    if (!contentDetails) {
      operationLog.warn({ msg: 'Content not found', contentId: event.contentId });
      return { success: false, error: 'Content not found' };
    }

    const weight = ENGAGEMENT_WEIGHTS[event.action] ?? 0;
    operationLog.debug({ msg: 'Calculated engagement weight', weight, action: event.action });

    operationLog.debug({
      msg: 'Updating topic affinities',
      topicCount: contentDetails.topicSlugs.length,
    });
    const topicsUpdated = await updateTopicAffinities(
      event.userId,
      contentDetails.topicSlugs,
      weight
    );

    operationLog.debug({
      msg: 'Updating entity affinities',
      entityCount: contentDetails.entityIds.length,
    });
    const entitiesUpdated = await updateEntityAffinities(
      event.userId,
      contentDetails.entityIds,
      weight
    );

    const bundlesInvalidated: string[] = [];
    if (weight > 0) {
      operationLog.debug({ msg: 'Invalidating relevant bundles' });
      const invalidationResult = await invalidateRelevantBundles(
        event.userId,
        contentDetails.topicSlugs,
        contentDetails.entityIds
      );
      bundlesInvalidated.push(...invalidationResult);
    }

    eventBus.emit('feed:engagement', event.userId, {
      action: event.action,
      contentId: event.contentId,
      topics: contentDetails.topicSlugs,
      entities: contentDetails.entityIds,
      weight,
    });

    if (event.action === 'bookmark' || (event.action === 'like' && weight >= 0.5)) {
      operationLog.debug({ msg: 'Triggering memory extraction' });
      await triggerMemoryExtraction(event.userId, event.contentId, event.contentType);
    }

    operationLog.info({
      msg: 'Feed engagement processed successfully',
      topicsUpdated: topicsUpdated.length,
      entitiesUpdated: entitiesUpdated.length,
      bundlesInvalidated: bundlesInvalidated.length,
    });

    return { success: true, topicsUpdated, entitiesUpdated, bundlesInvalidated };
  } catch (error) {
    const errorMsg = (error as Error).message;
    operationLog.error({ msg: 'Feed engagement processing failed', error: errorMsg });

    await serverErrorReporter.reportServerError(
      'processFeedEngagement failed',
      error as Error,
      { userId: event.userId, contentId: event.contentId, action: event.action },
      'high',
      operationLog.operationId
    );

    return { success: false, error: errorMsg };
  }
}

async function getContentDetails(contentId: string, contentType: string) {
  const operationLog = createOperationLogger('getContentDetails', { contentId, contentType });

  try {
    if (contentType === 'acu' || contentType === 'conversation') {
      const conversation = await prisma.conversation.findFirst({
        where: {
          OR: [{ id: contentId }, { atomicChatUnits: { some: { id: contentId } } }],
        },
        include: {
          topicConversations: { include: { topic: true } },
          entityConversations: { include: { entity: true } },
          atomicChatUnits: {
            where: { id: contentId },
            select: { content: true, authorDid: true },
          },
        },
      });

      if (!conversation) {
        operationLog.warn({ msg: 'Conversation not found' });
        return null;
      }

      const acuContent = conversation.atomicChatUnits[0];

      return {
        topicSlugs: conversation.topicConversations.map((tc) => tc.topic.slug),
        entityIds: conversation.entityConversations.map((ec) => ec.entity.id),
        authorId: conversation.ownerId ?? undefined,
        content: acuContent?.content,
      };
    } else if (contentType === 'memory') {
      const memory = await prisma.memory.findUnique({
        where: { id: contentId },
        select: { userId: true, content: true, category: true },
      });

      if (!memory) {
        operationLog.warn({ msg: 'Memory not found' });
        return null;
      }

      return {
        topicSlugs: [memory.category.toLowerCase()],
        entityIds: [],
        content: memory.content,
      };
    }

    return { topicSlugs: [], entityIds: [] };
  } catch (error) {
    operationLog.error({ msg: 'Failed to get content details', error: (error as Error).message });
    throw error;
  }
}

async function updateTopicAffinities(
  userId: string,
  topicSlugs: string[],
  weight: number
): Promise<TopicAffinityUpdate[]> {
  const operationLog = createOperationLogger('updateTopicAffinities', {
    userId,
    topicSlugs,
    weight,
  });
  const updates: TopicAffinityUpdate[] = [];

  for (const slug of topicSlugs) {
    try {
      let profile = await prisma.topicProfile.findFirst({
        where: { userId, slug },
      });

      if (!profile) {
        operationLog.debug({ msg: 'Creating new topic profile', slug });
        profile = await prisma.topicProfile.create({
          data: {
            userId,
            slug,
            label: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
            affinity: 0,
            embedding: [],
          },
        });
      }

      const decayedAffinity = profile.affinity * TOPIC_AFFINITY_DECAY;
      const newAffinity = Math.max(0, Math.min(1, decayedAffinity + weight));

      await prisma.topicProfile.update({
        where: { id: profile.id },
        data: { affinity: newAffinity },
      });

      updates.push({ userId, topicSlug: slug, delta: weight });
    } catch (error) {
      operationLog.error({
        msg: 'Failed to update topic affinity',
        slug,
        error: (error as Error).message,
      });
      await serverErrorReporter.reportDatabaseError(
        `Failed to update topic affinity for ${slug}`,
        error as Error,
        { userId, slug, operation: 'update' },
        'medium',
        operationLog.operationId
      );
    }
  }

  return updates;
}

async function updateEntityAffinities(
  userId: string,
  entityIds: string[],
  weight: number
): Promise<EntityAffinityUpdate[]> {
  const operationLog = createOperationLogger('updateEntityAffinities', {
    userId,
    entityIds,
    weight,
  });
  const updates: EntityAffinityUpdate[] = [];

  for (const entityId of entityIds) {
    try {
      const profile = await prisma.entityProfile.findUnique({
        where: { id: entityId },
      });

      if (!profile) continue;

      const decayedAffinity = (profile.affinity ?? 0.5) * TOPIC_AFFINITY_DECAY;
      const newAffinity = Math.max(0, Math.min(1, decayedAffinity + weight));

      await prisma.entityProfile.update({
        where: { id: entityId },
        data: { affinity: newAffinity },
      });

      updates.push({ userId, entityId, delta: weight });
    } catch (error) {
      operationLog.error({
        msg: 'Failed to update entity affinity',
        entityId,
        error: (error as Error).message,
      });
    }
  }

  return updates;
}

async function invalidateRelevantBundles(
  userId: string,
  topicSlugs: string[],
  entityIds: string[]
): Promise<string[]> {
  const operationLog = createOperationLogger('invalidateRelevantBundles', {
    userId,
    topicSlugs,
    entityIds,
  });
  const invalidated: string[] = [];

  try {
    if (topicSlugs.length > 0) {
      const topicProfiles = await prisma.topicProfile.findMany({
        where: { userId, slug: { in: topicSlugs } },
        select: { id: true },
      });

      const topicIds = topicProfiles.map((t) => t.id);

      const updateResult = await prisma.contextBundle.updateMany({
        where: { userId, bundleType: 'topic', topicProfileId: { in: topicIds } },
        data: { isDirty: true },
      });

      operationLog.debug({ msg: 'Invalidated topic bundles', count: updateResult.count });
      invalidated.push(...topicIds.map((id) => `topic:${id}`));
    }

    if (entityIds.length > 0) {
      const updateResult = await prisma.contextBundle.updateMany({
        where: { userId, bundleType: 'entity', entityProfileId: { in: entityIds } },
        data: { isDirty: true },
      });

      operationLog.debug({ msg: 'Invalidated entity bundles', count: updateResult.count });
      invalidated.push(...entityIds.map((id) => `entity:${id}`));
    }

    await prisma.contextBundle.updateMany({
      where: {
        userId,
        bundleType: { in: ['identity_core', 'global_prefs'] },
        topicProfileId: null,
        entityProfileId: null,
      },
      data: { isDirty: true },
    });

    invalidated.push('identity_core', 'global_prefs');
  } catch (error) {
    operationLog.error({ msg: 'Failed to invalidate bundles', error: (error as Error).message });
    await serverErrorReporter.reportDatabaseError(
      'Failed to invalidate bundles',
      error as Error,
      { userId },
      'medium',
      operationLog.operationId
    );
  }

  return invalidated;
}

async function triggerMemoryExtraction(
  userId: string,
  contentId: string,
  contentType: string
): Promise<void> {
  const operationLog = createOperationLogger('triggerMemoryExtraction', {
    userId,
    contentId,
    contentType,
  });

  try {
    eventBus.emit('memory:extract_from_feed', userId, {
      contentId,
      contentType,
      trigger: 'high_engagement',
      timestamp: Date.now(),
    });

    operationLog.debug({ msg: 'Memory extraction triggered' });
  } catch (error) {
    operationLog.error({
      msg: 'Failed to trigger memory extraction',
      error: (error as Error).message,
    });
  }
}

export async function generateContextualFeed(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    includeContextBoost?: boolean;
  } = {}
): Promise<{
  success: boolean;
  items?: any[];
  contextBoost?: {
    activeTopics: string[];
    activeEntities: string[];
    boostedTopics: string[];
  };
  error?: string;
}> {
  const operationLog = createOperationLogger('generateContextualFeed', { userId, options });
  operationLog.debug({ msg: 'Generating contextual feed' });

  try {
    const { limit = 20, offset = 0, includeContextBoost = true } = options;

    let activeTopics: string[] = [];
    let activeEntities: string[] = [];

    if (includeContextBoost) {
      const contextTopics = await prisma.topicProfile.findMany({
        where: { userId, affinity: { gt: MIN_AFFINITY_THRESHOLD } },
        orderBy: { affinity: 'desc' },
        take: 5,
        select: { slug: true },
      });
      activeTopics = contextTopics.map((t) => t.slug);

      const contextEntities = await prisma.entityProfile.findMany({
        where: { userId, affinity: { gt: MIN_AFFINITY_THRESHOLD } },
        orderBy: { affinity: 'desc' },
        take: 3,
        select: { id: true },
      });
      activeEntities = contextEntities.map((e) => e.id);

      operationLog.debug({ msg: 'Retrieved active context', activeTopics, activeEntities });
    }

    const boostedTopicSlugs = activeTopics.slice(0, 3);

    const items = await prisma.feedItem.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: { score: 'desc' },
      take: limit,
      skip: offset,
      include: { sourceDetails: true },
    });

    const boostedItems = items.map((item) => {
      let boostMultiplier = 1.0;
      if (includeContextBoost && boostedTopicSlugs.length > 0) {
        boostMultiplier = 1.0 + activeTopics.length * 0.05;
      }
      return {
        ...item,
        score: item.score * boostMultiplier,
        contextBoost: includeContextBoost
          ? {
              matchedTopics: [],
              boostApplied: boostMultiplier > 1.0,
            }
          : undefined,
      };
    });

    boostedItems.sort((a, b) => b.score - a.score);

    operationLog.info({ msg: 'Contextual feed generated', itemCount: boostedItems.length });

    return {
      success: true,
      items: boostedItems,
      contextBoost: includeContextBoost
        ? { activeTopics, activeEntities, boostedTopics: boostedTopicSlugs }
        : undefined,
    };
  } catch (error) {
    operationLog.error({
      msg: 'Failed to generate contextual feed',
      error: (error as Error).message,
    });
    await serverErrorReporter.reportServerError(
      'generateContextualFeed failed',
      error as Error,
      { userId },
      'high',
      operationLog.operationId
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getContextState(userId: string): Promise<{
  success: boolean;
  state?: {
    activeTopics: Array<{ slug: string; affinity: number }>;
    activeEntities: Array<{ id: string; name: string; affinity: number }>;
    recentEngagement: Array<{ contentId: string; action: string; timestamp: Date }>;
    pendingBundleUpdates: string[];
  };
  error?: string;
}> {
  const operationLog = createOperationLogger('getContextState', { userId });
  operationLog.debug({ msg: 'Getting context state' });

  try {
    const [topics, entities, recentEngagement] = await Promise.all([
      prisma.topicProfile.findMany({
        where: { userId, affinity: { gt: MIN_AFFINITY_THRESHOLD } },
        orderBy: { affinity: 'desc' },
        take: 10,
        select: { slug: true, affinity: true },
      }),
      prisma.entityProfile.findMany({
        where: { userId, affinity: { gt: MIN_AFFINITY_THRESHOLD } },
        orderBy: { affinity: 'desc' },
        take: 5,
        select: { id: true, name: true, affinity: true },
      }),
      prisma.userInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { contentId: true, action: true, createdAt: true },
      }),
    ]);

    const pendingBundles = await prisma.contextBundle.findMany({
      where: { userId, isDirty: true },
      select: { id: true, bundleType: true },
    });

    operationLog.debug({
      msg: 'Context state retrieved',
      topicCount: topics.length,
      entityCount: entities.length,
      pendingBundles: pendingBundles.length,
    });

    return {
      success: true,
      state: {
        activeTopics: topics.map((t) => ({ slug: t.slug, affinity: t.affinity })),
        activeEntities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          affinity: e.affinity ?? 0.5,
        })),
        recentEngagement: recentEngagement.map((e) => ({
          contentId: e.contentId,
          action: e.action,
          timestamp: e.createdAt,
        })),
        pendingBundleUpdates: pendingBundles.map((b) => `${b.bundleType}:${b.id}`),
      },
    };
  } catch (error) {
    operationLog.error({ msg: 'Failed to get context state', error: (error as Error).message });
    await serverErrorReporter.reportServerError(
      'getContextState failed',
      error as Error,
      { userId },
      'medium',
      operationLog.operationId
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function processEngagementBatch(events: FeedEngagementEvent[]): Promise<{
  success: boolean;
  processed: number;
  errors: number;
}> {
  const operationLog = createOperationLogger('processEngagementBatch', {
    batchSize: events.length,
  });
  operationLog.debug({ msg: 'Processing engagement batch' });

  let processed = 0;
  let errors = 0;

  for (const event of events) {
    const result = await processFeedEngagement(event);
    if (result.success) {
      processed++;
    } else {
      errors++;
    }
  }

  operationLog.info({ msg: 'Batch processing complete', processed, errors, total: events.length });

  return { success: errors === 0, processed, errors };
}

export const feedContextIntegration = {
  processFeedEngagement,
  generateContextualFeed,
  getContextState,
  processEngagementBatch,
};

export default feedContextIntegration;
