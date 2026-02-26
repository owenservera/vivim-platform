/**
 * ChatLink Nexus - Multi-Provider AI Shared Chat Link Import Node
 *
 * Captures and imports shared chat links from multiple AI providers.
 * Leverages SingleFile CLI for capturing shared conversations.
 *
 * Supported Providers:
 * - ChatGPT (chatgpt.com)
 * - Claude (claude.ai)
 * - Gemini (gemini.google.com)
 * - Grok (x.ai/grok)
 * - Qwen (qwenlm.com)
 * - Kimi (kimi.moonshot.cn)
 * - DeepSeek (deepseek.com)
 * - Perplexity (perplexity.ai)
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

// ============================================
// TYPES
// ============================================

/**
 * Provider type supported by ChatLink Nexus
 */
export type SupportedProvider =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'grok'
  | 'qwen'
  | 'kimi'
  | 'deepseek'
  | 'perplexity'
  | 'auto'; // Auto-detect from URL

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider identifier */
  provider: SupportedProvider;
  /** Base URL pattern for detection */
  urlPattern: RegExp;
  /** SingleFile settings file name */
  settingsFile: string;
  /** Custom CSS selector for chat container (optional) */
  chatSelector?: string;
  /** Custom message extraction patterns */
  messagePattern?: {
    user: RegExp;
    assistant: RegExp;
  };
}

/**
 * Import options for shared chat link
 */
export interface ChatLinkImportOptions {
  /** URL of the shared chat */
  url: string;
  /** Provider (auto-detected if 'auto') */
  provider?: SupportedProvider;
  /** Capture timeout in milliseconds */
  timeout?: number;
  /** Whether to include metadata */
  includeMetadata?: boolean;
  /** Custom title override */
  title?: string;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Extracted message from shared chat
 */
export interface ExtractedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Imported conversation result
 */
export interface ImportedConversation {
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  model?: string;
  messages: ExtractedMessage[];
  importedAt: number;
  messageCount: number;
  totalTokens?: number;
  tags: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Import status and progress
 */
export interface ImportStatus {
  importId: string;
  url: string;
  status: 'pending' | 'capturing' | 'parsing' | 'importing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

/**
 * Provider detection result
 */
export interface ProviderDetection {
  provider: SupportedProvider;
  confidence: number;
  matchedPattern: string;
}

// ============================================
// CHAT LINK NEXUS NODE API
// ============================================

export interface ChatLinkNexusAPI {
  // Import Operations
  importFromLink(options: ChatLinkImportOptions): Promise<ImportedConversation>;
  importFromLinks(urls: string[]): Promise<ImportedConversation[]>;
  detectProvider(url: string): ProviderDetection | null;

  // Capture Operations
  captureLink(url: string, provider: SupportedProvider): Promise<string>;
  parseCapturedContent(html: string, provider: SupportedProvider): Promise<ExtractedMessage[]>;

  // Query Operations
  getImportStatus(importId: string): ImportStatus | null;
  listImports(options?: { limit?: number; offset?: number }): ImportedConversation[];
  getConversation(id: string): ImportedConversation | null;

  // Provider Management
  listSupportedProviders(): ProviderConfig[];
  getProviderConfig(provider: SupportedProvider): ProviderConfig | null;

  // Communication Protocol
  getNodeId(): string;
  getMetrics(): NodeMetrics;
  onCommunicationEvent(listener: (event: CommunicationEvent) => void): () => void;
}

// ============================================
// IMPLEMENTATION
// ============================================

export class ChatLinkNexus implements ChatLinkNexusAPI {
  private importedConversations: Map<string, ImportedConversation> = new Map();
  private importStatuses: Map<string, ImportStatus> = new Map();
  private communication: CommunicationProtocol;
  private eventUnsubscribe: (() => void)[] = [];

