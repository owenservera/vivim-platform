import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from './logger.js';
import { config } from '../config/index.js';

// ============================================================================
// PRISMA CLIENT WITH LOGGING AND SECURITY
// ============================================================================

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient} Prisma client with logging
 */
let prisma = null;

export function getPrismaClient() {
  if (!prisma) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    const baseClient = new PrismaClient({
      log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'minimal',
      adapter,
    });
    
    // Add logging extension in development
    if (config.isDevelopment) {
      prisma = baseClient.$extends({
        query: {
          $allModels: {
            async $allOperations({ model, operation, args, query }) {
              const before = Date.now();
              const result = await query(args);
              const after = Date.now();
              const time = after - before;

              logger.debug(
                {
                  model,
                  action: operation,
                  duration: time,
                },
                `Query ${operation} on ${model}`,
              );

              return result;
            },
          },
        },
      });
    } else {
      prisma = baseClient;
    }
    
    logger.info('Prisma client initialized');
  }

  return prisma;
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
    prisma = null;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth() {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error: error.message }, 'Database health check failed');
    return false;
  }
}

/**
 * Get database connection stats
 */
export async function getDatabaseStats() {
  try {
    const client = getPrismaClient();

    const [
      conversationCount,
      captureAttemptCount,
      providerStats,
    ] = await Promise.all([
      client.conversation.count(),
      client.captureAttempt.count(),
      client.providerStats.findMany(),
    ]);

    return {
      conversations: conversationCount,
      captureAttempts: captureAttemptCount,
      providerStats,
    };
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get database stats');
    return null;
  }
}

/**
 * Execute a callback within a transaction
 */
export async function withTransaction(callback) {
  const client = getPrismaClient();
  try {
    return await client.$transaction(callback);
  } catch (error) {
    logger.error({ error: error.message }, 'Transaction failed');
    throw error;
  }
}

export default getPrismaClient;