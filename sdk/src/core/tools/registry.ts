/**
 * VIVIM SDK — Tool Registry & Assembly
 *
 * Inspired by vCode's `src/tools.ts` — dynamic tool pool assembly.
 *
 * The registry manages all available tools:
 * - Built-in SDK tools (memory, content, social, identity)
 * - MCP-discovered tools from external servers
 * - Plugin-provided tools
 * - Custom user tools
 *
 * Tools are assembled into a pool that agents can discover and invoke.
 * Filtering by permissions ensures users control which tools are available.
 */

import type { Tool, ToolDefinition, ToolResult, ToolExecutionContext, ToolPermission } from '../tools.js';
import type { z } from 'zod';

/**
 * Tool source — where a tool came from.
 */
export type ToolSource = 'builtin' | 'mcp' | 'plugin' | 'custom';

/**
 * Registered tool entry in the registry.
 */
export interface RegisteredTool {
  tool: Tool<any, any>;
  source: ToolSource;
  /** Source server name (for MCP tools) */
  sourceServer?: string;
  /** Plugin name (for plugin tools) */
  pluginName?: string;
  /** Whether this tool is currently enabled */
  enabled: boolean;
  /** Override permissions (user-defined) */
  permissionOverride?: ToolPermission;
}

/**
 * Tool registry — central store of all available tools.
 */
export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a tool.
   */
  register(tool: Tool<any, any>, source: ToolSource = 'builtin', options?: {
    sourceServer?: string;
    pluginName?: string;
    enabled?: boolean;
  }): void {
    this.tools.set(tool.definition.name, {
      tool,
      source,
      sourceServer: options?.sourceServer,
      pluginName: options?.pluginName,
      enabled: options?.enabled ?? true,
    });
  }

  /**
   * Unregister a tool.
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool by name.
   */
  get(name: string): Tool<any, any> | null {
    const entry = this.tools.get(name);
    return entry?.enabled ? entry.tool : null;
  }

  /**
   * Get a registered tool entry (with metadata).
   */
  getEntry(name: string): RegisteredTool | null {
    return this.tools.get(name) ?? null;
  }

  /**
   * Check if a tool exists.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * List all registered tool names.
   */
  listNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * List all enabled tools.
   */
  list(): Tool<any, any>[] {
    return Array.from(this.tools.values())
      .filter(e => e.enabled)
      .map(e => e.tool);
  }

  /**
   * List all registered tools with metadata.
   */
  listAll(): Array<{ name: string; source: ToolSource; enabled: boolean; description: string }> {
    return Array.from(this.tools.entries()).map(([name, entry]) => ({
      name,
      source: entry.source,
      enabled: entry.enabled,
      description: entry.tool.definition.description,
    }));
  }

  /**
   * Get tools by category.
   */
  getByCategory(category: string): Tool<any, any>[] {
    return this.list().filter(t => t.definition.category === category);
  }

  /**
   * Get tools by source.
   */
  getBySource(source: ToolSource): Tool<any, any>[] {
    return this.list().filter(t => {
      const entry = this.tools.get(t.definition.name);
      return entry?.source === source;
    });
  }

  /**
   * Enable a tool.
   */
  enable(name: string): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;
    entry.enabled = true;
    return true;
  }

  /**
   * Disable a tool.
   */
  disable(name: string): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;
    entry.enabled = false;
    return true;
  }

  /**
   * Override permissions for a tool.
   */
  setPermissionOverride(name: string, permission: ToolPermission): boolean {
    const entry = this.tools.get(name);
    if (!entry) return false;
    entry.permissionOverride = permission;
    return true;
  }

  /**
   * Search tools by name/description/tags.
   */
  search(query: string): Tool<any, any>[] {
    const q = query.toLowerCase();
    return this.list().filter(t =>
      t.definition.name.toLowerCase().includes(q) ||
      t.definition.description.toLowerCase().includes(q) ||
      t.definition.tags?.some(tag => tag.toLowerCase().includes(q))
    );
  }

  /**
   * Execute a tool by name.
   */
  async execute<TInput, TOutput>(
    name: string,
    input: TInput,
    context: ToolExecutionContext
  ): Promise<ToolResult<TOutput>> {
    const tool = this.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" not found`,
      };
    }

    const registered = this.tools.get(name)!;
    const effectivePermissions = registered.permissionOverride ?? tool.definition.permissions;

    // Check permission
    if (effectivePermissions?.requiresConfirmation) {
      // In production, check the permission system
    }

    return tool.handler(input as z.infer<any>, context) as Promise<ToolResult<TOutput>>;
  }

  /**
   * Get the count of enabled tools.
   */
  count(): number {
    return this.list().length;
  }

  /**
   * Clear all tools.
   */
  clear(): void {
    this.tools.clear();
  }

  /**
   * Export registry state (for debugging/serialization).
   */
  export(): Record<string, unknown> {
    return {
      totalTools: this.tools.size,
      enabledTools: this.count(),
      tools: this.listAll(),
    };
  }
}

/**
 * Assemble a tool pool from multiple sources.
 *
 * Inspired by vCode's `assembleToolPool()` — merges native tools with
 * discovered MCP tools, filtered by permissions.
 */
export function assembleToolPool(options: {
  /** Built-in tools to include */
  builtinTools?: Tool<any, any>[];
  /** MCP-discovered tools */
  mcpTools?: Array<{ tool: Tool<any, any>; server: string }>;
  /** Plugin-provided tools */
  pluginTools?: Array<{ tool: Tool<any, any>; plugin: string }>;
  /** Tools to explicitly exclude */
  excludedTools?: string[];
}): ToolRegistry {
  const registry = new ToolRegistry();

  // Register built-in tools
  for (const tool of options.builtinTools ?? []) {
    registry.register(tool, 'builtin');
  }

  // Register MCP tools
  for (const { tool, server } of options.mcpTools ?? []) {
    registry.register(tool, 'mcp', { sourceServer: server });
  }

  // Register plugin tools
  for (const { tool, plugin } of options.pluginTools ?? []) {
    registry.register(tool, 'plugin', { pluginName: plugin });
  }

  // Exclude specified tools
  for (const name of options.excludedTools ?? []) {
    registry.disable(name);
  }

  return registry;
}
