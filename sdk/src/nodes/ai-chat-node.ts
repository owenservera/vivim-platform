/**
 * AI Chat Node - API Node for AI conversations
 * Enhanced with Communication Protocol
 */

import type { VivimSDK } from '../core/sdk.js';
import { generateId } from '../utils/crypto.js';
import {
  CommunicationProtocol,
  createCommunicationProtocol,
  type MessageEnvelope,
  type CommunicationEvent,
  type NodeMetrics,
} from '../core/communication.js';

/**
 * Conversation
 */
export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  messageCount: number;
  totalTokens?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Message
 */
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokenCount?: number;
  toolCalls?: ToolCall[];
}

/**
 * Tool call
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

/**
 * Conversation options
 */
export interface ConversationOptions {
  title?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
}

/**
 * Message options
 */
export interface MessageOptions {
  stream?: boolean;
  tools?: ToolDefinition[];
  context?: ContextItem[];
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Context item
 */
export interface ContextItem {
  type: 'memory' | 'document' | 'url';
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message chunk (for streaming)
 */
export interface MessageChunk {
  type: 'text' | 'tool_call' | 'done' | 'error';
  text?: string;
  toolCall?: ToolCall;
  error?: string;
}

/**
 * Model info
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  capabilities: string[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  before?: string;
}

/**
 * AI Chat Node API
 */
export interface AIChatNodeAPI {
  // Conversations
  createConversation(options?: ConversationOptions): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation>;
  listConversations(): Promise<Conversation[]>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<void>;
  deleteConversation(id: string): Promise<void>;

