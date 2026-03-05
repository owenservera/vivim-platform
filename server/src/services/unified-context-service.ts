/**
 * Unified Context Service
 *
 * A bridge service that tries to use the new DynamicContextAssembler
 * but falls back to the old context-generator.js for reliability.
 *
 * This ensures a smooth migration path without breaking the UI.
 */

import { getPrismaClient } from '../lib/database.js';
import {
  DynamicContextAssembler,
  createEmbeddingService,
  createLLMService,
  createTokenEstimator,
  LibrarianWorker,
  BundleCompiler,
  BudgetAlgorithm,
  getContextTelemetry,
} from '../context/index.js';
import * as oldContextGenerator from '../services/context-generator.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();
const telemetry = getContextTelemetry();

export interface UnifiedContextServiceConfig {
  enableNewContextEngine?: boolean;
  fallbackOnError?: boolean;
}

export class UnifiedContextService {
  private config: UnifiedContextServiceConfig;
  private dynamicAssembler: DynamicContextAssembler | null = null;
  private librarianWorker: LibrarianWorker | null = null;
  private bundleCompiler: BundleCompiler | null = null;

  constructor(config: UnifiedContextServiceConfig = {}) {
    this.config = {
      // Enable by default for VIVIM identity to work - can be disabled via env
      enableNewContextEngine:
        config.enableNewContextEngine ?? process.env.USE_DYNAMIC_CONTEXT !== 'false',
      fallbackOnError: config.fallbackOnError ?? true,
    };

    // Only initialize dynamic assembler if enabled
    if (this.config.enableNewContextEngine) {
      try {
        // Create Z.ai services for embeddings and LLM
        const embeddingService = createEmbeddingService();
        const llmService = createLLMService();

        // Initialize bundle compiler for pre-generating context bundles
        this.bundleCompiler = new BundleCompiler({
          prisma,
          embeddingService,
          llmService,
        });

        // Create token estimator
        const tokenEstimator = createTokenEstimator();

        this.dynamicAssembler = new DynamicContextAssembler({
          prisma,
          embeddingService,
          tokenEstimator,
          bundleCompiler: this.bundleCompiler,
        });

        // Initialize Librarian Worker for autonomous learning
        this.librarianWorker = new LibrarianWorker({
          enabled: process.env.LIBRARIAN_ENABLED === 'true',
          llmService,
          embeddingService,
        });

        logger.info(
          {
            engine: 'dynamic',
            zaiEnabled: true,
          },
          'UnifiedContextService initialized with Z.AI GLM-4.7'
        );
      } catch (e) {
        logger.error(
          { error: (e as Error).message },
          'Failed to initialize DynamicContextAssembler with Z.AI'
        );
        this.dynamicAssembler = null;
        this.librarianWorker = null;
        this.bundleCompiler = null;
      }
    }
  }

  /**
   * Main entry point - generates context for a chat request
   * Uses new engine if available, falls back to old one
   */
  async generateContextForChat(
    conversationId: string,
    options: {
      userId?: string;
      userMessage?: string;
      personaId?: string;
      deviceId?: string;
      providerId?: string;
      modelId?: string;
    } = {}
  ): Promise<{
    systemPrompt: string;
    layers: any;
    stats: any;
    engineUsed: 'new' | 'old';
  }> {
    const log = logger.child({ conversationId });
    log.info({ options }, 'Generating context');

    // Use userId from options if provided, otherwise try to derive from conversationId
    let userId = options.userId;

    // Try new dynamic context assembler first
    if (this.config.enableNewContextEngine && this.dynamicAssembler) {
      try {
        // If userId not provided in options, try to get from conversation
        if (!userId) {
          userId = await this.getUserIdForConversation(conversationId);
        }

        if (!userId) {
          throw new Error('Could not determine user for conversation');
        }

        // Fetch user settings
        const userSettings = await this.getUserContextSettings(userId);

        // Build assembly params
        const assemblyParams = {
          userId,
          conversationId,
          userMessage: options.userMessage || '',
          personaId: options.personaId,
          deviceId: options.deviceId,
          providerId: options.providerId,
          modelId: options.modelId,
          settings: userSettings,
        };

        const result = await this.dynamicAssembler.assemble(assemblyParams);
        log.info(
          {
            engine: 'dynamic',
            tokens: result.budget.totalUsed,
            layers: result.bundlesUsed.length,
          },
          'Context generated with new engine'
        );

        telemetry.record({
          timestamp: Date.now(),
          userId,
          conversationId,
          totalDurationMs: result.metadata.assemblyTimeMs,
          embeddingDurationMs: 0,
          detectionDurationMs: 0,
          retrievalDurationMs: 0,
          compilationDurationMs: result.metadata.assemblyTimeMs,
          tokenBudget: result.budget.totalAvailable,
          tokenUsed: result.budget.totalUsed,
          tokenEfficiency: result.budget.totalUsed / result.budget.totalAvailable,
          bundlesCacheHits: 0,
          bundlesCacheMisses: 0,
          cacheHitRate: result.metadata.cacheHitRate,
          topicsDetected: result.metadata.detectedTopics,
          entitiesDetected: result.metadata.detectedEntities,
          acusRetrieved: 0,
          memoriesRetrieved: 0,
          bundlesUsed: result.bundlesUsed.length,
          avgSimilarityScore: 0,
          coverageScore: result.bundlesUsed.length / 5,
          freshnessScore: 1,
          engineUsed: 'legacy',
          parallelFactor: 1,
          errors: [],
        });

        return {
          systemPrompt: result.systemPrompt,
          layers: result.budget,
          stats: {
            engine: 'dynamic',
            messageCount: result.metadata.conversationStats?.messageCount || 0,
            detectedTopics: result.metadata.detectedTopics,
            detectedEntities: result.metadata.detectedEntities,
            cacheHitRate: result.metadata.cacheHitRate,
            bundlesInfo: result.metadata.bundlesInfo,
          },
          engineUsed: 'new',
        };
      } catch (error) {
        log.warn({ error: error.message }, 'New engine failed, attempting fallback');
        if (!this.config.fallbackOnError) {
          throw error;
        }
        // Fall through to old implementation
      }
    }

    // Fallback to old context generator
    log.info('Using fallback context generator');
    const oldResult = await oldContextGenerator.getContextForChat(conversationId, options);
    return {
      ...oldResult,
      engineUsed: 'old',
    };
  }

