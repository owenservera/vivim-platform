/**
 * VIVIM Core Database
 * 
 * Unified database layer implementing storage, queries, and synchronization
 * using the unified schema library.
 * 
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type {
  Hash,
  DID,
  CID,
  Signature,
  Timestamp,
  VectorClock,
} from './db-schema.js';
import type {
  Conversation,
  Content,
  Identity,
  Social,
  Group,
  Memory,
  Chain,
  ACU,
  Network,
  Storage as StorageTypes,
  Error as ErrorTypes,
} from './db-schema.js';
import { Guards, Cast } from './db-schema.js';

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

export interface DatabaseConfig {
  /** Storage provider */
  provider: 'memory' | 'indexeddb' | 'sqlite' | 'ipfs';
  
  /** Database name */
  name: string;
  
  /** Enable encryption */
  encryption?: boolean;
  
  /** Encryption key (if enabled) */
  encryptionKey?: string;
  
  /** Sync configuration */
  sync?: {
    enabled: boolean;
    syncInterval?: number;
    peerId?: string;
  };
}

export const DEFAULT_DATABASE_CONFIG: DatabaseConfig = {
  provider: 'memory',
  name: 'vivim-db',
  encryption: false,
  sync: {
    enabled: false,
    syncInterval: 30000,
  },
};

// ============================================================================
// STORES
// ============================================================================

/** Base store interface */
export interface Store<T> {
  /** Get by ID */
  get(id: string): Promise<T | null>;
  
  /** Set value */
  set(id: string, value: T): Promise<void>;
  
  /** Delete by ID */
  delete(id: string): Promise<void>;
  
  /** Check existence */
  has(id: string): Promise<boolean>;
  
  /** Get all keys */
  keys(): Promise<string[]>;
  
  /** Get all values */
  values(): Promise<T[]>;
  
  /** Clear store */
  clear(): Promise<void>;
  
  /** Get count */
  count(): Promise<number>;
}

/** Query interface */
export interface Query<T> {
  /** Filter by field */
  where(field: keyof T, operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin', value: unknown): this;
  
  /** Order by field */
  orderBy(field: keyof T, direction: 'asc' | 'desc'): this;
  
  /** Limit results */
  limit(count: number): this;
  
  /** Skip results */
  offset(count: number): this;
  
  /** Execute query */
  execute(): Promise<T[]>;
  
  /** Get first result */
  first(): Promise<T | null>;
}

/** Index definition */
export interface IndexDefinition {
  /** Field to index */
  field: string;
  
  /** Unique index */
  unique?: boolean;
  
  /** Multi-entry index (for arrays) */
  multiEntry?: boolean;
}

// ============================================================================
// IDENTITY STORE
// ============================================================================

export class IdentityStore {
  private users = new Map<string, Identity.User>();
  private devices = new Map<string, Identity.Device>();
  private apiKeys = new Map<string, Identity.APIKey>();
  
  // User operations
  async createUser(user: Identity.User): Promise<void> {
    this.users.set(user.id, user);
  }
  
  async getUser(id: string): Promise<Identity.User | null> {
    return this.users.get(id) || null;
  }
  
  async getUserByDID(did: DID): Promise<Identity.User | null> {
    for (const user of this.users.values()) {
      if (user.did === did) return user;
    }
    return null;
  }
  
  async updateUser(id: string, updates: Partial<Identity.User>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, ...updates });
    }
  }
  
  async getAllUsers(): Promise<Identity.User[]> {
    return Array.from(this.users.values());
  }
  
  // Device operations
  async addDevice(device: Identity.Device): Promise<void> {
    this.devices.set(device.id, device);
  }
  
  async getDevice(id: string): Promise<Identity.Device | null> {
    return this.devices.get(id) || null;
  }
  
  async getDevicesByUser(userId: string): Promise<Identity.Device[]> {
    return Array.from(this.devices.values()).filter(d => d.userId === userId);
  }
  
  // API Key operations
  async addAPIKey(key: Identity.APIKey): Promise<void> {
    this.apiKeys.set(key.id, key);
  }
  
  async getAPIKey(id: string): Promise<Identity.APIKey | null> {
    return this.apiKeys.get(id) }
  
  async getAPIKeysBy || null;
 User(userId: string): Promise<Identity.APIKey[]> {
    return Array.from(this.apiKeys.values()).filter(k => k.userId === userId);
  }
}

