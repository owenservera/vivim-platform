/**
 * Libp2p Yjs Provider
 *
 * A Yjs provider that uses libp2p GossipSub for update propagation.
 * This enables truly decentralized P2P synchronization without a signaling server.
 */
import * as Y from 'yjs';
import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('libp2p-yjs');
export class Libp2pYjsProvider extends EventEmitter {
    roomName;
    doc;
    node;
    topic;
    isDestroyed = false;
    constructor(config) {
        super();
        this.roomName = config.roomName;
        this.doc = config.doc;
        this.node = config.node;
        this.topic = `vivim-sync-v1-${config.roomName}`;
        this.init();
    }
    async init() {
        log.info({ room: this.roomName, topic: this.topic }, 'Initializing Libp2p Yjs Provider');
        // Subscribe to the topic
        if (this.node.running) {
            this.subscribe();
        }
        else {
            this.node.on('started', () => this.subscribe());
        }
        // Handle local updates
        this.doc.on('update', this.onDocUpdate);
    }
    subscribe() {
        const libp2p = this.node.libp2p;
        if (!libp2p || !libp2p.services.gossipsub) {
            log.error('Gossipsub service not available on node');
            return;
        }
        libp2p.services.gossipsub.addEventListener('message', (event) => {
            const { topic, data } = event.detail;
            if (topic === this.topic) {
                log.debug({ topic, length: data.length }, 'Received update via GossipSub');
                Y.applyUpdate(this.doc, data, this);
            }
        });
        // @ts-ignore
        libp2p.services.gossipsub.subscribe(this.topic);
        log.info({ topic: this.topic }, 'Subscribed to GossipSub topic');
        // Request state vector from peers to sync up
        this.broadcastStateVector();
    }
    onDocUpdate = (update, origin) => {
        if (origin === this)
            return; // Ignore updates from ourselves (via GossipSub)
        log.debug({ length: update.length }, 'Broadcasting local update via GossipSub');
        this.broadcast(update);
    };
    broadcast(data) {
        if (this.isDestroyed || !this.node.running)
            return;
        const libp2p = this.node.libp2p;
        if (libp2p && libp2p.services.gossipsub) {
            // @ts-ignore
            libp2p.services.gossipsub.publish(this.topic, data).catch(err => {
                log.error({ err: err.message }, 'Failed to publish to GossipSub');
            });
        }
    }
    broadcastStateVector() {
        // In a more advanced implementation, we would send a sync-step-1 (state vector)
        // and wait for sync-step-2 (updates).
        // For simplicity, we just send our full state as an update for now if we are small,
        // or we'd implement the full Yjs sync protocol over GossipSub.
        const stateVector = Y.encodeStateVector(this.doc);
        // Note: Just sending state vector isn't enough, we need to handle the response.
        // For now, let's just send the current state as an update to anyone listening.
        const update = Y.encodeStateAsUpdate(this.doc);
        this.broadcast(update);
    }
    destroy() {
        this.isDestroyed = true;
        this.doc.off('update', this.onDocUpdate);
        const libp2p = this.node.libp2p;
        if (libp2p && libp2p.services.gossipsub) {
            // @ts-ignore
            libp2p.services.gossipsub.unsubscribe(this.topic);
        }
        this.removeAllListeners();
        log.info({ room: this.roomName }, 'Libp2p Yjs Provider destroyed');
    }
}
//# sourceMappingURL=Libp2pYjsProvider.js.map