/**
 * Simplified Conversation Sync Service
 * 
 * Handles syncing conversations from the backend to local storage
 * with better error handling and performance
 */

import { apiClient } from './api';
import { getStorage } from './storage-v2';
import { conversationService } from './service/conversation-service';
import { logger } from './logger';

export interface SyncOptions {
  force?: boolean;
  limit?: number;
  onProgress?: (progress: SyncProgress) => void;
}

export interface SyncProgress {
  phase: 'fetching' | 'processing' | 'storing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
  duration: number;
}

export class ConversationSyncService {
  private isSyncing = false;
  private lastSyncTime = 0;
  private syncCooldown = 5000; // 5 seconds between syncs

  /**
   * Sync conversations from backend to local storage
   */
  async syncConversations(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0
    };

    // Check if we're already syncing
    if (this.isSyncing) {
      result.errors.push('Sync already in progress');
      return result;
    }

    // Check cooldown period
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync < this.syncCooldown && !options.force) {
      result.errors.push(`Sync cooldown active. Please wait ${Math.ceil((this.syncCooldown - timeSinceLastSync) / 1000)} seconds`);
      return result;
    }

    try {
      this.isSyncing = true;
      logger.sync.info('Starting conversation sync...');

      // Phase 1: Fetch conversations from backend
      options.onProgress?.({
        phase: 'fetching',
        current: 0,
        total: 0,
        message: 'Fetching conversations from backend...'
      });

      const backendConversations = await this.fetchConversations(options.limit);
      
      // If fetchConversations returns an empty array, it might be due to a 304 Not Modified.
      // In this case, we should check if we have local data and consider the sync successful
      // but with no new data to sync, rather than an outright failure or empty state.
      if (backendConversations.length === 0) {
        logger.sync.info('No conversations returned from backend (possibly 304 Not Modified). Checking local data.');
        const localConversations = await conversationService.getAllConversations();
        if (localConversations.length > 0 && !options.force) {
          logger.sync.info(`Local data found (${localConversations.length} conversations). Assuming no changes on backend.`);
          result.success = true;
          result.skipped = localConversations.length; // Mark all as skipped since no new data came in
          return result;
        } else if (options.force) {
          logger.sync.info('Force sync enabled, but backend returned no data. Proceeding will result in no changes.');
          // If force is true, we might want to clear local data, but for now, we just return.
          // This scenario might need more specific handling based on desired "force" behavior.
        } else {
          logger.sync.info('No conversations found in backend or locally.');
          // If there's truly no data locally or from backend, it's a successful sync of zero items.
          result.success = true;
          return result;
        }
      }

      options.onProgress?.({
        phase: 'fetching',
        current: backendConversations.length,
        total: backendConversations.length,
        message: `Found ${backendConversations.length} conversations`
      });

      // Phase 2: Process and store conversations
      options.onProgress?.({
        phase: 'processing',
        current: 0,
        total: backendConversations.length,
        message: 'Processing conversations...'
      });

      const storage = getStorage();
      
      for (let i = 0; i < backendConversations.length; i++) {
        const conv = backendConversations[i];
        options.onProgress?.({
          phase: 'processing',
          current: i + 1,
          total: backendConversations.length,
          message: `Processing ${conv.title || 'Untitled'}`
        });

        try {
          // Check if conversation already exists locally
          const existingRoot = await storage.getConversation(conv.id);
          if (existingRoot && !options.force) {
            result.skipped++;
            continue;
          }

          // Fetch full conversation with messages
          const fullConv = await this.fetchFullConversation(conv.id);
          if (!fullConv) {
            result.failed++;
            result.errors.push(`Failed to fetch conversation ${conv.id}`);
            continue;
          }

          // Convert and store the conversation
          const extraction = this.convertToExtractionFormat(fullConv);
          await storage.importFromExtraction(extraction);
          
          result.synced++;
          logger.sync.debug(`Synced conversation: ${conv.title || 'Untitled'}`);
        } catch (error) {
          result.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync ${conv.id}: ${errorMsg}`);
          logger.sync.error(`Failed to sync conversation ${conv.id}`, error as Error);
        }
      }

      // Phase 3: Complete
      options.onProgress?.({
        phase: 'complete',
        current: result.synced,
        total: backendConversations.length,
        message: `Sync complete: ${result.synced} synced, ${result.skipped} skipped`
      });

      result.success = true;
      this.lastSyncTime = Date.now();
      logger.sync.info(`Sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`);

    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Sync failed: ${errorMsg}`);
      logger.sync.error('Sync failed', error as Error);
    } finally {
      this.isSyncing = false;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetch conversation list from backend
   */
  private async fetchConversations(limit = 100) {
    try {
      // Add timestamp to prevent caching issues where browser returns 304
      // but local storage is empty
      const response = await apiClient.get('/conversations', {
        params: { 
          limit, 
          offset: 0,
          _t: Date.now() 
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      // Check if response and response.data exist before accessing properties
      if (!response || !response.data) {
        return [];
      }
      
      return response.data.conversations || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch full conversation with messages
   */
  private async fetchFullConversation(id: string) {
    try {
      const response = await apiClient.get(`/conversations/${id}`);
      
      // Check if response and response.data exist before accessing properties
      if (!response || !response.data) {
        return null;
      }
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert backend conversation to extraction format
   */
  private convertToExtractionFormat(backendConv: any) {
    // Convert messages to ContentPart format
    const messages = (backendConv.messages || []).map((msg: any) => {
      const contentParts = (msg.parts || []).map((part: any) => {
        if (typeof part === 'string') {
          return { type: 'text', content: part };
        }
        
        switch (part.type) {
          case 'text':
            return {
              type: 'text',
              content: part.content || '',
              metadata: part.metadata || {}
            };
          case 'code':
            return {
              type: 'code',
              content: part.content || '',
              metadata: {
                language: part.language || 'javascript',
                ...part.metadata
              }
            };
          case 'image':
            return {
              type: 'image',
              content: part.content || '',
              metadata: {
                alt: part.alt || '',
                ...part.metadata
              }
            };
          case 'latex':
          case 'math':
            return {
              type: 'latex',
              content: part.content || '',
              metadata: part.metadata || {}
            };
          case 'table':
            return {
              type: 'table',
              content: part.content || { headers: [], rows: [] },
              metadata: part.metadata || {}
            };
          case 'mermaid':
            return {
              type: 'mermaid',
              content: part.content || '',
              metadata: {
                diagramType: part.diagramType || 'flowchart',
                ...part.metadata
              }
            };
          case 'tool_call':
            return {
              type: 'tool_call',
              content: {
                id: part.id || '',
                name: part.name || '',
                arguments: part.arguments || {}
              },
              metadata: part.metadata || {}
            };
          case 'tool_result':
            return {
              type: 'tool_result',
              content: {
                tool_call_id: part.tool_call_id || '',
                result: part.result || {}
              },
              metadata: part.metadata || {}
            };
          default:
            return {
              type: 'text',
              content: typeof part === 'string' ? part : JSON.stringify(part),
              metadata: {}
            };
        }
      });

      return {
        id: msg.id,
        role: msg.role,
        content: contentParts,
        timestamp: msg.createdAt || msg.timestamp,
        metadata: msg.metadata || {},
        parts: contentParts
      };
    });

    // Calculate stats
    const totalWords = messages.reduce((acc: number, msg: any) => {
      if (Array.isArray(msg.content)) {
        return acc + msg.content.reduce((wordAcc: number, part: any) => {
          return wordAcc + (part.content ? part.content.split(/\s+/).length : 0);
        }, 0);
      }
      return acc + (msg.content ? msg.content.split(/\s+/).length : 0);
    }, 0);

    const totalCharacters = messages.reduce((acc: number, msg: any) => {
      if (Array.isArray(msg.content)) {
        return acc + msg.content.reduce((charAcc: number, part: any) => {
          return charAcc + (part.content ? part.content.length : 0);
        }, 0);
      }
      return acc + (msg.content ? msg.content.length : 0);
    }, 0);

    const totalCodeBlocks = messages.reduce((acc: number, msg: any) => {
      if (Array.isArray(msg.content)) {
        return acc + msg.content.filter((part: any) => part.type === 'code').length;
      }
      return acc;
    }, 0);

    return {
      id: backendConv.id,
      title: backendConv.title || 'Untitled Conversation',
      provider: backendConv.provider || 'other',
      sourceUrl: backendConv.sourceUrl || '',
      messages,
      metadata: {
        ...backendConv.metadata,
        model: backendConv.model || 'unknown',
        importedFromBackend: true,
        backendId: backendConv.id
      },
      stats: {
        totalMessages: backendConv.messageCount || messages.length,
        totalWords: backendConv.totalWords || totalWords,
        totalCharacters: backendConv.totalCharacters || totalCharacters,
        totalCodeBlocks: backendConv.totalCodeBlocks || totalCodeBlocks,
        totalMermaidDiagrams: backendConv.totalMermaidDiagrams || 0,
        totalImages: backendConv.totalImages || 0,
        totalTables: backendConv.totalTables || 0,
        totalLatexBlocks: backendConv.totalLatexBlocks || 0,
        totalToolCalls: backendConv.totalToolCalls || 0,
        firstMessageAt: backendConv.createdAt,
        lastMessageAt: backendConv.updatedAt || backendConv.createdAt
      },
      createdAt: backendConv.createdAt,
      exportedAt: backendConv.capturedAt || backendConv.updatedAt
    };
  }

  /**
   * Check if sync is needed
   */
  async needsSync(): Promise<boolean> {
    try {
      const response = await apiClient.get('/conversations', {
        params: { limit: 1 }
      });

      // Check if response and response.data exist before accessing properties
      if (!response || !response.data) {
        return false;
      }

      // Check if pagination exists in response data
      if (!response.data.pagination) {
        return false;
      }

      const backendCount = response.data.pagination.total || 0;

      const localList = await conversationService.getAllConversations();
      const localCount = localList.length;

      return backendCount > localCount;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: Date.now() - this.lastSyncTime,
      cooldownRemaining: Math.max(0, this.syncCooldown - (Date.now() - this.lastSyncTime))
    };
  }
}

// Export singleton
export const conversationSyncService = new ConversationSyncService();
export default conversationSyncService;