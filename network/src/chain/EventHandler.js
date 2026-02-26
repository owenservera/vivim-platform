import { EventType } from './types.js';
/**
 * Registry for event handlers.
 */
export class EventHandlerRegistry {
    handlers = new Map();
    constructor() {
        this.registerDefaultHandlers();
    }
    register(handler) {
        this.handlers.set(handler.eventType, handler);
    }
    getHandler(type) {
        return this.handlers.get(type);
    }
    registerDefaultHandlers() {
        // We'll implement specific handlers as we go
        this.register({
            eventType: EventType.CONVERSATION_CREATE,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => ({ ...event.payload, messages: [] })
        });
        this.register({
            eventType: EventType.CONVERSATION_UPDATE,
            validate: () => ({ valid: true }),
            authorize: (event, state) => {
                if (state && state.createdBy !== event.author) {
                    return { authorized: false, reason: 'Only owner can update conversation' };
                }
                return { authorized: true };
            },
            apply: (state, event) => ({ ...state, ...event.payload })
        });
        this.register({
            eventType: EventType.MESSAGE_CREATE,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => event.payload
        });
        this.register({
            eventType: EventType.ACU_CREATE,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => event.payload
        });
        this.register({
            eventType: EventType.MEMORY_CREATE,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => event.payload
        });
        this.register({
            eventType: EventType.SOCIAL_FOLLOW,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => event.payload
        });
        this.register({
            eventType: EventType.CIRCLE_CREATE,
            validate: () => ({ valid: true }),
            authorize: () => ({ authorized: true }),
            apply: (state, event) => event.payload
        });
        // Add more default handlers...
    }
}
//# sourceMappingURL=EventHandler.js.map