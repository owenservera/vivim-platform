/**
 * VIVIM SDK - Content Tools
 * 
 * MCP tools for content management
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Create content tool
 */
export const contentCreateTool: MCPToolDefinition = {
  name: 'content_create',
  description: 'Create new content post',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Content text',
      },
      type: {
        type: 'string',
        description: 'Content type',
        enum: ['post', 'comment', 'article'],
        default: 'post',
      },
      visibility: {
        type: 'string',
        description: 'Visibility level',
        enum: ['public', 'circle', 'friends', 'private'],
        default: 'public',
      },
      circleId: {
        type: 'string',
        description: 'Circle ID for circle visibility',
      },
    },
    required: ['text'],
  },
};

/**
 * Content create handler
 */
export const contentCreateHandler: MCPToolHandler = async (
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
    const contentNode = await sdk.getContentNode();
    
    const content = await contentNode.create(
      (params.type as 'post' | 'comment' | 'article') || 'post',
      { text: params.text as string },
      { 
        visibility: (params.visibility as 'public' | 'circle' | 'friends' | 'private') || 'public',
        circleId: params.circleId as string | undefined,
      }
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: content.id,
          type: content.type,
          visibility: content.visibility,
          createdAt: content.createdAt,
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
 * Get content feed tool
 */
export const contentFeedTool: MCPToolDefinition = {
  name: 'content_feed',
  description: 'Get content feed',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Feed type',
        enum: ['following', 'popular', 'recent'],
        default: 'recent',
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        default: 20,
      },
    },
    required: [],
  },
};

/**
 * Content feed handler
 */
export const contentFeedHandler: MCPToolHandler = async (
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
    const contentNode = await sdk.getContentNode();
    
    const feed = await contentNode.getFeed({
      type: (params.type as 'following' | 'popular' | 'recent') || 'recent',
      limit: (params.limit as number) || 20,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: feed.length,
          posts: feed.map(p => ({
            id: p.id,
            authorId: p.authorId,
            type: p.type,
            content: p.content,
            visibility: p.visibility,
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
 * Search content tool
 */
export const contentSearchTool: MCPToolDefinition = {
  name: 'content_search',
  description: 'Search content',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      author: {
        type: 'string',
        description: 'Filter by author DID',
      },
      type: {
        type: 'string',
        description: 'Filter by content type',
        enum: ['post', 'comment', 'article'],
      },
      limit: {
        type: 'number',
        description: 'Maximum results',
        default: 20,
      },
    },
    required: ['query'],
  },
};

/**
 * Content search handler
 */
export const contentSearchHandler: MCPToolHandler = async (
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
    const contentNode = await sdk.getContentNode();
    
    const results = await contentNode.search({
      text: params.query as string,
      author: params.author as string | undefined,
      type: params.type ? [params.type as string] : undefined,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: results.length,
          posts: results.map(p => ({
            id: p.id,
            authorId: p.authorId,
            type: p.type,
            content: p.content,
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
 * Register all content tools
 */
export function registerContentTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(contentCreateTool, contentCreateHandler);
  registry.register(contentFeedTool, contentFeedHandler);
  registry.register(contentSearchTool, contentSearchHandler);
}
