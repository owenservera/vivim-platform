/**
 * Admin PubSub Routes
 *
 * PubSub topic management endpoints
 */

import { Router } from 'express';
import { createRequestLogger } from '../../lib/logger.js';

const router = Router();

// Mock PubSub topic data
const mockTopics = [
  {
    id: 'topic-1',
    name: 'conversations',
    type: 'broadcast',
    subscriberCount: 5,
    messageCount: 1243,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'topic-2',
    name: 'circles',
    type: 'topic',
    subscriberCount: 3,
    messageCount: 456,
    lastMessageAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'topic-3',
    name: 'sync',
    type: 'broadcast',
    subscriberCount: 7,
    messageCount: 3421,
    lastMessageAt: new Date(Date.now() - 60000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

const mockSubscribers = [
  {
    id: 'sub-1',
    peerId: '12D3KooW...abc123',
    topicId: 'topic-1',
    subscribedAt: new Date(Date.now() - 3600000).toISOString(),
    messageReceived: 234,
  },
  {
    id: 'sub-2',
    peerId: '12D3KooW...def456',
    topicId: 'topic-1',
    subscribedAt: new Date(Date.now() - 7200000).toISOString(),
    messageReceived: 187,
  },
];

// ============================================================================
// GET PUBSUB TOPICS
// ============================================================================

/**
 * GET /api/admin/pubsub/topics
 *
 * List all PubSub topics
 */
router.get('/topics', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { type } = req.query;

    let filtered = mockTopics;

    if (type) {
      filtered = filtered.filter(t => t.type === type);
    }

    log.info({ count: filtered.length, filters: { type } }, 'PubSub topics listed');

    res.json(filtered);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET TOPIC DETAILS
// ============================================================================

/**
 * GET /api/admin/pubsub/topics/:id
 *
 * Get PubSub topic details
 */
router.get('/topics/:id', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;
    const topic = mockTopics.find(t => t.id === id);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    log.info({ topicId: id }, 'PubSub topic retrieved');

    res.json(topic);
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// GET TOPIC SUBSCRIBERS
// ============================================================================

/**
 * GET /api/admin/pubsub/topics/:id/subscribers
 *
 * Get topic subscribers
 */
router.get('/topics/:id/subscribers', async (req, res, next) => {
  const log = createRequestLogger(req);

  try {
    const { id } = req.params;

    const subscribers = mockSubscribers.filter(s => s.topicId === id);

    log.info({ topicId: id, count: subscribers.length }, 'Topic subscribers retrieved');

    res.json(subscribers);
  } catch (error) {
    next(error);
  }
});

export default router;