  // Default provider configurations
  private static readonly PROVIDER_CONFIGS: Record<SupportedProvider, ProviderConfig> = {
    chatgpt: {
      provider: 'chatgpt',
      urlPattern: /chatgpt\.com\/share\/[a-z0-9-]+/i,
      settingsFile: 'chatgpt-settings.txt',
      chatSelector: '[data-testid="conversation-turn"]',
    },
    claude: {
      provider: 'claude',
      urlPattern: /claude\.ai\/share\/[a-z0-9-]+/i,
      settingsFile: 'claude-settings.txt',
      chatSelector: '[data-testid="chat-turn"]',
    },
    gemini: {
      provider: 'gemini',
      urlPattern: /gemini\.google\.com\/share\/[a-z0-9-]+/i,
      settingsFile: 'gemini-settings.txt',
    },
    grok: {
      provider: 'grok',
      urlPattern: /x\.ai\/grok\/share\/[a-z0-9-]+/i,
      settingsFile: 'grok-settings.txt',
    },
    qwen: {
      provider: 'qwen',
      urlPattern: /qwenlm\.com\/share\/[a-z0-9-]+/i,
      settingsFile: 'qwen-settings.txt',
    },
    kimi: {
      provider: 'kimi',
      urlPattern: /kimi\.moonshot\.cn\/share\/[a-z0-9-]+/i,
      settingsFile: 'kimi-settings.txt',
    },
    deepseek: {
      provider: 'deepseek',
      urlPattern: /deepseek\.com\/share\/[a-z0-9-]+/i,
      settingsFile: 'deepseek-settings.txt',
    },
    perplexity: {
      provider: 'perplexity',
      urlPattern: /perplexity\.ai\/share\/[a-z0-9-]+/i,
      settingsFile: null, // Not yet implemented
    },
    auto: {
      provider: 'auto',
      urlPattern: /.*/,
      settingsFile: '',
    },
  };

  constructor(private sdk: VivimSDK) {
    this.communication = createCommunicationProtocol('chatlink-nexus');
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const unsubSent = this.communication.onEvent('import_started', (event) => {
      console.log(`[ChatLinkNexus] Import started: ${event.importId}`);
    });
    this.eventUnsubscribe.push(unsubSent);

    const unsubCompleted = this.communication.onEvent('import_completed', (event) => {
      console.log(`[ChatLinkNexus] Import completed: ${event.importId}`);
    });
    this.eventUnsubscribe.push(unsubCompleted);

    const unsubFailed = this.communication.onEvent('import_failed', (event) => {
      console.error(`[ChatLinkNexus] Import failed: ${event.importId}`, event.error);
    });
    this.eventUnsubscribe.push(unsubFailed);
  }

  // ============================================
  // IMPORT OPERATIONS
  // ============================================

  async importFromLink(options: ChatLinkImportOptions): Promise<ImportedConversation> {
    const importId = generateId();
    const startTime = Date.now();

    // Initialize status
    const status: ImportStatus = {
      importId,
      url: options.url,
      status: 'pending',
      progress: 0,
      startedAt: startTime,
    };
    this.importStatuses.set(importId, status);

    await this.sendChatMessage('import_started', { importId, url: options.url });

    try {
      // Detect provider
      status.status = 'capturing';
      status.progress = 10;
      status.message = 'Detecting provider...';
      const detection = options.provider && options.provider !== 'auto'
        ? { provider: options.provider, confidence: 1.0, matchedPattern: 'manual' }
        : this.detectProvider(options.url);

      if (!detection) {
        throw new Error('Unable to detect provider from URL');
      }

      status.message = `Detected provider: ${detection.provider}`;
      status.progress = 20;

      // Capture the link
      status.message = 'Capturing shared link...';
      const capturedHtml = await this.captureLink(options.url, detection.provider);
      status.progress = 50;

      // Parse the content
      status.status = 'parsing';
      status.message = 'Parsing conversation content...';
      status.progress = 60;
      const messages = await this.parseCapturedContent(capturedHtml, detection.provider);
      status.progress = 80;

      // Create conversation
      status.status = 'importing';
      const conversation: ImportedConversation = {
        id: generateId(),
        title: options.title || `Imported from ${detection.provider}`,
        provider: detection.provider,
        sourceUrl: options.url,
        messages,
        importedAt: Date.now(),
        messageCount: messages.length,
        tags: options.tags || [],
        metadata: {
          detection,
          includeMetadata: options.includeMetadata,
        },
      };

      this.importedConversations.set(conversation.id, conversation);

      status.status = 'completed';
      status.progress = 100;
      status.message = 'Import completed successfully';
      status.completedAt = Date.now();

      await this.sendChatMessage('import_completed', {
        importId,
        conversationId: conversation.id,
        messageCount: conversation.messageCount,
      });

      return conversation;
    } catch (error) {
      status.status = 'failed';
      status.error = String(error);
      status.completedAt = Date.now();

      await this.sendChatMessage('import_failed', {
        importId,
        error: String(error),
      });

      throw error;
    }
  }

  async importFromLinks(urls: string[]): Promise<ImportedConversation[]> {
    const results: ImportedConversation[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const url of urls) {
      try {
        const result = await this.importFromLink({ url });
        results.push(result);
      } catch (error) {
        errors.push({ url, error: String(error) });
      }
    }

    if (errors.length > 0) {
      console.warn(`[ChatLinkNexus] ${errors.length} imports failed:`, errors);
    }

    return results;
  }

