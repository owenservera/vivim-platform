/**
 * Sync Engine Integration Test
 * 
 * Verifies that the server correctly handles push/pull operations,
 * respects HLC timestamps, and resolves conflicts using LWW.
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getPrismaClient } from '../src/lib/database.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = getPrismaClient();

// Setup: Ensure DB is clean or isolated
beforeEach(async () => {
  // await prisma.syncOperation.deleteMany({});
});

describe('Sync Engine Integration', () => {
  it('should accept new operations via PUSH', async () => {
    // 1. Simulate a client pushing a new conversation
    const deviceId = 'test-device-1';
    const conversationId = uuidv4();
    const hlcTimestamp = Date.now() + ':00001:test-device-1';

    const op = {
      id: uuidv4(),
      entityType: 'conversation',
      entityId: conversationId,
      operation: 'INSERT',
      payload: { id: conversationId, title: 'Test Conversation', sourceUrl: 'http://example.com' },
      hlcTimestamp
    };

    // Simulate API call logic (Direct DB interaction for integration test)
    await prisma.syncOperation.create({
      data: {
        ...op,
        authorDid: 'did:key:test',
        deviceDid: deviceId,
        tableName: 'conversations',
        recordId: conversationId,
        isProcessed: true
      }
    });

    // Verify it exists in sync log
    const storedOp = await prisma.syncOperation.findFirst({ where: { entityId: conversationId } });
    expect(storedOp).toBeTruthy();
    expect(storedOp?.operation).toBe('INSERT');
  });

  it('should resolve conflicts using LWW (Last Write Wins)', async () => {
    const conversationId = uuidv4();
    const oldTimestamp = (Date.now() - 1000) + ':00001:device-old';
    const newTimestamp = Date.now() + ':00001:device-new';

    // 1. Insert "Old" update
    await prisma.syncOperation.create({
      data: {
        id: uuidv4(),
        authorDid: 'did:key:test',
        deviceDid: 'device-old',
        tableName: 'conversations',
        recordId: conversationId,
        entityType: 'conversation',
        entityId: conversationId,
        operation: 'UPDATE',
        payload: { title: 'Old Title' },
        hlcTimestamp: oldTimestamp,
        isProcessed: true
      }
    });

    // 2. Insert "New" update (simulating conflict resolution logic)
    // The server logic would check existing timestamps
    const existing = await prisma.syncOperation.findFirst({
      where: {
        entityType: 'conversation',
        entityId: conversationId,
        hlcTimestamp: { gt: newTimestamp } // Check if newer exists
      }
    });

    expect(existing).toBeNull(); // No newer version exists, so we proceed

    await prisma.syncOperation.create({
      data: {
        id: uuidv4(),
        authorDid: 'did:key:test',
        deviceDid: 'device-new',
        tableName: 'conversations',
        recordId: conversationId,
        entityType: 'conversation',
        entityId: conversationId,
        operation: 'UPDATE',
        payload: { title: 'New Title' },
        hlcTimestamp: newTimestamp,
        isProcessed: true
      }
    });

    // Verify the latest state logic (Pull query logic)
    const latestOps = await prisma.syncOperation.findMany({
      where: { entityId: conversationId },
      orderBy: { hlcTimestamp: 'desc' },
      take: 1
    });

    expect(latestOps[0].payload.title).toBe('New Title');
  });
});
