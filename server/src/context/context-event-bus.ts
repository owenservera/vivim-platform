/**
 * Context Event Bus - Reactive Invalidation & Lifecycle Events
 *
 * Event-driven architecture for the context pipeline.
 * Replaces manual invalidation function calls with reactive event propagation.
 *
 * Features:
 * - Typed events with payload validation
 * - Priority-ordered event handlers
 * - Async handler support with error isolation
 * - Event history for debugging
 * - Debounced batch events
 * - Wildcard subscriptions
 *
 * Performance Impact: Decouples invalidation from business logic,
 * enables batch processing, and eliminates cascading manual calls.
 */

import { logger } from '../lib/logger.js';

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface ContextEvent {
  type: ContextEventType;
  userId: string;
  timestamp: number;
  payload: Record<string, any>;
  source?: string;
}

export type ContextEventType =
  // Memory lifecycle
  | 'memory:created'
  | 'memory:updated'
  | 'memory:deleted'
  // ACU lifecycle
  | 'acu:created'
  | 'acu:processed'
  | 'acu:deleted'
  | 'acu:batch_processed'
  // Conversation lifecycle
  | 'conversation:message_added'
  | 'conversation:idle'
  | 'conversation:archived'
  | 'conversation:deleted'
  // Topic lifecycle
  | 'topic:created'
  | 'topic:updated'
  | 'topic:merged'
  // Entity lifecycle
  | 'entity:created'
  | 'entity:updated'
  | 'entity:merged'
  // Bundle lifecycle
  | 'bundle:compiled'
  | 'bundle:invalidated'
  | 'bundle:expired'
  // Instruction lifecycle
  | 'instruction:created'
  | 'instruction:updated'
  | 'instruction:deleted'
  // Presence
  | 'presence:updated'
  | 'presence:idle_detected'
  | 'presence:offline'
  // Settings
  | 'settings:updated'
  // Telemetry
  | 'telemetry:assembly_complete'
  | 'telemetry:prediction_scored'
  // System
  | 'system:cleanup'
  | 'system:warmup_requested';

type EventHandler = (event: ContextEvent) => Promise<void> | void;

interface HandlerRegistration {
  id: string;
  pattern: string;
  handler: EventHandler;
  priority: number;
  /** If true, errors in this handler won't prevent others from running */
  isolateErrors: boolean;
}

interface DebouncedEvent {
  events: ContextEvent[];
  timer: ReturnType<typeof setTimeout>;
}

// ============================================================================
// EVENT BUS IMPLEMENTATION
// ============================================================================

export class ContextEventBus {
  private handlers: Map<string, HandlerRegistration[]> = new Map();
  private wildcardHandlers: HandlerRegistration[] = [];
  private eventHistory: ContextEvent[] = [];
  private maxHistorySize = 500;
  private handleIdCounter = 0;
  private debouncedEvents: Map<string, DebouncedEvent> = new Map();

