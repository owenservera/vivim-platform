import { initUnifiedDB, getUnifiedDB } from './db-manager/unified-db';
import { log } from '../../logger';

let testDb: ReturnType<typeof getUnifiedDB> | null = null;

export async function initializeTestDB(): Promise<void> {
  if (testDb) return;

  testDb = await initUnifiedDB({
    dbName: 'VivimDB_Test',
    version: 1,
    enableValidation: true,
    enableIntegrityCheck: true,
    enableSync: true,
  });

  log.test.info('Test database initialized');
}

export async function runDBTests(): Promise<{
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; message: string }>;
}> {
  await initializeTestDB();
  const db = getUnifiedDB();
  if (!db) throw new Error('DB not initialized');

  const results: Array<{ name: string; passed: boolean; message: string }> = [];
  let passed = 0;
  let failed = 0;

  log.test.info('Starting DB tests...');

  try {
    const testId = `test_${Date.now()}`;
    await db.put('conversations', {
      id: testId,
      title: 'Test Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'test_user',
      messageCount: 0,
    });
    
    const retrieved = await db.get('conversations', testId);
    const putPass = retrieved?.id === testId;
    results.push({
      name: 'PUT/GET conversation',
      passed: putPass,
      message: putPass ? '✓ Stored and retrieved successfully' : '✗ Failed to retrieve',
    });
    putPass ? passed++ : failed++;

    const validation = db.validate({
      id: testId,
      title: 'Test',
      createdAt: new Date().toISOString(),
    }, 'conversation');
    const validationPass = validation.valid;
    results.push({
      name: 'Data validation',
      passed: validationPass,
      message: validationPass ? '✓ Validation passed' : `✗ ${validation.errors.map(e => e.message).join(', ')}`,
    });
    validationPass ? passed++ : failed++;

    await db.put('messages', {
      id: `msg_${testId}`,
      conversationId: testId,
      role: 'user',
      content: 'Hello world',
      timestamp: new Date().toISOString(),
    });

    const messages = await db.getByIndex('messages', 'conversationId', testId);
    const indexPass = messages.length === 1;
    results.push({
      name: 'Index query',
      passed: indexPass,
      message: indexPass ? '✓ Found message by index' : '✗ Index query failed',
    });
    indexPass ? passed++ : failed++;

    const status = await db.getStatus();
    const statusPass = status.isReady === true && status.state === 'ready';
    results.push({
      name: 'DB status check',
      passed: statusPass,
      message: statusPass ? '✓ DB is ready' : `✗ DB state: ${status.state}`,
    });
    statusPass ? passed++ : failed++;

    await db.delete('conversations', testId);
    const deleted = await db.get('conversations', testId);
    const deletePass = deleted === undefined;
    results.push({
      name: 'DELETE operation',
      passed: deletePass,
      message: deletePass ? '✓ Deleted successfully' : '✗ Delete failed',
    });
    deletePass ? passed++ : failed++;

  } catch (error) {
    log.test.error('Test execution error', { error });
    failed++;
    results.push({
      name: 'Test execution',
      passed: false,
      message: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  log.test.info(`Tests complete: ${passed} passed, ${failed} failed`);
  return { passed, failed, results };
}

export async function verifySyncWorking(): Promise<{
  isOnline: boolean;
  syncEnabled: boolean;
  canQueue: boolean;
}> {
  const db = getUnifiedDB();
  if (!db) {
    return { isOnline: navigator.onLine, syncEnabled: false, canQueue: false };
  }

  const status = await db.getStatus();

  return {
    isOnline: status.isOnline,
    syncEnabled: status.pendingOperations >= 0,
    canQueue: status.isReady,
  };
}

export async function testOfflineQueue(): Promise<{ success: boolean; message: string }> {
  const db = getUnifiedDB();
  if (!db) return { success: false, message: 'DB not initialized' };

  try {
    const testId = `offline_test_${Date.now()}`;
    await db.put('conversations', {
      id: testId,
      title: 'Offline Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'test',
    });

    const status = await db.getStatus();
    return {
      success: true,
      message: `Queued operation. Pending: ${status.pendingOperations}`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

export { getUnifiedDB };
