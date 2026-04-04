/**
 * Dual-Engine Orchestrator
 * 
 * Orchestrates between Corpus Context Engine and User Context Engine.
 * Dynamically balances context based on intent, avatar maturity, and conversation state.
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import {
  OrchestrationParams,
  MergedContext,
  UserAvatar,
  OrchestrationIntent,
  ClassificationResult,
} from '../../types/corpus';
import { DualIntentClassifier } from './intent-classifier';
import { EngineWeightCalculator } from './weight-calculator';
import { DualBudgetAllocator } from './budget-allocator';
import { DualContextMerger } from './context-merger';
import { AvatarClassifier } from './avatar-classifier';
import { CorpusContextAssembler } from '../corpus/context/assembler';
import { logger } from '../../lib/logger';

interface DualEngineOrchestratorConfig {
  prisma: PrismaClient;
  corpusAssembler: CorpusContextAssembler;
  userContextAssembler: any; // Existing VIVIM context assembler
  embeddingService: {
    embed: (text: string) => Promise<number[]>;
  };
  llmService: {
    chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
  };
  conversationCompressor: {
    compress: (conversationId: string, budget: number) => Promise<any>;
  };
}

export class DualEngineOrchestrator {
  private prisma: PrismaClient;
  private intentClassifier: DualIntentClassifier;
  private weightCalculator: EngineWeightCalculator;
  private budgetAllocator: DualBudgetAllocator;
  private contextMerger: DualContextMerger;
  private avatarClassifier: AvatarClassifier;
  private corpusAssembler: CorpusContextAssembler;
  private userContextAssembler: any;
  private embeddingService: DualEngineOrchestratorConfig['embeddingService'];
  private llmService: DualEngineOrchestratorConfig['llmService'];
  private conversationCompressor: DualEngineOrchestratorConfig['conversationCompressor'];

  constructor(config: DualEngineOrchestratorConfig) {
    this.prisma = config.prisma;
    this.corpusAssembler = config.corpusAssembler;
    this.userContextAssembler = config.userContextAssembler;
    this.embeddingService = config.embeddingService;
    this.llmService = config.llmService;
    this.conversationCompressor = config.conversationCompressor;

    // Initialize sub-components
    this.intentClassifier = new DualIntentClassifier();
    this.weightCalculator = new EngineWeightCalculator();
    this.budgetAllocator = new DualBudgetAllocator();
    this.contextMerger = new DualContextMerger();
    this.avatarClassifier = new AvatarClassifier(prisma);
  }

  /**
   * Orchestrate dual-engine context assembly
   */
  async orchestrate(params: OrchestrationParams): Promise<MergedContext> {
    const startTime = Date.now();
    logger.info(
      { virtualUserId: params.virtualUserId, query: params.message.substring(0, 50) },
      'Starting dual-engine orchestration'
    );

    try {
      // Step 1: Classify user avatar
      const avatar = await this.avatarClassifier.classify(params.virtualUserId);
      logger.debug({ avatar }, 'Avatar classified');

      // Step 2: Calculate memory density
      const memoryDensity = await this.calculateMemoryDensity(params.virtualUserId);

      // Step 3: Classify intent
      const intent = await this.intentClassifier.classify({
        message: params.message,
        conversationHistory: params.conversationHistory,
        userAvatar: avatar,
        userMemorySummary: await this.getUserMemorySummary(params.virtualUserId),
        corpusTopics: await this.getCorpusTopics(params.tenantId),
      });
      logger.debug({ intent: intent.primaryIntent, confidence: intent.confidence }, 'Intent classified');

      // Step 4: Calculate weights
      const weights = this.weightCalculator.calculate(
        intent,
        avatar,
        params.conversationState,
        memoryDensity
      );
      logger.debug({ corpusWeight: weights.final.corpus, userWeight: weights.final.user }, 'Weights calculated');

      // Step 5: Allocate budget
      const budget = this.budgetAllocator.allocate(
        params.totalBudget || 12000,
        weights.final,
        avatar,
        params.conversationState.hasActiveConversation,
        params.conversationState.totalTokens
      );
      logger.debug({ totalBudget: budget.totalBudget }, 'Budget allocated');

      // Step 6: Generate query embedding
      const queryEmbedding = await this.embeddingService.embed(params.message);

      // Step 7: Parallel assembly - both engines run simultaneously
      const [corpusContext, userContext, conversationHistory] = await Promise.all([
        // Corpus engine
        this.corpusAssembler.assemble({
          tenantId: params.tenantId,
          query: params.message,
          queryEmbedding,
          totalBudget: budget.corpusBudget.total,
          userAvatar: avatar,
          userTopics: await this.getUserTopics(params.virtualUserId),
          previousQueries: this.extractPreviousQueries(params.conversationHistory),
        }),

        // User engine (using existing VIVIM Context Engine)
        this.userContextAssembler.assemble({
          userId: params.virtualUserId,
          conversationId: params.conversationId,
          userMessage: params.message,
          settings: {
            maxContextTokens: budget.userBudget.total,
            knowledgeDepth: avatar === 'KNOWN' ? 'deep' : 'standard',
            prioritizeConversationHistory: false,
          },
        }),

        // Conversation history (shared resource)
        this.conversationCompressor.compress(
          params.conversationId,
          budget.sharedBudget.conversationHistory
        ),
      ]);

      // Step 8: Generate orchestrator instructions
      const orchestratorInstructions = this.generateOrchestratorInstructions(
        avatar,
        intent.primaryIntent,
        corpusContext.confidence,
        weights.final,
        memoryDensity > 0.1
      );

      // Step 9: Merge contexts
      const merged = await this.contextMerger.merge(
        corpusContext,
        userContext,
        weights.final,
        conversationHistory,
        orchestratorInstructions
      );

      // Step 10: Log telemetry
      await this.logTelemetry({
        tenantId: params.tenantId,
        virtualUserId: params.virtualUserId,
        conversationId: params.conversationId,
        avatar,
        intent: intent.primaryIntent,
        weights: weights.final,
        corpusConfidence: corpusContext.confidence,
        assemblyTimeMs: Date.now() - startTime,
        tokensUsed: merged.metadata.totalTokens,
      });

      logger.info(
        { assemblyTimeMs: Date.now() - startTime, totalTokens: merged.metadata.totalTokens },
        'Dual-engine orchestration complete'
      );

      return merged;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Dual-engine orchestration failed');
      throw error;
    }
  }

  /**
   * Calculate memory density for user
   */
  private async calculateMemoryDensity(virtualUserId: string): Promise<number> {
    try {
      const stats = await this.prisma.virtualMemory.aggregate({
        where: { virtualUserId, isActive: true },
        _count: { id: true },
      });

      // Normalize: 0 memories = 0.0, 100+ memories = 1.0
      return Math.min(1.0, stats._count.id / 100);
    } catch {
      return 0;
    }
  }

  /**
   * Get user memory summary
   */
  private async getUserMemorySummary(virtualUserId: string): Promise<string> {
    try {
      const memories = await this.prisma.virtualMemory.findMany({
        where: { virtualUserId, isPinned: true, isActive: true },
        select: { content: true, category: true },
        take: 5,
      });

      if (memories.length === 0) return '';

      return memories.map(m => `[${m.category}] ${m.content}`).join('; ');
    } catch {
      return '';
    }
  }

  /**
   * Get corpus topics for tenant
   */
  private async getCorpusTopics(tenantId: string): Promise<string[]> {
    try {
      const topics = await this.prisma.corpusTopic.findMany({
        where: { tenantId, isActive: true },
        select: { slug: true },
        take: 20,
      });

      return topics.map(t => t.slug);
    } catch {
      return [];
    }
  }

  /**
   * Get user topics
   */
  private async getUserTopics(virtualUserId: string): Promise<string[]> {
    try {
      const user = await this.prisma.virtualUser.findUnique({
        where: { id: virtualUserId },
        select: { topicInterests: true },
      });

      return (user?.topicInterests as string[]) || [];
    } catch {
      return [];
    }
  }

  /**
   * Extract previous queries from conversation history
   */
  private extractPreviousQueries(history: any[]): string[] {
    return history
      .filter(m => m.role === 'user')
      .slice(-5)
      .map(m => m.content);
  }

  /**
   * Generate orchestrator meta-instructions
   */
  private generateOrchestratorInstructions(
    avatar: UserAvatar,
    intent: OrchestrationIntent,
    corpusConfidence: number,
    weights: { corpus: number; user: number },
    hasMemories: boolean
  ): string {
    const instructions: string[] = [];

    // Base behavior
    instructions.push(
      'You are a company support assistant with access to both product ' +
      'documentation and this specific user interaction history.'
    );

    // Avatar-specific instructions
    switch (avatar) {
      case 'STRANGER':
        instructions.push(
          'This is a new visitor. Be welcoming and helpful. ' +
          'Focus on answering their question from documentation. ' +
          "Don't reference past conversations (there are none)."
        );
        break;
      case 'ACQUAINTANCE':
        instructions.push(
          'This is a returning visitor with some history. ' +
          'You may naturally reference previous interactions if relevant, ' +
          "but don't force it. Prioritize answering their current question."
        );
        break;
      case 'FAMILIAR':
        instructions.push(
          'This is a regular visitor with substantial history. ' +
          'Leverage what you know about them to personalize responses. ' +
          'Connect their question to their known context when helpful.'
        );
        break;
      case 'KNOWN':
        instructions.push(
          'This is a well-known user with extensive history. ' +
          'Treat them like a valued relationship. Reference past interactions naturally. ' +
          'Proactively connect new information to their known needs and setup. ' +
          'They should feel like they have a personal AI assistant who truly knows them.'
        );
        break;
    }

    // Confidence-based instructions
    if (corpusConfidence < 0.4) {
      instructions.push(
        'IMPORTANT: The documentation retrieval had low confidence. ' +
        "If you're not sure about the answer, say so clearly and offer " +
        'to connect the user with human support.'
      );
    }

    // Intent-specific instructions
    if (intent === 'SUPPORT_QUERY') {
      instructions.push(
        'The user appears to have a support issue. Be empathetic. ' +
        'Diagnose step by step. If you cannot resolve it, offer to create ' +
        'a support ticket.'
      );
    }

    if (intent === 'USER_RECALL') {
      instructions.push(
        'The user is referencing a past interaction. Check the user history ' +
        'section carefully. If you find the referenced conversation, summarize ' +
        "what was discussed. If not, be honest that you don't have that record."
      );
    }

    return instructions.join('\n\n');
  }

  /**
   * Log orchestration telemetry
   */
  private async logTelemetry(data: {
    tenantId: string;
    virtualUserId: string;
    conversationId: string;
    avatar: UserAvatar;
    intent: OrchestrationIntent;
    weights: { corpus: number; user: number };
    corpusConfidence: number;
    assemblyTimeMs: number;
    tokensUsed: number;
  }): Promise<void> {
    try {
      await this.prisma.orchestrationLog.create({
        data: {
          tenantId: data.tenantId,
          virtualUserId: data.virtualUserId,
          conversationId: data.conversationId,
          intent: data.intent,
          intentConfidence: data.corpusConfidence,
          avatar: data.avatar,
          corpusWeight: data.weights.corpus,
          userWeight: data.weights.user,
          assemblyTimeMs: data.assemblyTimeMs,
          totalTokens: data.tokensUsed,
          corpusTokens: Math.floor(data.tokensUsed * data.weights.corpus),
          userTokens: Math.floor(data.tokensUsed * data.weights.user),
          historyTokens: 0,
          corpusConfidence: data.corpusConfidence,
          chunksRetrieved: 0,
          memoriesUsed: 0,
          proactiveInsights: 0,
        },
      });
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to log telemetry');
    }
  }
}
