/**
 * VIVIM SDK - Social Transport Layer
 * 
 * Transport interface for social networking: direct messages, circles, and feeds
 * @see docs/SOCIAL_TRANSPORT_LAYER.md
 */

import { EventEmitter } from 'events';
import type {
  TransportProtocol,
  PeerId,
  TransportMessage,
} from './types.js';
import { createTransportMessage, serializeMessage } from './base-transport.js';

/**
 * DID (Decentralized Identifier)
 */
export type DID = string;

/**
 * Social message types
 */
export type SocialMessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'tool_call'
  | 'tool_result'
  | 'ai_response'
  | 'system';

/**
 * Feed event types
 */
export type FeedEventType = 
  | 'post_created'
  | 'post_updated'
  | 'post_deleted'
  | 'reaction_added'
  | 'follow'
  | 'unfollow'
  | 'circle_created'
  | 'circle_updated';

/**
 * Encrypted content
 */
export interface EncryptedContent {
  algorithm: 'aes-256-gcm' | 'x25519';
  ciphertext: string;
  nonce: string;
  ephemeralPublicKey?: string;
}

/**
 * Attachment
 */
export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  mimeType: string;
  size: number;
  thumbnail?: string;
}

/**
 * Reaction
 */
export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: number;
}

/**
 * Social Message
 */
export interface SocialMessage {
  id: string;
  type: SocialMessageType;
  sender: DID;
  recipients: DID[];
  content: string | EncryptedContent;
  timestamp: number;
  threadId?: string;
  replyTo?: string;
  attachments?: Attachment[];
  reactions?: Reaction[];
  metadata?: Record<string, unknown>;
}

/**
 * Feed Event
 */
export interface FeedEvent {
  id: string;
  type: FeedEventType;
  actor: DID;
  target?: string;
  object: unknown;
  timestamp: number;
  circles?: string[];
  tags?: string[];
}

/**
 * Social Graph Sync
 */
export interface SocialGraphSync {
  version: number;
  follows: DID[];
  followers: DID[];
  circles: string[];
  blocked: DID[];
  muted: DID[];
  timestamp: number;
}

/**
 * Social Transport Events
 */
export interface SocialTransportEvents {
  'message': { message: SocialMessage };
  'feed': { event: FeedEvent };
  'sync': { peerId: DID; sync: SocialGraphSync };
  'typing': { userId: DID; threadId: string };
  'read': { userId: DID; messageIds: string[] };
}

/**
 * Social Transport Interface
 * 
 * Handles social networking messages: direct messages, circle broadcasts, 
 * feed distribution, and social graph synchronization.
 */
export interface SocialTransport extends EventEmitter {
  /** Unique transport identifier */
  readonly type: 'social';
  
  /** Whether transport is active */
  readonly isActive: boolean;
  
  /** Local DID */
  readonly localDID?: DID;
  
  // ============== Direct Messages ==============
  
  /**
   * Send a direct message to a recipient
   */
  sendDirectMessage(recipient: DID, message: SocialMessage): Promise<void>;
  
  // ============== Circle Broadcasts ==============
  
  /**
   * Broadcast a message to all circle members
   */
  broadcastToCircle(circleId: string, message: SocialMessage): Promise<void>;
  
  // ============== Feed Distribution ==============
  
  /**
   * Publish an event to the feed
   */
  publishFeedEvent(event: FeedEvent): Promise<void>;
  
  // ============== Sync ==============
  
  /**
   * Synchronize social graph with a peer
   */
  syncSocialGraph(peerId: DID): Promise<SocialGraphSync>;
  
  // ============== Presence ==============
  
  /**
   * Send typing indicator
   */
  sendTypingIndicator(threadId: string): Promise<void>;
  
  /**
   * Send read receipt
   */
  sendReadReceipt(messageIds: string[]): Promise<void>;
  
  // ============== Lifecycle ==============
  
  /**
   * Start the transport
   */
  start(): Promise<void>;
  
  /**
   * Stop the transport
   */
  stop(): Promise<void>;
}

/**
 * Base Social Transport
 * 
 * Abstract base class for social transport implementations.
 */
export abstract class BaseSocialTransport extends EventEmitter implements SocialTransport {
  abstract readonly type: 'social';

  
  protected _isActive = false;
  protected _localDID?: DID;
  
  get isActive(): boolean {
    return this._isActive;
  }
  
  get localDID(): DID | undefined {
    return this._localDID;
  }
  
  // Abstract methods
  abstract sendDirectMessage(recipient: DID, message: SocialMessage): Promise<void>;
  abstract broadcastToCircle(circleId: string, message: SocialMessage): Promise<void>;
  abstract publishFeedEvent(event: FeedEvent): Promise<void>;
  abstract syncSocialGraph(peerId: DID): Promise<SocialGraphSync>;
  abstract sendTypingIndicator(threadId: string): Promise<void>;
  abstract sendReadReceipt(messageIds: string[]): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  
  /**
   * Emit a message event
   */
  protected emitMessage(message: SocialMessage): void {
    this.emit('message', { message });
  }
  
