/**
 * VIVIM Distributed Storage Protocol
 * 
 * Provides robust distributed storage for AI chat with:
 * - CRDT-based sync
 * - Offline queue support
 * - Event sourcing for audit trail
 * - Multi-layer caching
 * 
 * Based on best practices from:
 * - Matrix Protocol (event graphs, federation)
 * - Discord (time-series storage)
 * - Yjs/Automerge (CRDTs)
 */

import type { VivimMessage } from '../chat/types.js';

// ============== Hybrid Logical Clock (HLC) ==============

/**
 * Hybrid Logical Clock timestamp
 * Combines logical and physical time for ordering
 */
export interface HLCTimestamp {
  wallTime: number;
  logical: number;
  nodeId: string;
}

/**
 * Compare HLC timestamps
 */
export function compareHLCTimestamps(a: HLCTimestamp, b: HLCTimestamp): number {
  if (a.wallTime !== b.wallTime) {
    return a.wallTime - b.wallTime;
  }
  if (a.logical !== b.logical) {
    return a.logical - b.logical;
  }
  return a.nodeId.localeCompare(b.nodeId);
}

/**
 * Create new HLC timestamp
 */
export function createHLCTimestamp(nodeId: string, lastTimestamp?: HLCTimestamp): HLCTimestamp {
  const now = Date.now();
  
  if (!lastTimestamp || now > lastTimestamp.wallTime) {
    return { wallTime: now, logical: 0, nodeId };
  }
  
  return {
    wallTime: lastTimestamp.wallTime,
    logical: lastTimestamp.logical + 1,
    nodeId,
  };
}

// ============== Message Storage ==============

/**
 * Message storage operations
 */
export interface MessageStorage {
  store(conversationId: string, message: VivimMessage): Promise<string>;
  get(conversationId: string, messageId: string): Promise<VivimMessage | null>;
  update(conversationId: string, messageId: string, updates: Partial<VivimMessage>): Promise<void>;
  delete(conversationId: string, messageId: string): Promise<void>;
  getRange(conversationId: string, start: number, end: number): Promise<VivimMessage[]>;
  getByRole(conversationId: string, role: string): Promise<VivimMessage[]>;
  search(conversationId: string, query: string): Promise<VivimMessage[]>;
  getMessageCount(conversationId: string): Promise<number>;
  getLastMessage(conversationId: string): Promise<VivimMessage | null>;
}

// ============== Conversation State ==============

export interface ConversationState {
  conversationId: string;
  version: HLCTimestamp;
  merkleRoot: string;
  messageCount: number;
  lastMessageAt: number;
  participants: string[];
}

export interface MessageDelta {
  id: string;
  conversationId: string;
  message: VivimMessage;
  timestamp: HLCTimestamp;
  operation: 'create' | 'update' | 'delete';
  previousHash?: string;
  hash: string;
}

export interface MerkleProof {
  root: string;
  path: MerklePathElement[];
  leaf: string;
}

export interface MerklePathElement {
  hash: string;
  position: 'left' | 'right';
}

// ============== Sync Protocol ==============

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  status: SyncStatus;
  deltasApplied: number;
  conflictsResolved: number;
  errors: string[];
}

export interface ConversationSyncProtocol {
  getState(conversationId: string): Promise<ConversationState>;
  generateChanges(conversationId: string, since: HLCTimestamp): Promise<MessageDelta[]>;
  applyChanges(conversationId: string, deltas: MessageDelta[]): Promise<SyncResult>;
  getMerkleRoot(conversationId: string): Promise<string>;
  verifyProof(conversationId: string, messageId: string, proof: MerkleProof): Promise<boolean>;
  getSyncStatus(conversationId: string): SyncStatus;
  onSyncProgress(callback: (progress: SyncProgress) => void): () => void;
}

export interface SyncProgress {
  conversationId: string;
  status: SyncStatus;
  progress: number;
  total: number;
  deltasApplied: number;
}

// ============== Offline Queue ==============

export interface QueuedMessage {
  id: string;
  conversationId: string;
  message: VivimMessage;
  timestamp: HLCTimestamp;
  retries: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
}

