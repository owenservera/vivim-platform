/**
 * VIVIM SDK — Agent Spawning System
 *
 * Inspired by vCode's `src/tools/AgentTool/` pattern.
 * Core multi-agent pattern: spawn agent, define allowed/denied tools, collect results.
 *
 * Agent lifecycle:
 * 1. Spawn — create agent with scoped tool access
 * 2. Execute — run agent with task instructions
 * 3. Collect — gather results
 * 4. Report — summarize what agent accomplished
 *
 * Provider-agnostic orchestration — works with any LLM provider.
 */

import type { ToolRegistry } from '../tools/registry.js';
import type { ToolResult } from '../tools.js';

/**
 * Agent status.
 */
export type AgentStatus = 'spawning' | 'running' | 'completed' | 'failed' | 'stopped';

/**
 * Agent result.
 */
export interface AgentResult {
  /** Agent ID */
  agentId: string;
  /** Status */
  status: AgentStatus;
  /** Final response from the agent */
  response: string;
  /** Tool calls made by the agent */
  toolCalls: Array<{
    toolName: string;
    input: unknown;
    result: ToolResult;
  }>;
  /** Error if failed */
  error?: string;
  /** Execution time in ms */
  durationMs: number;
  /** Token usage estimate */
  estimatedTokens?: number;
}

/**
 * Agent spawn configuration.
 */
export interface SpawnAgentConfig {
  /** Unique agent ID */
  agentId?: string;
  /** Instructions/task for the agent */
  instructions: string;
  /** Tool names this agent is allowed to use */
  allowedTools?: string[];
  /** Tool names this agent is explicitly denied */
  deniedTools?: string[];
  /** LLM provider to use (e.g., 'openai', 'anthropic', 'google') */
  provider?: string;
  /** Model to use */
  model?: string;
  /** Maximum iterations */
  maxIterations?: number;
  /** Whether the agent can spawn sub-agents */
  canSpawnSubAgents?: boolean;
  /** Arbitrary context to pass to the agent */
  context?: Record<string, unknown>;
}

/**
 * Agent definition (active instance).
 */
export interface Agent {
  id: string;
  config: SpawnAgentConfig;
  status: AgentStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: AgentResult;
}

/**
 * Agent spawner — manages agent lifecycle.
 *
 * In production, this integrates with VIVIM's AI provider layer (server/src/ai/).
 * For now, provides the orchestration framework.
 */
export class AgentSpawner {
  private agents: Map<string, Agent> = new Map();
  private toolRegistry?: ToolRegistry;
  private llmExecutor?: AgentExecutor;

  constructor(options?: {
    toolRegistry?: ToolRegistry;
    llmExecutor?: AgentExecutor;
  }) {
    this.toolRegistry = options?.toolRegistry;
    this.llmExecutor = options?.llmExecutor;
  }

  /**
   * Set the LLM executor (the actual AI provider integration).
   */
  setLLMExecutor(executor: AgentExecutor): void {
    this.llmExecutor = executor;
  }

