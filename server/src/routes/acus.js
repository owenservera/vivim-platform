/**
 * ACU API Routes
 * 
 * Endpoints for managing Atomic Chat Units (ACUs)
 * 
 * Routes:
 * - GET    /api/v1/acus              - List ACUs with filtering
 * - GET    /api/v1/acus/:id          - Get single ACU
 * - GET    /api/v1/acus/:id/links    - Get ACU relationships
 * - POST   /api/v1/acus/search       - Semantic search
 * - POST   /api/v1/acus/process      - Process conversation to ACUs
 * - POST   /api/v1/acus/batch        - Batch process conversations
 */

import express from 'express';
import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';
import { processConversationToACUs, processAllConversations } from '../services/acu-processor.js';

const router = express.Router();

/**
 * GET /api/v1/acus
 * List ACUs with filtering and pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      conversationId,
      type,
      category,
      minQuality = 0,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build where clause
    const where = {};
    if (conversationId) {
where.conversationId = conversationId;
}
    if (type) {
where.type = type;
}
    if (category) {
where.category = category;
}
    if (minQuality > 0) {
      where.qualityOverall = { gte: parseFloat(minQuality) };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Fetch ACUs
    const [acus, total] = await Promise.all([
      getPrismaClient().atomicChatUnit.findMany({
        where,
        orderBy,
        take: parseInt(limit),
        skip: parseInt(offset),
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
              provider: true,
            },
          },
          message: {
            select: {
              id: true,
              role: true,
              messageIndex: true,
            },
          },
        },
      }),
      getPrismaClient().atomicChatUnit.count({ where }),
    ]);

    res.json({
      success: true,
      data: acus,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + acus.length < total,
      },
    });

  } catch (error) {
    logger.error('Failed to list ACUs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list ACUs',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/acus/:id
 * Get single ACU with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const acu = await getPrismaClient().atomicChatUnit.findUnique({
      where: { id },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            provider: true,
            model: true,
            createdAt: true,
          },
        },
        message: {
          select: {
            id: true,
            role: true,
            author: true,
            messageIndex: true,
            createdAt: true,
          },
        },
        linksFrom: {
          include: {
            target: {
              select: {
                id: true,
                content: true,
                type: true,
                category: true,
              },
            },
          },
        },
        linksTo: {
          include: {
            source: {
              select: {
                id: true,
                content: true,
                type: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!acu) {
      return res.status(404).json({
        success: false,
        error: 'ACU not found',
      });
    }

    res.json({
      success: true,
      data: acu,
    });

  } catch (error) {
    logger.error('Failed to get ACU', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get ACU',
      message: error.message,
    });
  }
});

/**
 * GET /api/v1/acus/:id/links
 * Get ACU relationships (graph)
 */
