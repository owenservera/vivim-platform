/**
 * Cache Service (Redis)
 * 
 * Provides a caching layer for high-throughput reads (User Context, Active Conversations).
 * Supports graceful fallback to in-memory caching or DB-direct access if Redis is unavailable.
 */

import Redis from 'ioredis';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map(); // Fallback
  }

  async connect() {
    if (!config.redisUrl) {
      logger.warn('Redis URL not configured. Using in-memory fallback.');
      return;
    }

    try {
      this.client = new Redis(config.redisUrl, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error({ error: err.message }, 'Redis connection error');
        this.isConnected = false;
        serverErrorReporter.reportServerError('Redis connection failed', err, { url: config.redisUrl }, 'high');
      });

    } catch (error) {
      logger.error({ error: error.message }, 'Failed to initialize Redis client');
      serverErrorReporter.reportServerError('Redis initialization failed', error, {}, 'high');
    }
  }

  /**
   * Get value from cache
   * @param {string} key 
   * @returns {Promise<any>} Parsed JSON or null
   */
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      }
      // Fallback
      const entry = this.memoryCache.get(key);
      if (entry && entry.expires > Date.now()) {
        return entry.value;
      }
      return null;
    } catch (error) {
      logger.warn({ key, error: error.message }, 'Cache GET failed');
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds 
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);
      
      if (this.isConnected && this.client) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        // Fallback
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttlSeconds * 1000)
        });
        
        // Simple cleanup for memory cache
        if (this.memoryCache.size > 1000) {
          const keys = this.memoryCache.keys();
          this.memoryCache.delete(keys.next().value);
        }
      }
    } catch (error) {
      logger.warn({ key, error: error.message }, 'Cache SET failed');
    }
  }

  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      logger.warn({ key, error: error.message }, 'Cache DEL failed');
    }
  }

  /**
   * Delete keys by pattern
   * @param {string} pattern
   */
  async delPattern(pattern) {
    try {
      if (this.isConnected && this.client) {
        let cursor = '0';
        do {
          const res = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
          cursor = res[0];
          const keys = res[1];
          if (keys.length > 0) {
            await this.client.del(...keys);
          }
        } while (cursor !== '0');
      } else {
        // Fallback logic for memory cache
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      logger.warn({ pattern, error: error.message }, 'Cache DEL pattern failed');
    }
  }
}

export const cacheService = new CacheService();

// Initialize connection (async)
cacheService.connect().catch(err => logger.error('Cache Service init failed', err));
