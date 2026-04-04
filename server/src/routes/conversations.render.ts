/**
 * Conversation Rendering API Routes
 * 
 * Central API endpoints for rendering conversations with full styling
 * for display across all frontend contexts
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createRequestLogger } from '../lib/logger.js';
import { requireAuth } from '../middleware/unified-auth.js';
import { getPrismaClient } from '../lib/database.js';
import { createRenderingService, type RenderOptions } from '../services/conversation-rendering-service.js';

const router = Router();

// Lazy init rendering service
let renderingService: ReturnType<typeof createRenderingService> | null = null;

function getRenderingService() {
  if (!renderingService) {
    const prisma = getPrismaClient();
    renderingService = createRenderingService(prisma);
  }
  return renderingService;
}

// ============================================================================
// RENDER CONVERSATION
// ============================================================================

/**
 * GET /api/v1/conversations/:id/render
 * 
 * Render a conversation with full styling for display
 * 
 * Query params:
 * - viewMode: 'list' | 'grid' | 'graph' | 'preview' | 'full' (default: 'list')
 * - includeMessages: 'true' | 'false' (default: 'true')
 * - messageLimit: number (default: undefined, no limit)
 * - messageOffset: number (default: 0)
 * - enableSyntaxHighlighting: 'true' | 'false' (default: 'true')
 * - enableLazyLoading: 'true' | 'false' (default: 'true')
 * - maxPreviewLength: number (default: undefined)
 * - includeMetadata: 'true' | 'false' (default: 'true')
 * - includeStats: 'true' | 'false' (default: 'true')
 * - includeACUs: 'true' | 'false' (default: 'false')
 * - stylePreset: string (name of style preset to apply)
 * - template: string (name of rendering template to use)
 */
router.get('/:id/render', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const log = createRequestLogger(req);
  const { id } = req.params;

  try {
    const options: RenderOptions = {
      viewMode: (req.query.viewMode as 'list' | 'grid' | 'graph' | 'preview' | 'full') || 'list',
      includeMessages: req.query.includeMessages !== 'false',
      messageLimit: req.query.messageLimit ? parseInt(req.query.messageLimit as string, 10) : undefined,
      messageOffset: req.query.messageOffset ? parseInt(req.query.messageOffset as string, 10) : 0,
      enableSyntaxHighlighting: req.query.enableSyntaxHighlighting !== 'false',
      enableLazyLoading: req.query.enableLazyLoading !== 'false',
      maxPreviewLength: req.query.maxPreviewLength ? parseInt(req.query.maxPreviewLength as string, 10) : undefined,
      includeMetadata: req.query.includeMetadata !== 'false',
      includeStats: req.query.includeStats !== 'false',
      includeACUs: req.query.includeACUs === 'true',
      stylePreset: req.query.stylePreset as string,
      template: req.query.template as string,
    };

    log.info(
      {
        conversationId: id,
        viewMode: options.viewMode,
        includeMessages: options.includeMessages,
        messageLimit: options.messageLimit,
      },
      'Rendering conversation'
    );

    const service = getRenderingService();
    const rendered = await service.renderConversation(id, options);

    log.info(
      {
        conversationId: id,
        renderTimeMs: rendered.renderTimeMs,
        messageCount: rendered.messageCount,
        contentHash: rendered.contentHash,
      },
      'Conversation rendered successfully'
    );

    res.json({
      success: true,
      data: rendered,
      meta: {
        renderedAt: rendered.renderedAt,
        renderTimeMs: rendered.renderTimeMs,
        contentHash: rendered.contentHash,
        viewMode: rendered.viewMode,
        cached: false, // Could add cache hit detection
      },
    });
  } catch (error) {
    log.error(
      {
        conversationId: id,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to render conversation'
    );

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: `Conversation ${id} not found`,
        },
      });
    }

    next(error);
  }
});

// ============================================================================
// RENDER CONVERSATION PREVIEW (for feeds)
// ============================================================================

/**
 * GET /api/v1/conversations/:id/render/preview
 * 
 * Get a lightweight preview of a conversation optimized for feed cards
 * Faster than full render, includes minimal data
 */
