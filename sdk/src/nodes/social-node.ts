/**
 * Social Node - API Node for social graph management
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
 * Friend status
 */
export type FriendStatus = 'pending' | 'rejected' | '' | 'acceptedblocked';

/**
 * Follow status
 */
export type FollowStatus = 'active' | 'muted' | 'blocked';

/**
 * Circle info
 */
export interface Circle {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  memberCount: number;
  createdAt: number;
}

/**
 * Circle member
 */
export interface CircleMember {
  circleId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: number;
}

/**
 * Circle options
 */
export interface CircleOptions {
  description?: string;
  isPublic?: boolean;
  members?: string[];
}

/**
 * Friend info
 */
export interface FriendInfo {
  did: string;
  status: FriendStatus;
  requestedAt?: number;
  acceptedAt?: number;
}

/**
 * Friend request
 */
export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendStatus;
  requestedAt: number;
  respondedAt?: number;
}

/**
 * Social Node API
 */
export interface SocialNodeAPI {
  // Follows
  follow(did: string): Promise<void>;
  unfollow(did: string): Promise<void>;
  getFollowers(did: string): Promise<string[]>;
  getFollowing(did: string): Promise<string[]>;
  isFollowing(did: string): Promise<boolean>;

  // Friends
  sendFriendRequest(did: string): Promise<void>;
  acceptFriendRequest(requestId: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  getFriends(): Promise<FriendInfo[]>;
  getPendingRequests(): Promise<FriendRequest[]>;
  removeFriend(did: string): Promise<void>;

  // Circles
  createCircle(name: string, options?: CircleOptions): Promise<Circle>;
  getCircle(circleId: string): Promise<Circle>;
  updateCircle(circleId: string, updates: Partial<Circle>): Promise<void>;
  deleteCircle(circleId: string): Promise<void>;
  addCircleMember(circleId: string, did: string): Promise<void>;
  removeCircleMember(circleId: string, did: string): Promise<void>;
  getCircleMembers(circleId: string): Promise<CircleMember[]>;
  getUserCircles(): Promise<Circle[]>;

  // Blocking
  block(did: string): Promise<void>;
  unblock(did: string): Promise<void>;
  getBlocked(): Promise<string[]>;
  isBlocked(did: string): Promise<boolean>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Social Node Implementation
 */
export class SocialNode implements SocialNodeAPI {
  // Social graph storage
  private followers: Map<string, Set<string>> = new Map();
  private following: Map<string, Set<string>> = new Map();
  private friends: Map<string, FriendRequest> = new Map();
  private circles: Map<string, Circle> = new Map();
  private circleMembers: Map<string, Map<string, CircleMember>> = new Map();
  private blocked: Set<string> = new Set();
  
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('social-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[SocialNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);
  }

  getNodeId(): string {
    return 'social-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'social-node',
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

      return final;
    } catch (error) {
      this.communication.recordMessageError(String(error));
      throw error;
    }
  }

  private async handleMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const { header, payload } = envelope;

    switch (header.type) {
      case 'follow':
        await this.follow((payload as { did: string }).did);
        return this.communication.createResponse(envelope, { success: true });

      case 'get_followers':
        const followers = await this.getFollowers((payload as { did: string }).did);
        return this.communication.createResponse(envelope, { followers });

      case 'get_following':
        const following = await this.getFollowing((payload as { did: string }).did);
        return this.communication.createResponse(envelope, { following });

      case 'get_friends':
        const friends = await this.getFriends();
        return this.communication.createResponse(envelope, { friends });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  // ============================================
  // FOLLOWS
  // ============================================

  async follow(did: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) throw new Error('Identity not initialized');

    if (!this.following.has(identity.did)) {
      this.following.set(identity.did, new Set());
    }
    this.following.get(identity.did)!.add(did);

    if (!this.followers.has(did)) {
      this.followers.set(did, new Set());
    }
    this.followers.get(did)!.add(identity.did);

    await this.sendMessage('follow', { did });
  }

  async unfollow(did: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) return;

    this.following.get(identity.did)?.delete(did);
    this.followers.get(did)?.delete(identity.did);

    await this.sendMessage('unfollow', { did });
  }

  async getFollowers(did: string): Promise<string[]> {
    return Array.from(this.followers.get(did) || []);
  }

  async getFollowing(did: string): Promise<string[]> {
    return Array.from(this.following.get(did) || []);
  }

  async isFollowing(did: string): Promise<boolean> {
    const identity = this.sdk.getIdentity();
    if (!identity) return false;
    return this.following.get(identity.did)?.has(did) ?? false;
  }

  // ============================================
  // FRIENDS
  // ============================================

  async sendFriendRequest(did: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) throw new Error('Identity not initialized');

    const request: FriendRequest = {
      id: generateId(),
      requesterId: identity.did,
      addresseeId: did,
      status: 'pending',
      requestedAt: Date.now(),
    };

    this.friends.set(request.id, request);
    
