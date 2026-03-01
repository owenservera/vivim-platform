/**
 * Instance Discovery - Discover and manage VIVIM federation instances
 * Supports multiple discovery methods: well-known, DNS, directory
 */

import { EventEmitter } from 'events';

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
  /** Indexer URL */
  indexerUrl?: string;
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
  /** Trust level (0-5) */
  trustLevel: number;
  /** Last seen timestamp */
  lastSeen?: number;
  /** Discovery method */
  discoveredVia?: 'well-known' | 'dns' | 'directory' | 'manual';
  /** Discovery timestamp */
  discoveredAt?: number;
}

/**
 * Discovery configuration
 */
export interface DiscoveryConfig {
  /** Discovery directory URLs */
  discoveryUrls?: string[];
  /** Enable DNS discovery */
  enableDnsDiscovery?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Auto-refresh instances */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * Discovery events
 */
export interface DiscoveryEvents {
  /** Instance discovered */
  'instance:discovered': InstanceInfo;
  /** Instance status changed */
  'instance:status': { domain: string; status: 'active' | 'offline' };
  /** Instance removed */
  'instance:removed': { domain: string };
  /** Discovery error */
  'discovery:error': { error: Error };
  /** Cache updated */
  'cache:updated': { count: number };
}

/**
 * Instance Discovery Implementation
 */
export class InstanceDiscovery extends EventEmitter {
  private instances: Map<string, InstanceInfo> = new Map();
  private config: Required<DiscoveryConfig>;
  private refreshTimer?: NodeJS.Timeout;
  private discoveryUrls: string[];

  constructor(config: DiscoveryConfig = {}) {
    super();
    this.config = {
      discoveryUrls: [
        'https://vivim.directory/instances.json',
        'https://fediverse.live/instances/vivim',
      ],
      enableDnsDiscovery: true,
      cacheTtl: 3600000, // 1 hour
      autoRefresh: true,
      refreshInterval: 300000, // 5 minutes
      ...config,
    };
    this.discoveryUrls = this.config.discoveryUrls;
    
    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Add discovery directory URL
   */
  addDiscoveryUrl(url: string): void {
    if (!this.discoveryUrls.includes(url)) {
      this.discoveryUrls.push(url);
    }
  }

  /**
   * Discover instance via well-known endpoint
   */
  async discoverInstance(domainOrUrl: string): Promise<InstanceInfo> {
    // Extract domain from URL if needed
    let domain = domainOrUrl;
    try {
      const url = new URL(domainOrUrl);
      domain = url.hostname;
    } catch {
      // Not a URL, assume it's a domain
    }

    // Check cache first
    const cached = this.instances.get(domain);
    if (cached && Date.now() - (cached.discoveredAt || 0) < this.config.cacheTtl) {
      return cached;
    }

    try {
      // Try well-known endpoint
      const wellKnownUrl = `https://${domain}/.well-known/vivim`;
      const response = await fetch(wellKnownUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const instanceInfo: InstanceInfo = {
          domain,
          instanceUrl: data.instanceUrl || `https://${domain}`,
          pdsUrl: data.pdsUrl,
          relayUrl: data.relayUrl,
          indexerUrl: data.indexerUrl,
          software: data.software,
          version: data.version,
          features: data.features,
          protocols: data.protocols,
          status: 'active',
          trustLevel: 2, // Verified via well-known
          lastSeen: Date.now(),
          discoveredVia: 'well-known',
          discoveredAt: Date.now(),
        };

        this.instances.set(domain, instanceInfo);
        this.emit('instance:discovered', instanceInfo);
        return instanceInfo;
      }
    } catch (error) {
      console.log(`[InstanceDiscovery] Well-known discovery failed for ${domain}: ${(error as Error).message}`);
    }

    // Try DNS discovery if enabled
    if (this.config.enableDnsDiscovery) {
      try {
        const dnsInfo = await this.discoverViaDNS(domain);
        if (dnsInfo) {
          this.instances.set(domain, dnsInfo);
          this.emit('instance:discovered', dnsInfo);
          return dnsInfo;
        }
      } catch (error) {
        console.log(`[InstanceDiscovery] DNS discovery failed for ${domain}: ${(error as Error).message}`);
      }
    }

    // Create basic instance info
    const instanceInfo: InstanceInfo = {
      domain,
      instanceUrl: `https://${domain}`,
      status: 'unknown',
      trustLevel: 0,
      discoveredVia: 'manual',
      discoveredAt: Date.now(),
    };

    this.instances.set(domain, instanceInfo);
    return instanceInfo;
  }

  /**
   * Discover instances from directory
   */
  async discoverFromDirectory(): Promise<InstanceInfo[]> {
    const discovered: InstanceInfo[] = [];

    for (const url of this.discoveryUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        const instances = Array.isArray(data) ? data : data.instances || [];

        for (const instance of instances) {
          const domain = instance.domain || new URL(instance.instanceUrl).hostname;
          
          const instanceInfo: InstanceInfo = {
            domain,
            instanceUrl: instance.instanceUrl,
            pdsUrl: instance.pdsUrl,
            relayUrl: instance.relayUrl,
            software: instance.software,
            version: instance.version,
            features: instance.features,
            protocols: instance.protocols,
            status: instance.status || 'active',
            trustLevel: instance.trustLevel || 1,
            lastSeen: instance.lastSeen || Date.now(),
            discoveredVia: 'directory',
            discoveredAt: Date.now(),
          };

          this.instances.set(domain, instanceInfo);
          discovered.push(instanceInfo);
          this.emit('instance:discovered', instanceInfo);
        }
      } catch (error) {
        console.error(`[InstanceDiscovery] Directory discovery failed for ${url}: ${(error as Error).message}`);
      }
    }

    this.emit('cache:updated', { count: this.instances.size });
    return discovered;
  }

