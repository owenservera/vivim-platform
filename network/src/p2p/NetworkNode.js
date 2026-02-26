/**
 * VIVIM Network Node
 * Core P2P node implementation using libp2p
 */
import { createLibp2p } from 'libp2p';
import { webRTC } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
// import { tcp } from '@libp2p/tcp';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { mplex } from '@libp2p/mplex';
import { kadDHT } from '@libp2p/kad-dht';
import { gossipsub } from '@libp2p/gossipsub';
import { bootstrap } from '@libp2p/bootstrap';
// import { mdns } from '@libp2p/mdns';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import { networkErrorReporter } from '../utils/error-reporter.js';
import { KeyManager } from '../security/KeyManager.js';
import { DHTService } from '../dht/DHTService.js';
import { PubSubService } from '../pubsub/PubSubService.js';
const log = logger.child({ module: 'network-node' });
export class NetworkNode extends EventEmitter {
    node = null;
    config;
    isRunning = false;
    keyManager;
    dhtService;
    pubSubService;
    constructor(config = {}) {
        super();
        this.config = {
            nodeType: 'client',
            roles: ['routing'],
            listenAddresses: ['/ip4/0.0.0.0/tcp/0'],
            bootstrapPeers: [],
            enableWebRTC: true,
            enableDHT: true,
            enableGossipsub: true,
            enableMDNS: true,
            minConnections: 5,
            maxConnections: 100,
            ...config
        };
        this.keyManager = new KeyManager();
        this.dhtService = new DHTService({ enabled: this.config.enableDHT });
        this.pubSubService = new PubSubService();
        log.info({ config: this.config }, 'Network node created');
    }
    /**
     * Start the network node
     */
    async start() {
        if (this.isRunning) {
            log.warn('Node already running');
            return;
        }
        try {
            log.info('Starting network node...');
            const options = {
                // Transports
                transports: this.buildTransports(),
                // Connection encryption
                // @ts-ignore - libp2p type compatibility issue
                connectionEncryption: [noise()],
                // Stream multiplexers
                // @ts-ignore - libp2p type compatibility issue
                streamMuxers: [yamux(), mplex()],
                // Peer discovery
                peerDiscovery: this.buildPeerDiscovery(),
                // Services
                services: this.buildServices(),
                // Connection manager
                connectionManager: {
                    minConnections: this.config.minConnections,
                    maxConnections: this.config.maxConnections
                }
            };
            // Add custom peer ID if provided
            if (this.config.peerId) {
                // @ts-ignore - libp2p PeerId type compatibility issue
                options.peerId = this.config.peerId;
            }
            // Create libp2p node
            // @ts-ignore - libp2p return type compatibility issue
            this.node = await createLibp2p(options);
            // Set up event handlers
            this.setupEventHandlers();
            // Initialize services
            await this.dhtService.initialize(this.node);
            await this.pubSubService.initialize(this.node);
            // Start listening
            await this.node.start();
            this.isRunning = true;
            log.info({
                peerId: this.node?.peerId?.toString() || 'unknown',
                addresses: this.node?.getMultiaddrs?.()?.map(ma => ma.toString()) || []
            }, 'Network node started');
            this.emit('started', this.getNodeInfo());
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            log.error({ error: errorMessage }, 'Failed to start network node');
            // Report the error to the centralized error reporting system
            await networkErrorReporter.reportNetworkError('Failed to start network node', error, {
                config: this.config,
                errorType: error?.constructor?.name || typeof error
            }, 'critical');
            throw error;
        }
    }
    /**
     * Stop the network node
     */
    async stop() {
        if (!this.isRunning || !this.node) {
            return;
        }
        try {
            log.info('Stopping network node...');
            this.dhtService.destroy();
            this.pubSubService.destroy();
            await this.node.stop();
            this.isRunning = false;
            log.info('Network node stopped');
            this.emit('stopped');
        }
        catch (error) {
            log.error({ error: error.message }, 'Failed to stop network node');
            throw error;
        }
    }
    /**
     * Build transport configuration
     */
    buildTransports() {
        const transports = [];
        // WebRTC for browser P2P
        if (this.config.enableWebRTC) {
            transports.push(webRTC({
            // iceServers: [
            //   { urls: 'stun:stun.l.google.com:19302' },
            //   { urls: 'stun:stun1.l.google.com:19302' }
            // ]
            }));
        }
        // WebSockets for browser-to-server
        transports.push(webSockets());
        // TCP for server-to-server (Commented out for browser compatibility)
        // if (this.config.nodeType !== 'client') {
        //   transports.push(tcp());
        // }
        return transports;
    }
    /**
     * Build peer discovery configuration
     */
    buildPeerDiscovery() {
        const discovery = [];
        // Bootstrap peers
        if (this.config.bootstrapPeers.length > 0) {
            discovery.push(bootstrap({
                list: this.config.bootstrapPeers
            }));
        }
        // mDNS for local network discovery (Commented out for browser compatibility)
        // if (this.config.enableMDNS) {
        //   discovery.push(mdns());
        // }
        return discovery;
    }
    /**
     * Build services configuration
     */
    buildServices() {
        const services = {
            identify: identify(),
            ping: ping()
        };
        // DHT for content routing
        if (this.config.enableDHT) {
            // @ts-ignore - libp2p validator type compatibility issue
            services.dht = kadDHT({
                clientMode: this.config.nodeType === 'client',
                validators: {
                    '/vivim/content': {
                        // @ts-ignore
                        validate: (_data) => {
                            // Custom validation logic
                            return true;
                        }
                    }
                }
            });
        }
        // Gossipsub for pub/sub
        if (this.config.enableGossipsub) {
            services.gossipsub = gossipsub({
                emitSelf: false,
                fallbackToFloodsub: true,
                directPeers: [],
                D: 6, // Desired degree
                Dlo: 4, // Minimum degree
                Dhi: 12, // Maximum degree
                Dscore: 4, // Score threshold
                Dout: 2, // Outbound degree
                Dlazy: 6, // Lazy propagation degree
                heartbeatInterval: 1000,
                mcacheLength: 5,
                mcacheGossip: 3,
                seenTTL: 55000
            });
        }
        return services;
    }
    /**
     * Set up event handlers
     */
    setupEventHandlers() {
        if (!this.node)
            return;
        // Peer discovery
        this.node.addEventListener('peer:discovery', (event) => {
            const peerId = event.detail.id.toString();
            log.debug({ peerId }, 'Discovered peer');
            this.emit('peer:discovery', { peerId });
        });
        // Peer connection
        this.node.addEventListener('peer:connect', (event) => {
            const peerId = event.detail.toString();
            log.info({ peerId }, 'Connected to peer');
            this.emit('peer:connect', { peerId });
        });
        // Peer disconnection
        this.node.addEventListener('peer:disconnect', (event) => {
            const peerId = event.detail.toString();
            log.info({ peerId }, 'Disconnected from peer');
            this.emit('peer:disconnect', { peerId });
        });
        // Protocol negotiation
        // this.node.addEventListener('protocol:open', (event) => {
        //   log.debug({ protocol: event.detail.protocol }, 'Protocol opened');
        // });
    }
    /**
     * Get node information
     */
    getNodeInfo() {
        if (!this.node) {
            throw new Error('Node not started');
        }
        return {
            peerId: this.node.peerId.toString(),
            multiaddrs: this.node.getMultiaddrs().map(ma => ma.toString()),
            protocols: this.node.getProtocols(),
            connections: this.node.getConnections().length
        };
    }
    /**
     * Connect to a specific peer
     */
    async connect(multiaddr) {
        if (!this.node) {
            throw new Error('Node not started');
        }
        try {
            log.info({ multiaddr }, 'Connecting to peer');
            // await this.node.dial(multiaddr);
        }
        catch (error) {
            log.error({ multiaddr, error: error.message }, 'Failed to connect');
            throw error;
        }
    }
    /**
     * Get connected peers
     */
    getConnectedPeers() {
        if (!this.node) {
            return [];
        }
        return this.node.getPeers().map(peerId => peerId.toString());
    }
    /**
     * Check if node is running
     */
    get running() {
        return this.isRunning;
    }
    /**
     * Get libp2p node instance
     */
    get libp2p() {
        return this.node;
    }
}
export default NetworkNode;
//# sourceMappingURL=NetworkNode.js.map