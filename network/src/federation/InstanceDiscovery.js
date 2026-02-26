import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('federation:discovery');
export class InstanceDiscovery extends EventEmitter {
    instances = new Map();
    discoveryUrls = [];
    constructor() {
        super();
    }
    addDiscoveryUrl(url) {
        if (!this.discoveryUrls.includes(url)) {
            this.discoveryUrls.push(url);
            log.debug({ url }, 'Added discovery URL');
        }
    }
    async discoverInstance(domainOrUrl) {
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
            const instance = {
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
        }
        catch (error) {
            log.error({ domainOrUrl, error: error.message }, 'Failed to discover instance');
            return null;
        }
    }
    async discoverFromDirectory() {
        const discovered = [];
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
            }
            catch (error) {
                log.debug({ dirUrl, error: error.message }, 'Directory lookup failed');
            }
        }
        return discovered;
    }
    async discoverViaDNS(domain) {
        try {
            const txtRecord = await this.resolveTXTRecord(`_vivim._tcp.${domain}`);
            if (txtRecord) {
                const parsed = this.parseTXTRecord(txtRecord);
                if (parsed.instanceUrl) {
                    return this.discoverInstance(parsed.instanceUrl);
                }
            }
        }
        catch (error) {
            log.debug({ domain, error: error.message }, 'DNS discovery failed');
        }
        return null;
    }
    async resolveTXTRecord(domain) {
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
        }
        catch {
            return null;
        }
        return null;
    }
    parseTXTRecord(record) {
        const result = {};
        const parts = record.split(';');
        for (const part of parts) {
            const [key, value] = part.split('=').map((s) => s.trim());
            if (key && value) {
                result[key] = value;
            }
        }
        return result;
    }
    getInstance(domain) {
        return this.instances.get(domain);
    }
    getAllInstances() {
        return Array.from(this.instances.values());
    }
    getActiveInstances() {
        return this.getAllInstances().filter((i) => i.status === 'active');
    }
    updateInstanceStatus(domain, status) {
        const instance = this.instances.get(domain);
        if (instance) {
            instance.status = status;
            instance.lastSeen = new Date();
            this.emit('instance:status', instance);
        }
    }
    removeInstance(domain) {
        this.instances.delete(domain);
        log.info({ domain }, 'Instance removed');
    }
}
export const instanceDiscovery = new InstanceDiscovery();
//# sourceMappingURL=InstanceDiscovery.js.map