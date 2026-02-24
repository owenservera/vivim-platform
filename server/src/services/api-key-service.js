import crypto from 'crypto';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const prisma = getPrismaClient();

export const apiKeyService = {
  /**
   * Generates a new API key and its hash
   * @returns {{ key: string, hash: string }}
   */
  generateKey() {
    // Generate a secure random string
    const buffer = crypto.randomBytes(32);
    // Format: vk_live_... (vivim key live)
    const key = `vk_live_${buffer.toString('base64url')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');

    return { key, hash };
  },

  /**
   * Hashes an existing API key for lookup/storage
   * @param {string} key
   * @returns {string}
   */
  hashKey(key) {
    if (!key) {
      return null;
    }
    return crypto.createHash('sha256').update(key).digest('hex');
  },

  /**
   * Creates a new API key for a user
   * @param {string} userId
   * @param {string} name
   * @param {Date} [expiresAt]
   * @returns {Promise<{ key: string, apiKey: any }>}
   */
  async createApiKey(userId, name, expiresAt = null) {
    const { key, hash } = this.generateKey();

    try {
      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          keyHash: hash,
          name,
          expiresAt,
        },
      });

      // We only return the raw key once upon creation
      return { key, apiKey };
    } catch (error) {
      logger.error('Error creating API key', { userId, error: error.message });
      throw new Error('Failed to create API key');
    }
  },

  /**
   * Verifies an API key and returns the associated user if valid
   * @param {string} key
   * @returns {Promise<any|null>} User object or null if invalid
   */
  async verifyApiKey(key) {
    if (!key) {
      return null;
    }

    const hash = this.hashKey(key);

    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: hash },
        include: { user: true },
      });

      if (!apiKey) {
        return null;
      }

      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return null;
      }

      // Update last used (fire and forget to not block verification)
      prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsed: new Date() },
        })
        .catch((err) => logger.error('Failed to update API key lastUsed', { err: err.message }));

      return apiKey.user;
    } catch (error) {
      logger.error('Error verifying API key', { error: error.message });
      return null;
    }
  },

  /**
   * Lists API keys for a user
   * @param {string} userId
   * @returns {Promise<any[]>}
   */
  async listApiKeys(userId) {
    return await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        expiresAt: true,
        // specifically NOT returning keyHash
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Revokes/deletes an API key
   * @param {string} userId
   * @param {string} keyId
   * @returns {Promise<boolean>}
   */
  async revokeApiKey(userId, keyId) {
    try {
      const deleted = await prisma.apiKey.deleteMany({
        where: {
          id: keyId,
          userId,
        },
      });
      return deleted.count > 0;
    } catch (error) {
      logger.error('Error revoking API key', { userId, keyId, error: error.message });
      return false;
    }
  },
};
