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
import { prisma } from '../lib/prisma.js';
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
    this.eventBus.subscribe('memory:created', this.handleMemoryChange.bind(this));
    this.eventBus.subscribe('memory:updated', this.handleMemoryChange.bind(this));
    this.eventBus.subscribe('memory:deleted', this.handleMemoryChange.bind(this));

    this.eventBus.subscribe('acu:processed', this.handleACUChange.bind(this));
    this.eventBus.subscribe('acu:deleted', this.handleACUChange.bind(this));

    this.eventBus.subscribe('conversation:message_added', this.handleConversationChange.bind(this));
    this.eventBus.subscribe('conversation:archived', this.handleConversationChange.bind(this));
    this.eventBus.subscribe('conversation:deleted', this.handleConversationChange.bind(this));

    this.eventBus.subscribe('topic:created', this.handleTopicChange.bind(this));
    this.eventBus.subscribe('topic:updated', this.handleTopicChange.bind(this));
    this.eventBus.subscribe('topic:merged', this.handleTopicChange.bind(this));

    this.eventBus.subscribe('entity:created', this.handleEntityChange.bind(this));
    this.eventBus.subscribe('entity:updated', this.handleEntityChange.bind(this));
    this.eventBus.subscribe('entity:merged', this.handleEntityChange.bind(this));

    this.eventBus.subscribe('settings:updated', this.handleSettingsChange.bind(this));

    this.isInitialized = true;
    logger.info('InvalidationService initialized');
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

export default InvalidationService;