export interface OfflineQueue {
  enqueue(conversationId: string, message: VivimMessage): Promise<string>;
  dequeue(): Promise<QueuedMessage | null>;
  peek(): Promise<QueuedMessage | null>;
  size(): number;
  clear(): void;
  persist(): Promise<void>;
  restore(): Promise<void>;
  retry(): Promise<RetryResult>;
  getFailed(): QueuedMessage[];
  removeFailed(id: string): void;
}

export interface RetryResult {
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

// ============== Cache Layer ==============

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  hitCount: number;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'lfu';
}

export class MultiLevelCache<T> {
  private l1: Map<string, CacheEntry<T>> = new Map();
  private l2: Map<string, CacheEntry<T>> = new Map();
  
  constructor(private config: CacheConfig) {}
  
  get(key: string): T | undefined {
    const l1Entry = this.l1.get(key);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      l1Entry.hitCount++;
      return l1Entry.value;
    }
    
    const l2Entry = this.l2.get(key);
    if (l2Entry && l2Entry.expiresAt > Date.now()) {
      this.l1.set(key, l2Entry);
      this.l2.delete(key);
      l2Entry.hitCount++;
      return l2Entry.value;
    }
    
    return undefined;
  }
  
  set(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt: Date.now() + (ttl || this.config.ttl),
      hitCount: 0,
    };
    
    if (this.l1.size >= this.config.maxSize) {
      this.evict();
    }
    
    this.l1.set(key, entry);
  }
  
  delete(key: string): void {
    this.l1.delete(key);
    this.l2.delete(key);
  }
  
  clear(): void {
    this.l1.clear();
    this.l2.clear();
  }
  
  private evict(): void {
    if (this.config.strategy === 'lru') {
      const firstKey = this.l1.keys().next().value;
      if (firstKey) {
        const entry = this.l1.get(firstKey)!;
        this.l2.set(firstKey, entry);
        this.l1.delete(firstKey);
      }
    } else {
      let minHit = Infinity;
      let minKey: string | undefined;
      
      const entries = Array.from(this.l1.entries());
      for (const [key, entry] of entries) {
        if (entry.hitCount < minHit) {
          minHit = entry.hitCount;
          minKey = key;
        }
      }
      
      if (minKey) {
        const entry = this.l1.get(minKey)!;
        this.l2.set(minKey, entry);
        this.l1.delete(minKey);
      }
    }
  }
  
  size(): number {
    return this.l1.size + this.l2.size;
  }
}

// ============== Distributed Storage Implementation ==============

