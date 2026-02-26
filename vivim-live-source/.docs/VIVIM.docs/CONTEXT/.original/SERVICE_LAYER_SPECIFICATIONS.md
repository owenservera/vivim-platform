# Service Layer Implementation Specifications

**Document Version:** 1.0.0
**Date:** February 11, 2026
**Related:** `IMPLEMENTATION_GUIDE_MASTER.md`, `CONTEXT_ENGINE_ALGORITHMS.md`

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [UnifiedContextService](#unifiedcontextservice)
3. [ProfileRollupService](#profilerollupservice)
4. [InvalidationService](#invalidationservice)
5. [ContextWarmupWorker](#contextwarmupworker)
6. [BundleCompiler](#bundlecompiler)
7. [DynamicContextAssembler](#dynamiccontextassembler)
8. [Service Orchestration](#service-orchestration)

---

## Service Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  AI Route (Unified Context Entry Point)           │    │
│  │  - Tries new engine first                                │    │
│  │  - Falls back to legacy if fail                        │    │
│  └────────────────────┬────────────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  SERVICE LAYER (TS)                         │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Unified   │→ │  Profile       │→ │  Invalidation  │   │
│  │  Context   │  │  Rollup        │  │  Service      │   │
│  │  Service   │  │  Service       │  │               │   │
│  └────────────┘  └──────────────┘  └──────────────┘   │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Bundle    │→ │  Warmup        │→ │  Dynamic      │   │
│  │  Compiler   │  │  Worker         │  │  Assembler     │   │
│  └────────────┘  └──────────────┘  └──────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │  Legacy Services (JS) - Fallback Path        │   │
│  │  - context-generator.js                           │   │
│  │  - acu-generator.js                              │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  DATA PERSISTENCE LAYER                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Dependencies

| Service | Dependencies | External APIs | Output |
|-----------|--------------|----------------|--------|
| `UnifiedContextService` | `DynamicContextAssembler`, `context-generator.js` | Context for chat |
| `ProfileRollupService` | Prisma, EmbeddingService | Populated profiles |
| `InvalidationService` | Prisma, `BundleCompiler` | Dirty bundles marked |
| `ContextWarmupWorker` | `PredictionEngine`, `BundleCompiler` | Pre-compiled bundles |
| `BundleCompiler` | Prisma, LLM, TokenEstimator | Compiled context text |
| `DynamicContextAssembler` | `BundleCompiler`, `BudgetAlgorithm`, LLM | Final prompt |

---

## UnifiedContextService

**Purpose**: Safe migration bridge between legacy and new context systems

### Interface

```typescript
interface ContextGenerationOptions {
  conversationId: string;
  userId: string;
  includeHistory: boolean;
  useDynamicEngine?: boolean;
  maxTokens?: number;
}

interface ContextGenerationResult {
  systemPrompt: string;
  engineUsed: 'legacy' | 'dynamic';
  budget?: BudgetResult;
  stats?: {
    assemblyTimeMs: number;
    cacheHitRate: number;
    bundlesUsed: string[];
  };
}
```

### Implementation

```typescript
// server/src/services/unified-context-service.ts

import { DynamicContextAssembler } from '../context/dynamic-context-assembler';
import { getContextForChat as getLegacyContext } from './legacy/context-generator';
import logger from '../utils/logger';

class UnifiedContextService {
  private config: {
    enableNewContextEngine: boolean;
    fallbackOnError: boolean;
    featureFlagHeader: string;
  };
  private dynamicAssembler: DynamicContextAssembler | null = null;

  constructor() {
    this.config = {
      enableNewContextEngine: process.env.USE_DYNAMIC_CONTEXT === 'true',
      fallbackOnError: true,
      featureFlagHeader: 'x-use-dynamic-context'
    };

    if (this.config.enableNewContextEngine) {
      this.dynamicAssembler = new DynamicContextAssembler();
    }
  }

  /**
   * Main entry point for context generation
   * Implements dual-driver pattern: try new, fallback to old
   */
  async generateContextForChat(
    options: ContextGenerationOptions
  ): Promise<ContextGenerationResult> {

    const startTime = Date.now();
    const useDynamic = options.useDynamicEngine ??
      (this.config.enableNewContextEngine && this.dynamicAssembler !== null);

    logger.info({
      useDynamic,
      conversationId: options.conversationId,
      maxTokens: options.maxTokens
    }, 'UnifiedContextService: Generating context');

    // ═════════════════════════════════════════════
    // Try new engine first
    // ═════════════════════════════════════════════
    if (useDynamic && this.dynamicAssembler) {
      try {
        const dynamicResult = await this.dynamicAssembler.assemble({
          userId: options.userId,
          conversationId: options.conversationId,
          userMessage: '',  // No user message needed for initial context
          personaId: undefined
        });

        logger.info({
          engine: 'dynamic',
          assemblyTimeMs: Date.now() - startTime,
          budgetUsed: dynamicResult.budget.totalUsed,
          bundlesUsed: dynamicResult.bundlesUsed.map(b => b.bundleType)
        }, 'UnifiedContextService: New engine success');

        return {
          systemPrompt: dynamicResult.systemPrompt,
          engineUsed: 'dynamic',
          budget: dynamicResult.budget,
          stats: {
            assemblyTimeMs: Date.now() - startTime,
            cacheHitRate: this.calculateCacheHitRate(dynamicResult.bundlesUsed),
            bundlesUsed: dynamicResult.bundlesUsed.map(b => b.bundleType)
          }
        };
      } catch (error) {
        logger.error({
          error: error.message,
          stack: error.stack
        }, 'UnifiedContextService: New engine failed');

        if (!this.config.fallbackOnError) {
          throw error;  // Re-throw if fallback disabled
        }
      }
    }

    // ═════════════════════════════════════════════
    // Fallback to legacy (context-generator.js)
    // ═════════════════════════════════════════════
    try {
      const legacyResult = await getLegacyContext(options.conversationId, {
        includeHistory: options.includeHistory
      });

      logger.info({
        engine: 'legacy',
        assemblyTimeMs: Date.now() - startTime
      }, 'UnifiedContextService: Legacy engine fallback');

      return {
        systemPrompt: legacyResult.systemPrompt,
        engineUsed: 'legacy'
      };
    } catch (legacyError) {
      logger.error({
        error: legacyError.message,
        stack: legacyError.stack
      }, 'UnifiedContextService: Legacy engine also failed');

      throw new Error(`Both context engines failed. New: ${error.message}, Legacy: ${legacyError.message}`);
    }
  }

  /**
   * Calculate cache hit rate for monitoring
   */
  private calculateCacheHitRate(bundles: ContextBundle[]): number {
    if (bundles.length === 0) return 0;

    const hits = bundles.filter(b => b.hitCount > 0).length;
    return hits / bundles.length;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    newEngineAvailable: boolean;
    oldEngineAvailable: boolean;
    stats?: any;
  }> {
    const health: any = {
      status: 'healthy',
      newEngineAvailable: !!this.dynamicAssembler,
      oldEngineAvailable: true
    };

    // Add stats if dynamic engine is available
    if (this.dynamicAssembler) {
      health.stats = await this.dynamicAssembler.getStats();
    }

    return health;
  }
}

export default UnifiedContextService;
```

---

## ProfileRollupService

**Purpose**: Populate "ghost tables" (TopicProfile, EntityProfile) from raw ACUs

### Core Algorithm: Triage → Cluster → Profile

```
Unprocessed ACUs
    ↓
Extract Topics/Entities (keyword + embedding similarity)
    ↓
Cluster ACUs into Groups
    ↓
Create/Update TopicProfiles
    ↓
Create/Update EntityProfiles
    ↓
Mark Profiles Dirty (triggers BundleCompiler)
```

### Implementation

```typescript
// server/src/services/profile-rollup-service.ts

import prisma from '../utils/prisma';
import { generateEmbedding } from '../services/embedding-service';
import logger from '../utils/logger';

class ProfileRollupService {
  private readonly TECH_TOPICS = [
    'react', 'vue', 'angular', 'typescript', 'javascript',
    'nodejs', 'python', 'rust', 'go', 'java', 'prisma',
    'postgresql', 'mongodb', 'redis', 'graphql', 'rest',
    'docker', 'kubernetes', 'aws', 'vercel', 'vite', 'webpack'
  ];

  private readonly ENTITY_TYPES = ['tool', 'organization', 'person', 'concept'];

  /**
   * Main rollup entry point
   */
  async rollupProfiles(
    userId: string,
    options: { limit?: number; force?: boolean } = {}
  ): Promise<{
    topicsCreated: number;
    topicsUpdated: number;
    entitiesCreated: number;
    entitiesUpdated: number;
    acusProcessed: number;
  }> {

    logger.info({ userId, ...options }, 'ProfileRollupService: Starting rollup');

    // 1. Get unprocessed ACUs
    const userDid = await this.getUserDid(userId);
    const unprocessedACUs = await prisma.atomicChatUnit.findMany({
      where: {
        authorDid: userDid,
        embedding: null,  // ← Unprocessed flag
        state: 'ACTIVE'
      },
      orderBy: { createdAt: 'asc' },
      take: options.limit || 50
    });

    if (unprocessedACUs.length === 0) {
      logger.info({ userId }, 'ProfileRollupService: No unprocessed ACUs');
      return {
        topicsCreated: 0,
        topicsUpdated: 0,
        entitiesCreated: 0,
        entitiesUpdated: 0,
        acusProcessed: 0
      };
    }

    // 2. Generate embeddings in batch
    logger.info({ count: unprocessedACUs.length }, 'ProfileRollupService: Generating embeddings');
    const embeddings = await this.generateEmbeddingsBatch(
      unprocessedACUs.map(a => a.content)
    );

    // 3. Update ACUs with embeddings
    await this.updateACUsWithEmbeddings(unprocessedACUs, embeddings);

    // 4. Extract topics and entities
    const { topics, entities } = await this.extractTopicsAndEntities(unprocessedACUs);

    // 5. Cluster ACUs and create/update profiles
    const results = await this.processTopics(userId, topics);
    const entityResults = await this.processEntities(userId, entities);

    const totalProcessed = unprocessedACUs.length;

    logger.info({
      userId,
      totalProcessed: totalProcessed,
      topicsCreated: results.created,
      topicsUpdated: results.updated,
      entitiesCreated: entityResults.created,
      entitiesUpdated: entityResults.updated
    }, 'ProfileRollupService: Rollup complete');

    return {
      topicsCreated: results.created,
      topicsUpdated: results.updated,
      entitiesCreated: entityResults.created,
      entitiesUpdated: entityResults.updated,
      acusProcessed: totalProcessed
    };
  }

  /**
   * Extract topics from ACU content using keyword matching + embedding
   */
  private async extractTopicsAndEntities(
    acus: AtomicChatUnit[]
  ): Promise<{
    topics: Map<string, { acus: AtomicChatUnit[], domain: string }>;
    entities: Map<string, { acus: AtomicChatUnit[], type: string }>;
  }> {

    const topics = new Map();
    const entities = new Map();

    for (const acu of acus) {
      const content = acu.content.toLowerCase();

      // Keyword matching for known tech topics
      for (const topic of this.TECH_TOPICS) {
        if (content.includes(topic)) {
          const existing = topics.get(topic) || { acus: [], domain: 'engineering' };
          existing.acus.push(acu);
          topics.set(topic, existing);
          break;
        }
      }

      // Entity extraction (capitalized words)
      const capitalizedWords = content.match(/\b[A-Z][a-z]+\b/g) || [];
      for (const entity of capitalizedWords) {
        if (this.TECH_TOPICS.includes(entity.toLowerCase())) continue;  // Skip tech topics

        const existing = entities.get(entity) || { acus: [], type: 'person' };

        // Infer entity type from context
        if (entity.endsWith('corp') || entity.endsWith('Inc')) {
          existing.type = 'organization';
        } else if (['github', 'vite', 'docker', 'aws'].includes(entity.toLowerCase())) {
          existing.type = 'tool';
        }

        existing.acus.push(acu);
        entities.set(entity, existing);
      }
    }

    return { topics, entities };
  }

  /**
   * Process extracted topics - create or update profiles
   */
  private async processTopics(
    userId: string,
    topics: Map<string, { acus: AtomicChatUnit[], domain: string }>
  ): Promise<{ created: number; updated: number }> {

    let created = 0;
    let updated = 0;

    for (const [slug, { acus, domain }] of topics) {
      // Minimum ACUs to create a topic profile
      if (acus.length < 5) continue;

      const existing = await prisma.topicProfile.findUnique({
        where: { userId_slug: { userId, slug } }
      });

      const importanceScore = this.calculateTopicImportance(acus, domain);

      if (existing) {
        // Update existing profile
        await prisma.topicProfile.update({
          where: { id: existing.id },
          data: {
            totalAcus: { increment: acus.length },
            importanceScore: Math.max(importanceScore, existing.importanceScore),
            lastEngagedAt: new Date(),
            isDirty: true  // Trigger recompile
          }
        });
        updated++;
      } else {
        // Create new profile
        await prisma.topicProfile.create({
          data: {
            userId,
            slug,
            label: slug.charAt(0).toUpperCase() + slug.slice(1),
            domain,
            totalAcus: acus.length,
            importanceScore,
            firstEngagedAt: new Date(),
            lastEngagedAt: new Date()
          }
        });
        created++;
      }
    }

    return { created, updated };
  }

  /**
   * Process extracted entities - create or update profiles
   */
  private async processEntities(
    userId: string,
    entities: Map<string, { acus: AtomicChatUnit[], type: string }>
  ): Promise<{ created: number; updated: number }> {

    let created = 0;
    let updated = 0;

    for (const [name, { acus, type }] of entities) {
      if (acus.length < 3) continue;

      const existing = await prisma.entityProfile.findUnique({
        where: { userId_name_type: { userId, name, type } }
      });

      const importanceScore = this.calculateEntityImportance(acus);

      if (existing) {
        await prisma.entityProfile.update({
          where: { id: existing.id },
          data: {
            mentionCount: { increment: acus.length },
            importanceScore: Math.max(importanceScore, existing.importanceScore),
            lastMentionedAt: new Date(),
            isDirty: true
          }
        });
        updated++;
      } else {
        await prisma.entityProfile.create({
          data: {
            userId,
            name,
            type,
            mentionCount: acus.length,
            importanceScore,
            firstMentionedAt: new Date(),
            lastMentionedAt: new Date()
          }
        });
        created++;
      }
    }

    return { created, updated };
  }

  /**
   * Calculate importance score for topics
   */
  private calculateTopicImportance(
    acus: AtomicChatUnit[],
    domain: string
  ): number {

    let score = 0.5;

    // Frequency: more ACUs = higher importance
    score += Math.min(0.3, acus.length * 0.01);

    // Recency: recent ACUs boost importance
    const now = Date.now();
    const recentCount = acus.filter(a =>
      now - a.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000  // Last 7 days
    ).length;
    score += (recentCount / acus.length) * 0.15;

    // Domain-specific boosts
    if (domain === 'engineering') score += 0.1;
    if (domain === 'business') score += 0.05;

    return Math.min(1.0, score);
  }

  /**
   * Calculate importance score for entities
   */
  private calculateEntityImportance(acus: AtomicChatUnit[]): number {
    let score = 0.5;

    // Mention frequency
    score += Math.min(0.2, acus.length * 0.02);

    // Conversation spread (mentioned across multiple conversations)
    const uniqueConversations = new Set(acus.map(a => a.conversationId));
    if (uniqueConversations.size > 1) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Generate embeddings in batches to avoid rate limits
   */
  private async generateEmbeddingsBatch(
    texts: string[]
  ): Promise<number[][]> {

    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length));

      try {
        const embeddings = await generateEmbedding(batch);
        results.push(...embeddings);
      } catch (error) {
        logger.error({ error: error.message }, 'ProfileRollupService: Embedding generation failed');
        // Use fallback mock vectors
        const mockVectors = batch.map(() =>
          Array.from({ length: 1536 }, () => Math.random())
        );
        results.push(...mockVectors);
      }

      // Rate limit delay
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Update ACUs with their new embeddings
   */
  private async updateACUsWithEmbeddings(
    acus: AtomicChatUnit[],
    embeddings: number[][]
  ): Promise<void> {

    for (let i = 0; i < acus.length; i++) {
      await prisma.atomicChatUnit.update({
        where: { id: acus[i].id },
        data: { embedding: embeddings[i] }
      });
    }
  }

  /**
   * Rollup trigger for specific user
   */
  async triggerRollupForUser(
    userId: string,
    options: { limit?: number } = {}
  ): Promise<any> {
    return await this.rollupProfiles(userId, options);
  }

  /**
   * Get user DID from userId
   */
  private async getUserDid(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.did || `did:openscroll:${userId}`;
  }
}

export default ProfileRollupService;
```

---

## InvalidationService

**Purpose**: Event-driven invalidation of context bundles when source data changes

### Event Mapping

```typescript
interface InvalidationEvent {
  eventType: string;
  userId: string;
  relatedIds?: {
    topicId?: string;
    entityId?: string;
    conversationId?: string;
    memoryId?: string;
    instructionId?: string;
  };
  timestamp: Date;
}

const EVENT_TO_BUNDLES: Record<string, string[]> = {
  // Memory changes affect identity and preferences
  'memory_created': ['identity_core', 'global_prefs'],
  'memory_updated': ['identity_core', 'global_prefs'],
  'memory_deleted': ['identity_core', 'global_prefs'],

  // Instruction changes affect preferences
  'instruction_changed': ['global_prefs'],
  'instruction_deleted': ['global_prefs'],

  // Message changes affect conversation and topics
  'message_created': ['conversation'],
  'message_updated': ['conversation'],

  // ACU changes affect topics and entities
  'acu_created': ['topic', 'entity'],
  'acu_updated': ['topic', 'entity'],

  // Topic profile changes affect topic bundles
  'topic_updated': ['topic'],
  'topic_deleted': ['topic'],

  // Entity profile changes affect entity bundles
  'entity_updated': ['entity'],
  'entity_deleted': ['entity'],

  // Conversation changes affect conversation bundles
  'conversation_updated': ['conversation']
};
```

### Implementation

```typescript
// server/src/services/invalidation-service.ts

import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { EVENT_TO_BUNDLES } from '../constants/invalidation-events';

class InvalidationService {
  private queue: InvalidationEvent[] = [];
  private processing = false;

  /**
   * Main invalidation entry point
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    logger.info({
      eventType: event.eventType,
      userId: event.userId,
      relatedIds: event.relatedIds
    }, 'InvalidationService: Invalidating bundles');

    // Determine affected bundle types
    const bundleTypes = this.getAffectedBundleTypes(event.eventType);

    // Mark bundles dirty
    for (const bundleType of bundleTypes) {
      await this.markBundlesDirty(event.userId, bundleType, event.relatedIds);
    }

    // Trigger recompilation for active contexts
    await this.triggerRecompilation(event.userId, event.relatedIds);
  }

  /**
   * Determine which bundle types are affected by an event
   */
  private getAffectedBundleTypes(eventType: string): string[] {
    return EVENT_TO_BUNDLES[eventType] || [];
  }

  /**
   * Mark specific bundles as dirty
   */
  private async markBundlesDirty(
    userId: string,
    bundleType: string,
    relatedIds?: InvalidationEvent['relatedIds']
  ): Promise<void> {

    const where: any = {
      userId,
      bundleType,
      isDirty: false
    };

    // Add reference ID filter based on bundle type
    if (bundleType === 'topic' && relatedIds?.topicId) {
      where.topicProfileId = relatedIds.topicId;
    } else if (bundleType === 'entity' && relatedIds?.entityId) {
      where.entityProfileId = relatedIds.entityId;
    } else if (bundleType === 'conversation' && relatedIds?.conversationId) {
      where.conversationId = relatedIds.conversationId;
    }

    const result = await prisma.contextBundle.updateMany({
      where,
      data: {
        isDirty: true,
        missCount: { increment: 1 }
      }
    });

    logger.info({
      userId,
      bundleType,
      count: result.count,
      relatedIds
    }, 'InvalidationService: Bundles marked dirty');
  }

  /**
   * Trigger recompilation for affected bundles
   */
  private async triggerRecompilation(
    userId: string,
    relatedIds?: InvalidationEvent['relatedIds']
  ): Promise<void> {

    // Queue for background processing
    const queueItems = relatedIds ? Object.entries(relatedIds).map(([key, value]) => ({
      trigger: 'invalidation-recompile',
      metadata: JSON.stringify({ userId, [key]: value }),
      status: 'pending'
    })) : [{
      trigger: 'invalidation-recompile',
      metadata: JSON.stringify({ userId }),
      status: 'pending'
    }];

    // Store in system action queue (or use job queue)
    for (const item of queueItems) {
      await prisma.systemAction.create({
        data: item
      });
    }

    logger.info({
      userId,
      queuedItems: queueItems.length
    }, 'InvalidationService: Queued recompilation');
  }

  /**
   * Process invalidation queue (background worker)
   */
  async processQueue(limit: number = 10): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const queueItems = await prisma.systemAction.findMany({
        where: {
          trigger: 'invalidation-queue',
          status: 'pending'
        },
        orderBy: { createdAt: 'asc' },
        take: limit
      });

      logger.info({ count: queueItems.length }, 'InvalidationService: Processing queue');

      for (const item of queueItems) {
        const event = JSON.parse(item.metadata);
        await this.invalidate(event);

        // Mark as processed
        await prisma.systemAction.update({
          where: { id: item.id },
          data: { status: 'completed', completedAt: new Date() }
        });
      }

      logger.info({
        processed: queueItems.length
      }, 'InvalidationService: Queue processed');

    } finally {
      this.processing = false;
    }
  }

  /**
   * Health check for monitoring
   */
  async getHealthStats(): Promise<{
    queueLength: number;
    dirtyBundles: number;
    processing: boolean;
  }> {
    const queueLength = await prisma.systemAction.count({
      where: {
        trigger: 'invalidation-queue',
        status: 'pending'
      }
    });

    const dirtyBundles = await prisma.contextBundle.count({
      where: { isDirty: true }
    });

    return {
      queueLength,
      dirtyBundles,
      processing: this.processing
    };
  }
}

export default InvalidationService;
```

---

## ContextWarmupWorker

**Purpose**: Proactively generate context bundles based on user presence and predictions

### Worker Lifecycle

```
User Presence Update
    ↓
Prediction Engine → Next Likely Interactions
    ↓
Bundle Compiler → Pre-build Context Bundles
    ↓
ContextBundle Table → Cache Ready (hits on next request)
```

### Implementation

```typescript
// server/src/services/context-warmup-worker.ts

import prisma from '../utils/prisma';
import { PredictionEngine } from './prediction-engine';
import { BundleCompiler } from './bundle-compiler';
import logger from '../utils/logger';

class ContextWarmupWorker {
  private predictionEngine: PredictionEngine;
  private bundleCompiler: BundleCompiler;
  private processing = false;

  constructor() {
    this.predictionEngine = new PredictionEngine();
    this.bundleCompiler = new BundleCompiler();
  }

  /**
   * Main entry point called on presence updates
   */
  async onPresenceUpdate(
    userId: string,
    presence: ClientPresence
  ): Promise<void> {

    logger.info({
      userId,
      activeConversation: presence.activeConversationId,
      visibleConversations: presence.visibleConversationIds.length
    }, 'ContextWarmupWorker: Presence update received');

    // 1. Ensure L0 and L1 are fresh (always needed)
    await Promise.allSettled([
      this.ensureFresh(userId, 'identity_core'),
      this.ensureFresh(userId, 'global_prefs')
    ]);

    // 2. Predict likely next interactions
    const predictions = await this.predictionEngine.predictNextInteractions(userId, presence);

    // 3. Pre-build bundles for high-probability predictions
    const warmupTasks = predictions
      .filter(p => p.probability >= 0.15)  // Minimum threshold
      .slice(0, 3);  // Top 3 only to limit concurrent compiles

    for (const prediction of warmupTasks) {
      try {
        await this.warmupBundleForPrediction(userId, prediction);
      } catch (error) {
        logger.error({
          prediction,
          error: error.message
        }, 'ContextWarmupWorker: Failed to warmup bundle');
      }
    }

    logger.info({
      userId,
      warmupTasks: warmupTasks.length
    }, 'ContextWarmupWorker: Warmup complete');
  }

  /**
   * Ensure a specific bundle is fresh
   */
  private async ensureFresh(
    userId: string,
    bundleType: string,
    referenceId?: string
  ): Promise<void> {

    const where: any = {
      userId,
      bundleType,
      OR: [
        referenceId ? {
          topicProfileId: referenceId
        } : {
          topicProfileId: null,
          entityProfileId: null,
          conversationId: null
        }
      ]
    };

    const existing = await prisma.contextBundle.findFirst({ where });

    const needsRecompile = !existing ||
      existing.isDirty ||
      (existing.expiresAt && existing.expiresAt < new Date()) ||
      (Date.now() - existing.compiledAt.getTime() > this.getTTL(bundleType));

    if (needsRecompile) {
      logger.info({
        userId,
        bundleType,
        referenceId,
        reason: existing ? 'stale' : 'missing'
      }, 'ContextWarmupWorker: Bundle needs recompile');

      await this.compileBundle(userId, bundleType, referenceId);
    }
  }

  /**
   * Get TTL for each bundle type
   */
  private getTTL(bundleType: string): number {
    const ttls: Record<string, number> = {
      'identity_core': 24 * 60 * 60 * 1000,      // 24 hours
      'global_prefs': 12 * 60 * 60 * 1000,        // 12 hours
      'topic': 4 * 60 * 60 * 1000,             // 4 hours
      'entity': 6 * 60 * 60 * 1000,             // 6 hours
      'conversation': 30 * 60 * 1000,           // 30 minutes
    };
    return ttls[bundleType] || 60 * 60 * 1000;
  }

  /**
   * Compile a specific bundle type
   */
  private async compileBundle(
    userId: string,
    bundleType: string,
    referenceId?: string
  ): Promise<void> {

    switch (bundleType) {
      case 'identity_core':
        await this.bundleCompiler.compileIdentityCore(userId);
        break;
      case 'global_prefs':
        await this.bundleCompiler.compileGlobalPrefs(userId);
        break;
      case 'topic':
        if (referenceId) {
          await this.bundleCompiler.compileTopicContext(userId, referenceId);
        }
        break;
      case 'entity':
        if (referenceId) {
          await this.bundleCompiler.compileEntityContext(userId, referenceId);
        }
        break;
      case 'conversation':
        if (referenceId) {
          await this.bundleCompiler.compileConversationContext(userId, referenceId);
        }
        break;
    }
  }

  /**
   * Warmup bundle for a specific prediction
   */
  private async warmupBundleForPrediction(
    userId: string,
    prediction: PredictedInteraction
  ): Promise<void> {

    logger.info({
      userId,
      predictionType: prediction.type,
      probability: prediction.probability,
      requiredBundles: prediction.requiredBundles
    }, 'ContextWarmupWorker: Warming up bundle');

    if (prediction.conversationId) {
      await this.ensureFresh(
        userId,
        'conversation',
        prediction.conversationId
      );
      await this.ensureFresh(
        userId,
        'topic',
        prediction.topicSlug
      );
    }

    if (prediction.topicSlug) {
      await this.ensureFresh(userId, 'topic', prediction.topicSlug);
    }

    if (prediction.entityId) {
      await this.ensureFresh(userId, 'entity', prediction.entityId);
    }
  }
}

export default ContextWarmupWorker;
```

---

## BundleCompiler

**Purpose**: Compile relational data (Prisma) into structured Markdown context blocks

### Compilation Methods

| Method | Output | TTL | Typical Token Count |
|--------|--------|-----|-------------------|
| `compileIdentityCore()` | "About This User" section | 24h | 300-500 |
| `compileGlobalPrefs()` | "Response Guidelines" section | 12h | 500-800 |
| `compileTopicContext()` | "Topic Context" section | 4h | 1000-2000 |
| `compileEntityContext()` | "Entity Context" section | 6h | 500-1000 |
| `compileConversationContext()` | "Current Conversation" section | 30m | 500-2000 |

### Implementation

```typescript
// server/src/context/bundle-compiler.ts

import prisma from '../utils/prisma';
import { estimateTokens } from '../utils/token-estimator';
import logger from '../utils/logger';

class BundleCompiler {

  /**
   * L0: Identity Core - WHO is this user
   */
  async compileIdentityCore(
    userId: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User ${userId} not found`);

    // Fetch core memories (biography, identity, role)
    const coreMemories = await prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        category: { in: ['biography', 'identity', 'role'] },
        importance: { gte: 0.8 }
      },
      orderBy: { importance: 'desc' },
      take: this.calculateTakeCount(targetTokens, 15)
    });

    // Compile into Markdown
    const compiled = [
      `## About This User`,
      ``,
      ...coreMemories.map(m => `- ${m.content}`)
    ].join('\n');

    const tokenCount = estimateTokens(compiled);

    // Store in ContextBundle table
    return await this.storeBundle(userId, 'identity_core', compiled, {
      memoryIds: coreMemories.map(m => m.id)
    }, undefined, undefined, undefined, undefined);
  }

  /**
   * L1: Global Preferences - HOW to respond
   */
  async compileGlobalPrefs(
    userId: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {

    // Fetch instructions and preference memories
    const [instructions, prefMemories] = await Promise.all([
      prisma.customInstruction.findMany({
        where: { userId, isActive: true, scope: 'global' },
        orderBy: { priority: 'desc' },
        take: this.calculateTakeCount(targetTokens, 10)
      }),
      prisma.memory.findMany({
        where: {
          userId,
          isActive: true,
          category: 'preference',
          importance: { gte: 0.6 }
        },
        orderBy: { importance: 'desc' },
        take: this.calculateTakeCount(targetTokens, 10)
      })
    ]);

    // Compile into Markdown
    const compiled = [
      `## Response Guidelines`,
      ...instructions.map(i => `- ${i.content}`),
      ``,
      `## Known Preferences`,
      ...prefMemories.map(m => `- ${m.content}`)
    ].join('\n');

    return await this.storeBundle(userId, 'global_prefs', compiled, {
      instructionIds: instructions.map(i => i.id),
      memoryIds: prefMemories.map(m => m.id)
    }, undefined, undefined, undefined, undefined);
  }

  /**
   * L2: Topic Context - deep domain knowledge
   */
  async compileTopicContext(
    userId: string,
    topicSlug: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {

    const topic = await prisma.topicProfile.findUnique({
      where: { userId_slug: { userId, slug: topicSlug } },
      include: {
        conversations: {
          include: { conversation: true },
          orderBy: { relevanceScore: 'desc' },
          take: 10
        }
      }
    });

    if (!topic) throw new Error(`Topic ${topicSlug} not found for user ${userId}`);

    // Get topic-specific memories
    const topicMemories = await prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        id: { in: topic.relatedMemoryIds }
      },
      orderBy: { importance: 'desc' },
      take: this.calculateTakeCount(targetTokens, 15)
    });

    // Get top ACUs via semantic search
    const topAcus = await prisma.$queryRaw<Array<any>>`
      SELECT id, content, "createdAt"
      FROM atomic_chat_units
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND 1 - (embedding <=> ${topic.embedding}::vector) > 0.4
      ORDER BY embedding <=> ${topic.embedding}::vector
      LIMIT ${this.calculateTakeCount(targetTokens, 20)}
    `;

    // Get conversation summaries
    const conversationSummaries = topic.conversations.map(tc => ({
      title: tc.conversation.title,
      relevance: tc.relevanceScore
    }));

    // Compile into Markdown
    const compiled = [
      `## Topic Context: ${topic.label}`,
      `User's level: ${topic.proficiencyLevel}`,
      `Engagement: ${topic.totalConversations} conversations, last engaged ${this.timeAgo(topic.lastEngagedAt)}`,
      ``,
      conversationSummaries.length > 0 ? [
        `### Previous Discussions`,
        ...conversationSummaries.slice(0, 5).map(s => `- ${s.title} (relevance: ${s.relevance})`)
      ] : [],
      ``,
      topicMemories.length > 0 ? [
        `### What You Know`,
        ...topicMemories.slice(0, 10).map(m => `- ${m.content}`)
      ] : [],
      ``,
      topAcus.length > 0 ? [
        `### Key Knowledge Points`,
        ...topAcus.slice(0, 10).map(a => `- ${a.content}`)
      ] : []
    ].filter(Boolean).join('\n');

    // Update TopicProfile compiled context
    const tokenCount = estimateTokens(compiled);
    await prisma.topicProfile.update({
      where: { id: topic.id },
      data: {
        compiledContext: compiled,
        compiledAt: new Date(),
        compiledTokenCount: tokenCount,
        isDirty: false,
        contextVersion: { increment: 1 }
      }
    });

    return await this.storeBundle(userId, 'topic', compiled, {
      memoryIds: topicMemories.map(m => m.id),
      acuIds: topAcus.map(a => a.id)
    }, topic.id, undefined, undefined, undefined);
  }

  /**
   * Store compiled bundle in database
   */
  private async storeBundle(
    userId: string,
    bundleType: string,
    compiled: string,
    composition: Record<string, string[]>,
    topicProfileId?: string,
    entityProfileId?: string,
    conversationId?: string,
    personaId?: string
  ): Promise<CompiledBundle> {

    const tokenCount = estimateTokens(compiled);

    // Use explicit nulls for compound unique constraint
    const result = await prisma.contextBundle.upsert({
      where: {
        userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
          userId,
          bundleType,
          topicProfileId: topicProfileId ?? null,
          entityProfileId: entityProfileId ?? null,
          conversationId: conversationId ?? null,
          personaId: personaId ?? null
        }
      },
      update: {
        compiledPrompt: compiled,
        tokenCount,
        composition,
        isDirty: false,
        version: { increment: 1 },
        compiledAt: new Date()
      },
      create: {
        userId,
        bundleType,
        compiledPrompt: compiled,
        tokenCount,
        composition,
        topicProfileId,
        entityProfileId,
        conversationId,
        personaId
      }
    });

    return {
      id: result.id,
      userId,
      bundleType,
      compiledPrompt: compiled,
      tokenCount,
      version: result.version
    };
  }

  /**
   * Calculate take count based on target tokens
   */
  private calculateTakeCount(targetTokens: number | undefined, defaultCount: number): number {
    if (!targetTokens) return defaultCount;
    // Rough estimate: ~50 tokens per item
    return Math.min(defaultCount, Math.ceil(targetTokens / 50));
  }

  /**
   * Format time ago string
   */
  private timeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}

