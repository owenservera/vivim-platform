// apps/server/src/ai/unified-provider.js
// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED AI PROVIDER - State-of-the-Art Vercel AI SDK Integration
// ═══════════════════════════════════════════════════════════════════════════
//
// Single entry point for ALL AI operations. Supports:
// - Multi-provider model routing (OpenAI, Anthropic, Google, xAI, ZAI)
// - Tool calling with automatic multi-step execution
// - Structured output generation
// - Streaming with proper Express integration
// - Agent pipeline for autonomous tasks
// - Telemetry and cost tracking

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { zai } from './providers/zai-provider.js';
import { generateText, streamText, generateObject, Output, stepCountIs } from 'ai';
import { ProviderType, ProviderConfig, getDefaultProvider } from '../types/ai.js';
import { logger } from '../lib/logger.js';
import { aiTelemetry } from './middleware/telemetry.js';

/**
 * Unified AI Provider - Single entry point for all AI operations using Vercel AI SDK
 */
class UnifiedAIProvider {
  constructor() {
    this.providerInstances = {
      openai,
      anthropic,
      google,
      xai,
      zai,
    };
    this.logger = logger.child({ module: 'UnifiedAIProvider' });
  }

  /**
   * Get the correct model instance for a provider/model combination
   */
  getModel(providerKey, modelId) {
    const config = ProviderConfig[providerKey];
    if (!config) {
      throw new Error(`Unknown provider: ${providerKey}`);
    }

    const model = modelId || config.defaultModel;
    const instance = this.providerInstances[providerKey];

    if (!instance) {
      throw new Error(`Provider ${providerKey} not configured. Missing SDK package or API key.`);
    }

    // Each Vercel AI SDK provider returns a model reference
    if (providerKey === 'gemini' || providerKey === 'google') {
      return google(model);
    }

    return instance(model);
  }

  /**
   * Generate text completion (non-streaming)
   */
  async generateCompletion({
    provider = getDefaultProvider(),
    model: modelId,
    messages,
    system,
    tools,
    maxSteps,
    temperature,
    maxTokens,
    userId,
    providerApiKey,
  }) {
    const startTime = Date.now();

    try {
      const aiModel = this.getModel(provider, modelId);

      const options = {
        model: aiModel,
        messages,
        ...(system && { system }),
        ...(tools && { tools }),
        ...(maxSteps && { maxSteps }),
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens && { maxTokens }),
      };

      const result = await generateText(options);
      const duration = Date.now() - startTime;

      // Record telemetry
      aiTelemetry.recordRequest({
        provider,
        model: modelId || ProviderConfig[provider]?.defaultModel,
        userId,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        durationMs: duration,
        success: true,
        mode: tools ? 'agent' : 'chat',
        toolsUsed: result.steps?.flatMap(s => s.toolCalls?.map(tc => tc.toolName) || []) || [],
        steps: result.steps?.length || 1,
      });

      this.logger.info({
        provider,
        model: modelId,
        tokens: result.usage?.totalTokens,
        duration,
        steps: result.steps?.length || 1,
      }, 'Completion generated');

      return {
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        steps: result.steps,
        toolCalls: result.steps?.flatMap(s => s.toolCalls || []),
        toolResults: result.steps?.flatMap(s => s.toolResults || []),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      aiTelemetry.recordRequest({
        provider,
        model: modelId,
        userId,
        durationMs: duration,
        success: false,
      });

      this.logger.error({ provider, model: modelId, error: error.message, duration }, 'Completion failed');
      throw this._normalizeError(error, provider);
    }
  }

  /**
   * Stream text completion to Express response
   */
  async streamCompletion({
    provider = getDefaultProvider(),
    model: modelId,
    messages,
    system,
    tools,
    maxSteps,
    temperature,
    maxTokens,
    userId,
    res,
    providerApiKey,
  }) {
    const startTime = Date.now();

    try {
      const aiModel = this.getModel(provider, modelId);

      const options = {
        model: aiModel,
        messages,
        ...(system && { system }),
        ...(tools && { tools }),
        ...(maxSteps && { maxSteps }),
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens && { maxTokens }),
        onFinish: (result) => {
          const duration = Date.now() - startTime;
          aiTelemetry.recordRequest({
            provider,
            model: modelId || ProviderConfig[provider]?.defaultModel,
            userId,
            promptTokens: result.usage?.promptTokens || 0,
            completionTokens: result.usage?.completionTokens || 0,
            durationMs: duration,
            success: true,
            mode: tools ? 'agent-stream' : 'stream',
            toolsUsed: result.steps?.flatMap(s => s.toolCalls?.map(tc => tc.toolName) || []) || [],
            steps: result.steps?.length || 1,
          });

          this.logger.info({
            provider,
            model: modelId,
            tokens: result.usage?.totalTokens,
            duration,
          }, 'Stream completed');
        },
      };

      const result = streamText(options);

      const encoder = new TextEncoder();

      function formatSSE(text) {
        return `data: ${JSON.stringify({ content: text })}\n\n`;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      for await (const chunk of result.textStream) {
        res.write(formatSSE(chunk));
      }

      res.write('data: [DONE]\n\n');
      res.end();

      return result;
    } catch (error) {
      this.logger.error({ provider, model: modelId, error: error.message }, 'Stream failed');
      throw this._normalizeError(error, provider);
    }
  }

