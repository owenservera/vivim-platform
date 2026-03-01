/**
 * VIVIM SDK - Memory Tools
 * 
 * MCP tools for memory management
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Create memory tool
 */
export const memoryCreateTool: MCPToolDefinition = {
  name: 'memory_create',
  description: 'Create a new memory in VIVIM',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Memory content',
      },
      type: {
        type: 'string',
        description: 'Memory type',
        enum: ['semantic', 'episodic', 'procedural'],
        default: 'semantic',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization',
        default: [],
      },
      category: {
        type: 'string',
        description: 'Category (general, work, personal)',
        default: 'general',
      },
    },
    required: ['content'],
  },
};

/**
 * Memory create handler
 */
export const memoryCreateHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const memoryNode = await sdk.getMemoryNode();
    
    const memory = await memoryNode.create({
      content: params.content as string,
      memoryType: (params.type as 'semantic' | 'episodic' | 'procedural') || 'semantic',
      category: (params.category as string) || 'general',
      tags: (params.tags as string[]) || [],
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: memory.id,
          type: memory.memoryType,
          createdAt: memory.createdAt,
        }),
      }],
    };
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
};

/**
 * Search memory tool
 */
export const memorySearchTool: MCPToolDefinition = {
  name: 'memory_search',
  description: 'Search memories by query',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      type: {
        type: 'string',
        description: 'Filter by memory type',
        enum: ['semantic', 'episodic', 'procedural'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 10,
      },
    },
    required: ['query'],
  },
};

/**
 * Memory search handler
 */
export const memorySearchHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const memoryNode = await sdk.getMemoryNode();
    
    const results = await memoryNode.search({
      text: params.query as string,
      types: params.type ? [params.type as string] : undefined,
      limit: (params.limit as number) || 10,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: results.length,
          memories: results.map(m => ({
            id: m.id,
            content: m.content,
            type: m.memoryType,
            tags: m.tags,
            createdAt: m.createdAt,
          })),
        }),
      }],
    };
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
};

/**
 * List memories tool
 */
export const memoryListTool: MCPToolDefinition = {
  name: 'memory_list',
  description: 'List all memories with optional filtering',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Filter by memory type',
        enum: ['semantic', 'episodic', 'procedural'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results to return',
        default: 50,
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by tags',
      },
    },
    required: [],
  },
};

/**
 * Memory list handler
 */
export const memoryListHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const memoryNode = await sdk.getMemoryNode();
    
    const results = await memoryNode.search({
      types: params.type ? [params.type as string] : undefined,
      limit: (params.limit as number) || 50,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: results.length,
          memories: results.map(m => ({
            id: m.id,
            content: m.content,
            type: m.memoryType,
            tags: m.tags,
            createdAt: m.createdAt,
          })),
        }),
      }],
    };
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
};

/**
 * Get memory stats tool
 */
export const memoryStatsTool: MCPToolDefinition = {
  name: 'memory_stats',
  description: 'Get memory statistics',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Memory stats handler
 */
export const memoryStatsHandler: MCPToolHandler = async (
  params: Record<string, unknown>,
  context: MCPContext
): Promise<MCPResponse> => {
  const sdk = context.sdk as VivimSDK | undefined;
  
  if (!sdk) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ error: 'SDK not initialized' }),
      }],
      isError: true,
    };
  }

  try {
    const memoryNode = await sdk.getMemoryNode();
    
    // Try to get stats if method exists
    const stats = (memoryNode as { getStats?: () => Promise<unknown> }).getStats?.() || {
      total: 'unknown',
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(stats),
      }],
    };
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
};

/**
 * Register all memory tools
 */
export function registerMemoryTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(memoryCreateTool, memoryCreateHandler);
  registry.register(memorySearchTool, memorySearchHandler);
  registry.register(memoryListTool, memoryListHandler);
  registry.register(memoryStatsTool, memoryStatsHandler);
}
