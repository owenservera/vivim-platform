/**
 * Content Node - API Node for content management
 * Enhanced with Communication Protocol
 */

import type { VivimSDK } from '../core/sdk.js';
import { calculateCID, generateId } from '../utils/crypto.js';
import {
  CommunicationProtocol,
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * Content type
 */
export type ContentType = 'post' | 'image' | 'video' | 'audio' | 'gallery' | 'article' | 'acu' | 'memory' | 'conversation';

/**
 * Content object
 */
export interface ContentObject {
  cid: string;
  id: string;
  type: ContentType;
  author: string;
  signature: string;
  timestamp: number;
  visibility: 'public' | 'circle' | 'friends' | 'private';
  text?: string;
  media?: MediaMetadata;
  tags: string[];
  interactions: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
}

/**
 * Media metadata
 */
export interface MediaMetadata {
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnails: Thumbnail[];
}

/**
 * Thumbnail
 */
export interface Thumbnail {
  cid: string;
  width: number;
  height: number;
  quality: 'low' | 'medium' | 'high';
}

/**
 * Content options
 */
export interface ContentOptions {
  visibility?: 'public' | 'circle' | 'friends' | 'private';
  circleIds?: string[];
  tags?: string[];
  encryption?: boolean;
}

/**
 * Feed options
 */
export interface FeedOptions {
  type?: 'following' | 'discover' | 'trending' | 'circle';
  circleId?: string;
  cursor?: string;
  limit?: number;
}

/**
 * Search query
 */
export interface SearchQuery {
  text?: string;
  tags?: string[];
  type?: ContentType[];
  author?: string;
  dateRange?: { from: number; to: number };
}

/**
 * Share options
 */
export interface ShareOptions {
  type: 'repost' | 'quote';
  text?: string;
  visibility?: 'public' | 'circle' | 'friends';
}

/**
 * Visibility settings
 */
export interface VisibilitySettings {
  level: 'public' | 'circle' | 'friends' | 'private';
  circles: string[];
  expiresAt: number | null;
}

/**
 * Content Node API
 */
export interface ContentNodeAPI {
  // CRUD
  create(type: ContentType, data: ContentData, options?: ContentOptions): Promise<ContentObject>;
  get(cid: string): Promise<ContentObject>;
  update(cid: string, updates: Partial<ContentData>): Promise<ContentObject>;
  delete(cid: string): Promise<void>;

  // Discovery
  getFeed(options?: FeedOptions): Promise<ContentObject[]>;
  search(query: SearchQuery): Promise<ContentObject[]>;
  getByAuthor(did: string, options?: PaginationOptions): Promise<ContentObject[]>;

  // Interactions
  like(cid: string): Promise<void>;
  unlike(cid: string): Promise<void>;
  comment(cid: string, text: string): Promise<ContentObject>;
  share(cid: string, options: ShareOptions): Promise<ContentObject>;

  // Visibility
  setVisibility(cid: string, visibility: VisibilitySettings): Promise<void>;
  getVisibility(cid: string): Promise<VisibilitySettings>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

export interface ContentData {
  text?: string;
  media?: MediaMetadata;
  tags?: string[];
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

/**
 * Content communication message types
 */
export type ContentMessageType =
  | 'content_create'
  | 'content_get'
  | 'content_update'
  | 'content_delete'
  | 'content_feed'
  | 'content_search'
  | 'content_like'
  | 'content_share';

/**
 * Content Node Implementation
 */
export class ContentNode implements ContentNodeAPI {
  private content: Map<string, ContentObject> = new Map();
  private visibility: Map<string, VisibilitySettings> = new Map();
  private likes: Map<string, Set<string>> = new Map();
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('content-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[ContentNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[ContentNode] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  getNodeId(): string {
    return 'content-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'content-node',
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
      this.communication.emitEvent({
        type: 'message_error',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
        error: String(error),
      });
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
      await this.communication.executeHooks('after_receive', final);
      
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
      this.communication.emitEvent({
        type: 'message_error',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
        error: String(error),
      });
      throw error;
    }
  }

  private async handleMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const { header, payload } = envelope;

    switch (header.type) {
      case 'content_get':
        try {
          const content = await this.get((payload as { cid: string }).cid);
          return this.communication.createResponse(envelope, { content });
        } catch (error) {
          return this.communication.createResponse(envelope, { error: String(error) });
        }

      case 'content_feed':
        const feed = await this.getFeed(payload as FeedOptions);
        return this.communication.createResponse(envelope, { feed });

      case 'content_search':
        const results = await this.search(payload as SearchQuery);
        return this.communication.createResponse(envelope, { results });

      case 'content_like':
        await this.like((payload as { cid: string }).cid);
        return this.communication.createResponse(envelope, { success: true });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  async create(type: ContentType, data: ContentData, options: ContentOptions = {}): Promise<ContentObject> {
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }

    const id = generateId();
    const timestamp = Date.now();
    const visibilityLevel = options.visibility || 'private';

    const content: ContentObject = {
      cid: await calculateCID({ type, data, author: identity.did, timestamp }),
      id,
      type,
      author: identity.did,
      signature: await this.sdk.sign({ type, data, timestamp }),
      timestamp,
      visibility: visibilityLevel,
      text: data.text,
      media: data.media,
      tags: data.tags || [],
      interactions: {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      },
    };

    this.content.set(content.cid, content);
    this.visibility.set(content.cid, {
      level: visibilityLevel,
      circles: options.circleIds || [],
      expiresAt: null,
    });

    // Send creation event
    await this.sendMessage('content_create', { cid: content.cid, type });

    return content;
  }

  async get(cid: string): Promise<ContentObject> {
    const content = this.content.get(cid);
    if (!content) {
      throw new Error(`Content not found: ${cid}`);
    }
    return content;
  }

  async update(cid: string, updates: Partial<ContentData>): Promise<ContentObject> {
    const content = await this.get(cid);
    const identity = this.sdk.getIdentity();
    
    if (!identity || content.author !== identity.did) {
      throw new Error('Not authorized to update this content');
    }

    const updated = {
      ...content,
      text: updates.text ?? content.text,
      media: updates.media ?? content.media,
      tags: updates.tags ?? content.tags,
      timestamp: Date.now(),
    };

    this.content.set(cid, updated);
    
    await this.sendMessage('content_update', { cid, updates });

    return updated;
  }

  async delete(cid: string): Promise<void> {
    const content = await this.get(cid);
    const identity = this.sdk.getIdentity();
    
    if (!identity || content.author !== identity.did) {
      throw new Error('Not authorized to delete this content');
    }

    this.content.delete(cid);
    this.visibility.delete(cid);
    
    await this.sendMessage('content_delete', { cid });
  }

  async getFeed(options: FeedOptions = {}): Promise<ContentObject[]> {
    const limit = options.limit || 20;
    const all = Array.from(this.content.values());
    
    // Filter by visibility
    const visible = all.filter(c => c.visibility === 'public');
    
    // Sort by timestamp
    visible.sort((a, b) => b.timestamp - a.timestamp);
    
    return visible.slice(0, limit);
  }

  async search(query: SearchQuery): Promise<ContentObject[]> {
    let results = Array.from(this.content.values());

    if (query.text) {
      const text = query.text.toLowerCase();
      results = results.filter(c => 
        c.text?.toLowerCase().includes(text) ||
        c.tags.some(t => t.toLowerCase().includes(text))
      );
    }

    if (query.author) {
      results = results.filter(c => c.author === query.author);
    }

    if (query.type && query.type.length > 0) {
      results = results.filter(c => query.type!.includes(c.type));
    }

    await this.sendMessage('content_search', { query });

    return results;
  }

  async getByAuthor(did: string, options: PaginationOptions = {}): Promise<ContentObject[]> {
    const limit = options.limit || 20;
    const all = Array.from(this.content.values());
    
    return all
      .filter(c => c.author === did)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async like(cid: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) return;

    if (!this.likes.has(cid)) {
      this.likes.set(cid, new Set());
    }
    
    const likers = this.likes.get(cid)!;
    if (!likers.has(identity.did)) {
      likers.add(identity.did);
      const content = this.content.get(cid);
      if (content) {
        content.interactions.likes++;
      }
      
      await this.sendMessage('content_like', { cid, action: 'like' });
    }
  }

  async unlike(cid: string): Promise<void> {
    const identity = this.sdk.getIdentity();
    if (!identity) return;

    const likers = this.likes.get(cid);
    if (likers?.has(identity.did)) {
      likers.delete(identity.did);
      const content = this.content.get(cid);
      if (content) {
        content.interactions.likes = Math.max(0, content.interactions.likes - 1);
      }
    }
  }

  async comment(cid: string, text: string): Promise<ContentObject> {
    const content = this.content.get(cid);
    if (content) {
      content.interactions.comments++;
    }
    
    return this.create('post', { text }, { visibility: 'public' });
  }

  async share(cid: string, options: ShareOptions): Promise<ContentObject> {
    const original = await this.get(cid);
    
    if (original) {
      original.interactions.shares++;
    }

    await this.sendMessage('content_share', { cid, type: options.type });

    return this.create('post', {
      text: options.type === 'quote' ? options.text : undefined,
      tags: ['repost', original.id],
    }, { visibility: options.visibility || 'public' });
  }

  async setVisibility(cid: string, visibility: VisibilitySettings): Promise<void> {
    const content = await this.get(cid);
    const identity = this.sdk.getIdentity();
    
    if (!identity || content.author !== identity.did) {
      throw new Error('Not authorized to change visibility');
    }

    this.visibility.set(cid, visibility);
    content.visibility = visibility.level;
  }

  async getVisibility(cid: string): Promise<VisibilitySettings> {
    const visibility = this.visibility.get(cid);
    if (!visibility) {
      return { level: 'private', circles: [], expiresAt: null };
    }
    return visibility;
  }

  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
