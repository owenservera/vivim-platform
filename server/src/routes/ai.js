// apps/server/src/routes/ai.js
// ═══════════════════════════════════════════════════════════════════════════
// AI ROUTES - Context-Aware Conversation with Second Brain Integration
// ═══════════════════════════════════════════════════════════════════════════
//
// This is the primary AI route for CONTEXT-AWARE conversations.
// It leverages the dynamic context system and second brain tools.
//
// For FRESH/standalone chats, see ai-chat.js
// For SETTINGS/config, see ai-settings.js

import { Router } from 'express';
import { unifiedProvider } from '../ai/unified-provider.js';
import { agentPipeline } from '../ai/agent-pipeline.js';
import { aiStorageService } from '../services/ai-storage-service.js';
import { logger } from '../lib/logger.js';
import { aiCompletionSchema, aiStreamSchema, agentRequestSchema, structuredOutputSchema } from '../validators/ai.js';
import { ProviderType, ProviderConfig, getDefaultProvider } from '../types/ai.js';
import { ContextSettingsService } from '../context/settings-service.js';
import { DynamicContextAssembler } from '../context/context-assembler.js';
import { systemPromptManager } from '../ai/system-prompts.js';
import { buildToolkit, getToolkitDescriptions } from '../ai/tools/index.js';
import { aiTelemetry } from '../ai/middleware/telemetry.js';

const router = Router();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get userId from request - supports both session auth and header (legacy)
 */
function getUserId(req) {
  if (req.isAuthenticated() && req.user?.userId) {
    return req.user.userId;
  }
  const headerUserId = req.headers['x-user-id'];
  if (headerUserId) {
    logger.warn({ userId: headerUserId, path: req.path }, 'Using insecure x-user-id header');
    return headerUserId;
  }
  return null;
}

/**
 * Require authentication - returns userId or null
 */
function requireUserId(req, res, next) {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  req.userId = userId;
  next();
}

/**
 * Build context bundles for a conversation
 */
async function buildContextBundles(userId, conversationId) {
  try {
    // Attempt to use the dynamic context assembler
    if (conversationId && process.env.USE_DYNAMIC_CONTEXT === 'true') {
      // This would integrate with the full DynamicContextAssembler
      // For now, return empty — the system prompt manager handles basics
      return [];
    }
    return [];
  } catch (error) {
    logger.warn({ error: error.message }, 'Context assembly failed, proceeding without');
    return [];
  }
}

/**
 * Get second brain stats for a user
 */
async function getSecondBrainStats(userId) {
  try {
    const { getPrismaClient } = await import('../lib/database.js');
    const prisma = getPrismaClient();

    const [topicCount, conversationCount, memoryCount] = await Promise.all([
      prisma.topicProfile.count({ where: { userId } }).catch(() => 0),
      prisma.conversation.count({ where: { ownerId: userId } }).catch(() => 0),
      prisma.atomicContentUnit.count({
        where: { conversation: { ownerId: userId } },
      }).catch(() => 0),
    ]);

    return { topicCount, conversationCount, memoryCount, entityCount: 0 };
  } catch (error) {
    return { topicCount: 0, conversationCount: 0, memoryCount: 0, entityCount: 0 };
  }
}

// ============================================================================
// CONTEXT-AWARE AI COMPLETION (Non-Streaming)
// ============================================================================

/**
 * POST /complete - Generate AI completion with context
 */
