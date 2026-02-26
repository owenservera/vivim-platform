/**
 * Memory Node - API Node for knowledge/memory management
 * Enhanced with Communication Protocol
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  CommunicationProtocol,
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * Memory type
 */
export type MemoryType = 
  | 'episodic'    // Events, conversations
  | 'semantic'    // Facts, knowledge
  | 'procedural'  // How-to
  | 'factual'     // User facts
  | 'preference'  // Preferences
  | 'identity'    // Bio, role
  | 'relationship' // People info
  | 'goal'        // Plans
  | 'project';    // Project knowledge

/**
 * Memory
 */
export interface Memory {
  id: string;
  content: string;
  summary?: string;
  memoryType: MemoryType;
  category: string;
  tags: string[];
  
  // Provenance
  provenanceId?: string;
  provider?: string;
  sourceUrl?: string;
  
  // Lineage
  lineageDepth: number;
  lineageParentId?: string;
  derivedFromIds: string[];
  version: number;
  
  // Content fingerprinting
  contentHash?: string;
  contentVersion: number;
  
  // Embeddings (for semantic search)
  embedding?: number[];
  embeddingModel?: string;
  
  // Consolidation
  consolidationStatus: ConsolidationStatus;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

/**
 * Consolidation status
 */
export type ConsolidationStatus = 'raw' | 'processed' | 'consolidated' | 'archived';

/**
 * Memory relation
 */
export interface MemoryRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: string;
  strength: number;
  createdAt: number;
}

/**
 * Memory query
 */
export interface MemoryQuery {
  text?: string;
  types?: MemoryType[];
  categories?: string[];
  tags?: string[];
  dateRange?: { from: number; to: number };
  limit?: number;
}

/**
 * Graph options
 */
export interface GraphOptions {
  depth?: number;
  types?: MemoryType[];
  minStrength?: number;
}

/**
 * Knowledge graph
 */
export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Graph node
 */
export interface GraphNode {
  id: string;
  type: MemoryType;
  label: string;
  data: Partial<Memory>;
}

/**
 * Graph edge
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
}

/**
 * Memory Node API
 */
export interface MemoryNodeAPI {
  // CRUD
  create(data: MemoryData): Promise<Memory>;
  get(id: string): Promise<Memory>;
  update(id: string, updates: Partial<MemoryData>): Promise<Memory>;
  delete(id: string): Promise<void>;

  // Search
  search(query: MemoryQuery): Promise<Memory[]>;
  findSimilar(memoryId: string, limit?: number): Promise<Memory[]>;
  semanticSearch(query: string, limit?: number): Promise<Memory[]>;

  // Relationships
  link(sourceId: string, targetId: string, relationType: string): Promise<void>;
  unlink(sourceId: string, targetId: string): Promise<void>;
  getRelated(memoryId: string): Promise<MemoryRelation[]>;

  // Knowledge Graph
  getKnowledgeGraph(options?: GraphOptions): Promise<KnowledgeGraph>;
  getSubgraph(memoryId: string, depth?: number): Promise<KnowledgeGraph>;

  // Extraction
  extractFromConversation(conversationId: string): Promise<Memory[]>;
  consolidate(): Promise<void>;

