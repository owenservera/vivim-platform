import { PrismaClient } from '@prisma/client';
import {
  CompiledBundle,
  BundleComposition,
  BundleType,
  ConversationArc,
  ITokenEstimator,
  ILLMService,
} from './types';
import { MemoryRetrievalService } from './memory/memory-retrieval-service';
import { createEmbeddingService } from './utils/zai-service.js';

export interface BundleCompilerConfig {
  prisma: PrismaClient;
  tokenEstimator: ITokenEstimator;
  llmService: ILLMService;
  /** Enable intelligent memory retrieval (hybrid semantic + keyword search) */
  enableIntelligentMemoryRetrieval?: boolean;
}

export class BundleCompiler {
  private prisma: PrismaClient;
  private tokenEstimator: ITokenEstimator;
  private llmService: ILLMService;
  private memoryRetrievalService?: MemoryRetrievalService;

  constructor(config: BundleCompilerConfig) {
    this.prisma = config.prisma;
    this.tokenEstimator = config.tokenEstimator;
    this.llmService = config.llmService;

    if (config.enableIntelligentMemoryRetrieval) {
      const embeddingService = createEmbeddingService();
      this.memoryRetrievalService = new MemoryRetrievalService({
        prisma: this.prisma,
        embeddingService,
        semanticWeight: 0.6,
        keywordWeight: 0.4,
        defaultSimilarityThreshold: 0.35,
      });
    }
  }

  /**
   * Retrieve memories using intelligent hybrid search
   */
  async retrieveMemoriesIntelligently(
    userId: string,
    contextMessage: string,
    options: {
      maxTokens?: number;
      minImportance?: number;
      preferredTypes?: string[];
      includePinned?: boolean;
    } = {}
  ): Promise<
    Array<{
      id: string;
      content: string;
      memoryType: string;
      importance: number;
      relevance: number;
    }>
  > {
    if (!this.memoryRetrievalService) {
      return [];
    }

    const result = await this.memoryRetrievalService.retrieve(userId, contextMessage, {
      maxTokens: options.maxTokens || 1000,
      minImportance: options.minImportance || 0.4,
      preferredTypes: options.preferredTypes,
      includePinned: options.includePinned ?? true,
    });

    return result.memories.map((m) => ({
      id: m.id,
      content: m.content,
      memoryType: m.memoryType,
      importance: m.importance,
      relevance: m.relevance,
    }));
  }