interface CompiledBundle {
  id: string;
  userId: string;
  bundleType: string;
  compiledPrompt: string;
  tokenCount: number;
  version: number;
}

export default BundleCompiler;
```

---

## DynamicContextAssembler

**Purpose**: Orchestrates context assembly using pre-generated bundles + JIT retrieval

### Assembly Flow

```
1. Context Detection (embed + topic/entity match)
    ↓
2. Gather Pre-built Bundles (cache hits)
    ↓
3. JIT Retrieval (real-time vector search)
    ↓
4. Compute Budget (elastic allocation)
    ↓
5. Compile Final Prompt
    ↓
6. Track Usage (hit/miss stats)
```

### Implementation

```typescript
// server/src/context/dynamic-context-assembler.ts

import prisma from '../utils/prisma';
import { BundleCompiler } from './bundle-compiler';
import { BudgetAlgorithm } from './budget-algorithm';
import { estimateTokens } from '../utils/token-estimator';
import logger from '../utils/logger';

class DynamicContextAssembler {
  private bundleCompiler: BundleCompiler;
  private budgetAlgorithm: BudgetAlgorithm;

  constructor() {
    this.bundleCompiler = new BundleCompiler();
    this.budgetAlgorithm = new BudgetAlgorithm();
  }

  /**
   * Main assembly entry point
   */
  async assemble(params: {
    userId: string;
    conversationId: string;
    userMessage: string;
    personaId?: string;
    deviceId?: string;
  }): Promise<AssembledContext> {

    const startTime = Date.now();

    logger.info({
      userId: params.userId,
      conversationId: params.conversationId
    }, 'DynamicContextAssembler: Assembling context');

    // ═════════════════════════════════════════════
    // STEP 1: Detect what this message is about
    // ═════════════════════════════════════════════
    const messageEmbedding = await this.generateEmbedding(params.userMessage);
    const detectedContext = await this.detectMessageContext(
      params.userId,
      params.userMessage,
      messageEmbedding,
      params.conversationId
    );

    // ═════════════════════════════════════════════
    // STEP 2: Gather pre-built bundles (cache hits)
    // ═════════════════════════════════════════════
    const bundles = await this.gatherBundles(
      params.userId,
      detectedContext,
      params.conversationId,
      params.personaId
    );

    // ═════════════════════════════════════════════
    // STEP 3: Real-time L5 retrieval (only thing that must happen at request time)
    // ═════════════════════════════════════════════
    const jitKnowledge = await this.justInTimeRetrieval(
      params.userId,
      params.userMessage,
      messageEmbedding,
      detectedContext
    );

    // ═══════════════════════════════════════════
    // STEP 4: Compile final prompt within token budget
    // ═══════════════════════════════════════════
    const budget = this.budgetAlgorithm.computeBudget({
      totalBudget: 12000,  // User-configurable
      conversationMessageCount: await this.getMessageCount(params.conversationId),
      conversationTotalTokens: await this.getConversationTotalTokens(params.conversationId),
      userMessageTokens: estimateTokens(params.userMessage),
      detectedTopicCount: detectedContext.topics.length,
      detectedEntityCount: detectedContext.entities.length,
      hasActiveConversation: true,
      knowledgeDepth: 'standard',
      prioritizeHistory: true,
      availableBundles: this.getBundleTokenCounts(bundles)
    });

    const systemPrompt = this.compilePrompt(bundles, jitKnowledge, budget);

    // ═════════════════════════════════════════════
    // STEP 5: Track bundle usage (for optimization)
    // ═════════════════════════════════════════════
    await this.trackUsage(bundles);

    const assemblyTimeMs = Date.now() - startTime;

    logger.info({
      assemblyTimeMs,
      bundlesUsed: bundles.map(b => b.bundleType),
      totalTokens: budget.totalUsed
    }, 'DynamicContextAssembler: Assembly complete');

    return {
      systemPrompt,
      budget,
      stats: {
        assemblyTimeMs,
        cacheHitRate: this.calculateCacheHitRate(bundles),
        bundlesUsed: bundles.map(b => b.bundleType)
      }
    };
  }

