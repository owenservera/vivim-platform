/**
 * ACU Deduplication Service
 *
 * Prevents duplicate ACUs from being created by checking semantic similarity
 * and content hashing before saving new ACUs.
 */

import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { createEmbeddingService } from './utils/zai-service.js';

export interface DeduplicationCheckResult {
  isDuplicate: boolean;
  duplicateAcuId?: string;
  similarityScore?: number;
  matchType: 'exact' | 'semantic' | 'none';
  recommendation: 'skip' | 'merge' | 'create_new';
}

export class ACUDeduplicationService {
  private prisma: any;
  private embeddingService: any;

  constructor() {
    this.prisma = getPrismaClient();
    this.embeddingService = createEmbeddingService();
  }

  /**
   * Check if content is a duplicate of existing ACUs
   */
  async checkForDuplicates(
    userId: string,
    content: string,
    conversationId?: string,
    excludeAcuId?: string
  ): Promise<DeduplicationCheckResult> {
    try {
      // Step 1: Check exact hash match
      const contentHash = this.generateContentHash(content);
      const exactMatch = await this.findExactDuplicate(userId, contentHash, excludeAcuId);

      if (exactMatch) {
        logger.debug(
          { userId, contentHash, duplicateAcuId: exactMatch.id },
          'Exact ACU duplicate found'
        );
        return {
          isDuplicate: true,
          duplicateAcuId: exactMatch.id,
          similarityScore: 1.0,
          matchType: 'exact',
          recommendation: 'skip',
        };
      }

      // Step 2: Check semantic similarity
      const semanticMatch = await this.findSemanticDuplicate(
        userId,
        content,
        conversationId,
        excludeAcuId
      );

      if (semanticMatch && semanticMatch.similarity > 0.9) {
        logger.debug(
          {
            userId,
            similarity: semanticMatch.similarity,
            duplicateAcuId: semanticMatch.acu.id,
          },
          'Semantic ACU duplicate found'
        );
        return {
          isDuplicate: true,
          duplicateAcuId: semanticMatch.acu.id,
          similarityScore: semanticMatch.similarity,
          matchType: 'semantic',
          recommendation: semanticMatch.similarity > 0.95 ? 'skip' : 'merge',
        };
      }

      // No duplicates found
      return {
        isDuplicate: false,
        matchType: 'none',
        recommendation: 'create_new',
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'ACU deduplication check failed');
      // Fail open - allow creation if dedup check fails
      return {
        isDuplicate: false,
        matchType: 'none',
        recommendation: 'create_new',
      };
    }
  }

  /**
   * Find exact duplicate using content hash
   */
  private async findExactDuplicate(
    userId: string,
    contentHash: string,
    excludeAcuId?: string
  ): Promise<any | null> {
    try {
      const acu = await this.prisma.atomicChatUnit.findFirst({
        where: {
          authorDid: userId,
          contentHash,
          id: excludeAcuId ? { not: excludeAcuId } : undefined,
          state: 'ACTIVE',
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          conversationId: true,
        },
      });

      return acu;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Exact duplicate check failed');
      return null;
    }
  }

  /**
   * Find semantic duplicates using embedding similarity
   */
  private async findSemanticDuplicate(
    userId: string,
    content: string,
    conversationId?: string,
    excludeAcuId?: string
  ): Promise<{ acu: any; similarity: number } | null> {
    try {
      // Generate embedding for the new content
      const embedding = await this.embeddingService.embed(content);

      // Search for similar ACUs using vector similarity
      const query = `
        SELECT id, content, "conversationId", "createdAt",
          1 - (embedding <=> $2::vector) as similarity
        FROM atomic_chat_units
        WHERE "authorDid" = $1
          AND state = 'ACTIVE'
          ${conversationId ? 'AND "conversationId" = $3' : ''}
          ${excludeAcuId ? 'AND id != $4' : ''}
        ORDER BY embedding <=> $2::vector
        LIMIT 1
      `;

      const params: any[] = [userId, embedding];
      let paramCount = 2;

      if (conversationId) {
        paramCount++;
        params.push(conversationId);
      }

      if (excludeAcuId) {
        paramCount++;
        params.push(excludeAcuId);
      }

      const results = await this.prisma.$queryRawUnsafe(...params);

      if (results && results.length > 0) {
        const topMatch = results[0];
        if (topMatch.similarity > 0.85) {
          return {
            acu: {
              id: topMatch.id,
              content: topMatch.content,
              conversationId: topMatch.conversationId,
              createdAt: topMatch.createdAt,
            },
            similarity: topMatch.similarity,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Semantic duplicate check failed');
      return null;
    }
  }

  /**
   * Generate a SHA-256 hash of content for exact matching
   */
  private generateContentHash(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Batch deduplication check for multiple ACUs
   */
  async checkBatchForDuplicates(
    userId: string,
    contents: string[],
    conversationId?: string
  ): Promise<Map<number, DeduplicationCheckResult>> {
    const results = new Map<number, DeduplicationCheckResult>();

    for (let i = 0; i < contents.length; i++) {
      const result = await this.checkForDuplicates(userId, contents[i], conversationId);
      results.set(i, result);
    }

    return results;
  }

  /**
   * Get potential duplicate ACUs for manual review
   */
  async getPotentialDuplicates(
    userId: string,
    content: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const embedding = await this.embeddingService.embed(content);

      const query = `
        SELECT id, content, "conversationId", "createdAt",
          1 - (embedding <=> $2::vector) as similarity
        FROM atomic_chat_units
        WHERE "authorDid" = $1
          AND state = 'ACTIVE'
        ORDER BY embedding <=> $2::vector
        LIMIT $3
      `;

      const results = await this.prisma.$queryRawUnsafe(userId, embedding, limit);
      return results.filter((r: any) => r.similarity > 0.7);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to get potential duplicates');
      return [];
    }
  }

  /**
   * Merge duplicate ACUs into a single ACU
   */
  async mergeDuplicates(
    userId: string,
    targetAcuId: string,
    sourceAcuIds: string[]
  ): Promise<boolean> {
    const tx = await this.prisma.$transaction();

    try {
      // Get target ACU
      const targetAcu = await tx.atomicChatUnit.findUnique({
        where: { id: targetAcuId },
      });

      if (!targetAcu || targetAcu.authorDid !== userId) {
        throw new Error('Target ACU not found or access denied');
      }

      // Mark source ACUs as merged
      for (const sourceId of sourceAcuIds) {
        await tx.atomicChatUnit.update({
          where: { id: sourceId },
          data: {
            state: 'MERGED',
            parentId: targetAcuId,
          },
        });
      }

      // Update target ACU metadata
      await tx.atomicChatUnit.update({
        where: { id: targetAcuId },
        data: {
          metadata: {
            ...targetAcu.metadata,
            mergedFrom: sourceAcuIds,
            mergedAt: new Date().toISOString(),
          },
        },
      });

      await tx.commit();
      logger.info(
        { targetAcuId, sourceAcuIds },
        'Successfully merged duplicate ACUs'
      );
      return true;
    } catch (error) {
      await tx.rollback();
      logger.error({ error: (error as Error).message }, 'Failed to merge duplicate ACUs');
      return false;
    }
  }
}

export const acuDeduplicationService = new ACUDeduplicationService();