router.get('/:id/links', async (req, res) => {
  try {
    const { id } = req.params;
    const { depth = 1 } = req.query;

    // Check if ACU exists
    const acu = await getPrismaClient().atomicChatUnit.findUnique({
      where: { id },
    });

    if (!acu) {
      return res.status(404).json({
        success: false,
        error: 'ACU not found',
      });
    }

    // Get links (simple implementation - could be optimized with recursive CTE)
    const links = await getPrismaClient().acuLink.findMany({
      where: {
        OR: [
          { sourceId: id },
          { targetId: id },
        ],
      },
      include: {
        source: {
          select: {
            id: true,
            content: true,
            type: true,
            category: true,
            qualityOverall: true,
          },
        },
        target: {
          select: {
            id: true,
            content: true,
            type: true,
            category: true,
            qualityOverall: true,
          },
        },
      },
    });

    // Build graph structure
    const nodes = new Map();
    const edges = [];

    // Add center node
    nodes.set(id, {
      id,
      content: acu.content,
      type: acu.type,
      category: acu.category,
      qualityOverall: acu.qualityOverall,
      isCenter: true,
    });

    // Add linked nodes and edges
    for (const link of links) {
      if (!nodes.has(link.source.id)) {
        nodes.set(link.source.id, {
          ...link.source,
          isCenter: false,
        });
      }
      if (!nodes.has(link.target.id)) {
        nodes.set(link.target.id, {
          ...link.target,
          isCenter: false,
        });
      }

      edges.push({
        id: link.id,
        source: link.sourceId,
        target: link.targetId,
        relation: link.relation,
        weight: link.weight,
      });
    }

    res.json({
      success: true,
      data: {
        center: id,
        nodes: Array.from(nodes.values()),
        edges,
      },
    });

  } catch (error) {
    logger.error('Failed to get ACU links', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get ACU links',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/acus/search
 * Semantic search for ACUs
 */
router.post('/search', async (req, res) => {
  try {
    const {
      query,
      type,
      category,
      minQuality = 0,
      limit = 20,
    } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    // Build where clause
    const where = {};
    if (type) {
where.type = type;
}
    if (category) {
where.category = category;
}
    if (minQuality > 0) {
      where.qualityOverall = { gte: parseFloat(minQuality) };
    }

    // For now, use simple text search
    // In production, this would use vector similarity search
    where.content = {
      contains: query,
      mode: 'insensitive',
    };

    const acus = await getPrismaClient().atomicChatUnit.findMany({
      where,
      take: parseInt(limit),
      orderBy: {
        qualityOverall: 'desc',
      },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
            provider: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: acus,
      query,
      count: acus.length,
    });

  } catch (error) {
    logger.error('Failed to search ACUs', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to search ACUs',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/acus/process
 * Process a conversation into ACUs
 */
router.post('/process', async (req, res) => {
  try {
    const {
      conversationId,
      generateEmbeddings = false,
      calculateQuality = true,
      detectLinks = true,
    } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required',
      });
    }

    // Start processing (async)
    const result = await processConversationToACUs(conversationId, {
      generateEmbeddings,
      calculateQuality,
      detectLinks,
    });

    if (result.success) {
      res.json({
        success: true,
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Processing failed',
        message: result.error,
      });
    }

  } catch (error) {
    logger.error('Failed to process conversation', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process conversation',
      message: error.message,
    });
  }
});

/**
 * POST /api/v1/acus/batch
 * Batch process all conversations
 */
router.post('/batch', async (req, res) => {
  try {
    const {
      batchSize = 10,
      delayMs = 1000,
      generateEmbeddings = false,
      calculateQuality = true,
      detectLinks = true,
    } = req.body;

    // Start batch processing (this will take a while)
    // In production, this should be a background job
    logger.info('Starting batch ACU processing');

    // Send immediate response
    res.json({
      success: true,
      message: 'Batch processing started',
      note: 'This is a long-running operation. Check logs for progress.',
    });

    // Process in background (don't await)
    processAllConversations({
      batchSize,
      delayMs,
      generateEmbeddings,
      calculateQuality,
      detectLinks,
    }).then(result => {
      logger.info('Batch processing complete', result);
    }).catch(error => {
      logger.error('Batch processing failed', { error: error.message });
    });

  } catch (error) {
    logger.error('Failed to start batch processing', { error: error.message });
   res.status(500).json({
       success: false,
       error: 'Failed to start batch processing',
       message: error.message,
     });
   }
 });

/**
 * POST /api/v1/acus/quick
 * Quick capture - minimal friction ACU creation
 */
router.post('/quick', async (req, res) => {
   try {
     const {
       content,
       tags,
       type,
       category,
     } = req.body;

     if (!content?.trim()) {
       return res.status(400).json({
         success: false,
         error: 'Content required',
       });
     }

     // Auto-classify if not provided
     const acuType = type || inferType(content);
     const acuCategory = category || inferCategory(content);

     // Generate ACU ID (content hash)
     const { Prisma } = await import('@prisma/client');
     const hash = await import('crypto');
     const contentHash = hash.default
       .createHash('sha256')
       .update(content.trim())
       .digest('hex')
       .substring(0, 64);
     
     const acuId = `acu-${contentHash}`;

     // Check for duplicates
     const existing = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: acuId },
     });

     if (existing) {
       return res.json({
         success: true,
         data: existing,
         created: false,
         reason: 'duplicate',
       });
     }

     // Create ACU
     const acu = await getPrismaClient().atomicChatUnit.create({
       data: {
         id: acuId,
         authorDid: req.auth?.did || 'did:key:anon', // Would use real DID in production
         signature: Buffer.from('quick-capture'),
         content: content.trim(),
         type: acuType,
         category: acuCategory,
         origin: 'quick_capture',
         qualityOverall: calculateQuickQuality(content, acuType),
         contentRichness: calculateQuickRichness(content),
         structuralIntegrity: calculateQuickIntegrity(content),
         uniqueness: 50,
         tags: tags || [],
         sharingPolicy: 'self',
         sharingCircles: [],
         canView: true,
         canAnnotate: true,
         canRemix: true,
         canReshare: false,
         metadata: {
           source: 'quick-capture',
           capturedAt: new Date().toISOString(),
         },
       },
     });

     res.json({
       success: true,
       data: acu,
       created: true,
     });

   } catch (error) {
     logger.error('Quick capture failed', { error: error.message });
     res.status(500).json({
       success: false,
       error: 'Quick capture failed',
       message: error.message,
     });
   }
 });

/**
 * POST /api/v1/acus/:id/remix
 * Create a remix/derivative of an existing ACU
 */
router.post('/:id/remix', async (req, res) => {
   try {
     const { id: parentId } = req.params;
     const {
       content,
       tags,
       type = 'remix',
       category,
     } = req.body;

     if (!content?.trim()) {
       return res.status(400).json({
         success: false,
         error: 'Content required',
       });
     }

     // Check parent exists
     const parent = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: parentId },
     });

     if (!parent) {
       return res.status(404).json({
         success: false,
         error: 'Parent ACU not found',
       });
     }

     // Generate remix ID
     const { hash } = await import('crypto');
     const contentHash = hash.default
       .createHash('sha256')
       .update(`${parentId}:${content.trim()}`)
       .digest('hex')
       .substring(0, 64);
     
     const remixId = `remix-${contentHash}`;

     // Check for duplicate remix
     const existing = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: remixId },
     });

     if (existing) {
       return res.json({
         success: true,
         data: existing,
         created: false,
         reason: 'duplicate',
       });
     }

     // Create remix
     const remix = await getPrismaClient().atomicChatUnit.create({
       data: {
         id: remixId,
         authorDid: req.auth?.did || 'did:key:anon',
         signature: Buffer.from('remix'),
         content: content.trim(),
         type,
         category: category || parent.category || 'conceptual',
         origin: 'remix',
         parentId,
         qualityOverall: 50, // Would calculate properly in production
         contentRichness: 50,
         structuralIntegrity: 50,
         uniqueness: 50,
         tags: tags || [...(parent.tags || [])],
         sharingPolicy: parent.sharingPolicy,
         sharingCircles: parent.sharingCircles,
         canView: parent.canView,
         canAnnotate: parent.canAnnotate,
         canRemix: parent.canRemix,
         canReshare: parent.canReshare,
         metadata: {
           source: 'remix',
           parentId,
           parentType: parent.type,
           createdAt: new Date().toISOString(),
         },
       },
     });

     // Increment parent's quote count
     await getPrismaClient().atomicChatUnit.update({
       where: { id: parentId },
       data: { quoteCount: { increment: 1 } },
     });

     // Create derivation link
     await getPrismaClient().acuLink.create({
       data: {
         sourceId: remixId,
         targetId: parentId,
         relation: 'derived_from',
         weight: 1.0,
         createdByDid: req.auth?.did,
       },
     });

     res.json({
       success: true,
       data: remix,
       created: true,
     });

   } catch (error) {
     logger.error('Remix failed', { error: error.message });
     res.status(500).json({
       success: false,
       error: 'Remix failed',
       message: error.message,
     });
   }
 });

