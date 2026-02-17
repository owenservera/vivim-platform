import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { ContentLocation } from '../types.js';

const log = createModuleLogger('dht');

export interface DHTConfig {
  kBucketSize?: number;
  alpha?: number;
  refreshInterval?: number;
  enabled?: boolean;
}

export interface ContentRecord {
  contentId: string;
  contentType: string;
  providers: ContentLocation[];
  timestamp: number;
  expiresAt?: number;
}

export class DHTService extends EventEmitter {
  private contentCache: Map<string, ContentRecord> = new Map();
  private providerCache: Map<string, ContentLocation[]> = new Map();
  private localProvider: ContentLocation | null = null;
  private config: DHTConfig;
  private dht: any = null;
  private libp2p: any | null = null; // Used in clear() method

  constructor(config: DHTConfig = {}) {
    super();
    this.config = {
      kBucketSize: 20,
      alpha: 3,
      refreshInterval: 3600,
      enabled: true,
      ...config,
    };
  }

  async initialize(libp2pNode: any): Promise<void> {
    this.libp2p = libp2pNode;

    if (!this.config.enabled) {
      log.warn('DHT is disabled');
      return;
    }

    if (libp2pNode.services?.dht) {
      this.dht = libp2pNode.services.dht;
      log.info('DHT service initialized');
    } else {
      log.warn('DHT service not available, using local cache only');
    }
  }

  async publishContent(contentId: string, contentType: string, location?: ContentLocation): Promise<void> {
    const record: ContentRecord = {
      contentId,
      contentType,
      providers: location ? [location] : [],
      timestamp: Date.now(),
    };

    this.contentCache.set(contentId, record);

    if (this.localProvider) {
      record.providers.push(this.localProvider);
    }

    if (this.dht) {
      try {
        const key = `/vivim/content/${contentId}`;
        const value = JSON.stringify({
          contentId,
          contentType,
          location: this.localProvider,
          timestamp: record.timestamp,
        });
        await this.dht.put(key, new TextEncoder().encode(value));
        log.debug({ contentId }, 'Content published to DHT');
      } catch (error) {
        log.error({ contentId, error: (error as Error).message }, 'Failed to publish to DHT');
      }
    }

    this.emit('content:published', { contentId, contentType });
  }

  async findContent(contentId: string): Promise<ContentLocation[]> {
    if (this.providerCache.has(contentId)) {
      return this.providerCache.get(contentId)!;
    }

    const cached = this.contentCache.get(contentId);
    if (cached) {
      this.providerCache.set(contentId, cached.providers);
      return cached.providers;
    }

    if (this.dht) {
      try {
        const key = `/vivim/content/${contentId}`;
        const value = await this.dht.get(key, { timeout: 5000 });
        if (value) {
          const decoded = JSON.parse(new TextDecoder().decode(value));
          const locations: ContentLocation[] = decoded.providers || [];
          this.providerCache.set(contentId, locations);
          return locations;
        }
      } catch (error) {
        log.debug({ contentId, error: (error as Error).message }, 'DHT lookup failed');
      }
    }

    return [];
  }

  async provideContent(contentId: string, location: ContentLocation): Promise<void> {
    if (this.localProvider) {
      this.localProvider = location;
    }

    const record = this.contentCache.get(contentId);
    if (record) {
      if (!record.providers.some((p) => p.peerId === location.peerId)) {
        record.providers.push(location);
      }
    } else {
      await this.publishContent(contentId, 'unknown', location);
    }

    if (this.dht && location.peerId) {
      try {
        await this.dht.provide(contentId, location.multiaddrs);
        log.debug({ contentId, peerId: location.peerId }, 'Content provided to network');
      } catch (error) {
        log.error({ contentId, error: (error as Error).message }, 'Failed to provide content');
      }
    }

    this.emit('content:provided', { contentId, location });
  }

  async findProviders(contentId: string, limit: number = 5): Promise<ContentLocation[]> {
    const locations = await this.findContent(contentId);
    return locations.slice(0, limit);
  }

  setLocalProvider(location: ContentLocation): void {
    this.localProvider = location;
    log.info({ location }, 'Local provider set');
  }

  removeContent(contentId: string): void {
    this.contentCache.delete(contentId);
    this.providerCache.delete(contentId);

    if (this.dht) {
      this.dht.cancelProvide(contentId).catch(() => {});
    }

    log.info({ contentId }, 'Content removed from local DHT');
  }

  getLocalContent(): ContentRecord[] {
    return Array.from(this.contentCache.values());
  }

  async refreshRoutingTable(): Promise<void> {
    if (!this.dht) return;

    try {
      await this.dht.bootstrap();
      log.debug('Routing table refreshed');
    } catch (error) {
      log.error({ error: (error as Error).message }, 'Failed to refresh routing table');
    }
  }

  getStats(): { cachedContent: number; providers: number; dhtEnabled: boolean } {
    return {
      cachedContent: this.contentCache.size,
      providers: this.providerCache.size,
      dhtEnabled: !!this.dht,
    };
  }

  destroy(): void {
    this.contentCache.clear();
    this.providerCache.clear();
    this.dht = null;
    // Reference the property to avoid unused warning
    this.libp2p = null;
    void this.libp2p; // This tells TypeScript the property is intentionally used
  }
}

export const dhtService = new DHTService();
