/**
 * Streaming Context Service
 *
 * Provides real-time context updates during AI conversations.
 */

import { getPrismaClient } from '../lib/database.js';
import { getContextEventBus } from '../context/index.js';
import { logger, createOperationLogger } from '../lib/logger.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

const prisma = getPrismaClient();
const eventBus = getContextEventBus();

interface StreamingContextConfig {
  userId: string;
  conversationId: string;
  initialMessage: string;
  personaId?: string;
}

interface ContextChunk {
  layer: string;
  content: string;
  tokenCount: number;
  priority: number;
  isFinal: boolean;
}

interface ContextStreamState {
  userId: string;
  conversationId: string;
  assembled: boolean;
  currentChunk: number;
  totalChunks: number;
  startTime: number;
}

export class StreamingContextService {
  private pipeline: any;
  private assembler: any;
  private state: Map<string, ContextStreamState> = new Map();

  async preassembleContext(config: StreamingContextConfig): Promise<{
    systemPrompt: string;
    layers: any;
    stats: any;
    assemblyTimeMs: number;
  }> {
    const operationLog = createOperationLogger('preassembleContext', {
      userId: config.userId,
      conversationId: config.conversationId,
    });

    operationLog.debug({ msg: 'Starting context pre-assembly', config });
    const startTime = Date.now();

    try {
      const result = await this.assembleWithCache(config);

      operationLog.debug({
        msg: 'Context pre-assembled',
        tokens: result.budget?.totalUsed,
        assemblyTimeMs: Date.now() - startTime,
      });

      return {
        systemPrompt: result.systemPrompt,
        layers: result.budget,
        stats: result.metadata,
        assemblyTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      operationLog.error({ msg: 'Context pre-assembly failed', error: (error as Error).message });
      await serverErrorReporter.reportServerError(
        'preassembleContext failed',
        error as Error,
        { userId: config.userId, conversationId: config.conversationId },
        'high',
        operationLog.operationId
      );
      throw error;
    }
  }

  async *streamContext(config: StreamingContextConfig): AsyncGenerator<ContextChunk> {
    const operationLog = createOperationLogger('streamContext', {
      userId: config.userId,
      conversationId: config.conversationId,
    });

    const stateKey = `${config.userId}:${config.conversationId}`;

    operationLog.debug({ msg: 'Starting context streaming' });

    this.state.set(stateKey, {
      userId: config.userId,
      conversationId: config.conversationId,
      assembled: false,
      currentChunk: 0,
      totalChunks: 0,
      startTime: Date.now(),
    });

    try {
      const preassembled = await this.preassembleContext(config);

      yield {
        layer: 'full_context',
        content: preassembled.systemPrompt,
        tokenCount: preassembled.stats?.conversationStats?.totalTokens || 0,
        priority: 100,
        isFinal: true,
      };

      const state = this.state.get(stateKey);
      if (state) {
        state.assembled = true;
        state.currentChunk = 1;
        state.totalChunks = 1;
      }

      eventBus.emit('context:stream_complete', config.userId, {
        conversationId: config.conversationId,
        assemblyTimeMs: Date.now() - state!.startTime,
      });

      operationLog.debug({ msg: 'Context streaming complete', chunks: 1 });
    } catch (error) {
      operationLog.error({ msg: 'Context streaming failed', error: (error as Error).message });
      await serverErrorReporter.reportServerError(
        'streamContext failed',
        error as Error,
        { userId: config.userId, conversationId: config.conversationId },
        'high',
        operationLog.operationId
      );
      throw error;
    } finally {
      this.state.delete(stateKey);
    }
  }

  async updateContext(
    userId: string,
    conversationId: string,
    newMessage: string
  ): Promise<{ updated: boolean; newTopics?: string[] }> {
    const operationLog = createOperationLogger('updateContext', { userId, conversationId });
    operationLog.debug({ msg: 'Updating context', newMessageLength: newMessage.length });

    try {
      const stateKey = `${userId}:${conversationId}`;
      const existing = this.state.get(stateKey);

      if (!existing) {
        operationLog.warn({ msg: 'No active context session found' });
        return { updated: false };
      }

      eventBus.emit('context:updated', userId, {
        conversationId,
        trigger: 'new_message',
        timestamp: Date.now(),
      });

      operationLog.debug({ msg: 'Context updated' });
      return { updated: true };
    } catch (error) {
      operationLog.error({ msg: 'Context update failed', error: (error as Error).message });
      return { updated: false };
    }
  }

  getState(userId: string, conversationId: string): ContextStreamState | undefined {
    return this.state.get(`${userId}:${conversationId}`);
  }

  private async assembleWithCache(config: StreamingContextConfig) {
    const operationLog = createOperationLogger('assembleWithCache', {
      userId: config.userId,
      conversationId: config.conversationId,
    });

    try {
      const { unifiedContextService } = await import('../services/unified-context-service.js');

      const result = await unifiedContextService.generateContextForChat(config.conversationId, {
        userId: config.userId,
        userMessage: config.initialMessage,
        personaId: config.personaId,
      });

      operationLog.debug({ msg: 'Context assembled with cache', tokens: result.layers?.totalUsed });

      return {
        systemPrompt: result.systemPrompt,
        budget: result.layers,
        metadata: result.stats,
        bundlesUsed: [],
      };
    } catch (error) {
      operationLog.error({ msg: 'Assembly with cache failed', error: (error as Error).message });
      throw error;
    }
  }
}

export class ContextUpdateSubscriber {
  private subscribers: Map<string, Set<(update: any) => void>> = new Map();

