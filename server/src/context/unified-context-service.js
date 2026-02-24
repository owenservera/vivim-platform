/**
 * Unified Context Service
 *
 * Provides context compilation using the isolated per-user context system.
 */

import { getUserContextSystem, createUserContextSystem } from './user-context-system.js';
import { logger } from '../lib/logger.js';

const log = logger.child({ module: 'unified-context-service' });

const engineCache = new Map();

export async function getContextEngine(userDid) {
  if (engineCache.has(userDid)) {
    return engineCache.get(userDid);
  }

  const engine = await getUserContextSystem(userDid);
  engineCache.set(userDid, engine);

  return engine;
}

export async function compileContext(userDid, conversationId, options = {}) {
  const engine = await getContextEngine(userDid);
  return engine.compileContext(conversationId, options);
}

export async function getUserTopics(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.database.topicProfile.findMany({
    where: { userId: userDid },
    orderBy: { mentionCount: 'desc' },
  });
}

export async function getUserEntities(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.database.entityProfile.findMany({
    where: { userId: userDid },
    orderBy: { mentionCount: 'desc' },
  });
}

export async function getUserBundles(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.database.contextBundle.findMany({
    where: { userId: userDid },
    orderBy: { lastUsedAt: 'desc' },
  });
}

export async function createUserBundle(userDid, bundleData) {
  const engine = await getContextEngine(userDid);
  return engine.database.contextBundle.create({
    data: {
      id: crypto.randomUUID(),
      userId: userDid,
      ...bundleData,
    },
  });
}

export async function getUserConversations(userDid, options = {}) {
  const engine = await getContextEngine(userDid);
  const { limit = 20, offset = 0 } = options;

  return engine.database.conversation.findMany({
    where: { ownerId: userDid },
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    include: { messages: true },
  });
}

export async function getUserMemories(userDid, options = {}) {
  const engine = await getContextEngine(userDid);
  const { limit = 50 } = options;

  return engine.database.memory.findMany({
    where: { userId: userDid },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUserMemory(userDid, memoryData) {
  const engine = await getContextEngine(userDid);
  return engine.database.memory.create({
    data: {
      id: crypto.randomUUID(),
      userId: userDid,
      ...memoryData,
    },
  });
}

export async function getUserNotebooks(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.database.notebook.findMany({
    where: { userId: userDid },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createUserNotebook(userDid, notebookData) {
  const engine = await getContextEngine(userDid);
  return engine.database.notebook.create({
    data: {
      id: crypto.randomUUID(),
      userId: userDid,
      ...notebookData,
    },
  });
}

export async function addNotebookEntry(userDid, notebookId, entryData) {
  const engine = await getContextEngine(userDid);

  const entry = await engine.database.notebookEntry.create({
    data: {
      id: crypto.randomUUID(),
      notebookId,
      userId: userDid,
      ...entryData,
    },
  });

  await engine.database.notebook.update({
    where: { id: notebookId },
    data: { entryCount: { increment: 1 } },
  });

  return entry;
}

export async function getUserSettings(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.database.userContextSettings.findUnique({
    where: { userId: userDid },
  });
}

export async function updateUserSettings(userDid, settings) {
  const engine = await getContextEngine(userDid);
  return engine.database.userContextSettings.upsert({
    where: { userId: userDid },
    create: {
      userId: userDid,
      ...settings,
    },
    update: settings,
  });
}

export async function getUserStats(userDid) {
  const engine = await getContextEngine(userDid);
  return engine.getStats();
}

export async function getUserACUs(userDid, options = {}) {
  const engine = await getContextEngine(userDid);
  const { limit = 50, type, category } = options;

  const where = {};
  if (type) {
    where.type = type;
  }
  if (category) {
    where.category = category;
  }

  return engine.database.atomicChatUnit.findMany({
    where,
    take: limit,
    orderBy: { qualityOverall: 'desc' },
  });
}

export async function semanticSearch(userDid, query, options = {}) {
  const engine = await getContextEngine(userDid);
  return engine.searchVectorStore(query, options.limit || 10);
}

export async function addToVectorStore(userDid, acuId, content, metadata = {}) {
  const engine = await getContextEngine(userDid);
  return engine.addToVectorStore(acuId, content, metadata);
}

export async function disconnectUserEngine(userDid) {
  if (engineCache.has(userDid)) {
    const engine = engineCache.get(userDid);
    await engine.disconnect();
    engineCache.delete(userDid);
  }
}

export async function disconnectAllEngines() {
  for (const [userDid, engine] of engineCache) {
    await engine.disconnect();
  }
  engineCache.clear();
}

import crypto from 'crypto';

export default {
  getContextEngine,
  compileContext,
  getUserTopics,
  getUserEntities,
  getUserBundles,
  createUserBundle,
  getUserConversations,
  getUserMemories,
  createUserMemory,
  getUserNotebooks,
  createUserNotebook,
  addNotebookEntry,
  getUserSettings,
  updateUserSettings,
  getUserStats,
  getUserACUs,
  semanticSearch,
  addToVectorStore,
  disconnectUserEngine,
  disconnectAllEngines,
};