router.post('/complete', async (req, res) => {
  try {
    const parsed = aiCompletionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const { messages, provider, model, conversationId, options } = parsed.data;
    const userId = getUserId(req);
    const providerApiKey = req.headers['x-provider-key'];

    // Build context
    const contextBundles = await buildContextBundles(userId, conversationId);
    const secondBrainStats = await getSecondBrainStats(userId);
    const systemPrompt = systemPromptManager.buildPrompt({
      mode: conversationId ? 'continuation' : 'fresh',
      userId,
      contextBundles,
      secondBrainStats,
    });

    const result = await unifiedProvider.generateCompletion({
      provider: provider || getDefaultProvider(),
      model,
      messages,
      system: systemPrompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      userId,
      providerApiKey,
    });

    // Store conversation if we have a conversationId
    if (conversationId) {
      try {
        await aiStorageService.storeAssistantResponse(
          conversationId,
          result.text,
          provider || getDefaultProvider(),
          model || ProviderConfig[provider || getDefaultProvider()]?.defaultModel,
          result.usage,
        );
      } catch (storageError) {
        logger.warn({ error: storageError.message }, 'Failed to store response');
      }
    }

    res.json({
      success: true,
      data: {
        content: result.text,
        model: model || ProviderConfig[provider || getDefaultProvider()]?.defaultModel,
        usage: result.usage,
        finishReason: result.finishReason,
        provider: provider || getDefaultProvider(),
        conversationId,
        toolCalls: result.toolCalls?.map(tc => ({
          name: tc.toolName,
          result: tc.result,
        })),
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Completion failed');
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONTEXT-AWARE AI STREAMING
// ============================================================================

/**
 * POST /stream - Stream AI completion with context
 */
router.post('/stream', async (req, res) => {
  try {
    const parsed = aiStreamSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const { messages, provider, model, conversationId, options } = parsed.data;
    const userId = getUserId(req);

    // Build context
    const contextBundles = await buildContextBundles(userId, conversationId);
    const secondBrainStats = await getSecondBrainStats(userId);
    const systemPrompt = systemPromptManager.buildPrompt({
      mode: conversationId ? 'continuation' : 'fresh',
      userId,
      contextBundles,
      secondBrainStats,
    });

    // Use unified provider's streaming with pipeDataStreamToResponse
    await unifiedProvider.streamCompletion({
      provider: provider || getDefaultProvider(),
      model,
      messages,
      system: systemPrompt,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      userId,
      res,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Stream failed');
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
});

// ============================================================================
// AGENT PIPELINE - Multi-Step Tool-Using AI
// ============================================================================

/**
 * POST /agent - Execute multi-step agent with tools
 * This is the crown jewel — the AI can search your knowledge base,
 * recall past conversations, create memories, and more.
 */
router.post('/agent', async (req, res) => {
  try {
    const parsed = agentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const {
      messages, provider, model, conversationId,
      mode, personaId, toolSet, maxSteps,
      enableSocial, customInstructions, options,
    } = parsed.data;
    const userId = getUserId(req);

    // Build context
    const contextBundles = await buildContextBundles(userId, conversationId);
    const secondBrainStats = await getSecondBrainStats(userId);

    // Resolve model
    const resolvedModel = unifiedProvider.resolveModel(
      provider || getDefaultProvider(),
      model,
    );

    const result = await agentPipeline.execute({
      model: resolvedModel,
      messages,
      userId,
      conversationId,
      mode,
      personaId,
      contextBundles,
      secondBrainStats,
      customInstructions,
      maxSteps,
      toolSet,
      enableSocial,
    });

    // Store conversation
    if (conversationId) {
      try {
        await aiStorageService.storeAssistantResponse(
          conversationId,
          result.text,
          provider || getDefaultProvider(),
          model || ProviderConfig[provider || getDefaultProvider()]?.defaultModel,
          result.usage,
        );
      } catch (storageError) {
        logger.warn({ error: storageError.message }, 'Failed to store agent response');
      }
    }

    res.json({
      success: true,
      data: {
        content: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        steps: result.steps,
        metadata: result.metadata,
        provider: provider || getDefaultProvider(),
        conversationId,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Agent pipeline failed');
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/stream - Stream multi-step agent with tools
 */
router.post('/agent/stream', async (req, res) => {
  try {
    const parsed = agentRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const {
      messages, provider, model, conversationId,
      mode, personaId, toolSet, maxSteps,
      enableSocial, customInstructions,
    } = parsed.data;
    const userId = getUserId(req);

    // Build context
    const contextBundles = await buildContextBundles(userId, conversationId);
    const secondBrainStats = await getSecondBrainStats(userId);

    // Resolve model
    const resolvedModel = unifiedProvider.resolveModel(
      provider || getDefaultProvider(),
      model,
    );

    await agentPipeline.executeStream({
      model: resolvedModel,
      messages,
      res,
      userId,
      conversationId,
      mode,
      personaId,
      contextBundles,
      secondBrainStats,
      customInstructions,
      maxSteps,
      toolSet,
      enableSocial,
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Agent stream failed');
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
});

// ============================================================================
// STRUCTURED OUTPUT
// ============================================================================

/**
 * POST /structured - Generate structured output (JSON matching a schema)
 */
router.post('/structured', async (req, res) => {
  try {
    const parsed = structuredOutputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
    }

    const { prompt, messages, provider, model, schema, toolSet, maxSteps } = parsed.data;
    const userId = getUserId(req);
    const tools = toolSet !== 'none' ? buildToolkit({ userId, toolSet }) : undefined;

    const result = await unifiedProvider.generateStructuredOutput({
      provider: provider || getDefaultProvider(),
      model,
      schema,  // Note: This is a plain JSON schema; in production, convert to Zod
      prompt,
      messages,
      tools,
      maxSteps,
      userId,
    });

    res.json({
      success: true,
      data: {
        output: result.output,
        usage: result.usage,
        provider: provider || getDefaultProvider(),
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Structured output failed');
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONTEXT-AWARE CHAT (Legacy compatible)
// ============================================================================

/**
 * POST /chat - Legacy-compatible chat endpoint with context
 * Maintained for backward compatibility with existing frontend
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      message,
      messages: rawMessages,
      conversationId,
      provider: requestedProvider,
      model,
    } = req.body;

    const userId = getUserId(req);

    // Support both single message and message array
    let messages;
    if (rawMessages && Array.isArray(rawMessages)) {
      messages = rawMessages;
    } else if (message) {
      messages = [{ role: 'user', content: message }];
    } else {
      return res.status(400).json({ success: false, error: 'Either message or messages is required' });
    }

    const provider = requestedProvider || getDefaultProvider();

    // Check if this is a continuation with a conversationId
    if (conversationId) {
      // Store the user message
      try {
        await aiStorageService.processIncomingMessage(conversationId, {
          role: 'user',
          content: messages[messages.length - 1]?.content || message,
        }, provider, model);
      } catch (e) {
        logger.warn({ error: e.message }, 'Failed to store user message');
      }
    }

    // Build context
    const contextBundles = await buildContextBundles(userId, conversationId);
    const secondBrainStats = await getSecondBrainStats(userId);
    const systemPrompt = systemPromptManager.buildPrompt({
      mode: conversationId ? 'continuation' : 'fresh',
      userId,
      contextBundles,
      secondBrainStats,
    });

    const result = await unifiedProvider.generateCompletion({
      provider,
      model,
      messages,
      system: systemPrompt,
      userId,
    });

    // Store response
    if (conversationId) {
      try {
        await aiStorageService.storeAssistantResponse(
          conversationId,
          result.text,
          provider,
          model,
          result.usage,
        );
      } catch (e) {
        logger.warn({ error: e.message }, 'Failed to store assistant response');
      }
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
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Chat failed');
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

export { router as aiRouter };
