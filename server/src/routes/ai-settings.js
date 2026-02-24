// apps/server/src/routes/ai-settings.js
// ═══════════════════════════════════════════════════════════════════════════
// AI SETTINGS ROUTES - User preferences, API keys, personas
// ═══════════════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { logger } from '../lib/logger.js';
import { aiSettingsSchema, customPersonaSchema } from '../validators/ai.js';
import { ProviderConfig, ProviderModels, ProviderType } from '../types/ai.js';
import { systemPromptManager, PERSONAS } from '../ai/system-prompts.js';
import { aiTelemetry } from '../ai/middleware/telemetry.js';
import { unifiedProvider } from '../ai/unified-provider.js';

const router = Router();

// ============================================================================
// PROVIDER INFORMATION
// ============================================================================

/**
 * GET /providers - List all available AI providers with status
 */
router.get('/providers', async (req, res) => {
  try {
    const status = unifiedProvider.getProviderStatus();

    res.json({
      success: true,
      data: {
        providers: Object.entries(status).map(([id, info]) => ({
          id,
          ...info,
        })),
        defaultProvider: ProviderType.ZAI,
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get providers');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /models - Get all models with capabilities
 */
router.get('/models', async (req, res) => {
  try {
    const models = {};

    for (const [provider, providerModels] of Object.entries(ProviderModels)) {
      models[provider] = {
        displayName: ProviderConfig[provider]?.displayName,
        models: Object.entries(providerModels).map(([id, info]) => ({
          id,
          ...info,
        })),
      };
    }

    res.json({ success: true, data: models });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get models');
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PERSONAS
// ============================================================================

/**
 * GET /personas - List all available personas
 */
router.get('/personas', async (req, res) => {
  try {
    const personas = systemPromptManager.getAllPersonas();
    res.json({ success: true, data: { personas } });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get personas');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /personas - Create a custom persona
 */
router.post('/personas', async (req, res) => {
  try {
    const parsed = customPersonaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid persona data',
        details: parsed.error.errors,
      });
    }

    // Check for ID collision with built-in personas
    if (PERSONAS[parsed.data.id]) {
      return res.status(409).json({
        success: false,
        error: `Cannot override built-in persona: ${parsed.data.id}`,
      });
    }

    systemPromptManager.registerPersona(parsed.data);

    res.status(201).json({
      success: true,
      data: { persona: parsed.data },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to create persona');
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TELEMETRY & USAGE
// ============================================================================

/**
 * GET /telemetry - Get AI usage metrics
 */
router.get('/telemetry', async (req, res) => {
  try {
    const metrics = aiTelemetry.getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get telemetry');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /telemetry/user - Get user-specific AI usage metrics
 */
router.get('/telemetry/user', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'dev-user';
    const metrics = aiTelemetry.getUserMetrics(userId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get user telemetry');
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /telemetry/estimate - Estimate cost for a request
 */
router.get('/telemetry/estimate', async (req, res) => {
  try {
    const { provider = 'zai', promptTokens = 1000, completionTokens = 500 } = req.query;
    const estimate = aiTelemetry.estimateCost(
      provider,
      parseInt(promptTokens, 10),
      parseInt(completionTokens, 10)
    );
    res.json({ success: true, data: estimate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CAPABILITIES
// ============================================================================

/**
 * GET /capabilities - Get full AI system capabilities
 */
router.get('/capabilities', async (req, res) => {
  try {
    const providerStatus = unifiedProvider.getProviderStatus();
    const personas = systemPromptManager.getAllPersonas();

    res.json({
      success: true,
      data: {
        version: '2.0.0',
        features: {
          streaming: true,
          toolCalling: true,
          structuredOutput: true,
          agentPipeline: true,
          multiProvider: true,
          personas: true,
          secondBrain: true,
          socialSharing: true,
          telemetry: true,
          costEstimation: true,
        },
        providers: Object.entries(providerStatus)
          .filter(([, info]) => info.isAvailable)
          .map(([id, info]) => ({
            id,
            displayName: info.displayName,
            isFree: info.isFree,
            capabilities: info.capabilities,
          })),
        personas: personas.map((p) => ({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          description: p.description,
          isBuiltIn: p.isBuiltIn,
        })),
        agentModes: [
          {
            id: 'single-shot',
            name: 'Single Shot',
            description: 'One LLM call, may include tool use',
          },
          {
            id: 'multi-step',
            name: 'Multi-Step',
            description: 'Multiple LLM calls with tool chaining',
          },
          {
            id: 'researcher',
            name: 'Deep Research',
            description: 'Extended research with many tool calls',
          },
          { id: 'conversational', name: 'Quick Chat', description: 'Lightweight, fast responses' },
        ],
        toolSets: [
          { id: 'full', name: 'Full Toolkit', tools: 8 },
          { id: 'second-brain', name: 'Second Brain', tools: 6 },
          { id: 'social', name: 'Social', tools: 2 },
          { id: 'minimal', name: 'Minimal', tools: 2 },
          { id: 'none', name: 'No Tools', tools: 0 },
        ],
      },
    });
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to get capabilities');
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as aiSettingsRouter };
