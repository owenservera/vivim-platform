import { ChainEvent, EntityState, EntityType } from './types.js';
import { EventHandlerRegistry } from './EventHandler.js';
/**
 * StateMachine derives entity state by replaying events.
 */
export declare class StateMachine {
    private registry;
    constructor(registry?: EventHandlerRegistry);
    /**
     * Derive the state of an entity from a log of events.
     */
    deriveState(entityId: string, type: EntityType, events: ChainEvent[]): EntityState;
}
//# sourceMappingURL=StateMachine.d.ts.map