/**
 * Memory System Routes
 *
 * REST API endpoints for the VIVIM Second Brain Memory System.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../lib/database.js';
import { createRequestLogger } from '../lib/logger.js';
import {
  MemoryService,
  MemoryExtractionEngine,
  MemoryRetrievalService,
  MemoryConsolidationService,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemorySearchInput,
  MemoryRetrievalOptions,
} from '../context/memory/index.js';
import { createEmbeddingService, createLLMService } from '../context/utils/zai-service.js';

const router = Router();
const log = createRequestLogger('memory-routes');

// Authentication middleware
function authenticateDIDMiddleware(req: Request, res: Response, next: NextFunction) {
  const did =
    req.headers['x-did'] || (req.headers['authorization'] || '').replace('Bearer did:', 'did:');

  if (!did) {
    return res.status(401).json({ success: false, error: 'DID required' });
  }

  if (!did.startsWith('did:')) {
    return res.status(401).json({ success: false, error: 'Invalid DID format' });
  }

  req.user = { did };
  next();
}

router.use(authenticateDIDMiddleware);

// Initialize services
const prisma = getPrismaClient();
const embeddingService = createEmbeddingService();
const llmService = createLLMService();

const memoryService = new MemoryService({
  prisma,
  embeddingService,
});

const extractionEngine = new MemoryExtractionEngine({
  prisma,
  llmService,
  embeddingService,
});

const retrievalService = new MemoryRetrievalService({
  prisma,
  embeddingService,
});

const consolidationService = new MemoryConsolidationService({
  prisma,
  llmService,
});

// ============================================================================
// MEMORY CRUD
// ============================================================================

/**
 * GET /api/v2/memories
 * Get all memories with filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      query,
      type,
      category,
      tags,
      minImportance,
      maxImportance,
      isPinned,
      limit = 50,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = req.query;

    const searchInput: MemorySearchInput = {
      query: query as string,
      memoryTypes: type ? [(type as string).toUpperCase()] : undefined,
      category: category as string,
      tags: tags ? (tags as string).split(',') : undefined,
      minImportance: minImportance ? parseFloat(minImportance as string) : undefined,
      maxImportance: maxImportance ? parseFloat(maxImportance as string) : undefined,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'importance' | 'relevance' | 'createdAt' | 'accessedAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await memoryService.searchMemories(req.user.did, searchInput);
    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to get memories');
    next(error);
  }
});

/**
 * GET /api/v2/memories/:id
 * Get a specific memory
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await memoryService.getMemoryById(req.user.did, req.params.id);

    if (!memory) {
      return res.status(404).json({ success: false, error: 'Memory not found' });
    }

    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to get memory');
    next(error);
  }
});

/**
 * POST /api/v2/memories
 * Create a new memory
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      content,
      summary,
      memoryType,
      category,
      subcategory,
      tags,
      importance,
      sourceConversationIds,
      sourceAcuIds,
      occurredAt,
      validFrom,
      validUntil,
      isPinned,
      metadata,
    } = req.body;

    const input: CreateMemoryInput = {
      content,
      summary,
      memoryType: memoryType?.toUpperCase(),
      category,
      subcategory,
      tags: tags || [],
      importance: importance ?? 0.5,
      sourceConversationIds: sourceConversationIds || [],
      sourceAcuIds: sourceAcuIds || [],
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      validFrom: validFrom ? new Date(validFrom) : undefined,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      isPinned,
      metadata,
    };

    const memory = await memoryService.createMemory(req.user.did, input);
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error }, 'Failed to create memory');
    next(error);
  }
});

/**
 * PUT /api/v2/memories/:id
 * Update a memory
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      content,
      summary,
      memoryType,
      category,
      subcategory,
      tags,
      importance,
      relevance,
      isPinned,
      isActive,
      isArchived,
      validUntil,
      metadata,
    } = req.body;

    const input: UpdateMemoryInput = {
      content,
      summary,
      memoryType: memoryType?.toUpperCase(),
      category,
      subcategory,
      tags,
      importance,
      relevance,
      isPinned,
      isActive,
      isArchived,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      metadata,
    };

    const memory = await memoryService.updateMemory(req.user.did, req.params.id, input);
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to update memory');
    next(error);
  }
});

/**
 * DELETE /api/v2/memories/:id
 * Delete a memory
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await memoryService.deleteMemory(req.user.did, req.params.id);
    res.json({ success: true });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to delete memory');
    next(error);
  }
});

// ============================================================================
// PIN & ARCHIVE
// ============================================================================

/**
 * POST /api/v2/memories/:id/pin
 * Toggle pin status
 */
