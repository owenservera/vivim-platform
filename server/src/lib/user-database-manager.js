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

// ============================================================================
// EXPORTS
// ============================================================================

export const UserDatabaseManager = {
  generateId,
  sanitizeDid,
  // Data access
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
  // Isolation helpers
  verifyContentOwnership,
  checkSharePermission,
};

export default UserDatabaseManager;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the user database directory
 */
export function initializeUserDatabaseDir() {
  if (!fs.existsSync(USER_DB_DIR)) {
    fs.mkdirSync(USER_DB_DIR, { recursive: true });
    log.info({ path: USER_DB_DIR }, 'Created user database directory');
  }
}

/**
 * Get the database path for a user
 * @param {string} userDid - User's DID
 * @returns {string} Path to user's database file
 */
export function getUserDbPath(userDid) {
  // Sanitize DID for filesystem (replace special chars)
  const sanitizedDid = userDid.replace(/[^a-zA-Z0-9]/g, '_');
  return path.join(USER_DB_DIR, `${sanitizedDid}.db`);
}

/**
 * Get the database URL for a user
 * @param {string} userDid - User's DID
 * @returns {string} Database URL
 */
export function getUserDbUrl(userDid) {
  const dbPath = getUserDbPath(userDid);
  return `file:${dbPath}`;
}

// ============================================================================
// MASTER DATABASE CLIENT
// ============================================================================

/**
 * Get the master PostgreSQL client (for identity/auth)
 * @returns {PrismaClient} Master Prisma client
 */
export function getMasterClient() {
  if (!masterClient) {
    masterClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
    log.info('Master Prisma client initialized');
  }
  return masterClient;
}

/**
 * Disconnect master client
 */
export async function disconnectMasterClient() {
  if (masterClient) {
    await masterClient.$disconnect();
    masterClient = null;
    log.info('Master client disconnected');
  }
}

// ============================================================================
// USER DATABASE CLIENT
// ============================================================================

/**
 * Create a new user database
 * @param {string} userDid - User's DID
 * @returns {Promise<PrismaClient>} User's Prisma client
 */
export async function createUserDatabase(userDid) {
  const dbPath = getUserDbPath(userDid);
  const dbUrl = getUserDbUrl(userDid);

  log.info({ userDid, dbPath }, 'Creating user database');

  try {
    // Create libsql client
    const libsql = createClient({
      url: dbUrl,
    });

    // Create Prisma adapter
    const adapter = new PrismaLibSql(libsql);

    // Create Prisma client for this user
    const userPrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Run migrations/schema creation
    await initializeUserSchema(userPrisma);

    // Cache the client
    userClients.set(userDid, userPrisma);

    log.info({ userDid, dbPath }, 'User database created successfully');
    return userPrisma;
  } catch (error) {
    log.error({ userDid, error: error.message }, 'Failed to create user database');
    throw error;
  }
}

/**
 * Initialize user database schema
 * @param {PrismaClient} userPrisma - User's Prisma client
 */