  /**
   * Context Detection - what is this message about?
   */
  private async detectMessageContext(
    userId: string,
    message: string,
    embedding: number[],
    conversationId: string
  ): Promise<DetectedContext> {

    // Match against topic profiles (vector similarity)
    const matchedTopics = await prisma.$queryRaw<Array<any>>`
      SELECT id, slug, label,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM topic_profiles
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${embedding}::vector) > 0.35
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 3
    `;

    // Match against entity profiles
    const matchedEntities = await prisma.$queryRaw<Array<any>>`
      SELECT id, name, type,
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM entity_profiles
      WHERE "userId" = ${userId}
        AND 1 - (embedding <=> ${embedding}::vector) > 0.4
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 3
    `;

    // Also check for explicit entity mentions (string matching)
    const allEntities = await prisma.entityProfile.findMany({
      where: { userId },
      select: { id: true, name: true, aliases: true, type: true }
    });

    const mentionedEntities = allEntities.filter(e => {
      const names = [e.name.toLowerCase(), ...e.aliases.map(a => a.toLowerCase())];
      const msgLower = message.toLowerCase();
      return names.some(n => msgLower.includes(n));
    });

    // Merge semantic + explicit matches
    const entities = this.mergeEntityMatches(matchedEntities, mentionedEntities);

    // Get conversation's existing topic links
    const convTopics = await prisma.topicConversation.findMany({
      where: { conversationId },
      include: { topic: true }
    });

    return {
      topics: [
        ...convTopics.map(ct => ({
          slug: ct.topic.slug,
          profileId: ct.topic.id,
          source: 'conversation_history' as const,
          confidence: ct.relevanceScore
        })),
        ...matchedTopics.map(t => ({
          slug: t.slug,
          profileId: t.id,
          source: 'semantic_match' as const,
          confidence: t.similarity
        }))
      ],
      entities,
      isNewTopic: matchedTopics.length === 0 && convTopics.length === 0,
      isContinuation: convTopics.length > 0
    };
  }

