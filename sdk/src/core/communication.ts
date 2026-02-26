/**
 * Communication Protocol Layer
 * 
 * Provides standardized communication primitives for all nodes:
 * - Message envelopes with headers
 * - Protocol versioning
 * - Message types and patterns
 * - Introspection hooks
 * - Evolution support
 */

import { generateId } from '../utils/crypto.js';

/**
 * Protocol version
 */
export const PROTOCOL_VERSION = '1.0.0';

/**
 * Message priority levels
 */
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

/**
 * Message direction
 */
export type MessageDirection = 'inbound' | 'outbound' | 'internal';

/**
 * Message envelope header
 */
export interface MessageHeader {
  id: string;
  type: string;
  version: string;
  timestamp: number;
  priority: MessagePriority;
  direction: MessageDirection;
  sourceNode: string;
  targetNode?: string;
  correlationId?: string;
  replyTo?: string;
  ttl?: number;
  flags: MessageFlags;
}

/**
 * Message flags
 */
export interface MessageFlags {
  encrypted: boolean;
  signed: boolean;
  verified: boolean;
  compressed: boolean;
  idempotent: boolean;
  stream: boolean;
}

/**
 * Message envelope
 */
export interface MessageEnvelope<T = unknown> {
  header: MessageHeader;
  payload: T;
  signature?: string;
}

/**
 * Communication event types
 */
export type CommunicationEventType = 
  | 'message_sent'
  | 'message_received'
  | 'message_processed'
  | 'message_error'
  | 'protocol_error'
  | 'connection_established'
  | 'connection_closed'
  | 'timeout'
  | 'retry'
  | 'circuit_breaker_open'
  | 'circuit_breaker_closed';

/**
 * Communication event
 */
export interface CommunicationEvent {
  type: CommunicationEventType;
  nodeId: string;
  messageId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Node metrics
 */
export interface NodeMetrics {
  nodeId: string;
  messagesSent: number;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  lastMessageAt: number;
  uptime: number;
  errorsByType: Record<string, number>;
  requestsByPriority: Record<MessagePriority, number>;
}

/**
 * Communication state
 */
export interface CommunicationState {
  nodeId: string;
  isConnected: boolean;
  lastError?: string;
  messageQueueSize: number;
  processingQueue: number;
}

/**
 * Hook types for communication
 */
export type CommunicationHookType = 
  | 'before_send'
  | 'after_send'
  | 'before_receive'
  | 'after_receive'
  | 'before_process'
  | 'after_process'
  | 'on_error'
  | 'on_timeout';

/**
 * Communication hook
 */
export interface CommunicationHook {
  id: string;
  type: CommunicationHookType;
  nodeId: string;
  handler: (envelope: MessageEnvelope) => MessageEnvelope | Promise<MessageEnvelope>;
  priority: number;
  enabled: boolean;
}

/**
 * Middleware stage
 */
export type MiddlewareStage = 'auth' | 'validate' | 'transform' | 'rate_limit' | 'process' | 'respond';

/**
 * Middleware
 */
export interface Middleware {
  id: string;
  name: string;
  stage: MiddlewareStage;
  nodeId: string;
  process: (envelope: MessageEnvelope) => MessageEnvelope | Promise<MessageEnvelope>;
  config?: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Protocol capability
 */
export interface ProtocolCapability {
  id: string;
  name: string;
  version: string;
  description: string;
  parameters?: Record<string, unknown>;
}

/**
 * Evolution event
 */
export interface EvolutionEvent {
  type: 'capability_added' | 'capability_removed' | 'protocol_upgraded' | 'migration_required';
  version: string;
  timestamp: number;
  description: string;
  data?: Record<string, unknown>;
}

/**
 * Communication Protocol Handler
 * Provides base functionality for all node communications
 */
export class CommunicationProtocol {
  private hooks: Map<string, CommunicationHook[]> = new Map();
  private middlewares: Map<string, Middleware[]> = new Map();
  private metrics: Map<string, NodeMetrics> = new Map();
  private eventListeners: Map<string, Set<(event: CommunicationEvent) => void>> = new Map();

  constructor(private nodeId: string) {
    this.initMetrics(nodeId);
  }

  private initMetrics(nodeId: string): void {
    this.metrics.set(nodeId, {
      nodeId,
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      lastMessageAt: 0,
      uptime: Date.now(),
      errorsByType: {},
      requestsByPriority: {
        critical: 0,
        high: 0,
        normal: 0,
        low: 0,
        background: 0,
      },
    });
  }

  /**
   * Create a message envelope
   */
  createEnvelope<T>(
    type: string,
    payload: T,
    options: Partial<Omit<MessageHeader, 'id' | 'type' | 'version' | 'timestamp'>> = {}
  ): MessageEnvelope<T> {
    const header: MessageHeader = {
      id: generateId(),
      type,
      version: PROTOCOL_VERSION,
      timestamp: Date.now(),
      priority: options.priority || 'normal',
      direction: options.direction || 'internal',
      sourceNode: options.sourceNode || this.nodeId,
      targetNode: options.targetNode,
      correlationId: options.correlationId,
      replyTo: options.replyTo,
      ttl: options.ttl,
      flags: {
        encrypted: false,
        signed: false,
        verified: false,
        compressed: false,
        idempotent: false,
        stream: false,
        ...options.flags,
      },
    };

    return { header, payload };
  }

