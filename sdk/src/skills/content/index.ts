/**
 * VIVIM SDK - Content Skill
 * 
 * Skill for content creation and management
 */

import type { 
  SkillDefinition, 
  SkillCapability, 
  SkillContext, 
  SkillCapabilityResult,
  SkillLoader 
} from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * Post - Create a new post
 */
const postCapability: SkillCapability = {
  type: 'tool',
  name: 'post',
  description: 'Create a new post on the VIVIM network',
  inputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Post content text',
      },
      visibility: {
        type: 'string',
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
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const contentNode = await context.sdk.getContentNode();
      
      const content = await contentNode.create(
        'post',
        { text: params.text as string },
        {
          visibility: (params.visibility as 'public' | 'circle' | 'friends' | 'private') || 'public',
          circleId: params.circleId as string | undefined,
        }
      );

      return {
        success: true,
        data: {
          contentId: content.id,
          visibility: content.visibility,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Feed - Get content feed
 */
const feedCapability: SkillCapability = {
  type: 'tool',
  name: 'feed',
  description: 'Get the content feed',
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['following', 'popular', 'recent'],
        default: 'recent',
      },
      limit: {
        type: 'number',
        default: 20,
      },
    },
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const contentNode = await context.sdk.getContentNode();
      
      const feed = await contentNode.getFeed({
        type: (params.type as 'following' | 'popular' | 'recent') || 'recent',
        limit: (params.limit as number) || 20,
      });

      return {
        success: true,
        data: {
          count: feed.length,
          posts: feed.map(p => ({
            id: p.id,
            authorId: p.authorId,
            content: p.content,
            createdAt: p.createdAt,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Search - Search content
 */
const searchCapability: SkillCapability = {
  type: 'tool',
  name: 'search',
  description: 'Search for content on the network',
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
      limit: {
        type: 'number',
        default: 20,
      },
    },
    required: ['query'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const contentNode = await context.sdk.getContentNode();
      
      const results = await contentNode.search({
        text: params.query as string,
        author: params.author as string | undefined,
      });

      return {
        success: true,
        data: {
          count: results.length,
          posts: results.slice(0, (params.limit as number) || 20).map(p => ({
            id: p.id,
            authorId: p.authorId,
            content: p.content,
            createdAt: p.createdAt,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

/**
 * Content skill definition
 */
export const contentSkill: SkillDefinition = {
  id: '@vivim/skill-content',
  name: 'VIVIM Content',
  version: '1.0.0',
  description: 'Create and manage content on the VIVIM network',
  author: 'VIVIM Team',
  license: 'MIT',
  tags: ['content', 'social', 'posts', 'network'],
  capabilities: [
    postCapability,
    feedCapability,
    searchCapability,
  ],
};

/**
 * Create content skill loader
 */
export function createContentSkillLoader(): SkillLoader {
  return async (sdk: VivimSDK): Promise<SkillDefinition> => {
    return contentSkill;
  };
}
