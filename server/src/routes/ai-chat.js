// apps/server/src/routes/ai-chat.js
// ═══════════════════════════════════════════════════════════════════════════
// FRESH AI CHAT - Standalone conversations with optional context system
// ═══════════════════════════════════════════════════════════════════════════
//
// This route handles FRESH conversations — lightweight with optional context.
// In-memory conversation state for the duration of the session.
// Supports personas, provider switching, streaming, and context integration.

import { Router } from 'express';
import { unifiedProvider } from '../ai/unified-provider.js';
import { systemPromptManager } from '../ai/system-prompts.js';
import { unifiedContextService } from '../services/unified-context-service.js';
import { logger } from '../lib/logger.js';
import { ProviderConfig, getDefaultProvider } from '../types/ai.js';
import { freshChatSchema } from '../validators/ai.js';
import { executeZAIAction, isMCPConfigured } from '../services/zai-mcp-service.js';

const router = Router();

// In-memory conversation store (per-session, no persistence)
const conversations = new Map();

// Cleanup stale conversations every 30 minutes
setInterval(() => {
  const staleThreshold = Date.now() - 60 * 60 * 1000; // 1 hour
  for (const [id, conv] of conversations) {
    if (conv.lastActivity < staleThreshold) {
      conversations.delete(id);
    }
  }
}, 30 * 60 * 1000);

// ============================================================================
// CONVERSATION LIFECYCLE
// ============================================================================

/**
 * Get userId from request
 */
function getUserId(req) {
  if (req.isAuthenticated() && req.user?.userId) {
    return req.user.userId;
  }
  return req.headers['x-user-id'] || null;
}

/**
 * POST /start - Create a new fresh conversation
 */
