/**
 * VIVIM SDK - Storage Tools
 * 
 * MCP tools for storage management
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Storage status tool
 */
export const storageStatusTool: MCPToolDefinition = {
  name: 'storage_status',
  description: 'Get storage status and statistics',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Storage status handler
 */
export const storageStatusHandler: MCPToolHandler = async (
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
    const storageNode = await sdk.getStorageNode();
    const status = await storageNode.getStatus();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status),
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
 * Storage pins tool
 */
export const storagePinsTool: MCPToolDefinition = {
  name: 'storage_pins',
  description: 'List pinned content',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum results',
        default: 50,
      },
    },
    required: [],
  },
};

/**
 * Storage pins handler
 */
export const storagePinsHandler: MCPToolHandler = async (
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
    const storageNode = await sdk.getStorageNode();
    const pins = await storageNode.getPins();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: pins.length,
          pins: pins.slice(0, (params.limit as number) || 50).map(p => ({
            cid: p.cid,
            name: p.name,
            size: p.size,
            status: p.status,
            createdAt: p.createdAt,
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
 * Storage pin tool
 */
export const storagePinTool: MCPToolDefinition = {
  name: 'storage_pin',
  description: 'Pin content by CID',
  inputSchema: {
    type: 'object',
    properties: {
      cid: {
        type: 'string',
        description: 'Content ID to pin',
      },
      name: {
        type: 'string',
        description: 'Name for the pinned content',
      },
    },
    required: ['cid'],
  },
};

/**
 * Storage pin handler
 */
export const storagePinHandler: MCPToolHandler = async (
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
    const storageNode = await sdk.getStorageNode();
    const result = await storageNode.pin(params.cid as string, {
      name: params.name as string | undefined,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          cid: result.cid,
          status: result.status,
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
 * Storage unpin tool
 */
export const storageUnpinTool: MCPToolDefinition = {
  name: 'storage_unpin',
  description: 'Unpin content by CID',
  inputSchema: {
    type: 'object',
    properties: {
      cid: {
        type: 'string',
        description: 'Content ID to unpin',
      },
    },
    required: ['cid'],
  },
};

/**
 * Storage unpin handler
 */
export const storageUnpinHandler: MCPToolHandler = async (
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
    const storageNode = await sdk.getStorageNode();
    await storageNode.unpin(params.cid as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Unpinned ${params.cid}`,
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
 * Register all storage tools
 */
export function registerStorageTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(storageStatusTool, storageStatusHandler);
  registry.register(storagePinsTool, storagePinsHandler);
  registry.register(storagePinTool, storagePinHandler);
  registry.register(storageUnpinTool, storageUnpinHandler);
}
