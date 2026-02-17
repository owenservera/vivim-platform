/**
 * IndexedDB and Storage Health Check Utility
 * 
 * Provides comprehensive debugging and diagnostics for the entire
 * IndexedDB -> Storage -> Service -> Frontend data flow.
 * 
 * Usage:
 *   import { runStorageHealthCheck } from './lib/debug/health-check';
 *   await runStorageHealthCheck();
 * 
 * Or in browser console (after adding to window):
 *   window.runStorageHealthCheck?.()
 */

import { getStorage } from '../storage-v2';
import { conversationService } from './service/conversation-service';
import { apiClient } from './api';
import { logger, log } from '../logger';
import { idbDebugger } from '../storage-v2/object-store';

export interface HealthCheckResult {
  timestamp: string;
  overall: 'healthy' | 'warning' | 'critical';
  checks: {
    indexedDB: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details: any;
    };
    storage: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details: any;
    };
    conversations: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details: any;
    };
    api: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details: any;
    };
    recentErrors: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details: any;
    };
  };
}

export async function runStorageHealthCheck(): Promise<HealthCheckResult> {
  const checkId = `health_${Date.now()}`;
  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    checks: {
      indexedDB: { status: 'pass', message: '', details: {} },
      storage: { status: 'pass', message: '', details: {} },
      conversations: { status: 'pass', message: '', details: {} },
      api: { status: 'pass', message: '', details: {} },
      recentErrors: { status: 'pass', message: '', details: {} }
    }
  };

  console.log(`\n🩺 [${checkId}] ========== STORAGE HEALTH CHECK START ==========\n`);

  // Check 1: IndexedDB Status
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      result.checks.indexedDB.status = 'fail';
      result.checks.indexedDB.message = 'IndexedDB not available';
      result.overall = 'critical';
    } else {
      const databasesReq = window.indexedDB.databases();
      const databases = await new Promise<IDBDatabaseInfo[]>((resolve, reject) => {
        databasesReq.onsuccess = () => resolve(databasesReq.result);
        databasesReq.onerror = () => reject(databasesReq.error);
      });
      
      const openScrollDB = databases.find(db => db.name === 'OpenScrollV2');
      if (openScrollDB) {
        result.checks.indexedDB.status = 'pass';
        result.checks.indexedDB.message = `IndexedDB available: OpenScrollV2 v${openScrollDB.version}`;
        result.checks.indexedDB.details = { databases: databases.map(d => ({ name: d.name, version: d.version })) };
      } else {
        result.checks.indexedDB.status = 'warning';
        result.checks.indexedDB.message = 'IndexedDB available but OpenScrollV2 not found (may be created on first use)';
        result.checks.indexedDB.details = { databases: databases.map(d => ({ name: d.name, version: d.version })) };
        result.overall = result.overall === 'critical' ? 'critical' : 'warning';
      }
    }
  } catch (error) {
    result.checks.indexedDB.status = 'fail';
    result.checks.indexedDB.message = `IndexedDB error: ${error instanceof Error ? error.message : String(error)}`;
    result.checks.indexedDB.details = { error: error instanceof Error ? error.message : String(error) };
    result.overall = 'critical';
  }

  console.log(`🗄️  [${checkId}] IndexedDB: ${result.checks.indexedDB.status.toUpperCase()} - ${result.checks.indexedDB.message}`);

  // Check 2: Storage Layer
  try {
    const storage = getStorage();
    const stats = await storage.getStats();
    
    result.checks.storage.status = 'pass';
    result.checks.storage.message = `Storage initialized: ${stats.totalConversations} conversations, ${stats.totalMessages} messages`;
    result.checks.storage.details = stats;
  } catch (error) {
    result.checks.storage.status = 'fail';
    result.checks.storage.message = `Storage error: ${error instanceof Error ? error.message : String(error)}`;
    result.checks.storage.details = { error: error instanceof Error ? error.message : String(error) };
    result.overall = 'critical';
  }

  console.log(`💾  [${checkId}] Storage: ${result.checks.storage.status.toUpperCase()} - ${result.checks.storage.message}`);

  // Check 3: Conversation Service
  try {
    const conversations = await conversationService.getAllConversations();
    
    result.checks.conversations.status = conversations.length > 0 ? 'pass' : 'warning';
    result.checks.conversations.message = `Conversation service working: ${conversations.length} conversations`;
    result.checks.conversations.details = { count: conversations.length };
    
    if (conversations.length === 0) {
      result.overall = result.overall === 'critical' ? 'critical' : 'warning';
    }
  } catch (error) {
    result.checks.conversations.status = 'fail';
    result.checks.conversations.message = `Conversation service error: ${error instanceof Error ? error.message : String(error)}`;
    result.checks.conversations.details = { error: error instanceof Error ? error.message : String(error) };
    result.overall = 'critical';
  }

  console.log(`💬  [${checkId}] Conversations: ${result.checks.conversations.status.toUpperCase()} - ${result.checks.conversations.message}`);

  // Check 4: API Connectivity
  try {
    const response = await apiClient.get('/conversations', { params: { limit: 1 } });
    
    if (response.status === 200) {
      result.checks.api.status = 'pass';
      result.checks.api.message = `API accessible: ${response.status}`;
      result.checks.api.details = { status: response.status, hasData: !!response.data };
    } else if (response.status === 304) {
      result.checks.api.status = 'pass';
      result.checks.api.message = 'API accessible: 304 Not Modified (cached)';
      result.checks.api.details = { status: 304 };
    } else {
      result.checks.api.status = 'warning';
      result.checks.api.message = `API returned: ${response.status}`;
      result.checks.api.details = { status: response.status };
    }
  } catch (error) {
    result.checks.api.status = 'fail';
    result.checks.api.message = `API error: ${error instanceof Error ? error.message : String(error)}`;
    result.checks.api.details = { error: error instanceof Error ? error.message : String(error) };
    result.overall = result.overall === 'critical' ? 'critical' : 'warning';
  }

  console.log(`🌐  [${checkId}] API: ${result.checks.api.status.toUpperCase()} - ${result.checks.api.message}`);

  // Check 5: Recent Errors
  try {
    const recentIdbErrors = idbDebugger.getRecentErrors(10);
    const recentStorageLogs = log.storage.getLogs?.().filter(l => l.level === 'ERROR').slice(-10) || [];
    
    const totalErrors = recentIdbErrors.length + recentStorageLogs.length;
    
    if (totalErrors > 0) {
      result.checks.recentErrors.status = 'warning';
      result.checks.recentErrors.message = `${totalErrors} recent errors found`;
      result.checks.recentErrors.details = { 
        indexedDBErrors: recentIdbErrors.length, 
        storageErrors: recentStorageLogs.length 
      };
      result.overall = result.overall === 'critical' ? 'critical' : 'warning';
    } else {
      result.checks.recentErrors.status = 'pass';
      result.checks.recentErrors.message = 'No recent errors';
      result.checks.recentErrors.details = {};
    }
  } catch (error) {
    result.checks.recentErrors.status = 'warning';
    result.checks.recentErrors.message = 'Could not retrieve recent errors';
    result.checks.recentErrors.details = {};
  }

  console.log(`⚠️  [${checkId}] Recent Errors: ${result.checks.recentErrors.status.toUpperCase()} - ${result.checks.recentErrors.message}`);

  console.log(`\n🩺 [${checkId}] ========== HEALTH CHECK COMPLETE ==========`);
  console.log(`📊 Overall Status: ${result.overall.toUpperCase()}\n`);

  return result;
}

export function getIndexedDBDiagnostics() {
  return {
    recentOperations: idbDebugger.getOperations().slice(-50),
    recentErrors: idbDebugger.getRecentErrors(10),
    storageLogs: log.storage.getLogs?.().slice(-100) || []
  };
}

export function clearAllDebugData() {
  idbDebugger.clear();
  log.storage.clearLogs?.();
  console.log('🗑️  Debug data cleared');
}

// Expose to window for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).runStorageHealthCheck = runStorageHealthCheck;
  (window as any).getIndexedDBDiagnostics = getIndexedDBDiagnostics;
  (window as any).clearAllDebugData = clearAllDebugData;
}
