import type { IDBPDatabase, IDBObjectStore } from 'idb';
import { log } from '../../logger';

export interface IntegrityReport {
  isHealthy: boolean;
  checkedAt: string;
  stores: StoreReport[];
  corruptedStores: string[];
  totalRecords: number;
  totalIssues: number;
}

export interface StoreReport {
  name: string;
  recordCount: number;
  isHealthy: boolean;
  issues: StoreIssue[];
}

export interface StoreIssue {
  type: 'missing_required' | 'invalid_type' | 'corrupted' | 'orphaned';
  key?: IDBValidKey;
  message: string;
}

export class IntegrityChecker {
  private checksumCache: Map<string, string> = new Map();
  private integrityEnabled = true;

  async checkDatabase(db: IDBPDatabase): Promise<IntegrityReport> {
    const stores: StoreReport[] = [];
    let totalRecords = 0;
    let totalIssues = 0;
    const corruptedStores: string[] = [];

    const storeNames = Array.from(db.objectStoreNames);

    for (const storeName of storeNames) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const report = await this.checkStore(store, storeName, db);
      
      stores.push(report);
      totalRecords += report.recordCount;
      totalIssues += report.issues.length;

      if (!report.isHealthy) {
        corruptedStores.push(storeName);
      }
    }

    return {
      isHealthy: corruptedStores.length === 0,
      checkedAt: new Date().toISOString(),
      stores,
      corruptedStores,
      totalRecords,
      totalIssues,
    };
  }

  private async checkStore(
    store: IDBObjectStore,
    storeName: string,
    db: IDBPDatabase
  ): Promise<StoreReport> {
    const issues: StoreIssue[] = [];
    let recordCount = 0;

    try {
      const keys = await this.getAllKeys(store);
      recordCount = keys.length;

      for (const key of keys) {
        try {
          const value = await store.get(key);
          
          if (value === undefined) {
            issues.push({
              type: 'corrupted',
              key,
              message: `Record not found for key: ${String(key)}`,
            });
            continue;
          }

          const validationIssues = this.validateRecord(value, storeName);
          issues.push(...validationIssues);
        } catch (error) {
          issues.push({
            type: 'corrupted',
            key,
            message: `Error reading record: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }

      const orphaned = await this.findOrphanedRecords(storeName, keys, db);
      issues.push(...orphaned);
    } catch (error) {
      issues.push({
        type: 'corrupted',
        message: `Store scan failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }

    return {
      name: storeName,
      recordCount,
      isHealthy: issues.length === 0,
      issues,
    };
  }

  private async getAllKeys(store: IDBObjectStore): Promise<IDBValidKey[]> {
    return new Promise((resolve, reject) => {
      const keys: IDBValidKey[] = [];
      const request = store.openKeyCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          keys.push(cursor.key);
          cursor.continue();
        } else {
          resolve(keys);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private validateRecord(value: unknown, storeName: string): StoreIssue[] {
    const issues: StoreIssue[] = [];

    if (storeName === 'conversations') {
      const conv = value as Record<string, unknown>;
      if (!conv.id || typeof conv.id !== 'string') {
        issues.push({ type: 'missing_required', message: 'Missing or invalid id' });
      }
      if (!conv.title || typeof conv.title !== 'string') {
        issues.push({ type: 'missing_required', message: 'Missing or invalid title' });
      }
      if (!conv.createdAt) {
        issues.push({ type: 'missing_required', message: 'Missing createdAt' });
      }
    } else if (storeName === 'messages') {
      const msg = value as Record<string, unknown>;
      if (!msg.id || typeof msg.id !== 'string') {
        issues.push({ type: 'missing_required', message: 'Missing or invalid id' });
      }
      if (!msg.conversationId || typeof msg.conversationId !== 'string') {
        issues.push({ type: 'missing_required', message: 'Missing or invalid conversationId' });
      }
      if (!msg.role) {
        issues.push({ type: 'missing_required', message: 'Missing role' });
      }
    } else if (storeName === 'objects') {
      const node = value as Record<string, unknown>;
      if (!node.id || typeof node.id !== 'string') {
        issues.push({ type: 'missing_required', message: 'Missing or invalid id' });
      }
      if (!node.type) {
        issues.push({ type: 'missing_required', message: 'Missing type' });
      }
    }

    return issues;
  }

  private async findOrphanedRecords(
    storeName: string,
    keys: IDBValidKey[],
    _db: IDBPDatabase
  ): Promise<StoreIssue[]> {
    const issues: StoreIssue[] = [];

    if (storeName === 'messages') {
      const conversationIds = new Set<string>();
      
      const conversationsTx = _db.transaction('conversations', 'readonly');
      const conversationsStore = conversationsTx.objectStore('conversations');
      const convKeys = await this.getAllKeys(conversationsStore);
      
      for (const convKey of convKeys) {
        const conv = await conversationsStore.get(convKey);
        if (conv && (conv as Record<string, unknown>).id) {
          conversationIds.add(String((conv as Record<string, unknown>).id));
        }
      }

      for (const key of keys) {
        const msgTx = _db.transaction('messages', 'readonly');
        const msgStore = msgTx.objectStore('messages');
        const msg = await msgStore.get(key);
        
        if (msg && (msg as Record<string, unknown>).conversationId) {
          const convId = String((msg as Record<string, unknown>).conversationId);
          if (!conversationIds.has(convId)) {
            issues.push({
              type: 'orphaned',
              key,
              message: `Message references non-existent conversation: ${convId}`,
            });
          }
        }
      }
    }

    return issues;
  }

  async computeChecksum(data: unknown): Promise<string> {
    const str = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(str);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  async verifyChecksum(data: unknown, expectedChecksum: string): Promise<boolean> {
    const actual = await this.computeChecksum(data);
    return actual === expectedChecksum;
  }

  async computeStoreChecksum(db: IDBPDatabase, storeName: string): Promise<string> {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const keys = await this.getAllKeys(store);
    
    const records: Record<string, unknown> = {};
    for (const key of keys) {
      const value = await store.get(key);
      if (value) {
        records[String(key)] = value;
      }
    }
    
    return this.computeChecksum(records);
  }

  async computeDatabaseChecksum(db: IDBPDatabase): Promise<string> {
    const checksums: Record<string, string> = {};
    const storeNames = Array.from(db.objectStoreNames);
    
    for (const storeName of storeNames) {
      checksums[storeName] = await this.computeStoreChecksum(db, storeName);
    }
    
    return this.computeChecksum(checksums);
  }

  async exportIntegrityReport(db: IDBPDatabase): Promise<string> {
    const report = await this.checkDatabase(db);
    return JSON.stringify(report, null, 2);
  }

  async importAndVerify(
    db: IDBPDatabase,
    _importedData: Record<string, unknown[]>
  ): Promise<{ success: boolean; issues: StoreIssue[] }> {
    const issues: StoreIssue[] = [];

    return { success: issues.length === 0, issues };
  }

  enableIntegrityChecks(): void {
    this.integrityEnabled = true;
  }

  disableIntegrityChecks(): void {
    this.integrityEnabled = false;
  }

  areIntegrityChecksEnabled(): boolean {
    return this.integrityEnabled;
  }
}
