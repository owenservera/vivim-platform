import { EventEmitter } from 'events';
import type { PeerInfo, ConnectionState } from '../types.js';
export interface ConnectionManagerConfig {
    maxConnections?: number;
    minConnections?: number;
    connectionTimeout?: number;
}
export declare class ConnectionManager extends EventEmitter {
    private connections;
    private peers;
    private pendingConnections;
    private config;
    private libp2p;
    constructor(config?: ConnectionManagerConfig);
    initialize(libp2pNode: any): void;
    connect(peerId: string, multiaddr?: string): Promise<boolean>;
    disconnect(peerId: string, reason?: string): void;
    getConnection(peerId: string): ConnectionState | undefined;
    getPeerInfo(peerId: string): PeerInfo | undefined;
    getConnectedPeers(): string[];
    getConnectionCount(): number;
    isConnected(peerId: string): boolean;
    sendTo(peerId: string, data: Uint8Array): Promise<boolean>;
    updateLatency(peerId: string, latency: number): void;
    getStats(): {
        totalConnections: number;
        pendingConnections: number;
        averageLatency: number;
        totalBytesSent: bigint;
        totalBytesReceived: bigint;
    };
    disconnectAll(): void;
}
//# sourceMappingURL=ConnectionManager.d.ts.map