  /**
   * Spawn a new agent.
   */
  spawn(config: SpawnAgentConfig): Agent {
    const id = config.agentId ?? `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const agent: Agent = {
      id,
      config: {
        ...config,
        maxIterations: config.maxIterations ?? 10,
        canSpawnSubAgents: config.canSpawnSubAgents ?? false,
      },
      status: 'spawning',
      createdAt: Date.now(),
    };

    this.agents.set(id, agent);
    return agent;
  }

  /**
   * Get an agent by ID.
   */
  getAgent(id: string): Agent | null {
    return this.agents.get(id) ?? null;
  }

  /**
   * List all agents.
   */
  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Execute an agent (blocking).
   */
  async execute(agentId: string): Promise<AgentResult> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    if (!this.llmExecutor) {
      agent.status = 'failed';
      agent.completedAt = Date.now();
      const result: AgentResult = {
        agentId,
        status: 'failed',
        response: '',
        toolCalls: [],
        error: 'No LLM executor configured',
        durationMs: 0,
      };
      agent.result = result;
      return result;
    }

    // Filter tools based on allowed/denied
    const availableTools = this.getAvailableToolsForAgent(agent);

    agent.status = 'running';
    agent.startedAt = Date.now();

    const startTime = Date.now();

    try {
      const llmResult = await this.llmExecutor({
        instructions: agent.config.instructions,
        tools: availableTools,
        provider: agent.config.provider,
        model: agent.config.model,
        maxIterations: agent.config.maxIterations,
        context: agent.config.context,
        signal: undefined,
      });

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        agentId,
        status: 'completed',
        response: llmResult.response,
        toolCalls: llmResult.toolCalls ?? [],
        durationMs: duration,
        estimatedTokens: llmResult.estimatedTokens,
      };

      agent.status = 'completed';
      agent.completedAt = Date.now();
      agent.result = result;

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      const result: AgentResult = {
        agentId,
        status: 'failed',
        response: '',
        toolCalls: [],
        error: error instanceof Error ? error.message : String(error),
        durationMs: duration,
      };

      agent.status = 'failed';
      agent.completedAt = Date.now();
      agent.result = result;

      return result;
    }
  }

  /**
   * Execute an agent in the background (non-blocking).
   */
  executeBackground(agentId: string): void {
    this.execute(agentId).catch(() => {
      // Error already recorded
    });
  }

  /**
   * Stop a running agent.
   */
  stop(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    if (!['spawning', 'running'].includes(agent.status)) return false;

    agent.status = 'stopped';
    agent.completedAt = Date.now();

    return true;
  }

  /**
   * Get the tools available for an agent based on allowed/denied lists.
   */
  private getAvailableToolsForAgent(agent: Agent): string[] {
    if (!this.toolRegistry) return [];

    const allTools = this.toolRegistry.listNames();
    const allowed = agent.config.allowedTools;
    const denied = new Set(agent.config.deniedTools ?? []);

    if (allowed && allowed.length > 0) {
      // Explicit allow list — only these tools (minus denied)
      return allowed.filter(t => !denied.has(t));
    }

    // No allow list — all tools minus denied
    return allTools.filter(t => !denied.has(t));
  }

  /**
   * Delete a completed/failed/stopped agent.
   */
  delete(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    if (['spawning', 'running'].includes(agent.status)) return false;
    return this.agents.delete(agentId);
  }

  /**
   * Get agent statistics.
   */
  getStats(): {
    total: number;
    byStatus: Record<AgentStatus, number>;
    totalToolCalls: number;
    avgDurationMs: number;
  } {
    const agents = Array.from(this.agents.values());
    const byStatus: Record<AgentStatus, number> = {
      spawning: 0, running: 0, completed: 0, failed: 0, stopped: 0,
    };
    let totalToolCalls = 0;
    let totalDuration = 0;
    let completedCount = 0;

    for (const agent of agents) {
      byStatus[agent.status]++;
      if (agent.result) {
        totalToolCalls += agent.result.toolCalls.length;
        if (agent.result.durationMs) {
          totalDuration += agent.result.durationMs;
          completedCount++;
        }
      }
    }

    return {
      total: agents.length,
      byStatus,
      totalToolCalls,
      avgDurationMs: completedCount > 0 ? Math.round(totalDuration / completedCount) : 0,
    };
  }

  /**
   * Destroy all agents.
   */
  destroy(): void {
    for (const [id, agent] of this.agents.entries()) {
      if (['spawning', 'running'].includes(agent.status)) {
        this.stop(id);
      }
    }
    this.agents.clear();
  }
}

/**
 * LLM executor function — integrates with the actual AI provider.
 */
export interface AgentExecutor {
  (input: {
    instructions: string;
    tools: string[];
    provider?: string;
    model?: string;
    maxIterations?: number;
    context?: Record<string, unknown>;
    signal?: AbortSignal;
  }): Promise<{
    response: string;
    toolCalls?: Array<{
      toolName: string;
      input: unknown;
      result: ToolResult;
    }>;
    estimatedTokens?: number;
  }>;
}
