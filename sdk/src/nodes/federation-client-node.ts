/**
 * Federation Client Node - SDK Node for cross-instance federation
 * Enables decentralized communication between VIVIM instances
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
  type CommunicationHook,
} from '../core/communication.js';

/**
 * Federation configuration
 */
export interface FederationConfig {
  /** Home instance URL */
  instanceUrl: string;
  /** User DID */
  did?: string;
  /** Signing key (private) */
  signKey?: Uint8Array;
  /** Verification key (public) */
  verifyKey?: Uint8Array;
  /** Auto-process message queue */
  autoProcessQueue?: boolean;
  /** Max queue size */
  maxQueueSize?: number;
}

/**
 * Federation message structure
 */
export interface FederationMessage {
  /** Unique message ID */
  id: string;
  /** Message type (activity type) */
  type: string;
  /** Source instance (PDS) */
  sourcePDS: string;
  /** Source DID */
  sourceDID: string;
  /** Target instance (optional) */
  targetPDS?: string;
  /** Message payload */
  payload: unknown;
  /** Timestamp */
  timestamp: number;
  /** Cryptographic signature */
  signature?: string;
}

/**
 * Instance information
 */
export interface InstanceInfo {
  /** Instance domain */
  domain: string;
  /** Instance URL */
  instanceUrl: string;
  /** Personal data server URL */
  pdsUrl?: string;
  /** Relay URL */
  relayUrl?: string;
  /** Software name */
  software?: string;
  /** Software version */
  version?: string;
  /** Supported features */
  features?: string[];
  /** Supported protocols */
  protocols?: string[];
  /** Instance status */
  status: 'active' | 'offline' | 'unknown';
  /** Trust level */
  trustLevel: number;
  /** Last seen timestamp */
  lastSeen?: number;
}

/**
 * Sync request options
 */
export interface SyncRequestOptions {
  /** Sync from timestamp */
  since: number;
  /** Entity types to sync */
  entityTypes?: string[];
  /** Limit results */
  limit?: number;
}

/**
 * Content push options
 */
export interface ContentPushOptions {
  /** Content ID */
  contentId: string;
  /** Content data */
  content: unknown;
  /** Content type */
  contentType?: string;
  /** Visibility */
  visibility?: 'public' | 'private' | 'shared';
}

/**
 * Circle invite options
 */
export interface CircleInviteOptions {
  /** Circle ID */
  circleId: string;
  /** User DID to invite */
  userDid: string;
  /** Inviter DID */
  inviterDid: string;
  /** Message (optional) */
  message?: string;
}

/**
 * Federation client events
 */
export interface FederationEvents {
  /** Message sent successfully */
  'message:sent': FederationMessage;
  /** Message failed to send */
  'message:failed': { message: FederationMessage; error: Error };
  /** Message received from remote instance */
  'message:received': FederationMessage;
  /** Sync completed */
  'sync:completed': { instance: string; count: number };
  /** Sync failed */
  'sync:failed': { instance: string; error: Error };
  /** Instance discovered */
  'instance:discovered': InstanceInfo;
  /** Instance status changed */
  'instance:status': { domain: string; status: 'active' | 'offline' };
}

/**
 * Federation Client API
 */
export interface FederationClientAPI {
  // Core federation
  sendActivity(targetInstance: string, activityType: string, payload: unknown): Promise<void>;
  requestSync(targetInstance: string, options: SyncRequestOptions): Promise<void>;
  pushContent(targetInstance: string, options: ContentPushOptions): Promise<void>;
  
  // Social federation
  inviteToCircle(targetInstance: string, options: CircleInviteOptions): Promise<void>;
  followUser(targetInstance: string, userDid: string): Promise<void>;
  unfollowUser(targetInstance: string, userDid: string): Promise<void>;
  
  // Message management
  getQueueSize(): number;
  processQueue(): Promise<void>;
  clearQueue(): void;
  
  // Instance management
  discoverInstance(domain: string): Promise<InstanceInfo>;
  getInstanceInfo(domain: string): InstanceInfo | null;
  getAllInstances(): InstanceInfo[];
  updateInstanceStatus(domain: string, status: 'active' | 'offline'): void;
  
