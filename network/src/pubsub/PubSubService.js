import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('pubsub');
export class PubSubService extends EventEmitter {
    subscriptions = new Map();
    pendingMessages = new Map();
    config;
    gossipsub = null;
    libp2p = null;
    constructor(config = {}) {
        super();
        this.config = {
            heartbeatInterval: 1000,
            fanoutTTL: 60000,
            gossipInterval: 5000,
            cacheSize: 100,
            ...config,
        };
    }
    async initialize(libp2pNode) {
        this.libp2p = libp2pNode;
        if (libp2pNode.services?.gossipsub) {
            this.gossipsub = libp2pNode.services.gossipsub;
            this.setupGossipsubHandlers();
            log.info('Gossipsub service initialized');
        }
        else {
            log.warn('Gossipsub not available, using in-memory pubsub');
        }
    }
    setupGossipsubHandlers() {
        if (!this.gossipsub)
            return;
        this.gossipsub.on('message', (event) => {
            const { topic, message } = event.detail;
            const msg = {
                id: message.id,
                from: message.from,
                topic,
                type: 'pubsub',
                payload: message.data,
                timestamp: new Date(message.seqno ? Number(message.seqno) : Date.now()),
                priority: 5,
            };
            this.emit('message', msg);
        });
        this.gossipsub.on('subscriptionChange', (event) => {
            const { peerId, subscriptions } = event.detail;
            this.emit('subscription:change', { peerId, subscriptions });
        });
    }
    async subscribe(topic, peerId) {
        const topicPath = this.normalizeTopic(topic);
        if (this.gossipsub) {
            try {
                await this.gossipsub.subscribe(topicPath);
                log.debug({ topic: topicPath }, 'Subscribed to topic via gossipsub');
            }
            catch (error) {
                log.error({ topic: topicPath, error: error.message }, 'Failed to subscribe');
            }
        }
        const peer = peerId || 'local';
        const subs = this.subscriptions.get(topicPath) || new Set();
        subs.add(peer);
        this.subscriptions.set(topicPath, subs);
        this.emit('subscribed', { topic: topicPath, peerId: peer });
    }
    async unsubscribe(topic, peerId) {
        const topicPath = this.normalizeTopic(topic);
        if (this.gossipsub) {
            try {
                await this.gossipsub.unsubscribe(topicPath);
                log.debug({ topic: topicPath }, 'Unsubscribed from topic via gossipsub');
            }
            catch (error) {
                log.error({ topic: topicPath, error: error.message }, 'Failed to unsubscribe');
            }
        }
        const peer = peerId || 'local';
        const subs = this.subscriptions.get(topicPath);
        subs?.delete(peer);
        this.emit('unsubscribed', { topic: topicPath, peerId: peer });
    }
    async publish(topic, message) {
        const topicPath = this.normalizeTopic(topic);
        if (this.gossipsub) {
            try {
                await this.gossipsub.publish(topicPath, message.payload);
                log.debug({ topic: topicPath, messageId: message.id }, 'Published via gossipsub');
            }
            catch (error) {
                log.error({ topic: topicPath, error: error.message }, 'Failed to publish');
            }
        }
        else {
            const pending = this.pendingMessages.get(topicPath) || [];
            pending.push(message);
            if (pending.length > (this.config.cacheSize || 100)) {
                pending.shift();
            }
            this.pendingMessages.set(topicPath, pending);
        }
        this.emit('published', { topic: topicPath, message });
    }
    async publishToTopic(topic, data) {
        const message = {
            id: crypto.randomUUID(),
            from: this.libp2p?.peerId || 'unknown',
            topic,
            type: 'pubsub',
            payload: typeof data === 'string' ? new TextEncoder().encode(data) : data,
            timestamp: new Date(),
            priority: 2,
        };
        await this.publish(topic, message);
    }
    normalizeTopic(topic) {
        if (topic.startsWith('/vivim/'))
            return topic;
        return `/vivim/${topic}`;
    }
    getSubscriptions(peerId) {
        if (peerId) {
            const subs = [];
            for (const [topic, peers] of this.subscriptions) {
                if (peers.has(peerId)) {
                    subs.push(topic);
                }
            }
            return subs;
        }
        return Array.from(this.subscriptions.keys());
    }
    getSubscriberCount(topic) {
        const topicPath = this.normalizeTopic(topic);
        return this.subscriptions.get(topicPath)?.size || 0;
    }
    getTopics() {
        return Array.from(this.subscriptions.keys());
    }
    getMeshPeers(topic) {
        if (!this.gossipsub)
            return [];
        try {
            return this.gossipsub.mesh.get(topic) || [];
        }
        catch {
            return [];
        }
    }
    async getTopicStats(topic) {
        const topicPath = this.normalizeTopic(topic);
        return {
            subscribers: this.getSubscriberCount(topicPath),
            meshPeers: this.getMeshPeers(topicPath).length,
            pendingMessages: this.pendingMessages.get(topicPath)?.length || 0,
        };
    }
    destroy() {
        this.subscriptions.clear();
        this.pendingMessages.clear();
        this.gossipsub = null;
        this.libp2p = null;
    }
}
export const pubSubService = new PubSubService();
//# sourceMappingURL=PubSubService.js.map