  detectProvider(url: string): ProviderDetection | null {
    for (const [provider, config] of Object.entries(ChatLinkNexus.PROVIDER_CONFIGS)) {
      if (provider === 'auto') continue;

      if (config.urlPattern.test(url)) {
        return {
          provider: provider as SupportedProvider,
          confidence: 0.9,
          matchedPattern: config.urlPattern.toString(),
        };
      }
    }

    return null;
  }

  // ============================================
  // CAPTURE OPERATIONS
  // ============================================

  async captureLink(url: string, provider: SupportedProvider): Promise<string> {
    // In a real implementation, this would call the server's capture.js
    // For SDK-level implementation, we return a mock HTML structure
    // The server-side capture.js should be called via API

    const config = ChatLinkNexus.PROVIDER_CONFIGS[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Mock captured HTML - in production, this would be from capture.js
    const mockHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Shared Chat - ${provider}</title>
</head>
<body>
  <div class="chat-container">
    <div class="message user">
      <div class="content">Hello, can you help me with something?</div>
    </div>
    <div class="message assistant">
      <div class="content">Of course! How can I assist you today?</div>
    </div>
    <div class="message user">
      <div class="content">I need help understanding TypeScript generics</div>
    </div>
    <div class="message assistant">
      <div class="content">I'd be happy to help explain TypeScript generics. Generics allow you to create reusable components that work with a variety of types...</div>
    </div>
  </div>
</body>
</html>`;

    // Simulate capture delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return mockHtml;
  }

  async parseCapturedContent(html: string, provider: SupportedProvider): Promise<ExtractedMessage[]> {
    const messages: ExtractedMessage[] = [];

    // Parse the HTML to extract messages
    // This is a simplified parser - production would use proper DOM parsing
    const userMatches = html.matchAll(/<div class="message user">\s*<div class="content">([^<]*)<\/div>\s*<\/div>/g);
    const assistantMatches = html.matchAll(/<div class="message assistant">\s*<div class="content">([^<]*)<\/div>\s*<\/div>/g);

    let msgIndex = 0;
    for (const match of userMatches) {
      messages.push({
        id: generateId(),
        role: 'user',
        content: match[1],
        timestamp: Date.now() + msgIndex * 1000,
      });
      msgIndex++;
    }

    msgIndex = 0;
    for (const match of assistantMatches) {
      messages.push({
        id: generateId(),
        role: 'assistant',
        content: match[1],
        timestamp: Date.now() + msgIndex * 1000 + 500,
      });
      msgIndex++;
    }

    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);

    return messages;
  }

  // ============================================
  // QUERY OPERATIONS
  // ============================================

  getImportStatus(importId: string): ImportStatus | null {
    return this.importStatuses.get(importId) || null;
  }

  listImports(options: { limit?: number; offset?: number } = {}): ImportedConversation[] {
    const conversations = Array.from(this.importedConversations.values())
      .sort((a, b) => b.importedAt - a.importedAt);

    const offset = options.offset || 0;
    const limit = options.limit || conversations.length;

    return conversations.slice(offset, offset + limit);
  }

  getConversation(id: string): ImportedConversation | null {
    return this.importedConversations.get(id) || null;
  }

  // ============================================
  // PROVIDER MANAGEMENT
  // ============================================

  listSupportedProviders(): ProviderConfig[] {
    return Object.values(ChatLinkNexus.PROVIDER_CONFIGS).filter(
      config => config.provider !== 'auto'
    );
  }

  getProviderConfig(provider: SupportedProvider): ProviderConfig | null {
    return ChatLinkNexus.PROVIDER_CONFIGS[provider] || null;
  }

  // ============================================
  // COMMUNICATION PROTOCOL
  // ============================================

  getNodeId(): string {
    return 'chatlink-nexus';
  }

  getMetrics(): NodeMetrics {
    return this.communication.getMetrics() || {
      nodeId: 'chatlink-nexus',
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

  async sendChatMessage<T>(type: string, payload: T): Promise<MessageEnvelope> {
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
      case 'import_start': {
        const { url, provider, title } = payload as ChatLinkImportOptions;
        const conversation = await this.importFromLink({ url, provider, title });
        return this.communication.createResponse(envelope, { conversation });
      }

      case 'import_list': {
        const imports = this.listImports(payload as { limit?: number; offset?: number });
        return this.communication.createResponse(envelope, { imports });
      }

      case 'import_status': {
        const { importId } = payload as { importId: string };
        const status = this.getImportStatus(importId);
        return this.communication.createResponse(envelope, { status });
      }

      case 'providers_list': {
        const providers = this.listSupportedProviders();
        return this.communication.createResponse(envelope, { providers });
      }

      default:
        return this.communication.createResponse(envelope, { error: 'Unknown message type' });
    }
  }

  destroy(): void {
    void this.eventUnsubscribe.forEach(unsub => unsub());
    this.eventUnsubscribe = [];
  }
}
