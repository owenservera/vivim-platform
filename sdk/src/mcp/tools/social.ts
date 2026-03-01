/**
 * VIVIM SDK - Social Tools
 * 
 * MCP tools for social interactions
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Follow user tool
 */
export const socialFollowTool: MCPToolDefinition = {
  name: 'social_follow',
  description: 'Follow a user by their DID',
  inputSchema: {
    type: 'object',
    properties: {
      did: {
        type: 'string',
        description: 'DID of the user to follow',
      },
    },
    required: ['did'],
  },
};

/**
 * Social follow handler
 */
export const socialFollowHandler: MCPToolHandler = async (
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
    const socialNode = await sdk.getSocialNode();
    await socialNode.follow(params.did as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Now following ${params.did}`,
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
 * Unfollow user tool
 */
export const socialUnfollowTool: MCPToolDefinition = {
  name: 'social_unfollow',
  description: 'Unfollow a user',
  inputSchema: {
    type: 'object',
    properties: {
      did: {
        type: 'string',
        description: 'DID of the user to unfollow',
      },
    },
    required: ['did'],
  },
};

/**
 * Social unfollow handler
 */
export const socialUnfollowHandler: MCPToolHandler = async (
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
    const socialNode = await sdk.getSocialNode();
    await socialNode.unfollow(params.did as string);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Unfollowed ${params.did}`,
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
 * List circles tool
 */
export const socialCirclesTool: MCPToolDefinition = {
  name: 'social_circles',
  description: 'List all circles',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * Social circles handler
 */
export const socialCirclesHandler: MCPToolHandler = async (
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
    const socialNode = await sdk.getSocialNode();
    const circles = await socialNode.getUserCircles();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: circles.length,
          circles: circles.map(c => ({
            id: c.id,
            name: c.name,
            isPublic: c.isPublic,
            memberCount: c.memberCount,
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
 * Create circle tool
 */
export const socialCircleCreateTool: MCPToolDefinition = {
  name: 'social_circle_create',
  description: 'Create a new circle',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Circle name',
      },
      isPublic: {
        type: 'boolean',
        description: 'Whether the circle is public',
        default: false,
      },
      description: {
        type: 'string',
        description: 'Circle description',
      },
    },
    required: ['name'],
  },
};

/**
 * Social circle create handler
 */
export const socialCircleCreateHandler: MCPToolHandler = async (
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
    const socialNode = await sdk.getSocialNode();
    const circle = await socialNode.createCircle(params.name as string, {
      isPublic: params.isPublic as boolean || false,
      description: params.description as string | undefined,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: circle.id,
          name: circle.name,
          isPublic: circle.isPublic,
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
 * Get friends tool
 */
export const socialFriendsTool: MCPToolDefinition = {
  name: 'social_friends',
  description: 'List friends/followers',
  inputSchema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter by status',
        enum: ['following', 'followers', 'friends'],
        default: 'friends',
      },
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
 * Social friends handler
 */
export const socialFriendsHandler: MCPToolHandler = async (
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
    const socialNode = await sdk.getSocialNode();
    const limit = (params.limit as number) || 50;
    
    // Get friends based on status
    let friends;
    const status = (params.status as 'following' | 'followers' | 'friends') || 'friends';
    
    if (status === 'following') {
      friends = await socialNode.getFollowing(limit);
    } else if (status === 'followers') {
      friends = await socialNode.getFollowers(limit);
    } else {
      // Friends - get both and intersect
      const following = await socialNode.getFollowing(limit);
      const followers = await socialNode.getFollowers(limit);
      const followingIds = new Set(following.map(f => f.did));
      friends = followers.filter(f => followingIds.has(f.did));
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: friends.length,
          friends: friends.map(f => ({
            did: f.did,
            displayName: f.displayName,
            status: f.status,
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
 * Register all social tools
 */
export function registerSocialTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(socialFollowTool, socialFollowHandler);
  registry.register(socialUnfollowTool, socialUnfollowHandler);
  registry.register(socialCirclesTool, socialCirclesHandler);
  registry.register(socialCircleCreateTool, socialCircleCreateHandler);
  registry.register(socialFriendsTool, socialFriendsHandler);
}