// ============================================================================
// CONVERSATION STORE
// ============================================================================

export class ConversationStore {
  private nodes = new Map<string, Conversation.Node>();
  private roots = new Map<string, Conversation.Root>();
  private snapshots = new Map<string, Conversation.Snapshot>();
  private indices = new Map<string, Conversation.Index>();
  
  // Node operations
  async putNode(node: Conversation.Node): Promise<void> {
    this.nodes.set(node.id, node);
    
    // Update index if root
    if (Guards.isConversationRoot(node)) {
      await this.updateIndex(node);
    }
  }
  
  async getNode(id: Hash): Promise<Conversation.Node | null> {
    return this.nodes.get(id as string) || null;
  }
  
  async getNodesByConversation(conversationId: Hash): Promise<Conversation.Node[]> {
    const result: Conversation.Node[] = [];
    for (const node of this.nodes.values()) {
      if ('conversationId' in node && node.conversationId === conversationId) {
        result.push(node);
      }
    }
    return result;
  }
  
  // Root operations
  async putRoot(root: Conversation.Root): Promise<void> {
    this.roots.set(root.conversationId as string, root);
    await this.putNode(root);
    await this.updateIndex(root);
  }
  
  async getRoot(conversationId: Hash): Promise<Conversation.Root | null> {
    return this.roots.get(conversationId as string) || null;
  }
  
  // Snapshot operations
  async putSnapshot(snapshot: Conversation.Snapshot): Promise<void> {
    this.snapshots.set(snapshot.id as string, snapshot);
  }
  
  async getSnapshot(id: Hash): Promise<Conversation.Snapshot | null> {
    return this.snapshots.get(id as string) || null;
  }
  
  async getSnapshotsByConversation(conversationId: Hash): Promise<Conversation.Snapshot[]> {
    return Array.from(this.snapshots.values())
      .filter(s => s.conversationId === conversationId)
      .sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
  }
  
  // Index operations
  private async updateIndex(root: Conversation.Root): Promise<void> {
    const conversationId = root.conversationId as string;
    const nodes = await this.getNodesByConversation(Cast.asHash(conversationId));
    
    const index: Conversation.Index = {
      conversationId: Cast.asHash(conversationId),
      rootHash: Cast.asHash(root.id),
      title: root.title,
      createdAt: root.timestamp,
      updatedAt: root.timestamp,
      messageCount: nodes.filter(n => n.type === 'message').length,
      snapshotCount: this.snapshots.size,
      tags: root.metadata?.tags || [],
    };
    
    this.indices.set(conversationId, index);
  }
  
  async getIndex(conversationId: Hash): Promise<Conversation.Index | null> {
    return this.indices.get(conversationId as string) || null;
  }
  
  async getAllIndices(): Promise<Conversation.Index[]> {
    return Array.from(this.indices.values());
  }
  