router.post('/start', async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      provider,
      model,
      title = 'New Conversation',
      personaId = 'default',
      messages: initialMessages = [],
    } = req.body;

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const resolvedProvider = provider || getDefaultProvider();

    conversations.set(conversationId, {
      id: conversationId,
      userId,
      title,
      provider: resolvedProvider,
      model: model || ProviderConfig[resolvedProvider]?.defaultModel,
      personaId,
      messages: initialMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
      lastActivity: Date.now(),
    });

    logger.info({ conversationId, userId, provider: resolvedProvider, personaId }, 'Fresh conversation started');

    res.json({
      success: true,
      data: {
        conversationId,
        provider: resolvedProvider,
        model: model || ProviderConfig[resolvedProvider]?.defaultModel,
        personaId,
        title,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to start conversation');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Parse Z.AI MCP action from message
 */
function parseZAIAction(message) {
  const trimmed = message.trim();
  
  if (!trimmed.startsWith('!')) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const action = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(' ');

  const actionMap = {
    websearch: { action: 'websearch', params: { query: args } },
    read: { action: 'readurl', params: { url: args } },
    readurl: { action: 'readurl', params: { url: args } },
    github: { action: 'github', params: parseGithubArgs(args) },
    githubtree: { action: 'github', params: { repo: args, structure: true } },
    githubfile: { action: 'github', params: parseGithubFileArgs(args) },
  };

  return actionMap[action] || null;
}

function parseGithubArgs(args) {
  const match = args.match(/^([^\/]+\/[^\s]+)?\s*(.*)$/);
  if (!match) return { repo: args, query: '' };
  return { repo: match[1] || '', query: match[2] || '' };
}

function parseGithubFileArgs(args) {
  const match = args.match(/^([^\/]+\/[^\s]+)\s+(.+)$/);
  if (!match) return { repo: args, file: '' };
  return { repo: match[1], file: match[2] };
}

/**
 * POST /send - Send a message in an existing fresh conversation
 */
router.post('/send', async (req, res) => {
  try {
    const { conversationId, message, provider: overrideProvider, model: overrideModel } = req.body;
    const userId = getUserId(req);

    if (!conversationId || !message) {
      return res.status(400).json({ success: false, error: 'conversationId and message are required' });
    }

    const conv = conversations.get(conversationId);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found or expired' });
    }

    if (isMCPConfigured()) {
      const zaiAction = parseZAIAction(message);
      if (zaiAction) {
        try {
          const result = await executeZAIAction(zaiAction.action, zaiAction.params);
          
          let responseText = `🔍 **${zaiAction.action.toUpperCase()} Result**\n\n`;
          
          if (zaiAction.action === 'websearch') {
            responseText += `Found ${result.count} results for "${result.query}":\n\n`;
            result.results?.slice(0, 5).forEach((r, i) => {
              responseText += `${i + 1}. **${r.title || r.name || 'Result'}**\n`;
              responseText += `   ${r.url || r.link || ''}\n`;
              responseText += `   ${(r.content || r.description || '').slice(0, 200)}...\n\n`;
            });
          } else if (zaiAction.action === 'readurl') {
            responseText += `📄 **${result.title}**\n\n`;
            responseText += result.content?.slice(0, 3000) || result.summary || 'No content';
          } else if (zaiAction.action === 'github') {
            if (result.structure) {
              responseText += `📁 **${result.repo}**\n\n`;
              result.structure?.slice(0, 20).forEach(item => {
                responseText += `${item.type === 'tree' ? '📁' : '📄'} ${item.path}\n`;
              });
            } else if (result.content) {
              responseText += `📄 **${result.file}** from ${result.repo}\n\n`;
              responseText += '```\n' + result.content?.slice(0, 5000) + '\n```';
            } else {
              responseText += `Found ${result.count} results in **${result.repo}** for "${result.query}":\n\n`;
              result.results?.slice(0, 5).forEach((r, i) => {
                responseText += `${i + 1}. ${r.title || r.name || 'Result'}\n`;
                responseText += `   ${r.content || r.description || ''}\n\n`;
              });
            }
          }

          conv.messages.push({ 
            role: 'assistant', 
            content: responseText, 
            timestamp: new Date().toISOString(),
            metadata: { isZAIAction: true, tool: zaiAction.action }
          });

          return res.json({
            success: true,
            data: {
              content: responseText,
              model: 'zai-mcp',
              provider: 'zai',
              isZAIAction: true,
              conversationId,
            },
          });
        } catch (actionError) {
          logger.error({ error: actionError.message, action: zaiAction }, 'Z.AI MCP action failed');
          return res.json({
            success: true,
            data: {
              content: `❌ Error: ${actionError.message}`,
              model: 'zai-mcp',
              provider: 'zai',
              conversationId,
            },
          });
        }
      }
    }

    // Add user message
    conv.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
    conv.lastActivity = Date.now();

    const provider = overrideProvider || conv.provider;
    const model = overrideModel || conv.model;

    let contextResult = null;
    if (userId) {
      try {
        contextResult = await unifiedContextService.generateContextForChat(conversationId, {
          userId,
          userMessage: message,
          personaId: conv.personaId
        });
      } catch (ctxError) {
        logger.warn({ error: ctxError.message }, 'Context assembly failed for fresh chat');
      }
    }

    const systemPrompt = contextResult?.systemPrompt || systemPromptManager.buildPrompt({
      mode: 'fresh',
      personaId: conv.personaId,
      userId,
    });

    // Format messages for API
    const apiMessages = conv.messages.map(m => ({ role: m.role, content: m.content }));

    const result = await unifiedProvider.generateCompletion({
      provider,
      model,
      messages: apiMessages,
      system: systemPrompt,
      userId,
    });

    // Add assistant response
    conv.messages.push({
      role: 'assistant',
      content: result.text,
      timestamp: new Date().toISOString(),
      metadata: { model, provider, tokens: result.usage?.totalTokens },
    });

    // Auto-generate title from first exchange
    if (conv.messages.length === 2 && conv.title === 'New Conversation') {
      conv.title = message.substring(0, 60) + (message.length > 60 ? '...' : '');
    }

    res.json({
      success: true,
      data: {
        content: result.text,
        model: model || ProviderConfig[provider]?.defaultModel,
        usage: result.usage,
        finishReason: result.finishReason,
        provider,
        conversationId,
        messageCount: conv.messages.length,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Fresh chat send failed');
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STREAMING
// ============================================================================

/**
 * POST /stream - Stream a fresh chat response
 */
router.post('/stream', async (req, res) => {
  try {
    const parsed = freshChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const { message, provider: requestedProvider, model: requestedModel, personaId, options } = parsed.data;
    const userId = getUserId(req);

    const provider = requestedProvider || getDefaultProvider();
    const model = requestedModel || ProviderConfig[provider]?.defaultModel;

    let contextResult = null;
    const convId = `fresh_${Date.now()}`;
    if (userId) {
      try {
        contextResult = await unifiedContextService.generateContextForChat(convId, {
          userId,
          userMessage: message,
          personaId: personaId || 'default'
        });
      } catch (ctxError) {
        logger.warn({ error: ctxError.message }, 'Context assembly failed for fresh stream');
      }
    }

    const systemPrompt = contextResult?.systemPrompt || systemPromptManager.buildPrompt({
      mode: 'fresh',
      personaId: personaId || 'default',
      userId,
    });

    const messages = [{ role: 'user', content: message }];

    // Use Vercel AI SDK's streaming with pipeDataStreamToResponse
    await unifiedProvider.streamCompletion({
      provider,
      model,
      messages,
      system: systemPrompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      userId,
      res,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Fresh chat stream failed');
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
});

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

/**
 * GET /list - List active fresh conversations
 */
router.get('/list', async (req, res) => {
  try {
    const userId = getUserId(req);

    const userConversations = Array.from(conversations.values())
      .filter(c => c.userId === userId)
      .map(c => ({
        id: c.id,
        title: c.title,
        provider: c.provider,
        model: c.model,
        personaId: c.personaId,
        messageCount: c.messages.length,
        createdAt: c.createdAt,
        lastActivity: new Date(c.lastActivity).toISOString(),
      }))
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    res.json({ success: true, data: { conversations: userConversations } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /:id - Get full conversation
 */
router.get('/:id', async (req, res) => {
  try {
    const conv = conversations.get(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: conv });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /:id - Delete a fresh conversation
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = conversations.delete(req.params.id);
    res.json({ success: true, data: { deleted } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /fork - Fork a conversation into a new one
 */
router.post('/fork', async (req, res) => {
  try {
    const { sourceId, prompt, provider, model } = req.body;
    const userId = getUserId(req);

    if (!sourceId) {
      return res.status(400).json({ success: false, error: 'sourceId is required' });
    }

    const source = conversations.get(sourceId);
    if (!source) {
      return res.status(404).json({ success: false, error: 'Source conversation not found' });
    }

    const forkedId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const resolvedProvider = provider || source.provider;

    conversations.set(forkedId, {
      id: forkedId,
      userId,
      title: `Fork of: ${source.title}`,
      provider: resolvedProvider,
      model: model || source.model,
      personaId: source.personaId,
      messages: [...source.messages],
      createdAt: new Date().toISOString(),
      lastActivity: Date.now(),
      forkedFrom: sourceId,
    });

    // If a prompt was provided, send it in the forked conversation
    if (prompt) {
      const conv = conversations.get(forkedId);
      conv.messages.push({ role: 'user', content: prompt, timestamp: new Date().toISOString() });

      const systemPrompt = systemPromptManager.buildPrompt({
        mode: 'fresh',
        personaId: conv.personaId,
        userId,
      });

      const result = await unifiedProvider.generateCompletion({
        provider: resolvedProvider,
        model: model || source.model,
        messages: conv.messages.map(m => ({ role: m.role, content: m.content })),
        system: systemPrompt,
        userId,
      });

      conv.messages.push({
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info({ forkedId, sourceId }, 'Conversation forked');

    res.json({
      success: true,
      data: {
        conversationId: forkedId,
        forkedFrom: sourceId,
        provider: resolvedProvider,
        messageCount: conversations.get(forkedId).messages.length,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Fork failed');
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as aiChatRouter };