  /**
   * Bundle Gathering - grab what's pre-built
   */
  private async gatherBundles(
    userId: string,
    context: DetectedContext,
    conversationId: string,
    personaId?: string
  ): Promise<ContextBundle[]> {

    const bundles: ContextBundle[] = [];

    // L0: Identity Core (always)
    const identity = await this.getBundle(userId, 'identity_core');
    if (identity) bundles.push(identity);

    // L1: Global Prefs (always)
    const prefs = await this.getBundle(userId, 'global_prefs');
    if (prefs) bundles.push(prefs);

    // L2: Topic Context (if topic detected)
    if (context.topics.length > 0) {
      const primaryTopic = context.topics.sort((a, b) => b.confidence - a.confidence)[0];

      const topicBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'topic',
          topicProfileId: primaryTopic.profileId,
          isDirty: false
        }
      });

      if (topicBundle) {
        bundles.push(topicBundle);
      }
    }

    // L3: Entity Context (if entities detected)
    for (const entity of context.entities.slice(0, 2)) {
      const entityBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'entity',
          entityProfileId: entity.id,
          isDirty: false
        }
      });

      if (entityBundle) bundles.push(entityBundle);
    }

    // L4: Conversation Context (if continuing)
    if (context.isContinuation) {
      const convBundle = await prisma.contextBundle.findFirst({
        where: {
          userId,
          bundleType: 'conversation',
          conversationId,
          isDirty: false
        }
      });

      if (convBundle) bundles.push(convBundle);
    }

    return bundles;
  }

  /**
   * JIT Retrieval - real-time vector search for pre-built bundles
   */
  private async justInTimeRetrieval(
    userId: string,
    message: string,
    embedding: number[],
    context: DetectedContext
  ): Promise<string> {

    // Search ACUs for highly similar content
    const similarACUs = await prisma.$queryRaw<Array<any>>`
      SELECT content, type, "createdAt",
        1 - (embedding <=> ${embedding}::vector) as similarity
      FROM atomic_chat_units
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND 1 - (embedding <=> ${embedding}::vector) > 0.45
      ORDER BY embedding <=> ${embedding}::vector
      LIMIT 5
    `;

    if (similarACUs.length === 0) return '';

    // Format as JIT section
    const jitContent = [
      `## Just-In-Time Knowledge`,
      ...similarACUs.slice(0, 5).map(a => `- ${a.content}`)
    ].join('\n');

    return jitContent;
  }

  /**
   * Compile final prompt from all layers
   */
  private compilePrompt(
    bundles: ContextBundle[],
    jitKnowledge: string,
    budget: BudgetResult
  ): string {

    const l0 = bundles.find(b => b.bundleType === 'identity_core')?.compiledPrompt || '';
    const l1 = bundles.find(b => b.bundleType === 'global_prefs')?.compiledPrompt || '';
    const l2 = bundles.find(b => b.bundleType === 'topic')?.compiledPrompt || '';
    const l3 = bundles.find(b => b.bundleType === 'entity')?.compiledPrompt || '';
    const l4 = bundles.find(b => b.bundleType === 'conversation')?.compiledPrompt || '';

    const finalPrompt = [
      l0,
      l1,
      l2,
      l3,
      `\n## Current Conversation\n`,
      l4,
      `\n\n## Just-In-Time Knowledge\n`,
      jitKnowledge,
      `\n\n## User Message\n`
    ].filter(Boolean).join('\n\n');

    return finalPrompt;
  }

  /**
   * Calculate cache hit rate for monitoring
   */
  private calculateCacheHitRate(bundles: ContextBundle[]): number {
    if (bundles.length === 0) return 0;
    const hits = bundles.filter(b => b.hitCount > 0).length;
    return hits / bundles.length;
  }

  /**
   * Track bundle usage (increment hit/miss counts)
   */
  private async trackUsage(bundles: ContextBundle[]): Promise<void> {
    for (const bundle of bundles) {
      await prisma.contextBundle.update({
        where: { id: bundle.id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date()
        }
      });
    }
  }
}

