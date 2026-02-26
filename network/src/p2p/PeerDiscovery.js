import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('p2p:discovery');
export class PeerDiscovery extends EventEmitter {
    config;
    discoveredPeers = new Map();
    libp2p = null;
    discoveryInterval = null;
    constructor(config) {
        super();
        this.config = {
            enableMDNS: true,
            enableDHT: true,
            discoveryInterval: 30000,
            ...config
        };
        // Ensure bootstrapPeers is always an array
        if (!this.config.bootstrapPeers) {
            this.config.bootstrapPeers = [];
        }
    }
    async initialize(libp2pNode) {
        this.libp2p = libp2pNode;
        if (this.libp2p) {
            this.libp2p.addEventListener('peer:discovery', (event) => {
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
    async connectToBootstrapPeers() {
        log.info({ count: this.config.bootstrapPeers.length }, 'Connecting to bootstrap peers');
        for (const multiaddr of this.config.bootstrapPeers) {
            try {
                if (this.libp2p) {
                    await this.libp2p.dial(multiaddr);
                    log.debug({ multiaddr }, 'Connected to bootstrap peer');
                }
            }
            catch (error) {
                log.warn({ multiaddr, error: error.message }, 'Failed to connect to bootstrap');
            }
        }
    }
    handlePeerDiscovered(peerData) {
        const peerId = peerData.id.toString();
        const multiaddrs = peerData.multiaddrs?.map((ma) => ma.toString()) || [];
        if (this.discoveredPeers.has(peerId)) {
            const existing = this.discoveredPeers.get(peerId);
            existing.multiaddrs = [...new Set([...existing.multiaddrs, ...multiaddrs])];
            existing.lastSeen = new Date();
        }
        else {
            const peerInfo = {
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
    async discoverPeers() {
        if (!this.libp2p) {
            return Array.from(this.discoveredPeers.values());
        }
        try {
            const peers = await this.libp2p.peerStore.all();
            return peers.map((peer) => ({
                peerId: peer.id.toString(),
                multiaddrs: peer.addresses?.map((a) => a.multiaddr.toString()) || [],
                protocols: peer.protocols || [],
                status: 'disconnected',
                lastSeen: new Date(),
                reputation: 50,
            }));
        }
        catch (error) {
            log.error({ error: error.message }, 'Failed to discover peers');
            return Array.from(this.discoveredPeers.values());
        }
    }
    async findPeer(peerId) {
        if (this.discoveredPeers.has(peerId)) {
            return this.discoveredPeers.get(peerId);
        }
        if (this.libp2p) {
            try {
                const peer = await this.libp2p.peerStore.get(peerId);
                const peerInfo = {
                    peerId: peer.id.toString(),
                    multiaddrs: peer.addresses?.map((a) => a.multiaddr.toString()) || [],
                    protocols: peer.protocols || [],
                    status: 'disconnected',
                    lastSeen: new Date(),
                    reputation: 50,
                };
                this.discoveredPeers.set(peerId, peerInfo);
                return peerInfo;
            }
            catch {
                return null;
            }
        }
        return null;
    }
    async findPeersByProtocol(protocol) {
        if (!this.libp2p) {
            return [];
        }
        try {
            const peers = await this.libp2p.peerStore.all();
            return peers
                .filter((peer) => peer.protocols?.includes(protocol))
                .map((peer) => ({
                peerId: peer.id.toString(),
                multiaddrs: peer.addresses?.map((a) => a.multiaddr.toString()) || [],
                protocols: peer.protocols || [],
                status: 'disconnected',
                lastSeen: new Date(),
                reputation: 50,
            }));
        }
        catch (error) {
            log.error({ error: error.message }, 'Failed to find peers by protocol');
            return [];
        }
    }
    startPeriodicDiscovery() {
        this.discoveryInterval = setInterval(async () => {
            log.debug('Running periodic discovery');
            await this.discoverPeers();
        }, this.config.discoveryInterval);
    }
    addBootstrapPeer(multiaddr) {
        if (!this.config.bootstrapPeers.includes(multiaddr)) {
            this.config.bootstrapPeers.push(multiaddr);
            log.info({ multiaddr }, 'Bootstrap peer added');
        }
    }
    removeBootstrapPeer(multiaddr) {
        const index = this.config.bootstrapPeers.indexOf(multiaddr);
        if (index !== -1) {
            this.config.bootstrapPeers.splice(index, 1);
            log.info({ multiaddr }, 'Bootstrap peer removed');
        }
    }
    getDiscoveredPeers() {
        return Array.from(this.discoveredPeers.values());
    }
    getDiscoveredPeerCount() {
        return this.discoveredPeers.size;
    }
    stopPeriodicDiscovery() {
        if (this.discoveryInterval) {
            clearInterval(this.discoveryInterval);
            this.discoveryInterval = null;
        }
    }
    destroy() {
        this.stopPeriodicDiscovery();
        this.discoveredPeers.clear();
        log.info('Peer discovery destroyed');
    }
}
//# sourceMappingURL=PeerDiscovery.js.map