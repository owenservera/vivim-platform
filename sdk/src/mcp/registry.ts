/**
 * VIVIM SDK - MCP Tool Registry
 * 
 * Central registry for all MCP tools exposed by the server
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from './types.js';

/**
 * Tool Registry - manages all available MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, MCPToolDefinition> = new Map();
  private handlers: Map<string, MCPToolHandler> = new Map();

  /**
   * Register a tool with the registry
   */
  register(tool: MCPToolDefinition, handler: MCPToolHandler): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);
  }

  /**
   * Get all registered tools
   */
  listTools(): MCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool definition
   */
  getTool(name: string): MCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Execute a tool by name
   */
  async executeTool(
    name: string,
    params: Record<string, unknown>,
    context: MCPContext
  ): Promise<MCPResponse> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ error: `Tool not found: ${name}` }),
        }],
        isError: true,
      };
    }

    try {
      return await handler(params, context);
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        }],
        isError: true,
      };
    }
  }

  /**
   * Apply filters (allow/deny lists)
   */
  filterTools(allowed?: string[], denied?: string[]): MCPToolDefinition[] {
    let tools = this.listTools();

    if (allowed && allowed.length > 0) {
      tools = tools.filter(t => 
        allowed.some(pattern => matchPattern(t.name, pattern))
      );
    }

    if (denied && denied.length > 0) {
      tools = tools.filter(t => 
        !denied.some(pattern => matchPattern(t.name, pattern))
      );
    }

    return tools;
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.handlers.clear();
  }
}

/**
 * Simple glob-like pattern matching
 */
function matchPattern(name: string, pattern: string): boolean {
  // Exact match
  if (name === pattern) return true;

  // Wildcard patterns
  if (pattern === '*') return true;
  if (pattern.endsWith('*')) {
    const prefix = pattern.slice(0, -1);
    return name.startsWith(prefix);
  }
  if (pattern.startsWith('*')) {
    const suffix = pattern.slice(1);
    return name.endsWith(suffix);
  }

  return false;
}

/**
 * Global tool registry instance
 */
export const globalToolRegistry = new ToolRegistry();
