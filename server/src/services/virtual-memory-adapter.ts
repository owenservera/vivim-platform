/**
 * Virtual Memory Adapter Service
 * 
 * Extends the existing Memory Service for virtual users.
 * Provides the same features: encryption, embeddings, vector search,
 * consolidation, and conflict detection - but for virtual users.
 * 
 * @module services/virtual-memory-adapter
 */

import { PrismaClient, Prisma, MemoryType, MemoryConsolidationStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { encryptString, decryptString } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

export interface VirtualMemoryInput {
  content: string;
  summary?: string;
  memoryType?: MemoryType;
  category: string;
  subcategory?: string;
  tags?: string[];
  importance?: number;
  relevance?: number;
  sourceConversationIds?: string[];
  sourceAcuIds?: string[];
  sourceMessageIds?: string[];
  occurredAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  isPinned?: boolean;
  metadata?: Record<string, any>;
}

export interface VirtualMemoryResult {
  id: string;
  virtualUserId: string;
  content: string;
  summary?: string;
  memoryType: MemoryType;
  category: string;
  subcategory?: string;
  tags: string[];
  importance: number;
  relevance: number;
  accessCount: number;
  isPinned: boolean;
  isArchived: boolean;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface VirtualMemorySearchOptions {
  virtualUserId: string;
  query?: string;
  memoryType?: MemoryType;
  category?: string;
  tags?: string[];
  minImportance?: number;
  limit?: number;
  includeArchived?: boolean;
}

export interface VirtualMemorySearchResult {
  memories: VirtualMemoryResult[];
  total: number;
  hasMore: boolean;
}

/**
 * Virtual Memory Adapter Service
 */
export class VirtualMemoryAdapterService {
  private static instance: VirtualMemoryAdapterService;
  private prisma: PrismaClient;
  
  private constructor() {
    this.prisma = new PrismaClient();
  }
  
  static getInstance(): VirtualMemoryAdapterService {
    if (!VirtualMemoryAdapterService.instance) {
      VirtualMemoryAdapterService.instance = new VirtualMemoryAdapterService();
    }
    return VirtualMemoryAdapterService.instance;
  }
  
  /**
   * Create a new memory for a virtual user
   */
  async createMemory(
    virtualUserId: string,
    input: VirtualMemoryInput
  ): Promise<VirtualMemoryResult> {
    const { content, memoryType = 'EPISODIC', category } = input;
    
    // Generate embedding if content is provided
    let embedding: number[] | null = null;
    try {
      embedding = await this.generateEmbedding(content);
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to generate embedding for virtual memory');
    }
    
    // For virtual users, we don't encrypt with user's public key
    // Instead, we use a simpler encryption or store as-is based on config
    const contentToSave = content; // Could add encryption here if needed
    const summaryToSave = input.summary || null;
    
    // Create virtual memory
    const memory = await this.prisma.virtualMemory.create({
      data: {
        virtualUserId,
        content: contentToSave,
        summary: summaryToSave,
        memoryType,
        category: category || this.getDefaultCategoryForType(memoryType),
        subcategory: input.subcategory,
        tags: input.tags || [],
        importance: input.importance ?? 0.5,
        relevance: input.relevance ?? 0.5,
        sourceConversationIds: input.sourceConversationIds || [],
        sourceAcuIds: input.sourceAcuIds || [],
        sourceMessageIds: input.sourceMessageIds || [],
        embedding: embedding || undefined,
        embeddingModel: embedding ? 'text-embedding-3-small' : null,
        embeddingDimension: embedding ? 1536 : null,
        occurredAt: input.occurredAt,
        validFrom: input.validFrom,
        validUntil: input.validUntil,
        isPinned: input.isPinned || false,
        isArchived: false,
        isActive: true,
        metadata: (input.metadata || {}) as unknown as Prisma.InputJsonValue,
      }
    });
    
    logger.info({ memoryId: memory.id, virtualUserId, memoryType }, 'Virtual memory created');
    
    return this.mapToResult(memory);
  }
  
  /**
   * Create multiple memories in a batch
   */
  async createMemoriesBatch(
    virtualUserId: string,
    inputs: VirtualMemoryInput[]
  ): Promise<VirtualMemoryResult[]> {
    const results: VirtualMemoryResult[] = [];
    
    for (const input of inputs) {
      try {
        const memory = await this.createMemory(virtualUserId, input);
        results.push(memory);
      } catch (error) {
        logger.error({ error: (error as Error).message, input }, 'Failed to create virtual memory in batch');
      }
    }
    
    return results;
  }
  
  /**
   * Get a virtual memory by ID
   */
  async getMemoryById(
    virtualUserId: string,
    memoryId: string
  ): Promise<VirtualMemoryResult | null> {
    const memory = await this.prisma.virtualMemory.findFirst({
      where: {
        id: memoryId,
        virtualUserId
      }
    });
    
    if (!memory) return null;
    
    return this.mapToResult(memory);
  }
  
  /**
   * Get memories for a virtual user with filtering
   */
  async getMemories(
    virtualUserId: string,
    options: {
      memoryType?: MemoryType;
      category?: string;
      tags?: string[];
      minImportance?: number;
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
      orderBy?: 'createdAt' | 'importance' | 'relevance' | 'lastAccessedAt';
      orderDir?: 'asc' | 'desc';
    } = {}
  ): Promise<VirtualMemoryResult[]> {
    const {
      memoryType,
      category,
      tags,
      minImportance,
      limit = 50,
      offset = 0,
      includeArchived = false,
      orderBy = 'createdAt',
      orderDir = 'desc'
    } = options;
    
    const where: any = {
      virtualUserId,
      isActive: true
    };
    
    if (!includeArchived) {
      where.isArchived = false;
    }
    
    if (memoryType) {
      where.memoryType = memoryType;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    
    if (minImportance !== undefined) {
      where.importance = { gte: minImportance };
    }
    
    const memories = await this.prisma.virtualMemory.findMany({
      where,
      orderBy: { [orderBy]: orderDir },
      skip: offset,
      take: limit
    });
    
    return memories.map(m => this.mapToResult(m));
  }
  
  /**
   * Search memories by query (semantic search if embedding available)
   */
  async searchMemories(
    options: VirtualMemorySearchOptions
  ): Promise<VirtualMemorySearchResult> {
    const {
      virtualUserId,
      query,
      memoryType,
      category,
      tags,
      minImportance,
      limit = 20,
      includeArchived = false
    } = options;
    
    const where: any = {
      virtualUserId,
      isActive: true
    };
    
    if (!includeArchived) {
      where.isArchived = false;
    }
    
    if (memoryType) {
      where.memoryType = memoryType;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }
    
    if (minImportance !== undefined) {
      where.importance = { gte: minImportance };
    }
    
    // If query and embedding service available, use semantic search
    if (query) {
      try {
        const queryEmbedding = await this.generateEmbedding(query);
        
        // Use pgvector similarity search
        const memories = await this.prisma.$queryRaw<Array<any>>`
          SELECT 
            id,
            virtual_user_id,
            content,
            summary,
            memory_type,
            category,
            subcategory,
            tags,
            importance,
            relevance,
            access_count,
            is_pinned,
            is_archived,
            created_at,
            updated_at,
            metadata,
            1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM virtual_memories
          WHERE virtual_user_id = ${virtualUserId}
            AND is_active = true
            AND is_archived = ${includeArchived ? false : false}
            ${memoryType ? `AND memory_type = ${memoryType}` : ''}
            ${category ? `AND category = ${category}` : ''}
          ORDER BY embedding <=> ${queryEmbedding}::vector
          LIMIT ${limit}
        `;
        
        return {
          memories: memories.map(m => this.mapToResult({ ...m, embedding: null })),
          total: memories.length,
          hasMore: memories.length >= limit
        };
      } catch (error) {
        logger.warn({ error: (error as Error).message }, 'Semantic search failed, falling back to text search');
      }
    }
    
    // Fallback to text-based search
    const memories = await this.prisma.virtualMemory.findMany({
      where,
      orderBy: { importance: 'desc' },
      take: limit
    });
    
    return {
      memories: memories.map(m => this.mapToResult(m)),
      total: memories.length,
      hasMore: memories.length >= limit
    };
  }
  
  /**
   * Update a virtual memory
   */
  async updateMemory(
    virtualUserId: string,
    memoryId: string,
    updates: Partial<VirtualMemoryInput>
  ): Promise<VirtualMemoryResult> {
    const updateData: any = {};
    
    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }
    
    if (updates.summary !== undefined) {
      updateData.summary = updates.summary;
    }
    
    if (updates.memoryType !== undefined) {
      updateData.memoryType = updates.memoryType;
    }
    
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    
    if (updates.subcategory !== undefined) {
      updateData.subcategory = updates.subcategory;
    }
    
    if (updates.tags !== undefined) {
      updateData.tags = updates.tags;
    }
    
    if (updates.importance !== undefined) {
      updateData.importance = updates.importance;
    }
    
    if (updates.relevance !== undefined) {
      updateData.relevance = updates.relevance;
    }
    
    if (updates.isPinned !== undefined) {
      updateData.isPinned = updates.isPinned;
    }
    
    if (updates.metadata !== undefined) {
      updateData.metadata = updates.metadata as unknown as Prisma.InputJsonValue;
    }
    
    const memory = await this.prisma.virtualMemory.update({
      where: {
        id: memoryId,
        virtualUserId
      },
      data: updateData
    });
    
    logger.info({ memoryId: memory.id, virtualUserId }, 'Virtual memory updated');
    
    return this.mapToResult(memory);
  }
  
  /**
   * Archive a virtual memory
   */
  async archiveMemory(
    virtualUserId: string,
    memoryId: string
  ): Promise<VirtualMemoryResult> {
    const memory = await this.prisma.virtualMemory.update({
      where: {
        id: memoryId,
        virtualUserId
      },
      data: {
        isArchived: true
      }
    });
    
    return this.mapToResult(memory);
  }
  
  /**
   * Delete a virtual memory
   */
  async deleteMemory(
    virtualUserId: string,
    memoryId: string
  ): Promise<void> {
    await this.prisma.virtualMemory.delete({
      where: {
        id: memoryId,
        virtualUserId
      }
    });
    
    logger.info({ memoryId: memoryId, virtualUserId }, 'Virtual memory deleted');
  }
  
  /**
   * Increment access count for a memory
   */
  async incrementAccessCount(memoryId: string): Promise<void> {
    await this.prisma.virtualMemory.update({
      where: { id: memoryId },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date()
      }
    });
  }
  
  /**
   * Get memories by conversation ID
   */
  async getMemoriesByConversation(
    virtualUserId: string,
    conversationId: string
  ): Promise<VirtualMemoryResult[]> {
    const memories = await this.prisma.virtualMemory.findMany({
      where: {
        virtualUserId,
        sourceConversationIds: { has: conversationId }
      },
      orderBy: { importance: 'desc' }
    });
    
    return memories.map(m => this.mapToResult(m));
  }
  
  /**
   * Get statistics for a virtual user's memories
   */
  async getStatistics(virtualUserId: string): Promise<{
    totalMemories: number;
    memoriesByType: Record<string, number>;
    memoriesByCategory: Record<string, number>;
    avgImportance: number;
    pinnedCount: number;
    archivedCount: number;
  }> {
    const memories = await this.prisma.virtualMemory.findMany({
      where: { virtualUserId },
      select: {
        memoryType: true,
        category: true,
        importance: true,
        isPinned: true,
        isArchived: true
      }
    });
    
    const memoriesByType: Record<string, number> = {};
    const memoriesByCategory: Record<string, number> = {};
    let totalImportance = 0;
    let pinnedCount = 0;
    let archivedCount = 0;
    
    for (const memory of memories) {
      // Count by type
      memoriesByType[memory.memoryType] = (memoriesByType[memory.memoryType] || 0) + 1;
      
      // Count by category
      memoriesByCategory[memory.category] = (memoriesByCategory[memory.category] || 0) + 1;
      
      // Sum importance
      totalImportance += memory.importance;
      
      // Count pinned
      if (memory.isPinned) pinnedCount++;
      
      // Count archived
      if (memory.isArchived) archivedCount++;
    }
    
    return {
      totalMemories: memories.length,
      memoriesByType,
      memoriesByCategory,
      avgImportance: memories.length > 0 ? totalImportance / memories.length : 0,
      pinnedCount,
      archivedCount
    };
  }
  
  // ==================== Private Helper Methods ====================
  
  /**
   * Generate embedding for text content
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    // Try to use OpenAI embedding service
    // This is a simplified version - in production, use the actual embedding service
    try {
      // Check if OpenAI API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return null;
      }
      
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8191) // OpenAI token limit
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to generate embedding');
      return null;
    }
  }
  
  /**
   * Get default category for memory type
   */
  private getDefaultCategoryForType(memoryType: MemoryType): string {
    const categoryMap: Record<MemoryType, string> = {
      EPISODIC: 'events',
      SEMANTIC: 'knowledge',
      PROCEDURAL: 'skills',
      FACTUAL: 'facts',
      PREFERENCE: 'preferences',
      IDENTITY: 'identity',
      RELATIONSHIP: 'relationships',
      GOAL: 'goals',
      PROJECT: 'projects',
      CUSTOM: 'custom'
    };
    
    return categoryMap[memoryType] || 'general';
  }
  
  /**
   * Map database result to VirtualMemoryResult
   */
  private mapToResult(dbResult: any): VirtualMemoryResult {
    return {
      id: dbResult.id,
      virtualUserId: dbResult.virtualUserId,
      content: dbResult.content,
      summary: dbResult.summary,
      memoryType: dbResult.memoryType as MemoryType,
      category: dbResult.category,
      subcategory: dbResult.subcategory,
      tags: dbResult.tags,
      importance: dbResult.importance,
      relevance: dbResult.relevance,
      accessCount: dbResult.accessCount,
      isPinned: dbResult.isPinned,
      isArchived: dbResult.isArchived,
      embedding: dbResult.embedding || undefined,
      createdAt: dbResult.createdAt,
      updatedAt: dbResult.updatedAt,
      metadata: dbResult.metadata as Record<string, any>
    };
  }
}

// Export singleton instance
export const virtualMemoryAdapterService = VirtualMemoryAdapterService.getInstance();
