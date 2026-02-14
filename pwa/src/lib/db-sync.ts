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
  const messages = (backendConv.messages || []).map((msg: any) => ({
    id: msg.id,
    role: msg.role,
    content: msg.parts || [],
    timestamp: msg.createdAt,
    metadata: msg.metadata || {}
  }));

  return {
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
      totalWords: backendConv.totalWords || 0,
      totalCharacters: backendConv.totalCharacters || 0,
      totalCodeBlocks: backendConv.totalCodeBlocks || 0,
      totalMermaidDiagrams: backendConv.totalMermaidDiagrams || 0,
      totalImages: backendConv.totalImages || 0,
      totalTables: backendConv.totalTables || 0,
      firstMessageAt: backendConv.createdAt,
      lastMessageAt: backendConv.updatedAt
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
