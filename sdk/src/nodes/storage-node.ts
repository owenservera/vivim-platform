/**
 * Storage Node - API Node for distributed storage
 * Enhanced with Communication Protocol
 */

import type { VivimSDK } from '../core/sdk.js';
import { calculateCID } from '../utils/crypto.js';
import {
  CommunicationProtocol,
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * Storage options
 */
export interface StoreOptions {
  encryption?: boolean;
  pin?: boolean;
  visibility?: 'public' | 'private';
}

/**
 * Storage result
 */
export interface StorageResult {
  cid: string;
  size: number;
  encrypted: boolean;
  storedAt: number;
}

/**
 * Pin info
 */
export interface PinInfo {
  cid: string;
  pinnedAt: number;
  size: number;
}

/**
 * Storage deal
 */
export interface StorageDeal {
  dealId: string;
  cid: string;
  provider: string;
  duration: number;
  price: bigint;
  state: DealState;
  createdAt: number;
  expiresAt: number;
}

export type DealState = 'proposed' | 'published' | 'active' | 'expired' | 'slashed' | 'completed';

/**
 * Provider info
 */
export interface ProviderInfo {
  peerId: string;
  multiaddrs: string[];
  region: string;
  pricePerGiBPerEpoch: bigint;
  reputation: number;
}

/**
 * Provider search options
 */
export interface ProviderSearchOptions {
  minReplication?: number;
  maxPrice?: bigint;
  region?: string;
}

/**
 * Provider reputation
 */
export interface ProviderReputation {
  score: number;
  uptime: number;
  totalDeals: number;
  slashedDeals: number;
  avgResponseTime: number;
}

/**
 * Storage status
 */
export interface StorageStatus {
  localPinned: boolean;
  ipfsProviders: string[];
  filecoinDeals: StorageDeal[];
  availability: number;
}

/**
 * Storage Node API
 */
export interface StorageNodeAPI {
  // Content
  store(data: Uint8Array | object, options?: StoreOptions): Promise<StorageResult>;
  retrieve(cid: string): Promise<Uint8Array>;
  exists(cid: string): Promise<boolean>;

  // Pinning
  pin(cid: string): Promise<void>;
  unpin(cid: string): Promise<void>;
  getPins(): Promise<PinInfo[]>;

  // Deals
  createDeal(cid: string, options: DealOptions): Promise<StorageDeal>;
  getDeal(dealId: string): Promise<StorageDeal>;
  listDeals(): Promise<StorageDeal[]>;

  // Providers
  findProviders(options?: ProviderSearchOptions): Promise<ProviderInfo[]>;
  getProviderReputation(providerId: string): Promise<ProviderReputation>;

  // Status
  getStatus(): Promise<StorageStatus>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

export interface DealOptions {
  duration: number;
  provider?: string;
  maxPrice?: bigint;
  replication?: number;
}

/**
 * Storage Node Implementation
 */
export class StorageNode implements StorageNodeAPI {
  private storage: Map<string, { data: Uint8Array; metadata: StorageResult }> = new Map();
  private pins: Map<string, PinInfo> = new Map();
  private deals: Map<string, StorageDeal> = new Map();
  
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('storage-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[StorageNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubError = this.communication.onEvent('message_error', (event) => {
      console.error(`[StorageNode] Message error: ${event.error}`);
    });
    this.eventUnsubscribe.push(unsubError);
  }

  getNodeId(): string {
    return 'storage-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'storage-node',
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
      case 'storage_store':
        const result = await this.store(payload as unknown as Uint8Array | object);
        return this.communication.createResponse(envelope, { result });

      case 'storage_retrieve':
        try {
          const data = await this.retrieve((payload as { cid: string }).cid);
          return this.communication.createResponse(envelope, { data: Array.from(data) });
        } catch (error) {
          return this.communication.createResponse(envelope, { error: String(error) });
        }

      case 'storage_exists':
        const exists = await this.exists((payload as { cid: string }).cid);
        return this.communication.createResponse(envelope, { exists });

      case 'storage_status':
        const status = await this.getStatus();
        return this.communication.createResponse(envelope, { status });

      case 'storage_deals':
        const deals = await this.listDeals();
        return this.communication.createResponse(envelope, { deals });

      case 'storage_providers':
        const providers = await this.findProviders(payload as ProviderSearchOptions);
        return this.communication.createResponse(envelope, { providers });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  async store(data: Uint8Array | object, options: StoreOptions = {}): Promise<StorageResult> {
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(JSON.stringify(data));
    const cid = await calculateCID(bytes);
    
    const result: StorageResult = {
      cid,
      size: bytes.length,
      encrypted: options.encryption ?? false,
      storedAt: Date.now(),
    };

    // Store locally (in production, this would go to IPFS/Filecoin)
    this.storage.set(cid, { data: bytes, metadata: result });

    if (options.pin) {
      await this.pin(cid);
    }

    // Send storage event
    await this.sendMessage('storage_store', { cid, size: bytes.length, pinned: !!options.pin });

    return result;
  }

  async retrieve(cid: string): Promise<Uint8Array> {
    const stored = this.storage.get(cid);
    if (!stored) {
      throw new Error(`Content not found: ${cid}`);
    }

    await this.sendMessage('storage_retrieve', { cid, success: true });

    return stored.data;
  }

  async exists(cid: string): Promise<boolean> {
    return this.storage.has(cid);
  }

  async pin(cid: string): Promise<void> {
    if (!this.storage.has(cid)) {
      throw new Error(`Content not found: ${cid}`);
    }

    this.pins.set(cid, {
      cid,
      pinnedAt: Date.now(),
      size: this.storage.get(cid)!.metadata.size,
    });

    await this.sendMessage('storage_pin', { cid });
  }

  async unpin(cid: string): Promise<void> {
    this.pins.delete(cid);
    
    await this.sendMessage('storage_unpin', { cid });
  }

  async getPins(): Promise<PinInfo[]> {
    return Array.from(this.pins.values());
  }

  async createDeal(cid: string, options: DealOptions): Promise<StorageDeal> {
    const dealId = `deal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const deal: StorageDeal = {
      dealId,
      cid,
      provider: options.provider || 'default-provider',
      duration: options.duration,
      price: options.maxPrice || 0n,
      state: 'proposed',
      createdAt: Date.now(),
      expiresAt: Date.now() + options.duration * 24 * 60 * 60 * 1000,
    };

    this.deals.set(dealId, deal);

    await this.sendMessage('storage_deal_create', { dealId, cid, provider: deal.provider });

    return deal;
  }

  async getDeal(dealId: string): Promise<StorageDeal> {
    const deal = this.deals.get(dealId);
    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }
    return deal;
  }

  async listDeals(): Promise<StorageDeal[]> {
    return Array.from(this.deals.values());
  }

  async findProviders(_options: ProviderSearchOptions = {}): Promise<ProviderInfo[]> {
    await this.sendMessage('storage_providers_search', {});

    // In production, this would query the DHT/network
    return [
      {
        peerId: 'QmDefaultProvider',
        multiaddrs: ['/ip4/127.0.0.1/tcp/4001'],
        region: 'global',
        pricePerGiBPerEpoch: 1000000n,
        reputation: 95,
      },
    ];
  }

  async getProviderReputation(providerId: string): Promise<ProviderReputation> {
    await this.sendMessage('storage_reputation_query', { providerId });

    // In production, this would query the reputation system
    return {
      score: 95,
      uptime: 99.5,
      totalDeals: 100,
      slashedDeals: 0,
      avgResponseTime: 100,
    };
  }

  async getStatus(): Promise<StorageStatus> {
    const status: StorageStatus = {
      localPinned: true,
      ipfsProviders: [],
      filecoinDeals: Array.from(this.deals.values()),
      availability: this.storage.size > 0 ? 100 : 0,
    };

    await this.sendMessage('storage_status', { 
      localPinned: status.localPinned, 
      contentCount: this.storage.size 
    });

    return status;
  }

  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
