import { EventEmitter } from 'events';
import { ChainEvent, EventType } from './types.js';
export interface EventFilter {
    types?: EventType[];
    authors?: string[];
    entityIds?: string[];
    tags?: string[];
    since?: number;
    until?: number;
    limit?: number;
}
/**
 * Interface for Event Storage Backend.
 * Allows different implementations for PWA (IndexedDB) and Server (Prisma).
 */
export interface IEventStorage {
    saveEvent(event: ChainEvent): Promise<void>;
    getEvent(cid: string): Promise<ChainEvent | null>;
    queryEvents(filter: EventFilter): Promise<ChainEvent[]>;
    getLatestEvent(entityId: string): Promise<ChainEvent | null>;
}
/**
 * EventStore manages the lifecycle of ChainEvents.
 */
export declare class EventStore extends EventEmitter {
    private storage;
    constructor(storage: IEventStorage);
    /**
     * Process an incoming event from the network or local creation.
     */
    processEvent(event: ChainEvent): Promise<{
        cid: string;
        accepted: boolean;
        error?: string;
    }>;
    getEvent(cid: string): Promise<ChainEvent | null>;
    queryEvents(filter: EventFilter): Promise<ChainEvent[]>;
}
//# sourceMappingURL=EventStore.d.ts.map