router.post('/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await memoryService.togglePin(req.user.did, req.params.id);
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to toggle pin');
    next(error);
  }
});

/**
 * POST /api/v2/memories/:id/archive
 * Archive a memory
 */
router.post('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await memoryService.archiveMemory(req.user.did, req.params.id);
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to archive memory');
    next(error);
  }
});

/**
 * POST /api/v2/memories/:id/restore
 * Restore an archived memory
 */
router.post('/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await memoryService.restoreMemory(req.user.did, req.params.id);
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to restore memory');
    next(error);
  }
});

// ============================================================================
// RETRIEVAL
// ============================================================================

/**
 * POST /api/v2/memories/retrieve
 * Retrieve memories for context
 */
router.post('/retrieve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      contextMessage,
      maxTokens = 2000,
      minImportance = 0.3,
      preferredTypes,
      requiredTypes,
      excludedTypes,
      tags,
      excludeTags,
      includePinned = true,
    } = req.body;

    const options: MemoryRetrievalOptions = {
      maxTokens,
      minImportance,
      preferredTypes: preferredTypes?.map((t: string) => t.toUpperCase()),
      requiredTypes: requiredTypes?.map((t: string) => t.toUpperCase()),
      excludedTypes: excludedTypes?.map((t: string) => t.toUpperCase()),
      tags,
      excludeTags,
      includePinned,
      contextMessage,
    };

    const result = await retrievalService.retrieve(req.user.did, contextMessage || '', options);
    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to retrieve memories');
    next(error);
  }
});

/**
 * GET /api/v2/memories/identity
 * Get identity context memories
 */
router.get('/context/identity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxTokens = 500 } = req.query;
    const result = await retrievalService.retrieveIdentityContext(
      req.user.did,
      parseInt(maxTokens as string)
    );
    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to get identity context');
    next(error);
  }
});

/**
 * GET /api/v2/memories/preferences
 * Get preference context memories
 */
router.get('/context/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxTokens = 300 } = req.query;
    const result = await retrievalService.retrievePreferenceContext(
      req.user.did,
      parseInt(maxTokens as string)
    );
    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to get preference context');
    next(error);
  }
});

/**
 * GET /api/v2/memories/topic/:topic
 * Get memories for a specific topic
 */
router.get('/topic/:topic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { maxTokens = 1000 } = req.query;
    const result = await retrievalService.retrieveForTopic(
      req.user.did,
      req.params.topic,
      parseInt(maxTokens as string)
    );
    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error, topic: req.params.topic }, 'Failed to get topic memories');
    next(error);
  }
});

/**
 * POST /api/v2/memories/similar
 * Find similar memories
 */
router.post('/similar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, limit = 5 } = req.body;
    const memories = await retrievalService.findSimilarMemories(req.user.did, content, limit);
    res.json({ success: true, memories });
  } catch (error) {
    log.error({ error }, 'Failed to find similar memories');
    next(error);
  }
});

// ============================================================================
// EXTRACTION
// ============================================================================

/**
 * POST /api/v2/memories/extract
 * Extract memories from a conversation
 */
router.post('/extract', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId, messageRange, priority = 0, forceReextract = false } = req.body;

    const result = await extractionEngine.extractFromConversation(req.user.did, {
      conversationId,
      messageRange,
      priority,
      forceReextract,
    });

    res.json({ success: result.success, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to extract memories');
    next(error);
  }
});

/**
 * POST /api/v2/memories/extract/batch
 * Process pending extraction jobs
 */