  // Query operations
  async queryConversations(where: {
    tags?: string[];
    since?: Timestamp;
    until?: Timestamp;
  }): Promise<Conversation.Index[]> {
    let results = Array.from(this.indices.values());
    
    if (where.tags && where.tags.length > 0) {
      results = results.filter(idx => 
        where.tags!.some(tag => idx.tags.includes(tag))
      );
    }
    
    if (where.since) {
      results = results.filter(idx => idx.updatedAt >= where.since!);
    }
    
    if (where.until) {
      results = results.filter(idx => idx.updatedAt <= where.until!);
    }
    
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

// ============================================================================
// SOCIAL STORE
// ============================================================================

export class SocialStore {
  private friends = new Map<string, Social.Friend>();
  private follows = new Map<string, Social.Follow>();
  
  // Friend operations
  async addFriend(friend: Social.Friend): Promise<void> {
    this.friends.set(friend.id, friend);
  }
  
  async getFriend(id: string): Promise<Social.Friend | null> {
    return this.friends.get(id) || null;
  }
  
  async getFriendsByUser(userId: string): Promise<Social.Friend[]> {
    return Array.from(this.friends.values())
      .filter(f => f.requesterId === userId || f.addresseeId === userId)
      .filter(f => f.status === 'accepted');
  }
  
  async getPendingFriendRequests(userId: string): Promise<Social.Friend[]> {
    return Array.from(this.friends.values())
      .filter(f => f.addresseeId === userId && f.status === 'pending');
  }
  
  async updateFriendStatus(id: string, status: Social.FriendStatus): Promise<void> {
    const friend = this.friends.get(id);
    if (friend) {
      friend.status = status;
      if (status === 'accepted') {
        friend.respondedAt = Cast.asTimestamp(new Date().toISOString());
      }
      this.friends.set(id, friend);
    }
  }
  
  // Follow operations
  async addFollow(follow: Social.Follow): Promise<void> {
    const key = `${follow.followerId}:${follow.followingId}`;
    this.follows.set(key, follow);
  }
  
  async getFollow(followerId: string, followingId: string): Promise<Social.Follow | null> {
    return this.follows.get(`${followerId}:${followingId}`) || null;
  }
  
  async getFollowers(userId: string): Promise<Social.Follow[]> {
    return Array.from(this.follows.values())
      .filter(f => f.followingId === userId && f.status === 'active');
  }
  
  async getFollowing(userId: string): Promise<Social.Follow[]> {
    return Array.from(this.follows.values())
      .filter(f => f.followerId === userId && f.status === 'active');
  }
  
  async getFollowerStats(userId: string): Promise<Social.FollowerStats> {
    const followers = await this.getFollowers(userId);
    const following = await this.getFollowing(userId);
    
    return {
      followerCount: followers.length,
      followingCount: following.length,
    };
  }
}

// ============================================================================
// GROUP STORE
// ============================================================================

export class GroupStore {
  private groups = new Map<string, Group.Group>();
  private members = new Map<string, Group.Member>();
  private circles = new Map<string, Group.Circle>();
  
  // Group operations
  async createGroup(group: Group.Group): Promise<void> {
    this.groups.set(group.id, group);
  }
  
  async getGroup(id: string): Promise<Group.Group | null> {
    return this.groups.get(id) || null;
  }
  
  async getGroupsByUser(userId: string): Promise<Group.Group[]> {
    const userMembers = await this.getMemberships(userId);
    const groupIds = new Set(userMembers.map(m => m.groupId));
    
    return Array.from(this.groups.values())
      .filter(g => groupIds.has(g.id));
  }
  
  async updateGroup(id: string, updates: Partial<Group.Group>): Promise<void> {
    const group = this.groups.get(id);
    if (group) {
      this.groups.set(id, { ...group, ...updates });
    }
  }
  
  // Member operations
  async addMember(member: Group.Member): Promise<void> {
    this.members.set(member.id, member);
    
    // Update group member count
    const group = this.groups.get(member.groupId);
    if (group) {
      group.memberCount++;
      this.groups.set(member.groupId, group);
    }
  }
  
  async getMember(id: string): Promise<Group.Member | null> {
    return this.members.get(id) || null;
  }
  
  async getMemberships(userId: string): Promise<Group.Member[]> {
    return Array.from(this.members.values())
      .filter(m => m.userId === userId);
  }
  
  async getMembersByGroup(groupId: string): Promise<Group.Member[]> {
    return Array.from(this.members.values())
      .filter(m => m.groupId === groupId);
  }
  
  async removeMember(id: string): Promise<void> {
    const member = this.members.get(id);
    if (member) {
      // Update group count
      const group = this.groups.get(member.groupId);
      if (group && group.memberCount > 0) {
        group.memberCount--;
        this.groups.set(member.groupId, group);
      }
      this.members.delete(id);
    }
  }
  
  // Circle operations
  async createCircle(circle: Group.Circle): Promise<void> {
    this.circles.set(circle.id, circle);
  }
  
  async getCircle(id: string): Promise<Group.Circle | null> {
    return this.circles.get(id) || null;
  }
  
  async getCirclesByUser(did: DID): Promise<Group.Circle[]> {
    return Array.from(this.circles.values())
      .filter(c => c.ownerDid === did);
  }
}

// ============================================================================
// MEMORY STORE
// ============================================================================

export class MemoryStore {
  private memories = new Map<string, Memory.Memory>();
  private links = new Map<string, Memory.MemoryLink>();
  
  // Memory operations
  async createMemory(memory: Memory.Memory): Promise<void> {
    this.memories.set(memory.id, memory);
  }
  
  async getMemory(id: string): Promise<Memory.Memory | null> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessedAt = Cast.asTimestamp(new Date().toISOString());
      this.memories.set(id, memory);
    }
    return memory || null;
  }
  
