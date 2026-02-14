import { apiClient } from './api';
import { getStorage } from './storage-v2';
import { log } from './logger';

export interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export async function syncConversationsFromBackend(): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    log.sync.info('Starting sync from backend database...');

    // Step 1: Fetch conversations from backend
    log.sync.debug('Fetching conversations from /api/v1/conversations...');
    const response = await apiClient.get('/conversations', {
      params: { limit: 1000, offset: 0 }
    });

    const backendConversations = response.data?.conversations || [];
    log.sync.info(`Found ${backendConversations.length} conversations in backend database`);

    if (backendConversations.length === 0) {
      log.sync.info('No conversations found in backend database');
      return result;
    }

    // Step 2: Get local storage instance
    const storage = getStorage();

    // Step 3: Import each conversation
    for (const conv of backendConversations) {
      try {
        // Check if conversation already exists locally
        const existingRoot = await storage.getConversation(conv.id);
        if (existingRoot) {
          log.sync.debug(`Skipping ${conv.id.slice(0, 10)}... - already exists locally`);
          result.skipped++;
          continue;
        }

        // Fetch full conversation with messages from backend
        log.sync.debug(`Fetching full conversation ${conv.id.slice(0, 10)}...`);
        const fullConvResponse = await apiClient.get(`/conversations/${conv.id}`);
        const fullConv = fullConvResponse.data?.data;

        if (!fullConv) {
          result.failed++;
          result.errors.push(`Failed to fetch conversation ${conv.id}`);
          continue;
        }

        // Convert backend format to extraction format
        const extraction = convertBackendToExtractionFormat(fullConv);

        // Import into local storage
        log.sync.debug(`Importing ${conv.id.slice(0, 10)}... into local storage`);
        await storage.importFromExtraction(extraction);
        
        result.synced++;
        log.sync.info(`✓ Synced: "${conv.title}" (${conv.id.slice(0, 10)}...)`);

      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Failed to sync ${conv.id}: ${errorMsg}`);
        log.sync.error(`Failed to sync conversation ${conv.id}`, error as Error);
        console.error(`[SYNC] Failed to sync conversation ${conv.id}:`, error);
      }
    }

    log.sync.info(`Sync complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed`);
    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log.sync.error('Sync failed', error as Error);
    result.errors.push(`Sync failed: ${errorMsg}`);
    return result;
  }
}

/**
 * Convert backend conversation format to extraction format
 * for import into local storage
 */
function convertBackendToExtractionFormat(backendConv: any): {
  title: string;
  provider: string;
  sourceUrl: string;
  messages: any[];
  metadata: Record<string, any>;
  stats?: any;
  createdAt?: string;
  exportedAt?: string;
} {
  // Map backend format to extraction format
  const messages = (backendConv.messages || []).map((msg: any) => {
    // Convert parts to ContentPart[] format
    const contentParts = (msg.parts || []).map((part: any) => {
      if (typeof part === 'string') {
        return { type: 'text', content: part };
      }
      
      // Handle different part types
      switch (part.type) {
        case 'text':
          return {
            type: 'text',
            content: part.content || part.text || '',
            metadata: part.metadata || {}
          };
        case 'code':
          return {
            type: 'code',
            content: part.content || part.text || '',
            metadata: {
              language: part.language || 'javascript',
              ...part.metadata
            }
          };
        case 'image':
          return {
            type: 'image',
            content: part.content || part.url || '',
            metadata: {
              alt: part.alt || '',
              ...part.metadata
            }
          };
        case 'latex':
        case 'math':
          return {
            type: 'latex',
            content: part.content || part.text || '',
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
            content: part.content || part.text || '',
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
          // Fallback to text for unknown types
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
      parts: contentParts // Keep parts for backward compatibility
    };
  });

  // Calculate stats if not provided
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
    title: backendConv.title,
    provider: backendConv.provider,
    sourceUrl: backendConv.sourceUrl,
    messages,
    metadata: {
      ...backendConv.metadata,
      model: backendConv.model,
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
 * Check if backend has conversations that aren't in local storage
 */
export async function checkSyncStatus(): Promise<{
  backendCount: number;
  localCount: number;
  needsSync: boolean;
}> {
  try {
    // Get backend count
    const response = await apiClient.get('/conversations', {
      params: { limit: 1 }
    });
    const backendCount = response.data?.pagination?.total || 0;

    // Get local count
    const storage = getStorage();
    const localList = await storage.listConversations();
    const localCount = localList.length;

    return {
      backendCount,
      localCount,
      needsSync: backendCount > localCount
    };
  } catch (error) {
    log.sync.error('Failed to check sync status', error as Error);
    return {
      backendCount: 0,
      localCount: 0,
      needsSync: false
    };
  }
}

// Export singleton
export const dbSync = {
  syncConversationsFromBackend,
  checkSyncStatus
};

export default dbSync;