  subscribe(userId: string, conversationId: string, callback: (update: any) => void): () => void {
    const operationLog = createOperationLogger('subscribe', { userId, conversationId });
    const key = `${userId}:${conversationId}`;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);
    operationLog.debug({ msg: 'Subscribed to context updates' });

    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.subscribers.delete(key);
      }
      operationLog.debug({ msg: 'Unsubscribed from context updates' });
    };
  }

  emit(key: string, event: string, data: any) {
    const operationLog = createOperationLogger('emit', { key, event });
    const subs = this.subscribers.get(key);

    if (subs) {
      operationLog.debug({ msg: 'Broadcasting to subscribers', count: subs.size });
      subs.forEach((cb) => {
        try {
          cb({ event, data, timestamp: Date.now() });
        } catch (error) {
          operationLog.error({
            msg: 'Subscriber callback failed',
            error: (error as Error).message,
          });
        }
      });
    }
  }
}

export const streamingContextService = new StreamingContextService();
export const contextUpdateSubscriber = new ContextUpdateSubscriber();

eventBus.on('feed:engagement', async (userId, event) => {
  const operationLog = createOperationLogger('feedEngagementEvent', { userId });
  operationLog.debug({ msg: 'Feed engagement event for context', action: event.action });

  const state = await import('../services/feed-context-integration.js').then((m) =>
    m.getContextState(userId)
  );
  if (state.success) {
    contextUpdateSubscriber.emit(`${userId}:${event.contentId}`, 'context_update', state.state);
  }
});

eventBus.on('context:updated', (userId, event) => {
  const operationLog = createOperationLogger('contextUpdatedEvent', { userId });
  operationLog.debug({ msg: 'Context updated event', conversationId: event.conversationId });

  contextUpdateSubscriber.emit(`${userId}:${event.conversationId}`, 'context_refresh', event);
});

eventBus.on('memory:created', (userId, event) => {
  const operationLog = createOperationLogger('memoryCreatedEvent', { userId });
  operationLog.debug({ msg: 'Memory created event', memoryId: event.memoryId });

  contextUpdateSubscriber.emit(`${userId}`, 'memory_created', event);
});

export default streamingContextService;
