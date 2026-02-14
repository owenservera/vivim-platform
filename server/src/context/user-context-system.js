/**
 * User Context System
 * 
 * Complete isolated AI context system per user.
 * Generated on user registration with personal:
 * - Database (already implemented)
 * - Vector store for embeddings
 * - AI configuration
 * - Context compilation pipeline
 */

import { getUserClient, createUserDatabase, initializeUserDatabaseDir, getUserDbPath } from '../lib/user-database-manager.js';
import { logger } from '../lib/logger.js';
import crypto from 'crypto';

const log = logger.child({ module: 'user-context-system' });

const userContextSystems = new Map();

export class UserContextSystem {
  constructor(userDid) {
    this.userDid = userDid;
    this.database = null;
    this.vectorStore = null;
    this.aiConfig = null;
    this.embeddingModel = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return this;
    }

    log.info({ userDid: this.userDid }, 'Initializing UserContextSystem');

    try {
      this.database = await getUserClient(this.userDid);
      
      await this.initializeVectorStore();
      await this.initializeAIConfig();
      await this.initializeEmbeddingModel();
      
      this.initialized = true;
      log.info({ userDid: this.userDid }, 'UserContextSystem fully initialized');
    } catch (error) {
      log.error({ userDid: this.userDid, error: error.message }, 'Failed to initialize UserContextSystem');
      throw error;
    }

