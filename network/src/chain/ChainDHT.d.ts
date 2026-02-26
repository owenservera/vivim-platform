import { DHTService } from '../dht/DHTService.js';
import { ChainEvent, EntityState } from './types.js';
/**
 * DHT Key Schema for VIVIM Chain
 */
export declare const CHAIN_DHT_KEYS: {
    content: (cid: string) => string;
    entity: (entityId: string) => string;
    authorContent: (did: string) => string;
    tag: (tag: string) => string;
    did: (did: string) => string;
};
/**
 * ChainDHT provides blockchain-specific DHT operations.
 */
export declare class ChainDHT {
    private dhtService;
    constructor(dhtService: DHTService);
    /**
     * Announce an event to the DHT.
     */
    announceEvent(event: ChainEvent): Promise<void>;
    /**
     * Announce entity state to the DHT.
     */
    announceEntityState(state: EntityState): Promise<void>;
    /**
     * Resolve an event by CID.
     */
    resolveEvent(cid: string): Promise<ChainEvent | null>;
    /**
     * Resolve entity state by ID.
     */
    resolveEntityState(entityId: string): Promise<EntityState | null>;
    /**
     * Query CIDs by tag.
     */
    queryByTag(tag: string): Promise<string[]>;
    private putValue;
    private getValue;
    private appendToIndex;
}
//# sourceMappingURL=ChainDHT.d.ts.map