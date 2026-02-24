/**
 * Admin DataFlow Routes
 *
 * Data flow monitoring and statistics endpoints
 */

import { Router } from 'express';
import { requireAdminAuth } from '../../middleware/admin-auth.js';
import { createRequestLogger } from '../../lib/logger.js';

const router = Router();

// Mock data flow data
const mockDataFlows = [
  {
    id: 'flow-1',
    type: 'DHT',
    source: 'node-1',
    target: 'node-2',
    status: 'active',
    messagesPerSecond: 12.5,
    bytesPerSecond: 51200,
    totalMessages: 12453,
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'flow-2',
    type: 'PubSub',
    source: 'node-1',
    target: 'topic-1',
    status: 'active',
    messagesPerSecond: 45.2,
    bytesPerSecond: 128000,
    totalMessages: 45321,
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'flow-3',
    type: 'CRDT',
    source: 'node-2',
    target: 'node-3',
    status: 'syncing',
    messagesPerSecond: 8.7,
    bytesPerSecond: 32768,
    totalMessages: 8765,
    lastActivity: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: 'flow-4',
    type: 'Federation',
    source: 'instance-1',
    target: 'instance-2',
    status: 'active',
    messagesPerSecond: 23.4,
    bytesPerSecond: 96000,
    totalMessages: 23456,
    lastActivity: new Date().toISOString(),
  },
];

// ============================================================================
// GET DATA FLOWS
// ============================================================================

/**
 * GET /api/admin/dataflow/flows
 *
 * List all data flows
 */
router.get('/flows', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { type, status } = req.query;

    let filtered = mockDataFlows;

    if (type) {
      filtered = filtered.filter((f) => f.type === type);
    }

    if (status) {
      filtered = filtered.filter((f) => f.status === status);
    }

    log.info({ count: filtered.length, filters: { type, status } }, 'Data flows listed');

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET DATA FLOW STATS
// ============================================================================

/**
 * GET /api/admin/dataflow/stats
 *
 * Get data flow statistics
 */
router.get('/stats', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const totalMessagesPerSecond = mockDataFlows.reduce((sum, f) => sum + f.messagesPerSecond, 0);

    const totalBytesPerSecond = mockDataFlows.reduce((sum, f) => sum + f.bytesPerSecond, 0);

    const stats = {
      totalFlows: mockDataFlows.length,
      activeFlows: mockDataFlows.filter((f) => f.status === 'active').length,
      totalMessagesPerSecond: Math.round(totalMessagesPerSecond * 100) / 100,
      totalBytesPerSecond: Math.round(totalBytesPerSecond),
      byType: {
        DHT: mockDataFlows.filter((f) => f.type === 'DHT').length,
        PubSub: mockDataFlows.filter((f) => f.type === 'PubSub').length,
        CRDT: mockDataFlows.filter((f) => f.type === 'CRDT').length,
        Federation: mockDataFlows.filter((f) => f.type === 'Federation').length,
      },
    };

    log.info('Data flow stats retrieved');

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