  /**
   * Generate and cache bundles for proactive warmup
   */
  async warmupBundles(userId: string, presence: any): Promise<void> {
    if (!this.config.enableNewContextEngine || !this.dynamicAssembler) {
      return;
    }

    try {
      const result = await this.dynamicAssembler.assemble({
        userId,
        conversationId: 'new-chat',
        userMessage: '',
        deviceId: presence.deviceId,
        settings: await this.getUserContextSettings(userId),
      });

      logger.info(
        {
          userId,
          bundleTypes: result.bundlesUsed,
          totalTokens: result.budget.totalUsed,
        },
        'Bundles warmed up'
      );
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to warmup bundles');
    }
  }

  /**
   * Invalidate bundles when data changes
   * Now emits events to ContextEventBus instead of direct Prisma updates
   */
  async invalidateBundles(userId: string, eventType: string, relatedIds: string[]): Promise<void> {
    // Emit event to ContextEventBus - InvalidationService will handle the actual invalidation
    // This decouples invalidation logic from business logic
    const eventTypes: Record<string, string> = {
      'memory:created': 'memory:created',
      'memory:updated': 'memory:updated',
      'memory:deleted': 'memory:deleted',
      'acu:processed': 'acu:processed',
      'acu:deleted': 'acu:deleted',
      'conversation:message_added': 'conversation:message_added',
      'conversation:archived': 'conversation:archived',
      'topic:updated': 'topic:updated',
      'entity:updated': 'entity:updated',
    };

    const mappedEventType = eventTypes[eventType];
    if (!mappedEventType) {
      logger.warn({ eventType }, 'Unknown event type for bundle invalidation');
      return;
    }

    // Emit event for each related ID
    for (const id of relatedIds) {
      await this.contextEventBus.emit(mappedEventType, {
        userId,
        [this.getEntityIdField(eventType)]: id,
      });
    }
  }

  /**
   * Get the ID field name for an event type
   */
  private getEntityIdField(eventType: string): string {
    if (eventType.includes('memory')) return 'memoryId';
    if (eventType.includes('acu')) return 'acuId';
    if (eventType.includes('conversation')) return 'conversationId';
    if (eventType.includes('topic')) return 'topicId';
    if (eventType.includes('entity')) return 'entityId';
    return 'id';
  }

  /**
   * Trigger Librarian Worker for autonomous learning
   * Called when conversation moves to IDLE state
   */
  async triggerLibrarian(conversationId: string): Promise<void> {
    if (!this.librarianWorker) {
      logger.debug('Librarian Worker not initialized');
      return;
    }

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { ownerId: true },
      });

      if (conversation?.ownerId) {
        await this.librarianWorker.processUser(conversation.ownerId);
      }
    } catch (error) {
      logger.error({ conversationId, error: (error as Error).message }, 'Librarian trigger failed');
    }
  }

  /**
   * Get Librarian Worker status
   */
  getLibrarianStatus(): { enabled: boolean; lastRunTime: Date | null } | null {
    if (!this.librarianWorker) {
      return null;
    }
    return this.librarianWorker.getStatus();
  }

  private async getUserIdForConversation(conversationId: string): Promise<string | null> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true },
    });
    return conv?.ownerId || null;
  }

  private async getUserContextSettings(userId: string): Promise<any> {
    const settings = await prisma.userContextSettings.findUnique({
      where: { userId },
    });

    return (
      settings || {
        maxContextTokens: 12000,
        knowledgeDepth: 'standard',
        prioritizeConversationHistory: true,
        includeEntityContext: true,
      }
    );
  }

  private getBundleTypesForEvent(eventType: string): string[] {
    const eventToBundles: Record<string, string[]> = {
      memory_created: ['identity_core', 'global_prefs'],
      memory_updated: ['identity_core', 'global_prefs'],
      memory_deleted: ['identity_core', 'global_prefs'],
      instruction_changed: ['global_prefs'],
      message_created: ['conversation'],
      conversation_message: ['conversation'],
      acu_created: ['topic', 'entity'],
      acu_updated: ['topic', 'entity'],
      topic_updated: ['topic'],
      entity_updated: ['entity'],
      conversation_updated: ['conversation'],
    };

    return eventToBundles[eventType] || [];
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{
    newEngineAvailable: boolean;
    oldEngineAvailable: boolean;
    stats: {
      topicProfiles: number;
      entityProfiles: number;
      contextBundles: number;
    };
  }> {
    const userId = 'system'; // System-wide check

    const [topicCount, entityCount, bundleCount] = await Promise.all([
      prisma.topicProfile.count({ where: { userId } }),
      prisma.entityProfile.count({ where: { userId } }),
      prisma.contextBundle.count({ where: { userId } }),
    ]);

    return {
      newEngineAvailable: !!this.dynamicAssembler,
      oldEngineAvailable: true,
      stats: {
        topicProfiles: topicCount,
        entityProfiles: entityCount,
        contextBundles: bundleCount,
      },
    };
  }
}

export const unifiedContextService = new UnifiedContextService();
