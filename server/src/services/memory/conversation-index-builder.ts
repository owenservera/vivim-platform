/**
 * Conversation Index Builder
 * 
 * Builds searchable conversation indices with:
 * - LLM-generated summaries
 * - Topic extraction
 * - Key facts, questions, issues, decisions
 * - Embedding for semantic search
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { Message, KeyFact } from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface LLMService {
  chat: (params: { model: string; messages: any[] }) => Promise<{ content: string }>;
}

interface EmbeddingService {
  embed: (text: string) => Promise<number[]>;
}

export class ConversationIndexBuilder {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private embeddingService: EmbeddingService;

  constructor(
    prisma: PrismaClient,
    llmService: LLMService,
    embeddingService: EmbeddingService
  ) {
    this.prisma = prisma;
    this.llmService = llmService;
    this.embeddingService = embeddingService;
  }

  /**
   * Index a conversation for recall
   */
  async indexConversation(
    virtualUserId: string,
    conversationId: string,
    messages: Message[]
  ): Promise<void> {
    logger.info(
      { virtualUserId, conversationId, messageCount: messages.length },
      'Building conversation index'
    );

    try {
      // Generate structured analysis via LLM
      const analysis = await this.analyzeConversation(messages);

      // Generate embedding from summary
      const embedding = await this.embeddingService.embed(analysis.summary);

      // Extract key facts
      const keyFacts = this.extractKeyFacts(analysis, messages);

      // Find related conversations
      const relatedConversationIds = await this.findRelatedConversations(
        virtualUserId,
        embedding,
        analysis.topics
      );

      // Store or update index
      await this.prisma.conversationIndex.upsert({
        where: { conversationId },
        update: {
          summary: analysis.summary,
          embedding,
          topics: analysis.topics,
          keyFacts: keyFacts as any,
          questionsAsked: analysis.questionsAsked,
          issuesDiscussed: analysis.issuesDiscussed,
          decisionsReached: analysis.decisionsReached,
          actionItems: analysis.actionItems,
          messageCount: messages.length,
          sentiment: analysis.sentiment,
          resolutionStatus: analysis.resolutionStatus,
          relatedConversationIds,
          lastReferencedAt: new Date(),
        },
        create: {
          virtualUserId,
          conversationId,
          summary: analysis.summary,
          embedding,
          topics: analysis.topics,
          keyFacts: keyFacts as any,
          questionsAsked: analysis.questionsAsked,
          issuesDiscussed: analysis.issuesDiscussed,
          decisionsReached: analysis.decisionsReached,
          actionItems: analysis.actionItems,
          messageCount: messages.length,
          duration: this.calculateDuration(messages),
          sentiment: analysis.sentiment,
          resolutionStatus: analysis.resolutionStatus,
          relatedConversationIds,
        },
      });

      logger.info(
        { conversationId, topics: analysis.topics.length },
        'Conversation indexed successfully'
      );
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Conversation indexing failed');
      throw error;
    }
  }

  /**
   * Analyze conversation with LLM
   */
  private async analyzeConversation(messages: Message[]): Promise<{
    summary: string;
    topics: string[];
    questionsAsked: string[];
    issuesDiscussed: string[];
    decisionsReached: string[];
    actionItems: string[];
    sentiment: string;
    resolutionStatus: string;
  }> {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    try {
      const response = await this.llmService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze this conversation and extract:
1. A 2-3 sentence summary
2. Topics discussed (as slug-style tags, e.g., "api-authentication", "pricing-plans")
3. All questions the user asked
4. Any issues/problems discussed
5. Any decisions reached or outcomes
6. Any follow-up actions mentioned
7. Overall sentiment (positive, neutral, negative, mixed)
8. Resolution status (resolved, pending, escalated, unknown)

Format as JSON with keys: summary, topics, questionsAsked, issuesDiscussed, decisionsReached, actionItems, sentiment, resolutionStatus`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
      });

      return JSON.parse(response.content);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'LLM analysis failed, using fallback');
      
      // Fallback analysis
      return {
        summary: `Conversation with ${messages.length} messages.`,
        topics: ['general'],
        questionsAsked: messages.filter(m => m.role === 'user' && m.content.includes('?')).map(m => m.content),
        issuesDiscussed: [],
        decisionsReached: [],
        actionItems: [],
        sentiment: 'neutral',
        resolutionStatus: 'unknown',
      };
    }
  }

  /**
   * Extract key facts from analysis
   */
  private extractKeyFacts(analysis: any, messages: Message[]): KeyFact[] {
    const facts: KeyFact[] = [];

    // Extract facts from decisions
    for (const decision of analysis.decisionsReached || []) {
      facts.push({
        fact: decision,
        confidence: 0.9,
        source: 'explicit',
        messageIndex: messages.length - 1,
      });
    }

    // Extract facts from resolved issues
    for (const issue of analysis.issuesDiscussed || []) {
      if (analysis.resolutionStatus === 'resolved') {
        facts.push({
          fact: `Issue resolved: ${issue}`,
          confidence: 0.85,
          source: 'inferred',
          messageIndex: messages.length - 1,
        });
      }
    }

    return facts;
  }

  /**
   * Find related conversations via semantic search
   */
  private async findRelatedConversations(
    virtualUserId: string,
    embedding: number[],
    topics: string[]
  ): Promise<string[]> {
    try {
      const results = await this.prisma.$queryRaw<any[]>`
        SELECT ci."conversationId", ci.summary,
          1 - (ci."embedding" <=> ${embedding}::vector) as similarity
        FROM "conversation_indices" ci
        WHERE ci."virtualUserId" = ${virtualUserId}
          AND ci."embedding" IS NOT NULL
        ORDER BY ci."embedding" <=> ${embedding}::vector
        LIMIT 5
      `;

      // Filter by similarity threshold
      return results
        .filter((r: any) => r.similarity > 0.6)
        .map((r: any) => r.conversationId);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Related conversation search failed');
      return [];
    }
  }

  /**
   * Calculate conversation duration in minutes
   */
  private calculateDuration(messages: Message[]): number {
    if (messages.length < 2) return 0;

    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];

    // If timestamps available, calculate actual duration
    if (firstMessage.createdAt && lastMessage.createdAt) {
      const start = new Date(firstMessage.createdAt);
      const end = new Date(lastMessage.createdAt);
      return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    }

    // Estimate: ~1 minute per message exchange
    return Math.ceil(messages.length / 2);
  }

  /**
   * Batch index multiple conversations
   */
  async batchIndex(
    virtualUserId: string,
    conversations: { conversationId: string; messages: Message[] }[]
  ): Promise<void> {
    logger.info({ count: conversations.length }, 'Batch indexing conversations');

    for (const conv of conversations) {
      try {
        await this.indexConversation(virtualUserId, conv.conversationId, conv.messages);
      } catch (error) {
        logger.error(
          { conversationId: conv.conversationId, error: (error as Error).message },
          'Failed to index conversation'
        );
      }
    }
  }
}
