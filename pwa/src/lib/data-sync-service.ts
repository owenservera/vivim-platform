/**
 * Full Database Sync Service
 * Handles complete database sync from backend to local storage on user login
 */

import { apiClient } from './api';
import { getStorage } from './storage-v2';
import { conversationService } from './service/conversation-service';
import { logger } from './logger';
import { useIdentityStore } from '../stores/identity.store';


export interface SyncProgress {
  phase: 'initializing' | 'fetching' | 'processing' | 'storing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export interface SyncResult {
  success: boolean;
  syncedConversations: number;
  errors: string[];
  duration: number;
}

export class DataSyncService {
  private isSyncing = false;
  
  /**
   * Performs a full database sync from backend to local storage
   */
  async syncFullDatabase(onProgress?: (progress: SyncProgress) => void): Promise<SyncResult> {
    const startTime = Date.now();
    
    const result: SyncResult = {
      success: false,
      syncedConversations: 0,
      errors: [],
      duration: 0
    };

    if (this.isSyncing) {
      result.errors.push('Sync already in progress');
      return result;
    }

    try {
      this.isSyncing = true;
      
      onProgress?.({
        phase: 'initializing',
        current: 0,
        total: 0,
        message: 'Initializing sync...'
      });

      // Step 1: Fetch all conversations from backend
      onProgress?.({
        phase: 'fetching',
        current: 0,
        total: 0,
        message: 'Fetching conversations from server...'
      });

      const allConversations = await this.fetchAllConversations();
      const totalConversations = allConversations.length;

      onProgress?.({
        phase: 'fetching',
        current: totalConversations,
        total: totalConversations,
        message: `Fetched ${totalConversations} conversations`
      });

      // Step 2: Process and store each conversation
      onProgress?.({
        phase: 'processing',
        current: 0,
        total: totalConversations,
        message: 'Processing conversations...'
      });

      for (let i = 0; i < allConversations.length; i++) {
        const conv = allConversations[i];
        
        onProgress?.({
          phase: 'processing',
          current: i + 1,
          total: totalConversations,
          message: `Processing ${conv.title || 'Untitled'} (${i + 1}/${totalConversations})`
        });

        try {
          // Convert backend conversation to local format and store
          await this.storeConversation(conv);
          result.syncedConversations++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to sync conversation ${conv.id}: ${errorMsg}`);
          logger.error('DataSyncService', `Failed to sync conversation ${conv.id}`, error as Error);
        }
      }

      // Step 3: Complete sync
      onProgress?.({
        phase: 'complete',
        current: result.syncedConversations,
        total: totalConversations,
        message: `Sync complete: ${result.syncedConversations} synced, ${result.errors.length} errors`
      });

      result.success = true;
      
    } catch (error) {
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Sync failed: ${errorMsg}`);
      logger.error('DataSyncService', 'Full database sync failed', error as Error);
    } finally {
      this.isSyncing = false;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Fetches all conversations from the backend
   * SECURITY: Only fetches conversations owned by the authenticated user
   */
  private async fetchAllConversations(): Promise<any[]> {
    try {
      // Add overall timeout for the entire fetch operation
      const overallTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('fetchAllConversations timed out after 45 seconds')), 45000)
      );

      const fetchOperation = (async () => {
        // Fetch all conversations in batches to handle large datasets
        const batchSize = 50;
        let offset = 0;
        let allConversations: any[] = [];
        let hasMore = true;

        while (hasMore) {
          // Add timeout to each batch request
          const batchTimeout = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Batch fetch timed out')), 10000)
          );

          // SECURITY: Backend filters by authenticated user's userId automatically
          const response = await Promise.race([
            apiClient.get('/conversations', {
              params: {
                limit: batchSize,
                offset,
                include_messages: true // Include messages in the response
              }
            }),
            batchTimeout
          ]);

          const batch = response?.data?.conversations || [];

          // SECURITY: Double-check ownership on client side
          // NOTE: The server already filters by userId, but we verify here as a belt-and-suspenders check.
          // We compare against userId (UUID), NOT did, because the server stores userId as ownerId.
          const currentUserId = useIdentityStore.getState().userId;
          const validBatch = batch.filter((conv: any) => {
            // If ownerId is set and doesn't match, skip (possible cross-user data leak)
            if (conv.ownerId && currentUserId && conv.ownerId !== currentUserId) {
              logger.warn('DataSyncService', `Conversation ${conv.id} ownerId mismatch (expected ${currentUserId}, got ${conv.ownerId}), skipping`);
              return false;
            }
            return true;
          });

          allConversations = allConversations.concat(validBatch);

          // If we got fewer than the batch size, we've reached the end
          hasMore = batch.length === batchSize;
          offset += batchSize;
        }

        return allConversations;
      })();

      return await Promise.race([fetchOperation, overallTimeout]);
    } catch (error) {
      logger.error('DataSyncService', 'Failed to fetch conversations from backend', error as Error);
      throw error;
    }
  }

  /**
   * Stores a single conversation in local storage
   */
  private async storeConversation(backendConv: any): Promise<void> {
    try {
      // Convert backend conversation format to local extraction format
      const extractionFormat = this.convertToExtractionFormat(backendConv);
      
      // Import into local storage using the existing import mechanism
      const storage = getStorage();
      await storage.importFromExtraction(extractionFormat);
    } catch (error) {
      logger.error('DataSyncService', `Failed to store conversation ${backendConv.id}`, error as Error);
      throw error;
    }
  }

  /**
   * Converts backend conversation format to local extraction format
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
      state: (backendConv.state as 'ACTIVE' | 'ARCHIVED' | 'DELETED') || 'ACTIVE',
      version: backendConv.version || 1,
      ownerId: backendConv.ownerId || undefined,
      contentHash: backendConv.contentHash || undefined,
      createdAt: backendConv.createdAt,
      updatedAt: backendConv.updatedAt || backendConv.createdAt,
      capturedAt: backendConv.capturedAt || backendConv.createdAt,
      exportedAt: backendConv.capturedAt || backendConv.updatedAt, // Deprecated, kept for compatibility
      tags: backendConv.tags || [],
      messages,
      metadata: {
        ...backendConv.metadata,
        model: backendConv.model || 'unknown',
        importedFromBackend: true,
        backendId: backendConv.id,
        tags: backendConv.tags || []
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
      }
    };
  }

  /**
   * Checks if a full sync is needed (e.g., if no data exists locally)
   */
  async needsFullSync(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging when storage is slow
      const localConversations = await Promise.race([
        conversationService.getAllConversations(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('needsFullSync check timed out after 10 seconds')), 10000)
        )
      ]);
      return localConversations.length === 0;
    } catch (error) {
      // If there's an error checking local data, assume we need a sync
      console.warn('[DataSyncService] Error checking if sync needed:', error);
      return false; // Changed to false to avoid unnecessary syncs on timeout
    }
  }

  /**
   * Gets the current sync status
   */
  getSyncStatus(): { isSyncing: boolean; lastSyncTime: number | null } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: null // Could be enhanced to track last sync time
    };
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();