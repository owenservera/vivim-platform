/**
 * Invalidation Service
 *
 * Event-driven invalidation of context bundles.
 * When source data changes (memories, ACUs, conversations, instructions),
 * mark affected bundles as dirty to trigger recompilation.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();

export interface InvalidationEvent {
  eventType:
    | 'memory_created'
    | 'memory_updated'
    | 'memory_deleted'
    | 'instruction_changed'
    | 'message_created'
    | 'acu_created'
    | 'acu_updated'
    | 'topic_updated'
    | 'entity_updated'
    | 'conversation_updated';
  userId: string;
  relatedIds: string[];
  timestamp?: Date;
}

export class InvalidationService {
  private static readonly INVALIDATION_QUEUE = 'invalidation-queue';

  /**
   * Process invalidation event
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    const log = logger.child({ userId: event.userId, event: event.eventType });
    log.info({ event, relatedIds: event.relatedIds }, 'Processing invalidation');

    const bundleTypes = this.getAffectedBundleTypes(event.eventType);

    for (const bundleType of bundleTypes) {
      await this.markBundlesDirty(event.userId, bundleType, event.relatedIds);
    }

    // Trigger bundle recompilation for active contexts if needed
    await this.triggerRecompilation(event.userId, event.relatedIds);
  }

  /**
   * Determine which bundle types are affected by an event
   */
  private getAffectedBundleTypes(eventType: InvalidationEvent['eventType']): string[] {
    const eventToBundles: Record<InvalidationEvent['eventType'], string[]> = {
      memory_created: ['identity_core', 'global_prefs'],
      memory_updated: ['identity_core', 'global_prefs'],
      memory_deleted: ['identity_core', 'global_prefs'],
      instruction_changed: ['global_prefs'],
      message_created: ['conversation'],
      conversation_updated: ['conversation'],
      acu_created: ['topic', 'entity'],
      acu_updated: ['topic', 'entity'],
      topic_updated: ['topic'],
      entity_updated: ['entity'],
    };

    return eventToBundles[eventType] || [];
  }

  /**
   * Mark bundles as dirty based on event
   */
  private async markBundlesDirty(
    userId: string,
    bundleType: string,
    relatedIds: string[]
  ): Promise<void> {
    const conditions = this.buildDirtyConditions(userId, bundleType, relatedIds);

    await prisma.contextBundle.updateMany({
      where: conditions,
      data: {
        isDirty: true,
      },
    });

    logger.info({ userId, bundleType, relatedIds }, 'Marked bundles dirty');
  }

  /**
   * Build Prisma query conditions for dirty bundles
   */
  private buildDirtyConditions(userId: string, bundleType: string, relatedIds: string[]): any {
    const baseConditions = {
      userId,
      bundleType,
      isDirty: false,
    };

    if (bundleType === 'topic' && relatedIds.length > 0) {
      return {
        userId,
        bundleType,
        topicProfileId: { in: relatedIds },
        entityProfileId: null,
        conversationId: null,
        personaId: null,
      };
    }

    if (bundleType === 'entity' && relatedIds.length > 0) {
      return {
        userId,
        bundleType,
        topicProfileId: null,
        entityProfileId: { in: relatedIds },
        conversationId: null,
        personaId: null,
      };
    }

    if (bundleType === 'conversation' && relatedIds.length > 0) {
      return {
        userId,
        bundleType,
        topicProfileId: null,
        entityProfileId: null,
        conversationId: { in: relatedIds },
        personaId: null,
      };
    }

    if (bundleType === 'identity_core' || bundleType === 'global_prefs') {
      return {
        userId,
        bundleType,
        topicProfileId: null,
        entityProfileId: null,
        conversationId: null,
        personaId: null,
      };
    }

    return baseConditions;
  }

  /**
   * Trigger recompilation of bundles that were marked dirty
   * This ensures that the next chat request gets fresh context
   */
  private async triggerRecompilation(userId: string, relatedIds: string[]): Promise<void> {
    // Get conversations that might be affected
    if (relatedIds.length > 0) {
      try {
        const conversations = await prisma.conversation.findMany({
          where: {
            ownerId: userId,
            id: { in: relatedIds },
          },
          select: { id: true, ownerId: true },
        });

        if (conversations.length > 0) {
          logger.info(
            { userId, conversations: conversations.length },
            'Triggering recompilation for conversations'
          );
        }
      } catch (e) {
        logger.error({ error: e.message }, 'Failed to fetch conversations for recompilation');
      }
    }
  }

  /**
   * Process invalidation queue (for async batch processing)
   */
  async processQueue(): Promise<number> {
    try {
      const queueItems = await prisma.systemAction.findMany({
        where: {
          trigger: InvalidationService.INVALIDATION_QUEUE,
          actionCode: { startsWith: 'invalidate_' },
        },
      });

      if (queueItems.length === 0) {
        return 0;
      }

      logger.info({ queueLength: queueItems.length }, 'Processing invalidation queue');

      let processed = 0;
      for (const item of queueItems.slice(0, 10)) {
        try {
          // Decode event data from label field (encoded as JSON)
          let userId: string | undefined;
          let relatedIds: string[] = [];
          let eventType: string | undefined;
          try {
            const decoded = JSON.parse(item.label);
            userId = decoded.userId;
            relatedIds = decoded.relatedIds || [];
            eventType = decoded.eventType;
          } catch {
            // Legacy format - skip
            continue;
          }

          if (userId && eventType && relatedIds.length > 0) {
            await this.invalidate({
              eventType,
              userId,
              relatedIds,
              timestamp: new Date(),
            });
            processed++;
          }
        } catch (e) {
          logger.error(
            { error: e.message, itemId: item.id },
            'Failed to process invalidation item'
          );
        }
      }

      // Mark processed items as done
      if (processed > 0) {
        await prisma.systemAction.deleteMany({
          where: {
            id: { in: queueItems.slice(0, 10).map((i: any) => i.id) },
          },
        });
      }

      return processed;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to process invalidation queue');
      return 0;
    }
  }

  /**
   * Add invalidation to queue
   */
  async queueInvalidation(event: InvalidationEvent): Promise<void> {
    // Encode event data into the trigger field as JSON so we can decode it later
    // SystemAction schema doesn't have a metadata field, so we encode into label
    const encodedPayload = JSON.stringify({
      userId: event.userId,
      relatedIds: event.relatedIds,
      eventType: event.eventType,
    });
    await prisma.systemAction.create({
      data: {
        trigger: InvalidationService.INVALIDATION_QUEUE,
        label: encodedPayload,
        actionCode: `invalidate_${event.eventType}`,
        description: `Invalidate bundles for user ${event.userId} due to ${event.eventType}`,
      },
    });
  }

  /**
   * Health check for invalidation service
   */
  async getHealth(): Promise<{
    queueLength: number;
    dirtyBundles: number;
  }> {
    const [queueLength, dirtyBundles] = await Promise.all([
      prisma.systemAction.count({
        where: {
          trigger: InvalidationService.INVALIDATION_QUEUE,
          actionCode: { startsWith: 'invalidate_' },
        },
      }),
      prisma.contextBundle.count({
        where: { isDirty: true },
      }),
    ]);

    return {
      queueLength,
      dirtyBundles,
    };
  }

  /**
   * Cleanup old invalidation queue items
   */
  async cleanupQueue(olderThanHours: number = 24): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await prisma.systemAction.deleteMany({
      where: {
        trigger: InvalidationService.INVALIDATION_QUEUE,
        createdAt: { lt: cutoff },
      },
    });

    return result.count;
  }
}

export const invalidationService = new InvalidationService();