  /**
   * Generate structured output (JSON object matching a Zod schema)
   */
  async generateStructuredOutput({
    provider = getDefaultProvider(),
    model: modelId,
    schema,
    prompt,
    messages,
    system,
    tools,
    maxSteps,
    temperature,
    userId,
  }) {
    const startTime = Date.now();

    try {
      const aiModel = this.getModel(provider, modelId);

      // If tools are provided, use generateText with Output.object
      if (tools && Object.keys(tools).length > 0) {
        const result = await generateText({
          model: aiModel,
          tools,
          output: Output.object({ schema }),
          stopWhen: stepCountIs(maxSteps || 5),
          ...(prompt && { prompt }),
          ...(messages && { messages }),
          ...(system && { system }),
          ...(temperature !== undefined && { temperature }),
        });

        const duration = Date.now() - startTime;
        aiTelemetry.recordRequest({
          provider,
          model: modelId,
          userId,
          promptTokens: result.usage?.promptTokens || 0,
          completionTokens: result.usage?.completionTokens || 0,
          durationMs: duration,
          success: true,
          mode: 'structured+tools',
        });

        return { output: result.output, usage: result.usage };
      }

      // Without tools, use generateObject directly
      const result = await generateObject({
        model: aiModel,
        schema,
        ...(prompt && { prompt }),
        ...(messages && { messages }),
        ...(system && { system }),
        ...(temperature !== undefined && { temperature }),
      });

      const duration = Date.now() - startTime;
      aiTelemetry.recordRequest({
        provider,
        model: modelId,
        userId,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        durationMs: duration,
        success: true,
        mode: 'structured',
      });

      return { output: result.object, usage: result.usage };
    } catch (error) {
      this.logger.error({ provider, model: modelId, error: error.message }, 'Structured output failed');
      throw this._normalizeError(error, provider);
    }
  }

  /**
   * Get a model instance for external use (e.g., by AgentPipeline)
   */
  resolveModel(provider, modelId) {
    return this.getModel(provider || getDefaultProvider(), modelId);
  }

  /**
   * Get available providers and their status
   */
  getProviderStatus() {
    const status = {};
    for (const [id, config] of Object.entries(ProviderConfig)) {
      status[id] = {
        displayName: config.displayName,
        models: config.models,
        defaultModel: config.defaultModel,
        isFree: config.isFree || false,
        isAvailable: this._isProviderAvailable(id),
        capabilities: config.capabilities || [],
        description: config.description || '',
      };
    }
    return status;
  }

  /**
   * Check if a provider has its required API key configured
   */
  _isProviderAvailable(providerId) {
    const envKeys = {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
      gemini: 'GOOGLE_GENERATIVE_AI_API_KEY',
      google: 'GOOGLE_GENERATIVE_AI_API_KEY',
      xai: 'XAI_API_KEY',
      qwen: 'QWEN_API_KEY',
      moonshot: 'MOONSHOT_API_KEY',
      minimax: 'MINIMAX_API_KEY',
      zai: 'ZAI_API_KEY',
    };

    const envKey = envKeys[providerId];
    if (!envKey) return false;

    // ZAI always available (free default)
    if (providerId === 'zai') return true;

    return !!process.env[envKey];
  }

  /**
   * Normalize provider errors into consistent format
   */
  _normalizeError(error, provider) {
    const message = error.message || 'Unknown AI error';

    if (message.includes('401') || message.includes('Unauthorized') || message.includes('Invalid API Key')) {
      const err = new Error(`Authentication failed for ${provider}. Check your API key.`);
      err.statusCode = 401;
      err.provider = provider;
      return err;
    }

    if (message.includes('429') || message.includes('Rate limit') || message.includes('quota')) {
      const err = new Error(`Rate limit exceeded for ${provider}. Please try again later.`);
      err.statusCode = 429;
      err.provider = provider;
      return err;
    }

    if (message.includes('timeout') || message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      const err = new Error(`Cannot reach ${provider}. Network error.`);
      err.statusCode = 503;
      err.provider = provider;
      return err;
    }

    const err = new Error(message);
    err.statusCode = error.statusCode || 500;
    err.provider = provider;
    return err;
  }
}

// Singleton
export const unifiedProvider = new UnifiedAIProvider();
export default unifiedProvider;