  /**
   * Register a communication hook
   */
  registerHook(hook: CommunicationHook): void {
    const hooks = this.hooks.get(hook.type) || [];
    hooks.push(hook);
    hooks.sort((a, b) => b.priority - a.priority);
    this.hooks.set(hook.type, hooks);
  }

  /**
   * Unregister a hook
   */
  unregisterHook(hookId: string): void {
    for (const [type, hooks] of this.hooks.entries()) {
      const filtered = hooks.filter(h => h.id !== hookId);
      if (filtered.length !== hooks.length) {
        this.hooks.set(type, filtered);
        break;
      }
    }
  }

  /**
   * Execute hooks for a specific type
   */
  async executeHooks(type: CommunicationHookType, envelope: MessageEnvelope): Promise<MessageEnvelope> {
    const hooks = this.hooks.get(type) || [];
    let result = envelope;

    for (const hook of hooks) {
      if (hook.enabled && hook.nodeId === this.nodeId) {
        result = await hook.handler(result);
      }
    }

    return result;
  }

  /**
   * Register middleware
   */
  registerMiddleware(middleware: Middleware): void {
    const middlewares = this.middlewares.get(middleware.stage) || [];
    middlewares.push(middleware);
    this.middlewares.set(middleware.stage, middlewares);
  }

  /**
   * Execute middleware chain
   */
  async executeMiddlewares(envelope: MessageEnvelope): Promise<MessageEnvelope> {
    const stages: MiddlewareStage[] = ['auth', 'validate', 'transform', 'rate_limit', 'process', 'respond'];
    let result = envelope;

    for (const stage of stages) {
      const middlewares = this.middlewares.get(stage) || [];
      for (const middleware of middlewares) {
        if (middleware.enabled) {
          result = await middleware.process(result);
        }
      }
    }

    return result;
  }

  /**
   * Record a communication event
   */
  emitEvent(event: CommunicationEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => listener(event));
    }

    // Also emit to 'all' listeners
    const allListeners = this.eventListeners.get('*');
    if (allListeners) {
      allListeners.forEach(listener => listener(event));
    }
  }

  /**
   * Subscribe to communication events
   */
  onEvent(type: string, listener: (event: CommunicationEvent) => void): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(type)?.delete(listener);
    };
  }

  /**
   * Update metrics after sending a message
   */
  recordMessageSent(priority: MessagePriority): void {
    const metrics = this.metrics.get(this.nodeId);
    if (metrics) {
      metrics.messagesSent++;
      metrics.requestsByPriority[priority]++;
      metrics.lastMessageAt = Date.now();
    }
  }

  /**
   * Update metrics after receiving a message
   */
  recordMessageReceived(): void {
    const metrics = this.metrics.get(this.nodeId);
    if (metrics) {
      metrics.messagesReceived++;
    }
  }

  /**
   * Record message processing with latency
   */
  recordMessageProcessed(latencyMs: number): void {
    const metrics = this.metrics.get(this.nodeId);
    if (metrics) {
      metrics.messagesProcessed++;
      
      // Update latency metrics
      const count = metrics.messagesProcessed;
      metrics.averageLatency = ((metrics.averageLatency * (count - 1)) + latencyMs) / count;
      metrics.maxLatency = Math.max(metrics.maxLatency, latencyMs);
      metrics.minLatency = Math.min(metrics.minLatency, latencyMs);
    }
  }

  /**
   * Record message failure
   */
  recordMessageError(errorType: string): void {
    const metrics = this.metrics.get(this.nodeId);
    if (metrics) {
      metrics.messagesFailed++;
      metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): NodeMetrics | undefined {
    return this.metrics.get(this.nodeId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, NodeMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get communication state
   */
  getState(): CommunicationState {
    const metrics = this.metrics.get(this.nodeId);
    return {
      nodeId: this.nodeId,
      isConnected: true,
      messageQueueSize: 0,
      processingQueue: 0,
    };
  }

  /**
   * Validate envelope structure
   */
  validateEnvelope(envelope: MessageEnvelope): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!envelope.header?.id) {
      errors.push('Missing message ID');
    }
    if (!envelope.header?.type) {
      errors.push('Missing message type');
    }
    if (!envelope.header?.version) {
      errors.push('Missing protocol version');
    }
    if (!envelope.payload) {
      errors.push('Missing payload');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a response envelope
   */
  createResponse<T>(original: MessageEnvelope, payload: T): MessageEnvelope<T> {
    return this.createEnvelope(`${original.header.type}_response`, payload, {
      direction: 'outbound',
      correlationId: original.header.id,
      replyTo: original.header.id,
      targetNode: original.header.sourceNode,
    });
  }

  /**
   * Check if message has expired
   */
  isMessageExpired(envelope: MessageEnvelope): boolean {
    if (!envelope.header.ttl) return false;
    const age = Date.now() - envelope.header.timestamp;
    return age > envelope.header.ttl;
  }
}

/**
 * Create a communication protocol instance for a node
 */
export function createCommunicationProtocol(nodeId: string): CommunicationProtocol {
  return new CommunicationProtocol(nodeId);
}

/**
 * Serialize envelope for transmission
 */
export function serializeEnvelope(envelope: MessageEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Deserialize envelope from transmission
 */
export function deserializeEnvelope<T>(data: string): MessageEnvelope<T> {
  return JSON.parse(data) as MessageEnvelope<T>;
}
