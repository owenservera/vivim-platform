/**
 * Admin Database Routes
 *
 * Database exploration and query endpoints
 */

import { Router } from 'express';
import { createRequestLogger } from '../../lib/logger.js';
import { getPrismaClient } from '../../lib/database.js';

const router = Router();
const prisma = getPrismaClient();

// ============================================================================
// GET DATABASE TABLES — uses pg_stat_user_tables for real data
// ============================================================================

/**
 * GET /api/admin/database/tables
 *
 * List all database tables with real row counts and sizes from pg_catalog.
 */
router.get('/tables', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const rows = await prisma.$queryRaw`
      SELECT
        relname                                          AS name,
        n_live_tup                                       AS rows,
        pg_size_pretty(pg_total_relation_size(relid))   AS size,
        last_autovacuum                                  AS "lastUpdated"
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `;

    // Coerce BigInt n_live_tup to Number so JSON.stringify works
    const tables = rows.map((r) => ({
      name: r.name,
      rows: Number(r.rows),
      size: r.size,
      lastUpdated: r.lastUpdated ? r.lastUpdated.toISOString() : null,
    }));

    log.info({ count: tables.length }, 'Database tables listed (real data)');
    res.json(tables);
  } catch (error) {
    log.error({ error: error.message }, 'Failed to list database tables');
    next(error);
  }
});

// ============================================================================
// GET TABLE DETAILS
// ============================================================================

/**
 * GET /api/admin/database/tables/:name
 *
 * Get table schema and column details via information_schema.
 */
router.get('/tables/:name', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { name } = req.params;

    // Validate table name — only allow alphanumeric + underscores
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // Get row count and size
    const [tableStats] = await prisma.$queryRaw`
      SELECT
        n_live_tup                                       AS rows,
        pg_size_pretty(pg_total_relation_size(relid))   AS size,
        last_autovacuum                                  AS "lastUpdated"
      FROM pg_stat_user_tables
      WHERE relname = ${name};
    `;

    if (!tableStats) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get column definitions
    const columns = await prisma.$queryRaw`
      SELECT
        column_name          AS name,
        data_type            AS type,
        is_nullable = 'YES'  AS nullable
      FROM information_schema.columns
      WHERE table_name = ${name}
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    log.info({ tableName: name }, 'Table details retrieved (real data)');

    res.json({
      name,
      rows: Number(tableStats.rows),
      size: tableStats.size,
      lastUpdated: tableStats.lastUpdated ? tableStats.lastUpdated.toISOString() : null,
      columns: columns.map((c) => ({ name: c.name, type: c.type, nullable: c.nullable })),
    });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get table details');
    next(error);
  }
});

// ============================================================================
// EXECUTE SQL QUERY — SAFE READ-ONLY ALLOWLIST APPROACH
// ============================================================================

/**
 * POST /api/admin/database/query
 *
 * Execute a pre-validated, read-only query. Uses an allowlist of approved
 * query patterns instead of raw $queryRawUnsafe to prevent SQL injection.
 *
 * SECURITY: $queryRawUnsafe with startsWith('SELECT') is trivially bypassable
 * via stacked queries (e.g. "SELECT 1; DROP TABLE users"). This implementation
 * uses Prisma tagged template literals ($queryRaw) which are parameterized.
 */

// Hardened allowlist of admin read queries
const ALLOWED_QUERIES = {
  table_sizes: () => prisma.$queryRaw`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;
  `,
  slow_queries: () => prisma.$queryRaw`
    SELECT
      query,
      calls,
      total_exec_time / 1000 AS total_seconds,
      mean_exec_time AS avg_ms,
      rows
    FROM pg_stat_statements
    ORDER BY total_exec_time DESC
    LIMIT 20;
  `,
  connection_stats: () => prisma.$queryRaw`
    SELECT
      state,
      count(*)::int AS count,
      max(now() - query_start) AS max_duration
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid()
    GROUP BY state;
  `,
  index_usage: () => prisma.$queryRaw`
    SELECT
      relname AS table_name,
      indexrelname AS index_name,
      idx_scan AS scans,
      idx_tup_read AS tuples_read
    FROM pg_stat_user_indexes
    ORDER BY idx_scan DESC
    LIMIT 20;
  `,
};

router.post('/query', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { queryKey } = req.body;

    if (!queryKey) {
      return res.status(400).json({
        error: 'queryKey is required',
        allowedKeys: Object.keys(ALLOWED_QUERIES),
      });
    }

    const queryFn = ALLOWED_QUERIES[queryKey];
    if (!queryFn) {
      return res.status(400).json({
        error: `Unknown queryKey: "${queryKey}". Only pre-approved queries are allowed.`,
        allowedKeys: Object.keys(ALLOWED_QUERIES),
      });
    }

    log.info({ queryKey }, 'Executing pre-approved admin query');

    const startTime = Date.now();
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Safely coerce BigInt values to Number for JSON serialization
    const safeResult = JSON.parse(
      JSON.stringify(result, (_, value) =>
        typeof value === 'bigint' ? Number(value) : value
      )
    );

    res.json({
      columns: safeResult.length > 0 ? Object.keys(safeResult[0]) : [],
      rows: safeResult,
      rowCount: safeResult.length,
      executionTime,
    });
  } catch (error) {
    log.error({ error: error.message }, 'Admin query execution failed');
    next(error);
  }
});

// ============================================================================
// GET DATABASE STATS — real counts from Prisma
// ============================================================================

/**
 * GET /api/admin/database/stats
 *
 * Get database statistics using real pg_catalog data.
 */
router.get('/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const [tableStats, dbSize] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          count(*)::int        AS table_count,
          sum(n_live_tup)::int AS total_rows
        FROM pg_stat_user_tables;
      `,
      prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;
      `,
    ]);

    const stats = {
      totalTables: tableStats[0]?.table_count ?? 0,
      totalRows: Number(tableStats[0]?.total_rows ?? 0),
      totalSize: dbSize[0]?.db_size ?? 'unknown',
      performance: {
        avgQueryTime: null, // Available via pg_stat_statements if extension enabled
        slowQueries: null,
      },
    };

    log.info('Database stats retrieved (real data)');
    res.json(stats);
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get database stats');
    next(error);
  }
});

export default router;