  async getMemoriesByUser(userId: string): Promise<Memory.Memory[]> {
    return Array.from(this.memories.values())
      .filter(m => m.userId === userId);
  }
  
  async searchMemories(query: Memory.MemoryQuery): Promise<Memory.Memory[]> {
    let results = await this.getMemoriesByUser(query.text ? '' : ''); // Simplified
    
    if (query.types && query.types.length > 0) {
      results = results.filter(m => query.types!.includes(m.type));
    }
    
    if (query.tags && query.tags.length > 0) {
      results = results.filter(m => 
        query.tags!.some(tag => m.tags.includes(tag))
      );
    }
    
    if (query.minImportance !== undefined) {
      results = results.filter(m => m.importance >= query.minImportance!);
    }
    
    if (query.limit) {
      results = results.slice(0, query.limit);
    }
    
    return results;
  }
  
  async updateMemory(id: string, updates: Partial<Memory.Memory>): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      this.memories.set(id, { ...memory, ...updates });
    }
  }
  
  async deleteMemory(id: string): Promise<void> {
    this.memories.delete(id);
    
    // Delete associated links
    for (const [linkId, link] of this.links) {
      if (link.sourceId === id || link.targetId === id) {
        this.links.delete(linkId);
      }
    }
  }
  
  // Link operations
  async addLink(link: Memory.MemoryLink): Promise<void> {
    this.links.set(link.id, link);
  }
  
  async getLinksByMemory(memoryId: string): Promise<Memory.MemoryLink[]> {
    return Array.from(this.links.values())
      .filter(l => l.sourceId === memoryId || l.targetId === memoryId);
  }
  
  async removeLink(id: string): Promise<void> {
    this.links.delete(id);
  }
}

// ============================================================================
// CHAIN STORE
// ============================================================================

export class ChainStore {
  private events = new Map<string, Chain.Event>();
  private blocks = new Map<string, Chain.Block>();
  private entities = new Map<string, Chain.EntityState>();
  
  // Event operations
  async addEvent(event: Chain.Event): Promise<void> {
    this.events.set(event.id, event);
  }
  
  async getEvent(id: string): Promise<Chain.Event | null> {
    return this.events.get(id) || null;
  }
  
