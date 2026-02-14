/**
 * Context Routes
 * 
 * API endpoints for user context management using isolated per-user databases.
 */

import { Router } from 'express';
import * as contextService from '../context/unified-context-service.js';
import { createRequestLogger } from '../lib/logger.js';

const router = Router();

function authenticateDIDMiddleware(req, res, next) {
  const did = req.headers['x-did'] || (req.headers['authorization'] || '').replace('Bearer did:', 'did:');
  
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

router.get('/topics', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const topics = await contextService.getUserTopics(req.user.did);
    res.json({ success: true, topics });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get topics');
    next(error);
  }
});

router.get('/entities', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const entities = await contextService.getUserEntities(req.user.did);
    res.json({ success: true, entities });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get entities');
    next(error);
  }
});

router.get('/bundles', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const bundles = await contextService.getUserBundles(req.user.did);
    res.json({ success: true, bundles });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get bundles');
    next(error);
  }
});

router.post('/bundles', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { name, description, topicIds, entityIds, acuIds, bundleType } = req.body;
    const bundle = await contextService.createUserBundle(req.user.did, {
      name,
      description,
      topicIds,
      entityIds,
      acuIds,
      bundleType,
    });
    res.json({ success: true, bundle });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to create bundle');
    next(error);
  }
});

router.get('/conversations', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { limit, offset } = req.query;
    const conversations = await contextService.getUserConversations(req.user.did, {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0,
    });
    res.json({ success: true, conversations });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get conversations');
    next(error);
  }
});

router.get('/memories', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { limit } = req.query;
    const memories = await contextService.getUserMemories(req.user.did, {
      limit: parseInt(limit) || 50,
    });
    res.json({ success: true, memories });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get memories');
    next(error);
  }
});

router.post('/memories', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { content, memoryType, importance, sourceAcuIds, sourceConversationIds } = req.body;
    const memory = await contextService.createUserMemory(req.user.did, {
      content,
      memoryType,
      importance,
      sourceAcuIds,
      sourceConversationIds,
    });
    res.json({ success: true, memory });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to create memory');
    next(error);
  }
});

router.get('/notebooks', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const notebooks = await contextService.getUserNotebooks(req.user.did);
    res.json({ success: true, notebooks });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get notebooks');
    next(error);
  }
});

router.post('/notebooks', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { name, description, color, icon } = req.body;
    const notebook = await contextService.createUserNotebook(req.user.did, {
      name,
      description,
      color,
      icon,
    });
    res.json({ success: true, notebook });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to create notebook');
    next(error);
  }
});

router.post('/notebooks/:notebookId/entries', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { title, content, sourceAcuId, sourceConversationId } = req.body;
    const entry = await contextService.addNotebookEntry(
      req.user.did,
      req.params.notebookId,
      { title, content, sourceAcuId, sourceConversationId }
    );
    res.json({ success: true, entry });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to add notebook entry');
    next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const settings = await contextService.getUserSettings(req.user.did);
    res.json({ success: true, settings });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get settings');
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const settings = await contextService.updateUserSettings(req.user.did, req.body);
    res.json({ success: true, settings });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to update settings');
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const stats = await contextService.getUserStats(req.user.did);
    res.json({ success: true, stats });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get stats');
    next(error);
  }
});

router.get('/acus', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { limit, type, category } = req.query;
    const acus = await contextService.getUserACUs(req.user.did, {
      limit: parseInt(limit) || 50,
      type,
      category,
    });
    res.json({ success: true, acus });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to get ACUs');
    next(error);
  }
});

router.post('/compile', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { conversationId, includeTopics, includeEntities, includeBundles, maxTokens } = req.body;
    const context = await contextService.compileContext(
      req.user.did,
      conversationId,
      { includeTopics, includeEntities, includeBundles, maxTokens }
    );
    res.json({ success: true, context });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to compile context');
    next(error);
  }
});

router.post('/search', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { query, limit } = req.body;
    const results = await contextService.semanticSearch(req.user.did, query, { limit });
    res.json({ success: true, results });
  } catch (error) {
    log.error({ error: error.message }, 'Semantic search failed');
    next(error);
  }
});

router.post('/vector/add', async (req, res, next) => {
  const log = createRequestLogger(req);
  
  try {
    const { acuId, content, metadata } = req.body;
    const result = await contextService.addToVectorStore(req.user.did, acuId, content, metadata);
    res.json({ success: true, added: !!result });
  } catch (error) {
    log.error({ error: error.message }, 'Failed to add to vector store');
    next(error);
  }
});

export default router;
