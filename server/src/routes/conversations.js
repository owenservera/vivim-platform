/**
 * Conversation CRUD Routes
 *
 * RESTful endpoints for managing stored conversations
 */

import { Router } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import {
  findConversationById,
  listConversations,
  deleteConversation,
  getStatsByProvider,
  getRecentConversations,
  searchByTitle,
} from '../repositories/index.js';
import { requireApiKey } from '../middleware/auth.js';

const router = Router();

// ============================================================================
// LIST CONVERSATIONS
// ============================================================================

/**
 * GET /api/v1/conversations
 *
 * List conversations with pagination and filters
 *
 * Query params:
 * - provider: Filter by provider
 * - limit: Results per page (default: 20)
 * - offset: Page offset (default: 0)
 * - orderBy: Sort field (default: createdAt)
 * - orderDirection: asc or desc (default: desc)
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 */
router.get('/', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const {
      provider,
      limit = 20,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'desc',
      startDate,
      endDate,
    } = req.query;

    const options = {
      provider,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      orderBy,
      orderDirection,
      startDate,
      endDate,
    };

    const result = await listConversations(options);

    log.info({ count: result.conversations.length, userId: req.auth?.apiKeyPrefix }, 'Conversations listed');

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET CONVERSATION BY ID
// ============================================================================

/**
 * GET /api/v1/conversations/:id
 *
 * Get a single conversation by ID
 */
router.get('/:id', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const conversation = await findConversationById(id);

    if (!conversation) {
      throw new NotFoundError(`Conversation not found: ${id}`);
    }

    log.info({ conversationId: id, userId: req.auth?.apiKeyPrefix }, 'Conversation retrieved');

    res.json({ data: conversation });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SEARCH CONVERSATIONS
// ============================================================================

/**
 * GET /api/v1/conversations/search/:query
 *
 * Search conversations by title
 *
 * Query params:
 * - limit: Results limit (default: 20)
 * - provider: Filter by provider
 */
router.get('/search/:query', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { query } = req.params;
    const { limit = 20, provider } = req.query;

    const conversations = await searchByTitle(query, {
      limit: parseInt(limit, 10),
      provider,
    });

    log.info({ query, count: conversations.length, userId: req.auth?.apiKeyPrefix }, 'Search completed');

    res.json({
      query,
      results: conversations,
      count: conversations.length,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET CONVERSATION STATS
// ============================================================================

/**
 * GET /api/v1/conversations/stats/summary
 *
 * Get conversation statistics by provider
 */
router.get('/stats/summary', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const stats = await getStatsByProvider();

    log.info({ userId: req.auth?.apiKeyPrefix }, 'Stats retrieved');

    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET RECENT CONVERSATIONS
// ============================================================================

/**
 * GET /api/v1/conversations/recent
 *
 * Get recent conversations
 *
 * Query params:
 * - limit: Number of conversations (default: 10)
 */
router.get('/recent', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { limit = 10 } = req.query;
    const conversations = await getRecentConversations(parseInt(limit, 10));

    log.info({ count: conversations.length, userId: req.auth?.apiKeyPrefix }, 'Recent conversations retrieved');

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DELETE CONVERSATION
// ============================================================================

/**
 * DELETE /api/v1/conversations/:id
 *
 * Delete a conversation
 */
router.delete('/:id', requireApiKey(), async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const conversation = await deleteConversation(id);

    log.info({ conversationId: id, userId: req.auth?.apiKeyPrefix }, 'Conversation deleted');

    res.json({
      message: 'Conversation deleted',
      id: conversation.id,
    });
  } catch (error) {
    next(error);
  }
});

export { router as conversationsRouter };
