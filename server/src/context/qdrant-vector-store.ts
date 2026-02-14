/**
 * Qdrant Vector Store
 *
 * A pure JavaScript vector database solution that replaces pgvector.
 * Qdrant is a high-performance vector search engine written in Rust.
 *
 * Installation:
 * 1. Download Qdrant binary from https://github.com/qdrant/qdrant/releases
 * 2. Or run via Docker: docker run -p 6333:6333 qdrant/qdrant
 *
 * Configuration:
 * QDRANT_URL=http://localhost:6333
 * QDRANT_API_KEY=your-api-key (optional)
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '../lib/logger.js';

interface VectorSearchResult {
  id: string;
  content: string;
  type: string;
  category: string;
  createdAt: Date;
  similarity: number;
}

interface QdrantConfig {
  url?: string;
  apiKey?: string;
  collectionName?: string;
  vectorSize?: number;
}

export class QdrantVectorStore {
  private client: QdrantClient;
  private collectionName: string;
  private vectorSize: number;
  private initialized: boolean = false;

  constructor(config?: Partial<QdrantConfig>) {
    const url = config?.url || process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = config?.apiKey || process.env.QDRANT_API_KEY || undefined;
    
    this.client = new QdrantClient({ url, apiKey });
    this.collectionName = config?.collectionName || 'vivim_vectors';
    this.vectorSize = config?.vectorSize || parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10);
  }

  /**
   * Initialize the collection
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.collectionName);

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
          // Enable HNSW indexing for faster search
          hnsw_config: {
            m: 16,
            ef_construct: 100,
          },
        });
        logger.info({ collection: this.collectionName }, 'Created Qdrant collection');
      }

      this.initialized = true;
      logger.info({ collection: this.collectionName }, 'Qdrant vector store initialized');
      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize Qdrant');
      return false;
    }
  }

  /**
   * Check if Qdrant is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getCollections();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Upsert a vector with metadata
   */
  async upsert(
    id: string,
    vector: number[],
    payload: {
      content: string;
      type: string;
      category: string;
      userId: string;
      createdAt?: Date;
    }
  ): Promise<boolean> {
    try {
      await this.client.upsert(this.collectionName, {
        points: [
          {
            id,
            vector,
            payload: {
              content: payload.content,
              type: payload.type,
              category: payload.category,
              userId: payload.userId,
              createdAt: payload.createdAt?.toISOString() || new Date().toISOString(),
            },
          },
        ],
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, id }, 'Failed to upsert vector');
      return false;
    }
  }

  /**
   * Batch upsert vectors
   */
  async upsertBatch(
    items: Array<{
      id: string;
      vector: number[];
      payload: {
        content: string;
        type: string;
        category: string;
        userId: string;
        createdAt?: Date;
      };
    }>
  ): Promise<boolean> {
    try {
      await this.client.upsert(this.collectionName, {
        points: items.map(item => ({
          id: item.id,
          vector: item.vector,
          payload: {
            ...item.payload,
            createdAt: item.payload.createdAt?.toISOString() || new Date().toISOString(),
          },
        })),
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, count: items.length }, 'Failed to batch upsert');
      return false;
    }
  }

  /**
   * Search for similar vectors
   */
  async search(
    userId: string,
    queryVector: number[],
    options?: {
      limit?: number;
      scoreThreshold?: number;
      type?: string;
      category?: string;
    }
  ): Promise<VectorSearchResult[]> {
    try {
      const limit = options?.limit || 20;
      const scoreThreshold = options?.scoreThreshold || 0.0;

      // Build filter
      const must: any[] = [{ key: 'userId', match: { value: userId } }];
      if (options?.type) {
        must.push({ key: 'type', match: { value: options.type } });
      }
      if (options?.category) {
        must.push({ key: 'category', match: { value: options.category } });
      }

      const results = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit,
        score_threshold: scoreThreshold > 0 ? scoreThreshold : undefined,
        filter: {
          must,
        },
        with_payload: true,
      });

      return results.map(r => ({
        id: r.id as string,
        content: r.payload?.content as string || '',
        type: r.payload?.type as string || '',
        category: r.payload?.category as string || '',
        createdAt: r.payload?.createdAt ? new Date(r.payload.createdat as string) : new Date(),
        similarity: r.score,
      }));
    } catch (error: any) {
      logger.error({ error: error.message, userId }, 'Qdrant search failed');
      return [];
    }
  }

  /**
   * Delete vectors by user ID
   */
  async deleteByUser(userId: string): Promise<boolean> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [{ key: 'userId', match: { value: userId } }],
        },
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, userId }, 'Failed to delete vectors');
      return false;
    }
  }

  /**
   * Delete a specific vector by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      await this.client.delete(this.collectionName, {
        points: [id],
      });
      return true;
    } catch (error: any) {
      logger.error({ error: error.message, id }, 'Failed to delete vector');
      return false;
    }
  }

  /**
   * Get collection info
   */
  async getStats(): Promise<{
    pointsCount: number;
    isReady: boolean;
  }> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return {
        pointsCount: info.points_count || 0,
        isReady: info.status === 'green',
      };
    } catch {
      return { pointsCount: 0, isReady: false };
    }
  }

  /**
   * Get the underlying client for advanced operations
   */
  getClient(): QdrantClient {
    return this.client;
  }
}

// Singleton instance
let _instance: QdrantVectorStore | null = null;

export function getQdrantVectorStore(config?: Partial<QdrantConfig>): QdrantVectorStore {
  if (!_instance) {
    _instance = new QdrantVectorStore(config);
  }
  return _instance;
}

export default QdrantVectorStore;
