import { EventEmitter } from 'events';
import { PubSubService } from '../pubsub/PubSubService.js';
import { ChainEvent } from './types.js';
/**
 * Gossip Topics for VIVIM Chain
 */
export declare const GOSSIP_TOPICS: {
    globalEvents: string;
    entity: (entityId: string) => string;
    user: (did: string) => string;
    circle: (circleId: string) => string;
};
export type SyncMessageType = 'event' | 'request' | 'response' | 'vector_clock';
export interface SyncMessage {
    type: SyncMessageType;
    data: any;
    sender: string;
}
/**
 * GossipSync manages the propagation of events and state over GossipSub.
 */
export declare class GossipSync extends EventEmitter {
    private pubsub;
    private identityDID;
    constructor(pubsub: PubSubService, identityDID: string);
    /**
     * Broadcast an event to the network.
     */
    broadcastEvent(event: ChainEvent): Promise<void>;
    /**
     * Subscribe to necessary topics.
     */
    subscribeToUser(did: string): Promise<void>;
    subscribeToEntity(entityId: string): Promise<void>;
    /**
     * Request missing events from peers for an entity.
     */
    requestSync(entityId: string, vectorClock: Record<string, number>): Promise<void>;
    private setupHandlers;
    private handleSyncMessage;
    private getTargetTopics;
}
//# sourceMappingURL=GossipSync.d.ts.map