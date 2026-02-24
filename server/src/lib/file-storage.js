/**
 * File System Storage Adapter
 *
 * Provides a reliable fallback storage when the main database is offline.
 * Saves conversations and attempts as JSON files in the local filesystem.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Setup data directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
const ATTEMPTS_DIR = path.join(DATA_DIR, 'attempts');

// Ensure directories exist
async function ensureDirs() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
    await fs.mkdir(ATTEMPTS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create storage directories:', err);
  }
}

// Initialize on load
ensureDirs();

export const fileStorage = {
  /**
   * Save a conversation to disk
   * @param {Object} conversation
   */
  async saveConversation(conversation) {
    if (!conversation || !conversation.id) {
      return;
    }
    try {
      const filePath = path.join(CONVERSATIONS_DIR, `${conversation.id}.json`);
      // Add filesystem metadata
      const record = {
        ...conversation,
        _storedAt: new Date().toISOString(),
        _storageType: 'filesystem-fallback',
      };
      await fs.writeFile(filePath, JSON.stringify(record, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`[FS_STORAGE] Failed to save conversation ${conversation.id}:`, error.message);
      return false;
    }
  },

  /**
   * Save a capture attempt to disk
   * @param {Object} attempt
   */
  async saveAttempt(attempt) {
    if (!attempt || !attempt.id) {
      return;
    }
    try {
      // sanitize ID if it was generated as "offline-..."
      const safeId = attempt.id.replace(/[^a-zA-Z0-9-]/g, '_');
      const filePath = path.join(ATTEMPTS_DIR, `${safeId}.json`);
      await fs.writeFile(filePath, JSON.stringify(attempt, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error(`[FS_STORAGE] Failed to save attempt ${attempt.id}:`, error.message);
      return false;
    }
  },

  /**
   * Retrieve a conversation by ID
   */
  async getConversation(id) {
    try {
      const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  },
};
