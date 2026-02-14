/**
 * User Database Manager - Simplified
 * 
 * Manages user data access via single PostgreSQL database.
 * Uses row-level security and ownerId filtering for data isolation.
 * 
 * This replaces the previous SQLite-per-user architecture.
 */

import { getPrismaClient } from './database.js';
import { logger } from './logger.js';
import crypto from 'crypto';

const log = logger.child({ module: 'user-database-manager' });

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Sanitize DID for safe usage (e.g., in file paths, tags)
 * @param {string} did - User's DID
 * @returns {string} Sanitized string
 */
export function sanitizeDid(did) {
  return did.replace(/[^a-zA-Z0-9]/g, '_');
}

// ============================================================================
// USER DATA ACCESS (with ownerId-based isolation)
// ============================================================================

/**
 * Get all conversations for a user (with isolation via ownerId)
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's conversations
 */
export async function getUserConversations(userId) {
  const prisma = getPrismaClient();
  return prisma.conversation.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get a single conversation for a user (with ownership check)
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User's ID
 * @returns {Promise<Object|null>} Conversation or null
 */
export async function getUserConversation(conversationId, userId) {
  const prisma = getPrismaClient();
  return prisma.conversation.findFirst({
    where: { 
      id: conversationId,
      ownerId: userId
    }
  });
}

/**
 * Get all ACUs for a user (with isolation via authorDid)
 * @param {string} userDid - User's DID
 * @returns {Promise<Array>} User's ACUs
 */
export async function getUserACUs(userDid) {
  const prisma = getPrismaClient();
  return prisma.atomicChatUnit.findMany({
    where: { authorDid: userDid },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get ACU by ID with ownership check
 * @param {string} acuId - ACU ID
 * @param {string} userDid - User's DID
 * @returns {Promise<Object|null>} ACU or null
 */
export async function getUserACU(acuId, userDid) {
  const prisma = getPrismaClient();
  return prisma.atomicChatUnit.findFirst({
    where: { 
      id: acuId,
      authorDid: userDid
    }
  });
}

/**
 * Get user's topic profiles
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's topic profiles
 */
export async function getUserTopicProfiles(userId) {
  const prisma = getPrismaClient();
  return prisma.topicProfile.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's entity profiles
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's entity profiles
 */
export async function getUserEntityProfiles(userId) {
  const prisma = getPrismaClient();
  return prisma.entityProfile.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's context bundles
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's context bundles
 */
export async function getUserContextBundles(userId) {
  const prisma = getPrismaClient();
  return prisma.contextBundle.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's notebooks
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's notebooks
 */
export async function getUserNotebooks(userId) {
  const prisma = getPrismaClient();
  return prisma.notebook.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's memories
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's memories
 */
export async function getUserMemories(userId) {
  const prisma = getPrismaClient();
  return prisma.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's AI personas
 * @param {string} userId - User's ID
 * @returns {Promise<Array>} User's AI personas
 */
export async function getUserAiPersonas(userId) {
  const prisma = getPrismaClient();
  return prisma.aiPersona.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get user's context settings
 * @param {string} userId - User's ID
 * @returns {Promise<Object|null>} User's context settings
 */
export async function getUserContextSettings(userId) {
  const prisma = getPrismaClient();
  return prisma.userContextSettings.findUnique({
    where: { userId }
  });
}

// ============================================================================
// DATA ISOLATION HELPERS
// ============================================================================

/**
 * Verify that content belongs to user (ownership check)
 * @param {string} contentType - Type: 'conversation', 'acu', 'notebook', etc.
 * @param {string} contentId - Content ID
 * @param {string} userId - User's ID
 * @returns {Promise<boolean>} True if user owns content
 */
export async function verifyContentOwnership(contentType, contentId, userId) {
  const prisma = getPrismaClient();
  
  switch (contentType) {
    case 'conversation':
      const conv = await prisma.conversation.findFirst({
        where: { id: contentId, ownerId: userId }
      });
      return !!conv;
      
    case 'acu':
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return false;
      const acu = await prisma.atomicChatUnit.findFirst({
        where: { id: contentId, authorDid: user.did }
      });
      return !!acu;
      
    case 'notebook':
      const notebook = await prisma.notebook.findFirst({
        where: { id: contentId, userId }
      });
      return !!notebook;
      
    case 'contextBundle':
      const bundle = await prisma.contextBundle.findFirst({
        where: { id: contentId, userId }
      });
      return !!bundle;
      
    case 'memory':
      const memory = await prisma.memory.findFirst({
        where: { id: contentId, userId }
      });
      return !!memory;
      
    default:
      log.warn({ contentType }, 'Unknown content type for ownership check');
      return false;
  }
}

/**
 * Check if user can share content (policy check)
 * @param {string} contentType - Type of content
 * @param {string} contentId - Content ID
 * @param {string} userId - User's ID
 * @returns {Promise<Object>} { canShare: boolean, reason?: string }
 */
export async function checkSharePermission(contentType, contentId, userId) {
  const prisma = getPrismaClient();
  
  // Check ownership first
  const isOwner = await verifyContentOwnership(contentType, contentId, userId);
  if (!isOwner) {
    return { canShare: false, reason: 'Not the owner' };
  }
  
  // Check if there's a sharing policy that allows sharing
  const policy = await prisma.sharingPolicy.findUnique({
    where: { contentId }
  });
  
  if (!policy) {
    // No policy = default to self-only
    return { canShare: false, reason: 'No sharing policy set' };
  }
  
  if (policy.status !== 'active') {
    return { canShare: false, reason: 'Sharing policy is not active' };
  }
  
  // Check temporal constraints
  if (policy.temporal) {
    const now = new Date();
    if (policy.temporal.availableFrom && new Date(policy.temporal.availableFrom) > now) {
      return { canShare: false, reason: 'Content not yet available for sharing' };
    }
    if (policy.temporal.expiresAt && new Date(policy.temporal.expiresAt) < now) {
      return { canShare: false, reason: 'Content sharing has expired' };
    }
  }
  
    return { canShare: true };
}

function getUserClient(userDid) {
  return getPrismaClient();
}

function getUserDbPath(userDid) {
  return '';
}

async function createUserDatabase(userDid) {
  log.info({ userDid }, 'createUserDatabase called - using shared prisma');
  return getPrismaClient();
}

async function initializeUserDatabaseDir(userDid) {
  log.info({ userDid }, 'initializeUserDatabaseDir called - no-op for shared db');
}

export { getUserClient, getUserDbPath, createUserDatabase, initializeUserDatabaseDir };

export default {
  generateId,
  sanitizeDid,
  getUserConversations,
  getUserConversation,
  getUserACUs,
  getUserACU,
  getUserTopicProfiles,
  getUserEntityProfiles,
  getUserContextBundles,
  getUserNotebooks,
  getUserMemories,
  getUserAiPersonas,
  getUserContextSettings,
  verifyContentOwnership,
  checkSharePermission,
  getUserClient,
  getUserDbPath,
  createUserDatabase,
  initializeUserDatabaseDir,
};