  // Security
  signMessage(message: FederationMessage): Promise<string>;
  verifySignature(message: FederationMessage, signature: string): Promise<boolean>;
  
  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * Activity types for federation
 */
export type ActivityType =
  | 'follow'
  | 'unfollow'
  | 'block'
  | 'unblock'
  | 'create'
  | 'update'
  | 'delete'
  | 'like'
  | 'unlike'
  | 'comment'
  | 'share'
  | 'circle.invite'
  | 'circle.join'
  | 'circle.leave'
  | 'content.push'
  | 'sync.request'
  | 'sync.response';

/**
 * Federation Client Node Implementation
 */
export class FederationClient implements FederationClientAPI {
  private config: FederationConfig;
  private messageQueue: FederationMessage[] = [];
  private processing = false;
  private instances: Map<string, InstanceInfo> = new Map();
  private communication: ReturnType<typeof createCommunicationProtocol>;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK, config: FederationConfig) {
    this.config = {
      autoProcessQueue: true,
      maxQueueSize: 1000,
      ...config,
    };
    this.communication = createCommunicationProtocol('federation-client');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for outbound messages
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[FederationClient] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    // Listen for errors
    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[FederationClient] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  /**
   * Send activity to target instance
   */
  async sendActivity(
    targetInstance: string,
    activityType: string,
    payload: unknown
  ): Promise<void> {
    const message: FederationMessage = {
      id: generateId(),
      type: activityType,
      sourcePDS: this.config.instanceUrl,
      sourceDID: this.config.did || '',
      targetPDS: targetInstance,
      payload,
      timestamp: Date.now(),
    };

    // Sign message if key available
    if (this.config.signKey) {
      message.signature = await this.signMessage(message);
    }

    await this.deliverMessage(targetInstance, message);
    this.emit('message:sent', message);
  }

  /**
   * Request sync from target instance
   */
  async requestSync(
    targetInstance: string,
    options: SyncRequestOptions
  ): Promise<void> {
    await this.sendActivity(targetInstance, 'sync.request', {
      since: options.since,
      entityTypes: options.entityTypes,
      limit: options.limit,
    });
  }

  /**
   * Push content to target instance
   */
  async pushContent(
    targetInstance: string,
    options: ContentPushOptions
  ): Promise<void> {
    await this.sendActivity(targetInstance, 'content.push', {
      contentId: options.contentId,
      content: options.content,
      contentType: options.contentType,
      visibility: options.visibility,
    });
  }

  /**
   * Invite user to circle (federated)
   */
  async inviteToCircle(
    targetInstance: string,
    options: CircleInviteOptions
  ): Promise<void> {
    await this.sendActivity(targetInstance, 'circle.invite', {
      circleId: options.circleId,
      userDid: options.userDid,
      inviterDid: options.inviterDid,
      message: options.message,
    });
  }

  /**
   * Follow user on target instance
   */
  async followUser(targetInstance: string, userDid: string): Promise<void> {
    await this.sendActivity(targetInstance, 'follow', { userDid });
  }

  /**
   * Unfollow user on target instance
   */
  async unfollowUser(targetInstance: string, userDid: string): Promise<void> {
    await this.sendActivity(targetInstance, 'unfollow', { userDid });
  }

  /**
   * Deliver message to target instance
   */
  private async deliverMessage(
    targetInstance: string,
    message: FederationMessage
  ): Promise<void> {
    const inboxUrl = `${targetInstance}/api/v1/federation/inbox`;

    try {
      const response = await fetch(inboxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(message.signature ? { 'X-Signature': message.signature } : {}),
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[FederationClient] Message delivered: ${message.id}`);
      this.emit('message:sent', message);
    } catch (error) {
      console.error(`[FederationClient] Failed to deliver message: ${(error as Error).message}`);
      this.queueMessage(message);
      this.emit('message:failed', { message, error: error as Error });
      
      // Auto-process queue if enabled
      if (this.config.autoProcessQueue) {
        this.processQueue().catch(console.error);
      }
    }
  }

  /**
   * Queue message for later delivery
   */
  private queueMessage(message: FederationMessage): void {
    const maxSize = this.config.maxQueueSize || 1000;
    
    if (this.messageQueue.length >= maxSize) {
      // Remove oldest message
      this.messageQueue.shift();
    }
    
    this.messageQueue.push(message);
  }

  /**
   * Process message queue
   */
  async processQueue(): Promise<void> {
    if (this.processing || this.messageQueue.length === 0) return;
    
    this.processing = true;
    const processed: FederationMessage[] = [];

    try {
      for (const message of this.messageQueue) {
        if (message.targetPDS) {
          try {
            await this.deliverMessage(message.targetPDS, message);
            processed.push(message);
          } catch (error) {
            console.error(`[FederationClient] Queue message failed: ${(error as Error).message}`);
          }
        }
      }

      // Remove processed messages from queue
      this.messageQueue = this.messageQueue.filter(m => !processed.includes(m));
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Sign federation message
   */
  async signMessage(message: FederationMessage): Promise<string> {
    if (!this.config.signKey) {
      throw new Error('Signing key not configured');
    }

    const data = JSON.stringify({
      type: message.type,
      sourceDID: message.sourceDID,
      timestamp: message.timestamp,
      payload: message.payload,
    });

    // Use SDK's sign method if available
    try {
      const identity = await this.sdk.getIdentity();
      if (identity) {
        const signature = await this.sdk.sign(new TextEncoder().encode(data));
        return signature;
      }
    } catch (error) {
      // Fallback to base64 encoding
      console.warn('[FederationClient] SDK sign failed, using fallback');
    }

    // Fallback: simple base64 encoding (NOT SECURE - only for testing)
    return btoa(data);
  }

  /**
   * Verify message signature
   */
  async verifySignature(
    message: FederationMessage,
    signature: string
  ): Promise<boolean> {
    const data = JSON.stringify({
      type: message.type,
      sourceDID: message.sourceDID,
      timestamp: message.timestamp,
      payload: message.payload,
    });

    try {
      // Use SDK's verify method if available
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
      // Fallback to simple comparison
      console.warn('[FederationClient] SDK verify failed, using fallback');
      const expected = await this.signMessage(message);
      return signature === expected;
    }

    return false;
  }

  /**
   * Discover instance via well-known endpoint
   */
  async discoverInstance(domain: string): Promise<InstanceInfo> {
    try {
      const url = `https://${domain}/.well-known/vivim`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const instanceInfo: InstanceInfo = {
        domain,
        instanceUrl: data.instanceUrl || `https://${domain}`,
        pdsUrl: data.pdsUrl,
        relayUrl: data.relayUrl,
        software: data.software,
        version: data.version,
        features: data.features,
        protocols: data.protocols,
        status: 'active',
        trustLevel: 1,
        lastSeen: Date.now(),
      };

      this.instances.set(domain, instanceInfo);
      this.emit('instance:discovered', instanceInfo);
      
      return instanceInfo;
    } catch (error) {
      console.error(`[FederationClient] Instance discovery failed: ${(error as Error).message}`);
      
      // Create basic instance info
      const instanceInfo: InstanceInfo = {
        domain,
        instanceUrl: `https://${domain}`,
        status: 'unknown',
        trustLevel: 0,
      };

      this.instances.set(domain, instanceInfo);
      return instanceInfo;
    }
  }

  /**
   * Get cached instance info
   */
  getInstanceInfo(domain: string): InstanceInfo | null {
    return this.instances.get(domain) || null;
  }

  /**
   * Get all known instances
   */
  getAllInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Update instance status
   */
  updateInstanceStatus(domain: string, status: 'active' | 'offline'): void {
    const instance = this.instances.get(domain);
    if (instance) {
      instance.status = status;
      instance.lastSeen = status === 'active' ? Date.now() : instance.lastSeen;
      this.instances.set(domain, instance);
      this.emit('instance:status', { domain, status });
    }
  }

  // Communication Protocol Methods

  getNodeId(): string {
    return 'federation-client';
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

  /**
   * Emit event (internal)
   */
  private emit<K extends keyof FederationEvents>(
    event: K,
    data: FederationEvents[K]
  ): void {
    // In a real implementation, this would use EventEmitter
    console.log(`[FederationClient] Event: ${event}`, data);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
    this.messageQueue = [];
    this.instances.clear();
  }
}

/**
 * Create Federation Client instance
 */
export function createFederationClient(
  sdk: VivimSDK,
  config: FederationConfig
): FederationClient {
  return new FederationClient(sdk, config);
}