  // Statistics
  getStats(): Promise<MemoryStats>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Memory data for creation/update
 */
export interface MemoryData {
  content: string;
  summary?: string;
  memoryType: MemoryType;
  category: string;
  tags?: string[];
  embedding?: number[];
  derivedFromIds?: string[];
  provenanceId?: string;
  provider?: string;
  sourceUrl?: string;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  totalCount: number;
  byType: Record<MemoryType, number>;
  byCategory: Record<string, number>;
  totalRelations: number;
  averageAge: number;
  lastUpdated: number;
}

/**
 * Memory Node Implementation
 */
export class MemoryNode implements MemoryNodeAPI {
  private memories: Map<string, Memory> = new Map();
  private relations: Map<string, MemoryRelation> = new Map();
  private memoryIndex: Map<string, Set<string>> = new Map(); // type -> ids
  
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('memory-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[MemoryNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubProcessed = this.communication.onEvent('message_processed', (event) => {
      console.log(`[MemoryNode] Message processed: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubProcessed);
  }

  getNodeId(): string {
    return 'memory-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'memory-node',
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      lastMessageAt: 0,
      uptime: Date.now(),
      errorsByType: {},
      requestsByPriority: {
        critical: 0,
        high: 0,
        normal: 0,
        low: 0,
        background: 0,
      },
    };
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('*', listener);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    const envelope = this.communication.createEnvelope<T>(type, payload, {
      direction: 'outbound',
      priority: 'normal',
    });

    const startTime = Date.now();
    
    try {
      const processed = await this.communication.executeHooks('before_send', envelope);
      this.communication.recordMessageSent(envelope.header.priority);
      
      this.communication.emitEvent({
        type: 'message_sent',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
      });

      const latency = Date.now() - startTime;
      this.communication.recordMessageProcessed(latency);

      return processed;
    } catch (error) {
      this.communication.recordMessageError(String(error));
      throw error;
    }
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const startTime = Date.now();
    
    try {
      this.communication.recordMessageReceived();
      let processed = await this.communication.executeHooks('before_receive', envelope);
      processed = await this.communication.executeHooks('before_process', processed);
      
      const response = await this.handleMessage(processed);
      const final = await this.communication.executeHooks('after_process', response);
      
      const latency = Date.now() - startTime;
      this.communication.recordMessageProcessed(latency);

      this.communication.emitEvent({
        type: 'message_processed',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
      });

      return final;
    } catch (error) {
      this.communication.recordMessageError(String(error));
      throw error;
    }
  }

  private async handleMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const { header, payload } = envelope;

    switch (header.type) {
      case 'memory_get':
        try {
          const memory = await this.get((payload as { id: string }).id);
          return this.communication.createResponse(envelope, { memory });
        } catch (error) {
          return this.communication.createResponse(envelope, { error: String(error) });
        }

      case 'memory_search':
        const results = await this.search(payload as MemoryQuery);
        return this.communication.createResponse(envelope, { results });

      case 'memory_semantic_search':
        const semanticResults = await this.semanticSearch(
          (payload as { query: string }).query,
          (payload as { limit?: number }).limit
        );
        return this.communication.createResponse(envelope, { results: semanticResults });

      case 'memory_stats':
        const stats = await this.getStats();
        return this.communication.createResponse(envelope, { stats });

      case 'knowledge_graph':
        const graph = await this.getKnowledgeGraph(payload as GraphOptions);
        return this.communication.createResponse(envelope, { graph });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  // ============================================
  // CRUD
  // ============================================

  async create(data: MemoryData): Promise<Memory> {
    const identity = this.sdk.getIdentity();
    if (!identity) throw new Error('Identity not initialized');

    const id = generateId();
    const now = Date.now();

    const memory: Memory = {
      id,
      content: data.content,
      summary: data.summary,
      memoryType: data.memoryType,
      category: data.category,
      tags: data.tags || [],
      provenanceId: data.provenanceId,
      provider: data.provider,
      sourceUrl: data.sourceUrl,
      lineageDepth: 0,
      derivedFromIds: data.derivedFromIds || [],
      version: 1,
      contentVersion: 1,
      embedding: data.embedding,
      embeddingModel: 'text-embedding-ada-002',
      consolidationStatus: 'raw',
      createdAt: now,
      updatedAt: now,
    };

    this.memories.set(id, memory);

    // Update index
    if (!this.memoryIndex.has(data.memoryType)) {
      this.memoryIndex.set(data.memoryType, new Set());
    }
    this.memoryIndex.get(data.memoryType)!.add(id);

    // Send creation event
    await this.sendMessage('memory_create', { id, memoryType: data.memoryType });

    return memory;
  }

  async get(id: string): Promise<Memory> {
    const memory = this.memories.get(id);
    if (!memory) throw new Error('Memory not found');
    return memory;
  }

  async update(id: string, updates: Partial<MemoryData>): Promise<Memory> {
    const memory = await this.get(id);
    
    Object.assign(memory, {
      ...updates,
      version: memory.version + 1,
      contentVersion: updates.content ? memory.contentVersion + 1 : memory.contentVersion,
      updatedAt: Date.now(),
    });

    await this.sendMessage('memory_update', { id, updates });

    return memory;
  }

  async delete(id: string): Promise<void> {
    const memory = await this.get(id);
    
    // Remove from index
    this.memoryIndex.get(memory.memoryType)?.delete(id);
    
    // Remove memory
    this.memories.delete(id);
    
    // Remove related relations
    for (const [relationId, relation] of this.relations.entries()) {
      if (relation.sourceId === id || relation.targetId === id) {
        this.relations.delete(relationId);
      }
    }

    await this.sendMessage('memory_delete', { id });
  }

  // ============================================
  // SEARCH
  // ============================================

  async search(query: MemoryQuery): Promise<Memory[]> {
    let results = Array.from(this.memories.values());

    // Filter by type
    if (query.types && query.types.length > 0) {
      results = results.filter(m => query.types!.includes(m.memoryType));
    }

    // Filter by category
    if (query.categories && query.categories.length > 0) {
      results = results.filter(m => query.categories!.includes(m.category));
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter(m => 
        query.tags!.some(tag => m.tags.includes(tag))
      );
    }

    // Filter by text
    if (query.text) {
      const text = query.text.toLowerCase();
      results = results.filter(m => 
        m.content.toLowerCase().includes(text) ||
        m.summary?.toLowerCase().includes(text) ||
        m.tags.some(t => t.toLowerCase().includes(text))
      );
    }

    // Filter by date
    if (query.dateRange) {
      results = results.filter(m => 
        m.createdAt >= query.dateRange!.from &&
        m.createdAt <= query.dateRange!.to
      );
    }

    // Sort by relevance (created date for now)
    results.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    await this.sendMessage('memory_search', { query, resultCount: results.length });

    return results;
  }

  async findSimilar(memoryId: string, limit = 5): Promise<Memory[]> {
    const memory = await this.get(memoryId);
    
    // Simple text similarity - in production would use embeddings
    const words = memory.content.toLowerCase().split(/\s+/);
    
    const scores: Array<{ memory: Memory; score: number }> = [];
    
    for (const other of this.memories.values()) {
      if (other.id === memoryId) continue;
      
      const otherWords = other.content.toLowerCase().split(/\s+/);
      const common = words.filter(w => otherWords.includes(w)).length;
      const score = common / Math.max(words.length, otherWords.length);
      
      if (score > 0.1) {
        scores.push({ memory: other, score });
      }
    }
    
    scores.sort((a, b) => b.score - a.score);
    
    return scores.slice(0, limit).map(s => s.memory);
  }

  async semanticSearch(query: string, limit = 10): Promise<Memory[]> {
    // In production, this would use vector similarity with embeddings
    // For now, fall back to text search
    await this.sendMessage('memory_semantic_search', { query, limit });
    return this.search({ text: query, limit });
  }

  // ============================================
  // RELATIONSHIPS
  // ============================================

  async link(sourceId: string, targetId: string, relationType: string): Promise<void> {
    await this.get(sourceId);
    await this.get(targetId);

    const relation: MemoryRelation = {
      id: generateId(),
      sourceId,
      targetId,
      relationType,
      strength: 1,
      createdAt: Date.now(),
    };

    this.relations.set(relation.id, relation);

    await this.sendMessage('memory_link', { sourceId, targetId, relationType });
  }

  async unlink(sourceId: string, targetId: string): Promise<void> {
    for (const [id, relation] of this.relations.entries()) {
      if (relation.sourceId === sourceId && relation.targetId === targetId) {
        this.relations.delete(id);
        
        await this.sendMessage('memory_unlink', { sourceId, targetId });
        return;
      }
    }
  }

  async getRelated(memoryId: string): Promise<MemoryRelation[]> {
    return Array.from(this.relations.values()).filter(
      r => r.sourceId === memoryId || r.targetId === memoryId
    );
  }

  // ============================================
  // KNOWLEDGE GRAPH
  // ============================================

  async getKnowledgeGraph(options: GraphOptions = {}): Promise<KnowledgeGraph> {
    const depth = options.depth || 2;
    const minStrength = options.minStrength || 0;

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Add all memories as nodes
    for (const memory of this.memories.values()) {
      if (options.types && !options.types.includes(memory.memoryType)) {
        continue;
      }

      nodes.push({
        id: memory.id,
        type: memory.memoryType,
        label: memory.summary || memory.content.slice(0, 50),
        data: {
          memoryType: memory.memoryType,
          category: memory.category,
          createdAt: memory.createdAt,
        },
      });
    }

    // Add relations as edges
    for (const relation of this.relations.values()) {
      if (relation.strength < minStrength) continue;

      edges.push({
        id: relation.id,
        source: relation.sourceId,
        target: relation.targetId,
        type: relation.relationType,
        strength: relation.strength,
      });
    }

    await this.sendMessage('knowledge_graph_get', { nodeCount: nodes.length, edgeCount: edges.length });

    return { nodes, edges };
  }

  async getSubgraph(memoryId: string, depth = 2): Promise<KnowledgeGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    const visited = new Set<string>();
    const queue: Array<{ id: string; level: number }> = [{ id: memoryId, level: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.id) || current.level > depth) continue;
      visited.add(current.id);

      const memory = this.memories.get(current.id);
      if (!memory) continue;

      nodes.push({
        id: memory.id,
        type: memory.memoryType,
        label: memory.summary || memory.content.slice(0, 50),
        data: { memoryType: memory.memoryType, category: memory.category },
      });

      // Find related memories
      for (const relation of this.relations.values()) {
        if (relation.sourceId === current.id) {
          edges.push({
            id: relation.id,
            source: relation.sourceId,
            target: relation.targetId,
            type: relation.relationType,
            strength: relation.strength,
          });
          queue.push({ id: relation.targetId, level: current.level + 1 });
        }
        if (relation.targetId === current.id) {
          edges.push({
            id: relation.id,
            source: relation.sourceId,
            target: relation.targetId,
            type: relation.relationType,
            strength: relation.strength,
          });
          queue.push({ id: relation.sourceId, level: current.level + 1 });
        }
      }
    }

    return { nodes, edges };
  }

  // ============================================
  // EXTRACTION
  // ============================================

  async extractFromConversation(conversationId: string): Promise<Memory[]> {
    // In production, this would use AI to extract memories from conversations
    // For now, create a simple memory
    const memory = await this.create({
      content: `Extracted from conversation ${conversationId}`,
      memoryType: 'episodic',
      category: 'conversation',
      tags: ['extracted', 'conversation'],
      provenanceId: conversationId,
    });

    await this.sendMessage('memory_extract', { conversationId, memoryId: memory.id });

    return [memory];
  }

  async consolidate(): Promise<void> {
    // In production, this would process raw memories and consolidate them
    for (const memory of this.memories.values()) {
      if (memory.consolidationStatus === 'raw') {
        memory.consolidationStatus = 'processed';
        memory.updatedAt = Date.now();
      }
    }

    await this.sendMessage('memory_consolidate', { processedCount: this.memories.size });
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStats(): Promise<MemoryStats> {
    const byType: Record<MemoryType, number> = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
      factual: 0,
      preference: 0,
      identity: 0,
      relationship: 0,
      goal: 0,
      project: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const memory of this.memories.values()) {
      byType[memory.memoryType]++;
      byCategory[memory.category] = (byCategory[memory.category] || 0) + 1;
    }

    const now = Date.now();
    const ages = Array.from(this.memories.values()).map(m => now - m.createdAt);
    const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    const sorted = Array.from(this.memories.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const stats: MemoryStats = {
      totalCount: this.memories.size,
      byType,
      byCategory,
      totalRelations: this.relations.size,
      averageAge,
      lastUpdated: sorted[0]?.updatedAt || 0,
    };

    await this.sendMessage('memory_stats', stats);

    return stats;
  }

  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
