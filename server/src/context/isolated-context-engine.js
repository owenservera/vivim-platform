/**
 * Isolated Context Engine
 * 
 * Provides 100% isolated context engine instances per user.
 * Each user gets their own context engine that only accesses their database.
 */

import { getUserClient, getUserDbPath } from '../lib/user-database-manager.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

const log = logger.child({ module: 'isolated-context-engine' });

/**
 * Create an isolated context engine for a specific user
 */
export class IsolatedContextEngine {
  constructor(userDid) {
    this.userDid = userDid;
    this.userDb = null;
    this.initialized = false;
  }

  /**
   * Initialize the context engine for the user
   */
  async initialize() {
    if (this.initialized) {
      return this;
    }

    try {
      this.userDb = await getUserClient(this.userDid);
      this.initialized = true;
      log.info({ userDid: this.userDid }, 'IsolatedContextEngine initialized');
    } catch (error) {
      log.error({ userDid: this.userDid, error: error.message }, 'Failed to initialize IsolatedContextEngine');
      throw error;
    }

    return this;
  }

  /**
   * Ensure the engine is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get topic profiles for the user
   */
  async getTopicProfiles() {
    await this.ensureInitialized();
    
    return this.userDb.topicProfile.findMany({
      where: { userId: this.userDid },
      orderBy: { mentionCount: 'desc' },
    });
  }

  /**
   * Get entity profiles for the user
   */
  async getEntityProfiles() {
    await this.ensureInitialized();
    
    return this.userDb.entityProfile.findMany({
      where: { userId: this.userDid },
      orderBy: { mentionCount: 'desc' },
    });
  }

