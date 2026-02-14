// apps/server/src/ai/tools/social-tools.js
// ═══════════════════════════════════════════════════════════════════════════
// SOCIAL AI TOOLS - Feed, Sharing, and Collaboration Tools
// ═══════════════════════════════════════════════════════════════════════════

import { tool } from 'ai';
import { z } from 'zod';
import { getPrismaClient } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';

const prisma = getPrismaClient();

/**
 * Share an insight to the social feed
 */
export const shareToFeed = tool({
  description: 'Share a valuable insight, summary, or knowledge piece to the user\'s social feed. Use this when conversation produces content worth sharing with others.',
  parameters: z.object({
    title: z.string().min(5).max(100).describe('Title for the shared post'),
    content: z.string().min(10).max(5000).describe('The content to share'),
    contentType: z.enum(['insight', 'summary', 'tutorial', 'question', 'discussion']).describe('Type of content being shared'),
    tags: z.array(z.string()).max(5).default([]).describe('Tags for discoverability'),
    visibility: z.enum(['public', 'followers', 'private']).default('public').describe('Who can see this post'),
  }),
  execute: async ({ title, content, contentType, tags, visibility }, { userId }) => {
    const log = logger.child({ tool: 'shareToFeed', userId });

    try {
      const post = await prisma.post.create({
        data: {
          authorId: userId,
          title,
          message: content,
          type: contentType,
          linkUrl: null,
          visibility,
          metadata: {
            tags,
            aiGenerated: true,
            sharedFromConversation: true,
          },
        },
      });

      log.info({ postId: post.id, contentType }, 'Content shared to feed');
      return {
        success: true,
        postId: post.id,
        message: `Successfully shared "${title}" to your ${visibility} feed.`,
        url: `/feed/${post.id}`,
      };
    } catch (error) {
      log.error({ error: error.message }, 'Share to feed failed');
      return { success: false, error: error.message };
    }
  },
});

/**
 * Search the social feed
 */
export const searchFeed = tool({
  description: 'Search the social feed for posts related to a topic. Use this to find what others have shared about a subject.',
  parameters: z.object({
    query: z.string().describe('Search query for the feed'),
    limit: z.number().min(1).max(20).default(5).describe('Maximum posts to return'),
  }),
  execute: async ({ query, limit }) => {
    try {
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { message: { contains: query, mode: 'insensitive' } },
          ],
          visibility: 'public',
        },
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          authorId: true,
          createdAt: true,
          metadata: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return {
        query,
        resultCount: posts.length,
        posts: posts.map(p => ({
          id: p.id,
          title: p.title,
          preview: p.message?.substring(0, 200),
          type: p.type,
          author: p.authorId,
          createdAt: p.createdAt,
        })),
      };
    } catch (error) {
      return { query, resultCount: 0, posts: [], error: error.message };
    }
  },
});

/**
 * Build social tools with user context
 */
export function buildSocialTools(userId) {
  const toolContext = { userId };

  const wrapTool = (toolDef) => ({
    ...toolDef,
    execute: async (args) => toolDef.execute(args, toolContext),
  });

  return {
    shareToFeed: wrapTool(shareToFeed),
    searchFeed: wrapTool(searchFeed),
  };
}