router.get('/:id/render/preview', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const log = createRequestLogger(req);
  const { id } = req.params;

  try {
    const service = getRenderingService();
    
    const rendered = await service.renderConversation(id, {
      viewMode: 'preview',
      includeMessages: true,
      messageLimit: 3, // Only first 3 messages for preview
      enableSyntaxHighlighting: false,
      enableLazyLoading: true,
      maxPreviewLength: 200,
      includeMetadata: true,
      includeStats: true,
      includeACUs: false,
    });

    // Extract just the preview data
    const preview = {
      id: rendered.id,
      title: rendered.title,
      provider: rendered.provider,
      capturedAt: rendered.capturedAt,
      stats: rendered.stats,
      messagePreview: rendered.messages?.slice(0, 3).map((msg) => ({
        id: msg.id,
        role: msg.role,
        preview: msg.parts[0]?.content?.toString().slice(0, 200) || '',
      })),
      customClasses: rendered.customClasses,
    };

    res.json({
      success: true,
      data: preview,
      meta: {
        renderTimeMs: rendered.renderTimeMs,
      },
    });
  } catch (error) {
    log.error(
      {
        conversationId: id,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to render conversation preview'
    );

    next(error);
  }
});

// ============================================================================
// BATCH RENDER (for feed loading)
// ============================================================================

/**
 * POST /api/v1/conversations/render/batch
 * 
 * Render multiple conversations at once for feed loading
 * More efficient than individual requests
 */
router.post('/render/batch', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const log = createRequestLogger(req);
  const { conversationIds, options = {} } = req.body;

  try {
    if (!Array.isArray(conversationIds) || conversationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'conversationIds array is required and must not be empty',
        },
      });
    }

    if (conversationIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BATCH_LIMIT_EXCEEDED',
          message: 'Maximum 50 conversations can be rendered at once',
        },
      });
    }

    log.info(
      {
        conversationCount: conversationIds.length,
        viewMode: options.viewMode,
      },
      'Batch rendering conversations'
    );

    const service = getRenderingService();
    const renderedConversations = await Promise.all(
      conversationIds.map(async (id: string) => {
        try {
          const rendered = await service.renderConversation(id, {
            ...options,
            includeMessages: options.includeMessages ?? false,
            messageLimit: options.messageLimit ?? 5,
          });
          return {
            success: true,
            data: rendered,
          };
        } catch (error) {
          return {
            success: false,
            error: {
              conversationId: id,
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
      })
    );

    const successful = renderedConversations.filter((r) => r.success).length;
    const failed = renderedConversations.filter((r) => !r.success).length;

    log.info(
      {
        total: conversationIds.length,
        successful,
        failed,
      },
      'Batch render complete'
    );

    res.json({
      success: true,
      data: {
        conversations: renderedConversations,
        stats: {
          total: conversationIds.length,
          successful,
          failed,
        },
      },
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to batch render conversations'
    );

    next(error);
  }
});

// ============================================================================
// RENDERING TEMPLATES
// ============================================================================

/**
 * GET /api/v1/conversations/render/templates
 * 
 * Get available rendering templates
 */
router.get('/render/templates', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const log = createRequestLogger(req);

  try {
    const { templateType, provider, role } = req.query;

    const service = getRenderingService();
    const templates = await service.getRenderingTemplates({
      templateType: templateType as string,
      provider: provider as string,
      role: role as string,
    });

    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to fetch rendering templates'
    );

    next(error);
  }
});

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * DELETE /api/v1/conversations/:id/render/cache
 * 
 * Clear rendering cache for a conversation
 */
router.delete('/:id/render/cache', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const log = createRequestLogger(req);
  const { id } = req.params;

  try {
    const service = getRenderingService();
    service.clearCache(id);

    // Also clear database cache
    const prisma = getPrismaClient();
    await prisma.renderingCache.delete({
      where: { conversationId: id },
    }).catch(() => {
      // Ignore if doesn't exist
    });

    log.info({ conversationId: id }, 'Rendering cache cleared');

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  } catch (error) {
    log.error(
      {
        conversationId: id,
        error: error instanceof Error ? error.message : String(error),
      },
      'Failed to clear rendering cache'
    );

    next(error);
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
