/**
 * Stubbed Data Sync Service (Replaced by Network Engine P2P Sync)
 */

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
  
  async syncFullDatabase(onProgress?: (progress: SyncProgress) => void): Promise<SyncResult> {
    // P2P Sync is handled automatically by VivimChainClient via GossipSub
    return {
      success: true,
      syncedConversations: 0,
      errors: [],
      duration: 0
    };
  }

  async needsFullSync(): Promise<boolean> {
    return false; // Chain events sync automatically
  }

  getSyncStatus(): { isSyncing: boolean; lastSyncTime: number | null } {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: Date.now()
    };
  }
}

export const dataSyncService = new DataSyncService();