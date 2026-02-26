import { EventEmitter } from 'events';
import { createModuleLogger } from '../utils/logger.js';
import { canonicalStringify } from './utils.js';
const log = createModuleLogger('chain:gossip-sync');
/**
 * Gossip Topics for VIVIM Chain
 */
export const GOSSIP_TOPICS = {
    // Global stream of all public events
    globalEvents: '/vivim/events/v1/global',
    // Specific topics for entities
    entity: (entityId) => `/vivim/events/v1/e/${entityId}`,
    // Specific topics for users
    user: (did) => `/vivim/events/v1/u/${did}`,
    // Specific topics for circles
    circle: (circleId) => `/vivim/events/v1/c/${circleId}`,
};
/**
 * GossipSync manages the propagation of events and state over GossipSub.
 */
export class GossipSync extends EventEmitter {
    pubsub;
    identityDID;
    constructor(pubsub, identityDID) {
        super();
        this.pubsub = pubsub;
        this.identityDID = identityDID;
        this.setupHandlers();
    }
    /**
     * Broadcast an event to the network.
     */
    async broadcastEvent(event) {
        const message = {
            type: 'event',
            data: event,
            sender: this.identityDID
        };
        const topics = this.getTargetTopics(event);
        const data = canonicalStringify(message);
        for (const topic of topics) {
            await this.pubsub.publishToTopic(topic, data);
        }
        log.debug({ cid: event.id, topics }, 'Event broadcasted via GossipSync');
    }
    /**
     * Subscribe to necessary topics.
     */
    async subscribeToUser(did) {
        await this.pubsub.subscribe(GOSSIP_TOPICS.user(did));
    }
    async subscribeToEntity(entityId) {
        await this.pubsub.subscribe(GOSSIP_TOPICS.entity(entityId));
    }
    /**
     * Request missing events from peers for an entity.
     */
    async requestSync(entityId, vectorClock) {
        const message = {
            type: 'request',
            data: { entityId, vectorClock },
            sender: this.identityDID
        };
        await this.pubsub.publishToTopic(GOSSIP_TOPICS.entity(entityId), canonicalStringify(message));
    }
    setupHandlers() {
        const handler = (msg) => {
            try {
                const payloadStr = typeof msg.payload === 'string'
                    ? msg.payload
                    : new TextDecoder().decode(msg.payload);
                const syncMsg = JSON.parse(payloadStr);
                this.handleSyncMessage(syncMsg);
            }
            catch (e) {
                // Ignore parsing errors
            }
        };
        this.pubsub.on('message', handler);
        this.pubsub.on('published', (data) => handler(data.message));
    }
    handleSyncMessage(msg) {
        if (msg.sender === this.identityDID) {
            return;
        }
        switch (msg.type) {
            case 'event':
                this.emit('event:received', msg.data);
                break;
            case 'request':
                this.emit('sync:requested', msg.data, msg.sender);
                break;
            case 'response':
                this.emit('sync:responded', msg.data, msg.sender);
                break;
            case 'vector_clock':
                this.emit('vector_clock:received', msg.data, msg.sender);
                break;
        }
    }
    getTargetTopics(event) {
        const topics = [GOSSIP_TOPICS.user(event.author)];
        if (event.scope === 'public') {
            topics.push(GOSSIP_TOPICS.globalEvents);
        }
        if (event.entityId) {
            topics.push(GOSSIP_TOPICS.entity(event.entityId));
        }
        if (event.payload.circleId) {
            topics.push(GOSSIP_TOPICS.circle(event.payload.circleId));
        }
        return topics;
    }
}
//# sourceMappingURL=GossipSync.js.map