import { EventEmitter } from 'events';
import type { PeerInfo } from '../types.js';
export interface PeerDiscoveryConfig {
    bootstrapPeers: string[];
    enableMDNS?: boolean;
    enableDHT?: boolean;
    discoveryInterval?: number;
}
export declare class PeerDiscovery extends EventEmitter {
    private config;
    private discoveredPeers;
    private libp2p;
    private discoveryInterval;
    constructor(config: PeerDiscoveryConfig);
    initialize(libp2pNode: any): Promise<void>;
    private connectToBootstrapPeers;
    private handlePeerDiscovered;
    discoverPeers(): Promise<PeerInfo[]>;
    findPeer(peerId: string): Promise<PeerInfo | null>;
    findPeersByProtocol(protocol: string): Promise<PeerInfo[]>;
    private startPeriodicDiscovery;
    addBootstrapPeer(multiaddr: string): void;
    removeBootstrapPeer(multiaddr: string): void;
    getDiscoveredPeers(): PeerInfo[];
    getDiscoveredPeerCount(): number;
    stopPeriodicDiscovery(): void;
    destroy(): void;
}
//# sourceMappingURL=PeerDiscovery.d.ts.map