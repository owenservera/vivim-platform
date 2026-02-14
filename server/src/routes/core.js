/**
 * Core Routes - Rust Native Backend API
 * 
 * These routes expose the Rust core functionality:
 * - ACU Processing & Enrichment
 * - Conversation Storage (CRUD)
 * - Message Storage
 * - Full-Text Search (FTS5)
 * - Capture Attempt Tracking
 */

import express from 'express';
import { logger } from '../lib/logger.js';
import { Core, isCoreAvailable, getLastCoreError } from '../core-bridge.js';
import { requireApiKey } from '../middleware/auth.js';

export const coreRouter = express.Router();

// ============================================================================
// HEALTH & STATUS
// ============================================================================

/**
 * GET /api/v1/core/status
 * Check if the Rust Core is available and operational
 */
coreRouter.get('/status', (req, res) => {
    const available = isCoreAvailable();
    const lastError = getLastCoreError();
    
    res.json({
        available,
        engine: available ? 'rust-native' : 'fallback-prisma',
        lastError,
        features: available ? [
            'acu-processing',
            'embeddings',
            'fts5-search',
            'sqlite-storage',
            'capture-tracking',
        ] : [],
    });
});

// ============================================================================
// ACU PROCESSING
// ============================================================================

/**
 * POST /api/v1/core/process
 * Process a capture JSON and extract ACUs (Atomic Chat Units)
 */
coreRouter.post('/process', requireApiKey(), async (req, res, next) => {
    try {
        if (!Core) {
            return res.status(503).json({ error: 'Rust Core not loaded' });
        }

        const { raw_json } = req.body;
        let jsonString;
        
        if (typeof raw_json === 'string') {
            jsonString = raw_json;
        } else if (req.body) {
            jsonString = JSON.stringify(req.body);
        } else {
            return res.status(400).json({ error: 'Missing body' });
        }

        logger.info('Calling Rust Core processCaptureNode...');
        const result = await Core.processCaptureNode(jsonString);
        
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error({ error }, 'Rust Core Process Failed');
        next(error);
    }
});

/**
 * POST /api/v1/core/enrich
 * Enrich ACUs with embeddings for semantic search
 */
coreRouter.post('/enrich', requireApiKey(), async (req, res, next) => {
    try {
        if (!Core) {
            return res.status(503).json({ error: 'Rust Core not loaded' });
        }

        const { acus } = req.body;
        let items = acus;
        if (!items && Array.isArray(req.body)) {
            items = req.body;
        }

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Expected array of ACUs' });
        }
        
        const result = await Core.enrichAcusNode(items);
        res.json({ success: true, data: result });
    } catch (error) {
        logger.error({ error }, 'Rust Core Enrich Failed');
        next(error);
    }
});

// ============================================================================
// CONVERSATION STORAGE
// ============================================================================

/**
 * POST /api/v1/core/conversations/ingest
 * Ingest a full conversation (atomic transaction)
 */
coreRouter.post('/conversations/ingest', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.ingestConversation) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const jsonPayload = JSON.stringify(req.body);
        const messageCount = Core.ingestConversation(jsonPayload);
        
        logger.info({ messageCount }, 'Conversation ingested via Rust Core');
        res.json({ 
            success: true, 
            messageCount,
            engine: 'rust-native',
        });
    } catch (error) {
        const lastError = getLastCoreError();
        logger.error({ error, lastError }, 'Rust Core Ingest Failed');
        next(error);
    }
});

// ============================================================================
// SEARCH & LOOKUP (Must be before :id routes)
// ============================================================================

/**
 * GET /api/v1/core/search
 * Full-text search across conversations using FTS5
 */
coreRouter.get('/search', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.searchConversationsNode) {
            return res.status(503).json({ error: 'Rust Core search not available' });
        }

        const { q, limit } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" required' });
        }

        const maxLimit = Math.min(parseInt(limit) || 20, 100);
        const results = Core.searchConversationsNode(q, maxLimit);
        
        res.json({ 
            success: true, 
            query: q,
            count: Array.isArray(results) ? results.length : 0,
            data: results, 
        });
    } catch (error) {
        logger.error({ error }, 'Rust Core Search Failed');
        next(error);
    }
});

