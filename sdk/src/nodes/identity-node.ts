/**
 * Identity Node - API Node for DID/identity management
 * Enhanced with Communication Protocol
 */

import type { VivimSDK } from '../core/sdk.js';
import type { Identity, CreateIdentityOptions, LinkedIdentity } from '../core/types.js';
import { generateKeyPair, publicKeyToDID, signData, verifySignature } from '../utils/crypto.js';
import {
  CommunicationProtocol,
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
  type CommunicationHook,
} from '../core/communication.js';

/**
 * Identity Node API
 */
export interface IdentityNodeAPI {
  // Core
  getIdentity(): Promise<Identity | null>;
  createIdentity(options?: CreateIdentityOptions): Promise<Identity>;
  importIdentity(seed: Uint8Array): Promise<Identity>;

  // Keys
  getPublicKey(): Promise<string>;
  sign(data: Uint8Array): Promise<string>;
  verify(data: Uint8Array, signature: string, publicKey: string): Promise<boolean>;

  // Profile
  getProfile(): Promise<Profile>;
  updateProfile(updates: Partial<Profile>): Promise<void>;

  // Recovery
  generateRecoveryPhrase(): Promise<string>;
  verifyRecoveryPhrase(phrase: string): Promise<boolean>;

  // Verification
  linkExternalIdentity(provider: string, token: string): Promise<void>;
  unlinkExternalIdentity(provider: string): Promise<void>;
  getLinkedIdentities(): Promise<LinkedIdentity[]>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

export interface Profile {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  updatedAt?: number;
}

/**
 * Identity communication message types
 */
export type IdentityMessageType = 
  | 'identity_create'
  | 'identity_query'
  | 'identity_update'
  | 'signature_request'
  | 'signature_verify'
  | 'profile_update'
  | 'recovery_setup'
  | 'link_external';

/**
 * Identity Node Implementation
 */
export class IdentityNode implements IdentityNodeAPI {
  private profile: Profile = {};
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('identity-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for outbound messages
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[IdentityNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    // Listen for errors
    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[IdentityNode] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  /**
   * Get node ID
   */
  getNodeId(): string {
    return 'identity-node';
  }

  /**
   * Get communication metrics
   */
  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'identity-node',
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

  /**
   * Subscribe to communication events
   */
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('*', listener);
  }

  /**
   * Send a message using the communication protocol
   */
  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    const envelope = this.communication.createEnvelope<T>(type, payload, {
      direction: 'outbound',
      priority: 'normal',
    });

    const startTime = Date.now();
    
    try {
      // Execute before_send hooks
      const processed = await this.communication.executeHooks('before_send', envelope);
      
      // Record metrics
      this.communication.recordMessageSent(envelope.header.priority);
      
      // Emit sent event
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

  /**
   * Process an incoming message
   */
  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const startTime = Date.now();
    
    try {
      this.communication.recordMessageReceived();
      
      // Execute before_receive hooks
      let processed = await this.communication.executeHooks('before_receive', envelope);
      
      // Execute before_process hooks
      processed = await this.communication.executeHooks('before_process', processed);
      
      // Process based on message type
      const response = await this.handleMessage(processed);
      
      // Execute after_process hooks
      const final = await this.communication.executeHooks('after_process', response);
      
      // Execute after_receive hooks
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

  /**
   * Handle incoming message based on type
   */
  private async handleMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const { header, payload } = envelope;

    switch (header.type) {
      case 'identity_query':
        return this.communication.createResponse(envelope, {
          identity: await this.getIdentity(),
          publicKey: await this.getPublicKey().catch(() => null),
        });

      case 'signature_request':
        return this.communication.createResponse(envelope, {
          signature: await this.sign(payload as unknown as Uint8Array),
        });

      case 'profile_update':
        await this.updateProfile(payload as Partial<Profile>);
        return this.communication.createResponse(envelope, { success: true });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  async getIdentity(): Promise<Identity | null> {
    return this.sdk.getIdentity();
  }

  async createIdentity(options: CreateIdentityOptions = {}): Promise<Identity> {
    // Send message for tracking
    await this.sendMessage('identity_create', { options });
    return this.sdk.createIdentity(options);
  }

  async importIdentity(seed: Uint8Array): Promise<Identity> {
    return this.sdk.createIdentity({ seed });
  }

  async getPublicKey(): Promise<string> {
    const identity = this.sdk.getIdentity();
    if (!identity) {
      throw new Error('Identity not initialized');
    }
    return identity.publicKey;
  }

  async sign(data: Uint8Array | object): Promise<string> {
    return this.sdk.sign(data);
  }

  async verify(data: Uint8Array | object, signature: string, publicKeyOrDID: string): Promise<boolean> {
    return this.sdk.verify(data, signature, publicKeyOrDID);
  }

  async getProfile(): Promise<Profile> {
    return { ...this.profile };
  }

  async updateProfile(updates: Partial<Profile>): Promise<void> {
    this.profile = {
      ...this.profile,
      ...updates,
      updatedAt: Date.now(),
    };
    
    // Send profile update event
    await this.sendMessage('profile_update', { updates });
  }

  async generateRecoveryPhrase(): Promise<string> {
    // Generate a BIP39-like recovery phrase (simplified)
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    ];
    
    const phrase: string[] = [];
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length);
      phrase.push(words[randomIndex]!);
    }
    
    return phrase.join(' ');
  }

  async verifyRecoveryPhrase(_phrase: string): Promise<boolean> {
    // In production, this would verify against stored hash
    return true;
  }

  async linkExternalIdentity(provider: string, _token: string): Promise<void> {
    // In production, this would verify the token and store the link
    console.log(`Linking external identity: ${provider}`);
    await this.sendMessage('link_external', { provider });
  }

  async unlinkExternalIdentity(provider: string): Promise<void> {
    console.log(`Unlinking external identity: ${provider}`);
  }

  async getLinkedIdentities(): Promise<LinkedIdentity[]> {
    // In production, this would fetch from storage
    return [];
  }

  /**
   * Register a communication hook
   */
  registerHook(hook: Omit<CommunicationHook, 'id' | 'nodeId'>): void {
    this.communication.registerHook({
      ...hook,
      id: `hook-${Date.now()}`,
      nodeId: this.getNodeId(),
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
