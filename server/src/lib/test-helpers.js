import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

export async function createTestUser(overrides = {}) {
  const prisma = getPrismaClient();
  const { randomUUID } = await import('crypto');

  const defaultUser = {
    id: randomUUID(),
    did: `did:key:z${randomUUID().replace(/-/g, '').slice(0, 48)}`,
    publicKey: `test-public-key-${Date.now()}`,
    handle: `testuser${Date.now()}`,
    displayName: 'Test User',
    status: 'ACTIVE',
    verificationLevel: 0,
    trustScore: 100,
    settings: {},
    privacyPreferences: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const user = await prisma.user.create({
    data: { ...defaultUser, ...overrides },
  });

  logger.debug({ userId: user.id }, 'Test user created');
  return user;
}

export async function createTestConversation(userId, messageCount = 5) {
  const prisma = getPrismaClient();
  const { randomUUID } = await import('crypto');

  const conversation = await prisma.conversation.create({
    data: {
      id: randomUUID(),
      ownerId: userId,
      provider: 'chatgpt',
      title: `Test Conversation ${Date.now()}`,
      sourceUrl: `https://chat.openai.com/c/test-${randomUUID()}`,
      messageCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    const message = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: conversation.id,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Test message ${i + 1}`,
        messageOrder: i,
        createdAt: new Date(),
      },
    });
    messages.push(message);
  }

  logger.debug({ conversationId: conversation.id, messageCount }, 'Test conversation created');
  return { conversation, messages };
}

export async function createTestACU(authorDid, overrides = {}) {
  const prisma = getPrismaClient();
  const { randomUUID } = await import('crypto');

  const defaultACU = {
    id: randomUUID(),
    authorDid,
    provider: 'chatgpt',
    sourceUrl: `https://chat.openai.com/c/test-${randomUUID()}`,
    content: {
      messages: [
        { role: 'user', content: 'Test prompt' },
        { role: 'assistant', content: 'Test response' },
      ],
    },
    contentHash: `hash_${randomUUID()}`,
    state: 'ACTIVE',
    visibility: 'PRIVATE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const acu = await prisma.atomicChatUnit.create({
    data: { ...defaultACU, ...overrides },
  });

  logger.debug({ acuId: acu.id, authorDid }, 'Test ACU created');
  return acu;
}

export async function createTestSyncOperation(userId, overrides = {}) {
  const prisma = getPrismaClient();
  const { randomUUID } = await import('crypto');

  const defaultOp = {
    id: randomUUID(),
    hlcTimestamp: `${Date.now()}-server-00000000`,
    entityType: 'conversation',
    entityId: randomUUID(),
    operation: 'INSERT',
    payload: {},
    authorDid: `did:key:z${randomUUID().replace(/-/g, '').slice(0, 48)}`,
    deviceDid: `server_${randomUUID().slice(0, 8)}`,
    tableName: 'conversation',
    recordId: randomUUID(),
    isProcessed: true,
    appliedAt: new Date(),
  };

  const syncOp = await prisma.syncOperation.create({
    data: { ...defaultOp, ...overrides },
  });

  logger.debug({ syncOpId: syncOp.id }, 'Test sync operation created');
  return syncOp;
}

export function mockProviderResponse(provider, messages = [], error = null) {
  return {
    provider,
    messages,
    error,
    timestamp: new Date().toISOString(),
  };
}

export function simulateProviderError(provider, errorType = 'TIMEOUT') {
  const errors = {
    TIMEOUT: new Error(`${provider} request timed out`),
    RATE_LIMIT: new Error(`${provider} rate limit exceeded`),
    AUTH: new Error(`${provider} authentication failed`),
    PARSE: new Error(`${provider} failed to parse response`),
    NETWORK: new Error(`${provider} network error`),
  };

  return errors[errorType] || errors.TIMEOUT;
}

export async function dumpDatabaseState() {
  const prisma = getPrismaClient();

  const [userCount, conversationCount, messageCount, acuCount, syncOpCount] = await Promise.all([
    prisma.user.count(),
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.atomicChatUnit.count(),
    prisma.syncOperation.count(),
  ]);

  const state = {
    users: userCount,
    conversations: conversationCount,
    messages: messageCount,
    atomicChatUnits: acuCount,
    syncOperations: syncOpCount,
    timestamp: new Date().toISOString(),
  };

  logger.info(state, 'Database state dump');
  return state;
}

export async function dumpUserData(userId) {
  const prisma = getPrismaClient();

  const [user, conversations, acus, syncOps] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.conversation.findMany({ where: { ownerId: userId } }),
    prisma.atomicChatUnit.findMany({ where: { authorDid: user?.did } }),
    prisma.syncOperation.findMany({ where: { authorDid: user?.did } }),
  ]);

  const data = {
    user: user ? { id: user.id, did: user.did, handle: user.handle, status: user.status } : null,
    conversationCount: conversations.length,
    acuCount: acus.length,
    syncOperationCount: syncOps.length,
    conversations: conversations.map((c) => ({
      id: c.id,
      provider: c.provider,
      title: c.title,
      messageCount: c.messageCount,
    })),
    timestamp: new Date().toISOString(),
  };

  logger.info({ userId }, 'User data dump');
  return data;
}

export async function dumpSyncState(deviceDid) {
  const prisma = getPrismaClient();

  const operations = await prisma.syncOperation.findMany({
    where: { deviceDid },
    orderBy: { hlcTimestamp: 'desc' },
    take: 100,
  });

  const state = {
    deviceDid,
    operationCount: operations.length,
    latestOperations: operations.map((op) => ({
      id: op.id,
      entityType: op.entityType,
      operation: op.operation,
      hlcTimestamp: op.hlcTimestamp,
      isProcessed: op.isProcessed,
    })),
    timestamp: new Date().toISOString(),
  };

  logger.info({ deviceDid }, 'Sync state dump');
  return state;
}

export async function cleanupTestData(userId) {
  const prisma = getPrismaClient();

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await prisma.$transaction([
      prisma.message.deleteMany({
        where: { conversation: { ownerId: userId } },
      }),
      prisma.conversation.deleteMany({
        where: { ownerId: userId },
      }),
      prisma.atomicChatUnit.deleteMany({
        where: { authorDid: user.did },
      }),
      prisma.syncOperation.deleteMany({
        where: { authorDid: user.did },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    logger.info({ userId }, 'Test data cleaned up');
  } catch (error) {
    logger.error({ error: error.message, userId }, 'Failed to cleanup test data');
  }
}

const testHelpers = {
  createTestUser,
  createTestConversation,
  createTestACU,
  createTestSyncOperation,
  mockProviderResponse,
  simulateProviderError,
  dumpDatabaseState,
  dumpUserData,
  dumpSyncState,
  cleanupTestData,
};

export default testHelpers;
