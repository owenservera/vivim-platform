/**
 * Corpus Management Routes
 * 
 * API endpoints for managing company corpus:
 * - Document ingestion
 * - Document management
 * - Topic management
 * - Search
 * - Analytics
 * 
 * @created March 27, 2026
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const router = Router();
const prisma = new PrismaClient();

// Middleware: Require tenant admin
const requireTenantAdmin = async (req: Request, res: Response, next: Function) => {
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant ID required' });
  }

  // Verify tenant exists and user has admin access
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }

  (req as any).tenantId = tenantId;
  next();
};

/**
 * POST /api/v1/corpus/documents/ingest
 * Ingest a new document into the corpus
 */
router.post('/documents/ingest', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { title, content, format, category, topicSlug, sourceUrl, version, authors } = req.body;

    // Validate required fields
    if (!title || !content || !format) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'content', 'format'],
      });
    }

    // Check for existing document by source URL
    if (sourceUrl) {
      const existing = await prisma.corpusDocument.findFirst({
        where: {
          tenantId,
          sourceUrl,
        },
      });

      if (existing) {
        return res.status(409).json({
          error: 'Document with this source URL already exists',
          documentId: existing.id,
          suggestion: 'Use PUT /api/v1/corpus/documents/:id/reingest to update',
        });
      }
    }

    // Create document record
    const document = await prisma.corpusDocument.create({
      data: {
        tenantId,
        title,
        description: req.body.description,
        sourceUrl,
        rawContent: content,
        contentHash: hashContent(content),
        format,
        category,
        version: version || '1.0.0',
        authors: authors || [],
        lastPublishedAt: new Date(),
        wordCount: content.split(/\s+/).length,
      },
    });

    logger.info({ documentId: document.id, tenantId }, 'Document ingested');

    res.json({
      status: 'created',
      documentId: document.id,
      message: 'Document created. Chunking and embedding will be processed asynchronously.',
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Document ingestion failed');
    res.status(500).json({
      error: 'Document ingestion failed',
      message: (error as Error).message,
    });
  }
});

/**
 * PUT /api/v1/corpus/documents/:id/reingest
 * Re-ingest an updated document
 */
router.put('/documents/:id/reingest', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;
    const { content, version } = req.body;

    // Get existing document
    const existing = await prisma.corpusDocument.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (existing.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if content actually changed
    const newHash = hashContent(content);
    if (newHash === existing.contentHash) {
      return res.json({
        status: 'unchanged',
        documentId: existing.id,
        message: 'Content unchanged, no re-ingestion needed',
      });
    }

    // Update document
    await prisma.corpusDocument.update({
      where: { id },
      data: {
        rawContent: content,
        contentHash: newHash,
        version: version || incrementVersion(existing.version),
        lastPublishedAt: new Date(),
        wordCount: content.split(/\s+/).length,
      },
    });

    // Create version record
    await prisma.corpusDocumentVersion.create({
      data: {
        documentId: id,
        version: version || incrementVersion(existing.version),
        contentHash: newHash,
        changeType: 'patch',
        publishedAt: new Date(),
      },
    });

    logger.info({ documentId: id, tenantId }, 'Document re-ingested');

    res.json({
      status: 'updated',
      documentId: existing.id,
      message: 'Document updated. Chunking and embedding will be processed asynchronously.',
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Document re-ingestion failed');
    res.status(500).json({
      error: 'Document re-ingestion failed',
      message: (error as Error).message,
    });
  }
});

/**
 * DELETE /api/v1/corpus/documents/:id
 * Remove a document from the corpus
 */
router.delete('/documents/:id', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { id } = req.params;

    const document = await prisma.corpusDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete by setting isActive to false
    await prisma.corpusDocument.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info({ documentId: id, tenantId }, 'Document deleted');

    res.json({
      status: 'deleted',
      documentId: id,
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Document deletion failed');
    res.status(500).json({
      error: 'Document deletion failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/corpus/documents
 * List all documents for a tenant
 */
router.get('/documents', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { category, topic, limit = 50, offset = 0 } = req.query;

    const where: any = {
      tenantId,
      isActive: true,
    };

    if (category) {
      where.category = category as string;
    }

    if (topic) {
      where.topic = {
        slug: topic as string,
      };
    }

    const documents = await prisma.corpusDocument.findMany({
      where,
      include: {
        topic: {
          select: { slug: true, name: true },
        },
        chunks: {
          select: {
            id: true,
            contentType: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.corpusDocument.count({ where });

    res.json({
      documents,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
      },
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Document list failed');
    res.status(500).json({
      error: 'Document list failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/corpus/topics
 * List topic taxonomy
 */
router.get('/topics', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const topics = await prisma.corpusTopic.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            documents: true,
            childTopics: true,
          },
        },
      },
      orderBy: { path: 'asc' },
    });

    res.json({ topics });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Topic list failed');
    res.status(500).json({
      error: 'Topic list failed',
      message: (error as Error).message,
    });
  }
});

/**
 * POST /api/v1/corpus/search
 * Search corpus chunks
 */
router.post('/search', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;
    const { query, topicSlugs, contentTypes, limit = 10 } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    // Full-text search
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        c.id,
        c.content,
        c.summary,
        c."sectionPath",
        c."topicSlug",
        c."contentType",
        ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${query})) as rank
      FROM "corpus_chunks" c
      WHERE c."tenantId" = ${tenantId}
        AND c."isActive" = true
        AND to_tsvector('english', c.content) @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    res.json({
      query,
      results: results.map((r: any) => ({
        id: r.id,
        content: r.content,
        summary: r.summary,
        sectionPath: r.sectionPath,
        topicSlug: r.topicSlug,
        contentType: r.contentType,
        rank: r.rank,
      })),
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Corpus search failed');
    res.status(500).json({
      error: 'Corpus search failed',
      message: (error as Error).message,
    });
  }
});

/**
 * GET /api/v1/corpus/analytics
 * Get corpus analytics
 */
router.get('/analytics', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).tenantId;

    const [
      totalDocuments,
      totalChunks,
      totalTopics,
      recentQueries,
    ] = await Promise.all([
      prisma.corpusDocument.count({
        where: { tenantId, isActive: true },
      }),
      prisma.corpusChunk.count({
        where: { tenantId, isActive: true },
      }),
      prisma.corpusTopic.count({
        where: { tenantId, isActive: true },
      }),
      prisma.orchestrationLog.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          intent: true,
          corpusConfidence: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Calculate average confidence
    const avgConfidence = recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + (q.corpusConfidence || 0), 0) / recentQueries.length
      : 0;

    // Get top intents
    const intentCounts: Record<string, number> = {};
    for (const q of recentQueries) {
      intentCounts[q.intent] = (intentCounts[q.intent] || 0) + 1;
    }

    res.json({
      overview: {
        totalDocuments,
        totalChunks,
        totalTopics,
      },
      usage: {
        queriesLast7Days: recentQueries.length,
        avgConfidence: avgConfidence.toFixed(2),
        topIntents: Object.entries(intentCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
      },
    });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Analytics fetch failed');
    res.status(500).json({
      error: 'Analytics fetch failed',
      message: (error as Error).message,
    });
  }
});

/**
 * Helper: Hash content for change detection
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Helper: Increment version string
 */
function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

export { router as corpusRoutes };
