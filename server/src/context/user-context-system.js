import {
  getUserClient,
  createUserDatabase,
  initializeUserDatabaseDir,
} from '../lib/user-database-manager.js';
import { logger } from '../lib/logger.js';

const log = logger.child({ module: 'user-context-system' });

const userContextSystems = new Map();

export class UserContextSystem {
  constructor(userDid) {
    this.userDid = userDid;
    this.database = null;
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

      await this.initializeAIConfig();
      await this.initializeEmbeddingModel();

      this.initialized = true;
      log.info({ userDid: this.userDid }, 'UserContextSystem fully initialized');
    } catch (error) {
      log.error(
        { userDid: this.userDid, error: error.message },
        'Failed to initialize UserContextSystem'
      );
      throw error;
    }

    return this;
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

  async addToVectorStore(acuId, content, embedding, metadata = {}) {
    if (!this.database) {
      log.warn({ userDid: this.userDid }, 'Database not initialized');
      return null;
    }

    try {
      await this.database.atomicChatUnit.upsert({
        where: { id: acuId },
        update: {
          content: content.substring(0, 5000),
          embedding,
          ...metadata,
        },
        create: {
          id: acuId,
          content: content.substring(0, 5000),
          embedding,
          authorDid: this.userDid,
          type: metadata.type || 'text',
          state: 'ACTIVE',
          ...metadata,
        },
      });

      return true;
    } catch (error) {
      log.error({ userDid: this.userDid, error: error.message }, 'Failed to add to vector store');
      return null;
    }
  }

  async searchVectorStore(query, limit = 10) {
    if (!this.database) {
      return [];
    }

    try {
      const { generateEmbedding: openAIEmbed } = await import('../services/embedding-service.js');
      const embedding = await openAIEmbed(query, this.embeddingModel.model);

      const results = await this.database.$queryRaw`
        SELECT
          id,
          content,
          type,
          category,
          1 - (embedding <=> ${embedding}::vector) as score
        FROM atomic_chat_units
        WHERE "authorDid" = ${this.userDid}
          AND state = 'ACTIVE'
          AND embedding IS NOT NULL
          AND array_length(embedding, 1) > 0
        ORDER BY embedding <=> ${embedding}::vector
        LIMIT ${limit}
      `;

      return results.map((r) => ({
        id: r.id,
        score: r.score,
        content: r.content,
        type: r.type,
        category: r.category,
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
    return mag > 0 ? vec.map((v) => v / mag) : vec;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async compileContext(conversationId, options = {}) {
    const {
      includeTopics = true,
      includeEntities = true,
      includeMemories = true,
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
        const lastUserMsg = conv.messages.find((m) => m.role === 'user');
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
    const parts = ['You are an AI assistant with access to user context:'];

    if (context.topics.length > 0) {
      const topics = context.topics
        .map((t) => t.topic)
        .slice(0, 10)
        .join(', ');
      parts.push(`User interests: ${topics}`);
    }

    if (context.memories.length > 0) {
      const memories = context.memories
        .map((m) => m.content)
        .slice(0, 5)
        .join('; ');
      parts.push(`Relevant memories: ${memories}`);
    }

    if (context.semanticMatches.length > 0) {
      const matches = context.semanticMatches
        .map((m) => m.content)
        .slice(0, 3)
        .join('; ');
      parts.push(`Related past conversations: ${matches}`);
    }

    return parts.join('\n');
  }

  extractContent(parts) {
    if (!parts) {
      return '';
    }
    if (typeof parts === 'string') {
      return parts;
    }
    if (Array.isArray(parts)) {
      return parts.map((p) => p.content || p.text || '').join('\n');
    }
    return parts.content || parts.text || '';
  }

  async getStats() {
    const stats = {
      database: {},
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
