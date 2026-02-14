/**
 * Memory Service
 * 
 * Core CRUD operations for the VIVIM Second Brain Memory System.
 * Provides complete memory management with proper validation, 
 * embedding generation, and event emission.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreateMemoryInput,
  UpdateMemoryInput,
  MemorySearchInput,
  MemoryWithRelations,
  MemoryStatistics,
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  MemoryEventHandler,
  MemoryEvent,
  IEmbeddingService,
  getDefaultCategoryForType,
  calculateRelevance,
  estimateTokensForMemories,
  MEMORY_TYPES,
  MemoryTypeEnum,
} from './memory-types';
import { logger } from '../../lib/logger.js';

export interface MemoryServiceConfig {
  prisma: PrismaClient;
  embeddingService?: IEmbeddingService;
  embeddingModel?: string;
  embeddingDimension?: number;
}

export class MemoryService {
  private prisma: PrismaClient;
  private embeddingService?: IEmbeddingService;
  private embeddingModel: string;
  private embeddingDimension: number;
  private eventHandlers: Map<string, MemoryEventHandler[]> = new Map();

  constructor(config: MemoryServiceConfig) {
    this.prisma = config.prisma;
    this.embeddingService = config.embeddingService;
    this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    this.embeddingDimension = config.embeddingDimension || 1536;
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  on(event: string, handler: MemoryEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  private async emitEvent(event: MemoryEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    const allHandlers = this.eventHandlers.get('*') || [];
    
    for (const handler of [...handlers, ...allHandlers]) {
      try {
        await handler(event);
      } catch (error) {
        logger.error({ error, event }, 'Memory event handler failed');
      }
    }
  }

  // ============================================================================
  // CREATE OPERATIONS
  // ============================================================================

  /**
   * Create a new memory with automatic embedding generation
   */
  async createMemory(userId: string, input: CreateMemoryInput): Promise<MemoryWithRelations> {
    const { content, memoryType = MEMORY_TYPES.EPISODIC, category } = input;
    
    // Generate embedding if service available
    let embedding: number[] = [];
    if (this.embeddingService) {
      try {
        embedding = await this.embeddingService.embed(content);
      } catch (error) {
        logger.warn({ error, userId }, 'Failed to generate embedding for memory');
      }
    }

    // Set defaults
    const finalCategory = category || getDefaultCategoryForType(memoryType);
    
    // Create memory
    const memory = await this.prisma.memory.create({
      data: {
        userId,
        content: input.content,
        summary: input.summary,
        memoryType,
        category: finalCategory,
        subcategory: input.subcategory,
        tags: input.tags || [],
        importance: input.importance ?? 0.5,
        relevance: input.importance ?? 0.5,
        sourceConversationIds: input.sourceConversationIds || [],
        sourceAcuIds: input.sourceAcuIds || [],
        sourceMessageIds: input.sourceMessageIds || [],
        embedding,
        embeddingModel: embedding.length > 0 ? this.embeddingModel : null,
        embeddingDimension: embedding.length > 0 ? this.embeddingDimension : null,
        occurredAt: input.occurredAt,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isPinned: input.isPinned || false,
        metadata: (input.metadata || {}) as unknown as Prisma.InputJsonValue,
      },
    });

    // Emit event
    await this.emitEvent({
      type: 'created',
      memoryId: memory.id,
      userId,
      timestamp: new Date(),
      payload: { memoryType, category: finalCategory },
    });

    // Update analytics
    await this.updateAnalytics(userId);

    logger.info({ memoryId: memory.id, userId, memoryType }, 'Memory created');
    return this.getMemoryById(userId, memory.id)!;
  }

  /**
   * Create multiple memories in a batch
   */
  async createMemoriesBatch(
    userId: string, 
    inputs: CreateMemoryInput[]
  ): Promise<MemoryWithRelations[]> {
    const results: MemoryWithRelations[] = [];
    
    for (const input of inputs) {
      const memory = await this.createMemory(userId, input);
      results.push(memory);
    }
    
    return results;
  }

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  /**
   * Get memory by ID
   */
  async getMemoryById(userId: string, memoryId: string): Promise<MemoryWithRelations | null> {
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
      include: {
        children: true,
      },
    });

    // Get related memories
    if (memory?.relatedMemoryIds.length) {
      const related = await this.prisma.memory.findMany({
        where: {
          id: { in: memory.relatedMemoryIds },
          userId,
        },
      });
      return { ...memory, relatedMemories: related } as MemoryWithRelations;
    }

    return memory as MemoryWithRelations | null;
  }

  /**
   * Search memories with various filters
   */
  async searchMemories(userId: string, input: MemorySearchInput): Promise<{
    memories: MemoryWithRelations[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      memoryTypes,
      categories,
      tags,
      minImportance,
      maxImportance,
      isPinned,
      isActive = true,
      includeArchived = false,
      occurredAfter,
      occurredBefore,
      limit = 50,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = input;

    // Build where clause
    const where: Prisma.MemoryWhereInput = {
      userId,
    };

    // Text search
    if (query) {
      where.OR = [
        { content: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ];
    }

    // Type filter
    if (memoryTypes && memoryTypes.length > 0) {
      where.memoryType = { in: memoryTypes };
    }

    // Category filter
    if (categories && categories.length > 0) {
      where.category = { in: categories };
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Importance filter
    if (minImportance !== undefined || maxImportance !== undefined) {
      const imp: Prisma.FloatFilter<"Memory"> = {};
      if (minImportance !== undefined) imp.gte = minImportance;
      if (maxImportance !== undefined) imp.lte = maxImportance;
      where.importance = imp;
    }

    // Status filters
    if (isPinned !== undefined) {
      where.isPinned = isPinned;
    }
    if (!includeArchived) {
      where.isArchived = false;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Temporal filters
    if (occurredAfter || occurredBefore) {
      where.occurredAt = {};
      if (occurredAfter) where.occurredAt.gte = occurredAfter;
      if (occurredBefore) where.occurredAt.lte = occurredBefore;
    }

    // Get total count
    const total = await this.prisma.memory.count({ where });

    // Get memories with sorting
    const orderBy: Prisma.MemoryOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'importance':
        orderBy.importance = sortOrder;
        break;
      case 'relevance':
        orderBy.relevance = sortOrder;
        break;
      case 'createdAt':
        orderBy.createdAt = sortOrder;
        break;
      case 'accessedAt':
        orderBy.lastAccessedAt = sortOrder;
        break;
      default:
        orderBy.relevance = 'desc';
    }

    const memories = await this.prisma.memory.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        children: true,
      },
    });

    // Get related memories for each
    const memoriesWithRelations: MemoryWithRelations[] = await Promise.all(
      memories.map(async (mem) => {
        if (mem.relatedMemoryIds.length > 0) {
          const related = await this.prisma.memory.findMany({
            where: { id: { in: mem.relatedMemoryIds }, userId },
          });
          return { ...mem, relatedMemories: related } as MemoryWithRelations;
        }
        return { ...mem, relatedMemories: [] } as MemoryWithRelations;
      })
    );

    return {
      memories: memoriesWithRelations,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get memories for context - intelligent retrieval
   */
  async retrieveForContext(
    userId: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const {
      maxTokens = 2000,
      minImportance = 0.3,
      preferredTypes,
      requiredTypes,
      excludedTypes,
      tags,
      excludeTags,
      timeRange,
      includePinned = true,
      contextMessage,
    } = options;

    // Build query
    const where: Prisma.MemoryWhereInput = {
      userId,
      isActive: true,
      isArchived: false,
      importance: { gte: minImportance },
    };

    // Type filters
    if (requiredTypes && requiredTypes.length > 0) {
      where.memoryType = { in: requiredTypes };
    } else if (preferredTypes && preferredTypes.length > 0) {
      where.memoryType = { in: preferredTypes };
    }

    if (excludedTypes && excludedTypes.length > 0) {
      where.NOT = { memoryType: { in: excludedTypes } };
    }

    // Tag filters
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    if (excludeTags && excludeTags.length > 0) {
      where.NOT = { ...where.NOT, tags: { hasSome: excludeTags } };
    }

    // Pinned memories
    if (includePinned) {
      // Get pinned first
      const pinnedMemories = await this.prisma.memory.findMany({
        where: { ...where, userId, isPinned: true },
        orderBy: { importance: 'desc' },
      });

      // Get regular memories
      const regularMemories = await this.prisma.memory.findMany({
        where: { ...where, userId, isPinned: false },
        orderBy: [{ relevance: 'desc' }, { importance: 'desc' }],
        take: 100,
      });

      // Combine and fit to token budget
      const allMemories = [...pinnedMemories, ...regularMemories];
      const result = this.fitMemoriesToTokenBudget(allMemories, maxTokens);

      // Update access counts
      await this.updateAccessStats(userId, result.map(m => m.id));

      return this.formatRetrievalResult(result, maxTokens);
    }

    // Get regular memories
    const memories = await this.prisma.memory.findMany({
      where,
      orderBy: [{ relevance: 'desc' }, { importance: 'desc' }],
      take: 100,
    });

    const result = this.fitMemoriesToTokenBudget(memories, maxTokens);
    
    // Update access counts
    await this.updateAccessStats(userId, result.map(m => m.id));

    return this.formatRetrievalResult(result, maxTokens);
  }

  /**
   * Get memories by conversation
   */
  async getMemoriesByConversation(
    userId: string,
    conversationId: string
  ): Promise<MemoryWithRelations[]> {
    return this.prisma.memory.findMany({
      where: {
        userId,
        sourceConversationIds: { has: conversationId },
        isActive: true,
      },
      orderBy: { importance: 'desc' },
    }) as Promise<MemoryWithRelations[]>;
  }

  /**
   * Get pinned memories
   */
  async getPinnedMemories(userId: string): Promise<MemoryWithRelations[]> {
    return this.prisma.memory.findMany({
      where: { userId, isPinned: true, isActive: true },
      orderBy: { importance: 'desc' },
    }) as Promise<MemoryWithRelations[]>;
  }

  // ============================================================================
  // UPDATE OPERATIONS
  // ============================================================================

  /**
   * Update a memory
   */
  async updateMemory(
    userId: string,
    memoryId: string,
    input: UpdateMemoryInput
  ): Promise<MemoryWithRelations> {
    // Check ownership
    const existing = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });
    
    if (!existing) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    // Regenerate embedding if content changed
    let embedding = existing.embedding;
    if (input.content && input.content !== existing.content && this.embeddingService) {
      try {
        embedding = await this.embeddingService.embed(input.content);
      } catch (error) {
        logger.warn({ error, memoryId }, 'Failed to regenerate embedding');
      }
    }

    // Update memory
    const memory = await this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        ...(input.content && { content: input.content }),
        ...(input.summary && { summary: input.summary }),
        ...(input.memoryType && { memoryType: input.memoryType }),
        ...(input.category && { category: input.category }),
        ...(input.subcategory && { subcategory: input.subcategory }),
        ...(input.tags && { tags: input.tags }),
        ...(input.importance && { importance: input.importance }),
        ...(input.relevance && { relevance: input.relevance }),
        ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
        ...(input.validUntil && { validUntil: input.validUntil }),
        ...(input.metadata && { metadata: input.metadata as unknown as Prisma.InputJsonValue }),
        ...(embedding.length > 0 && { embedding }),
      },
    });

    // Emit event
    await this.emitEvent({
      type: 'updated',
      memoryId: memory.id,
      userId,
      timestamp: new Date(),
      payload: input as unknown as Record<string, unknown>,
    });

    return this.getMemoryById(userId, memoryId)!;
  }

  /**
   * Toggle pin status
   */
  async togglePin(userId: string, memoryId: string): Promise<MemoryWithRelations> {
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    return this.updateMemory(userId, memoryId, { isPinned: !memory.isPinned });
  }

  /**
   * Archive a memory
   */
  async archiveMemory(userId: string, memoryId: string): Promise<MemoryWithRelations> {
    return this.updateMemory(userId, memoryId, { isArchived: true, isActive: false });
  }

  /**
   * Restore a memory from archive
   */
  async restoreMemory(userId: string, memoryId: string): Promise<MemoryWithRelations> {
    return this.updateMemory(userId, memoryId, { isArchived: false, isActive: true });
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  /**
   * Delete a memory
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });

    if (!memory) {
      throw new Error(`Memory ${memoryId} not found`);
    }

    await this.prisma.memory.delete({
      where: { id: memoryId },
    });

    // Emit event
    await this.emitEvent({
      type: 'deleted',
      memoryId,
      userId,
      timestamp: new Date(),
    });

    // Update analytics
    await this.updateAnalytics(userId);

    logger.info({ memoryId, userId }, 'Memory deleted');
  }

  /**
   * Delete multiple memories
   */
  async deleteMemories(userId: string, memoryIds: string[]): Promise<number> {
    const result = await this.prisma.memory.deleteMany({
      where: {
        id: { in: memoryIds },
        userId,
      },
    });

    await this.updateAnalytics(userId);
    return result.count;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get memory statistics for a user
   */
  async getStatistics(userId: string): Promise<MemoryStatistics> {
    const [memories, analytics] = await Promise.all([
      this.prisma.memory.findMany({
        where: { userId, isActive: true },
      }),
      this.prisma.memoryAnalytics.findUnique({
        where: { userId },
      }),
    ]);

    // Calculate statistics
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalImportance = 0;
    let totalRelevance = 0;
    let pinnedCount = 0;
    let archivedCount = 0;
    let totalAccesses = 0;

    for (const mem of memories) {
      byType[mem.memoryType] = (byType[mem.memoryType] || 0) + 1;
      byCategory[mem.category] = (byCategory[mem.category] || 0) + 1;
      totalImportance += mem.importance;
      totalRelevance += mem.relevance;
      if (mem.isPinned) pinnedCount++;
      if (mem.isArchived) archivedCount++;
      totalAccesses += mem.accessCount;
    }

    const count = memories.length;
    return {
      totalMemories: count,
      byType: byType as Record<MemoryTypeEnum, number>,
      byCategory,
      byImportance: {
        critical: memories.filter(m => m.importance >= 0.9).length,
        high: memories.filter(m => m.importance >= 0.7 && m.importance < 0.9).length,
        medium: memories.filter(m => m.importance >= 0.4 && m.importance < 0.7).length,
        low: memories.filter(m => m.importance < 0.4).length,
      },
      avgImportance: count > 0 ? totalImportance / count : 0,
      avgRelevance: count > 0 ? totalRelevance / count : 0,
      pinnedCount,
      archivedCount,
      activeCount: memories.filter(m => m.isActive && !m.isArchived).length,
      totalAccesses,
      lastActivity: analytics?.lastUpdated,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private fitMemoriesToTokenBudget(
    memories: Awaited<ReturnType<typeof this.prisma.memory.findMany>>,
    maxTokens: number
  ): typeof memories {
    let usedTokens = 0;
    const result: typeof memories = [];

    for (const memory of memories) {
      const memoryTokens = Math.ceil((memory.summary || memory.content).length / 4);
      
      if (usedTokens + memoryTokens <= maxTokens) {
        result.push(memory);
        usedTokens += memoryTokens;
      } else if (result.length > 0 && memory.isPinned) {
        // For pinned memories, try to fit a truncated version
        const remaining = maxTokens - usedTokens;
        if (remaining > 50) {
          result.push(memory);
        }
        break;
      } else {
        break;
      }
    }

    return result;
  }

  private formatRetrievalResult(
    memories: Awaited<ReturnType<typeof this.prisma.memory.findMany>>,
    maxTokens: number
  ): MemoryRetrievalResult {
    const totalTokens = estimateTokensForMemories(memories);
    
    return {
      content: memories
        .map(m => m.summary || m.content)
        .join('\n\n---\n\n'),
      memories: memories.map(m => ({
        id: m.id,
        content: m.content,
        summary: m.summary || undefined,
        memoryType: m.memoryType,
        category: m.category,
        importance: m.importance,
        relevance: m.relevance,
        sourceConversationIds: m.sourceConversationIds,
      })),
      totalTokens,
      usedTokenBudget: Math.min(totalTokens, maxTokens),
    };
  }

  private async updateAccessStats(userId: string, memoryIds: string[]): Promise<void> {
    if (memoryIds.length === 0) return;

    await this.prisma.memory.updateMany({
      where: { id: { in: memoryIds }, userId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });
  }

  private async updateAnalytics(userId: string): Promise<void> {
    const stats = await this.getStatistics(userId);
    
    await this.prisma.memoryAnalytics.upsert({
      where: { userId },
      update: {
        totalMemories: stats.totalMemories,
        memoriesByType: stats.byType as unknown as Prisma.JsonObject,
        memoriesByCategory: stats.byCategory as unknown as Prisma.JsonObject,
        criticalCount: stats.byImportance.critical,
        highCount: stats.byImportance.high,
        mediumCount: stats.byImportance.medium,
        lowCount: stats.byImportance.low,
        avgRelevance: stats.avgRelevance,
        totalAccesses: stats.totalAccesses,
      },
      create: {
        userId,
        totalMemories: stats.totalMemories,
        memoriesByType: stats.byType as unknown as Prisma.JsonObject,
        memoriesByCategory: stats.byCategory as unknown as Prisma.JsonObject,
        criticalCount: stats.byImportance.critical,
        highCount: stats.byImportance.high,
        mediumCount: stats.byImportance.medium,
        lowCount: stats.byImportance.low,
        avgRelevance: stats.avgRelevance,
        totalAccesses: stats.totalAccesses,
      },
    });
  }
}

export default MemoryService;
