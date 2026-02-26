/**
 * VIVIM CRDT Schema Library
 * 
 * Defines Conflict-free Replicated Data Types (CRDTs) for VIVIM's distributed data.
 * Based on Y.js and custom CRDT implementations.
 * 
 * @packageDocumentation
 */

import * as Y from 'yjs';
import type { Hash, DID, Timestamp, VectorClock } from './db-schema.js';

// ============================================================================
// BASE CRDT TYPES
// ============================================================================

/** Base CRDT document */
export interface CRDTDocument<T = unknown> {
  id: string;
  type: string;
  data: T;
  vectorClock: VectorClock;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** CRDT operation */
export interface CRDTOperation<T = unknown> {
  id: string;
  docId: string;
  type: 'add' | 'update' | 'delete';
  path: string;
  value?: T;
  timestamp: Timestamp;
  author: DID;
  vectorClock: VectorClock;
}

/** CRDT sync state */
export interface CRDTSyncState {
  docId: string;
  version: number;
  stateVector: Uint8Array;
  lastSyncedAt: Timestamp;
  status: 'synced' | 'syncing' | 'offline' | 'conflict';
}

// ============================================================================
// CONVERSATION CRDT
// ============================================================================

export namespace ConversationCRDT {
  /** Conversation CRDT document structure */
  export interface Document {
    /** Conversation title */
    title: Y.Text;
    
    /** Messages in the conversation */
    messages: Y.Array<Message>;
    
    /** Participants map */
    participants: Y.Map<Participant>;
    
    /** Metadata */
    metadata: Y.Map<unknown>;
    
    /** Forks/branches */
    branches: Y.Map<Branch>;
    
    /** Annotations */
    annotations: Y.Array<Annotation>;
  }

  /** Message in CRDT */
  export interface Message {
    id: string;
    authorId: string;
    content: string;
    timestamp: number;
    type: 'text' | 'image' | 'file' | 'system';
    metadata?: Record<string, unknown>;
    parentId?: string;
  }

  /** Conversation participant */
  export interface Participant {
    id: string;
    did: DID;
    displayName: string;
    avatar?: string;
    role: 'owner' | 'moderator' | 'member';
    joinedAt: number;
  }

  /** Branch/fork */
  export interface Branch {
    id: string;
    name: string;
    headId: string;
    parentBranchId?: string;
    createdAt: number;
    createdBy: DID;
  }

  /** Annotation */
  export interface Annotation {
    id: string;
    targetMessageId: string;
    authorId: string;
    content: string;
    type: 'comment' | 'correction' | 'note' | 'warning';
    createdAt: number;
    resolvedAt?: number;
  }
}

// ============================================================================
// SOCIAL CRDT
// ============================================================================

export namespace SocialCRDT {
  /** Social CRDT document */
  export interface Document {
    friends: Y.Map<Friend>;
    follows: Y.Map<Follow>;
    blocks: Y.Map<Block>;
  }

  /** Friend entry */
  export interface Friend {
    id: string;
    userId: string;
    did: DID;
    displayName: string;
    avatar?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
    createdAt: number;
    updatedAt: number;
  }

  /** Follow entry */
  export interface Follow {
    id: string;
    followerDid: DID;
    followingDid: DID;
    displayName: string;
    avatar?: string;
    notifyOnPost: boolean;
    showInFeed: boolean;
    createdAt: number;
  }

  /** Block entry */
  export interface Block {
    id: string;
    blockerDid: DID;
    blockedDid: DID;
    createdAt: number;
    reason?: string;
  }
}

// ============================================================================
// CIRCLE CRDT (RBAC Groups)
// ============================================================================

export namespace CircleCRDT {
  /** Circle CRDT document */
  export interface Document {
    /** Circle settings */
    settings: Y.Map<CircleSettings>;
    
    /** Member capabilities */
    capabilities: Y.Map<MemberCapability>;
    
    /** Pending invitations */
    invitations: Y.Map<Invitation>;
    
    /** Audit log */
    auditLog: Y.Array<AuditEntry>;
  }

  /** Circle settings */
  export interface CircleSettings {
    id: string;
    name: string;
    visibility: 'public' | 'private' | 'circle';
    sharingPolicy: 'owner-only' | 'moderators' | 'all-members';
    syncMode: 'manual' | 'realtime' | 'periodic';
    encryption: boolean;
    maxMembers?: number;
    createdAt: number;
    updatedAt: number;
  }

  /** Member capability */
  export interface MemberCapability {
    memberDid: DID;
    roles: string[];
    permissions: string[];
    grantedBy: DID;
    grantedAt: number;
  }