async function initializeUserSchema(userPrisma) {
  // Create tables for user data
  // Note: In production, you might want to use Prisma migrations
  
  try {
    // Create conversations table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Conversation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "provider" TEXT NOT NULL,
        "sourceUrl" TEXT NOT NULL UNIQUE,
        "contentHash" TEXT,
        "title" TEXT NOT NULL,
        "model" TEXT,
        "state" TEXT DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "messageCount" INTEGER DEFAULT 0,
        "userMessageCount" INTEGER DEFAULT 0,
        "aiMessageCount" INTEGER DEFAULT 0,
        "totalWords" INTEGER DEFAULT 0,
        "totalCharacters" INTEGER DEFAULT 0,
        "totalTokens" INTEGER,
        "totalCodeBlocks" INTEGER DEFAULT 0,
        "totalImages" INTEGER DEFAULT 0,
        "totalTables" INTEGER DEFAULT 0,
        "totalLatexBlocks" INTEGER DEFAULT 0,
        "totalMermaidDiagrams" INTEGER DEFAULT 0,
        "totalToolCalls" INTEGER DEFAULT 0,
        "metadata" JSONB DEFAULT '{}',
        "tags" TEXT[] DEFAULT '{}',
        "ownerId" TEXT
      )
    `;

    // Create messages table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "conversationId" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "author" TEXT,
        "parts" JSONB,
        "contentHash" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "messageIndex" INTEGER NOT NULL,
        "status" TEXT DEFAULT 'completed',
        "finishReason" TEXT,
        "tokenCount" INTEGER,
        "metadata" JSONB DEFAULT '{}',
        FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
      )
    `;

    // Create atomic chat units table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AtomicChatUnit" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "authorDid" TEXT NOT NULL,
        "signature" TEXT,
        "content" TEXT NOT NULL,
        "language" TEXT,
        "type" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "origin" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "messageId" TEXT,
        "messageIndex" INTEGER DEFAULT 0,
        "provider" TEXT,
        "model" TEXT,
        "sourceTimestamp" TIMESTAMPTZ,
        "extractorVersion" TEXT,
        "parserVersion" TEXT,
        "qualityOverall" INTEGER DEFAULT 50,
        "contentRichness" INTEGER DEFAULT 30,
        "structuralIntegrity" INTEGER DEFAULT 70,
        "uniqueness" INTEGER DEFAULT 50,
        "viewCount" INTEGER DEFAULT 0,
        "shareCount" INTEGER DEFAULT 0,
        "quoteCount" INTEGER DEFAULT 0,
        "rediscoveryScore" REAL,
        "sharingPolicy" TEXT DEFAULT 'self',
        "sharingCircles" JSONB DEFAULT '[]',
        "canView" BOOLEAN DEFAULT true,
        "canAnnotate" BOOLEAN DEFAULT false,
        "canRemix" BOOLEAN DEFAULT false,
        "canReshare" BOOLEAN DEFAULT false,
        "metadata" JSONB DEFAULT '{}',
        FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
      )
    `;

    // Create topic profiles table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TopicProfile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "topic" TEXT NOT NULL,
        "mentionCount" INTEGER DEFAULT 0,
        "lastMentionedAt" TIMESTAMPTZ,
        "firstMentionedAt" TIMESTAMPTZ,
        "confidence" REAL DEFAULT 0,
        "relatedTopics" JSONB DEFAULT '[]',
        "keyInsights" JSONB DEFAULT '[]',
        "associatedAcuIds" JSONB DEFAULT '[]',
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create entity profiles table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EntityProfile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "mentionCount" INTEGER DEFAULT 0,
        "lastMentionedAt" TIMESTAMPTZ,
        "firstMentionedAt" TIMESTAMPTZ,
        "confidence" REAL DEFAULT 0,
        "description" TEXT,
        "relationships" JSONB DEFAULT '[]',
        "associatedAcuIds" JSONB DEFAULT '[]',
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create context bundles table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ContextBundle" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "topicIds" JSONB DEFAULT '[]',
        "entityIds" JSONB DEFAULT '[]',
        "acuIds" JSONB DEFAULT '[]',
        "bundleType" TEXT NOT NULL,
        "content" TEXT,
        "tokenCount" INTEGER,
        "compiledAt" TIMESTAMPTZ,
        "lastUsedAt" TIMESTAMPTZ,
        "usageCount" INTEGER DEFAULT 0,
        "isDefault" BOOLEAN DEFAULT false,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create memories table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Memory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "memoryType" TEXT NOT NULL,
        "importance" INTEGER DEFAULT 50,
        "recency" INTEGER DEFAULT 0,
        "sourceAcuIds" JSONB DEFAULT '[]',
        "sourceConversationIds" JSONB DEFAULT '[]',
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create notebooks table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Notebook" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "color" TEXT,
        "icon" TEXT,
        "entryCount" INTEGER DEFAULT 0,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create notebook entries table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "NotebookEntry" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "notebookId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "sourceAcuId" TEXT,
        "sourceConversationId" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE CASCADE
      )
    `;

    // Create AI personas table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AiPersona" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "systemPrompt" TEXT,
        "parameters" JSONB DEFAULT '{}',
        "isActive" BOOLEAN DEFAULT false,
        "usageCount" INTEGER DEFAULT 0,
        "lastUsedAt" TIMESTAMPTZ,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create custom instructions table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CustomInstruction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "instructionType" TEXT NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "priority" INTEGER DEFAULT 0,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create client presence table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ClientPresence" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "deviceId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "lastActiveAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create sync cursors table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SyncCursor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "deviceId" TEXT NOT NULL,
        "cursorType" TEXT NOT NULL,
        "cursorValue" TEXT,
        "lastSyncedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create user facts table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserFact" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "fact" TEXT NOT NULL,
        "factType" TEXT NOT NULL,
        "confidence" REAL DEFAULT 1.0,
        "source" TEXT,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create user context settings table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "UserContextSettings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "autoContextEnabled" BOOLEAN DEFAULT true,
        "contextWindowSize" INTEGER DEFAULT 10,
        "maxTokensPerContext" INTEGER DEFAULT 4000,
        "defaultBundleId" TEXT,
        "topicExtractionEnabled" BOOLEAN DEFAULT true,
        "entityExtractionEnabled" BOOLEAN DEFAULT true,
        "memoryEnabled" BOOLEAN DEFAULT false,
        "notebookAutoArchiving" BOOLEAN DEFAULT false,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create topic conversations table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TopicConversation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "topicProfileId" TEXT NOT NULL,
        "conversationId" TEXT NOT NULL,
        "strength" REAL DEFAULT 0,
        "lastMentionedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create capture attempts table (per-user)
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CaptureAttempt" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sourceUrl" TEXT NOT NULL,
        "provider" TEXT,
        "status" TEXT NOT NULL,
        "errorCode" TEXT,
        "errorMessage" TEXT,
        "errorStack" TEXT,
        "startedAt" TIMESTAMPTZ NOT NULL,
        "completedAt" TIMESTAMPTZ,
        "duration" INTEGER,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "conversationId" TEXT,
        "retryCount" INTEGER DEFAULT 0,
        "retryOf" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create sync operations table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SyncOperation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "deviceId" TEXT NOT NULL,
        "operationType" TEXT NOT NULL,
        "entityType" TEXT NOT NULL,
        "entityId" TEXT NOT NULL,
        "operationData" JSONB,
        "status" TEXT NOT NULL,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "completedAt" TIMESTAMPTZ
      )
    `;

    // Create ACU links table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AcuLink" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sourceAcuId" TEXT NOT NULL,
        "targetAcuId" TEXT NOT NULL,
        "linkType" TEXT NOT NULL,
        "strength" REAL DEFAULT 0,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create conversation compactions table
    await userPrisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ConversationCompaction" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "conversationId" TEXT NOT NULL,
        "compactionType" TEXT NOT NULL,
        "originalMessageCount" INTEGER NOT NULL,
        "compactedMessageCount" INTEGER NOT NULL,
        "tokensSaved" INTEGER,
        "metadata" JSONB DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    log.info('User database schema initialized');
  } catch (error) {
    log.error({ error: error.message }, 'Failed to initialize user schema');
    throw error;
  }
}

/**
 * Get or create a Prisma client for a user
 * @param {string} userDid - User's DID
 * @returns {Promise<PrismaClient>} User's Prisma client
 */
export async function getUserClient(userDid) {
  // Check cache first
  if (userClients.has(userDid)) {
    return userClients.get(userDid);
  }

  // Check if database file exists
  const dbPath = getUserDbPath(userDid);
  
  if (!fs.existsSync(dbPath)) {
    log.info({ userDid }, 'User database does not exist, creating...');
    return createUserDatabase(userDid);
  }

  // Create client for existing database
  try {
    const libsql = createClient({
      url: `file:${dbPath}`,
    });

    const adapter = new PrismaLibSql(libsql);

    const userPrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    userClients.set(userDid, userPrisma);
    log.info({ userDid }, 'User database client loaded from cache');
    return userPrisma;
  } catch (error) {
    log.error({ userDid, error: error.message }, 'Failed to load user database, creating new...');
    return createUserDatabase(userDid);
  }
}

/**
 * Get user client synchronously (only if already cached)
 * @param {string} userDid - User's DID
 * @returns {PrismaClient|null} User's Prisma client or null
 */
export function getUserClientSync(userDid) {
  return userClients.get(userDid) || null;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Check if a user database exists
 * @param {string} userDid - User's DID
 * @returns {boolean}
 */
export function userDatabaseExists(userDid) {
  const dbPath = getUserDbPath(userDid);
  return fs.existsSync(dbPath);
}

/**
 * Delete a user database
 * @param {string} userDid - User's DID
 * @returns {Promise<boolean>}
 */
export async function deleteUserDatabase(userDid) {
  const dbPath = getUserDbPath(userDid);

  log.warn({ userDid }, 'Deleting user database');

  try {
    // Disconnect client if cached
    if (userClients.has(userDid)) {
      const client = userClients.get(userDid);
      await client.$disconnect();
      userClients.delete(userDid);
    }

    // Delete file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    log.info({ userDid, dbPath }, 'User database deleted');
    return true;
  } catch (error) {
    log.error({ userDid, error: error.message }, 'Failed to delete user database');
    return false;
  }
}

/**
 * List all user databases
 * @returns {string[]} Array of user DIDs
 */
export function listUserDatabases() {
  if (!fs.existsSync(USER_DB_DIR)) {
    return [];
  }

  const files = fs.readdirSync(USER_DB_DIR);
  return files
    .filter(f => f.endsWith('.db'))
    .map(f => f.replace('.db', '').replace(/_/g, ':'));
}

/**
 * Get database statistics for a user
 * @param {string} userDid - User's DID
 * @returns {Promise<Object>} Statistics
 */
export async function getUserDatabaseStats(userDid) {
  const client = await getUserClient(userDid);

  try {
    const [
      conversationCount,
      messageCount,
      acuCount,
      topicCount,
      entityCount,
      bundleCount,
    ] = await Promise.all([
      client.conversation.count(),
      client.message.count(),
      client.atomicChatUnit.count(),
      client.topicProfile.count(),
      client.entityProfile.count(),
      client.contextBundle.count(),
    ]);

    return {
      conversations: conversationCount,
      messages: messageCount,
      acus: acuCount,
      topics: topicCount,
      entities: entityCount,
      bundles: bundleCount,
    };
  } catch (error) {
    log.error({ userDid, error: error.message }, 'Failed to get user database stats');
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID
 * @returns {string}
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Close all user database connections
 */
export async function closeAllUserDatabases() {
  log.info('Closing all user database connections');
  
  for (const [userDid, client] of userClients) {
    try {
      await client.$disconnect();
      log.debug({ userDid }, 'User database disconnected');
    } catch (error) {
      log.error({ userDid, error: error.message }, 'Failed to disconnect user database');
    }
  }

  userClients.clear();
  log.info('All user database connections closed');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const UserDatabaseManager = {
  initializeUserDatabaseDir,
  getUserDbPath,
  getUserDbUrl,
  getMasterClient,
  disconnectMasterClient,
  createUserDatabase,
  getUserClient,
  getUserClientSync,
  userDatabaseExists,
  deleteUserDatabase,
  listUserDatabases,
  getUserDatabaseStats,
  closeAllUserDatabases,
  generateId,
};

export default UserDatabaseManager;
