/**
 * Sync Engine (Client-Side)
 * 
 * Orchestrates local-first data flow:
 * 1. Writes to Local OpLog (IndexedDB)
 * 2. Queues for Network Push (Outbox)
 * 3. Pulls remote changes via Delta-Sync
 * 4. Resolves conflicts using HLC
 */

import { HLC } from './hlc';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import { ErrorReporter } from '../../../../common/error-reporting';

export type OperationType = 'INSERT' | 'UPDATE' | 'DELETE';
export type EntityType = 'conversation' | 'message' | 'acu';

export interface SyncOperation {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: OperationType;
  payload: any;
  hlcTimestamp: string;
  synced: boolean;
}

const DB_NAME = 'vivim-sync-store';
const STORE_OPLOG = 'oplog';
const STORE_META = 'metadata';

export class SyncEngine {
  private db: IDBPDatabase;
  private hlc: HLC;
  private deviceId: string;
  private apiBaseUrl: string;

  constructor(deviceId: string, apiBaseUrl: string) {
    this.deviceId = deviceId;
    this.apiBaseUrl = apiBaseUrl;
    this.hlc = HLC.init(deviceId);
  }

  async init() {
    this.db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        // OpLog Store: Primary Key is HLC Timestamp to ensure causal ordering
        if (!db.objectStoreNames.contains(STORE_OPLOG)) {
          const store = db.createObjectStore(STORE_OPLOG, { keyPath: 'id' });
          store.createIndex('synced', 'synced');
          store.createIndex('hlcTimestamp', 'hlcTimestamp');
        }
        // Metadata Store: Key-Value for cursors, config
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }

  /**
   * Record a local change (Optimistic Update)
   */
  async recordChange(entityType: EntityType, entityId: string, operation: OperationType, payload: any) {
    const timestamp = this.hlc.now();
    const op: SyncOperation = {
      id: uuidv4(),
      entityType,
      entityId,
      operation,
      payload,
      hlcTimestamp: timestamp,
      synced: false
    };

    await this.db.put(STORE_OPLOG, op);
    
    // Trigger background sync
    this.triggerSync();
    
    return op;
  }

  /**
   * Trigger the sync process with exponential backoff retries
   */
  async triggerSync(retryCount = 0) {
    if (!navigator.onLine) return;

    try {
      await this.pushChanges();
      await this.pullChanges();
    } catch (error) {
      console.error(`[SyncEngine] Sync failed (Attempt ${retryCount + 1}):`, error);
      
      // Report to centralized system
      const reporter = ErrorReporter.getInstance();
      reporter.report({
        level: 'error',
        component: 'pwa',
        category: 'sync',
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stack: error instanceof Error ? error.stack : undefined,
        context: { retryCount, deviceId: this.deviceId },
        severity: retryCount >= 3 ? 'high' : 'medium'
      });

      const MAX_RETRIES = 5;
      if (retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000 + (Math.random() * 1000);
        setTimeout(() => this.triggerSync(retryCount + 1), delay);
      }
    }
  }

  /**
   * Push pending local changes to server
   */
  private async pushChanges() {
    const pendingOps = await this.db.getAllFromIndex(STORE_OPLOG, 'synced', 0); // 0 = false
    if (pendingOps.length === 0) return;

    // Batch them (e.g., 50 at a time)
    const batch = pendingOps.slice(0, 50);

    const response = await fetch(`${this.apiBaseUrl}/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: this.deviceId,
        operations: batch
      })
    });

    if (!response.ok) throw new Error('Push failed');

    const result = await response.json();
    
    // Mark successful ops as synced
    const tx = this.db.transaction(STORE_OPLOG, 'readwrite');
    await Promise.all(batch.map(op => {
      // If server accepted it, mark synced
      // If conflict, we might need to handle differently, but for now mark synced (server wins/merged)
      return tx.store.put({ ...op, synced: true });
    }));
    await tx.done;
  }

  /**
   * Pull remote changes from server
   */
  private async pullChanges() {
    const lastSyncCursor = await this.db.get(STORE_META, 'lastSyncCursor');
    
    const response = await fetch(`${this.apiBaseUrl}/sync/pull?deviceId=${this.deviceId}&lastSyncId=${lastSyncCursor || ''}`);
    if (!response.ok) throw new Error('Pull failed');

    const data = await response.json();
    if (data.operations.length === 0) return;

    const tx = this.db.transaction([STORE_OPLOG, STORE_META], 'readwrite');
    
    for (const remoteOp of data.operations) {
      // Update HLC to ensure local clock catches up to remote events
      this.hlc.update(remoteOp.hlcTimestamp);

      // Apply to local domain model (not implemented here, would call a DomainHandler)
      // await applyToLocalDB(remoteOp);
    }

    // Update cursor
    await tx.objectStore(STORE_META).put(data.syncId, 'lastSyncCursor');
    await tx.done;
  }
}
