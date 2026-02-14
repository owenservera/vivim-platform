/**
 * AI Stream Manager
 * Handles streaming AI responses with automatic retry, heartbeat detection, and reconnection
 * VIVIM Integration - Foundation Layer
 */

import type {
  StreamState,
  ConnectionState,
  ConnectionConfig,
  StreamChunk,
  StreamEvent,
  DEFAULT_CONNECTION_CONFIG,
} from '../types/ai-chat';

/**
 * Stream Manager Options
 */
export interface StreamManagerOptions {
  config?: Partial<ConnectionConfig>;
  onStateChange?: (state: StreamState) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  onEvent?: (event: StreamEvent) => void;
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: string, recoverable: boolean) => void;
}

/**
 * Stream Manager Class
 * Manages streaming connections with resilience features
 */
export class AIStreamManager {
  private config: ConnectionConfig;
  private streamState: StreamState = { status: 'idle' };
  private connectionState: ConnectionState = { status: 'disconnected' };

  private retryCount = 0;
  private chunkCount = 0;
  private lastChunkTime: Date | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectWindowStart: Date | null = null;

  private abortController: AbortController | null = null;
  private eventListeners: Set<(event: StreamEvent) => void> = new Set();

  constructor(private options: StreamManagerOptions = {}) {
    this.config = { ...DEFAULT_CONNECTION_CONFIG, ...options.config };
  }

  // ==================== State Management ====================

