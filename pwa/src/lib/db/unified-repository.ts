import { getVivimDB, type Conversation, type ConversationMetadata } from './vivim-db';
import { getStorage } from '../storage-v2';
import { logger } from '../logger';

const DB_NAME = 'VivimUserConversationsDB';

class UnifiedRepository {
  private db = getVivimDB();
  private storage = getStorage();

  async initialize(): Promise<void> {
    await this.db.ready();
    logger.info('Repository', 'Unified repository initialized');
  }

  async getConversationsForHome(options: {
    limit?: number;
    offset?: number;
    sortBy?: 'lastMessageAt' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Conversation[]> {
    const { limit = 50, offset = 0, sortBy = 'lastMessageAt', sortOrder = 'desc' } = options;
    
    try {
      const metadata = await this.db.getMetadataSorted({
        limit: limit + offset,
        pinnedFirst: true,
        includeArchived: false
      });
      
      const results: Conversation[] = [];
      
      for (const meta of metadata.slice(offset)) {
        const fullConv = await this.storage.getConversation(meta.id as any);
        if (fullConv) {
          results.push(this.adaptToConversation(fullConv, meta));
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Repository', 'Failed to get conversations for home', error as Error);
      return [];
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      const root = await this.storage.getConversation(id as any);
      if (!root) return null;
      
      const messages = await this.storage.getMessages(id as any);
      const stats = this.calculateStats(messages);
      
      return {
        id: root.conversationId || root.id,
        title: root.title || 'Untitled',
        provider: (root.metadata?.provider as string) || 'other',
        sourceUrl: (root.metadata?.sourceUrl as string) || '',
        state: (root.metadata?.state as any) || 'ACTIVE',
        version: (root.metadata?.version as number) || 1,
        ownerId: root.metadata?.ownerId as string,
        contentHash: root.metadata?.contentHash as string,
        createdAt: root.timestamp || new Date().toISOString(),
        updatedAt: root.metadata?.updatedAt as string || root.timestamp || new Date().toISOString(),
        capturedAt: root.metadata?.capturedAt as string || root.timestamp || new Date().toISOString(),
        tags: (root.metadata?.tags as string[]) || [],
        messages,
        stats,
        metadata: root.metadata || {}
      };
    } catch (error) {
      logger.error('Repository', `Failed to get conversation ${id}`, error as Error);
      return null;
    }
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    try {
      await this.db.putConversation(conversation);
      
      const metadata: ConversationMetadata = {
        id: conversation.id,
        title: conversation.title,
        provider: conversation.provider,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastMessageAt: conversation.stats.lastMessageAt,
        messageCount: conversation.stats.totalMessages,
        isPinned: false,
        isArchived: false,
        tags: conversation.tags,
        priority: 'medium'
      };
      
      await this.db.putMetadata(metadata);
    } catch (error) {
      logger.error('Repository', 'Failed to save conversation', error as Error);
    }
  }

  async updateMetadata(id: string, updates: Partial<ConversationMetadata>): Promise<void> {
    await this.db.updateMetadata(id, updates);
  }

  async setPinned(id: string, pinned: boolean): Promise<void> {
    await this.db.setPinned(id, pinned);
  }

  async setArchived(id: string, archived: boolean): Promise<void> {
    await this.db.setArchived(id, archived);
  }

  async deleteConversation(id: string): Promise<void> {
    await this.storage.deleteConversation(id as any);
    await this.db.deleteConversation(id);
  }

  async getStats(): Promise<{
    total: number;
    pinned: number;
    archived: number;
  }> {
    try {
      const stats = await this.db.getStats();
      const allMeta = await this.db.getAllMetadata();
      
      return {
        total: stats.totalConversations,
        pinned: allMeta.filter(m => m.isPinned).length,
        archived: allMeta.filter(m => m.isArchived).length
      };
    } catch {
      return { total: 0, pinned: 0, archived: 0 };
    }
  }

  private adaptToConversation(root: any, metadata: ConversationMetadata): Conversation {
    return {
      id: metadata.id,
      title: metadata.title,
      provider: metadata.provider,
      sourceUrl: '',
      state: 'ACTIVE',
      version: 1,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      capturedAt: metadata.createdAt,
      tags: metadata.tags,
      messages: [],
      stats: {
        totalMessages: metadata.messageCount,
        totalWords: 0,
        totalCharacters: 0,
        totalCodeBlocks: 0,
        totalMermaidDiagrams: 0,
        totalImages: 0,
        totalTables: 0,
        totalLatexBlocks: 0,
        totalToolCalls: 0,
        firstMessageAt: metadata.createdAt,
        lastMessageAt: metadata.lastMessageAt
      },
      metadata: {}
    };
  }

  private calculateStats(messages: any[]): Conversation['stats'] {
    const totalMessages = messages.length;
    let totalWords = 0;
    let totalCharacters = 0;
    let totalCodeBlocks = 0;
    
    messages.forEach(msg => {
      if (typeof msg.content === 'string') {
        totalWords += msg.content.split(/\s+/).length;
        totalCharacters += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach((block: any) => {
          if (typeof block.content === 'string') {
            totalWords += block.content.split(/\s+/).length;
            totalCharacters += block.content.length;
          }
          if (block.type === 'code') totalCodeBlocks++;
        });
      }
    });

    return {
      totalMessages,
      totalWords,
      totalCharacters,
      totalCodeBlocks,
      totalMermaidDiagrams: 0,
      totalImages: 0,
      totalTables: 0,
      totalLatexBlocks: 0,
      totalToolCalls: 0,
      firstMessageAt: messages[0]?.timestamp || new Date().toISOString(),
      lastMessageAt: messages[messages.length - 1]?.timestamp || new Date().toISOString()
    };
  }
}

export const unifiedRepository = new UnifiedRepository();
