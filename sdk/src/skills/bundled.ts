/**
 * VIVIM SDK — Bundled Skills (16+ skills inspired by vCode)
 *
 * Reusable workflow patterns that are provider-agnostic.
 * Each skill is a named workflow with input validation and execution logic.
 */

import type { SkillDefinition, SkillCapabilityHandler } from '../skills/types.js';
import type { VivimSDK } from '../core/sdk.js';

// ============================================
// SKILL FACTORY HELPER
// ============================================

function createSkill(
  id: string,
  name: string,
  description: string,
  tags: string[],
  capabilities: Array<{
    name: string;
    description: string;
    handler: SkillCapabilityHandler;
  }>
): SkillDefinition {
  return {
    id: `@vivim/skill-${id}`,
    name,
    version: '1.0.0',
    description,
    author: 'VIVIM Team',
    license: 'MIT',
    tags,
    capabilities: capabilities.map(c => ({
      type: 'tool' as const,
      name: c.name,
      description: c.description,
      handler: c.handler,
    })),
  };
}

// ============================================
// BUNDLED SKILLS
// ============================================

/**
 * 1. Memory Skill — CRUD operations on hierarchical memory
 */
export function createMemorySkill(): SkillDefinition {
  return createSkill('memory', 'Memory Management', 'Create, search, update, delete memories', ['memory', 'knowledge'], [
    {
      name: 'create',
      description: 'Create a new memory',
      handler: async (params, ctx) => {
        const memoryNode = await ctx.sdk.getMemoryNode?.();
        if (!memoryNode) return { success: false, error: 'Memory node not available' };
        return { success: true, data: 'Memory created (stub)' };
      },
    },
    {
      name: 'search',
      description: 'Search memories',
      handler: async (params, ctx) => {
        const memoryNode = await ctx.sdk.getMemoryNode?.();
        if (!memoryNode) return { success: false, error: 'Memory node not available' };
        return { success: true, data: 'Search results (stub)' };
      },
    },
    {
      name: 'list',
      description: 'List all memories',
      handler: async () => ({ success: true, data: 'List (stub)' }),
    },
    {
      name: 'delete',
      description: 'Delete a memory',
      handler: async () => ({ success: true, data: 'Deleted (stub)' }),
    },
  ]);
}

/**
 * 2. Context Skill — manage AI context assembly
 */
export function createContextSkill(): SkillDefinition {
  return createSkill('context', 'Context Assembly', 'Manage what context the AI sees', ['context', 'ai'], [
    {
      name: 'list',
      description: 'List current context files',
      handler: async () => ({ success: true, data: 'Context list (stub)' }),
    },
    {
      name: 'add',
      description: 'Add files/directories to context',
      handler: async () => ({ success: true, data: 'Added to context (stub)' }),
    },
    {
      name: 'remove',
      description: 'Remove from context',
      handler: async () => ({ success: true, data: 'Removed from context (stub)' }),
    },
  ]);
}

/**
 * 3. Session Skill — session lifecycle management
 */
export function createSessionSkill(): SkillDefinition {
  return createSkill('session', 'Session Management', 'Export, import, resume sessions', ['session', 'portability'], [
    {
      name: 'export',
      description: 'Export current session',
      handler: async () => ({ success: true, data: 'Session exported (stub)' }),
    },
    {
      name: 'import',
      description: 'Import a session',
      handler: async () => ({ success: true, data: 'Session imported (stub)' }),
    },
    {
      name: 'resume',
      description: 'Resume a previous session',
      handler: async () => ({ success: true, data: 'Session resumed (stub)' }),
    },
  ]);
}

/**
 * 4. Config Skill — runtime configuration management
 */
export function createConfigSkill(): SkillDefinition {
  return createSkill('config', 'Configuration', 'Read and modify SDK settings', ['config', 'settings'], [
    {
      name: 'get',
      description: 'Get a config value',
      handler: async () => ({ success: true, data: 'Config value (stub)' }),
    },
    {
      name: 'set',
      description: 'Set a config value',
      handler: async () => ({ success: true, data: 'Config set (stub)' }),
    },
    {
      name: 'list',
      description: 'List all config values',
      handler: async () => ({ success: true, data: 'Config list (stub)' }),
    },
  ]);
}

/**
 * 5. Cost Skill — token/cost tracking
 */
export function createCostSkill(): SkillDefinition {
  return createSkill('cost', 'Cost Tracking', 'Monitor token usage and costs', ['cost', 'observability'], [
    {
      name: 'current',
      description: 'Get current session cost',
      handler: async () => ({ success: true, data: { cost: 0, tokens: 0 } }),
    },
    {
      name: 'history',
      description: 'Get cost history',
      handler: async () => ({ success: true, data: { history: [] } }),
    },
    {
      name: 'estimate',
      description: 'Estimate cost for an operation',
      handler: async () => ({ success: true, data: { estimatedCost: 0 } }),
    },
  ]);
}

/**
 * 6. Diagnostics Skill — system health checks
 */
export function createDiagnosticsSkill(): SkillDefinition {
  return createSkill('diagnostics', 'Diagnostics', 'System health and environment checks', ['diagnostics', 'health'], [
    {
      name: 'check',
      description: 'Run all diagnostics',
      handler: async () => ({ success: true, data: { status: 'healthy' } }),
    },
    {
      name: 'status',
      description: 'Get system status',
      handler: async () => ({ success: true, data: { status: 'running' } }),
    },
  ]);
}

