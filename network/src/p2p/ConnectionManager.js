import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('p2p:connections');
export class ConnectionManager extends EventEmitter {
    connections = new Map();
    peers = new Map();
    pendingConnections = new Map();
    config;
    libp2p = null;
    constructor(config = {}) {
        super();
        this.config = {
            maxConnections: 100,
            minConnections: 5,
            connectionTimeout: 30000,
            ...config,
        };
    }
    initialize(libp2pNode) {
        this.libp2p = libp2pNode;
        log.info('Connection manager initialized');
    }
    async connect(peerId, multiaddr) {
        if (this.connections.has(peerId)) {
            log.debug({ peerId }, 'Already connected');
            return true;
        }
        if (this.pendingConnections.has(peerId)) {
            log.debug({ peerId }, 'Connection in progress');
            return true;
        }
        if (this.connections.size >= this.config.maxConnections) {
            log.warn('Max connections reached');
            return false;
        }
        const controller = new AbortController();
        this.pendingConnections.set(peerId, controller);
        try {
            log.info({ peerId }, 'Connecting to peer');
            if (this.libp2p && multiaddr) {
                await this.libp2p.dial(multiaddr);
            }
            const connection = {
                peerId,
                transport: 'webrtc',
                direction: 'outbound',
                bytesSent: 0n,
                bytesReceived: 0n,
                connectedAt: new Date(),
            };
            this.connections.set(peerId, connection);
            const peerInfo = {
                peerId,
                multiaddrs: multiaddr ? [multiaddr] : [],
                protocols: [],
                status: 'connected',
                lastSeen: new Date(),
                reputation: 50,
            };
            this.peers.set(peerId, peerInfo);
            this.emit('peer:connect', { peerId });
            log.info({ peerId }, 'Connected to peer');
            return true;
        }
        catch (error) {
            log.error({ peerId, error: error.message }, 'Failed to connect');
            return false;
        }
        finally {
            this.pendingConnections.delete(peerId);
        }
    }
    disconnect(peerId, reason) {
        const connection = this.connections.get(peerId);
        if (!connection)
            return;
        this.connections.delete(peerId);
        const peerInfo = this.peers.get(peerId);
        if (peerInfo) {
            peerInfo.status = 'disconnected';
            peerInfo.lastSeen = new Date();
        }
        this.emit('peer:disconnect', { peerId, reason });
        log.info({ peerId, reason }, 'Disconnected from peer');
    }
    getConnection(peerId) {
        return this.connections.get(peerId);
    }
    getPeerInfo(peerId) {
        return this.peers.get(peerId);
    }
    getConnectedPeers() {
        return Array.from(this.connections.keys());
    }
    getConnectionCount() {
        return this.connections.size;
    }
    isConnected(peerId) {
        return this.connections.has(peerId);
    }
    async sendTo(peerId, data) {
        const connection = this.connections.get(peerId);
        if (!connection) {
            log.warn({ peerId }, 'Cannot send: not connected');
            return false;
        }
        connection.bytesSent += BigInt(data.length);
        return true;
    }
    updateLatency(peerId, latency) {
        const connection = this.connections.get(peerId);
        if (connection) {
            connection.latency = latency;
        }
        const peerInfo = this.peers.get(peerId);
        if (peerInfo) {
            const currentReputation = peerInfo.reputation;
            const latencyScore = Math.max(0, 100 - latency);
            peerInfo.reputation = Math.round((currentReputation + latencyScore) / 2);
        }
    }
    getStats() {
        const connections = Array.from(this.connections.values());
        const latencies = connections.map((c) => c.latency).filter(Boolean);
        const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : 0;
        return {
            totalConnections: this.connections.size,
            pendingConnections: this.pendingConnections.size,
            averageLatency: avgLatency,
            totalBytesSent: connections.reduce((acc, c) => acc + c.bytesSent, 0n),
            totalBytesReceived: connections.reduce((acc, c) => acc + c.bytesReceived, 0n),
        };
    }
    disconnectAll() {
        for (const peerId of this.connections.keys()) {
            this.disconnect(peerId, 'shutdown');
        }
        log.info('All connections closed');
    }
}
//# sourceMappingURL=ConnectionManager.js.map