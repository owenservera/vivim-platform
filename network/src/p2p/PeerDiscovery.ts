import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import type { PeerInfo } from '../types.js';

const log = createModuleLogger('p2p:discovery');

export interface PeerDiscoveryConfig {
  bootstrapPeers: string[];
  enableMDNS?: boolean;
  enableDHT?: boolean;
  discoveryInterval?: number;
}

export class PeerDiscovery extends EventEmitter {
  private config: PeerDiscoveryConfig;
  private discoveredPeers: Map<string, PeerInfo> = new Map();
  private libp2p: any = null;
  private discoveryInterval: NodeJS.Timeout | null = null;

  constructor(config: PeerDiscoveryConfig) {
    super();
    this.config = {
      bootstrapPeers: [],
      enableMDNS: true,
      enableDHT: true,
      discoveryInterval: 30000,
      ...config,
    };
  }

  async initialize(libp2pNode: any): Promise<void> {
    this.libp2p = libp2pNode;

    if (this.libp2p) {
      this.libp2p.addEventListener('peer:discovery', (event: any) => {
        this.handlePeerDiscovered(event.detail);
      });

      if (this.config.bootstrapPeers.length > 0) {
        await this.connectToBootstrapPeers();
      }

      if (this.config.discoveryInterval && this.config.discoveryInterval > 0) {
        this.startPeriodicDiscovery();
      }
    }

    log.info('Peer discovery initialized');
  }

  private async connectToBootstrapPeers(): Promise<void> {
    log.info({ count: this.config.bootstrapPeers.length }, 'Connecting to bootstrap peers');

    for (const multiaddr of this.config.bootstrapPeers) {
      try {
        if (this.libp2p) {
          await this.libp2p.dial(multiaddr);
          log.debug({ multiaddr }, 'Connected to bootstrap peer');
        }
      } catch (error) {
        log.warn({ multiaddr, error: (error as Error).message }, 'Failed to connect to bootstrap');
      }
    }
  }

  private handlePeerDiscovered(peerData: any): void {
    const peerId = peerData.id.toString();
    const multiaddrs = peerData.multiaddrs?.map((ma: any) => ma.toString()) || [];

    if (this.discoveredPeers.has(peerId)) {
      const existing = this.discoveredPeers.get(peerId)!;
      existing.multiaddrs = [...new Set([...existing.multiaddrs, ...multiaddrs])];
      existing.lastSeen = new Date();
    } else {
      const peerInfo: PeerInfo = {
        peerId,
        multiaddrs,
        protocols: [],
        status: 'disconnected',
        lastSeen: new Date(),
        reputation: 50,
      };
      this.discoveredPeers.set(peerId, peerInfo);
    }

    this.emit('peer:discovered', { peerId, multiaddrs });
    log.debug({ peerId }, 'Peer discovered');
  }

  async discoverPeers(): Promise<PeerInfo[]> {
    if (!this.libp2p) {
      return Array.from(this.discoveredPeers.values());
    }

    try {
      const peers = await this.libp2p.peerStore.all();
      return peers.map((peer: any) => ({
        peerId: peer.id.toString(),
        multiaddrs: peer.addresses?.map((a: any) => a.multiaddr.toString()) || [],
        protocols: peer.protocols || [],
        status: 'disconnected' as const,
        lastSeen: new Date(),
        reputation: 50,
      }));
    } catch (error) {
      log.error({ error: (error as Error).message }, 'Failed to discover peers');
      return Array.from(this.discoveredPeers.values());
    }
  }

  async findPeer(peerId: string): Promise<PeerInfo | null> {
    if (this.discoveredPeers.has(peerId)) {
      return this.discoveredPeers.get(peerId)!;
    }

    if (this.libp2p) {
      try {
        const peer = await this.libp2p.peerStore.get(peerId);
        const peerInfo: PeerInfo = {
          peerId: peer.id.toString(),
          multiaddrs: peer.addresses?.map((a: any) => a.multiaddr.toString()) || [],
          protocols: peer.protocols || [],
          status: 'disconnected',
          lastSeen: new Date(),
          reputation: 50,
        };
        this.discoveredPeers.set(peerId, peerInfo);
        return peerInfo;
      } catch {
        return null;
      }
    }

    return null;
  }

  async findPeersByProtocol(protocol: string): Promise<PeerInfo[]> {
    if (!this.libp2p) {
      return [];
    }

    try {
      const peers = await this.libp2p.peerStore.all();
      return peers
        .filter((peer: any) => peer.protocols?.includes(protocol))
        .map((peer: any) => ({
          peerId: peer.id.toString(),
          multiaddrs: peer.addresses?.map((a: any) => a.multiaddr.toString()) || [],
          protocols: peer.protocols || [],
          status: 'disconnected' as const,
          lastSeen: new Date(),
          reputation: 50,
        }));
    } catch (error) {
      log.error({ error: (error as Error).message }, 'Failed to find peers by protocol');
      return [];
    }
  }

  private startPeriodicDiscovery(): void {
    this.discoveryInterval = setInterval(async () => {
      log.debug('Running periodic discovery');
      await this.discoverPeers();
    }, this.config.discoveryInterval);
  }

  addBootstrapPeer(multiaddr: string): void {
    if (!this.config.bootstrapPeers.includes(multiaddr)) {
      this.config.bootstrapPeers.push(multiaddr);
      log.info({ multiaddr }, 'Bootstrap peer added');
    }
  }

  removeBootstrapPeer(multiaddr: string): void {
    const index = this.config.bootstrapPeers.indexOf(multiaddr);
    if (index !== -1) {
      this.config.bootstrapPeers.splice(index, 1);
      log.info({ multiaddr }, 'Bootstrap peer removed');
    }
  }

  getDiscoveredPeers(): PeerInfo[] {
    return Array.from(this.discoveredPeers.values());
  }

  getDiscoveredPeerCount(): number {
    return this.discoveredPeers.size;
  }

  stopPeriodicDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
  }

  destroy(): void {
    this.stopPeriodicDiscovery();
    this.discoveredPeers.clear();
    log.info('Peer discovery destroyed');
  }
}