    return this;
  }

  async initializeVectorStore() {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    
    const collectionName = `user_${this.userDid.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    this.vectorStore = {
      client: new QdrantClient({
        url: process.env.QDRANT_URL || 'http://localhost:6333',
        apiKey: process.env.QDRANT_API_KEY,
      }),
      collectionName,
      initialized: false,
    };

    try {
      const collections = await this.vectorStore.client.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);
      
      if (!exists) {
        await this.vectorStore.client.createCollection(collectionName, {
          vectors: {
            size: parseInt(process.env.VECTOR_DIMENSION) || 384,
            distance: 'Cosine',
          },
        });
        log.info({ userDid: this.userDid, collectionName }, 'Created user vector collection');
      }
      
      this.vectorStore.initialized = true;
    } catch (error) {
      log.warn({ userDid: this.userDid, error: error.message }, 'Vector store not available');
    }
  }

  async initializeAIConfig() {
    this.aiConfig = {
      provider: process.env.DEFAULT_AI_PROVIDER || 'openai',
      model: process.env.DEFAULT_AI_MODEL || 'gpt-4',
      apiKey: null,
      baseUrl: null,
    };
  }

  async initializeEmbeddingModel() {
    this.embeddingModel = {
      provider: process.env.EMBEDDING_PROVIDER || 'openai',
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      dimension: parseInt(process.env.VECTOR_DIMENSION) || 384,
    };
  }

  async addToVectorStore(acuId, content, metadata = {}) {
    if (!this.vectorStore?.initialized) {
      log.warn({ userDid: this.userDid }, 'Vector store not initialized');
      return null;
    }

    try {
      const embedding = await this.generateEmbedding(content);
      
      await this.vectorStore.client.upsert(this.vectorStore.collectionName, {
        points: [{
          id: acuId,
          vector: embedding,
          payload: {
            content: content.substring(0, 5000),
            ...metadata,
          },
        }],
      });

      return true;
    } catch (error) {
      log.error({ userDid: this.userDid, error: error.message }, 'Failed to add to vector store');
      return null;
    }
  }

  async searchVectorStore(query, limit = 10) {
    if (!this.vectorStore?.initialized) {
      return [];
    }

    try {
      const embedding = await this.generateEmbedding(query);
      
      const results = await this.vectorStore.client.search(this.vectorStore.collectionName, {
        vector: embedding,
        limit,
        with_payload: true,
      });

      return results.map(r => ({
        id: r.id,
        score: r.score,
        content: r.payload.content,
        ...r.payload,
      }));
    } catch (error) {
      log.error({ userDid: this.userDid, error: error.message }, 'Vector search failed');
      return [];
    }
  }

  async generateEmbedding(text) {
    try {
      const { generateEmbedding: openAIEmbed } = await import('../services/embedding-service.js');
      return await openAIEmbed(text, this.embeddingModel.model);
    } catch (error) {
      log.warn({ userDid: this.userDid, error: error.message }, 'Using fallback embedding');
      return this.fallbackEmbedding(text);
    }
  }

  fallbackEmbedding(text) {
    const dim = this.embeddingModel.dimension;
    const vec = new Array(dim).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach((word, i) => {
      const hash = this.simpleHash(word);
      vec[hash % dim] += 1;
    });
    
    const mag = Math.sqrt(vec.reduce((a, b) => a + b * b, 0));
    return mag > 0 ? vec.map(v => v / mag) : vec;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async compileContext(conversationId, options = {}) {
    const {
      includeTopics = true,
      includeEntities = true,
      includeMemories = true,
      maxTokens = 4000,
      useSemanticSearch = true,
    } = options;

    const context = {
      topics: [],
      entities: [],
      memories: [],
      recentACUs: [],
      semanticMatches: [],
      systemPrompt: '',
    };

    if (includeTopics) {
      context.topics = await this.database.topicProfile.findMany({
        orderBy: { mentionCount: 'desc' },
        take: 20,
      });
    }

    if (includeEntities) {
      context.entities = await this.database.entityProfile.findMany({
        orderBy: { mentionCount: 'desc' },
        take: 20,
      });
    }

    if (includeMemories) {
      context.memories = await this.database.memory.findMany({
        orderBy: { importance: 'desc' },
        take: 10,
      });
    }

    context.recentACUs = await this.database.atomicChatUnit.findMany({
      orderBy: { sourceTimestamp: 'desc' },
      take: 50,
    });

    if (useSemanticSearch && conversationId) {
      const conv = await this.database.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { take: 5, orderBy: { createdAt: 'desc' } } },
      });
      
      if (conv?.messages) {
        const lastUserMsg = conv.messages.find(m => m.role === 'user');
        if (lastUserMsg) {
          const content = this.extractContent(lastUserMsg.parts);
          context.semanticMatches = await this.searchVectorStore(content, 5);
        }
      }
    }

    context.systemPrompt = this.buildSystemPrompt(context);

    return context;
  }

  buildSystemPrompt(context) {
    const parts = [
      'You are an AI assistant with access to user context:',
    ];

    if (context.topics.length > 0) {
      const topics = context.topics.map(t => t.topic).slice(0, 10).join(', ');
      parts.push(`User interests: ${topics}`);
    }

    if (context.memories.length > 0) {
      const memories = context.memories.map(m => m.content).slice(0, 5).join('; ');
      parts.push(`Relevant memories: ${memories}`);
    }

    if (context.semanticMatches.length > 0) {
      const matches = context.semanticMatches.map(m => m.content).slice(0, 3).join('; ');
      parts.push(`Related past conversations: ${matches}`);
    }

    return parts.join('\n');
  }

  extractContent(parts) {
    if (!parts) return '';
    if (typeof parts === 'string') return parts;
    if (Array.isArray(parts)) {
      return parts.map(p => p.content || p.text || '').join('\n');
    }
    return parts.content || parts.text || '';
  }

  async getStats() {
    const stats = {
      database: {},
      vectorStore: {},
      aiConfig: {},
    };

    try {
      const [convCount, acuCount, topicCount, entityCount, memoryCount] = await Promise.all([
        this.database.conversation.count(),
        this.database.atomicChatUnit.count(),
        this.database.topicProfile.count(),
        this.database.entityProfile.count(),
        this.database.memory.count(),
      ]);

      stats.database = { convCount, acuCount, topicCount, entityCount, memoryCount };
    } catch (e) {
      stats.database = { error: e.message };
    }

    stats.aiConfig = {
      provider: this.aiConfig?.provider,
      model: this.aiConfig?.model,
      hasApiKey: !!this.aiConfig?.apiKey,
    };

    return stats;
  }

  async disconnect() {
    if (this.database) {
      await this.database.$disconnect();
    }
    this.database = null;
    this.vectorStore = null;
    this.aiConfig = null;
    this.initialized = false;
    log.info({ userDid: this.userDid }, 'UserContextSystem disconnected');
  }
}

export async function createUserContextSystem(userDid) {
  initializeUserDatabaseDir();
  await createUserDatabase(userDid);
  
  const system = new UserContextSystem(userDid);
  await system.initialize();
  
  userContextSystems.set(userDid, system);
  
  return system;
}

export async function getUserContextSystem(userDid) {
  if (userContextSystems.has(userDid)) {
    return userContextSystems.get(userDid);
  }

  const system = new UserContextSystem(userDid);
  await system.initialize();
  
  userContextSystems.set(userDid, system);
  
  return system;
}

export async function destroyUserContextSystem(userDid) {
  if (userContextSystems.has(userDid)) {
    const system = userContextSystems.get(userDid);
    await system.disconnect();
    userContextSystems.delete(userDid);
  }
}

export default {
  UserContextSystem,
  createUserContextSystem,
  getUserContextSystem,
  destroyUserContextSystem,
};
