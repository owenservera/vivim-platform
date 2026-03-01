/**
 * Federation Server Node - SDK Node for handling incoming federation requests
 * Enables receiving federated activities from other VIVIM instances
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';
import type { FederationMessage, InstanceInfo } from './federation-client-node.js';

/**
 * Federation Server configuration
 */
export interface FederationServerConfig {
  /** Server port */
  port?: number;
  /** Instance DID */
  did: string;
  /** Instance URL */
  instanceUrl: string;
  /** Enable well-known endpoint */
  enableWellKnown?: boolean;
  /** Enable ActivityPub compatibility */
  enableActivityPub?: boolean;
  /** Verify incoming signatures */
  verifySignatures?: boolean;
  /** Allowed instance domains (whitelist) */
  allowedInstances?: string[];
  /** Blocked instance domains (blacklist) */
  blockedInstances?: string[];
}

/**
 * Actor profile
 */
export interface ActorProfile {
  /** Actor ID */
  id: string;
  /** Actor type */
  type: 'Person' | 'Application' | 'Service';
  /** Username */
  preferredUsername: string;
  /** Profile URL */
  url: string;
  /** Inbox URL */
  inbox: string;
  /** Outbox URL */
  outbox: string;
  /** Public key */
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
}

/**
 * ActivityStreams context
 */
export interface ActivityStreamsContext {
  '@context': string | string[];
  id: string;
  type: string;
  [key: string]: unknown;
}

/**
 * Federation Server events
 */
export interface FederationServerEvents {
  /** Message received */
  'message:received': FederationMessage;
  /** Content received */
  'content:received': FederationMessage;
  /** Follow activity received */
  'user:follow': FederationMessage;
  /** Unfollow activity received */
  'user:unfollow': FederationMessage;
  /** Circle invite received */
  'circle:invite': FederationMessage;
  /** Sync request received */
  'sync:requested': FederationMessage;
  /** Sync response received */
  'sync:responded': FederationMessage;
  /** Server error */
  'server:error': { error: Error };
}

/**
 * Federation Server API
 */
export interface FederationServerAPI {
  // Server lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
  
  // Message handling
  processMessage(message: FederationMessage): Promise<void>;
  validateMessage(message: FederationMessage): Promise<boolean>;
  
  // Actor management
  getActorProfile(did: string): ActorProfile;
  getOutbox(): ActivityStreamsContext;
  getInbox(): ActivityStreamsContext;
  
  // Instance management
  getInstanceInfo(): InstanceInfo;
  isInstanceAllowed(domain: string): boolean;
  isInstanceBlocked(domain: string): boolean;
  allowInstance(domain: string): void;
  blockInstance(domain: string): void;
  