  async compileIdentityCore(userId: string, targetTokens?: number): Promise<CompiledBundle> {
    const coreMemories = await this.prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        category: { in: ['biography', 'identity', 'role'] },
        importance: { gte: 0.8 },
      },
      orderBy: { importance: 'desc' },
      take: targetTokens ? Math.ceil(targetTokens / 50) : 15,
    });

    const compiled = [`## About This User`, ...coreMemories.map((m) => `- ${m.content}`)].join(
      '\n'
    );

    return this.storeBundle(
      userId,
      'identity_core',
      compiled,
      {
        memoryIds: coreMemories.map((m) => m.id),
      },
      null,
      null,
      null,
      null
    );
  }

  async compileGlobalPrefs(userId: string, targetTokens?: number): Promise<CompiledBundle> {
    const [instructions, prefMemories] = await Promise.all([
      this.prisma.customInstruction.findMany({
        where: { userId, isActive: true, scope: 'global' },
        orderBy: { priority: 'desc' },
      }),
      this.prisma.memory.findMany({
        where: {
          userId,
          isActive: true,
          category: 'preference',
          importance: { gte: 0.6 },
        },
        orderBy: { importance: 'desc' },
        take: targetTokens ? Math.ceil(targetTokens / 60) : 10,
      }),
    ]);

    const compiled = [
      `## Response Guidelines`,
      ...instructions.map((i) => `- ${i.content}`),
      ``,
      `## Known Preferences`,
      ...prefMemories.map((m) => `- ${m.content}`),
    ].join('\n');

    return this.storeBundle(
      userId,
      'global_prefs',
      compiled,
      {
        instructionIds: instructions.map((i) => i.id),
        memoryIds: prefMemories.map((m) => m.id),
      },
      null,
      null,
      null,
      null
    );
  }

  async compileTopicContext(
    userId: string,
    topicSlug: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {
    const topic = await this.prisma.topicProfile.findUnique({
      where: { userId_slug: { userId, slug: topicSlug } },
      include: {
        conversations: {
          include: { conversation: true },
          orderBy: { relevanceScore: 'desc' },
          take: 10,
        },
      },
    });

    if (!topic) {
      throw new Error(`Topic ${topicSlug} not found for user ${userId}`);
    }

    const [topicMemories, topicInstructions, topAcus] = await Promise.all([
      this.prisma.memory.findMany({
        where: {
          userId,
          isActive: true,
          id: { in: topic.relatedMemoryIds },
        },
        orderBy: { importance: 'desc' },
        take: targetTokens ? Math.ceil(targetTokens / 60) : 10,
      }),
      this.prisma.customInstruction.findMany({
        where: {
          userId,
          isActive: true,
          scope: 'topic',
          topicTags: { hasSome: [topicSlug, ...topic.aliases] },
        },
      }),
      this.prisma.$queryRaw<
        Array<{ id: string; content: string; type: string; createdAt: Date; similarity: number }>
      >`
        SELECT id, content, type, "createdAt", 0.5 as similarity
        FROM atomic_chat_units
        WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
          AND state = 'ACTIVE'
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) > 0
        LIMIT ${targetTokens ? Math.ceil(targetTokens / 40) : 20}
      `,
    ]);

    const compiled = [
      `## Topic Context: ${topic.label}`,
      `User's level: ${topic.proficiencyLevel}`,
      `Engagement: ${topic.totalConversations} conversations, last engaged ${this.timeAgo(topic.lastEngagedAt)}`,
      ``,
      ...(topicInstructions.length > 0
        ? [`### Topic-Specific Instructions`, ...topicInstructions.map((i) => `- ${i.content}`), ``]
        : []),
      ...(topicMemories.length > 0
        ? [`### What You Know (${topic.label})`, ...topicMemories.map((m) => `- ${m.content}`), ``]
        : []),
      ...(topic.conversations.length > 0
        ? [
            `### Previous Discussions`,
            ...topic.conversations.map(
              (tc) => `- ${tc.conversation.title} (${this.timeAgo(tc.conversation.createdAt)})`
            ),
            ``,
          ]
        : []),
      ...(topAcus.length > 0
        ? [`### Key Knowledge Points`, ...topAcus.slice(0, 10).map((a) => `- ${a.content}`)]
        : []),
    ].join('\n');

    await this.prisma.topicProfile.update({
      where: { id: topic.id },
      data: {
        compiledContext: compiled,
        compiledAt: new Date(),
        compiledTokenCount: this.tokenEstimator.estimateTokens(compiled),
        isDirty: false,
        contextVersion: { increment: 1 },
      },
    });

    return this.storeBundle(
      userId,
      'topic',
      compiled,
      {
        memoryIds: topicMemories.map((m) => m.id),
        acuIds: topAcus.map((a) => a.id),
        instructionIds: topicInstructions.map((i) => i.id),
      },
      topic.id,
      null,
      null,
      null
    );
  }

  async compileEntityContext(
    userId: string,
    entityId: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {
    const entity = await this.prisma.entityProfile.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const facts = (entity.facts as Array<{ fact: string; confidence: number }>) || [];

    const relatedAcus = await this.prisma.$queryRaw<
      Array<{ id: string; content: string; type: string; createdAt: Date; similarity: number }>
    >`
      SELECT id, content, type, "createdAt", 0.5 as similarity
      FROM atomic_chat_units
      WHERE "authorDid" = (SELECT did FROM users WHERE id = ${userId})
        AND state = 'ACTIVE'
        AND embedding IS NOT NULL
        AND array_length(embedding, 1) > 0
      LIMIT ${targetTokens ? Math.ceil(targetTokens / 50) : 15}
    `;

    const compiled = [
      `## Context: ${entity.name} (${entity.type})`,
      entity.relationship ? `Relationship: ${entity.relationship}` : '',
      ``,
      `### Known Facts`,
      ...facts.filter((f) => f.confidence > 0.5).map((f) => `- ${f.fact}`),
      ``,
      ...(relatedAcus.length > 0
        ? [`### Relevant History`, ...relatedAcus.slice(0, 8).map((a) => `- ${a.content}`)]
        : []),
    ]
      .filter(Boolean)
      .join('\n');

    return this.storeBundle(
      userId,
      'entity',
      compiled,
      { acuIds: relatedAcus.map((a) => a.id) },
      null,
      entityId,
      null,
      null
    );
  }

  async compileConversationContext(
    userId: string,
    conversationId: string,
    targetTokens?: number
  ): Promise<CompiledBundle> {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { messageIndex: 'asc' } },
        topicConversations: { include: { topic: true } },
      },
    });

    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const summary = await this.generateConversationArc(conv);

    const compiled = [
      `## Current Conversation Context`,
      `Title: ${conv.title}`,
      `Started: ${this.timeAgo(conv.createdAt)}`,
      `Messages so far: ${conv.messageCount}`,
      conv.topicConversations.length > 0
        ? `Topics: ${conv.topicConversations.map((tc) => tc.topic.label).join(', ')}`
        : '',
      ``,
      `### Conversation Arc`,
      summary.arc,
      ``,
      ...(summary.openQuestions.length > 0
        ? [`### Unresolved Questions`, ...summary.openQuestions.map((q) => `- ${q}`), ``]
        : []),
      ...(summary.decisions.length > 0
        ? [`### Decisions Made`, ...summary.decisions.map((d) => `- ${d}`)]
        : []),
      ...(summary.currentFocus ? [``, `### Current Focus`, summary.currentFocus] : []),
    ]
      .filter(Boolean)
      .join('\n');

    return this.storeBundle(userId, 'conversation', compiled, {}, null, null, conversationId, null);
  }

  private async generateConversationArc(conv: any): Promise<ConversationArc> {
    if (conv.messages.length <= 6) {
      return {
        arc: conv.messages
          .map((m: any) => `${m.role}: ${this.truncate(this.extractText(m.parts), 100)}`)
          .join('\n'),
        openQuestions: [],
        decisions: [],
        currentFocus: null,
      };
    }

    const messagesText = conv.messages
      .map((m: any) => `[${m.role}]: ${this.extractText(m.parts)}`)
      .join('\n\n');

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and extract its arc. Return JSON:
{
  "arc": "2-3 sentence summary of how the conversation progressed",
  "openQuestions": ["questions raised but not yet answered"],
  "decisions": ["concrete decisions or conclusions reached"],
  "currentFocus": "what the conversation is currently about (last few messages)"
}
Be concise. This will be injected into a future prompt as context.`,
          },
          { role: 'user', content: messagesText },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to generate conversation arc:', error);
      return {
        arc: `Conversation about: ${conv.title}`,
        openQuestions: [],
        decisions: [],
        currentFocus: null,
      };
    }
  }

  private async storeBundle(
    userId: string,
    bundleType: BundleType,
    compiled: string,
    composition: BundleComposition,
    topicProfileId?: string | null | undefined,
    entityProfileId?: string | null | undefined,
    conversationId?: string | null | undefined,
    personaId?: string | null | undefined
  ): Promise<CompiledBundle> {
    const tokenCount = this.tokenEstimator.estimateTokens(compiled);

    // Use nullish coalescing to ensure all fields are explicitly present
    const normalizedTopicProfileId = topicProfileId ?? null;
    const normalizedEntityProfileId = entityProfileId ?? null;
    const normalizedConversationId = conversationId ?? null;
    const normalizedPersonaId = personaId ?? null;

    try {
      const result = await this.prisma.contextBundle.upsert({
        where: {
          userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
            userId,
            bundleType,
            topicProfileId: normalizedTopicProfileId,
            entityProfileId: normalizedEntityProfileId,
            conversationId: normalizedConversationId,
            personaId: normalizedPersonaId,
          },
        },
        update: {
          compiledPrompt: compiled,
          tokenCount,
          composition: composition as any,
          isDirty: false,
          version: { increment: 1 },
          compiledAt: new Date(),
        },
        create: {
          userId,
          bundleType,
          compiledPrompt: compiled,
          tokenCount,
          composition,
          topicProfileId: normalizedTopicProfileId,
          entityProfileId: normalizedEntityProfileId,
          conversationId: normalizedConversationId,
          personaId: normalizedPersonaId,
        },
      });

      return {
        id: result.id,
        userId: result.userId,
        bundleType: result.bundleType as BundleType,
        compiledPrompt: result.compiledPrompt,
        tokenCount: result.tokenCount,
        composition: result.composition as BundleComposition,
        version: result.version,
        isDirty: result.isDirty,
        compiledAt: result.compiledAt,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.warn(`Constraint violation for bundle ${bundleType}, recovering...`);

        await this.prisma.contextBundle.deleteMany({
          where: {
            userId,
            bundleType,
            topicProfileId: normalizedTopicProfileId,
            entityProfileId: normalizedEntityProfileId,
            conversationId: normalizedConversationId,
            personaId: normalizedPersonaId,
          },
        });

        const result = await this.prisma.contextBundle.upsert({
          where: {
            userId_bundleType_topicProfileId_entityProfileId_conversationId_personaId: {
              userId,
              bundleType,
              topicProfileId: normalizedTopicProfileId,
              entityProfileId: normalizedEntityProfileId,
              conversationId: normalizedConversationId,
              personaId: normalizedPersonaId,
            },
          },
          update: {
            compiledPrompt: compiled,
            tokenCount,
            composition: composition as any,
            isDirty: false,
            version: { increment: 1 },
            compiledAt: new Date(),
          },
          create: {
            userId,
            bundleType,
            compiledPrompt: compiled,
            tokenCount,
            composition: composition as any,
            topicProfileId: normalizedTopicProfileId,
            entityProfileId: normalizedEntityProfileId,
            conversationId: normalizedConversationId,
            personaId: normalizedPersonaId,
          },
        });

        return {
          id: result.id,
          userId: result.userId,
          bundleType: result.bundleType as BundleType,
          compiledPrompt: result.compiledPrompt,
          tokenCount: result.tokenCount,
          composition: result.composition as BundleComposition,
          version: result.version,
          isDirty: result.isDirty,
          compiledAt: result.compiledAt,
        };
      }

      throw error;
    }
  }

  private extractText(parts: any[]): string {
    if (!Array.isArray(parts)) return String(parts);
    return parts
      .filter((p: any) => p && (p.type === 'text' || p.type === 'code'))
      .map((p: any) => p.content)
      .join(' ');
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private timeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }
}
