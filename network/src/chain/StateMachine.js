import { EventHandlerRegistry } from './EventHandler.js';
import { HLClock } from './HLClock.js';
import { createModuleLogger } from '../utils/logger.js';
const log = createModuleLogger('chain:state-machine');
/**
 * StateMachine derives entity state by replaying events.
 */
export class StateMachine {
    registry;
    constructor(registry) {
        this.registry = registry || new EventHandlerRegistry();
    }
    /**
     * Derive the state of an entity from a log of events.
     */
    deriveState(entityId, type, events) {
        // Sort events by HLC timestamp and version
        const sortedEvents = [...events].sort((a, b) => {
            const hlcCmp = HLClock.compare(a.timestamp, b.timestamp);
            if (hlcCmp !== 0)
                return hlcCmp;
            return a.version - b.version;
        });
        let state = {};
        let version = 0;
        let createdBy = '';
        let createdAt = 0;
        let lastUpdatedHLC = '';
        let updatedBy = '';
        let updatedAt = 0;
        const vectorClock = {};
        for (const event of sortedEvents) {
            if (event.entityId !== entityId)
                continue;
            const handler = this.registry.getHandler(event.type);
            if (handler) {
                // 1. Validate
                // const validation = handler.validate(event, currentState); 
                // 2. Authorize
                // const auth = handler.authorize(event, currentState);
                state = handler.apply(state, event);
            }
            else {
                log.warn({ type: event.type }, 'No handler found for event type');
                state = { ...state, ...event.payload };
            }
            version = Math.max(version, event.version);
            const physicalMs = parseInt(event.timestamp.split(':')[0], 10);
            updatedAt = Math.max(updatedAt, physicalMs);
            updatedBy = event.author;
            lastUpdatedHLC = event.timestamp;
            if (!createdBy) {
                createdBy = event.author;
                createdAt = physicalMs;
            }
            // Update vector clock
            vectorClock[event.author] = Math.max(vectorClock[event.author] || 0, event.version);
        }
        return {
            id: entityId,
            type,
            version,
            state,
            createdBy,
            createdAt,
            updatedBy,
            updatedAt,
            eventLog: sortedEvents.map(e => e.id),
            vectorClock,
        };
    }
}
//# sourceMappingURL=StateMachine.js.map