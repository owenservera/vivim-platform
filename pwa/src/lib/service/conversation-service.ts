import { getStorage } from '../storage-v2';
import { initUnifiedDB } from '../storage-v2/db-manager/unified-db';
import { log } from '../logger';
import { asHash } from '../storage-v2/types';
import type { Conversation, Message, ContentBlock, ConversationStats } from '../../types/conversation';
import type { MessageNode, ConversationRoot } from '../storage-v2/types';

// Try to import UnifiedDebugService for centralized error reporting
let unifiedDebugService: any = null;
try {
  unifiedDebugService = require('../unified-debug-service').unifiedDebugService;
} catch (e) {
  // UnifiedDebugService not available yet - that's okay
}

async function getUnifiedDBWithInit() {
  // initUnifiedDB is idempotent - it reuses the existing instance if ready,
  // and retries on failure (unlike the old manual flag guard).
  // Uses 'VivimSync' db (default) — NOT 'VivimDB' which is claimed by object-store.ts at v3.
  return initUnifiedDB({
    enableValidation: true,
    enableIntegrityCheck: false,
    enableSync: false,
  });
}

export class ConversationService {
  private storage = getStorage();

  /**
   * Get all conversations formatted for the UI
   */
  async getAllConversations(): Promise<Conversation[]> {
    const startTime = Date.now();
    const requestId = `svc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    log.storage.info(`[${requestId}] ========== CONVERSATION SERVICE: getAllConversations START ==========`);

    // Add timeout to prevent infinite hanging when storage is not available
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Conversation service timed out after 15 seconds')), 15000);
    });

    try {
      log.storage.debug(`[${requestId}] Fetching all conversations from storage...`);

      // Wrap storage call in timeout protection
      const list = await Promise.race([
        this.storage.listConversations(),
        timeoutPromise
      ]);
      log.storage.debug(`[${requestId}] Found ${list.length} conversations in storage index.`);

      const conversations = list.map(({ root, messageCount, lastMessageAt }) => {
        // Ensure we have a valid conversation ID
        const conversationId = root.conversationId || root.id || `conv-${Date.now()}`;

        return {
          id: conversationId,
          title: root.title || 'Untitled Conversation',
          provider: (root.metadata?.provider as Conversation['provider']) || 'other',
          sourceUrl: (root.metadata?.sourceUrl as string) || '',
          state: (root.metadata?.state as 'ACTIVE' | 'ARCHIVED' | 'DELETED') || 'ACTIVE',
          version: root.metadata?.version as number || 1,
          ownerId: root.metadata?.ownerId as string || undefined,
          contentHash: root.metadata?.contentHash as string || undefined,
          createdAt: (root.metadata?.createdAt as string) || root.timestamp || new Date().toISOString(),
          updatedAt: (root.metadata?.updatedAt as string) || root.timestamp || new Date().toISOString(),
          capturedAt: (root.metadata?.capturedAt as string) || root.timestamp || new Date().toISOString(),
          exportedAt: root.timestamp || new Date().toISOString(), // Deprecated, kept for compatibility
          tags: (root.metadata?.tags as string[]) || [],
          messages: [], // We'll load messages individually when needed
          stats: {
            totalMessages: messageCount || 0,
            totalWords: root.metadata?.totalWords || 0,
            totalCharacters: root.metadata?.totalCharacters || 0,
            totalCodeBlocks: root.metadata?.totalCodeBlocks || 0,
            totalMermaidDiagrams: root.metadata?.totalMermaidDiagrams || 0,
            totalImages: root.metadata?.totalImages || 0,
            totalTables: root.metadata?.totalTables || 0,
            totalLatexBlocks: root.metadata?.totalLatexBlocks || 0,
            totalToolCalls: root.metadata?.totalToolCalls || 0,
            firstMessageAt: (root.metadata?.createdAt as string) || root.timestamp || new Date().toISOString(),
            lastMessageAt: lastMessageAt || root.timestamp || new Date().toISOString()
          },
          metadata: {
            ...root.metadata,
            model: root.metadata?.model || 'unknown',
            tags: root.metadata?.tags || []
          }
        };
      });

      log.storage.debug(`[${requestId}] Validating ${conversations.length} conversations...`);
      
      // Validate conversations before returning
      let validationErrors = 0;
      try {
        const unifiedDB = await getUnifiedDBWithInit();
        for (const convo of conversations) {
          const validation = unifiedDB.validate(convo, 'conversation');
          if (!validation.valid) {
            validationErrors++;
            log.storage.warn(`[${requestId}] Conversation ${convo.id?.slice(0,10)} failed validation`, { errors: validation.errors });
          }
        }
      } catch (e) {
        log.storage.warn(`[${requestId}] Validation skipped - DB not ready`, { error: e });
      }

      const duration = Date.now() - startTime;
      log.storage.info(`[${requestId}] ========== CONVERSATION SERVICE: getAllConversations COMPLETE ==========`,
        { 
          conversationCount: conversations.length, 
          validationErrors,
          duration: `${duration}ms`
        }
      );

      return conversations;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.storage.error(`[${requestId}] ========== CONVERSATION SERVICE: getAllConversations FAILED ==========`,
        error instanceof Error ? error : new Error(String(error)),
        { error: errorMsg }
      );

      // Report to UnifiedDebugService if available
      if (unifiedDebugService) {
        unifiedDebugService.error('ConversationService', `getAllConversations failed: ${errorMsg}`,
          error instanceof Error ? error : new Error(String(error)),
          { requestId, duration: Date.now() - startTime }
        );
      }

      // Return empty array instead of throwing - allow app to degrade gracefully
      log.storage.warn(`[${requestId}] Returning empty array due to storage failure`);
      return [];
    }
  }

  /**
   * Get a full conversation with messages
   */
  async getConversation(id: string): Promise<Conversation | null> {
    log.storage.debug(`Service: Requesting conversation ${id.slice(0, 10)}...`);
    const root = await this.storage.getConversation(asHash(id));

    if (!root) {
      log.storage.warn(`Service: Conversation ${id.slice(0, 10)} root not found in storage.`);
      return null;
    }

    log.storage.debug(`Service: Found root for "${root.title}". Fetching messages...`);
    const dagMessages = await this.storage.getMessages(asHash(id));
    log.storage.debug(`Service: Retrieved ${dagMessages.length} DAG messages.`);

    const messages = this.adaptMessages(dagMessages);
    const stats = this.calculateStats(messages, root);

    const conversation: Conversation = {
      id: root.conversationId || root.id || id,
      title: root.title || 'Untitled Conversation',
      provider: (root.metadata?.provider as Conversation['provider']) || 'other',
      sourceUrl: (root.metadata?.sourceUrl as string) || '',
      state: (root.metadata?.state as 'ACTIVE' | 'ARCHIVED' | 'DELETED') || 'ACTIVE',
      version: root.metadata?.version as number || 1,
      ownerId: root.metadata?.ownerId as string || undefined,
      contentHash: root.metadata?.contentHash as string || undefined,
      createdAt: (root.metadata?.createdAt as string) || root.timestamp || new Date().toISOString(),
      updatedAt: (root.metadata?.updatedAt as string) || root.timestamp || new Date().toISOString(),
      capturedAt: (root.metadata?.capturedAt as string) || root.timestamp || new Date().toISOString(),
      exportedAt: root.timestamp || new Date().toISOString(), // Deprecated, kept for compatibility
      tags: (root.metadata?.tags as string[]) || [],
      metadata: {
        ...root.metadata,
        model: root.metadata?.model || 'unknown',
        tags: root.metadata?.tags || []
      },
      messages,
      stats
    };

    try {
      const unifiedDB = await getUnifiedDBWithInit();
      const validation = unifiedDB.validate(conversation, 'conversation');
      if (!validation.valid) {
        log.storage.warn(`Conversation ${conversation.id} failed validation`, { errors: validation.errors });
      } else {
        log.storage.debug(`Conversation ${conversation.id} passed validation`);
      }
    } catch (e) {
      log.storage.debug('Validation skipped - DB not ready');
    }

    log.storage.info(`Service: Successfully adapted conversation "${root.title}"`);
    return conversation;
  }

  /**
   * Add a user message
   */
  async addUserMessage(conversationId: string, text: string): Promise<Message> {
    const node = await this.storage.appendMessage(asHash(conversationId), 'user', text);
    return this.adaptMessage(node);
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(id: string): Promise<void> {
    await this.storage.deleteConversation(asHash(id));
    
    try {
      const unifiedDB = await getUnifiedDBWithInit();
      await unifiedDB.delete('conversations', id);
    } catch (e) {
      log.storage.debug('Sync delete skipped - DB not ready');
    }
  }

  async triggerSync(): Promise<{ success: boolean; synced: number; failed: number }> {
    try {
      const unifiedDB = await getUnifiedDBWithInit();
      return await unifiedDB.sync();
    } catch (e) {
      log.storage.error('Sync failed', { error: e });
      return { success: false, synced: 0, failed: 0 };
    }
  }

  async getStorageStatus(): Promise<{
    isReady: boolean;
    isOnline: boolean;
    pendingOperations: number;
    localConversationCount: number;
  }> {
    try {
      const unifiedDB = await getUnifiedDBWithInit();
      const status = await unifiedDB.getStatus();
      const conversations = await this.getAllConversations();
      return {
        isReady: status.isReady,
        isOnline: status.isOnline,
        pendingOperations: status.pendingOperations,
        localConversationCount: conversations.length
      };
    } catch (e) {
      const conversations = await this.getAllConversations();
      return { 
        isReady: false, 
        isOnline: navigator.onLine, 
        pendingOperations: 0,
        localConversationCount: conversations.length
      };
    }
  }

  /**
   * Check if local database is fully synced with backend
   * This is a simplified check - in a real implementation, you might compare
   * local count with backend count via an API call
   */
  async isFullySynced(): Promise<boolean> {
    try {
      // For now, we consider it synced if we have conversations locally
      // In a real implementation, you might compare with backend counts
      const conversations = await this.getAllConversations();
      return conversations.length > 0;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Adapters
  // ===========================================================================

  private adaptMessages(nodes: MessageNode[]): Message[] {
    return nodes.map(node => this.adaptMessage(node));
  }

  private adaptMessage(node: MessageNode): Message {
    return {
      id: node.id,
      role: node.role,
      content: this.adaptContent(node.content),
      timestamp: node.timestamp,
      metadata: node.metadata || {},
      parts: Array.isArray(node.content) ? node.content : []
    };
  }

  private adaptContent(content: unknown): string | ContentBlock[] {
    // If it's already in the right format, return it
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      // Check if it's already in ContentBlock format
      if (content.length > 0 && typeof content[0] === 'object' && content[0].type) {
        return content as ContentBlock[];
      }
      // Convert string array to text content blocks
      return content.map(item => ({
        type: 'text',
        content: typeof item === 'string' ? item : JSON.stringify(item)
      }));
    }
    return String(content);
  }

  private calculateStats(messages: Message[], root: ConversationRoot): ConversationStats {
    // Basic stats calculation matching Prisma schema
    let words = 0;
    let chars = 0;
    let codeBlocks = 0;
    let mermaidDiagrams = 0;
    let images = 0;
    let tables = 0;
    let latexBlocks = 0;
    let toolCalls = 0;

    messages.forEach(msg => {
      if (typeof msg.content === 'string') {
        words += msg.content.split(/\s+/).length;
        chars += msg.content.length;
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(block => {
          // Get content as string for word/char counting
          let blockContent = '';
          if (typeof block.content === 'string') {
            blockContent = block.content;
          } else if (typeof block.content === 'object' && block.content !== null) {
            // Handle object content (tables, tool calls, etc.)
            blockContent = JSON.stringify(block.content);
          } else {
            blockContent = String(block.content ?? '');
          }

          words += blockContent.split(/\s+/).length;
          chars += blockContent.length;

          // Count rich content types
          switch (block.type) {
            case 'code':
              codeBlocks++;
              break;
            case 'mermaid':
              mermaidDiagrams++;
              break;
            case 'image':
              images++;
              break;
            case 'table':
              tables++;
              break;
            case 'math':
            case 'latex':
              latexBlocks++;
              break;
            case 'tool_call':
              toolCalls++;
              break;
          }
        });
      } else if (msg.parts && Array.isArray(msg.parts)) {
        // Handle parts array as well
        msg.parts.forEach(block => {
          let blockContent = '';
          if (typeof block.content === 'string') {
            blockContent = block.content;
          } else if (typeof block.content === 'object' && block.content !== null) {
            blockContent = JSON.stringify(block.content);
          } else {
            blockContent = String(block.content ?? '');
          }

          words += blockContent.split(/\s+/).length;
          chars += blockContent.length;

          switch (block.type) {
            case 'code':
              codeBlocks++;
              break;
            case 'mermaid':
              mermaidDiagrams++;
              break;
            case 'image':
              images++;
              break;
            case 'table':
              tables++;
              break;
            case 'math':
            case 'latex':
              latexBlocks++;
              break;
            case 'tool_call':
              toolCalls++;
              break;
          }
        });
      }
    });

    const firstMessageTime = messages.length > 0
      ? messages[0].timestamp || root.metadata?.createdAt || root.timestamp
      : root.metadata?.createdAt || root.timestamp;
      
    const lastMessageTime = messages.length > 0
      ? messages[messages.length - 1].timestamp || root.metadata?.createdAt || root.timestamp
      : root.metadata?.createdAt || root.timestamp;

    return {
      totalMessages: messages.length,
      totalWords: words,
      totalCharacters: chars,
      totalCodeBlocks: codeBlocks,
      totalMermaidDiagrams: mermaidDiagrams,
      totalImages: images,
      totalTables: tables,
      totalLatexBlocks: latexBlocks,
      totalToolCalls: toolCalls,
      firstMessageAt: firstMessageTime || new Date().toISOString(),
      lastMessageAt: lastMessageTime || new Date().toISOString(),
      durationMs: firstMessageTime && lastMessageTime
        ? new Date(lastMessageTime).getTime() - new Date(firstMessageTime).getTime()
        : undefined
    };
  }
}

export const conversationService = new ConversationService();
