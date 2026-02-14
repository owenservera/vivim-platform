import { PrismaClient, Prisma } from '@prisma/client';
import type {
  AssembledContext,
  AssemblyParams,
  BudgetInput,
  CompiledBundle,
  DetectedContext,
  DetectedEntity,
  DetectedTopic,
  IEmbeddingService,
  ITokenEstimator,
  JITKnowledge,
  LayerBudget,
  TokenBudget,
} from './types';
import { BudgetAlgorithm } from './budget-algorithm';
import { BundleCompiler } from './bundle-compiler';
import { HybridRetrievalService } from './hybrid-retrieval';
import { getVIVIMSystemPrompt } from './vivim-identity-service';
import { getContextCache } from './index';
import { logger } from '../lib/logger.js';

interface ContextAssemblerConfig {
  prisma: PrismaClient;
  embeddingService: IEmbeddingService;
  tokenEstimator: ITokenEstimator;
  bundleCompiler: BundleCompiler;
}

interface TopicMatchResult {
  id: string;
  slug: string;
  label: string;
  similarity: number;
}

interface EntityMatchResult {
  id: string;
  name: string;
  type: string;
  similarity: number;
}

interface ACUResult {
  id: string;
  content: string;
  type: string;
  category: string;
  createdAt: Date;
  similarity: number;
}

interface MemoryResult {
  id: string;
  content: string;
  category: string;
  importance: number;
  similarity: number;
}

export class DynamicContextAssembler {
  private prisma: PrismaClient;
  private embeddingService: IEmbeddingService;
  private tokenEstimator: ITokenEstimator;
  private bundleCompiler: BundleCompiler;
  private hybridRetrieval: HybridRetrievalService;
  private cache = getContextCache();

  constructor(config: ContextAssemblerConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
    this.tokenEstimator = config.tokenEstimator;
    this.bundleCompiler = config.bundleCompiler;
    this.hybridRetrieval = new HybridRetrievalService(config.prisma);
  }

  async assemble(params: AssemblyParams): Promise<AssembledContext> {
    const startTime = Date.now();

    const cacheKey = `ctx:${params.userId}:${params.conversationId}:${params.userMessage.substring(0, 50)}`;
    const cached = this.cache.get<AssembledContext>('bundle', cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Context assembly cache hit');
      return cached;
    }

    // Fetch conversation stats if conversationId provided
    let conversationStats = {
      messageCount: 0,
      totalTokens: 0,
      hasConversation: params.conversationId && params.conversationId !== 'new-chat'
    };

    if (conversationStats.hasConversation) {
      try {
        const conv = await this.prisma.conversation.findUnique({
          where: { id: params.conversationId },
          select: { messageCount: true, totalTokens: true }
        });
        if (conv) {
          conversationStats.messageCount = conv.messageCount;
          conversationStats.totalTokens = conv.totalTokens || 0;
        }
      } catch (e) {
        // Conversation might not exist, continue with defaults
        conversationStats.hasConversation = false;
      }
    }

    const messageEmbedding = await this.embeddingService.embed(params.userMessage);
    const detectedContext = await this.detectMessageContext(
      params.userId,
      params.userMessage,
      messageEmbedding,
      params.conversationId
    );

    const bundles = await this.gatherBundles(
      params.userId,
      detectedContext,
      params.conversationId,
      params.personaId
    );

    const jitKnowledge = await this.justInTimeRetrieval(
      params.userId,
      params.userMessage,
      messageEmbedding,
      detectedContext
    );

    const budget = this.computeBudget(
      bundles,
      jitKnowledge,
      params,
      conversationStats,
      detectedContext
    );
    const systemPrompt = this.compilePrompt(bundles, jitKnowledge, budget);

    const assemblyTimeMs = Date.now() - startTime;

    await this.trackUsage(bundles, params.conversationId);

    const result: AssembledContext = {
      systemPrompt,
      budget,
      bundlesUsed: bundles.map(b => b.bundleType as any),
      metadata: {
        assemblyTimeMs,
        detectedTopics: detectedContext.topics.length,
        detectedEntities: detectedContext.entities.length,
        cacheHitRate: this.calculateCacheHitRate(bundles),
        conversationStats
      },
    };

    this.cache.set('bundle', cacheKey, result, 5 * 60 * 1000);

    return result;
  }

