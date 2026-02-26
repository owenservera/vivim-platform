import { EventEmitter } from 'events';
import { EventType, EventScope, EntityType } from './types.js';
import { EventStore } from './EventStore.js';
import { ChainDHT } from './ChainDHT.js';
import { GossipSync } from './GossipSync.js';
import { HLClock } from './HLClock.js';
import { EventHandlerRegistry } from './EventHandler.js';
import { calculateCID, signData, publicKeyToDID } from './utils.js';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('chain:client');
/**
 * VivimChainClient is the primary interface for interacting with the VIVIM blockchain.
 */
export class VivimChainClient extends EventEmitter {
    eventStore;
    keyManager;
    pubsub;
    dht;
    chainDht;
    gossipSync;
    hlc;
    registry;
    identityDID = null;
    headEventIds = [];
    constructor(config) {
        super();
        this.keyManager = config.keyManager;
        this.eventStore = new EventStore(config.storage);
        this.pubsub = config.pubsub;
        this.dht = config.dht;
        this.hlc = new HLClock(config.nodeId || crypto.randomUUID().slice(0, 8));
        this.registry = new EventHandlerRegistry();
    }
    /**
     * Initialize identity and load DID.
     */
    async initializeIdentity() {
        let identityKey = this.keyManager.getKeysByType('identity')[0];
        if (!identityKey) {
            identityKey = this.keyManager.generateKey('identity');
        }
        this.identityDID = publicKeyToDID(identityKey.publicKey);
        // Initialize Chain services that depend on identity
        if (this.dht) {
            this.chainDht = new ChainDHT(this.dht);
        }
        if (this.pubsub) {
            this.gossipSync = new GossipSync(this.pubsub, this.identityDID);
            this.setupGossipHandlers();
        }
        log.info({ did: this.identityDID }, 'Identity initialized and Chain services started');
        return this.identityDID;
    }
    setupGossipHandlers() {
        if (!this.gossipSync)
            return;
        this.gossipSync.on('event:received', async (event) => {
            // Update HLC with remote timestamp
            this.hlc.receive(event.timestamp);
            const result = await this.eventStore.processEvent(event);
            if (result.accepted) {
                // Update local DAG heads
                this.updateHeadEvents(event);
                this.emit('event:received', event);
            }
        });
    }
    updateHeadEvents(event) {
        // Basic logic: remove parents of this event from heads, add this event to heads
        this.headEventIds = this.headEventIds.filter(id => !event.parentIds.includes(id));
        if (!this.headEventIds.includes(event.id)) {
            this.headEventIds.push(event.id);
        }
        // Keep a reasonable number of heads
        if (this.headEventIds.length > 10) {
            this.headEventIds.shift();
        }
    }
    /**
     * Create a new signed event.
     */
    async createEvent(params) {
        if (!this.identityDID) {
            throw new Error('Identity not initialized. Call initializeIdentity() first.');
        }
        const identityKey = this.keyManager.getKeysByType('identity')[0];
        if (!identityKey || !identityKey.privateKey) {
            throw new Error('Identity private key not found');
        }
        // 1. Prepare event data
        const eventData = {
            type: params.type,
            author: this.identityDID,
            timestamp: this.hlc.tick(),
            payload: params.payload,
            entityId: params.entityId,
            parentIds: params.parentIds || [...this.headEventIds],
            scope: params.scope || EventScope.PRIVATE,
            tags: params.tags || [],
            version: 1, // TODO: Track version properly per entity
            vectorClock: {},
        };
        // 2. Sign the data
        const signature = await signData(eventData, identityKey.privateKey);
        // 3. Calculate CID for the signed event
        const signedEvent = { ...eventData, signature };
        const cid = await calculateCID(signedEvent);
        signedEvent.id = cid;
        return signedEvent;
    }
    /**
     * Submit an event to the network.
     */
    async submitEvent(event) {
        // 1. Local processing and storage
        const result = await this.eventStore.processEvent(event);
        if (!result.accepted)
            return result;
        // Update local DAG heads
        this.updateHeadEvents(event);
        // 2. Broadcast via GossipSync if available
        if (this.gossipSync && event.scope !== EventScope.SELF) {
            await this.gossipSync.broadcastEvent(event);
        }
        // 3. Register in DHT if public/shared
        if (this.chainDht && event.scope === EventScope.PUBLIC) {
            await this.chainDht.announceEvent(event);
        }
        return result;
    }
    /**
     * Helper to determine PubSub topic based on event type and scope.
     */
    getTopicForEvent(event) {
        if (event.scope === EventScope.PUBLIC) {
            return `/vivim/events/v1/public`;
        }
        if (event.scope === EventScope.CIRCLE && event.payload.circleId) {
            return `/vivim/events/v1/circle/${event.payload.circleId}`;
        }
        return `/vivim/events/v1/user/${event.author}`;
    }
    /**
     * High-level helper to create an entity.
     */
    async createEntity(type, data, options) {
        const entityId = crypto.randomUUID();
        const eventType = this.mapEntityTypeToCreateEvent(type);
        const event = await this.createEvent({
            type: eventType,
            payload: data,
            entityId,
            scope: options?.scope,
            tags: options?.tags
        });
        const result = await this.submitEvent(event);
        return { entityId, eventCid: result.cid };
    }
    mapEntityTypeToCreateEvent(type) {
        switch (type) {
            case EntityType.CONVERSATION: return EventType.CONVERSATION_CREATE;
            case EntityType.MESSAGE: return EventType.MESSAGE_CREATE;
            case EntityType.ACU: return EventType.ACU_CREATE;
            case EntityType.MEMORY: return EventType.MEMORY_CREATE;
            case EntityType.CIRCLE: return EventType.CIRCLE_CREATE;
            case EntityType.PROFILE: return EventType.IDENTITY_CREATE;
            case 'post': return EventType.MESSAGE_CREATE; // Mock post to MESSAGE_CREATE
            default: throw new Error(`Unknown entity type: ${type}`);
        }
    }
    // Getters for services
    getEventStore() { return this.eventStore; }
    getDID() { return this.identityDID; }
}
//# sourceMappingURL=ChainClient.js.map