/**
 * Unified Context Service
 *
 * A bridge service that tries to use the new DynamicContextAssembler
 * but falls back to the old context-generator.js for reliability.
 *
 * This ensures a smooth migration path without breaking the UI.
 */

import { getPrismaClient } from '../lib/database.js';
import { DynamicContextAssembler, createEmbeddingService, createLLMService, LibrarianWorker, BundleCompiler, BudgetAlgorithm } from '../context/index.js';
import * as oldContextGenerator from '../services/context-generator.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();

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
      enableNewContextEngine: config.enableNewContextEngine ?? process.env.USE_DYNAMIC_CONTEXT !== 'false',
      fallbackOnError: config.fallbackOnError ?? true
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
          llmService
        });

        // Create token estimator
        const tokenEstimator = { estimateTokens: (text: string) => Math.ceil(text.length / 4) };

        this.dynamicAssembler = new DynamicContextAssembler({
          prisma,
          embeddingService,
          tokenEstimator,
          bundleCompiler: this.bundleCompiler
        });

        // Initialize Librarian Worker for autonomous learning
        this.librarianWorker = new LibrarianWorker({
          enabled: process.env.LIBRARIAN_ENABLED === 'true',
          llmService,
          embeddingService
        });

        logger.info({
          engine: 'dynamic',
          zaiEnabled: true
        }, 'UnifiedContextService initialized with Z.AI GLM-4.7');
      } catch (e) {
        logger.error({ error: (e as Error).message }, 'Failed to initialize DynamicContextAssembler with Z.AI');
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
  async generateContextForChat(conversationId: string, options = {}): Promise<{
    systemPrompt: string;
    layers: any;
    stats: any;
    engineUsed: 'new' | 'old';
  }> {
    const log = logger.child({ conversationId });
    log.info({ options }, 'Generating context');

    // Try new dynamic context assembler first
    if (this.config.enableNewContextEngine && this.dynamicAssembler) {
      try {
        const userId = await this.getUserIdForConversation(conversationId);
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
          settings: userSettings
        };

        const result = await this.dynamicAssembler.assemble(assemblyParams);
        log.info({
          engine: 'dynamic',
          tokens: result.budget.totalUsed,
          layers: result.bundlesUsed.length
        }, 'Context generated with new engine');

        return {
          systemPrompt: result.systemPrompt,
          layers: result.budget,
          stats: {
            engine: 'dynamic',
            messageCount: result.metadata.conversationStats?.messageCount || 0,
            detectedTopics: result.metadata.detectedTopics,
            detectedEntities: result.metadata.detectedEntities,
            cacheHitRate: result.metadata.cacheHitRate
          },
          engineUsed: 'new'
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
      engineUsed: 'old'
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
        settings: await this.getUserContextSettings(userId)
      });

      logger.info({
        userId,
        bundleTypes: result.bundlesUsed,
        totalTokens: result.budget.totalUsed
      }, 'Bundles warmed up');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to warmup bundles');
    }
  }

/**
    * Invalidate bundles when data changes
    */
  async invalidateBundles(userId: string, eventType: string, relatedIds: string[]): Promise<void> {
    // For now, use Prisma directly
    // TODO: Move this to InvalidationService once implemented
    const bundleTypes = this.getBundleTypesForEvent(eventType);

    for (const bundleType of bundleTypes) {
      if (bundleType === 'topic' && relatedIds.length > 0) {
        for (const topicId of relatedIds) {
          await prisma.contextBundle.updateMany({
            where: { userId, bundleType, topicProfileId: topicId },
            data: { isDirty: true }
          });
        }
      } else if (bundleType === 'entity' && relatedIds.length > 0) {
        for (const entityId of relatedIds) {
          await prisma.contextBundle.updateMany({
            where: { userId, bundleType, entityProfileId: entityId },
            data: { isDirty: true }
          });
        }
      } else if (bundleType === 'conversation' && relatedIds.length > 0) {
        for (const conversationId of relatedIds) {
          await prisma.contextBundle.updateMany({
            where: { userId, bundleType, conversationId },
            data: { isDirty: true }
          });
        }
      } else if (bundleType === 'identity_core') {
        await prisma.contextBundle.updateMany({
          where: { userId, bundleType, topicProfileId: null, entityProfileId: null },
          data: { isDirty: true }
        });
      } else if (bundleType === 'global_prefs') {
        await prisma.contextBundle.updateMany({
          where: { userId, bundleType, topicProfileId: null, entityProfileId: null },
          data: { isDirty: true }
        });
      }
    }
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
        select: { ownerId: true }
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
      select: { ownerId: true }
    });
    return conv?.ownerId || null;
  }

  private async getUserContextSettings(userId: string): Promise<any> {
    const settings = await prisma.userContextSettings.findUnique({
      where: { userId }
    });

    return settings || {
      maxContextTokens: 12000,
      knowledgeDepth: 'standard',
      prioritizeConversationHistory: true,
      includeEntityContext: true
    };
  }

  private getBundleTypesForEvent(eventType: string): string[] {
    const eventToBundles: Record<string, string[]> = {
      'memory_created': ['identity_core', 'global_prefs'],
      'memory_updated': ['identity_core', 'global_prefs'],
      'memory_deleted': ['identity_core', 'global_prefs'],
      'instruction_changed': ['global_prefs'],
      'message_created': ['conversation'],
      'conversation_message': ['conversation'],
      'acu_created': ['topic', 'entity'],
      'acu_updated': ['topic', 'entity'],
      'topic_updated': ['topic'],
      'entity_updated': ['entity'],
      'conversation_updated': ['conversation']
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
    }
  }> {
    const userId = 'system'; // System-wide check

    const [topicCount, entityCount, bundleCount] = await Promise.all([
      prisma.topicProfile.count({ where: { userId } }),
      prisma.entityProfile.count({ where: { userId } }),
      prisma.contextBundle.count({ where: { userId } })
    ]);

    return {
      newEngineAvailable: !!this.dynamicAssembler,
      oldEngineAvailable: true,
      stats: {
        topicProfiles: topicCount,
        entityProfiles: entityCount,
        contextBundles: bundleCount
      }
    };
  }
}

export const unifiedContextService = new UnifiedContextService();
