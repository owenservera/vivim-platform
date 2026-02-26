import { EventEmitter } from 'events';
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
export declare class InstanceDiscovery extends EventEmitter {
    private instances;
    private discoveryUrls;
    constructor();
    addDiscoveryUrl(url: string): void;
    discoverInstance(domainOrUrl: string): Promise<InstanceInfo | null>;
    discoverFromDirectory(): Promise<InstanceInfo[]>;
    discoverViaDNS(domain: string): Promise<InstanceInfo | null>;
    private resolveTXTRecord;
    private parseTXTRecord;
    getInstance(domain: string): InstanceInfo | undefined;
    getAllInstances(): InstanceInfo[];
    getActiveInstances(): InstanceInfo[];
    updateInstanceStatus(domain: string, status: InstanceInfo['status']): void;
    removeInstance(domain: string): void;
}
export declare const instanceDiscovery: InstanceDiscovery;
//# sourceMappingURL=InstanceDiscovery.d.ts.map