  // Well-known
  getWellKnown(): Record<string, unknown>;
  
  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Activity types
 */
export type FederationActivityType =
  | 'Follow'
  | 'Unfollow'
  | 'Block'
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'Like'
  | 'Announce'
  | 'Share'
  | 'Invite';

/**
 * Federation Server Implementation
 * 
 * Note: This is a lightweight SDK implementation.
 * For full HTTP server functionality, use with Bun/Node.js HTTP server.
 */
export class FederationServer implements FederationServerAPI {
  private config: Required<FederationServerConfig>;
  private running = false;
  private messageQueue: FederationMessage[] = [];
  private allowedInstances: Set<string> = new Set();
  private blockedInstances: Set<string> = new Set();
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(
    private sdk: VivimSDK,
    config: FederationServerConfig
  ) {
    this.config = {
      port: 3000,
      enableWellKnown: true,
      enableActivityPub: true,
      verifySignatures: true,
      allowedInstances: [],
      blockedInstances: [],
      ...config,
    };

    this.communication = createCommunicationProtocol('federation-server');
    this.setupEventListeners();

    // Initialize allowed/blocked instances
    if (this.config.allowedInstances) {
      this.config.allowedInstances.forEach(d => this.allowedInstances.add(d));
    }
    if (this.config.blockedInstances) {
      this.config.blockedInstances.forEach(d => this.blockedInstances.add(d));
    }
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[FederationServer] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[FederationServer] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  /**
   * Start federation server
   * 
   * Note: In a real implementation, this would start an HTTP server.
   * For SDK purposes, we're providing the message handling logic.
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Server is already running');
    }

    console.log(`[FederationServer] Starting federation server for ${this.config.instanceUrl}`);
    this.running = true;
    this.emit('server:error', { error: new Error('Server started - HTTP implementation required') });
  }

  /**
   * Stop federation server
   */
  async stop(): Promise<void> {
    if (!this.running) return;

    console.log('[FederationServer] Stopping federation server');
    this.running = false;
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Process incoming federation message
   */
  async processMessage(message: FederationMessage): Promise<void> {
    // Validate message
    const isValid = await this.validateMessage(message);
    if (!isValid) {
      throw new Error('Invalid federation message');
    }

    // Check instance permissions
    const sourceDomain = this.extractDomain(message.sourcePDS);
    if (this.isInstanceBlocked(sourceDomain)) {
      console.warn(`[FederationServer] Blocked instance: ${sourceDomain}`);
      throw new Error('Instance is blocked');
    }

    if (!this.isInstanceAllowed(sourceDomain) && this.config.allowedInstances.length > 0) {
      console.warn(`[FederationServer] Unallowed instance: ${sourceDomain}`);
      throw new Error('Instance is not allowed');
    }

    // Process by message type
    switch (message.type) {
      case 'content.push':
        await this.handleContentPush(message);
        break;
      case 'follow':
        await this.handleFollow(message);
        break;
      case 'unfollow':
        await this.handleUnfollow(message);
        break;
      case 'circle.invite':
        await this.handleCircleInvite(message);
        break;
      case 'sync.request':
        await this.handleSyncRequest(message);
        break;
      case 'sync.response':
        await this.handleSyncResponse(message);
        break;
      default:
        console.warn(`[FederationServer] Unknown message type: ${message.type}`);
    }

    this.emit('message:received', message);
  }

  /**
   * Validate federation message
   */
  async validateMessage(message: FederationMessage): Promise<boolean> {
    // Check required fields
    if (!message.id || !message.type || !message.sourceDID) {
      console.warn('[FederationServer] Missing required fields');
      return false;
    }

    // Check timestamp (reject messages older than 24 hours)
    const maxAge = 24 * 60 * 60 * 1000;
    if (Date.now() - message.timestamp > maxAge) {
      console.warn('[FederationServer] Message too old');
      return false;
    }

    // Verify signature if enabled and present
    if (this.config.verifySignatures && message.signature) {
      try {
        const isValid = await this.verifySignature(message, message.signature);
        if (!isValid) {
          console.warn('[FederationServer] Invalid signature');
          return false;
        }
      } catch (error) {
        console.error('[FederationServer] Signature verification failed:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Verify message signature
   */
  private async verifySignature(
    message: FederationMessage,
    signature: string
  ): Promise<boolean> {
    try {
      const data = JSON.stringify({
        type: message.type,
        sourceDID: message.sourceDID,
        timestamp: message.timestamp,
        payload: message.payload,
      });

      // Use SDK verify if available
      const identity = await this.sdk.getIdentity();
      if (identity) {
        const isValid = await this.sdk.verify(
          new TextEncoder().encode(data),
          signature,
          message.sourceDID
        );
        return isValid;
      }
    } catch (error) {
      console.warn('[FederationServer] Signature verification failed, accepting by default');
    }

    // If we can't verify, accept by default (configurable)
    return !this.config.verifySignatures;
  }

  /**
   * Handle content push
   */
  private async handleContentPush(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Content push: ${(message.payload as any).contentId}`);
    this.emit('content:received', message);
  }

  /**
   * Handle follow activity
   */
  private async handleFollow(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Follow: ${(message.payload as any).userDid}`);
    this.emit('user:follow', message);
  }

  /**
   * Handle unfollow activity
   */
  private async handleUnfollow(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Unfollow: ${(message.payload as any).userDid}`);
    this.emit('user:unfollow', message);
  }

  /**
   * Handle circle invite
   */
  private async handleCircleInvite(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Circle invite: ${(message.payload as any).circleId}`);
    this.emit('circle:invite', message);
  }

  /**
   * Handle sync request
   */
  private async handleSyncRequest(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Sync request from: ${message.sourceDID}`);
    this.emit('sync:requested', message);
  }

  /**
   * Handle sync response
   */
  private async handleSyncResponse(message: FederationMessage): Promise<void> {
    console.log(`[FederationServer] Sync response from: ${message.sourceDID}`);
    this.emit('sync:responded', message);
  }

  /**
   * Get actor profile
   */
  getActorProfile(did: string): ActorProfile {
    const instanceUrl = this.config.instanceUrl;
    return {
      id: `${instanceUrl}/actor/${did}`,
      type: 'Person',
      preferredUsername: did,
      url: `${instanceUrl}/profile/${did}`,
      inbox: `${instanceUrl}/inbox`,
      outbox: `${instanceUrl}/outbox`,
    };
  }

  /**
   * Get outbox
   */
  getOutbox(): ActivityStreamsContext {
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.config.instanceUrl}/outbox`,
      type: 'OrderedCollection',
      totalItems: 0,
      orderedItems: [],
    };
  }

  /**
   * Get inbox
   */
  getInbox(): ActivityStreamsContext {
    return {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${this.config.instanceUrl}/inbox`,
      type: 'OrderedCollection',
      totalItems: 0,
      orderedItems: [],
    };
  }

  /**
   * Get instance info
   */
  getInstanceInfo(): InstanceInfo {
    const domain = this.extractDomain(this.config.instanceUrl);
    return {
      domain,
      instanceUrl: this.config.instanceUrl,
      status: this.running ? 'active' : 'offline',
      trustLevel: 3,
      software: 'vivim-sdk',
      version: '1.0.0',
      protocols: ['vivim/v1', 'activitypub'],
      features: ['federation', 'circles', 'content'],
      lastSeen: Date.now(),
    };
  }

  /**
   * Get well-known response
   */
  getWellKnown(): Record<string, unknown> {
    const domain = this.extractDomain(this.config.instanceUrl);
    return {
      domain,
      did: this.config.did,
      instanceUrl: this.config.instanceUrl,
      services: {
        pds: this.config.instanceUrl,
      },
      protocols: ['vivim/v1'],
      features: ['circles', 'content', 'federation'],
      software: {
        name: 'vivim-sdk',
        version: '1.0.0',
      },
    };
  }

  /**
   * Check if instance is allowed
   */
  isInstanceAllowed(domain: string): boolean {
    if (this.allowedInstances.size === 0) return true;
    return this.allowedInstances.has(domain);
  }

  /**
   * Check if instance is blocked
   */
  isInstanceBlocked(domain: string): boolean {
    return this.blockedInstances.has(domain);
  }

  /**
   * Allow instance
   */
  allowInstance(domain: string): void {
    this.allowedInstances.add(domain);
    this.blockedInstances.delete(domain);
  }

  /**
   * Block instance
   */
  blockInstance(domain: string): void {
    this.blockedInstances.add(domain);
    this.allowedInstances.delete(domain);
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return url;
    }
  }

  /**
   * Emit event (internal)
   */
  private emit<K extends keyof FederationServerEvents>(
    event: K,
    data: FederationServerEvents[K]
  ): void {
    console.log(`[FederationServer] Event: ${event}`, data);
  }

  // Communication Protocol Methods

  getNodeId(): string {
    return 'federation-server';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics();
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('message_received', listener as any);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    return this.communication.sendMessage(type, payload);
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    return this.communication.processMessage(envelope);
  }
}

/**
 * Create Federation Server instance
 */
export function createFederationServer(
  sdk: VivimSDK,
  config: FederationServerConfig
): FederationServer {
  return new FederationServer(sdk, config);
}
