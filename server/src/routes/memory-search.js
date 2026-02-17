import { Router } from 'express';
import { aiService } from '../services/ai-service.js';
import { logger } from '../lib/logger.js';
import { requireApiKey } from '../middleware/auth.js';
import { scheduleConsolidation } from '../workers/memory-worker.js';
import { prisma } from '../lib/database.js';

const router = Router();

router.post('/search', requireApiKey(), async (req, res, next) => {
  try {
    const { query, limit = 5, minScore = 0.7 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const embeddings = await aiService.generateEmbeddings(query);
    if (embeddings.length === 0) {
      return res.status(503).json({ error: 'AI Service Unavailable for Embedding' });
    }

    const results = await prisma.$queryRaw`
      SELECT
        id,
        content,
        type,
        category,
        importance,
        "createdAt",
        1 - (embedding <=> ${embeddings[0]}::vector) as score
      FROM memories
      WHERE "userId" = ${req.user.id}
        AND "isActive" = true
        AND embedding IS NOT NULL
        AND array_length(embedding, 1) > 0
      ORDER BY embedding <=> ${embeddings[0]}::vector
      LIMIT ${limit}
    `;

    const filtered = results.filter(item => item.score >= minScore);

    logger.info({ 
      query: query.substring(0, 50), 
      hits: filtered.length,
      rawHits: results.length
    }, 'Semantic search performed');

    res.json({
      data: filtered.map(item => ({
        id: item.id,
        score: item.score,
        content: item.content,
        type: item.type
      }))
    });

  } catch (error) {
    next(error);
  }
});

router.post('/consolidate/:conversationId', requireApiKey(), async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    
    await scheduleConsolidation(conversationId);
    
    res.status(202).json({ 
      status: 'accepted',
      message: 'Consolidation job queued',
      jobId: conversationId 
    });

  } catch (error) {
    next(error);
  }
});

export default router;