  /**
   * Get context bundles for the user
   */
  async getContextBundles() {
    await this.ensureInitialized();
    
    return this.userDb.contextBundle.findMany({
      where: { userId: this.userDid },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Get conversations for the user
   */
  async getConversations(options = {}) {
    await this.ensureInitialized();
    const { limit = 20, offset = 0 } = options;
    
    return this.userDb.conversation.findMany({
      where: { ownerId: this.userDid },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: { messages: true },
    });
  }

  /**
   * Get memories for the user
   */
  async getMemories(options = {}) {
    await this.ensureInitialized();
    const { limit = 50 } = options;
    
    return this.userDb.memory.findMany({
      where: { userId: this.userDid },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get notebooks for the user
   */
  async getNotebooks() {
    await this.ensureInitialized();
    
    return this.userDb.notebook.findMany({
      where: { userId: this.userDid },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get user context settings
   */
  async getContextSettings() {
    await this.ensureInitialized();
    
    return this.userDb.userContextSettings.findUnique({
      where: { userId: this.userDid },
    });
  }

  /**
   * Update user context settings
   */
  async updateContextSettings(settings) {
    await this.ensureInitialized();
    
    return this.userDb.userContextSettings.upsert({
      where: { userId: this.userDid },
      create: {
        userId: this.userDid,
        ...settings,
      },
      update: settings,
    });
  }

  /**
   * Create a topic profile
   */
  async createTopicProfile(topicData) {
    await this.ensureInitialized();
    
    return this.userDb.topicProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: this.userDid,
        topic: topicData.topic,
        mentionCount: 1,
        lastMentionedAt: new Date(),
        firstMentionedAt: new Date(),
        confidence: topicData.confidence || 0.5,
        relatedTopics: topicData.relatedTopics || [],
        keyInsights: topicData.keyInsights || [],
        associatedAcuIds: topicData.associatedAcuIds || [],
      },
    });
  }

  /**
   * Create an entity profile
   */
  async createEntityProfile(entityData) {
    await this.ensureInitialized();
    
    return this.userDb.entityProfile.create({
      data: {
        id: crypto.randomUUID(),
        userId: this.userDid,
        name: entityData.name,
        type: entityData.type,
        mentionCount: 1,
        lastMentionedAt: new Date(),
        firstMentionedAt: new Date(),
        confidence: entityData.confidence || 0.5,
        description: entityData.description,
        relationships: entityData.relationships || [],
        associatedAcuIds: entityData.associatedAcuIds || [],
      },
    });
  }

  /**
   * Create a context bundle
   */
  async createContextBundle(bundleData) {
    await this.ensureInitialized();
    
    return this.userDb.contextBundle.create({
      data: {
        id: crypto.randomUUID(),
        userId: this.userDid,
        name: bundleData.name,
        description: bundleData.description,
        topicIds: bundleData.topicIds || [],
        entityIds: bundleData.entityIds || [],
        acuIds: bundleData.acuIds || [],
        bundleType: bundleData.bundleType || 'manual',
        content: bundleData.content,
        tokenCount: bundleData.tokenCount,
        compiledAt: new Date(),
        isDefault: bundleData.isDefault || false,
      },
    });
  }

  /**
   * Update topic profile
   */
  async updateTopicProfile(topicId, data) {
    await this.ensureInitialized();
    
    return this.userDb.topicProfile.update({
      where: { id: topicId },
      data: {
        ...data,
        lastMentionedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Create a memory
   */
  async createMemory(memoryData) {
    await this.ensureInitialized();
    
    return this.userDb.memory.create({
      data: {
        id: crypto.randomUUID(),
        userId: this.userDid,
        content: memoryData.content,
        memoryType: memoryData.memoryType || 'general',
        importance: memoryData.importance || 50,
        recency: memoryData.recency || 0,
        sourceAcuIds: memoryData.sourceAcuIds || [],
        sourceConversationIds: memoryData.sourceConversationIds || [],
      },
    });
  }

  /**
   * Create a notebook
   */
  async createNotebook(notebookData) {
    await this.ensureInitialized();
    
    return this.userDb.notebook.create({
      data: {
        id: crypto.randomUUID(),
        userId: this.userDid,
        name: notebookData.name,
        description: notebookData.description,
        color: notebookData.color,
        icon: notebookData.icon,
      },
    });
  }

  /**
   * Add entry to notebook
   */
  async addNotebookEntry(notebookId, entryData) {
    await this.ensureInitialized();
    
    const entry = await this.userDb.notebookEntry.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        userId: this.userDid,
        title: entryData.title,
        content: entryData.content,
        sourceAcuId: entryData.sourceAcuId,
        sourceConversationId: entryData.sourceConversationId,
      },
    });

    await this.userDb.notebook.update({
      where: { id: notebookId },
      data: { entryCount: { increment: 1 } },
    });

    return entry;
  }

  /**
   * Compile context for a conversation
   */
  async compileContext(conversationId, options = {}) {
    await this.ensureInitialized();
    
    const {
      includeTopics = true,
      includeEntities = true,
      includeBundles = true,
      maxTokens = 4000,
    } = options;

    const context = {
      topics: [],
      entities: [],
      bundles: [],
      memories: [],
    };

    if (includeTopics) {
      context.topics = await this.getTopicProfiles();
    }

    if (includeEntities) {
      context.entities = await this.getEntityProfiles();
    }

    if (includeBundles) {
      context.bundles = await this.getContextBundles();
    }

    context.memories = await this.getMemories({ limit: 10 });

    return context;
  }

  /**
   * Get ACUs for context
   */
  async getACUs(options = {}) {
    await this.ensureInitialized();
    const { limit = 50, type, category } = options;
    
    const where = {};
    if (type) where.type = type;
    if (category) where.category = category;
    
    return this.userDb.atomicChatUnit.findMany({
      where,
      take: limit,
      orderBy: { qualityOverall: 'desc' },
    });
  }

  /**
   * Get user statistics
   */
  async getStats() {
    await this.ensureInitialized();
    
    const [
      conversationCount,
      acuCount,
      topicCount,
      entityCount,
      bundleCount,
      memoryCount,
      notebookCount,
    ] = await Promise.all([
      this.userDb.conversation.count(),
      this.userDb.atomicChatUnit.count(),
      this.userDb.topicProfile.count(),
      this.userDb.entityProfile.count(),
      this.userDb.contextBundle.count(),
      this.userDb.memory.count(),
      this.userDb.notebook.count(),
    ]);

    return {
      conversations: conversationCount,
      acus: acuCount,
      topics: topicCount,
      entities: entityCount,
      bundles: bundleCount,
      memories: memoryCount,
      notebooks: notebookCount,
    };
  }

  /**
   * Disconnect the user database
   */
  async disconnect() {
    if (this.userDb) {
      await this.userDb.$disconnect();
      this.userDb = null;
      this.initialized = false;
      log.info({ userDid: this.userDid }, 'IsolatedContextEngine disconnected');
    }
  }
}

/**
 * Create an isolated context engine for a user
 */
export async function createIsolatedContextEngine(userDid) {
  const engine = new IsolatedContextEngine(userDid);
  await engine.initialize();
  return engine;
}

export default {
  IsolatedContextEngine,
  createIsolatedContextEngine,
};
