/**
 * Storage Node - API Node for distributed storage
 */

import type { VivimSDK } from '../core/sdk.js';
import { calculateCID } from '../utils/crypto.js';

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
  private sdk: VivimSDK;
  private storage: Map<string, { data: Uint8Array; metadata: StorageResult }> = new Map();
  private pins: Map<string, PinInfo> = new Map();
  private deals: Map<string, StorageDeal> = new Map();

  constructor(sdk: VivimSDK) {
    this.sdk = sdk;
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

    return result;
  }

  async retrieve(cid: string): Promise<Uint8Array> {
    const stored = this.storage.get(cid);
    if (!stored) {
      throw new Error(`Content not found: ${cid}`);
    }
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
  }

  async unpin(cid: string): Promise<void> {
    this.pins.delete(cid);
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
    return {
      localPinned: true,
      ipfsProviders: [],
      filecoinDeals: [],
      availability: 100,
    };
  }
}