router.post('/extract/batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.body;
    const processed = await extractionEngine.processPendingJobs(limit);
    res.json({ success: true, processed });
  } catch (error) {
    log.error({ error }, 'Failed to process batch extraction');
    next(error);
  }
});

// ============================================================================
// CONSOLIDATION
// ============================================================================

/**
 * POST /api/v2/memories/consolidate
 * Run memory consolidation
 */
router.post('/consolidate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      batchSize = 50,
      minImportance = 0.3,
      maxAge = 24,
      similarityThreshold = 0.7,
    } = req.body;

    const result = await consolidationService.consolidate(req.user.did, {
      batchSize,
      minImportance,
      maxAge,
      similarityThreshold,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    log.error({ error }, 'Failed to consolidate memories');
    next(error);
  }
});

/**
 * POST /api/v2/memories/:id/merge
 * Merge memories
 */
router.post('/:id/merge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceMemoryIds, targetContent } = req.body;
    const mergedId = await consolidationService.mergeMemories(
      req.user.did,
      [req.params.id, ...sourceMemoryIds],
      targetContent
    );

    if (!mergedId) {
      return res.status(400).json({ success: false, error: 'Failed to merge memories' });
    }

    res.json({ success: true, mergedId });
  } catch (error) {
    log.error({ error, memoryId: req.params.id }, 'Failed to merge memories');
    next(error);
  }
});

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * GET /api/v2/memories/stats
 * Get memory statistics
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await memoryService.getStatistics(req.user.did);
    res.json({ success: true, stats });
  } catch (error) {
    log.error({ error }, 'Failed to get memory stats');
    next(error);
  }
});

/**
 * GET /api/v2/memories/consolidation/stats
 * Get consolidation statistics
 */
router.get('/consolidation/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await consolidationService.getConsolidationStats(req.user.did);
    res.json({ success: true, stats });
  } catch (error) {
    log.error({ error }, 'Failed to get consolidation stats');
    next(error);
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * POST /api/v2/memories/bulk/delete
 * Delete multiple memories
 */
router.post('/bulk/delete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memoryIds } = req.body;
    const deleted = await memoryService.deleteMemories(req.user.did, memoryIds);
    res.json({ success: true, deleted });
  } catch (error) {
    log.error({ error }, 'Failed to bulk delete memories');
    next(error);
  }
});

/**
 * POST /api/v2/memories/bulk/archive
 * Archive multiple memories
 */
router.post('/bulk/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memoryIds } = req.body;
    let archived = 0;

    for (const id of memoryIds) {
      try {
        await memoryService.archiveMemory(req.user.did, id);
        archived++;
      } catch (error) {
        log.warn({ error, memoryId: id }, 'Failed to archive memory');
      }

      res.json({ success: true, archived });
    }
  } catch (error) {
    log.error({ error }, 'Failed to bulk archive memories');
    next(error);
  }
});

// ============================================================================
// TYPE HELPERS
// ============================================================================

/**
 * GET /api/v2/memories/types
 * Get available memory types
 */
router.get('/types', (req: Request, res: Response) => {
  res.json({
    success: true,
    types: [
      {
        value: 'EPISODIC',
        label: 'Episodic',
        description: 'Specific events, conversations, experiences',
      },
      {
        value: 'SEMANTIC',
        label: 'Semantic',
        description: 'Facts, knowledge, general understanding',
      },
      {
        value: 'PROCEDURAL',
        label: 'Procedural',
        description: 'How-to knowledge, skills, workflows',
      },
      { value: 'FACTUAL', label: 'Factual', description: 'User facts, personal information' },
      { value: 'PREFERENCE', label: 'Preference', description: 'Likes, dislikes, preferences' },
      {
        value: 'IDENTITY',
        label: 'Identity',
        description: 'Who the user is - bio, role, background',
      },
      {
        value: 'RELATIONSHIP',
        label: 'Relationship',
        description: 'People and their relationships',
      },
      { value: 'GOAL', label: 'Goal', description: 'Goals, plans, intentions' },
      { value: 'PROJECT', label: 'Project', description: 'Project-specific knowledge' },
      { value: 'CUSTOM', label: 'Custom', description: 'User-defined categories' },
    ],
  });
});

export default router;