  private async detectMessageContext(
    userId: string,
    message: string,
    embedding: number[],
    conversationId: string
  ): Promise<DetectedContext> {
    // Find topic profiles with embeddings using Prisma (not raw SQL to avoid pgvector dependency)
    const matchedTopics = await this.prisma.topicProfile.findMany({
      where: {
        userId,
        embedding: { isEmpty: false }
      },
      take: 3,
      select: { id: true, slug: true, label: true }
    });

    // Find entity profiles with embeddings using Prisma
    const matchedEntities = await this.prisma.entityProfile.findMany({
      where: {
        userId,
        embedding: { isEmpty: false }
      },
      take: 3,
      select: { id: true, name: true, type: true }
    });

    const allEntities = await this.prisma.entityProfile.findMany({
      where: { userId },
      select: { id: true, name: true, aliases: true, type: true }
    });

    const mentionedEntities = allEntities.filter(e => {
      const names = [e.name.toLowerCase(), ...e.aliases.map(a => a.toLowerCase())];
      const msgLower = message.toLowerCase();
      return names.some(n => msgLower.includes(n));
    });

    const entities = this.mergeEntityMatches(matchedEntities, mentionedEntities);

    const convTopics = await this.prisma.topicConversation.findMany({
      where: { conversationId },
      include: { topic: true }
    });

    // Check if conversation exists (even without linked topics, it's a continuation)
    const hasConversation = conversationId && conversationId !== 'new-chat';

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
      isNewTopic: !hasConversation && matchedTopics.length === 0 && convTopics.length === 0,
      isContinuation: hasConversation || convTopics.length > 0,
    };
  }

  private mergeEntityMatches(
    semanticMatches: EntityMatchResult[],
    explicitMatches: Array<{ id: string; name: string; type: string }>
  ): DetectedEntity[] {
    const entityMap = new Map<string, DetectedEntity>();

    for (const match of semanticMatches) {
      entityMap.set(match.id, {
        id: match.id,
        name: match.name,
        type: match.type,
        source: 'semantic_match',
        confidence: match.similarity
      });
    }

    for (const match of explicitMatches) {
      if (!entityMap.has(match.id)) {
        entityMap.set(match.id, {
          id: match.id,
          name: match.name,
          type: match.type,
          source: 'explicit_mention',
          confidence: 1.0
        });
      } else {
        const existing = entityMap.get(match.id)!;
        existing.source = 'explicit_mention';
        existing.confidence = 1.0;
      }
    }

    return Array.from(entityMap.values());
  }

  private async gatherBundles(
    userId: string,
    context: DetectedContext,
    conversationId: string,
    personaId?: string
  ): Promise<CompiledBundle[]> {
    const bundles: CompiledBundle[] = [];

    const normalizedPersonaId = personaId === undefined ? null : personaId;

    // L0: Identity core - compile on-demand if not cached
    let identity = await this.getBundle(userId, 'identity_core', null, null, null, normalizedPersonaId);
    if (!identity) {
      try {
        identity = await this.bundleCompiler.compileIdentityCore(userId);
      } catch (e) {
        // User might not have identity memories yet
        identity = null;
      }
    }
    if (identity) bundles.push(identity);

    // L1: Global preferences - compile on-demand if not cached
    let prefs = await this.getBundle(userId, 'global_prefs', null, null, null, normalizedPersonaId);
    if (!prefs) {
      try {
        prefs = await this.bundleCompiler.compileGlobalPrefs(userId);
      } catch (e) {
        // User might not have preferences yet
        prefs = null;
      }
    }
    if (prefs) bundles.push(prefs);

    // L2: Topic context - compile on-demand if not cached
    if (context.topics.length > 0) {
      const primaryTopic = context.topics
        .sort((a, b) => b.confidence - a.confidence)[0];

      let topicBundle = await this.getBundle(userId, 'topic', primaryTopic.profileId, null, null, normalizedPersonaId);

      if (!topicBundle) {
        try {
          topicBundle = await this.bundleCompiler.compileTopicContext(
            userId, primaryTopic.slug
          );
        } catch (e) {
          // Topic might not exist
          topicBundle = null;
        }
      }

      if (topicBundle) {
        bundles.push(this.mapDbBundleToCompiled(topicBundle));
      }

      // Secondary topic (no fallback - it's optional)
      if (context.topics.length > 1) {
        const secondaryTopic = context.topics[1];
        const secondaryBundle = await this.getBundle(userId, 'topic', secondaryTopic.profileId, null, null, normalizedPersonaId);
        if (secondaryBundle) bundles.push(this.mapDbBundleToCompiled(secondaryBundle));
      }
    }

    // L3: Entity context - compile on-demand if not cached
    for (const entity of context.entities.slice(0, 2)) {
      let entityBundle = await this.getBundle(userId, 'entity', null, entity.id, null, normalizedPersonaId);

      if (!entityBundle) {
        try {
          entityBundle = await this.bundleCompiler.compileEntityContext(userId, entity.id);
        } catch (e) {
          // Entity might not exist
          entityBundle = null;
        }
      }

      if (entityBundle) bundles.push(this.mapDbBundleToCompiled(entityBundle));
    }

    // L4: Conversation context - compile on-demand if not cached
    // Always attempt for continuing conversations
    if (context.isContinuation && conversationId && conversationId !== 'new-chat') {
      let convBundle = await this.getBundle(userId, 'conversation', null, null, conversationId, normalizedPersonaId);

      if (!convBundle) {
        try {
          convBundle = await this.bundleCompiler.compileConversationContext(
            userId, conversationId
          );
        } catch (e) {
          // Conversation might not exist in DB yet
          convBundle = null;
        }
      }

      if (convBundle) bundles.push(this.mapDbBundleToCompiled(convBundle));
    }

    // L5: Persona-specific context - compile on-demand if personaId provided
    if (personaId) {
      let personaBundle = await this.getBundle(userId, 'persona', null, null, null, normalizedPersonaId);

      if (personaBundle) {
        bundles.push(this.mapDbBundleToCompiled(personaBundle));
      }
    }

    return bundles;
  }

  private async getBundle(
    userId: string,
    bundleType: string,
    topicProfileId?: string | null,
    entityProfileId?: string | null,
    conversationId?: string | null,
    personaId?: string | null
  ): Promise<CompiledBundle | null> {
    const normalizedTopicProfileId = topicProfileId === undefined ? null : topicProfileId;
    const normalizedEntityProfileId = entityProfileId === undefined ? null : entityProfileId;
    const normalizedConversationId = conversationId === undefined ? null : conversationId;
    const normalizedPersonaId = personaId === undefined ? null : personaId;

    const bundle = await this.prisma.contextBundle.findFirst({
      where: {
        userId,
        bundleType,
        topicProfileId: normalizedTopicProfileId,
        entityProfileId: normalizedEntityProfileId,
        conversationId: normalizedConversationId,
        personaId: normalizedPersonaId,
        isDirty: false
      },
      orderBy: { compiledAt: 'desc' }
    });

    return bundle ? this.mapDbBundleToCompiled(bundle) : null;
  }

  private mapDbBundleToCompiled(dbBundle: any): CompiledBundle {
    return {
      id: dbBundle.id,
      userId: dbBundle.userId,
      bundleType: dbBundle.bundleType,
      compiledPrompt: dbBundle.compiledPrompt,
      tokenCount: dbBundle.tokenCount,
      composition: dbBundle.composition || {},
      version: dbBundle.version,
      isDirty: dbBundle.isDirty,
      compiledAt: dbBundle.compiledAt
    };
  }

  private async justInTimeRetrieval(
    userId: string,
    message: string,
    embedding: number[],
    context: DetectedContext
  ): Promise<JITKnowledge> {
    const topicSlugs = context.topics.map(t => t.slug);

    const result = await this.hybridRetrieval.retrieve(
      userId,
      message,
      embedding,
      topicSlugs
    );

    return {
      acus: result.acus.map(acu => ({
        id: acu.id,
        content: acu.content,
        type: acu.type,
        category: acu.category,
        createdAt: acu.createdAt,
        similarity: acu.similarity
      })),
      memories: result.memories.map(mem => ({
        id: mem.id,
        content: mem.content,
        category: mem.category,
        importance: 0.5,
        similarity: mem.similarity
      }))
    };
  }

  private computeBudget(
    bundles: CompiledBundle[],
    jit: JITKnowledge,
    params: AssemblyParams,
    conversationStats: { messageCount: number; totalTokens: number; hasConversation: boolean },
    detectedContext: DetectedContext
  ): TokenBudget {
    const totalAvailable = params.settings?.maxContextTokens || 12000;

    const availableBundles = new Map<string, number>();
    for (const bundle of bundles) {
      availableBundles.set(bundle.bundleType, bundle.tokenCount);
    }

    // Use real conversation stats or defaults
    const msgCount = conversationStats?.messageCount || 0;
    const totalTokens = conversationStats?.totalTokens || 0;
    const hasConv = conversationStats?.hasConversation || false;

    const input: BudgetInput = {
      totalBudget: totalAvailable,
      conversationMessageCount: msgCount,
      conversationTotalTokens: totalTokens,
      userMessageTokens: this.tokenEstimator.estimateTokens(params.userMessage),
      detectedTopicCount: detectedContext.topics.length,
      detectedEntityCount: detectedContext.entities.length,
      hasActiveConversation: hasConv,
      knowledgeDepth: params.settings?.knowledgeDepth || 'standard',
      prioritizeHistory: params.settings?.prioritizeConversationHistory ?? true,
      availableBundles
    };

    const algorithm = new BudgetAlgorithm();
    const layers = algorithm.computeBudget(input);
    const totalUsed = Array.from(layers.values()).reduce((sum, layer) => sum + layer.allocated, 0);
    return {
      layers,
      totalAvailable: input.totalBudget,
      totalUsed
    };
  }

  private compilePrompt(
    bundles: CompiledBundle[],
    jit: JITKnowledge,
    budget: TokenBudget
  ): string {
    const sections: Array<{ content: string; priority: number; tokens: number }> = [];

    const priorityMap: Record<string, number> = {
      'identity_core': 100,
      'global_prefs': 95,
      'conversation': 90,
      'topic': 80,
      'entity': 70,
    };

    for (const bundle of bundles) {
      sections.push({
        content: bundle.compiledPrompt,
        priority: priorityMap[bundle.bundleType] ?? 50,
        tokens: bundle.tokenCount
      });
    }

    if (jit.memories.length > 0) {
      const memBlock = [
        `## Additionally Relevant Context`,
        ...jit.memories.map(m => `- [${m.category}] ${m.content}`)
      ].join('\n');
      sections.push({
        content: memBlock,
        priority: 60,
        tokens: this.tokenEstimator.estimateTokens(memBlock)
      });
    }

    if (jit.acus.length > 0) {
      const acuBlock = [
        `## Related Knowledge`,
        ...jit.acus.map(a => `- ${a.content}`)
      ].join('\n');
      sections.push({
        content: acuBlock,
        priority: 55,
        tokens: this.tokenEstimator.estimateTokens(acuBlock)
      });
    }

    sections.sort((a, b) => b.priority - a.priority);

    const vivimIdentity = getVIVIMSystemPrompt();
    const vivimTokens = this.tokenEstimator.estimateTokens(vivimIdentity);
    
    let totalTokens = vivimTokens;
    const included: string[] = [vivimIdentity];

    for (const section of sections) {
      if (totalTokens + section.tokens > budget.totalAvailable) {
        const remaining = budget.totalAvailable - totalTokens;
        if (remaining > 100) {
          included.push(this.truncateToTokens(section.content, remaining));
          totalTokens += remaining;
        }
        break;
      }
      included.push(section.content);
      totalTokens += section.tokens;
    }

    return included.join('\n\n---\n\n');
  }

  private truncateToTokens(text: string, maxTokens: number): string {
    const estimatedTokens = this.tokenEstimator.estimateTokens(text);
    if (estimatedTokens <= maxTokens) return text;

    const ratio = maxTokens / estimatedTokens;
    const targetChars = Math.floor(text.length * ratio);
    return text.substring(0, targetChars) + '\n[truncated]';
  }

  private async trackUsage(bundles: CompiledBundle[], conversationId: string): Promise<void> {
    const bundleIds = bundles.map(b => b.id);

    await this.prisma.contextBundle.updateMany({
      where: { id: { in: bundleIds } },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 }
      }
    });
  }

  private calculateCacheHitRate(bundles: CompiledBundle[]): number {
    if (bundles.length === 0) return 0;
    return bundles.filter(b => !b.isDirty).length / bundles.length;
  }

  private async recordCacheMiss(bundleType: string, referenceId: string): Promise<void> {
    await this.prisma.contextBundle.updateMany({
      where: {
        bundleType,
        OR: [
          { topicProfileId: referenceId },
          { entityProfileId: referenceId },
          { conversationId: referenceId }
        ]
      },
      data: {
        missCount: { increment: 1 }
      }
    });
  }
}
