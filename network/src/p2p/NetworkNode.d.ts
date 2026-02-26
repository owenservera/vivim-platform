/**
 * VIVIM Network Node
 * Core P2P node implementation using libp2p
 */
import type { Libp2p } from '@libp2p/interface';
import type { PeerId } from '@libp2p/interface';
import { EventEmitter } from 'events';
import { KeyManager } from '../security/KeyManager.js';
import { DHTService } from '../dht/DHTService.js';
import { PubSubService } from '../pubsub/PubSubService.js';
export interface NetworkNodeConfig {
    peerId?: PeerId;
    privateKey?: Uint8Array;
    nodeType: 'bootstrap' | 'relay' | 'indexer' | 'storage' | 'edge' | 'client';
    roles: string[];
    listenAddresses: string[];
    bootstrapPeers: string[];
    enableWebRTC: boolean;
    enableDHT: boolean;
    enableGossipsub: boolean;
    enableMDNS: boolean;
    minConnections: number;
    maxConnections: number;
}
export interface NetworkNodeInfo {
    peerId: string;
    multiaddrs: string[];
    protocols: string[];
    connections: number;
}
export declare class NetworkNode extends EventEmitter {
    private node;
    private config;
    private isRunning;
    readonly keyManager: KeyManager;
    readonly dhtService: DHTService;
    readonly pubSubService: PubSubService;
    constructor(config?: Partial<NetworkNodeConfig>);
    /**
     * Start the network node
     */
    start(): Promise<void>;
    /**
     * Stop the network node
     */
    stop(): Promise<void>;
    /**
     * Build transport configuration
     */
    private buildTransports;
    /**
     * Build peer discovery configuration
     */
    private buildPeerDiscovery;
    /**
     * Build services configuration
     */
    private buildServices;
    /**
     * Set up event handlers
     */
    private setupEventHandlers;
    /**
     * Get node information
     */
    getNodeInfo(): NetworkNodeInfo;
    /**
     * Connect to a specific peer
     */
    connect(multiaddr: string): Promise<void>;
    /**
     * Get connected peers
     */
    getConnectedPeers(): string[];
    /**
     * Check if node is running
     */
    get running(): boolean;
    /**
     * Get libp2p node instance
     */
    get libp2p(): Libp2p | null;
}
export default NetworkNode;
//# sourceMappingURL=NetworkNode.d.ts.map