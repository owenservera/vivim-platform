// apps/server/src/ai/agent-pipeline.js
// ═══════════════════════════════════════════════════════════════════════════
// AI AGENT PIPELINE - Multi-Step Autonomous Agent using Vercel AI SDK
// ═══════════════════════════════════════════════════════════════════════════
//
// This pipeline enables the AI to perform multi-step autonomous tasks:
// 1. Understand the user's intent
// 2. Plan a sequence of tool calls
// 3. Execute tools iteratively
// 4. Synthesize results into a coherent response
//
// Uses Vercel AI SDK's `maxSteps` for automatic tool call loops.

import { generateText, streamText, Output, stepCountIs } from 'ai';
import { z } from 'zod';
import { buildToolkit, getToolkitDescriptions } from './tools/index.js';
import { systemPromptManager } from './system-prompts.js';
import { logger } from '../lib/logger.js';

/**
 * Agent execution modes
 */
export const AGENT_MODES = {
  /**
   * Single-shot: One LLM call, may include tool use
   * Best for: Simple questions with potential knowledge lookup
   */
  singleShot: 'single-shot',

  /**
   * Multi-step: Multiple LLM calls with tool use
   * Best for: Complex queries requiring multiple knowledge lookups
   */
  multiStep: 'multi-step',

  /**
   * Researcher: Deep analysis with structured output
   * Best for: Research questions, analysis tasks
   */
  researcher: 'researcher',

  /**
   * Conversational: Lightweight, fast responses
   * Best for: Quick chat, casual conversation
   */
  conversational: 'conversational',
};

/**
 * AgentPipeline - Multi-step autonomous agent
 */
export class AgentPipeline {
  constructor() {
    this.logger = logger.child({ module: 'AgentPipeline' });
  }

  /**
   * Execute an agent task with tool access
   */
  async execute({
    model,
    messages,
    userId,
    conversationId = null,
    mode = 'multi-step',
    personaId = 'default',
    contextBundles = [],
    secondBrainStats = null,
    customInstructions = '',
    maxSteps = 8,
    toolSet = 'full',
    enableSocial = true,
    onStepStart = null,
    onStepComplete = null,
  }) {
    const startTime = Date.now();
    const log = this.logger.child({ userId, mode, personaId });

    // Build tools
    const tools = buildToolkit({ userId, conversationId, toolSet, enableSocial });
    const toolDescriptions = getToolkitDescriptions(toolSet);

    // Build system prompt
    const systemPrompt = systemPromptManager.buildPrompt({
      mode: conversationId ? 'continuation' : 'fresh',
      personaId,
      userId,
      contextBundles,
      availableTools: toolDescriptions,
      secondBrainStats,
      customInstructions,
      enableSocial,
    });

    // Determine max steps based on mode
    const stepLimits = {
      'single-shot': 2,
      'multi-step': maxSteps,
      researcher: 12,
      conversational: 1,
    };

    const effectiveMaxSteps = stepLimits[mode] || maxSteps;
    const shouldUseTools = mode !== 'conversational';

    // Get persona settings for temperature
    const personaSettings = systemPromptManager.getPersonaSettings(personaId);

    log.info(
      {
        toolCount: Object.keys(tools).length,
        maxSteps: effectiveMaxSteps,
        messageCount: messages.length,
      },
      'Agent pipeline starting'
    );

    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        messages,
        tools: shouldUseTools ? tools : undefined,
        maxSteps: effectiveMaxSteps,
        temperature: personaSettings.temperature,
        onStepFinish: (step) => {
          log.debug(
            {
              stepType: step.stepType,
              toolCalls: step.toolCalls?.length || 0,
              tokensUsed: step.usage?.totalTokens || 0,
            },
            'Agent step complete'
          );

          if (onStepComplete) {
            onStepComplete(step);
          }
        },
      });

      const duration = Date.now() - startTime;

      log.info(
        {
          duration,
          totalTokens: result.usage?.totalTokens,
          steps: result.steps?.length || 1,
          toolCalls: result.steps?.reduce((sum, s) => sum + (s.toolCalls?.length || 0), 0) || 0,
          finishReason: result.finishReason,
        },
        'Agent pipeline complete'
      );

      return {
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        steps: result.steps?.map((s) => ({
          type: s.stepType,
          toolCalls: s.toolCalls?.map((tc) => ({
            name: tc.toolName,
            args: tc.args,
            result: tc.result,
          })),
          text: s.text,
          tokens: s.usage?.totalTokens,
        })),
        metadata: {
          mode,
          personaId,
          duration,
          toolsAvailable: Object.keys(tools),
          toolsUsed:
            result.steps
              ?.flatMap((s) => s.toolCalls?.map((tc) => tc.toolName) || [])
              .filter((v, i, a) => a.indexOf(v) === i) || [],
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error({ error: error.message, duration }, 'Agent pipeline failed');
      throw error;
    }
  }

  /**
   * Execute an agent task with streaming output
   */
  async executeStream({
    model,
    messages,
    res,
    userId,
    conversationId = null,
    mode = 'multi-step',
    personaId = 'default',
    contextBundles = [],
    secondBrainStats = null,
    customInstructions = '',
    maxSteps = 8,
    toolSet = 'full',
    enableSocial = true,
  }) {
    const log = this.logger.child({ userId, mode, personaId });

    // Build tools
    const tools = buildToolkit({ userId, conversationId, toolSet, enableSocial });
    const toolDescriptions = getToolkitDescriptions(toolSet);

    // Build system prompt
    const systemPrompt = systemPromptManager.buildPrompt({
      mode: conversationId ? 'continuation' : 'fresh',
      personaId,
      userId,
      contextBundles,
      availableTools: toolDescriptions,
      secondBrainStats,
      customInstructions,
      enableSocial,
    });

    // Mode config
    const stepLimits = {
      'single-shot': 2,
      'multi-step': maxSteps,
      researcher: 12,
      conversational: 1,
    };
    const effectiveMaxSteps = stepLimits[mode] || maxSteps;
    const shouldUseTools = mode !== 'conversational';
    const personaSettings = systemPromptManager.getPersonaSettings(personaId);

    log.info(
      {
        toolCount: Object.keys(tools).length,
        maxSteps: effectiveMaxSteps,
        streaming: true,
      },
      'Agent stream pipeline starting'
    );

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools: shouldUseTools ? tools : undefined,
      maxSteps: effectiveMaxSteps,
      temperature: personaSettings.temperature,
      onStepFinish: (step) => {
        log.debug(
          {
            stepType: step.stepType,
            toolCalls: step.toolCalls?.length || 0,
          },
          'Agent stream step complete'
        );
      },
      onFinish: (result) => {
        log.info(
          {
            totalTokens: result.usage?.totalTokens,
            finishReason: result.finishReason,
          },
          'Agent stream pipeline complete'
        );
      },
    });

    // Pipe to Express response using Vercel SDK's built-in method
    result.pipeDataStreamToResponse(res);
  }

  /**
   * Generate structured output using agent + tools + schema
   */
  async generateStructured({
    model,
    prompt,
    schema,
    userId,
    conversationId = null,
    toolSet = 'minimal',
    maxSteps = 5,
  }) {
    const tools = buildToolkit({ userId, conversationId, toolSet, enableSocial: false });

    const result = await generateText({
      model,
      tools,
      output: Output.object({ schema }),
      stopWhen: stepCountIs(maxSteps),
      prompt,
    });

    return {
      output: result.output,
      usage: result.usage,
      steps: result.steps?.length || 1,
    };
  }
}

// Singleton
export const agentPipeline = new AgentPipeline();
export default agentPipeline;