/**
 * POST /api/v1/acus/:id/annotate
 * Create an annotation on an existing ACU
 */
router.post('/:id/annotate', async (req, res) => {
   try {
     const { id: parentId } = req.params;
     const {
       content,
       tags,
       type = 'annotation',
       category,
     } = req.body;

     if (!content?.trim()) {
       return res.status(400).json({
         success: false,
         error: 'Content required',
       });
     }

     // Check parent exists
     const parent = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: parentId },
     });

     if (!parent) {
       return res.status(404).json({
         success: false,
         error: 'Parent ACU not found',
       });
     }

     // Generate annotation ID
     const { hash } = await import('crypto');
     const contentHash = hash.default
       .createHash('sha256')
       .update(`${parentId}:${content.trim()}`)
       .digest('hex')
       .substring(0, 64);
     
     const annotationId = `anno-${contentHash}`;

     // Check for duplicate annotation
     const existing = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: annotationId },
     });

     if (existing) {
       return res.json({
         success: true,
         data: existing,
         created: false,
         reason: 'duplicate',
       });
     }

     // Create annotation
     const annotation = await getPrismaClient().atomicChatUnit.create({
       data: {
         id: annotationId,
         authorDid: req.auth?.did || 'did:key:anon',
         signature: Buffer.from('annotation'),
         content: content.trim(),
         type,
         category: category || parent.category || 'conceptual',
         origin: 'manual',
         parentId,
         qualityOverall: 50,
         contentRichness: 50,
         structuralIntegrity: 50,
         uniqueness: 50,
         tags: tags || [...(parent.tags || [])],
         sharingPolicy: parent.sharingPolicy,
         sharingCircles: parent.sharingCircles,
         canView: parent.canView,
         canAnnotate: true,
         canRemix: parent.canRemix,
         canReshare: parent.canReshare,
         metadata: {
           source: 'annotation',
           parentId,
           parentType: parent.type,
           createdAt: new Date().toISOString(),
         },
       },
     });

     // Create annotation link
     await getPrismaClient().acuLink.create({
       data: {
         sourceId: annotationId,
         targetId: parentId,
         relation: 'annotates',
         weight: 1.0,
         createdByDid: req.auth?.did,
       },
     });

     res.json({
       success: true,
       data: annotation,
       created: true,
     });

   } catch (error) {
     logger.error('Annotation failed', { error: error.message });
     res.status(500).json({
       success: false,
       error: 'Annotation failed',
       message: error.message,
     });
   }
 });