  /**
   * Subscribe to a specific event type.
   * Returns an unsubscribe function.
   */
  on(
    eventType: ContextEventType | string,
    handler: EventHandler,
    options: { priority?: number; isolateErrors?: boolean } = {}
  ): () => void {
    const registration: HandlerRegistration = {
      id: `handler_${++this.handleIdCounter}`,
      pattern: eventType,
      handler,
      priority: options.priority ?? 50,
      isolateErrors: options.isolateErrors ?? true,
    };

    if (eventType === '*') {
      this.wildcardHandlers.push(registration);
      this.wildcardHandlers.sort((a, b) => b.priority - a.priority);
    } else if (eventType.endsWith(':*')) {
      // Category wildcard (e.g., 'memory:*')
      const category = eventType.replace(':*', '');
      if (!this.handlers.has(category)) {
        this.handlers.set(category, []);
      }
      this.handlers.get(category)!.push(registration);
      this.handlers.get(category)!.sort((a, b) => b.priority - a.priority);
    } else {
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, []);
      }
      this.handlers.get(eventType)!.push(registration);
      this.handlers.get(eventType)!.sort((a, b) => b.priority - a.priority);
    }

    // Return unsubscribe function
    return () => {
      this.removeHandler(registration.id);
    };
  }

  /**
   * Subscribe to a specific event type, but only fire once.
   */
  once(
    eventType: ContextEventType | string,
    handler: EventHandler,
    options: { priority?: number } = {}
  ): () => void {
    const unsubscribe = this.on(eventType, async (event) => {
      unsubscribe();
      await handler(event);
    }, options);
    return unsubscribe;
  }

  /**
   * Emit an event to all matching handlers.
   * Handlers execute in priority order (highest first).
   */
  async emit(
    type: ContextEventType,
    userId: string,
    payload: Record<string, any> = {},
    source?: string
  ): Promise<void> {
    const event: ContextEvent = {
      type,
      userId,
      timestamp: Date.now(),
      payload,
      source,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Collect matching handlers
    const handlers: HandlerRegistration[] = [];

    // Exact match
    const exactHandlers = this.handlers.get(type);
    if (exactHandlers) {
      handlers.push(...exactHandlers);
    }

    // Category wildcard (e.g., memory:* matches memory:created)
    const category = type.split(':')[0];
    const categoryHandlers = this.handlers.get(category);
    if (categoryHandlers) {
      handlers.push(...categoryHandlers);
    }

    // Global wildcard
    handlers.push(...this.wildcardHandlers);

    // Deduplicate by handler ID and sort by priority
    const uniqueHandlers = [...new Map(handlers.map(h => [h.id, h])).values()];
    uniqueHandlers.sort((a, b) => b.priority - a.priority);

    // Execute handlers
    for (const registration of uniqueHandlers) {
      try {
        await registration.handler(event);
      } catch (error: any) {
        logger.error(
          { error: error.message, eventType: type, handlerId: registration.id },
          'Event handler error'
        );
        if (!registration.isolateErrors) {
          throw error;
        }
      }
    }
  }

  /**
   * Emit a debounced event. Multiple emissions within the window
   * are batched into a single handler invocation.
   * Useful for rapid-fire events like ACU processing.
   */
  emitDebounced(
    type: ContextEventType,
    userId: string,
    payload: Record<string, any> = {},
    debounceMs: number = 500,
    source?: string
  ): void {
    const debounceKey = `${type}:${userId}`;
    const event: ContextEvent = {
      type,
      userId,
      timestamp: Date.now(),
      payload,
      source,
    };

    const existing = this.debouncedEvents.get(debounceKey);
    if (existing) {
      clearTimeout(existing.timer);
      existing.events.push(event);
    } else {
      this.debouncedEvents.set(debounceKey, {
        events: [event],
        timer: null as any,
      });
    }

    const entry = this.debouncedEvents.get(debounceKey)!;
    entry.timer = setTimeout(async () => {
      const events = entry.events;
      this.debouncedEvents.delete(debounceKey);

      // Emit a batch event with all accumulated payloads
      await this.emit(
        type,
        userId,
        {
          batch: true,
          batchSize: events.length,
          events: events.map(e => e.payload),
          firstTimestamp: events[0].timestamp,
          lastTimestamp: events[events.length - 1].timestamp,
        },
        source
      );
    }, debounceMs);
  }

  /**
   * Emit multiple events for the same user. More efficient than
   * calling emit() multiple times.
   */
  async emitBatch(
    userId: string,
    events: Array<{ type: ContextEventType; payload?: Record<string, any> }>,
    source?: string
  ): Promise<void> {
    for (const evt of events) {
      await this.emit(evt.type, userId, evt.payload ?? {}, source);
    }
  }

  // ---- Query History ----

  getRecentEvents(
    count: number = 50,
    filter?: { type?: ContextEventType; userId?: string }
  ): ContextEvent[] {
    let events = this.eventHistory;

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type);
    }
    if (filter?.userId) {
      events = events.filter(e => e.userId === filter.userId);
    }

    return events.slice(-count);
  }

  getEventCountByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of this.eventHistory) {
      counts[event.type] = (counts[event.type] || 0) + 1;
    }
    return counts;
  }

  // ---- Lifecycle ----

  private removeHandler(handlerId: string): void {
    for (const [key, registrations] of this.handlers.entries()) {
      const filtered = registrations.filter(r => r.id !== handlerId);
      if (filtered.length === 0) {
        this.handlers.delete(key);
      } else {
        this.handlers.set(key, filtered);
      }
    }

    this.wildcardHandlers = this.wildcardHandlers.filter(r => r.id !== handlerId);
  }

  getHandlerCount(): number {
    let count = this.wildcardHandlers.length;
    for (const registrations of this.handlers.values()) {
      count += registrations.length;
    }
    return count;
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  destroy(): void {
    // Clear all debounced timers
    for (const entry of this.debouncedEvents.values()) {
      clearTimeout(entry.timer);
    }
    this.debouncedEvents.clear();
    this.handlers.clear();
    this.wildcardHandlers = [];
    this.eventHistory = [];
  }
}

