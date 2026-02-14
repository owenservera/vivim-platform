import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { PeerInfo, ConnectionState } from '../types.js';

const log = createModuleLogger('p2p:connections');

export interface ConnectionManagerConfig {
  maxConnections?: number;
  minConnections?: number;
  connectionTimeout?: number;
}

export class ConnectionManager extends EventEmitter {
  private connections: Map<string, ConnectionState> = new Map();
  private peers: Map<string, PeerInfo> = new Map();
  private pendingConnections: Map<string, AbortController> = new Map();
  private config: ConnectionManagerConfig;
  private libp2p: any = null;

  constructor(config: ConnectionManagerConfig = {}) {
    super();
    this.config = {
      maxConnections: 100,
      minConnections: 5,
      connectionTimeout: 30000,
      ...config,
    };
  }

  initialize(libp2pNode: any): void {
    this.libp2p = libp2pNode;
    log.info('Connection manager initialized');
  }

  async connect(peerId: string, multiaddr?: string): Promise<boolean> {
    if (this.connections.has(peerId)) {
      log.debug({ peerId }, 'Already connected');
      return true;
    }

    if (this.pendingConnections.has(peerId)) {
      log.debug({ peerId }, 'Connection in progress');
      return true;
    }

    if (this.connections.size >= this.config.maxConnections!) {
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

      const connection: ConnectionState = {
        peerId,
        transport: 'webrtc',
        direction: 'outbound',
        bytesSent: 0n,
        bytesReceived: 0n,
        connectedAt: new Date(),
      };

      this.connections.set(peerId, connection);

      const peerInfo: PeerInfo = {
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
    } catch (error) {
      log.error({ peerId, error: (error as Error).message }, 'Failed to connect');
      return false;
    } finally {
      this.pendingConnections.delete(peerId);
    }
  }

  disconnect(peerId: string, reason?: string): void {
    const connection = this.connections.get(peerId);
    if (!connection) return;

    this.connections.delete(peerId);

    const peerInfo = this.peers.get(peerId);
    if (peerInfo) {
      peerInfo.status = 'disconnected';
      peerInfo.lastSeen = new Date();
    }

    this.emit('peer:disconnect', { peerId, reason });
    log.info({ peerId, reason }, 'Disconnected from peer');
  }

  getConnection(peerId: string): ConnectionState | undefined {
    return this.connections.get(peerId);
  }

  getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  isConnected(peerId: string): boolean {
    return this.connections.has(peerId);
  }

  async sendTo(peerId: string, data: Uint8Array): Promise<boolean> {
    const connection = this.connections.get(peerId);
    if (!connection) {
      log.warn({ peerId }, 'Cannot send: not connected');
      return false;
    }

    connection.bytesSent += BigInt(data.length);
    return true;
  }

  updateLatency(peerId: string, latency: number): void {
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

  getStats(): {
    totalConnections: number;
    pendingConnections: number;
    averageLatency: number;
    totalBytesSent: bigint;
    totalBytesReceived: bigint;
  } {
    const connections = Array.from(this.connections.values());
    const latencies = connections.map((c) => c.latency).filter(Boolean) as number[];
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

  disconnectAll(): void {
    for (const peerId of this.connections.keys()) {
      this.disconnect(peerId, 'shutdown');
    }
    log.info('All connections closed');
  }
}