export class DistributedConversationStorage implements MessageStorage, ConversationSyncProtocol {
  private messages: Map<string, Map<string, VivimMessage>> = new Map();
  private deltas: Map<string, MessageDelta[]> = new Map();
  private state: Map<string, ConversationState> = new Map();
  private syncListeners: Set<(progress: SyncProgress) => void> = new Set();
  private nodeId: string;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  async store(conversationId: string, message: VivimMessage): Promise<string> {
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, new Map());
      this.deltas.set(conversationId, []);
    }
    
    const conversation = this.messages.get(conversationId)!;
    const timestamp = createHLCTimestamp(this.nodeId);
    const hash = this.hashMessage(message);
    
    const delta: MessageDelta = {
      id: `delta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      conversationId,
      message,
      timestamp,
      operation: 'create',
      hash,
    };
    
    conversation.set(message.id, message);
    this.deltas.get(conversationId)!.push(delta);
    
    await this.updateState(conversationId);
    
    return message.id;
  }
  
  async get(conversationId: string, messageId: string): Promise<VivimMessage | null> {
    return this.messages.get(conversationId)?.get(messageId) || null;
  }
  
  async update(conversationId: string, messageId: string, updates: Partial<VivimMessage>): Promise<void> {
    const message = await this.get(conversationId, messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }
    
    const updated = { ...message, ...updates, updated_at: Date.now() };
    this.messages.get(conversationId)!.set(messageId, updated);
    
    const timestamp = createHLCTimestamp(this.nodeId);
    const delta: MessageDelta = {
      id: `delta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      conversationId,
      message: updated,
      timestamp,
      operation: 'update',
      hash: this.hashMessage(updated),
    };
    
    this.deltas.get(conversationId)!.push(delta);
    await this.updateState(conversationId);
  }
  
  async delete(conversationId: string, messageId: string): Promise<void> {
    const message = await this.get(conversationId, messageId);
    if (!message) return;
    
    this.messages.get(conversationId)!.delete(messageId);
    
    const timestamp = createHLCTimestamp(this.nodeId);
    const delta: MessageDelta = {
      id: `delta_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      conversationId,
      message,
      timestamp,
      operation: 'delete',
      hash: '',
    };
    
    this.deltas.get(conversationId)!.push(delta);
    await this.updateState(conversationId);
  }
  
  async getRange(conversationId: string, start: number, end: number): Promise<VivimMessage[]> {
    const messages = this.messages.get(conversationId);
    if (!messages) return [];
    
    const sorted = Array.from(messages.values())
      .sort((a, b) => a.created_at - b.created_at)
      .slice(start, end);
    
    return sorted;
  }
  
  async getByRole(conversationId: string, role: string): Promise<VivimMessage[]> {
    const messages = this.messages.get(conversationId);
    if (!messages) return [];
    
    return Array.from(messages.values())
      .filter(m => m.role === role)
      .sort((a, b) => a.created_at - b.created_at);
  }
  
  async search(conversationId: string, query: string): Promise<VivimMessage[]> {
    const messages = this.messages.get(conversationId);
    if (!messages) return [];
    
    const lowerQuery = query.toLowerCase();
    return Array.from(messages.values())
      .filter(m => JSON.stringify(m.content).toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.created_at - b.created_at);
  }
  
  async getMessageCount(conversationId: string): Promise<number> {
    return this.messages.get(conversationId)?.size || 0;
  }
  
  async getLastMessage(conversationId: string): Promise<VivimMessage | null> {
    const messages = this.messages.get(conversationId);
    if (!messages || messages.size === 0) return null;
    
    return Array.from(messages.values())
      .sort((a, b) => b.created_at - a.created_at)[0];
  }
  
  async getState(conversationId: string): Promise<ConversationState> {
    return this.state.get(conversationId) || {
      conversationId,
      version: { wallTime: 0, logical: 0, nodeId: this.nodeId },
      merkleRoot: '',
      messageCount: 0,
      lastMessageAt: 0,
      participants: [],
    };
  }
  
  async generateChanges(conversationId: string, since: HLCTimestamp): Promise<MessageDelta[]> {
    const deltas = this.deltas.get(conversationId) || [];
    return deltas.filter(d => compareHLCTimestamps(d.timestamp, since) > 0);
  }
  
  async applyChanges(conversationId: string, deltas: MessageDelta[]): Promise<SyncResult> {
    let applied = 0;
    let conflicts = 0;
    const errors: string[] = [];
    
    if (!this.messages.has(conversationId)) {
      this.messages.set(conversationId, new Map());
      this.deltas.set(conversationId, []);
    }
    
    const conversation = this.messages.get(conversationId)!;
    const existingDeltas = this.deltas.get(conversationId)!;
    
    for (const delta of deltas) {
      try {
        const existing = conversation.get(delta.message.id);
        
        if (delta.operation === 'delete') {
          if (existing) {
            conversation.delete(delta.message.id);
            applied++;
          }
        } else if (!existing || compareHLCTimestamps(delta.timestamp, this.getMessageTimestamp(existing)) > 0) {
          conversation.set(delta.message.id, delta.message);
          existingDeltas.push(delta);
          applied++;
        } else {
          conflicts++;
        }
      } catch (e) {
        errors.push(String(e));
      }
    }
    
    await this.updateState(conversationId);
    
    return {
      status: errors.length > 0 ? 'error' : 'idle',
      deltasApplied: applied,
      conflictsResolved: conflicts,
      errors,
    };
  }
  
  async getMerkleRoot(conversationId: string): Promise<string> {
    const messages = this.messages.get(conversationId);
    if (!messages || messages.size === 0) return '';
    
    const hashes = Array.from(messages.values())
      .map(m => this.hashMessage(m))
      .sort();
    
    return this.computeMerkleRoot(hashes);
  }
  
  async verifyProof(conversationId: string, messageId: string, proof: MerkleProof): Promise<boolean> {
    const message = await this.get(conversationId, messageId);
    if (!message) return false;
    
    const leafHash = this.hashMessage(message);
    let currentHash = leafHash;
    
    for (const element of proof.path) {
      if (element.position === 'left') {
        currentHash = this.hashPair(element.hash, currentHash);
      } else {
        currentHash = this.hashPair(currentHash, element.hash);
      }
    }
    
    return currentHash === proof.root;
  }
  
  getSyncStatus(conversationId: string): SyncStatus {
    return 'idle';
  }
  
  onSyncProgress(callback: (progress: SyncProgress) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }
  
  private async updateState(conversationId: string): Promise<void> {
    const messages = this.messages.get(conversationId);
    if (!messages) return;
    
    const lastMessage = await this.getLastMessage(conversationId);
    const participantsSet = new Set<string>();
    
    for (const m of messages.values()) {
      if (m.metadata?.user_id) {
        participantsSet.add(m.metadata.user_id as string);
      }
    }
    
    this.state.set(conversationId, {
      conversationId,
      version: createHLCTimestamp(this.nodeId),
      merkleRoot: await this.getMerkleRoot(conversationId),
      messageCount: messages.size,
      lastMessageAt: lastMessage?.created_at || 0,
      participants: Array.from(participantsSet),
    });
  }
  
  private getMessageTimestamp(message: VivimMessage): HLCTimestamp {
    return {
      wallTime: message.created_at,
      logical: 0,
      nodeId: this.nodeId,
    };
  }
  
  private hashMessage(message: VivimMessage): string {
    const str = JSON.stringify(message);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  
  private hashPair(a: string, b: string): string {
    return this.hashMessage({ id: a + b, role: 'assistant', content: [], created_at: 0 } as VivimMessage);
  }
  
  private computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    const pairs: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      if (i + 1 < hashes.length) {
        pairs.push(this.hashPair(hashes[i], hashes[i + 1]));
      } else {
        pairs.push(hashes[i]);
      }
    }
    
    return this.computeMerkleRoot(pairs);
  }
}

// ============== Offline Queue Implementation ==============

export class OfflineMessageQueue implements OfflineQueue {
  private queue: QueuedMessage[] = [];
  private nodeId: string;
  
  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }
  
  async enqueue(conversationId: string, message: VivimMessage): Promise<string> {
    const id = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const queued: QueuedMessage = {
      id,
      conversationId,
      message,
      timestamp: createHLCTimestamp(this.nodeId),
      retries: 0,
      maxRetries: 3,
      createdAt: Date.now(),
    };
    
    this.queue.push(queued);
    return id;
  }
  
  async dequeue(): Promise<QueuedMessage | null> {
    if (this.queue.length === 0) return null;
    return this.queue.shift()!;
  }
  
  async peek(): Promise<QueuedMessage | null> {
    return this.queue[0] || null;
  }
  
  size(): number {
    return this.queue.length;
  }
  
  clear(): void {
    this.queue = [];
  }
  
  async persist(): Promise<void> {
    // Browser: localStorage, Node: file system
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vivim_offline_queue', JSON.stringify(this.queue));
    }
  }
  
  async restore(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem('vivim_offline_queue');
      if (data) {
        this.queue = JSON.parse(data);
      }
    }
  }
  
  async retry(): Promise<RetryResult> {
    const processed = this.queue.length;
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];
    
    const remaining: QueuedMessage[] = [];
    
    for (const item of this.queue) {
      if (item.retries >= item.maxRetries) {
        failed++;
        errors.push(`Max retries reached for ${item.id}`);
        continue;
      }
      
      item.retries++;
      remaining.push(item);
      successful++;
    }
    
    this.queue = remaining;
    
    return { processed, successful, failed, errors };
  }
  
  getFailed(): QueuedMessage[] {
    return this.queue.filter(q => q.retries >= q.maxRetries);
  }
  
  removeFailed(id: string): void {
    this.queue = this.queue.filter(q => q.id !== id);
  }
}

// ============== Factory Functions ==============

export function createDistributedStorage(nodeId: string): DistributedConversationStorage {
  return new DistributedConversationStorage(nodeId);
}

export function createOfflineQueue(nodeId: string): OfflineMessageQueue {
  return new OfflineMessageQueue(nodeId);
}

export function createCache<T>(config: Partial<CacheConfig> = {}): MultiLevelCache<T> {
  return new MultiLevelCache<T>({
    maxSize: config.maxSize || 1000,
    ttl: config.ttl || 60000,
    strategy: config.strategy || 'lru',
  });
}