  /**
   * Discover instance via DNS TXT record
   */
  async discoverViaDNS(domain: string): Promise<InstanceInfo | null> {
    // Note: DNS TXT record discovery requires a DNS resolver
    // In browser environments, this would need a proxy service
    // For Node.js, we could use dns.promises.resolveTxt
    
    try {
      // Check if we're in Node.js environment
      if (typeof process !== 'undefined' && process.versions?.node) {
        const dns = await import('dns/promises');
        const txtRecords = await dns.resolveTxt(`_vivim.${domain}`);
        
        // Parse TXT records for VIVIM configuration
        for (const record of txtRecords) {
          const txt = record.join('');
          if (txt.startsWith('vivim=')) {
            const config = JSON.parse(txt.substring(6));
            return {
              domain,
              instanceUrl: config.instanceUrl || `https://${domain}`,
              pdsUrl: config.pdsUrl,
              relayUrl: config.relayUrl,
              status: 'active',
              trustLevel: 2,
              lastSeen: Date.now(),
              discoveredVia: 'dns',
              discoveredAt: Date.now(),
            };
          }
        }
      }
    } catch (error) {
      // DNS discovery not available or failed
      console.debug(`[InstanceDiscovery] DNS TXT lookup failed for ${domain}`);
    }

    return null;
  }

  /**
   * Get cached instance info
   */
  getInstance(domain: string): InstanceInfo | null {
    return this.instances.get(domain) || null;
  }

  /**
   * Get all cached instances
   */
  getAllInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get active instances only
   */
  getActiveInstances(): InstanceInfo[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.status === 'active'
    );
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

  /**
   * Remove instance from cache
   */
  removeInstance(domain: string): void {
    const existed = this.instances.has(domain);
    if (existed) {
      this.instances.delete(domain);
      this.emit('instance:removed', { domain });
      this.emit('cache:updated', { count: this.instances.size });
    }
  }

  /**
   * Clear expired instances from cache
   */
  clearExpiredInstances(): void {
    const now = Date.now();
    let removed = 0;

    for (const [domain, instance] of this.instances.entries()) {
      if (instance.discoveredAt && now - instance.discoveredAt > this.config.cacheTtl) {
        this.instances.delete(domain);
        removed++;
      }
    }

    if (removed > 0) {
      this.emit('cache:updated', { count: this.instances.size });
    }
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.clearExpiredInstances();
      this.refreshActiveInstances().catch(console.error);
    }, this.config.refreshInterval);
  }

  /**
   * Refresh active instances
   */
  private async refreshActiveInstances(): Promise<void> {
    const activeInstances = this.getActiveInstances();
    
    for (const instance of activeInstances.slice(0, 10)) { // Limit to 10 at a time
      try {
        await this.discoverInstance(instance.domain);
      } catch (error) {
        console.error(`[InstanceDiscovery] Refresh failed for ${instance.domain}: ${(error as Error).message}`);
        // Mark as offline if refresh fails
        if (instance.lastSeen && Date.now() - instance.lastSeen > this.config.cacheTtl * 2) {
          this.updateInstanceStatus(instance.domain, 'offline');
        }
      }
    }
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Get discovery statistics
   */
  getStats(): {
    totalInstances: number;
    activeInstances: number;
    offlineInstances: number;
    unknownInstances: number;
    byDiscoveryMethod: Record<string, number>;
  } {
    const instances = Array.from(this.instances.values());
    
    return {
      totalInstances: instances.length,
      activeInstances: instances.filter(i => i.status === 'active').length,
      offlineInstances: instances.filter(i => i.status === 'offline').length,
      unknownInstances: instances.filter(i => i.status === 'unknown').length,
      byDiscoveryMethod: instances.reduce((acc, i) => {
        const method = i.discoveredVia || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.instances.clear();
    this.removeAllListeners();
  }
}

/**
 * Create InstanceDiscovery instance
 */
export function createInstanceDiscovery(config: DiscoveryConfig = {}): InstanceDiscovery {
  return new InstanceDiscovery(config);
}

// Singleton instance
let instanceDiscoverySingleton: InstanceDiscovery | null = null;

/**
 * Get or create singleton InstanceDiscovery instance
 */
export function getInstanceDiscovery(config: DiscoveryConfig = {}): InstanceDiscovery {
  if (!instanceDiscoverySingleton) {
    instanceDiscoverySingleton = new InstanceDiscovery(config);
  }
  return instanceDiscoverySingleton;
}