  async getEventsByAuthor(author: DID): Promise<Chain.Event[]> {
    return Array.from(this.events.values())
      .filter(e => e.author === author)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  
  async getEventsByType(type: Chain.EventType): Promise<Chain.Event[]> {
    return Array.from(this.events.values())
      .filter(e => e.type === type);
  }
  
  async getEventsByScope(scope: Chain.EventScope): Promise<Chain.Event[]> {
    return Array.from(this.events.values())
      .filter(e => e.scope === scope);
  }
  
  // Block operations
  async addBlock(block: Chain.Block): Promise<void> {
    this.blocks.set(block.id, block);
  }
  
  async getBlock(id: string): Promise<Chain.Block | null> {
    return this.blocks.get(id) || null;
  }
  
  async getLatestBlock(): Promise<Chain.Block | null> {
    const blocks = Array.from(this.blocks.values());
    if (blocks.length === 0) return null;
    return blocks.reduce((latest, block) => 
      block.number > latest.number ? block : latest
    );
  }
  
  // Entity operations
  async setEntityState(entity: Chain.EntityState): Promise<void> {
    this.entities.set(entity.id, entity);
  }
  
  async getEntityState(id: string): Promise<Chain.EntityState | null> {
    return this.entities.get(id) || null;
  }
  
  async getEntitiesByType(type: Chain.EntityType): Promise<Chain.EntityState[]> {
    return Array.from(this.entities.values())
      .filter(e => e.type === type);
  }
}

// ============================================================================
// CORE DATABASE
// ============================================================================

export class CoreDatabase extends EventEmitter {
  private config: DatabaseConfig;
  private identityStore: IdentityStore;
  private conversationStore: ConversationStore;
  private socialStore: SocialStore;
  private groupStore: GroupStore;
  private memoryStore: MemoryStore;
  private chainStore: ChainStore;
  private initialized = false;
  
  constructor(config: Partial<DatabaseConfig> = {}) {
    super();
    this.config = { ...DEFAULT_DATABASE_CONFIG, ...config };
    this.identityStore = new IdentityStore();
    this.conversationStore = new ConversationStore();
    this.socialStore = new SocialStore();
    this.groupStore = new GroupStore();
    this.memoryStore = new MemoryStore();
    this.chainStore = new ChainStore();
  }
  
  /** Initialize database */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    this.initialized = true;
    this.emit('initialized');
  }
  
  /** Get identity store */
  getIdentityStore(): IdentityStore {
    return this.identityStore;
  }
  
  /** Get conversation store */
  getConversationStore(): ConversationStore {
    return this.conversationStore;
  }
  
  /** Get social store */
  getSocialStore(): SocialStore {
    return this.socialStore;
  }
  
  /** Get group store */
  getGroupStore(): GroupStore {
    return this.groupStore;
  }
  
  /** Get memory store */
  getMemoryStore(): MemoryStore {
    return this.memoryStore;
  }
  
  /** Get chain store */
  getChainStore(): ChainStore {
    return this.chainStore;
  }
  
  /** Export database */
  async export(): Promise<string> {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      // Would serialize all stores here
    };
    return JSON.stringify(data, null, 2);
  }
  
  /** Import database */
  async import(data: string): Promise<void> {
    const parsed = JSON.parse(data);
    // Would deserialize and populate stores
    this.emit('imported');
  }
  
  /** Clear all data */
  async clear(): Promise<void> {
    this.emit('clearing');
    // Would clear all stores
    this.emit('cleared');
  }
  
  /** Close database */
  async close(): Promise<void> {
    await this.clear();
    this.initialized = false;
    this.emit('closed');
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/** Create a new database instance */
export function createDatabase(config?: Partial<DatabaseConfig>): CoreDatabase {
  return new CoreDatabase(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  Hash,
  DID,
  CID,
  Signature,
  Timestamp,
  VectorClock,
} from './db-schema.js';

export type {
  Conversation,
  Content,
  Identity,
  Social,
  Group,
  Memory,
  Chain,
  ACU,
  Network,
  Storage as StorageTypes,
  Error as ErrorTypes,
} from './db-schema.js';

export { Guards, Cast } from './db-schema.js';