  /** Invitation */
  export interface Invitation {
    id: string;
    circleId: string;
    inviteeDid: DID;
    inviterDid: DID;
    roles: string[];
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    expiresAt: number;
    createdAt: number;
  }

  /** Audit entry */
  export interface AuditEntry {
    id: string;
    action: string;
    actorDid: DID;
    targetDid: DID;
    details: Record<string, unknown>;
    timestamp: number;
  }
}

// ============================================================================
// GROUP CRDT
// ============================================================================

export namespace GroupCRDT {
  /** Group CRDT document */
  export interface Document {
    /** Group settings */
    settings: Y.Map<GroupSettings>;
    
    /** Members */
    members: Y.Map<Member>;
    
    /** Posts */
    posts: Y.Array<Post>;
    
    /** Reactions */
    reactions: Y.Map<Reaction>;
  }

  /** Group settings */
  export interface GroupSettings {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    type: 'general' | 'study' | 'project' | 'community';
    visibility: 'public' | 'approval' | 'private';
    allowMemberInvite: boolean;
    allowMemberPost: boolean;
    maxMembers?: number;
    createdAt: number;
    updatedAt: number;
  }

  /** Group member */
  export interface Member {
    id: string;
    userId: string;
    did: DID;
    displayName: string;
    avatarUrl?: string;
    role: 'owner' | 'admin' | 'moderator' | 'member';
    notifyOnPost: boolean;
    showInFeed: boolean;
    joinedAt: number;
  }

  /** Group post */
  export interface Post {
    id: string;
    authorId: string;
    authorDid: DID;
    content: string;
    attachments: Attachment[];
    parentId?: string;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
  }

  /** Attachment */
  export interface Attachment {
    id: string;
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }

  /** Reaction */
  export interface Reaction {
    id: string;
    postId: string;
    userDid: DID;
    emoji: string;
    createdAt: number;
  }
}

// ============================================================================
// TEAM CRDT
// ============================================================================

export namespace TeamCRDT {
  /** Team CRDT document */
  export interface Document {
    /** Team settings */
    settings: Y.Map<TeamSettings>;
    
    /** Team members */
    members: Y.Map<TeamMember>;
    
    /** Projects */
    projects: Y.Map<Project>;
    
    /** Tasks */
    tasks: Y.Map<Task>;
  }

  /** Team settings */
  export interface TeamSettings {
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
    visibility: 'open' | 'invite';
    type: 'project' | 'work' | 'personal';
    allowGuestAccess: boolean;
    requireApproval: boolean;
    maxMembers?: number;
    createdAt: number;
    updatedAt: number;
  }

  /** Team member */
  export interface TeamMember {
    id: string;
    userId: string;
    did: DID;
    displayName: string;
    avatarUrl?: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    joinedAt: number;
  }

  /** Project */
  export interface Project {
    id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    createdAt: number;
    updatedAt: number;
  }

  /** Task */
  export interface Task {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    assigneeDid?: DID;
    dueDate?: number;
    createdAt: number;
    updatedAt: number;
  }
}

// ============================================================================
// MEMORY CRDT
// ============================================================================

export namespace MemoryCRDT {
  /** Memory CRDT document */
  export interface Document {
    /** Memory entries */
    memories: Y.Map<MemoryEntry>;
    
    /** Memory links */
    links: Y.Array<MemoryLink>;
    
    /** Tags */
    tags: Y.Map<Tag>;
  }

  /** Memory entry */
  export interface MemoryEntry {
    id: string;
    type: 'fact' | 'conversation' | 'entity' | 'skill' | 'preference';
    content: string;
    importance: number;
    tags: string[];
    accessCount: number;
    lastAccessedAt?: number;
    createdAt: number;
    updatedAt: number;
  }

  /** Memory link */
  export interface MemoryLink {
    id: string;
    sourceId: string;
    targetId: string;
    relationType: string;
    weight: number;
    createdAt: number;
  }

  /** Tag */
  export interface Tag {
    name: string;
    count: number;
    createdAt: number;
  }
}

// ============================================================================
// VECTOR CLOCK (for ordering)
// ============================================================================

export namespace VectorClock {
  /** Increment the clock for a node */
  export function increment(clock: VectorClock, nodeId: string): VectorClock {
    return {
      ...clock,
      [nodeId]: (clock[nodeId] || 0) + 1,
    };
  }

  /** Merge two vector clocks (take max of each) */
  export function merge(a: VectorClock, b: VectorClock): VectorClock {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const merged: VectorClock = {};
    
    for (const key of keys) {
      merged[key] = Math.max(a[key] || 0, b[key] || 0);
    }
    
    return merged;
  }

