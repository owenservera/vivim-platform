/**
 * Admin CRDT Routes
 *
 * CRDT document management and monitoring endpoints
 */

import { Router } from 'express';
import { createRequestLogger } from '../../lib/logger.js';

const router = Router();

// Mock CRDT document data
const mockDocuments = [
  {
    id: 'crdt-1',
    type: 'conversation',
    version: 5,
    status: 'SYNCED',
    activePeers: 3,
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    size: 24576,
  },
  {
    id: 'crdt-2',
    type: 'circle',
    version: 12,
    status: 'SYNCING',
    activePeers: 5,
    lastSyncedAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    size: 15360,
  },
  {
    id: 'crdt-3',
    type: 'group',
    version: 3,
    status: 'CONFLICT',
    activePeers: 2,
    lastSyncedAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    size: 8192,
    conflicts: [
      {
        field: 'title',
        values: ['Project Alpha', 'Project Beta'],
        peers: ['peer-1', 'peer-2'],
      },
    ],
  },
];

// ============================================================================
// GET CRDT DOCUMENTS
// ============================================================================

/**
 * GET /api/admin/crdt/documents
 *
 * List all CRDT documents
 */
router.get('/documents', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { type, status } = req.query;

    let filtered = mockDocuments;

    if (type) {
      filtered = filtered.filter(d => d.type === type);
    }

    if (status) {
      filtered = filtered.filter(d => d.status === status);
    }

    log.info({ count: filtered.length, filters: { type, status } }, 'CRDT documents listed');

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET DOCUMENT DETAILS
// ============================================================================

/**
 * GET /api/admin/crdt/documents/:id
 *
 * Get CRDT document details
 */
router.get('/documents/:id', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const document = mockDocuments.find(d => d.id === id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    log.info({ documentId: id }, 'CRDT document retrieved');

    res.json(document);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET DOCUMENT SYNC STATUS
// ============================================================================

/**
 * GET /api/admin/crdt/documents/:id/sync
 *
 * Get CRDT document sync status
 */
router.get('/documents/:id/sync', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const document = mockDocuments.find(d => d.id === id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const syncStatus = {
      status: document.status,
      activePeers: document.activePeers,
      lastSyncedAt: document.lastSyncedAt,
      conflicts: document.conflicts || [],
    };

    log.info({ documentId: id }, 'CRDT sync status retrieved');

    res.json(syncStatus);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RESOLVE DOCUMENT CONFLICT
// ============================================================================

/**
 * POST /api/admin/crdt/documents/:id/resolve
 *
 * Resolve CRDT document conflicts
 */
router.post('/documents/:id/resolve', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution data is required' });
    }

    // TODO: Integrate with CRDTSyncService to actually resolve conflicts
    // await crdtService.resolveConflict(id, resolution);

    log.info({ documentId: id, resolution }, 'CRDT conflict resolved');

    res.json({
      success: true,
      message: 'Conflict resolved successfully',
      documentId: id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
