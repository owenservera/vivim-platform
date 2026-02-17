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

// Mock table data - will integrate with Prisma introspection
const mockTables = [
  {
    name: 'conversations',
    rows: 1524,
    size: '2.4 MB',
    lastUpdated: new Date().toISOString(),
  },
  {
    name: 'messages',
    rows: 8543,
    size: '12.8 MB',
    lastUpdated: new Date().toISOString(),
  },
  {
    name: 'users',
    rows: 234,
    size: '156 KB',
    lastUpdated: new Date().toISOString(),
  },
  {
    name: 'collections',
    rows: 45,
    size: '89 KB',
    lastUpdated: new Date().toISOString(),
  },
];

// ============================================================================
// GET DATABASE TABLES
// ============================================================================

/**
 * GET /api/admin/database/tables
 *
 * List all database tables
 */
router.get('/tables', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    // TODO: Use Prisma introspection to get real table data
    // const tables = await prisma._queryRaw(`SELECT ...`);

    log.info({ count: mockTables.length }, 'Database tables listed');

    res.json(mockTables);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET TABLE DETAILS
// ============================================================================

/**
 * GET /api/admin/database/tables/:name
 *
 * Get table schema and details
 */
router.get('/tables/:name', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { name } = req.params;

    // TODO: Get actual table schema from Prisma/Postgres
    const table = mockTables.find(t => t.name === name);

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Mock column data
    const columns = [
      { name: 'id', type: 'UUID', nullable: false, primary: true },
      { name: 'createdAt', type: 'TIMESTAMP', nullable: false, primary: false },
      { name: 'updatedAt', type: 'TIMESTAMP', nullable: false, primary: false },
    ];

    log.info({ tableName: name }, 'Table details retrieved');

    res.json({
      ...table,
      columns,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// EXECUTE SQL QUERY
// ============================================================================

/**
 * POST /api/admin/database/query
 *
 * Execute SQL query (READ-ONLY for now)
 */
router.post('/query', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Basic validation - only allow SELECT queries
    const trimmedQuery = query.trim().toUpperCase();

    if (!trimmedQuery.startsWith('SELECT')) {
      return res.status(400).json({
        error: 'Only SELECT queries are allowed',
        query,
      });
    }

    // Log query for audit
    log.info({ query }, 'Executing database query');

    // Execute query with Prisma
    const result = await prisma.$queryRawUnsafe(query);

    // Format result
    const response = {
      columns: result.length > 0 ? Object.keys(result[0]) : [],
      rows: result,
      rowCount: result.length,
      executionTime: Math.random() * 100, // Mock execution time
    };

    res.json(response);
  } catch (error) {
    log.error({ error: error.message, query: req.body.query }, 'Query execution failed');

    res.status(500).json({
      error: 'Query execution failed',
      message: error.message,
    });
  }
});

// ============================================================================
// GET DATABASE STATS
// ============================================================================

/**
 * GET /api/admin/database/stats
 *
 * Get database statistics
 */
router.get('/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    // TODO: Get real stats from database
    const stats = {
      totalTables: mockTables.length,
      totalRows: mockTables.reduce((sum, t) => sum + t.rows, 0),
      totalSize: '15.4 MB',
      performance: {
        avgQueryTime: 12.5,
        slowQueries: 3,
      },
    };

    log.info('Database stats retrieved');

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