/**
 * POST /api/v1/acus/:id/bookmark
 * Bookmark an existing ACU
 */
router.post('/:id/bookmark', async (req, res) => {
   try {
     const { id: acuId } = req.params;
     const { notebookId } = req.body;

     // Check ACU exists
     const acu = await getPrismaClient().atomicChatUnit.findUnique({
       where: { id: acuId },
     });

     if (!acu) {
       return res.status(404).json({
         success: false,
         error: 'ACU not found',
       });
     }

     // If notebookId provided, add to notebook
     if (notebookId) {
       const notebook = await getPrismaClient().notebook.findUnique({
         where: { id: notebookId },
       });

       if (!notebook) {
         return res.status(404).json({
           success: false,
           error: 'Notebook not found',
         });
       }

       // Add to notebook (upsert to avoid duplicates)
       await getPrismaClient().notebookEntry.upsert({
         where: {
           notebookId_acuId: {
             notebookId,
             acuId,
           },
         },
         create: {
           notebookId,
           acuId,
           sortOrder: 0,
         },
         update: {},
       });
     }

     // Create bookmark ACU if not exists
     const { hash } = await import('crypto');
     const bookmarkId = `bookmark-${acuId}`;

     const [bookmark] = await getPrismaClient().atomicChatUnit.upsert({
       where: { id: bookmarkId },
       create: {
         id: bookmarkId,
         authorDid: req.auth?.did || 'did:key:anon',
         signature: Buffer.from('bookmark'),
         content: `[Bookmark] ${acu.content.substring(0, 500)}${acu.content.length > 500 ? '...' : ''}`,
         type: 'bookmark',
         category: acu.category,
         origin: 'manual',
         parentId: acuId,
         qualityOverall: acu.qualityOverall,
         contentRichness: 30, // Short bookmark content
         structuralIntegrity: 50,
         uniqueness: 50,
         tags: [...(acu.tags || []), 'bookmark'],
         sharingPolicy: 'self',
         canView: true,
         canAnnotate: true,
         canRemix: true,
         canReshare: false,
         metadata: {
           source: 'bookmark',
           originalAcuId: acuId,
           bookmarkedAt: new Date().toISOString(),
         },
       },
       update: {
         // Update metadata if already exists
         metadata: {
           ...acu.metadata,
           bookmarkedAt: new Date().toISOString(),
         },
       },
     });

     // Create bookmark link
     await getPrismaClient().acuLink.upsert({
       where: {
         sourceId_targetId_relation: {
           sourceId: bookmarkId,
           targetId: acuId,
           relation: 'bookmarks',
         },
       },
       create: {
         sourceId: bookmarkId,
         targetId: acuId,
         relation: 'bookmarks',
         weight: 1.0,
         createdByDid: req.auth?.did,
       },
       update: {},
     });

     res.json({
       success: true,
       data: bookmark,
       created: true,
     });

   } catch (error) {
     logger.error('Bookmark failed', { error: error.message });
     res.status(500).json({
       success: false,
       error: 'Bookmark failed',
       message: error.message,
     });
   }
 });

