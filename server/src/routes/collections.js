/**
 * Collections Routes
 * 
 * API endpoints for managing conversation collections
 */

import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { requireApiKey } from '../middleware/auth.js';
import { getPrismaClient } from '../lib/database.js';

const router = Router();

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get user ID from request - supports session auth and legacy header
 */
function getUserId(req) {
  if (req.isAuthenticated() && req.user?.userId) {
    return req.user.userId;
  }
  return req.auth?.userId || req.headers['x-user-id'] || null;
}

// ============================================================================
// Collection CRUD
// ============================================================================

/**
 * GET /api/v1/collections
 * List all collections for user
 */
router.get('/', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    
    const collections = await getPrismaClient().collection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    res.json({
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
        icon: c.icon,
        itemCount: c._count.items,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/collections
 * Create a new collection
 */
router.post('/', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { name, description, color, icon, parentId } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const collection = await getPrismaClient().collection.create({
      data: {
        userId,
        name: name.slice(0, 100),
        description: description?.slice(0, 500) || null,
        color: color || '#7c3aed',
        icon: icon || 'folder',
        parentId: parentId || null,
      },
    });

    logger.info({ collectionId: collection.id, userId }, 'Collection created');

    res.status(201).json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      itemCount: 0,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/collections/:id
 * Get a specific collection
 */
router.get('/:id', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
      include: {
        items: {
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
          },
        },
      },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      items: collection.items.map(item => ({
        id: item.id,
        type: item.itemType,
        conversation: item.conversation,
        addedAt: item.addedAt,
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/collections/:id
 * Update a collection
 */
router.put('/:id', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, description, color, icon } = req.body;

    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const updated = await getPrismaClient().collection.update({
      where: { id },
      data: {
        name: name?.slice(0, 100) || collection.name,
        description: description !== undefined ? description?.slice(0, 500) : collection.description,
        color: color || collection.color,
        icon: icon || collection.icon,
      },
    });

    logger.info({ collectionId: id }, 'Collection updated');

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      color: updated.color,
      icon: updated.icon,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/collections/:id
 * Delete a collection
 */
router.delete('/:id', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Delete collection and its items
    await getPrismaClient().collectionItem.deleteMany({
      where: { collectionId: id },
    });

    await getPrismaClient().collection.delete({
      where: { id },
    });

    logger.info({ collectionId: id }, 'Collection deleted');

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// Collection Items
// ============================================================================

/**
 * POST /api/v1/collections/:id/items
 * Add an item to a collection
 */
router.post('/:id/items', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
      return res.status(400).json({ error: 'itemType and itemId are required' });
    }

    // Verify collection belongs to user
    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Verify item exists (conversation)
    if (itemType === 'conversation') {
      const conversation = await getPrismaClient().conversation.findFirst({
        where: { id: itemId, ownerId: userId },
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    // Check for existing item
    const existing = await getPrismaClient().collectionItem.findUnique({
      where: {
        collectionId_itemType_itemId: {
          collectionId: id,
          itemType,
          itemId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Item already in collection' });
    }

    const item = await getPrismaClient().collectionItem.create({
      data: {
        collectionId: id,
        itemType,
        itemId,
      },
    });

    // Update collection timestamp
    await getPrismaClient().collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    logger.info({ collectionId: id, itemType, itemId }, 'Item added to collection');

    res.status(201).json({
      id: item.id,
      collectionId: item.collectionId,
      itemType: item.itemType,
      itemId: item.itemId,
      addedAt: item.addedAt,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/collections/:id/items/:itemId
 * Remove an item from a collection
 */
router.delete('/:id/items/:itemId', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id, itemId } = req.params;

    // Verify collection belongs to user
    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await getPrismaClient().collectionItem.deleteMany({
      where: {
        collectionId: id,
        itemId,
      },
    });

    logger.info({ collectionId: id, itemId }, 'Item removed from collection');

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/collections/:id/conversations
 * Get conversations in a collection
 */
router.get('/:id/conversations', requireApiKey(), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const collection = await getPrismaClient().collection.findFirst({
      where: { id, userId },
    });

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const items = await getPrismaClient().collectionItem.findMany({
      where: {
        collectionId: id,
        itemType: 'conversation',
      },
      include: {
        conversation: {
          include: {
            messages: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    res.json({
      conversations: items.map(item => ({
        id: item.conversation.id,
        title: item.conversation.title,
        provider: item.conversation.provider,
        model: item.conversation.model,
        messageCount: item.conversation.messages.length,
        addedAt: item.addedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export { router as collectionsRouter };
