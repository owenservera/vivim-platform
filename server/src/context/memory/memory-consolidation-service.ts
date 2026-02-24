/**
 * Memory Consolidation Service
 *
 * Manages memory importance decay, merging similar memories, and cleanup.
 * Runs periodically to keep the memory system healthy and efficient.
 */

import { PrismaClient } from '@prisma/client';
import {
  MemoryConsolidationOptions,
  CreateMemoryInput,
  MEMORY_CONSOLIDATION_PROMPT,
  ILLMService,
  calculateRelevance,
} from './memory-types';
import { logger } from '../../lib/logger.js';

export interface MemoryConsolidationConfig {
  prisma: PrismaClient;
  llmService: ILLMService;
  consolidationModel?: string;
}

interface ConsolidationResult {
  merged: number;
  updated: number;
  archived: number;
  errors: number;
}

export class MemoryConsolidationService {
  private prisma: PrismaClient;
  private llmService: ILLMService;
  private consolidationModel: string;

  constructor(config: MemoryConsolidationConfig) {
    this.prisma = config.prisma;
    this.llmService = config.llmService;
    this.consolidationModel = config.consolidationModel || 'glm-4.7-flash';
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Run consolidation process
   */
  async consolidate(
    userId: string,
    options: MemoryConsolidationOptions = {}
  ): Promise<ConsolidationResult> {
    const {
      batchSize = 50,
      minImportance = 0.3,
      maxAge = 24, // hours
      similarityThreshold = 0.7,
      mergeThreshold = 0.85,
    } = options;

    const result: ConsolidationResult = {
      merged: 0,
      updated: 0,
      archived: 0,
      errors: 0,
    };

    try {
      // Step 1: Update relevance scores
      result.updated += await this.updateRelevanceScores(userId);

      // Step 2: Merge similar memories
      result.merged += await this.mergeSimilarMemories(userId, similarityThreshold);

      // Step 3: Archive low-relevance memories
      result.archived += await this.archiveLowRelevanceMemories(userId, minImportance, maxAge);

      // Step 4: Clean up expired memories
      result.archived += await this.cleanupExpiredMemories(userId);

      // Update analytics
      await this.updateConsolidationStats(userId);

      logger.info({ userId, ...result }, 'Memory consolidation completed');
    } catch (error) {
      logger.error({ error, userId }, 'Memory consolidation failed');
      result.errors++;
    }

    return result;
  }

  /**
   * Merge two memories into one
   */
  async mergeMemories(
    userId: string,
    sourceMemoryIds: string[],
    targetContent?: string
  ): Promise<string | null> {
    if (sourceMemoryIds.length < 2) return null;

    // Get memories to merge
    const memories = await this.prisma.memory.findMany({
      where: {
        id: { in: sourceMemoryIds },
        userId,
      },
    });

    if (memories.length < 2) return null;

    try {
      let mergedContent = targetContent;

      // If no target content provided, use LLM to consolidate
      if (!mergedContent) {
        const consolidation = await this.llmService.chat({
          model: this.consolidationModel,
          messages: [
            {
              role: 'system',
              content: MEMORY_CONSOLIDATION_PROMPT,
            },
            {
              role: 'user',
              content: memories.map((m) => `[${m.id}] ${m.content}`).join('\n\n'),
            },
          ],
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(consolidation.content);
        mergedContent = parsed.mergedContent || memories[0].content;
      }

      // Create merged memory
      const mergedMemory = await this.prisma.memory.create({
        data: {
          userId,
          content: mergedContent,
          summary: memories[0].summary || undefined,
          memoryType: memories[0].memoryType,
          category: memories[0].category,
          importance: Math.max(...memories.map((m) => m.importance)),
          relevance: Math.max(...memories.map((m) => m.relevance)),
          mergedFromIds: sourceMemoryIds,
          sourceConversationIds: Array.from(
            new Set(memories.flatMap((m) => m.sourceConversationIds))
          ),
          sourceAcuIds: Array.from(new Set(memories.flatMap((m) => m.sourceAcuIds))),
          tags: Array.from(new Set(memories.flatMap((m) => m.tags))),
          metadata: {
            mergedFrom: sourceMemoryIds,
            mergeDate: new Date().toISOString(),
          },
        },
      });

      // Mark source memories as merged
      await this.prisma.memory.updateMany({
        where: { id: { in: sourceMemoryIds }, userId },
        data: {
          isActive: false,
          consolidationStatus: 'MERGED',
        },
      });

      // Create relationships between merged and sources
      for (const memoryId of sourceMemoryIds) {
        await this.prisma.memoryRelationship.create({
          data: {
            userId,
            sourceMemoryId: mergedMemory.id,
            targetMemoryId: memoryId,
            relationshipType: 'derived_from',
            strength: 1.0,
          },
        });
      }

      logger.info(
        {
          userId,
          mergedId: mergedMemory.id,
          sourceIds: sourceMemoryIds,
        },
        'Memories merged successfully'
      );

      return mergedMemory.id;
    } catch (error) {
      logger.error({ error, sourceMemoryIds }, 'Failed to merge memories');
      return null;
    }
  }

  /**
   * Archive memories older than specified age
   */
  async archiveOldMemories(userId: string, maxAgeDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await this.prisma.memory.updateMany({
      where: {
        userId,
        isActive: true,
        isArchived: false,
        isPinned: false,
        createdAt: { lt: cutoffDate },
        importance: { lt: 0.5 },
      },
      data: {
        isArchived: true,
        isActive: false,
        consolidationStatus: 'ARCHIVED',
      },
    });

    return result.count;
  }

  /**
   * Restore archived memories
   */
  async restoreArchivedMemories(userId: string, memoryIds: string[]): Promise<number> {
    const result = await this.prisma.memory.updateMany({
      where: {
        id: { in: memoryIds },
        userId,
      },
      data: {
        isArchived: false,
        isActive: true,
        consolidationStatus: 'CONSOLIDATED',
      },
    });

    return result.count;
  }

  /**
   * Get consolidation statistics
   */
  async getConsolidationStats(userId: string): Promise<{
    totalMemories: number;
    consolidatedMemories: number;
    mergedMemories: number;
    archivedMemories: number;
    avgImportance: number;
    avgRelevance: number;
  }> {
    const [total, consolidated, merged, archived, stats] = await Promise.all([
      this.prisma.memory.count({ where: { userId, isActive: true } }),
      this.prisma.memory.count({
        where: { userId, consolidationStatus: 'CONSOLIDATED' },
      }),
      this.prisma.memory.count({
        where: { userId, consolidationStatus: 'MERGED' },
      }),
      this.prisma.memory.count({
        where: { userId, isArchived: true },
      }),
      this.prisma.memory.aggregate({
        where: { userId, isActive: true },
        _avg: { importance: true, relevance: true },
      }),
    ]);

    return {
      totalMemories: total,
      consolidatedMemories: consolidated,
      mergedMemories: merged,
      archivedMemories: archived,
      avgImportance: stats._avg.importance || 0,
      avgRelevance: stats._avg.relevance || 0,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private async updateRelevanceScores(userId: string): Promise<number> {
    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        isArchived: false,
      },
    });

    let updated = 0;
    const now = new Date();

    for (const memory of memories) {
      const newRelevance = calculateRelevance(
        memory.relevance,
        memory.accessCount,
        memory.lastAccessedAt,
        memory.isPinned,
        now
      );

      if (Math.abs(newRelevance - memory.relevance) > 0.01) {
        await this.prisma.memory.update({
          where: { id: memory.id },
          data: { relevance: newRelevance },
        });
        updated++;
      }
    }

    return updated;
  }

  private async mergeSimilarMemories(userId: string, similarityThreshold: number): Promise<number> {
    // Find potentially similar memories using simple content matching
    const memories = await this.prisma.memory.findMany({
      where: {
        userId,
        isActive: true,
        isArchived: false,
        consolidationStatus: { in: ['RAW', 'CONSOLIDATED'] },
      },
      orderBy: { importance: 'desc' },
      take: 100,
    });

    const toMerge: string[][] = [];
    const processed = new Set<string>();

    // Simple similarity detection based on shared tags and category
    for (let i = 0; i < memories.length; i++) {
      if (processed.has(memories[i].id)) continue;

      const similar: string[] = [memories[i].id];

      for (let j = i + 1; j < memories.length; j++) {
        if (processed.has(memories[j].id)) continue;

        const similarity = this.calculateSimilarity(memories[i], memories[j]);

        if (similarity >= similarityThreshold) {
          similar.push(memories[j].id);
          processed.add(memories[j].id);
        }
      }

      if (similar.length > 1) {
        toMerge.push(similar);
        similar.forEach((id) => processed.add(id));
      }
    }

    // Perform merges
    let merged = 0;
    for (const group of toMerge) {
      const result = await this.mergeMemories(userId, group);
      if (result) merged++;
    }

    return merged;
  }

  private calculateSimilarity(
    a: { category: string; tags: string[]; content: string },
    b: { category: string; tags: string[]; content: string }
  ): number {
    // Category match
    const categoryMatch = a.category === b.category ? 0.4 : 0;

    // Tag overlap
    const aTags = new Set(a.tags);
    const bTags = new Set(b.tags);
    const intersection = Array.from(aTags).filter((x) => bTags.has(x)).length;
    const union = new Set([...Array.from(aTags), ...Array.from(bTags)]).size;
    const tagSimilarity = union > 0 ? (intersection / union) * 0.3 : 0;

    // Content similarity (simple word overlap)
    const aWords = new Set(a.content.toLowerCase().split(/\s+/));
    const bWords = new Set(b.content.toLowerCase().split(/\s+/));
    const wordIntersection = Array.from(aWords).filter((x) => bWords.has(x)).length;
    const wordUnion = new Set([...Array.from(aWords), ...Array.from(bWords)]).size;
    const contentSimilarity = wordUnion > 0 ? (wordIntersection / wordUnion) * 0.3 : 0;

    return categoryMatch + tagSimilarity + contentSimilarity;
  }

  private async archiveLowRelevanceMemories(
    userId: string,
    minImportance: number,
    maxAgeHours: number
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - maxAgeHours);

    const result = await this.prisma.memory.updateMany({
      where: {
        userId,
        isActive: true,
        isArchived: false,
        isPinned: false,
        importance: { lt: minImportance },
        relevance: { lt: 0.2 },
        OR: [{ lastAccessedAt: { lt: cutoffDate } }, { lastAccessedAt: null }],
      },
      data: {
        isArchived: true,
        isActive: false,
        consolidationStatus: 'ARCHIVED',
      },
    });

    return result.count;
  }

  private async cleanupExpiredMemories(userId: string): Promise<number> {
    const now = new Date();

    const result = await this.prisma.memory.updateMany({
      where: {
        userId,
        isActive: true,
        validUntil: { lt: now },
      },
      data: {
        isActive: false,
        isArchived: true,
        consolidationStatus: 'ARCHIVED',
      },
    });

    return result.count;
  }

  private async updateConsolidationStats(userId: string): Promise<void> {
    const stats = await this.getConsolidationStats(userId);

    await this.prisma.memoryAnalytics.upsert({
      where: { userId },
      update: {
        consolidatedCount: stats.consolidatedMemories,
        mergedCount: stats.mergedMemories,
        lastConsolidationAt: new Date(),
      },
      create: {
        userId,
        consolidatedCount: stats.consolidatedMemories,
        mergedCount: stats.mergedMemories,
        lastConsolidationAt: new Date(),
      },
    });
  }
}

export default MemoryConsolidationService;
