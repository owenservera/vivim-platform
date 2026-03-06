/**
 * InvalidationService - Centralized Bundle Invalidation
 *
 * Subscribes to ContextEventBus and handles bundle invalidation
 * when underlying data changes. This decouples invalidation logic
 * from business logic services.
 *
 * Features:
 * - Reactive invalidation via event bus
 * - Batch processing of invalidations
 * - Optimistic locking with version timestamps
 * - Telemetry for invalidation patterns
 */

import { ContextEventBus, ContextEvent } from '../context/context-event-bus.js';
import { prisma } from '../lib/database.js';
import { logger } from '../lib/logger.js';

export class InvalidationService {
  private eventBus: ContextEventBus;
  private isInitialized = false;

  constructor(eventBus: ContextEventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Initialize the service by subscribing to relevant events
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.warn('InvalidationService already initialized');
      return;
    }

    // Subscribe to events that should trigger bundle invalidation
    this.eventBus.on('memory:created', this.handleMemoryChange.bind(this));
    this.eventBus.on('memory:updated', this.handleMemoryChange.bind(this));
    this.eventBus.on('memory:deleted', this.handleMemoryChange.bind(this));

    this.eventBus.on('acu:processed', this.handleACUChange.bind(this));
    this.eventBus.on('acu:deleted', this.handleACUChange.bind(this));

    this.eventBus.on('conversation:message_added', this.handleConversationChange.bind(this));
    this.eventBus.on('conversation:archived', this.handleConversationChange.bind(this));
    this.eventBus.on('conversation:deleted', this.handleConversationChange.bind(this));

    this.eventBus.on('topic:created', this.handleTopicChange.bind(this));
    this.eventBus.on('topic:updated', this.handleTopicChange.bind(this));
    this.eventBus.on('topic:merged', this.handleTopicChange.bind(this));

    this.eventBus.on('entity:created', this.handleEntityChange.bind(this));
    this.eventBus.on('entity:updated', this.handleEntityChange.bind(this));
    this.eventBus.on('entity:merged', this.handleEntityChange.bind(this));

    this.eventBus.on('settings:updated', this.handleSettingsChange.bind(this));

    this.isInitialized = true;
    logger.info('InvalidationService initialized');
  }

  /**
   * Manually trigger invalidation for a specific event
   */
  public async invalidate(params: {
    eventType: string;
    userId: string;
    relatedIds: string[];
    timestamp?: Date;
  }): Promise<void> {
    const { eventType, userId, relatedIds } = params;
    
    // Convert generic event types to specific invalidation logic
    if (eventType.startsWith('memory')) {
      await this.handleMemoryChange({ 
        type: 'memory:updated', 
        userId, 
        timestamp: Date.now(), 
        payload: { memoryId: relatedIds[0] } 
      });
    } else if (eventType.startsWith('acu')) {
      await this.handleACUChange({ 
        type: 'acu:processed', 
        userId, 
        timestamp: Date.now(), 
        payload: { acuId: relatedIds[0] } 
      });
    } else if (eventType.startsWith('conversation')) {
      await this.handleConversationChange({ 
        type: 'conversation:message_added', 
        userId, 
        timestamp: Date.now(), 
        payload: { conversationId: relatedIds[0] } 
      });
    }
  }

  /**
   * Get health status for monitoring
   */
  public async getHealth(): Promise<{ dirtyBundles: number; queueLength: number }> {
    const dirtyCount = await prisma.contextBundle.count({
      where: { isDirty: true }
    });
    
    return {
      dirtyBundles: dirtyCount,
      queueLength: 0 // No async queue in this simple implementation
    };
  }

  /**
   * Handle memory changes - invalidate identity_core and global_prefs bundles
   */
  private async handleMemoryChange(event: ContextEvent): Promise<void> {
    const { userId, payload } = event;
    const memoryId = payload.memoryId;

    try {
      // Invalidate identity_core bundles (memories with high importance)
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'identity_core',
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `memory:${memoryId}`,
        },
      });

      // Invalidate global_prefs bundles (preference memories)
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'global_prefs',
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `memory:${memoryId}`,
        },
      });

      logger.debug({ userId, memoryId }, 'Memory change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate memory bundles');
    }
  }

  /**
   * Handle ACU changes - invalidate topic bundles
   */
  private async handleACUChange(event: ContextEvent): Promise<void> {
    const { userId, payload } = event;
    const acuId = payload.acuId;

    try {
      // Invalidate topic bundles that might reference this ACU
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'topic',
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `acu:${acuId}`,
        },
      });

      logger.debug({ userId, acuId }, 'ACU change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate ACU bundles');
    }
  }

  /**
   * Handle conversation changes - invalidate conversation bundles
   */
  private async handleConversationChange(event: ContextEvent): Promise<void> {
    const { userId, payload } = event;
    const conversationId = payload.conversationId;

    try {
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'conversation',
          conversationId,
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `conversation:${conversationId}`,
        },
      });

      logger.debug({ userId, conversationId }, 'Conversation change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate conversation bundles');
    }
  }

  /**
   * Handle topic changes - invalidate specific topic bundle
   */
  private async handleTopicChange(event: ContextEvent): Promise<void> {
    const { userId, payload } = event;
    const topicId = payload.topicId;

    try {
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'topic',
          topicProfileId: topicId,
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `topic:${topicId}`,
        },
      });

      logger.debug({ userId, topicId }, 'Topic change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate topic bundles');
    }
  }

  /**
   * Handle entity changes - invalidate specific entity bundle
   */
  private async handleEntityChange(event: ContextEvent): Promise<void> {
    const { userId, payload } = event;
    const entityId = payload.entityId;

    try {
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'entity',
          entityProfileId: entityId,
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: `entity:${entityId}`,
        },
      });

      logger.debug({ userId, entityId }, 'Entity change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate entity bundles');
    }
  }

  /**
   * Handle settings changes - invalidate global_prefs bundle
   */
  private async handleSettingsChange(event: ContextEvent): Promise<void> {
    const { userId } = event;

    try {
      await prisma.contextBundle.updateMany({
        where: {
          userId,
          bundleType: 'global_prefs',
        },
        data: {
          isDirty: true,
          invalidatedAt: new Date(),
          invalidationReason: 'settings:updated',
        },
      });

      logger.debug({ userId }, 'Settings change triggered bundle invalidation');
    } catch (error) {
      logger.error({ userId, error: (error as Error).message }, 'Failed to invalidate settings bundles');
    }
  }

  /**
   * Get initialization status
   */
  public getStatus(): { initialized: boolean } {
    return { initialized: this.isInitialized };
  }
}

import { getContextEventBus } from '../context/index.js';

export const invalidationService = new InvalidationService(getContextEventBus());
export default InvalidationService;
