import { ChainEvent, EventType, EntityState, EntityType } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Event handler interface.
 * Each event type has a corresponding handler.
 */
export interface EventHandler<T = any> {
  readonly eventType: EventType;
  
  /** Validate payload beyond schema */
  validate(event: ChainEvent, currentState: EntityState | null): ValidationResult;
  
  /** Check if author is authorized to perform this operation */
  authorize(event: ChainEvent, currentState: EntityState | null): AuthorizationResult;
  
  /** Apply event to produce new state */
  apply(state: T, event: ChainEvent): T;
}

/**
 * Registry for event handlers.
 */
export class EventHandlerRegistry {
  private handlers = new Map<EventType, EventHandler>();

  constructor() {
    this.registerDefaultHandlers();
  }

  register(handler: EventHandler): void {
    this.handlers.set(handler.eventType, handler);
  }

  getHandler(type: EventType): EventHandler | undefined {
    return this.handlers.get(type);
  }

  private registerDefaultHandlers(): void {
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
