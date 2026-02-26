import { ChainEvent, EventType, EntityState } from './types.js';
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
export declare class EventHandlerRegistry {
    private handlers;
    constructor();
    register(handler: EventHandler): void;
    getHandler(type: EventType): EventHandler | undefined;
    private registerDefaultHandlers;
}
//# sourceMappingURL=EventHandler.d.ts.map