  // Messages
  sendMessage(conversationId: string, content: string, options?: MessageOptions): Promise<Message>;
  getMessages(conversationId: string, options?: PaginationOptions): Promise<Message[]>;
  editMessage(messageId: string, newContent: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;

  // Streaming
  streamMessage(conversationId: string, content: string, options?: MessageOptions): AsyncIterable<MessageChunk>;

  // Context
  setSystemPrompt(conversationId: string, prompt: string): Promise<void>;
  addContext(conversationId: string, context: ContextItem): Promise<void>;
  clearContext(conversationId: string): Promise<void>;

  // Models
  listModels(): Promise<ModelInfo[]>;
  setModel(conversationId: string, modelId: string): Promise<void>;

  // ACU Extraction
  extractACUs(conversationId: string): Promise<ACUExtractionResult>;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
  sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope>;
  processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope>;
}

/**
 * ACU extraction result
 */
export interface ACUExtractionResult {
  acus: ExtractedACU[];
  extractedAt: number;
}

/**
 * Extracted ACU
 */
export interface ExtractedACU {
  content: string;
  type: string;
  category: string;
  tags: string[];
  sourceMessageIds: string[];
}

/**
 * AI Chat Node Implementation
 */
export class AIChatNode implements AIChatNodeAPI {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private systemPrompts: Map<string, string> = new Map();
  private contextItems: Map<string, ContextItem[]> = new Map();
  private currentModels: Map<string, string> = new Map();
  
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('ai-chat-node');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('message_sent', (event) => {
      console.log(`[AIChatNode] Message sent: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubProcessed = this.communication.onEvent('message_processed', (event) => {
      console.log(`[AIChatNode] Message processed: ${event.messageId}`);
    });
    this.eventUnsubscribe.push(unsubProcessed);
  }

  getNodeId(): string {
    return 'ai-chat-node';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'ai-chat-node',
      messagesSent: 0,
      messagesReceived: 0,
      messagesProcessed: 0,
      messagesFailed: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
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
    };
  }

  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void {
    return this.communication.onEvent('*', listener);
  }

  async sendMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
    const envelope = this.communication.createEnvelope<T>(type, payload, {
      direction: 'outbound',
      priority: 'normal',
    });

    const startTime = Date.now();
    
    try {
      const processed = await this.communication.executeHooks('before_send', envelope);
      this.communication.recordMessageSent(envelope.header.priority);
      
      this.communication.emitEvent({
        type: 'message_sent',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
      });

      const latency = Date.now() - startTime;
      this.communication.recordMessageProcessed(latency);

      return processed;
    } catch (error) {
      this.communication.recordMessageError(String(error));
      throw error;
    }
  }

  async processMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const startTime = Date.now();
    
    try {
      this.communication.recordMessageReceived();
      let processed = await this.communication.executeHooks('before_receive', envelope);
      processed = await this.communication.executeHooks('before_process', processed);
      
      const response = await this.handleMessage(processed);
      const final = await this.communication.executeHooks('after_process', response);
      
      const latency = Date.now() - startTime;
      this.communication.recordMessageProcessed(latency);

      this.communication.emitEvent({
        type: 'message_processed',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
      });

      return final;
    } catch (error) {
      this.communication.recordMessageError(String(error));
      this.communication.emitEvent({
        type: 'message_error',
        nodeId: this.getNodeId(),
        messageId: envelope.header.id,
        timestamp: Date.now(),
        error: String(error),
      });
      throw error;
    }
  }

  private async handleMessage<T>(envelope: MessageEnvelope<T>): Promise<MessageEnvelope> {
    const { header, payload } = envelope;

    switch (header.type) {
      case 'conversation_create':
        const conv = await this.createConversation(payload as ConversationOptions);
        return this.communication.createResponse(envelope, { conversation: conv });

      case 'conversation_list':
        const conversations = await this.listConversations();
        return this.communication.createResponse(envelope, { conversations });

      case 'message_send':
        const { conversationId, content, options } = payload as { conversationId: string; content: string; options?: MessageOptions };
        const message = await this.sendMessage(conversationId, content, options);
        return this.communication.createResponse(envelope, { message });

      case 'models_list':
        const models = await this.listModels();
        return this.communication.createResponse(envelope, { models });

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  // ============================================
  // CONVERSATIONS
  // ============================================

  async createConversation(options: ConversationOptions = {}): Promise<Conversation> {
    const identity = this.sdk.getIdentity();
    if (!identity) throw new Error('Identity not initialized');

    const conversation: Conversation = {
      id: generateId(),
      title: options.title || 'New Conversation',
      provider: options.provider || 'openai',
      model: options.model || 'gpt-4',
      messageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.conversations.set(conversation.id, conversation);
    this.messages.set(conversation.id, []);

    if (options.systemPrompt) {
      this.systemPrompts.set(conversation.id, options.systemPrompt);
    }

    await this.sendMessage('conversation_create', { conversationId: conversation.id, title: conversation.title });

    return conversation;
  }

  async getConversation(id: string): Promise<Conversation> {
    const conversation = this.conversations.get(id);
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  async listConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<void> {
    const conversation = await this.getConversation(id);
    Object.assign(conversation, updates, { updatedAt: Date.now() });
    
    await this.sendMessage('conversation_update', { conversationId: id, updates });
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    this.messages.delete(id);
    this.systemPrompts.delete(id);
    this.contextItems.delete(id);
    this.currentModels.delete(id);
    
    await this.sendMessage('conversation_delete', { conversationId: id });
  }

  // ============================================
  // MESSAGES
  // ============================================

  async sendMessage(
    conversationId: string,
    content: string,
    options: MessageOptions = {}
  ): Promise<Message> {
    const conversation = await this.getConversation(conversationId);

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      conversationId,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    this.messages.get(conversationId)?.push(userMessage);
    conversation.messageCount++;
    conversation.updatedAt = Date.now();

    // Send message event
    await this.sendMessage('message_send', { 
      conversationId, 
      messageId: userMessage.id,
      role: userMessage.role 
    });

    // In a real implementation, this would call the AI provider
    // For now, return a mock assistant response
    const assistantMessage: Message = {
      id: generateId(),
      conversationId,
      role: 'assistant',
      content: `[SDK Mock Response] You said: "${content}"`,
      timestamp: Date.now(),
    };

    this.messages.get(conversationId)?.push(assistantMessage);
    conversation.messageCount++;

    return assistantMessage;
  }

  async getMessages(conversationId: string, options: PaginationOptions = {}): Promise<Message[]> {
    const messages = this.messages.get(conversationId) || [];
    const limit = options.limit || 50;

    if (options.before) {
      const beforeIndex = messages.findIndex(m => m.id === options.before);
      if (beforeIndex > 0) {
        return messages.slice(Math.max(0, beforeIndex - limit), beforeIndex);
      }
    }

    return messages.slice(-limit);
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    for (const messages of this.messages.values()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        message.content = newContent;
        
        await this.sendMessage('message_edit', { messageId, newContent });
        return;
      }
    }
    throw new Error('Message not found');
  }

  async deleteMessage(messageId: string): Promise<void> {
    for (const [conversationId, messages] of this.messages.entries()) {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.splice(index, 1);
        const conversation = this.conversations.get(conversationId);
        if (conversation) {
          conversation.messageCount = messages.length;
        }
        
        await this.sendMessage('message_delete', { messageId });
        return;
      }
    }
    throw new Error('Message not found');
  }

  // ============================================
  // STREAMING
  // ============================================

  async *streamMessage(
    conversationId: string,
    content: string,
    options: MessageOptions = {}
  ): AsyncIterable<MessageChunk> {
    // Send user message first
    await this.sendMessage(conversationId, content, { ...options, stream: false });

    // Emit streaming start event
    await this.sendMessage('stream_start', { conversationId });

    // Mock streaming response
    const response = `[SDK Mock Stream] Processing: "${content}"`;
    
    for (const char of response) {
      yield { type: 'text', text: char };
    }

    yield { type: 'done' };
  }

  // ============================================
  // CONTEXT
  // ============================================

  async setSystemPrompt(conversationId: string, prompt: string): Promise<void> {
    await this.getConversation(conversationId);
    this.systemPrompts.set(conversationId, prompt);
    
    await this.sendMessage('system_prompt_set', { conversationId });
  }

  async addContext(conversationId: string, context: ContextItem): Promise<void> {
    await this.getConversation(conversationId);
    
    if (!this.contextItems.has(conversationId)) {
      this.contextItems.set(conversationId, []);
    }
    
    this.contextItems.get(conversationId)!.push(context);
    
    await this.sendMessage('context_add', { conversationId, contextType: context.type });
  }

  async clearContext(conversationId: string): Promise<void> {
    await this.getConversation(conversationId);
    this.contextItems.delete(conversationId);
    
    await this.sendMessage('context_clear', { conversationId });
  }

  // ============================================
  // MODELS
  // ============================================

  async listModels(): Promise<ModelInfo[]> {
    await this.sendMessage('models_list', {});
    
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        contextWindow: 8192,
        capabilities: ['chat', 'function-calling', 'vision'],
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        contextWindow: 128000,
        capabilities: ['chat', 'function-calling', 'vision'],
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'anthropic',
        contextWindow: 200000,
        capabilities: ['chat', 'vision'],
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        contextWindow: 200000,
        capabilities: ['chat', 'vision'],
      },
    ];
  }

  async setModel(conversationId: string, modelId: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    conversation.model = modelId;
    this.currentModels.set(conversationId, modelId);
    
    await this.sendMessage('model_set', { conversationId, modelId });
  }

  // ============================================
  // ACU EXTRACTION
  // ============================================

  async extractACUs(conversationId: string): Promise<ACUExtractionResult> {
    const messages = await this.getMessages(conversationId);
    
    // Mock ACU extraction - in production this would use AI
    const acus: ExtractedACU[] = [];
    
    for (const message of messages) {
      if (message.role === 'assistant' && message.content.length > 50) {
        acus.push({
          content: message.content.slice(0, 200),
          type: 'insight',
          category: 'general',
          tags: ['extracted'],
          sourceMessageIds: [message.id],
        });
      }
    }

    await this.sendMessage('acu_extract', { conversationId, acuCount: acus.length });

    return {
      acus,
      extractedAt: Date.now(),
    };
  }

  destroy(): void {
    this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
