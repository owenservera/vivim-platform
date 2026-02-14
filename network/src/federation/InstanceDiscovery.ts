import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';

const log = createModuleLogger('federation:discovery');

export interface InstanceInfo {
  domain: string;
  did: string;
  instanceUrl: string;
  pdsUrl: string;
  relayUrl?: string;
  indexerUrl?: string;
  software: string;
  version: string;
  features: string[];
  protocols: string[];
  status: 'active' | 'offline' | 'unknown';
  trustLevel: number;
  lastSeen: Date;
}

export class InstanceDiscovery extends EventEmitter {
  private instances: Map<string, InstanceInfo> = new Map();
  private discoveryUrls: string[] = [];

  constructor() {
    super();
  }

  addDiscoveryUrl(url: string): void {
    if (!this.discoveryUrls.includes(url)) {
      this.discoveryUrls.push(url);
      log.debug({ url }, 'Added discovery URL');
    }
  }

  async discoverInstance(domainOrUrl: string): Promise<InstanceInfo | null> {
    const url = domainOrUrl.includes('://') 
      ? domainOrUrl 
      : `https://${domainOrUrl}/.well-known/vivim`;

    try {
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(5000) 
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const instance: InstanceInfo = {
        domain: data.domain || new URL(url).hostname,
        did: data.did || '',
        instanceUrl: data.services?.pds || url.replace('/.well-known/vivim', ''),
        pdsUrl: data.services?.pds || url.replace('/.well-known/vivim', ''),
        relayUrl: data.services?.relay,
        indexerUrl: data.services?.indexer,
        software: data.software?.name || 'vivim',
        version: data.software?.version || '0.1.0',
        features: data.features || [],
        protocols: data.protocols || [],
        status: 'active',
        trustLevel: 50,
        lastSeen: new Date(),
      };

      this.instances.set(instance.domain, instance);
      log.info({ domain: instance.domain }, 'Discovered instance');
      this.emit('instance:discovered', instance);

      return instance;
    } catch (error) {
      log.error({ domainOrUrl, error: (error as Error).message }, 'Failed to discover instance');
      return null;
    }
  }

  async discoverFromDirectory(): Promise<InstanceInfo[]> {
    const discovered: InstanceInfo[] = [];

    for (const dirUrl of this.discoveryUrls) {
      try {
        const response = await fetch(`${dirUrl}/instances`, {
          signal: AbortSignal.timeout(10000),
        });
        
        if (response.ok) {
          const data = await response.json();
          for (const instanceData of data.instances || []) {
            const instance = await this.discoverInstance(instanceData.domain);
            if (instance) {
              discovered.push(instance);
            }
          }
        }
      } catch (error) {
        log.debug({ dirUrl, error: (error as Error).message }, 'Directory lookup failed');
      }
    }

    return discovered;
  }

  async discoverViaDNS(domain: string): Promise<InstanceInfo | null> {
    try {
      const txtRecord = await this.resolveTXTRecord(`_vivim._tcp.${domain}`);
      
      if (txtRecord) {
        const parsed = this.parseTXTRecord(txtRecord);
        if (parsed.instanceUrl) {
          return this.discoverInstance(parsed.instanceUrl);
        }
      }
    } catch (error) {
      log.debug({ domain, error: (error as Error).message }, 'DNS discovery failed');
    }

    return null;
  }

  private async resolveTXTRecord(domain: string): Promise<string | null> {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`);
      const data = await response.json();
      
      if (data.Answer) {
        for (const answer of data.Answer) {
          if (answer.type === 16) {
            return answer.data.replace(/"/g, '');
          }
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  private parseTXTRecord(record: string): Record<string, string> {
    const result: Record<string, string> = {};
    const parts = record.split(';');
    
    for (const part of parts) {
      const [key, value] = part.split('=').map((s) => s.trim());
      if (key && value) {
        result[key] = value;
      }
    }

    return result;
  }

  getInstance(domain: string): InstanceInfo | undefined {
    return this.instances.get(domain);
  }

  getAllInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  getActiveInstances(): InstanceInfo[] {
    return this.getAllInstances().filter((i) => i.status === 'active');
  }

  updateInstanceStatus(domain: string, status: InstanceInfo['status']): void {
    const instance = this.instances.get(domain);
    if (instance) {
      instance.status = status;
      instance.lastSeen = new Date();
      this.emit('instance:status', instance);
    }
  }

  removeInstance(domain: string): void {
    this.instances.delete(domain);
    log.info({ domain }, 'Instance removed');
  }
}

export const instanceDiscovery = new InstanceDiscovery();