  /**
   * Emit a feed event
   */
  protected emitFeedEvent(event: FeedEvent): void {
    this.emit('feed', { event });
  }
}

/**
 * Social Transport Adapter
 * 
 * Adapts a generic TransportProtocol to work as a SocialTransport.
 */
export class SocialTransportAdapter extends BaseSocialTransport {
  readonly type = 'social' as const;
  
  private transport: TransportProtocol;
  private circles: Map<string, Set<DID>> = new Map();
  private feedTopics: Map<string, Set<DID>> = new Map();
  
  constructor(transport: TransportProtocol, localDID?: DID) {
    super();
    this.transport = transport;
    this._localDID = localDID;
    
    // Forward messages from underlying transport
    transport.on('message', ({ message }) => {
      this.handleIncomingMessage(message);
    });
  }
  
  private handleIncomingMessage(message: TransportMessage): void {
    try {
      const payload = typeof message.payload === 'string'
        ? JSON.parse(message.payload)
        : message.payload;
      
      if (payload.type === 'social:message') {
        this.emitMessage(payload.message as SocialMessage);
      } else if (payload.type === 'social:feed') {
        this.emitFeedEvent(payload.event as FeedEvent);
      }
    } catch (error) {
      console.error('Failed to handle incoming message:', error);
    }
  }
  
  async sendDirectMessage(recipient: DID, message: SocialMessage): Promise<void> {
    const transportMessage = createTransportMessage(
      'social:message',
      serializeMessage({
        type: 'social:message',
        message,
        recipients: [recipient],
      }),
      { 
        recipient,
        messageType: 'direct',
      }
    );
    
    await this.transport.send(transportMessage);
  }
  
  async broadcastToCircle(circleId: string, message: SocialMessage): Promise<void> {
    const transportMessage = createTransportMessage(
      'social:message',
      serializeMessage({
        type: 'social:message',
        message,
        circleId,
      }),
      {
        circleId,
        messageType: 'circle',
      }
    );
    
    // Broadcast to circle topic
    await this.transport.broadcast(`/vivim/circle/${circleId}`, transportMessage);
  }
  
  async publishFeedEvent(event: FeedEvent): Promise<void> {
    const transportMessage = createTransportMessage(
      'social:feed',
      serializeMessage({
        type: 'social:feed',
        event,
      }),
      { feed: true }
    );
    
    // Broadcast to feed topic
    await this.transport.broadcast('/vivim/feed', transportMessage);
  }
  
  async syncSocialGraph(peerId: DID): Promise<SocialGraphSync> {
    // Request social graph sync from peer
    const transportMessage = createTransportMessage(
      'social:sync:request',
      serializeMessage({
        type: 'social:sync:request',
        from: this._localDID,
        version: Date.now(),
      }),
      { peerId }
    );
    
    // In a real implementation, this would wait for a response
    // For now, return empty sync
    return {
      version: 0,
      follows: [],
      followers: [],
      circles: [],
      blocked: [],
      muted: [],
      timestamp: Date.now(),
    };
  }
  
  async sendTypingIndicator(threadId: string): Promise<void> {
    const transportMessage = createTransportMessage(
      'social:typing',
      serializeMessage({
        type: 'social:typing',
        userId: this._localDID,
        threadId,
        timestamp: Date.now(),
      })
    );
    
    // Would broadcast to thread participants
    await this.transport.broadcast(`/vivim/thread/${threadId}`, transportMessage);
  }
  
  async sendReadReceipt(messageIds: string[]): Promise<void> {
    const transportMessage = createTransportMessage(
      'social:read',
      serializeMessage({
        type: 'social:read',
        userId: this._localDID,
        messageIds,
        timestamp: Date.now(),
      })
    );
    
    // Would send to message recipients
    await this.transport.send(transportMessage);
  }
  
  async start(): Promise<void> {
    await this.transport.start();
    this._isActive = true;
  }
  
  async stop(): Promise<void> {
    await this.transport.stop();
    this._isActive = false;
  }
  
  /**
   * Register a circle
   */
  registerCircle(circleId: string, members: DID[]): void {
    this.circles.set(circleId, new Set(members));
  }
  
  /**
   * Subscribe to a feed
   */
  subscribeToFeed(feedId: string): void {
    if (!this.feedTopics.has(feedId)) {
      this.feedTopics.set(feedId, new Set());
    }
  }
}

/**
 * Create Social Transport from generic transport
 */
export function createSocialTransport(
  transport: TransportProtocol,
  localDID?: DID
): SocialTransport {
  return new SocialTransportAdapter(transport, localDID);
}
