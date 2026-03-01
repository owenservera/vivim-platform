/**
 * Documentation Search API Route
 * 
 * Provides intelligent, reasoning-based document search using PageIndex
 * 
 * Endpoints:
 * POST /api/docs/search - Search indexed documents
 * POST /api/docs/index - Index a new document
 * GET /api/docs/tree/:documentId - Get document tree structure
 * DELETE /api/docs/index/:documentId - Remove document from index
 */

import { Router, Request, Response } from 'express';
import { 
  pageIndexService, 
  type DocSearchResult,
  type PageIndexNode 
} from '../services/page-index-service.js';
import { logger } from '../lib/logger.js';

const router = Router();

// Initialize service on first request
pageIndexService.init().catch(err => 
  logger.error({ err }, 'Failed to initialize PageIndex service')
);

/**
 * Search indexed documents using PageIndex
 * 
 * Body:
 * {
 *   documentId: string,      // Document to search (or 'all' for all docs)
 *   query: string,          // Search query
 *   top_k?: number,         // Max results (default: 5)
 * }
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { documentId, query, top_k } = req.body;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    if (!documentId) {
      res.status(400).json({ error: 'Document ID is required' });
      return;
    }

    if (!pageIndexService.isConfigured()) {
      res.status(503).json({ 
        error: 'PageIndex not configured',
        message: 'Set PAGEINDEX_API_KEY or PAGEINDEX_SELF_HOSTED=true'
      });
      return;
    }

    const results = await pageIndexService.search(documentId, {
      query,
      top_k: top_k || 5
    });

    res.json({
      success: true,
      query,
      results,
      count: results.length
    });
  } catch (error) {
    logger.error({ error }, 'PageIndex search failed');
    res.status(500).json({ 
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Index a new document
 * 
 * Body:
 * {
 *   documentId: string,      // Unique identifier for the document
 *   title?: string,          // Document title
 *   filePath: string,        // Path to PDF/Markdown file
 *   isMarkdown?: boolean,    // Is the file Markdown (default: false)
 * }
 */
router.post('/index', async (req: Request, res: Response) => {
  try {
    const { documentId, title, filePath, isMarkdown } = req.body;

    if (!documentId || !filePath) {
      res.status(400).json({ 
        error: 'documentId and filePath are required' 
      });
      return;
    }

    if (!pageIndexService.isConfigured()) {
      res.status(503).json({ 
        error: 'PageIndex not configured',
        message: 'Set PAGEINDEX_API_KEY or PAGEINDEX_SELF_HOSTED=true'
      });
      return;
    }

    const tree = await pageIndexService.indexDocument(filePath, {
      documentId,
      title,
      isMarkdown
    });

    res.json({
      success: true,
      documentId,
      title: tree.title,
      indexed_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ error }, 'PageIndex indexing failed');
    res.status(500).json({ 
      error: 'Indexing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get document tree structure
 */
router.get('/tree/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const tree = pageIndexService.getDocumentTree(documentId);

    if (!tree) {
      res.status(404).json({ 
        error: 'Document not found in index',
        documentId
      });
      return;
    }

    res.json({
      success: true,
      documentId,
      tree
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get document tree');
    res.status(500).json({ 
      error: 'Failed to get tree',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Remove document from index
 */
router.delete('/index/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    pageIndexService.clearIndex(documentId);

    res.json({
      success: true,
      documentId,
      message: 'Document removed from index'
    });
  } catch (error) {
    logger.error({ error }, 'Failed to clear document index');
    res.status(500).json({ 
      error: 'Failed to clear index',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get service status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    configured: pageIndexService.isConfigured(),
    mode: process.env.PAGEINDEX_SELF_HOSTED === 'true' ? 'self-hosted' : 'cloud',
    api_url: process.env.PAGEINDEX_API_URL || 'https://api.pageindex.ai'
  });
});

export default router;
