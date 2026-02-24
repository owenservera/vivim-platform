import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { logger } from './logger.js';
import { config } from '../config/index.js';
import { serverErrorReporter } from '../utils/server-error-reporting.js';

// ============================================================================
// PRISMA CLIENT WITH LOGGING AND SECURITY
// ============================================================================

/**
 * Get or create Prisma client instance
 * @returns {PrismaClient} Prisma client with logging
 */
let prismaClient = null;

export function getPrismaClient() {
  if (!prismaClient) {
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

    // Enhanced Prisma Extension for Data Flow Tracking & Performance Monitoring
    prismaClient = baseClient.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const before = Date.now();
            try {
              const result = await query(args);
              const after = Date.now();
              const time = after - before;

              // Intelligent Feedback: Identify slow queries as bottlenecks
              if (time > 100) {
                const slowQueryMsg = `SLOW_QUERY: ${operation} on ${model} took ${time}ms`;
                logger.warn({ model, action: operation, duration: time }, slowQueryMsg);

                // Report performance bottleneck
                serverErrorReporter
                  .reportPerformanceIssue(
                    'database_query_time',
                    time,
                    100,
                    { model, operation, query: args },
                    time > 500 ? 'medium' : 'low'
                  )
                  .catch(() => {});
              }

              return result;
            } catch (error) {
              const after = Date.now();
              const time = after - before;

              // Comprehensive Error Reporting for Database Failures
              serverErrorReporter
                .reportDatabaseError(
                  `Database operation failed: ${operation} on ${model}`,
                  error,
                  { model, operation, args, duration: time },
                  'critical'
                )
                .catch(() => {});

              throw error;
            }
          },
        },
      },
    });

    logger.info('Prisma client initialized with enhanced observability');
  }

  return prismaClient;
}

export const prisma = getPrismaClient();

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  if (prismaClient) {
    await prismaClient.$disconnect();
    logger.info('Prisma client disconnected');
    prismaClient = null;
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

    const [conversationCount, captureAttemptCount, providerStats] = await Promise.all([
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
