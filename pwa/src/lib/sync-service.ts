/**
 * Sync Service for PWA
 * 
 * Handles synchronization between PWA and server
 * Implements offline-first with background sync
 */

import { apiClient } from './api';

export interface SyncChange {
  id: string;
  type: 'conversation' | 'message';
  action: 'upsert' | 'delete';
  data: any;
  timestamp: string;
}

export interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
  syncing: boolean;
  error: string | null;
}

class SyncService {
  private deviceId: string;
  private userId: string | null = null;
  private lastSyncTimestamp: string | null = null;
  private pendingChanges: SyncChange[] = [];
  private syncing: boolean = false;
  private syncInterval: number | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    // Get or create device ID
    this.deviceId = this.getOrCreateDeviceId();
    
    // Load pending changes from IndexedDB
    this.loadPendingChanges();
    
    // Load last sync timestamp
    this.lastSyncTimestamp = localStorage.getItem('lastSyncTimestamp');
  }

  /**
   * Initialize sync service
   */
  async initialize(userId?: string) {
    if (userId) {
      this.userId = userId;
    }

    // Start auto-sync
    this.startAutoSync();

    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Initial sync if online
    if (navigator.onLine) {
      await this.sync();
    }
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Queue a change for sync
   */
  queueChange(change: Omit<SyncChange, 'id' | 'timestamp'>) {
    const syncChange: SyncChange = {
      ...change,
      id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.pendingChanges.push(syncChange);
    this.savePendingChanges();
    this.notifyListeners();

    // Try to sync immediately if online
    if (navigator.onLine && !this.syncing) {
      this.sync();
    }
  }

  /**
   * Perform sync
   */
  async sync(): Promise<void> {
    if (this.syncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Offline, skipping sync');
      return;
    }

    this.syncing = true;
    this.notifyListeners();

    try {
      // Step 1: Push local changes
      if (this.pendingChanges.length > 0) {
        await this.pushChanges();
      }

      // Step 2: Pull server changes
      await this.pullChanges();

      // Update last sync timestamp
      this.lastSyncTimestamp = new Date().toISOString();
      localStorage.setItem('lastSyncTimestamp', this.lastSyncTimestamp);

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners();
      throw error;
    } finally {
      this.syncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Push local changes to server
   */
  private async pushChanges(): Promise<void> {
    try {
      const response = await apiClient.post('/sync/push', {
        deviceId: this.deviceId,
        userId: this.userId,
        changes: this.pendingChanges,
        lastSyncTimestamp: this.lastSyncTimestamp
      });

      const { results } = response.data;

      // Remove accepted changes
      if (results.accepted && results.accepted.length > 0) {
        this.pendingChanges = this.pendingChanges.filter(
          change => !results.accepted.includes(change.id)
        );
        this.savePendingChanges();
      }

      // Handle conflicts
      if (results.conflicts && results.conflicts.length > 0) {
        console.warn('Sync conflicts detected:', results.conflicts);
        // For now, use server version (last-write-wins)
        for (const conflict of results.conflicts) {
          this.pendingChanges = this.pendingChanges.filter(
            change => change.id !== conflict.changeId
          );
        }
        this.savePendingChanges();
      }

      // Handle rejections
      if (results.rejected && results.rejected.length > 0) {
        console.error('Some changes were rejected:', results.rejected);
        // Remove rejected changes
        const rejectedIds = results.rejected.map((r: any) => r.changeId);
        this.pendingChanges = this.pendingChanges.filter(
          change => !rejectedIds.includes(change.id)
        );
        this.savePendingChanges();
      }
    } catch (error) {
      console.error('Failed to push changes:', error);
      throw error;
    }
  }

  /**
   * Pull server changes
   */
  private async pullChanges(): Promise<void> {
    try {
      const response = await apiClient.get('/sync/pull', {
        params: {
          deviceId: this.deviceId,
          userId: this.userId,
          since: this.lastSyncTimestamp || new Date(0).toISOString()
        }
      });

      const { changes } = response.data;

      // Apply changes to local storage
      if (changes.conversations && changes.conversations.length > 0) {
        for (const change of changes.conversations) {
          await this.applyChange(change);
        }
      }

      if (changes.messages && changes.messages.length > 0) {
        for (const change of changes.messages) {
          await this.applyChange(change);
        }
      }

      console.log(`Pulled ${changes.conversations?.length || 0} conversations and ${changes.messages?.length || 0} messages`);
    } catch (error) {
      console.error('Failed to pull changes:', error);
      throw error;
    }
  }

  /**
   * Apply a change to local storage
   */
  private async applyChange(change: any): Promise<void> {
    // This would integrate with your local storage system (IndexedDB, Yjs, etc.)
    // For now, we'll emit an event that components can listen to
    window.dispatchEvent(new CustomEvent('sync:change', { detail: change }));
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    try {
      const response = await apiClient.get('/sync/status', {
        params: {
          deviceId: this.deviceId,
          userId: this.userId
        }
      });

      return {
        lastSync: this.lastSyncTimestamp,
        pendingChanges: this.pendingChanges.length,
        syncing: this.syncing,
        error: null
      };
    } catch (error) {
      return {
        lastSync: this.lastSyncTimestamp,
        pendingChanges: this.pendingChanges.length,
        syncing: this.syncing,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(): Promise<void> {
    return this.sync();
  }

  /**
   * Start auto-sync
   */
  private startAutoSync(intervalMs: number = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.sync().catch(err => {
          console.error('Auto-sync failed:', err);
        });
      }
    }, intervalMs);
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Handle online event
   */
  private handleOnline() {
    console.log('Device is online, syncing...');
    this.sync().catch(err => {
      console.error('Sync on online failed:', err);
    });
  }

  /**
   * Handle offline event
   */
  private handleOffline() {
    console.log('Device is offline');
    this.notifyListeners();
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void) {
    this.listeners.add(listener);
    
    // Immediately call with current status
    listener({
      lastSync: this.lastSyncTimestamp,
      pendingChanges: this.pendingChanges.length,
      syncing: this.syncing,
      error: null
    });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    const status: SyncStatus = {
      lastSync: this.lastSyncTimestamp,
      pendingChanges: this.pendingChanges.length,
      syncing: this.syncing,
      error: null
    };

    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Save pending changes to IndexedDB
   */
  private savePendingChanges() {
    try {
      localStorage.setItem('pendingChanges', JSON.stringify(this.pendingChanges));
    } catch (error) {
      console.error('Failed to save pending changes:', error);
    }
  }

  /**
   * Load pending changes from IndexedDB
   */
  private loadPendingChanges() {
    try {
      const stored = localStorage.getItem('pendingChanges');
      if (stored) {
        this.pendingChanges = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load pending changes:', error);
      this.pendingChanges = [];
    }
  }

  /**
   * Clear all pending changes (use with caution)
   */
  clearPendingChanges() {
    this.pendingChanges = [];
    this.savePendingChanges();
    this.notifyListeners();
  }
}

// Export singleton instance
export const syncService = new SyncService();

export default syncService;
