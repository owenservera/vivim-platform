/**
 * Conversation Rendering Service
 * 
 * Central service for rendering conversations with full styling and formatting
 * for display across all frontend contexts (feed, scroll, conversation view, etc.)
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface RenderOptions {
  viewMode?: 'list' | 'grid' | 'graph' | 'preview' | 'full';
  includeMessages?: boolean;
  messageLimit?: number;
  messageOffset?: number;
  enableSyntaxHighlighting?: boolean;
  enableLazyLoading?: boolean;
  maxPreviewLength?: number;
  includeMetadata?: boolean;
  includeStats?: boolean;
  includeACUs?: boolean;
  stylePreset?: string;
  template?: string;
}

export interface RenderedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  author?: string;
  messageIndex: number;
  createdAt: string;
  
  // Content
  parts: ContentPart[];
  renderedContent?: any;
  
  // Styling
  textStyles?: TextStyle[];
  customClasses: string[];
  displayOrder: number;
  
  // Metadata
  status: string;
  finishReason?: string;
  tokenCount?: number;
  metadata: Record<string, unknown>;
  
  // ACUs
  acus?: RenderedACU[];
}

export interface ContentPart {
  type: 'text' | 'code' | 'image' | 'latex' | 'table' | 'mermaid' | 'tool_call' | 'tool_result';
  content: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
  styling?: PartStyling;
}

export interface PartStyling {
  cssClasses?: string[];
  inlineStyles?: Record<string, string>;
  theme?: 'light' | 'dark';
  layout?: 'default' | 'compact' | 'expanded';
}

export interface TextStyle {
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link' | 'highlight';
  startOffset: number;
  endOffset: number;
  href?: string;
  customClass?: string;
}

export interface RenderedACU {
  id: string;
  type: string;
  content: string;
  qualityScore: number;
  metadata?: Record<string, unknown>;
}

export interface RenderedConversation {
  // Identity
  id: string;
  title: string;
  provider: string;
  sourceUrl: string;
  
  // State
  state: string;
  visibility: string;
  version: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  
  // Stats
  stats: ConversationStats;
  
  // Messages
  messages?: RenderedMessage[];
  messageCount: number;
  
  // Rendering metadata
  renderedAt: string;
  renderTimeMs: number;
  contentHash: string;
  viewMode: string;
  
  // ACUs
  acus?: RenderedACU[];
  
  // Custom styling
  customClasses?: string[];
  renderingOptions?: Record<string, unknown>;
}

export interface ConversationStats {
  totalMessages: number;
  totalWords: number;
  totalCharacters: number;
  totalCodeBlocks: number;
  totalImages: number;
  totalTables: number;
  totalLatexBlocks: number;
  totalMermaidDiagrams: number;
  totalToolCalls: number;
  firstMessageAt: string;
  lastMessageAt: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class ConversationRenderingService {
  private prisma: PrismaClient;
  private cache: Map<string, { data: RenderedConversation; expiresAt: number }>;
  private cacheTTL: number;

  constructor(prisma: PrismaClient, cacheTTLSeconds: number = 300) {
    this.prisma = prisma;
    this.cache = new Map();
    this.cacheTTL = cacheTTLSeconds * 1000;
  }

  /**
   * Render a conversation for display
   */
  async renderConversation(
    conversationId: string,
    options: RenderOptions = {}
  ): Promise<RenderedConversation> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.getCacheKey(conversationId, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch conversation with messages
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { messageIndex: 'asc' },
          take: options.messageLimit,
          skip: options.messageOffset,
        },
        acus: options.includeACUs,
        renderingCache: true,
      },
    });

    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    // Render messages
    const renderedMessages = options.includeMessages !== false
      ? await this.renderMessages(conversation.messages, options)
      : [];

    // Calculate stats
    const stats = await this.calculateStats(conversation, conversation.messages);

    // Build rendered conversation
    const rendered: RenderedConversation = {
      id: conversation.id,
      title: conversation.title,
      provider: conversation.provider,
      sourceUrl: conversation.sourceUrl,
      state: conversation.state,
      visibility: conversation.visibility,
      version: conversation.version,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      capturedAt: conversation.capturedAt.toISOString(),
      stats,
      messages: renderedMessages,
      messageCount: conversation.messageCount,
      renderedAt: new Date().toISOString(),
      renderTimeMs: Date.now() - startTime,
      contentHash: conversation.contentHash || this.computeContentHash(conversation),
      viewMode: options.viewMode || 'list',
      acus: options.includeACUs ? this.renderACUs(conversation.acus) : undefined,
      customClasses: (conversation.renderingOptions as any)?.customClasses,
      renderingOptions: conversation.renderingOptions as Record<string, unknown> || {},
    };

    // Cache the result
    this.addToCache(cacheKey, rendered);

    // Update rendering cache in database
    await this.updateRenderingCache(conversationId, rendered, options);

    return rendered;
  }

  /**
   * Render messages with full styling
   */
  private async renderMessages(
    messages: any[],
    options: RenderOptions
  ): Promise<RenderedMessage[]> {
    return Promise.all(
      messages.map(async (msg) => {
        const parts = this.parseParts(msg.parts);
        const textStyles = msg.textStyles as TextStyle[] | undefined;
        
        return {
          id: msg.id,
          role: msg.role,
          author: msg.author,
          messageIndex: msg.messageIndex,
          createdAt: msg.createdAt.toISOString(),
          parts: this.applyStylingToParts(parts, options),
          renderedContent: msg.renderedContent,
          textStyles,
          customClasses: msg.customClasses || [],
          displayOrder: msg.displayOrder,
          status: msg.status,
          finishReason: msg.finishReason,
          tokenCount: msg.tokenCount,
          metadata: msg.metadata as Record<string, unknown>,
          acus: msg.acus?.length ? this.renderACUs(msg.acus) : undefined,
        };
      })
    );
  }

  /**
   * Parse message parts from JSON
   */
  private parseParts(partsJson: any): ContentPart[] {
    if (!partsJson) {
      return [];
    }

    if (typeof partsJson === 'string') {
      return [{ type: 'text', content: partsJson }];
    }

    if (Array.isArray(partsJson)) {
      return partsJson.map((part) => {
        if (typeof part === 'string') {
          return { type: 'text', content: part };
        }
        return {
          type: part.type || 'text',
          content: part.content || part,
          metadata: part.metadata,
        };
      });
    }

    return [{ type: 'text', content: JSON.stringify(partsJson) }];
  }

  /**
   * Apply styling to content parts
   */
  private applyStylingToParts(parts: ContentPart[], options: RenderOptions): ContentPart[] {
    return parts.map((part) => ({
      ...part,
      styling: {
        cssClasses: this.getClassesForPart(part, options),
        inlineStyles: {},
        theme: 'auto',
        layout: options.viewMode === 'preview' ? 'compact' : 'default',
      },
    }));
  }

  /**
   * Get CSS classes for a content part
   */
  private getClassesForPart(part: ContentPart, options: RenderOptions): string[] {
    const classes: string[] = [];

    // Base class by type
    classes.push(`content-${part.type}`);

    // View mode specific
    if (options.viewMode === 'grid') {
      classes.push('grid-mode');
    } else if (options.viewMode === 'preview') {
      classes.push('preview-mode');
    }

    // Syntax highlighting
    if (part.type === 'code' && options.enableSyntaxHighlighting !== false) {
      classes.push('syntax-highlighted');
    }

    // Lazy loading
    if (options.enableLazyLoading !== false) {
      classes.push('lazy-load');
    }

    return classes;
  }

  /**
   * Render ACUs
   */
  private renderACUs(acus: any[]): RenderedACU[] {
    return acus.map((acu) => ({
      id: acu.id,
      type: acu.type,
      content: acu.content,
      qualityScore: acu.qualityOverall || 0,
      metadata: acu.metadata,
    }));
  }

  /**
   * Calculate conversation stats
   */
  private async calculateStats(
    conversation: any,
    messages: any[]
  ): Promise<ConversationStats> {
    const stats: ConversationStats = {
      totalMessages: messages.length,
      totalWords: conversation.totalWords || 0,
      totalCharacters: conversation.totalCharacters || 0,
      totalCodeBlocks: conversation.totalCodeBlocks || 0,
      totalImages: conversation.totalImages || 0,
      totalTables: conversation.totalTables || 0,
      totalLatexBlocks: conversation.totalLatexBlocks || 0,
      totalMermaidDiagrams: conversation.totalMermaidDiagrams || 0,
      totalToolCalls: conversation.totalToolCalls || 0,
      firstMessageAt: messages[0]?.createdAt?.toISOString() || conversation.createdAt.toISOString(),
      lastMessageAt: messages[messages.length - 1]?.createdAt?.toISOString() || conversation.updatedAt.toISOString(),
    };

    return stats;
  }

  /**
   * Compute content hash for cache invalidation
   */
  private computeContentHash(conversation: any): string {
    const data = {
      id: conversation.id,
      title: conversation.title,
      messageCount: conversation.messageCount,
      updatedAt: conversation.updatedAt.toISOString(),
      contentHash: conversation.contentHash,
    };
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Cache operations
   */
  private getCacheKey(conversationId: string, options: RenderOptions): string {
    return `${conversationId}:${options.viewMode || 'list'}:${options.messageLimit || 'all'}`;
  }

  private getFromCache(key: string): RenderedConversation | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private addToCache(key: string, data: RenderedConversation): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Update rendering cache in database
   */
  private async updateRenderingCache(
    conversationId: string,
    rendered: RenderedConversation,
    options: RenderOptions
  ): Promise<void> {
    try {
      await this.prisma.renderingCache.upsert({
        where: { conversationId },
        create: {
          conversationId,
          contentHash: rendered.contentHash,
          renderedVersion: '1.0',
          renderedData: rendered as any,
          viewMode: options.viewMode || 'list',
          includeMessages: options.includeMessages !== false,
          messageLimit: options.messageLimit,
          renderTimeMs: rendered.renderTimeMs,
          messageCount: rendered.messageCount,
          contentSize: JSON.stringify(rendered).length,
        },
        update: {
          contentHash: rendered.contentHash,
          renderedData: rendered as any,
          viewMode: options.viewMode || 'list',
          renderTimeMs: rendered.renderTimeMs,
          messageCount: rendered.messageCount,
          hits: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to update rendering cache:', error);
    }
  }

  /**
   * Clear cache for a conversation
   */
  clearCache(conversationId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(conversationId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Get rendering templates
   */
  async getRenderingTemplates(options: {
    templateType?: string;
    provider?: string;
    role?: string;
  }): Promise<any[]> {
    const where: Record<string, unknown> = {};
    
    if (options.templateType) {
      where.templateType = options.templateType;
    }
    
    if (options.provider) {
      where.provider = { in: [options.provider, null] };
    }
    
    if (options.role) {
      where.role = { in: [options.role, null] };
    }

    return this.prisma.renderingTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function createRenderingService(prisma: PrismaClient): ConversationRenderingService {
  return new ConversationRenderingService(prisma);
}
