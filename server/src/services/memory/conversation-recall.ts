/**
 * Conversation Recall Service
 * 
 * Enables semantic search across past conversations for recall.
 * Used when user references past interactions ("remember when...", "last time we...").
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { RecallResult, KeyExchange } from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface EmbeddingService {
  embed: (text: string) => Promise<number[]>;
}

export class ConversationRecall {
  private prisma: PrismaClient;
  private embeddingService: EmbeddingService;

  constructor(prisma: PrismaClient, embeddingService: EmbeddingService) {
    this.prisma = prisma;
    this.embeddingService = embeddingService;
  }

  /**
   * Recall past conversations based on query
   */
  async recall(virtualUserId: string, query: string): Promise<RecallResult> {
    logger.debug({ virtualUserId, query: query.substring(0, 50) }, 'Recalling conversations');

    try {
      const queryEmbedding = await this.embeddingService.embed(query);

      // Semantic search across conversation indices
      const semanticResults = await this.prisma.$queryRaw<any[]>`
        SELECT
          ci.id,
          ci."virtualUserId",
          ci."conversationId",
          ci.summary,
          ci.topics,
          ci."keyFacts",
          ci."questionsAsked",
          ci."issuesDiscussed",
          ci."decisionsReached",
          ci."actionItems",
          ci.sentiment,
          ci."resolutionStatus",
          ci."startedAt",
          ci."endedAt",
          1 - (ci."embedding" <=> ${queryEmbedding}::vector) as similarity
        FROM "conversation_indices" ci
        WHERE ci."virtualUserId" = ${virtualUserId}
        ORDER BY ci."embedding" <=> ${queryEmbedding}::vector
        LIMIT 5
      `;

      if (semanticResults.length === 0 || semanticResults[0].similarity < 0.5) {
        return {
          found: false,
          suggestions: semanticResults.map(this.mapToSuggestion),
        };
      }

      // Get full conversation for top match
      const topMatch = semanticResults[0];
      const fullConversation = await this.prisma.virtualConversation.findUnique({
        where: { id: topMatch.conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!fullConversation) {
        return {
          found: false,
          suggestions: semanticResults.map(this.mapToSuggestion),
        };
      }

      // Extract key exchanges
      const keyExchanges = this.extractKeyExchanges(fullConversation.messages);

      // Update reference count
      await this.prisma.conversationIndex.update({
        where: { id: topMatch.id },
        data: {
          referenceCount: { increment: 1 },
          lastReferencedAt: new Date(),
        },
      });

      return {
        found: true,
        topMatch: this.mapToIndex(topMatch),
        conversationSummary: topMatch.summary,
        keyExchanges,
        relatedConversations: semanticResults.slice(1, 4).map(this.mapToIndex),
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Conversation recall failed');
      throw error;
    }
  }

  /**
   * Search conversations by topic
   */
  async searchByTopic(
    virtualUserId: string,
    topicSlug: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      return this.prisma.conversationIndex.findMany({
        where: {
          virtualUserId,
          topics: {
            has: topicSlug,
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        select: {
          conversationId: true,
          summary: true,
          topics: true,
          sentiment: true,
          resolutionStatus: true,
          startedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Topic search failed');
      return [];
    }
  }

  /**
   * Get unresolved conversations
   */
  async getUnresolved(virtualUserId: string): Promise<any[]> {
    try {
      return this.prisma.conversationIndex.findMany({
        where: {
          virtualUserId,
          resolutionStatus: 'pending',
        },
        orderBy: { startedAt: 'desc' },
        select: {
          conversationId: true,
          summary: true,
          issuesDiscussed: true,
          actionItems: true,
          startedAt: true,
        },
      });
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Unresolved search failed');
      return [];
    }
  }

  /**
   * Extract key exchanges from messages
   */
  private extractKeyExchanges(messages: any[]): KeyExchange[] {
    const exchanges: KeyExchange[] = [];

    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === 'user' && messages[i + 1].role === 'assistant') {
        const importance = this.scoreExchangeImportance(
          messages[i].content,
          messages[i + 1].content
        );

        if (importance > 0.5) {
          exchanges.push({
            question: messages[i].content,
            answer: messages[i + 1].content,
            importance,
            timestamp: messages[i].createdAt || new Date(),
          });
        }
      }
    }

    // Sort by importance and take top 5
    return exchanges
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }

  /**
   * Score exchange importance
   */
  private scoreExchangeImportance(question: string, answer: string): number {
    let score = 0.5;

    // Questions with specific keywords are more important
    const importantKeywords = [
      'how', 'what', 'why', 'when', 'where',
      'problem', 'issue', 'error', 'bug',
      'decision', 'choose', 'recommend',
      'price', 'cost', 'plan', 'feature',
    ];

    const questionLower = question.toLowerCase();
    for (const keyword of importantKeywords) {
      if (questionLower.includes(keyword)) {
        score += 0.1;
      }
    }

    // Long answers often indicate important information
    if (answer.length > 500) score += 0.1;
    if (answer.length > 1000) score += 0.1;

    // Code blocks indicate technical importance
    if (answer.includes('```')) score += 0.15;

    return Math.min(1.0, score);
  }

  /**
   * Map database result to index object
   */
  private mapToIndex(row: any): any {
    return {
      id: row.id,
      virtualUserId: row.virtualUserId,
      conversationId: row.conversationId,
      summary: row.summary,
      embedding: null,
      topics: row.topics,
      keyFacts: row.keyFacts,
      questionsAsked: row.questionsAsked,
      issuesDiscussed: row.issuesDiscussed,
      decisionsReached: row.decisionsReached,
      actionItems: row.actionItems,
      messageCount: 0,
      duration: 0,
      sentiment: row.sentiment,
      resolutionStatus: row.resolutionStatus,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      lastReferencedAt: null,
      referenceCount: 0,
      relatedConversationIds: [],
      memoryIds: [],
      createdAt: new Date(),
    };
  }

  /**
   * Map to suggestion
   */
  private mapToSuggestion(row: any): any {
    return {
      id: row.id,
      conversationId: row.conversationId,
      summary: row.summary,
      similarity: row.similarity,
    };
  }
}
