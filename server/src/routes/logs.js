/**
 * Logs Routes
 *
 * Server-Sent Events (SSE) endpoint for real-time server log streaming
 */

import { Router } from 'express';
import { logBroadcaster } from '../lib/logBroadcaster.js';

const router = Router();

/**
 * GET /api/v1/logs/stream
 *
 * Server-Sent Events stream of all server logs in real-time
 *
 * Response Format (SSE):
 * data: {"timestamp":"2025-01-25T12:00:00.000Z","level":"info","message":"Server started","source":"server"}
 *
 * Log Levels: log, info, warn, error, debug
 */
router.get('/stream', (req, res) => {
  // Enable CORS for SSE
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Cache-Control');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Add client to broadcaster
  logBroadcaster.addClient(req, res);
});

/**
 * GET /api/v1/logs/status
 *
 * Get status of the log streaming service
 *
 * Response:
 * {
 *   "activeClients": 2,
 *   "bufferSize": 150,
 *   "maxBufferSize": 1000,
 *   "initialized": true
 * }
 */
router.get('/status', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');

  res.json({
    activeClients: logBroadcaster.getClientCount(),
    bufferSize: logBroadcaster.getBufferSize(),
    maxBufferSize: 1000,
    initialized: logBroadcaster.initialized,
  });
});

export { router as logsRouter };