  /** Compare two vector clocks */
  export function compare(a: VectorClock, b: VectorClock): 'before' | 'after' | 'concurrent' | 'equal' {
    let aGreater = false;
    let bGreater = false;
    
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    
    for (const key of keys) {
      const aVal = a[key] || 0;
      const bVal = b[key] || 0;
      
      if (aVal > bVal) aGreater = true;
      if (bVal > aVal) bGreater = true;
    }
    
    if (aGreater && bGreater) return 'concurrent';
    if (aGreater) return 'after';
    if (bGreater) return 'before';
    return 'equal';
  }

  /** Check if clock A happened before clock B */
  export function happenedBefore(a: VectorClock, b: VectorClock): boolean {
    return compare(a, b) === 'before';
  }
}

// ============================================================================
// MERKLE CRDT (for content-addressed storage)
// ============================================================================

export namespace MerkleCRDT {
  /** Merkle node */
  export interface MerkleNode {
    hash: string;
    left?: string;
    right?: string;
    value?: unknown;
    isLeaf: boolean;
  }

  /** Merkle proof */
  export interface MerkleProof {
    root: string;
    leaf: string;
    path: MerkleSibling[];
  }

  /** Sibling in merkle path */
  export interface MerkleSibling {
    hash: string;
    direction: 'left' | 'right';
  }

  /** Build merkle tree from values */
  export function buildTree(values: string[]): MerkleNode[] {
    if (values.length === 0) return [];
    
    let nodes: MerkleNode[] = values.map((v) => ({
      hash: hashValue(v),
      value: v,
      isLeaf: true,
    }));
    
    while (nodes.length > 1) {
      const newLevel: MerkleNode[] = [];
      
      for (let i = 0; i < nodes.length; i += 2) {
        if (i + 1 < nodes.length) {
          const combined = nodes[i].hash + nodes[i + 1].hash;
          newLevel.push({
            hash: hashValue(combined),
            left: nodes[i].hash,
            right: nodes[i + 1].hash,
            isLeaf: false,
          });
        } else {
          newLevel.push(nodes[i]);
        }
      }
      
      nodes = newLevel;
    }
    
    return nodes;
  }

  /** Generate hash for a value */
  function hashValue(value: string): string {
    // Simple hash - in production use SHA-256
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /** Generate merkle proof for a value */
  export function generateProof(values: string[], targetIndex: number): MerkleProof | null {
    const tree = buildTree(values);
    if (tree.length === 0) return null;
    
    const root = tree[0].hash;
    const targetHash = hashValue(values[targetIndex]);
    
    // Simplified - would need full path in production
    return {
      root,
      leaf: targetHash,
      path: [],
    };
  }
}

// ============================================================================
// SYNC PROTOCOL
// ============================================================================

export namespace SyncProtocol {
  /** Sync request */
  export interface SyncRequest {
    docId: string;
    stateVector: Uint8Array;
    missingObjects: string[];
  }

  /** Sync response */
  export interface SyncResponse {
    docId: string;
    updates: Uint8Array;
    objects: Map<string, unknown>;
  }

  /** State exchange */
  export interface StateExchange {
    docId: string;
    stateVector: Uint8Array;
    clock: VectorClock;
  }
}

// ============================================================================
// CRDT MANAGER
// ============================================================================

/** CRDT Document Manager */
export class CRDTDocumentManager {
  private docs: Map<string, Y.Doc> = new Map();
  private syncStates: Map<string, CRDTSyncState> = new Map();

  /** Get or create a document */
  getDocument(docId: string, type: string = 'default'): Y.Doc {
    let doc = this.docs.get(docId);
    
    if (!doc) {
      doc = new Y.Doc();
      this.docs.set(docId, doc);
      this.syncStates.set(docId, {
        docId,
        version: 0,
        stateVector: doc.encodeStateVector(),
        lastSyncedAt: new Date().toISOString() as Timestamp,
        status: 'synced',
      });
    }
    
    return doc;
  }

  /** Get sync state for a document */
  getSyncState(docId: string): CRDTSyncState | undefined {
    return this.syncStates.get(docId);
  }

  /** Update sync state */
  updateSyncState(docId: string, state: Partial<CRDTSyncState>): void {
    const current = this.syncStates.get(docId);
    if (current) {
      this.syncStates.set(docId, { ...current, ...state });
    }
  }

  /** Get all document IDs */
  getDocumentIds(): string[] {
    return Array.from(this.docs.keys());
  }

  /** Delete a document */
  deleteDocument(docId: string): void {
    const doc = this.docs.get(docId);
    if (doc) {
      doc.destroy();
      this.docs.delete(docId);
      this.syncStates.delete(docId);
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const CRDT_SCHEMA_VERSION = '1.0.0';
