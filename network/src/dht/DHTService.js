import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('dht');
export class DHTService extends EventEmitter {
    contentCache = new Map();
    providerCache = new Map();
    localProvider = null;
    config;
    dht = null;
    libp2p = null; // Used in clear() method
    constructor(config = {}) {
        super();
        this.config = {
            kBucketSize: 20,
            alpha: 3,
            refreshInterval: 3600,
            enabled: true,
            ...config,
        };
    }
    async initialize(libp2pNode) {
        this.libp2p = libp2pNode;
        if (!this.config.enabled) {
            log.warn('DHT is disabled');
            return;
        }
        if (libp2pNode.services?.dht) {
            this.dht = libp2pNode.services.dht;
            log.info('DHT service initialized');
        }
        else {
            log.warn('DHT service not available, using local cache only');
        }
    }
    async publishContent(contentId, contentType, location) {
        const record = {
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
            }
            catch (error) {
                log.error({ contentId, error: error.message }, 'Failed to publish to DHT');
            }
        }
        this.emit('content:published', { contentId, contentType });
    }
    async findContent(contentId) {
        if (this.providerCache.has(contentId)) {
            return this.providerCache.get(contentId);
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
                    const locations = decoded.providers || [];
                    this.providerCache.set(contentId, locations);
                    return locations;
                }
            }
            catch (error) {
                log.debug({ contentId, error: error.message }, 'DHT lookup failed');
            }
        }
        return [];
    }
    async provideContent(contentId, location) {
        if (this.localProvider) {
            this.localProvider = location;
        }
        const record = this.contentCache.get(contentId);
        if (record) {
            if (!record.providers.some((p) => p.peerId === location.peerId)) {
                record.providers.push(location);
            }
        }
        else {
            await this.publishContent(contentId, 'unknown', location);
        }
        if (this.dht && location.peerId) {
            try {
                await this.dht.provide(contentId, location.multiaddrs);
                log.debug({ contentId, peerId: location.peerId }, 'Content provided to network');
            }
            catch (error) {
                log.error({ contentId, error: error.message }, 'Failed to provide content');
            }
        }
        this.emit('content:provided', { contentId, location });
    }
    async findProviders(contentId, limit = 5) {
        const locations = await this.findContent(contentId);
        return locations.slice(0, limit);
    }
    setLocalProvider(location) {
        this.localProvider = location;
        log.info({ location }, 'Local provider set');
    }
    removeContent(contentId) {
        this.contentCache.delete(contentId);
        this.providerCache.delete(contentId);
        if (this.dht) {
            this.dht.cancelProvide(contentId).catch(err => {
                log.error({ err, contentId }, 'Failed to cancel DHT provide');
            });
        }
        log.info({ contentId }, 'Content removed from local DHT');
    }
    getLocalContent() {
        return Array.from(this.contentCache.values());
    }
    async refreshRoutingTable() {
        if (!this.dht)
            return;
        try {
            await this.dht.bootstrap();
            log.debug('Routing table refreshed');
        }
        catch (error) {
            log.error({ error: error.message }, 'Failed to refresh routing table');
        }
    }
    getStats() {
        return {
            cachedContent: this.contentCache.size,
            providers: this.providerCache.size,
            dhtEnabled: !!this.dht,
        };
    }
    destroy() {
        this.contentCache.clear();
        this.providerCache.clear();
        this.dht = null;
        // Reference the property to avoid unused warning
        this.libp2p = null;
        void this.libp2p; // This tells TypeScript the property is intentionally used
    }
}
export const dhtService = new DHTService();
//# sourceMappingURL=DHTService.js.map