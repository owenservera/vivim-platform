import { EventEmitter } from 'events';
import { ChainEvent, EventType, EventScope, EntityType } from './types.js';
import { EventStore, IEventStorage } from './EventStore.js';
import { KeyManager } from '../security/KeyManager.js';
import { PubSubService } from '../pubsub/PubSubService.js';
import { DHTService } from '../dht/DHTService.js';
export interface ChainClientConfig {
    keyManager: KeyManager;
    storage: IEventStorage;
    pubsub?: PubSubService;
    dht?: DHTService;
    nodeId?: string;
}
/**
 * VivimChainClient is the primary interface for interacting with the VIVIM blockchain.
 */
export declare class VivimChainClient extends EventEmitter {
    private eventStore;
    private keyManager;
    private pubsub?;
    private dht?;
    private chainDht?;
    private gossipSync?;
    private hlc;
    private registry;
    private identityDID;
    private headEventIds;
    constructor(config: ChainClientConfig);
    /**
     * Initialize identity and load DID.
     */
    initializeIdentity(): Promise<string>;
    private setupGossipHandlers;
    private updateHeadEvents;
    /**
     * Create a new signed event.
     */
    createEvent(params: {
        type: EventType;
        payload: any;
        entityId?: string;
        parentIds?: string[];
        scope?: EventScope;
        tags?: string[];
    }): Promise<ChainEvent>;
    /**
     * Submit an event to the network.
     */
    submitEvent(event: ChainEvent): Promise<{
        cid: string;
        accepted: boolean;
    }>;
    /**
     * Helper to determine PubSub topic based on event type and scope.
     */
    private getTopicForEvent;
    /**
     * High-level helper to create an entity.
     */
    createEntity(type: EntityType, data: any, options?: {
        scope?: EventScope;
        tags?: string[];
    }): Promise<{
        entityId: string;
        eventCid: string;
    }>;
    private mapEntityTypeToCreateEvent;
    getEventStore(): EventStore;
    getDID(): string | null;
}
//# sourceMappingURL=ChainClient.d.ts.map