/**
 * GET /api/v1/core/conversations/by-url
 * Get a conversation by source URL
 */
coreRouter.get('/conversations/by-url', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.getConversationByUrlNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL query parameter required' });
        }

        const conversation = Core.getConversationByUrlNode(url);
        
        if (!conversation || conversation === null) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        res.json({ success: true, data: conversation });
    } catch (error) {
        logger.error({ error }, 'Rust Core Get Conversation by URL Failed');
        next(error);
    }
});

// ============================================================================
// ATTEMPTS & STATS (Must be before :id routes)
// ============================================================================

/**
 * GET /api/v1/core/attempts
 * Get recent capture attempts
 */
coreRouter.get('/attempts', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.getRecentAttemptsNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const attempts = Core.getRecentAttemptsNode(limit);
        
        res.json({ 
            success: true, 
            count: Array.isArray(attempts) ? attempts.length : 0,
            data: attempts, 
        });
    } catch (error) {
        logger.error({ error }, 'Rust Core Get Attempts Failed');
        next(error);
    }
});

/**
 * GET /api/v1/core/attempts/recent-success
 * Find a recent successful attempt for a URL (for caching)
 */
coreRouter.get('/attempts/recent-success', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.findRecentSuccessfulAttemptNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const { url, minutes } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL query parameter required' });
        }

        const cacheMinutes = parseInt(minutes) || 60;
        const attempt = Core.findRecentSuccessfulAttemptNode(url, cacheMinutes);
        
        res.json({ 
            success: true, 
            cached: attempt !== null,
            data: attempt, 
        });
    } catch (error) {
        logger.error({ error }, 'Rust Core Find Recent Attempt Failed');
        next(error);
    }
});

// ============================================================================
// CONVERSATION ITEM ROUTES (Generic :id routes last)
// ============================================================================

/**
 * GET /api/v1/core/conversations/:id/messages
 * Get all messages for a conversation
 */
coreRouter.get('/conversations/:id/messages', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.getMessagesByConversation) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const messages = Core.getMessagesByConversation(req.params.id);
        res.json({ 
            success: true, 
            count: Array.isArray(messages) ? messages.length : 0,
            data: messages, 
        });
    } catch (error) {
        logger.error({ error }, 'Rust Core Get Messages Failed');
        next(error);
    }
});

/**
 * GET /api/v1/core/conversations/:id
 * Get a specific conversation by ID
 */
coreRouter.get('/conversations/:id', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.getConversationByIdNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const conversation = Core.getConversationByIdNode(req.params.id);
        
        if (!conversation || conversation === null) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        
        res.json({ success: true, data: conversation });
    } catch (error) {
        logger.error({ error }, 'Rust Core Get Conversation Failed');
        next(error);
    }
});

/**
 * DELETE /api/v1/core/conversations/:id
 * Delete a conversation and all associated data
 */
coreRouter.delete('/conversations/:id', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.deleteConversationNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const success = Core.deleteConversationNode(req.params.id);
        
        if (!success) {
            return res.status(404).json({ error: 'Conversation not found or delete failed' });
        }
        
        logger.info({ conversationId: req.params.id }, 'Conversation deleted via Rust Core');
        res.json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Rust Core Delete Conversation Failed');
        next(error);
    }
});
// ============================================================================
// ACU STORAGE
// ============================================================================

/**
 * POST /api/v1/core/acus/batch
 * Save ACUs in batch
 */
coreRouter.post('/acus/batch', requireApiKey(), (req, res, next) => {
    try {
        if (!Core || !Core.saveAcusNode) {
            return res.status(503).json({ error: 'Rust Core storage not available' });
        }

        const { acus } = req.body;
        let items = acus;
        if (!items && Array.isArray(req.body)) {
            items = req.body;
        }

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Expected array of ACUs' });
        }

        const success = Core.saveAcusNode(items);
        
        logger.info({ count: items.length }, 'ACUs saved via Rust Core');
        res.json({ 
            success, 
            count: items.length,
            engine: 'rust-native',
        });
    } catch (error) {
        logger.error({ error }, 'Rust Core Save ACUs Failed');
        next(error);
    }
});

export default coreRouter;
