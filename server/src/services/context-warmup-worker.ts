/**
 * Context Warmup Worker
 *
 * Background worker that proactively generates context bundles
 * based on user presence signals and predictions.
 *
 * This implements the "Pre-Generation Engine" from the architecture:
 * - Uses PredictionEngine to anticipate user's next actions
 * - Compiles bundles for predicted interactions
 * - Stores them in the cache for zero-latency retrieval
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { BundleCompiler } from '../context/index.js';
import { BudgetAlgorithm } from '../context/index.js';

const prisma = getPrismaClient();

export interface WarmupWorkerConfig {
  prisma: any;
  bundleCompiler: BundleCompiler;
  budgetAlgorithm: BudgetAlgorithm;
  maxPredictions: number;
  probabilityThreshold: number;
}

export class ContextWarmupWorker {
  private config: WarmupWorkerConfig;
  private processing = new Set<string>();

  constructor(config: WarmupWorkerConfig) {
    this.config = {
      maxPredictions: 8,
      probabilityThreshold: 0.1,
      ...config,
    };
  }

  /**
   * Main warmup entry point
   * Called when client sends presence update
   */
  async warmupForUser(userId: string, deviceId: string): Promise<void> {
    const processingKey = `${userId}:${deviceId}`;

    if (this.processing.has(processingKey)) {
      logger.info({ userId, deviceId }, 'Warmup already in progress');
      return;
    }

    this.processing.add(processingKey);

    try {
      const presence = await prisma.clientPresence.findUnique({
        where: {
          userId_deviceId: { userId, deviceId },
        },
        select: {
          activeConversationId: true,
          visibleConversationIds: true,
          activePersonaId: true,
          lastNavigationPath: true,
          navigationHistory: true,
          localTime: true,
        },
      });

      if (!presence) {
        logger.warn({ userId, deviceId }, 'Presence not found');
        return;
      }

      const predictions = this.generatePredictions(userId, presence);

      logger.info(
        {
          userId,
          predictions: predictions.length,
          activeConversation: presence.activeConversationId,
        },
        'Generated predictions'
      );

      for (const prediction of predictions) {
        if (prediction.probability < this.config.probabilityThreshold) {
          continue;
        }

        await this.warmupBundleForPrediction(userId, prediction);
      }

      await this.updatePresencePredictions(userId, predictions);
    } finally {
      this.processing.delete(processingKey);
    }
  }

  /**
   * Generate predictions based on presence signals
   */
  private async generatePredictions(userId: string, presence: any): Promise<any[]> {
    const predictions = [];

    if (presence.activeConversationId) {
      predictions.push({
        type: 'continue_conversation',
        conversationId: presence.activeConversationId,
        probability: 0.85,
        requiredBundles: ['conversation'],
      });
    }

    for (const convId of (presence.visibleConversationIds || []).slice(0, 3)) {
      if (convId === presence.activeConversationId) continue;

      predictions.push({
        type: 'continue_conversation',
        conversationId: convId,
        probability: 0.3,
        requiredBundles: ['conversation'],
      });
    }

    const localHour = presence.localTime
      ? new Date(presence.localTime).getHours()
      : new Date().getHours();

    const timeBasedTopics = await prisma.topicProfile.findMany({
      where: {
        userId,
        peakHour: localHour,
        importanceScore: { gte: 0.4 },
      },
      orderBy: { importanceScore: 'desc' },
      take: 3,
    });

    for (const topic of timeBasedTopics) {
      predictions.push({
        type: 'new_on_topic',
        topicSlug: topic.slug,
        probability: 0.2 * topic.importanceScore,
        requiredBundles: ['topic'],
      });
    }

    const recentTopics = await prisma.topicProfile.findMany({
      where: {
        userId,
        lastEngagedAt: {
          gte: new Date(Date.now() - 48 * 60 * 60 * 1000),
        },
      },
      orderBy: { importanceScore: 'desc' },
      take: 5,
    });

    for (const topic of recentTopics) {
      const existing = predictions.find(
        (p) => p.type === 'new_on_topic' && p.topicSlug === topic.slug
      );
      if (!existing) {
        predictions.push({
          type: 'new_on_topic',
          topicSlug: topic.slug,
          probability: 0.15 * topic.importanceScore,
          requiredBundles: ['topic'],
        });
      }
    }

    const hotEntities = await prisma.entityProfile.findMany({
      where: {
        userId,
        lastMentionedAt: {
          gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
        },
      },
      orderBy: { importanceScore: 'desc' },
      take: 5,
    });

    for (const entity of hotEntities) {
      predictions.push({
        type: 'entity_related',
        entityId: entity.id,
        probability: 0.1 * entity.importanceScore,
        requiredBundles: ['entity'],
      });
    }

    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, this.config.maxPredictions);
  }

  /**
   * Warmup a specific bundle for a prediction
   */
  private async warmupBundleForPrediction(userId: string, prediction: any): Promise<void> {
    const log = logger.child({ userId, prediction: prediction.type });

    try {
      if (prediction.conversationId) {
        await this.warmupConversationBundle(userId, prediction.conversationId);
      } else if (prediction.topicSlug) {
        await this.warmupTopicBundle(userId, prediction.topicSlug);
      } else if (prediction.entityId) {
        await this.warmupEntityBundle(userId, prediction.entityId);
      } else if (prediction.type === 'cold_start') {
        await this.warmupIdentityAndPrefs(userId);
      }

      log.info({ type: prediction.type, probability: prediction.probability }, 'Bundle warmed up');
    } catch (error) {
      log.error({ error: error.message, prediction }, 'Failed to warmup bundle');
    }
  }

  /**
   * Warmup conversation bundle
   */
  private async warmupConversationBundle(userId: string, conversationId: string): Promise<void> {
    const existing = await prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType: 'conversation',
        conversationId,
        isDirty: false,
      },
      orderBy: { compiledAt: 'desc' },
    });

    if (existing) {
      const ageMinutes = (Date.now() - existing.compiledAt.getTime()) / (60 * 1000);

      if (ageMinutes < 30) {
        logger.debug('Conversation bundle is fresh, skipping');
        return;
      }

      logger.info({ conversationId, ageMinutes }, 'Conversation bundle stale, recompiling');

      await this.compileAndStoreConversation(userId, conversationId);
    } else {
      await this.compileAndStoreConversation(userId, conversationId);
    }
  }

  /**
   * Warmup topic bundle
   */
  private async warmupTopicBundle(userId: string, topicSlug: string): Promise<void> {
    const topic = await prisma.topicProfile.findUnique({
      where: { userId_slug: { userId, slug: topicSlug } },
    });

    if (!topic) {
      logger.warn({ userId, topicSlug }, 'Topic not found');
      return;
    }

    const existing = await prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType: 'topic',
        topicProfileId: topic.id,
        isDirty: false,
      },
      orderBy: { compiledAt: 'desc' },
    });

    if (existing) {
      const ageMinutes = (Date.now() - existing.compiledAt.getTime()) / (60 * 1000);

      if (ageMinutes < 60) {
        logger.debug('Topic bundle is fresh, skipping');
        return;
      }

      logger.info({ topicSlug, ageMinutes }, 'Topic bundle stale, recompiling');

      await this.compileAndStoreTopic(userId, topic.id);
    } else {
      await this.compileAndStoreTopic(userId, topic.id);
    }
  }

  /**
   * Warmup entity bundle
   */
  private async warmupEntityBundle(userId: string, entityId: string): Promise<void> {
    const existing = await prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType: 'entity',
        entityProfileId: entityId,
        isDirty: false,
      },
      orderBy: { compiledAt: 'desc' },
    });

    if (existing) {
      const ageMinutes = (Date.now() - existing.compiledAt.getTime()) / (60 * 1000);

      if (ageMinutes < 90) {
        logger.debug('Entity bundle is fresh, skipping');
        return;
      }

      logger.info({ entityId, ageMinutes }, 'Entity bundle stale, recompiling');

      await this.compileAndStoreEntity(userId, entityId);
    } else {
      await this.compileAndStoreEntity(userId, entityId);
    }
  }

  /**
   * Warmup identity and preferences bundles
   */
  private async warmupIdentityAndPrefs(userId: string): Promise<void> {
    await Promise.all([this.compileAndStoreIdentity(userId), this.compileAndStorePrefs(userId)]);
  }

  private async compileAndStoreConversation(userId: string, conversationId: string): Promise<void> {
    if (!this.config.bundleCompiler) {
      logger.warn('BundleCompiler not configured');
      return;
    }

    await this.config.bundleCompiler.compileConversationContext(userId, conversationId);
  }

  private async compileAndStoreTopic(userId: string, topicId: string): Promise<void> {
    if (!this.config.bundleCompiler) {
      logger.warn('BundleCompiler not configured');
      return;
    }

    await this.config.bundleCompiler.compileTopicContext(userId, topicId);
  }

  private async compileAndStoreEntity(userId: string, entityId: string): Promise<void> {
    if (!this.config.bundleCompiler) {
      logger.warn('BundleCompiler not configured');
      return;
    }

    await this.config.bundleCompiler.compileEntityContext(userId, entityId);
  }

  private async compileAndStoreIdentity(userId: string): Promise<void> {
    if (!this.config.bundleCompiler) {
      logger.warn('BundleCompiler not configured');
      return;
    }

    await this.config.bundleCompiler.compileIdentityCore(userId);
  }

  private async compileAndStorePrefs(userId: string): Promise<void> {
    if (!this.config.bundleCompiler) {
      logger.warn('BundleCompiler not configured');
      return;
    }

    await this.config.bundleCompiler.compileGlobalPrefs(userId);
  }

  private async updatePresencePredictions(userId: string, predictions: any[]): Promise<void> {
    const topicSlugs = predictions.filter((p) => p.topicSlug).map((p) => p.topicSlug!);

    const entityIds = predictions.filter((p) => p.entityId).map((p) => p.entityId!);

    await prisma.clientPresence.update({
      where: {
        userId_deviceId: { userId, deviceId: predictions[0]?.deviceId || 'web' },
      },
      data: {
        predictedTopics: topicSlugs,
        predictedEntities: entityIds,
      },
    });
  }

  /**
   * Health check
   */
  async getHealth(): Promise<{
    isProcessing: boolean;
    processingKeys: string[];
  }> {
    return {
      isProcessing: this.processing.size > 0,
      processingKeys: Array.from(this.processing),
    };
  }
}

export const contextWarmupWorker = new ContextWarmupWorker();