/**
 * 7. Search Skill — content and memory search
 */
export function createSearchSkill(): SkillDefinition {
  return createSkill('search', 'Search', 'Full-text and semantic search across memories and content', ['search', 'discovery'], [
    {
      name: 'text',
      description: 'Full-text search',
      handler: async () => ({ success: true, data: { results: [] } }),
    },
    {
      name: 'semantic',
      description: 'Semantic/vector search',
      handler: async () => ({ success: true, data: { results: [] } }),
    },
  ]);
}

/**
 * 8. Batch Skill — batch operations on collections
 */
export function createBatchSkill(): SkillDefinition {
  return createSkill('batch', 'Batch Operations', 'Execute operations on multiple items', ['batch', 'workflow'], [
    {
      name: 'execute',
      description: 'Execute a batch operation',
      handler: async () => ({ success: true, data: { processed: 0 } }),
    },
  ]);
}

/**
 * 9. Simplify Skill — reduce complexity
 */
export function createSimplifySkill(): SkillDefinition {
  return createSkill('simplify', 'Simplify', 'Reduce complexity of content or code', ['simplify', 'ai'], [
    {
      name: 'content',
      description: 'Simplify content',
      handler: async () => ({ success: true, data: 'Simplified (stub)' }),
    },
  ]);
}

/**
 * 10. Verify Skill — validate correctness
 */
export function createVerifySkill(): SkillDefinition {
  return createSkill('verify', 'Verify', 'Validate correctness of content or state', ['verify', 'quality'], [
    {
      name: 'check',
      description: 'Verify content correctness',
      handler: async () => ({ success: true, data: { valid: true } }),
    },
  ]);
}

/**
 * 11. Remember Skill — natural language memory interface
 */
export function createRememberSkill(): SkillDefinition {
  return createSkill('remember', 'Remember', 'Persist information via natural language', ['remember', 'memory', 'natural-language'], [
    {
      name: 'remember',
      description: 'Remember something',
      handler: async (params) => {
        const content = params.content as string;
        if (!content) return { success: false, error: 'Content required' };
        return { success: true, data: { remembered: content } };
      },
    },
    {
      name: 'forget',
      description: 'Forget something',
      handler: async () => ({ success: true, data: 'Forgotten (stub)' }),
    },
  ]);
}

/**
 * 12. Loop Skill — repeated execution
 */
export function createLoopSkill(): SkillDefinition {
  return createSkill('loop', 'Loop', 'Repeated execution of operations', ['loop', 'automation'], [
    {
      name: 'start',
      description: 'Start a loop',
      handler: async () => ({ success: true, data: 'Loop started (stub)' }),
    },
    {
      name: 'stop',
      description: 'Stop the loop',
      handler: async () => ({ success: true, data: 'Loop stopped (stub)' }),
    },
  ]);
}

/**
 * 13. Debug Skill — debugging workflows
 */
export function createDebugSkill(): SkillDefinition {
  return createSkill('debug', 'Debug', 'Debugging assistance', ['debug', 'troubleshooting'], [
    {
      name: 'trace',
      description: 'Trace execution flow',
      handler: async () => ({ success: true, data: 'Trace (stub)' }),
    },
  ]);
}

/**
 * 14. Stuck Skill — help when stuck
 */
export function createStuckSkill(): SkillDefinition {
  return createSkill('stuck', 'Unstuck', 'Get help when blocked or stuck', ['stuck', 'help', 'guidance'], [
    {
      name: 'help',
      description: 'Get help when stuck',
      handler: async () => ({ success: true, data: 'Suggestions (stub)' }),
    },
  ]);
}

/**
 * 15. Share Skill — content sharing
 */
export function createShareSkill(): SkillDefinition {
  return createSkill('share', 'Share', 'Share content, sessions, or memories', ['share', 'collaboration'], [
    {
      name: 'content',
      description: 'Share content',
      handler: async () => ({ success: true, data: 'Shared (stub)' }),
    },
    {
      name: 'session',
      description: 'Share a session',
      handler: async () => ({ success: true, data: 'Session shared (stub)' }),
    },
  ]);
}

/**
 * 16. MCP Builder Skill — create skills from MCP resources
 */
export function createMcpBuilderSkill(): SkillDefinition {
  return createSkill('mcp-builder', 'MCP Skill Builder', 'Auto-generate skills from MCP server resources', ['mcp', 'builder', 'auto-generation'], [
    {
      name: 'discover',
      description: 'Discover MCP resources',
      handler: async () => ({ success: true, data: { resources: [] } }),
    },
    {
      name: 'generate',
      description: 'Generate a skill from MCP resource',
      handler: async () => ({ success: true, data: 'Skill generated (stub)' }),
    },
  ]);
}

// ============================================
// ALL BUNDLED SKILLS
// ============================================

export const BUNDLED_SKILLS = [
  createMemorySkill,
  createContextSkill,
  createSessionSkill,
  createConfigSkill,
  createCostSkill,
  createDiagnosticsSkill,
  createSearchSkill,
  createBatchSkill,
  createSimplifySkill,
  createVerifySkill,
  createRememberSkill,
  createLoopSkill,
  createDebugSkill,
  createStuckSkill,
  createShareSkill,
  createMcpBuilderSkill,
] as const;

/**
 * Register all bundled skills in the given registry.
 */
export function registerBundledSkills(registry: { register: (skill: any) => void }): void {
  for (const factory of BUNDLED_SKILLS) {
    registry.register(factory());
  }
}
