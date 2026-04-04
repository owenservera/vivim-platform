/**
 * Q&A Matching
 * 
 * Matches user queries to FAQ question embeddings.
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { ScoredCorpusChunk } from '../../../types/corpus';
import { logger } from '../../../lib/logger';

interface QAMatchingParams {
  tenantId: string;
  query: string;
  queryEmbedding: number[];
  maxResults?: number;
  minConfidence?: number;
}

export class QAMatching {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Match query to FAQ pairs
   */
  async match(params: QAMatchingParams): Promise<ScoredCorpusChunk[]> {
    const {
      tenantId,
      query,
      queryEmbedding,
      maxResults = 10,
      minConfidence = 0.5,
    } = params;

    try {
      // Search FAQ pairs by question embedding
      const faqResults = await this.prisma.$queryRaw<any[]>`
        SELECT
          f.id,
          f."sourceChunkId",
          f.question,
          f.answer,
          f.confidence,
          f."matchCount",
          f."helpfulCount",
          1 - (f."questionEmbedding" <=> ${queryEmbedding}::vector) as similarity
        FROM "corpus_faqs" f
        WHERE f."tenantId" = ${tenantId}
          AND f."isActive" = true
          AND f."questionEmbedding" IS NOT NULL
          AND f.confidence >= ${minConfidence}
        ORDER BY f."questionEmbedding" <=> ${queryEmbedding}::vector
        LIMIT ${maxResults}
      `;

      if (faqResults.length === 0) {
        return [];
      }

      // Get associated chunks
      const chunkIds = faqResults
        .map((f: any) => f.sourceChunkId)
        .filter(Boolean);

      if (chunkIds.length === 0) {
        return [];
      }

      const chunks = await this.prisma.corpusChunk.findMany({
        where: {
          id: { in: chunkIds },
          tenantId,
          isActive: true,
        },
      });

      // Map FAQ results to scored chunks
      return chunks
        .map(chunk => {
          const faqMatch = faqResults.find((f: any) => f.sourceChunkId === chunk.id);
          if (!faqMatch) return null;

          return {
            chunk: {
              ...chunk,
              embedding: null,
              createdAt: chunk.createdAt,
              updatedAt: chunk.updatedAt,
            },
            scores: {
              semantic: 0,
              keyword: 0,
              qaMatch: faqMatch.similarity,
              freshness: chunk.freshnessScore,
              topicAlign: 0,
              quality: chunk.qualityScore,
              combined: faqMatch.similarity,
            },
            // Add FAQ metadata for reference
            metadata: {
              faqQuestion: faqMatch.question,
              faqAnswer: faqMatch.answer,
              faqConfidence: faqMatch.confidence,
              faqHelpful: faqMatch.helpfulCount,
            },
          };
        })
        .filter((r): r is ScoredCorpusChunk & { metadata?: any } => r !== null)
        .sort((a, b) => b.scores.qaMatch - a.scores.qaMatch);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Q&A matching failed');
      return [];
    }
  }

  /**
   * Get FAQ pairs by topic
   */
  async getByTopic(
    tenantId: string,
    topicSlug: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      return this.prisma.corpusFAQ.findMany({
        where: {
          tenantId,
          topicSlug,
          isActive: true,
        },
        orderBy: { helpfulCount: 'desc' },
        take: maxResults,
        include: {
          sourceChunk: {
            select: {
              id: true,
              summary: true,
              sectionPath: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Get FAQ by topic failed');
      return [];
    }
  }

  /**
   * Record FAQ match for analytics
   */
  async recordMatch(faqId: string, wasHelpful: boolean): Promise<void> {
    try {
      await this.prisma.corpusFAQ.update({
        where: { id: faqId },
        data: {
          matchCount: { increment: 1 },
          helpfulCount: wasHelpful ? 1 : 0,
          unhelpfulCount: wasHelpful ? 0 : 1,
        },
      });
    } catch (error) {
      logger.warn({ error: (error as Error).message, faqId }, 'Failed to record FAQ match');
    }
  }
}