  getStreamState(): StreamState {
    return { ...this.streamState };
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  private setStreamState(state: StreamState): void {
    const previous = this.streamState;
    this.streamState = state;
    this.options.onStateChange?.(state);
    this.emitEvent({ type: state.status === 'idle' ? 'abort' : 'chunk', chunk: { id: '', content: '', done: false, timestamp: new Date() } } as StreamEvent);
  }

  private setConnectionState(state: ConnectionState): void {
    const previous = this.connectionState;
    this.connectionState = state;
    this.options.onConnectionChange?.(state);
  }

  // ==================== Stream Operations ====================

  async start(
    streamFn: (signal: AbortSignal) => AsyncGenerator<StreamChunk>,
    conversationId?: string
  ): Promise<void> {
    if (this.streamState.status === 'streaming' || this.streamState.status === 'starting') {
      throw new Error('Stream already in progress');
    }

    this.abortController = new AbortController();
    this.setStreamState({ status: 'starting' });
    this.setConnectionState({ status: 'connecting', attempt: 1 });

    const startTime = Date.now();

    try {
      this.emitEvent({ type: 'start', timestamp: new Date() });
      this.startHeartbeat();

      for await (const chunk of streamFn(this.abortController.signal)) {
        this.lastChunkTime = new Date();
        this.chunkCount++;

        this.setConnectionState({
          status: 'connected',
          latency: Date.now() - startTime,
          lastPing: new Date(),
        });

        this.setStreamState({ status: 'streaming', chunkCount: this.chunkCount });

        this.options.onChunk?.(chunk);
        this.emitEvent({ type: 'chunk', chunk });
      }

      this.stopHeartbeat();
      this.setStreamState({ status: 'done', totalChunks: this.chunkCount });
      this.setConnectionState({ status: 'connected', latency: Date.now() - startTime });
      this.emitEvent({ type: 'done', timestamp: new Date(), totalChunks: this.chunkCount });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isAbort = error instanceof DOMException && error.name === 'AbortError';

      this.stopHeartbeat();

      if (isAbort) {
        this.setStreamState({ status: 'aborted' });
        this.emitEvent({ type: 'abort', reason: 'User aborted' });
        return;
      }

      const recoverable = this.shouldRetry(error);
      this.options.onError?.(errorMessage, recoverable);
      this.emitEvent({ type: 'error', error: errorMessage, recoverable });

      if (recoverable) {
        await this.handleRetry(errorMessage);
      } else {
        this.setConnectionState({ status: 'failed', error: errorMessage, canRetry: false });
        this.setStreamState({ status: 'error', error: errorMessage, retryCount: this.retryCount });
      }
    }
  }

  abort(reason?: string): void {
    if (this.abortController) {
      this.abortController.abort(reason);
    }
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.setStreamState({ status: 'aborted' });
    this.setConnectionState({ status: 'disconnected', reason: 'user' });
    this.emitEvent({ type: 'abort', reason: reason || 'User aborted' });
    this.reset();
  }

  // ==================== Retry Logic ====================

  private shouldRetry(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

    const nonRecoverableErrors = [
      'authentication',
      'unauthorized',
      'forbidden',
      'invalid api key',
      'rate limit',
      'quota exceeded',
    ];

    return !nonRecoverableErrors.some(e => errorMessage.includes(e)) &&
      this.retryCount < this.config.maxRetries;
  }

  private async handleRetry(errorMessage: string): Promise<void> {
    if (this.retryCount >= this.config.maxRetries) {
      this.setConnectionState({ status: 'failed', error: errorMessage, canRetry: false });
      this.setStreamState({ status: 'error', error: errorMessage, retryCount: this.retryCount });
      return;
    }

    this.retryCount++;
    const delay = this.calculateRetryDelay();

    this.setConnectionState({ status: 'reconnecting', attempt: this.retryCount, maxAttempts: this.config.maxRetries, willRetry: true });
    this.setStreamState({ status: 'reconnecting', attempt: this.retryCount, maxAttempts: this.config.maxRetries });
    this.emitEvent({ type: 'reconnecting', attempt: this.retryCount, maxAttempts: this.config.maxRetries });

    await this.delay(delay);
    this.emitEvent({ type: 'retry', attempt: this.retryCount, delay });
  }

  private calculateRetryDelay(): number {
    const baseDelay = Math.min(
      this.config.baseRetryDelay * Math.pow(this.config.backoffMultiplier, this.retryCount - 1),
      this.config.maxRetryDelay
    );
    return baseDelay + baseDelay * (0.1 + Math.random() * 0.1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Heartbeat System ====================

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private checkHeartbeat(): void {
    if (!this.lastChunkTime) {
      this.scheduleHeartbeatTimeout();
      return;
    }

    const elapsed = Date.now() - this.lastChunkTime.getTime();

    if (elapsed > this.config.heartbeatTimeout) {
      this.handleMissedHeartbeat();
    } else {
      this.scheduleHeartbeatTimeout();
    }
  }

  private scheduleHeartbeatTimeout(): void {
    this.heartbeatTimeout = setTimeout(() => {
      if (this.streamState.status === 'streaming') {
        this.handleMissedHeartbeat();
      }
    }, this.config.heartbeatTimeout);
  }

  private handleMissedHeartbeat(): void {
    const missedCount = this.countMissedHeartbeats();

    if (missedCount >= this.config.missedHeartbeatsThreshold) {
      this.setConnectionState({ status: 'failed', error: 'Heartbeat timeout', canRetry: true });
      this.setStreamState({ status: 'error', error: 'Connection heartbeat missed', retryCount: this.retryCount });

      if (this.shouldRetry(new Error('Heartbeat timeout'))) {
        this.handleRetry('Heartbeat timeout');
      }
    } else {
      this.setConnectionState({ status: 'heartbeat-missed', missedCount });
    }
  }

  private countMissedHeartbeats(): number {
    if (!this.lastChunkTime) return this.config.missedHeartbeatsThreshold;
    const elapsed = Date.now() - this.lastChunkTime.getTime();
    return Math.floor(elapsed / this.config.heartbeatTimeout);
  }

  // ==================== Reconnection Window ====================

  startReconnectWindow(): void {
    this.reconnectWindowStart = new Date();
    this.scheduleReconnectTimeout();
  }

  private scheduleReconnectTimeout(): void {
    this.clearReconnectTimeout();

    this.reconnectTimeout = setTimeout(() => {
      if (this.reconnectWindowStart &&
        Date.now() - this.reconnectWindowStart.getTime() > this.config.reconnectWindow) {
        this.setConnectionState({ status: 'failed', error: 'Reconnect window expired', canRetry: false });
      }
    }, this.config.reconnectWindow);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  isWithinReconnectWindow(): boolean {
    if (!this.reconnectWindowStart) return false;
    return Date.now() - this.reconnectWindowStart.getTime() < this.config.reconnectWindow;
  }

  getRemainingReconnectTime(): number {
    if (!this.reconnectWindowStart) return 0;
    const elapsed = Date.now() - this.reconnectWindowStart.getTime();
    return Math.max(0, this.config.reconnectWindow - elapsed);
  }

  // ==================== Event System ====================

  onEvent(callback: (event: StreamEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => {
      this.eventListeners.delete(callback);
    };
  }

  private emitEvent(event: StreamEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  // ==================== Utility Methods ====================

  reset(): void {
    this.retryCount = 0;
    this.chunkCount = 0;
    this.lastChunkTime = null;
    this.reconnectWindowStart = null;
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.setStreamState({ status: 'idle' });
    this.setConnectionState({ status: 'disconnected' });
  }

  getRetryCount(): number {
    return this.retryCount;
  }

  getChunkCount(): number {
    return this.chunkCount;
  }

  getConfig(): ConnectionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  destroy(): void {
    this.abort('Manager destroyed');
    this.eventListeners.clear();
  }
}

/**
 * Singleton stream manager instance
 */
let globalStreamManager: AIStreamManager | null = null;

export function getStreamManager(options?: StreamManagerOptions): AIStreamManager {
  if (!globalStreamManager || options) {
    globalStreamManager = new AIStreamManager(options);
  }
  return globalStreamManager;
}

/**
 * Create a new stream manager instance
 */
export function createStreamManager(options?: StreamManagerOptions): AIStreamManager {
  return new AIStreamManager(options);
}