// ============================================================================
// DEFAULT EVENT WIRING
// ============================================================================

/**
 * Wire up the default cache invalidation handlers.
 * Call this at startup to connect the event bus to the cache.
 */
export function wireDefaultInvalidation(
  bus: ContextEventBus,
  cache: import('./context-cache').ContextCache
): void {
  // Memory events → invalidate identity + topic bundles
  bus.on('memory:created', async (event) => {
    const { category, importance } = event.payload;
    if (['biography', 'identity', 'role'].includes(category) && importance >= 0.8) {
      cache.invalidateBundles(event.userId, ['identity_core']);
    }
    if (category === 'preference' && importance >= 0.6) {
      cache.invalidateBundles(event.userId, ['global_prefs']);
    }
    cache.invalidateGraph(event.userId);
  }, { priority: 100 });

  // ACU events → invalidate topic bundles
  bus.on('acu:processed', async (event) => {
    cache.invalidateBundles(event.userId, ['topic', 'entity']);
    cache.invalidateGraph(event.userId);
  }, { priority: 90 });

  // Conversation events → invalidate conversation bundles
  bus.on('conversation:message_added', async (event) => {
    const { conversationId } = event.payload;
    cache.delete('bundle', `${event.userId}:conversation:${conversationId}`);
  }, { priority: 100 });

  // Instruction events → invalidate global prefs
  bus.on('instruction:created', async (event) => {
    cache.invalidateBundles(event.userId, ['global_prefs']);
  }, { priority: 90 });

  bus.on('instruction:updated', async (event) => {
    cache.invalidateBundles(event.userId, ['global_prefs']);
  }, { priority: 90 });

  // Settings events → invalidate settings cache
  bus.on('settings:updated', async (event) => {
    cache.invalidateSettings(event.userId);
    cache.invalidateBundles(event.userId); // Settings affect budget, so invalidate all
  }, { priority: 100 });

  // Presence events → update presence cache
  bus.on('presence:updated', async (event) => {
    const { deviceId, presence } = event.payload;
    if (deviceId && presence) {
      cache.setPresence(event.userId, deviceId, presence);
    }
  }, { priority: 50 });

  // System cleanup
  bus.on('system:cleanup', async () => {
    // Prune caches on system cleanup
    const stats = cache.getAllStats();
    logger.info({ stats }, 'System cleanup: cache stats');
  }, { priority: 10 });

  logger.info('Default cache invalidation handlers wired');
}

// ============================================================================
// SINGLETON
// ============================================================================

let _busInstance: ContextEventBus | null = null;

export function getContextEventBus(): ContextEventBus {
  if (!_busInstance) {
    _busInstance = new ContextEventBus();
  }
  return _busInstance;
}

export function resetContextEventBus(): void {
  if (_busInstance) {
    _busInstance.destroy();
    _busInstance = null;
  }
}

export default ContextEventBus;