    await this.sendMessage('friend_request', { did, requestId: request.id });
  }

  async acceptFriendRequest(requestId: string): Promise<void> {
    const request = this.friends.get(requestId);
    if (!request) throw new Error('Friend request not found');

    request.status = 'accepted';
    request.respondedAt = Date.now();

    // Add to both users' following lists
    await this.follow(request.requesterId);
    await this.follow(request.addresseeId);
    
    await this.sendMessage('friend_accept', { requestId });
  }

  async rejectFriendRequest(requestId: string): Promise<void> {
    const request = this.friends.get(requestId);
    if (!request) throw new Error('Friend request not found');

    request.status = 'rejected';
    request.respondedAt = Date.now();
    
    await this.sendMessage('friend_reject', { requestId });
  }

  async getFriends(): Promise<FriendInfo[]> {
    const identity = this.sdk.getIdentity();
    if (!identity) return [];

    const friends: FriendInfo[] = [];
    
    for (const request of this.friends.values()) {
      if (request.status === 'accepted') {
        const friendDid = request.requesterId === identity.did 
          ? request.addresseeId 
          : request.requesterId;
        
        friends.push({
          did: friendDid,
          status: 'accepted',
          acceptedAt: request.respondedAt,
        });
      }
    }

    return friends;
  }

  async getPendingRequests(): Promise<FriendRequest[]> {
    const identity = this.sdk.getIdentity();
    if (!identity) return [];

    return Array.from(this.friends.values()).filter(
      r => r.status === 'pending' && r.addresseeId === identity.did
    );
  }

  async removeFriend(did: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) return;

    // Remove friend relationship
    for (const [id, request] of this.friends.entries()) {
      if (
        request.status === 'accepted' &&
        ((request.requesterId === identity.did && request.addresseeId === did) ||
          (request.addresseeId === identity.did && request.requesterId === did))
      ) {
        this.friends.delete(id);
        break;
      }
    }

    // Unfollow
    await this.unfollow(did);
  }

  // ============================================
  // CIRCLES
  // ============================================

  async createCircle(name: string, options: CircleOptions = {}): Promise<Circle> {
    const identity = this.sdk.getIdentity();
    if (!identity) throw new Error('Identity not initialized');

    const circle: Circle = {
      id: generateId(),
      ownerId: identity.did,
      name,
      description: options.description,
      isPublic: options.isPublic ?? false,
      memberCount: 1,
      createdAt: Date.now(),
    };

    this.circles.set(circle.id, circle);
    
    // Add owner as member
    this.circleMembers.set(circle.id, new Map());
    this.circleMembers.get(circle.id)!.set(identity.did, {
      circleId: circle.id,
      userId: identity.did,
      role: 'owner',
      joinedAt: Date.now(),
    });

    // Add initial members
    if (options.members) {
      for (const did of options.members) {
        await this.addCircleMember(circle.id, did);
      }
    }

    await this.sendMessage('circle_create', { circleId: circle.id, name });

    return circle;
  }

  async getCircle(circleId: string): Promise<Circle> {
    const circle = this.circles.get(circleId);
    if (!circle) throw new Error('Circle not found');
    return circle;
  }

  async updateCircle(circleId: string, updates: Partial<Circle>): Promise<void> {
    const circle = await this.getCircle(circleId);
    const identity = this.sdk.getIdentity();
    
    if (!identity || circle.ownerId !== identity.did) {
      throw new Error('Not authorized to update this circle');
    }

    Object.assign(circle, updates);
    
    await this.sendMessage('circle_update', { circleId, updates });
  }

  async deleteCircle(circleId: string): Promise<void> {
    const circle = await this.getCircle(circleId);
    const identity = this.sdk.getIdentity();
    
    if (!identity || circle.ownerId !== identity.did) {
      throw new Error('Not authorized to delete this circle');
    }

    this.circles.delete(circleId);
    this.circleMembers.delete(circleId);
    
    await this.sendMessage('circle_delete', { circleId });
  }

  async addCircleMember(circleId: string, did: string): Promise<void> {
    const circle = await this.getCircle(circleId);
    
    if (!this.circleMembers.has(circleId)) {
      this.circleMembers.set(circleId, new Map());
    }

    if (!this.circleMembers.get(circleId)!.has(did)) {
      this.circleMembers.get(circleId)!.set(did, {
        circleId,
        userId: did,
        role: 'member',
        joinedAt: Date.now(),
      });
      circle.memberCount++;
    }
    
    await this.sendMessage('circle_member_add', { circleId, did });
  }

  async removeCircleMember(circleId: string, did: string): Promise<void> {
    const circle = await this.getCircle(circleId);
    const identity = this.sdk.getIdentity();
    
    if (!identity || circle.ownerId !== identity.did) {
      throw new Error('Not authorized to remove members');
    }

    if (this.circleMembers.get(circleId)?.has(did)) {
      this.circleMembers.get(circleId)!.delete(did);
      circle.memberCount--;
    }
    
    await this.sendMessage('circle_member_remove', { circleId, did });
  }

  async getCircleMembers(circleId: string): Promise<CircleMember[]> {
    return Array.from(this.circleMembers.get(circleId)?.values() || []);
  }

  async getUserCircles(): Promise<Circle[]> {
    const identity = this.sdk.getIdentity();
    if (!identity) return [];

    return Array.from(this.circles.values()).filter(c => 
      c.ownerId === identity.did ||
      this.circleMembers.get(c.id)?.has(identity.did)
    );
  }

  // ============================================
  // BLOCKING
  // ============================================

  async block(did: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) return;

    this.blocked.add(did);
    await this.unfollow(did);
    
    await this.sendMessage('block', { did });
  }

  async unblock(did: string): Promise<void> {
    this.blocked.delete(did);
    
    await this.sendMessage('unblock', { did });
  }

  async getBlocked(): Promise<string[]> {
    return Array.from(this.blocked);
  }

  async isBlocked(did: string): Promise<boolean> {
    return this.blocked.has(did);
  }

  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