interface AssembledContext {
  systemPrompt: string;
  budget: BudgetResult;
  stats: {
    assemblyTimeMs: number;
    cacheHitRate: number;
    bundlesUsed: string[];
  };
}

interface DetectedContext {
  topics: Array<{ slug: string; profileId: string; source: string; confidence: number }>;
  entities: Array<{ id: string; name: string; type: string; confidence: number }>;
  isNewTopic: boolean;
  isContinuation: boolean;
}

export default DynamicContextAssembler;
```

---

## Service Orchestration

### Startup Sequence

```typescript
// server/src/context/index.ts

import UnifiedContextService from '../services/unified-context-service';
import ProfileRollupService from '../services/profile-rollup-service';
import InvalidationService from '../services/invalidation-service';
import ContextWarmupWorker from '../services/context-warmup-worker';

export class ContextEngine {
  private unifiedContextService: UnifiedContextService;
  private profileRollupService: ProfileRollupService;
  private invalidationService: InvalidationService;
  private warmupWorker: ContextWarmupWorker;

  constructor() {
    this.unifiedContextService = new UnifiedContextService();
    this.profileRollupService = new ProfileRollupService();
    this.invalidationService = new InvalidationService();
    this.warmupWorker = new ContextWarmupWorker();
  }

  /**
   * Initialize all context engine services
   */
  async initialize(): Promise<void> {
    logger.info('ContextEngine: Initializing services...');

    // Start invalidation queue processor (background)
    setInterval(() => {
      this.invalidationService.processQueue(10);
    }, 5000);  // Every 5 seconds

    // Start profile rollup scheduler
    setInterval(async () => {
      await this.profileRollupService.triggerRollupForUser(userId);
    }, 6 * 60 * 60 * 1000);  // Every 6 hours

    logger.info('ContextEngine: Services initialized');
  }

  /**
   * Public API for context generation
   */
  async generateContext(options: ContextGenerationOptions): Promise<ContextGenerationResult> {
    return await this.unifiedContextService.generateContextForChat(options);
  }

  /**
   * Health check for monitoring
   */
  async getHealth(): Promise<any> {
    const [contextHealth, rollupHealth, invalidationHealth] = await Promise.all([
      this.unifiedContextService.healthCheck(),
      this.profileRollupService.getHealthStats(),
      this.invalidationService.getHealthStats()
    ]);

    return {
      status: 'healthy',
      context: contextHealth,
      rollup: rollupHealth,
      invalidation: invalidationHealth
    };
  }
}
```

---

**Document End**

Refer to `IMPLEMENTATION_GUIDE_MASTER.md` for overview and other implementation documents.