/**
 * GET /api/v1/acus/stats
 * Get ACU statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      total,
      byType,
      byCategory,
      avgQuality,
    ] = await Promise.all([
      // Total count
      getPrismaClient().atomicChatUnit.count(),
      
      // Count by type
      getPrismaClient().atomicChatUnit.groupBy({
        by: ['type'],
        _count: true,
      }),
      
      // Count by category
      getPrismaClient().atomicChatUnit.groupBy({
        by: ['category'],
        _count: true,
      }),
      
      // Average quality
      getPrismaClient().atomicChatUnit.aggregate({
        _avg: {
          qualityOverall: true,
          contentRichness: true,
          structuralIntegrity: true,
          uniqueness: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {}),
        byCategory: byCategory.reduce((acc, item) => {
          acc[item.category] = item._count;
          return acc;
        }, {}),
        avgQuality: {
          overall: avgQuality._avg.qualityOverall?.toFixed(2),
          richness: avgQuality._avg.contentRichness?.toFixed(2),
          integrity: avgQuality._avg.structuralIntegrity?.toFixed(2),
          uniqueness: avgQuality._avg.uniqueness?.toFixed(2),
        },
      },
    });

   } catch (error) {
     logger.error('Failed to get ACU stats', { error: error.message });
     res.status(500).json({
       success: false,
       error: 'Failed to get ACU stats',
       message: error.message,
     });
   }
 });

// ============================================================================
// HELPER FUNCTIONS FOR NEW ENDPOINTS
// ============================================================================

/**
 * Infer ACU type from content for quick capture
 */
function inferType(content) {
  if (content.includes('```')) return 'code_snippet';
  if (content.endsWith('?')) return 'question';
  if (content.length < 140) return 'thought';
  return 'note';
}

/**
 * Infer ACU category from content
 */
function inferCategory(content) {
  const techKeywords = /\b(function|class|api|database|server|code|bug|deploy|git|programming)\b/i;
  if (techKeywords.test(content)) return 'technical';
  return 'conceptual';
}

/**
 * Calculate quality for quick capture
 */
function calculateQuickQuality(content, type) {
  let score = 50;
  const words = content.split(/\s+/).length;
  score += Math.min(words / 10, 20);
  if (content.includes('```')) score += 15;
  if (content.includes('?')) score += 10;
  return Math.min(Math.round(score), 100);
}

/**
 * Calculate richness for quick capture
 */
function calculateQuickRichness(content) {
  let score = 30;
  const words = content.split(/\s+/).length;
  if (words > 50) score += 20;
  if (words > 100) score += 15;
  if (content.includes('```')) score += 10;
  return Math.min(score, 100);
}

/**
 * Calculate structural integrity for quick capture
 */
function calculateQuickIntegrity(content) {
  let score = 70;
  if (content.length < 20) score -= 20;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 2) score += 10;
  return Math.min(Math.max(score, 0), 100);
}

export default router;
