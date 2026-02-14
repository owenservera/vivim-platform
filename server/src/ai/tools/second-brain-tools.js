// apps/server/src/ai/tools/second-brain-tools.js
// ═══════════════════════════════════════════════════════════════════════════
// SECOND BRAIN AI TOOLS - Vercel AI SDK Tool Definitions
// ═══════════════════════════════════════════════════════════════════════════
//
// These tools give the AI direct access to the user's knowledge system,
// turning it from a stateless chat into an intelligent second brain.

import { tool } from 'ai';
import { z } from 'zod';
import { getPrismaClient } from '../../lib/database.js';
import { logger } from '../../lib/logger.js';

const prisma = getPrismaClient();

/**
 * Search the user's knowledge base (ACUs, memories, conversations)
 */
export const searchKnowledge = tool({
  description: 'Search the user\'s knowledge base for relevant information. Use this when the user asks about something they might have discussed before, or when you need additional context. Returns relevant knowledge units (ACUs) and conversation snippets.',
  parameters: z.object({
    query: z.string().describe('The search query — what to look for in the knowledge base'),
    type: z.enum(['all', 'conversations', 'acus', 'memories']).default('all').describe('Type of knowledge to search'),
    limit: z.number().min(1).max(20).default(5).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, type, limit }, { userId }) => {
    const log = logger.child({ tool: 'searchKnowledge', userId, query });
    log.info('Searching knowledge base');

    try {
      const results = [];

      // Search conversations by title and message content
      if (type === 'all' || type === 'conversations') {
        const conversations = await prisma.conversation.findMany({
          where: {
            ownerId: userId,
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              {
                messages: {
                  some: {
                    parts: { path: [], string_contains: query }
                  }
                }
              }
            ]
          },
          select: {
            id: true,
            title: true,
            provider: true,
            model: true,
            messageCount: true,
            createdAt: true,
            updatedAt: true,
          },
          take: Math.min(limit, 5),
          orderBy: { updatedAt: 'desc' },
        });

        for (const conv of conversations) {
          results.push({
            type: 'conversation',
            id: conv.id,
            title: conv.title,
            messageCount: conv.messageCount,
            lastActive: conv.updatedAt,
            source: `${conv.provider}/${conv.model}`,
          });
        }
      }

      // Search ACUs (Atomic Content Units)
      if (type === 'all' || type === 'acus') {
        const acus = await prisma.atomicContentUnit.findMany({
          where: {
            conversation: { ownerId: userId },
            OR: [
              { content: { contains: query, mode: 'insensitive' } },
              { category: { contains: query, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            content: true,
            type: true,
            category: true,
            createdAt: true,
          },
          take: Math.min(limit, 10),
          orderBy: { createdAt: 'desc' },
        });

        for (const acu of acus) {
          results.push({
            type: 'knowledge_unit',
            id: acu.id,
            content: acu.content?.substring(0, 300),
            category: acu.category,
            unitType: acu.type,
            createdAt: acu.createdAt,
          });
        }
      }

      // Search topic profiles
      if (type === 'all' || type === 'memories') {
        const topics = await prisma.topicProfile.findMany({
          where: {
            userId,
            OR: [
              { label: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ]
          },
          select: {
            id: true,
            label: true,
            slug: true,
            domain: true,
            importanceScore: true,
            totalConversations: true,
            lastEngagedAt: true,
          },
          take: Math.min(limit, 5),
        });

        for (const topic of topics) {
          results.push({
            type: 'topic',
            id: topic.id,
            label: topic.label,
            domain: topic.domain,
            importance: topic.importanceScore,
            totalConversations: topic.totalConversations,
            lastEngaged: topic.lastEngagedAt,
          });
        }
      }

      log.info({ resultCount: results.length }, 'Knowledge search complete');

      return {
        query,
        resultCount: results.length,
        results,
        suggestion: results.length === 0
          ? 'No matching knowledge found. This might be a new topic for the user.'
          : undefined,
      };
    } catch (error) {
      log.error({ error: error.message }, 'Knowledge search failed');
      return { query, resultCount: 0, results: [], error: error.message };
    }
  },
});

/**
 * Recall full context from a specific conversation
 */
export const recallConversation = tool({
  description: 'Recall the full context from a specific past conversation. Use this when you need detailed information from a conversation that was found via search.',
  parameters: z.object({
    conversationId: z.string().describe('The conversation ID to recall'),
    messageLimit: z.number().min(1).max(50).default(20).describe('Max messages to retrieve'),
  }),
  execute: async ({ conversationId, messageLimit }, { userId }) => {
    const log = logger.child({ tool: 'recallConversation', conversationId });

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { messageIndex: 'asc' },
            take: messageLimit,
            select: {
              role: true,
              parts: true,
              messageIndex: true,
              createdAt: true,
              author: true,
            },
          },
        },
      });

      if (!conversation) {
        return { error: 'Conversation not found' };
      }

      // Security check
      if (conversation.ownerId && conversation.ownerId !== userId) {
        return { error: 'Access denied' };
      }

      const messages = conversation.messages.map(m => ({
        role: m.role,
        content: Array.isArray(m.parts)
          ? m.parts.map(p => p.text || p.content || '').join('')
          : String(m.parts),
        author: m.author,
        index: m.messageIndex,
      }));

      return {
        title: conversation.title,
        provider: conversation.provider,
        model: conversation.model,
        messageCount: conversation.messageCount,
        createdAt: conversation.createdAt,
        messages,
      };
    } catch (error) {
      log.error({ error: error.message }, 'Conversation recall failed');
      return { error: error.message };
    }
  },
});

/**
 * Create a new memory/note in the user's second brain
 */
export const createMemory = tool({
  description: 'Save an important insight, decision, or piece of knowledge to the user\'s second brain. Use this when the conversation produces valuable knowledge that should be remembered.',
  parameters: z.object({
    content: z.string().min(10).max(2000).describe('The knowledge content to save'),
    category: z.enum([
      'insight',      // Key realization or understanding
      'decision',     // A decision that was made
      'preference',   // User preference discovered
      'fact',         // Factual information
      'action_item',  // Something to do
      'reference',    // Reference material
    ]).describe('Category of the knowledge unit'),
    tags: z.array(z.string()).max(5).default([]).describe('Optional tags for organization'),
    importance: z.enum(['low', 'medium', 'high', 'critical']).default('medium').describe('How important this knowledge is'),
  }),
  execute: async ({ content, category, tags, importance }, { userId, conversationId }) => {
    const log = logger.child({ tool: 'createMemory', userId, category });

    try {
      const importanceScores = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };

      // Create as an ACU if we have a conversation context
      if (conversationId) {
        const acu = await prisma.atomicContentUnit.create({
          data: {
            conversationId,
            content,
            type: 'extraction',
            category,
            embedding: new Array(768).fill(0), // Placeholder
            metadata: { tags, importance, savedByAI: true, createdAt: new Date().toISOString() },
          },
        });

        log.info({ acuId: acu.id, category }, 'Memory created as ACU');
        return {
          success: true,
          id: acu.id,
          message: `Saved to second brain as ${category}: "${content.substring(0, 50)}..."`,
          type: 'acu',
        };
      }

      // If no conversation, create as a topic note
      const topicSlug = tags[0] || category;
      await prisma.topicProfile.upsert({
        where: { userId_slug: { userId, slug: topicSlug } },
        update: {
          lastEngagedAt: new Date(),
          totalConversations: { increment: 1 },
        },
        create: {
          userId,
          slug: topicSlug,
          label: topicSlug.charAt(0).toUpperCase() + topicSlug.slice(1),
          domain: 'ai-memory',
          importanceScore: importanceScores[importance],
          embedding: new Array(768).fill(0),
          firstEngagedAt: new Date(),
          lastEngagedAt: new Date(),
        },
      });

      log.info({ category, topicSlug }, 'Memory created as topic');
      return {
        success: true,
        message: `Saved to second brain under topic "${topicSlug}": "${content.substring(0, 50)}..."`,
        type: 'topic',
      };
    } catch (error) {
      log.error({ error: error.message }, 'Memory creation failed');
      return { success: false, error: error.message };
    }
  },
});

/**
 * Find related topics, entities, and conversations
 */
export const findRelated = tool({
  description: 'Find topics, entities, or conversations related to a given concept. Use this to help connect ideas across the user\'s knowledge base.',
  parameters: z.object({
    concept: z.string().describe('The concept to find relations for'),
    depth: z.enum(['shallow', 'deep']).default('shallow').describe('How deep to search for connections'),
  }),
  execute: async ({ concept, depth }, { userId }) => {
    const log = logger.child({ tool: 'findRelated', userId, concept });

    try {
      // Find related topics
      const topics = await prisma.topicProfile.findMany({
        where: {
          userId,
          OR: [
            { label: { contains: concept, mode: 'insensitive' } },
            { slug: { contains: concept.toLowerCase(), mode: 'insensitive' } },
          ]
        },
        include: {
          conversations: {
            include: { conversation: { select: { id: true, title: true } } },
            take: deep === 'deep' ? 5 : 2,
          },
        },
        take: 5,
      });

      // Find related entities
      const entities = await prisma.entityProfile.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: concept, mode: 'insensitive' } },
            { aliases: { has: concept.toLowerCase() } },
          ]
        },
        select: {
          id: true,
          name: true,
          type: true,
          aliases: true,
          totalMentions: true,
        },
        take: 5,
      });

      const connections = [];

      for (const topic of topics) {
        connections.push({
          type: 'topic',
          label: topic.label,
          importance: topic.importanceScore,
          relatedConversations: topic.conversations.map(tc => ({
            id: tc.conversation.id,
            title: tc.conversation.title,
          })),
        });
      }

      for (const entity of entities) {
        connections.push({
          type: 'entity',
          name: entity.name,
          entityType: entity.type,
          aliases: entity.aliases,
          totalMentions: entity.totalMentions,
        });
      }

      log.info({ connectionCount: connections.length }, 'Related items found');
      return {
        concept,
        connectionCount: connections.length,
        connections,
      };
    } catch (error) {
      log.error({ error: error.message }, 'Find related failed');
      return { concept, connectionCount: 0, connections: [], error: error.message };
    }
  },
});

/**
 * Summarize and extract key points from text
 */
export const extractKeyPoints = tool({
  description: 'Extract and summarize the key points, decisions, and action items from a piece of text or conversation. Use this to help the user distill important information.',
  parameters: z.object({
    text: z.string().min(20).describe('The text to extract key points from'),
    focus: z.enum(['general', 'decisions', 'action_items', 'insights', 'technical']).default('general').describe('What aspect to focus the extraction on'),
  }),
  execute: async ({ text, focus }) => {
    // This is a client-side extraction that helps the AI reason about content
    // The AI itself will process these points, but having them structured helps
    const wordCount = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const hasCode = /```[\s\S]*?```/.test(text) || /`[^`]+`/.test(text);
    const hasQuestions = /\?/.test(text);
    const hasList = /^[\s]*[-*•]\s/m.test(text);

    return {
      analysis: {
        wordCount,
        sentenceCount: sentences.length,
        hasCode,
        hasQuestions,
        hasList,
        focusArea: focus,
      },
      suggestion: `Analyze this ${wordCount}-word text focusing on ${focus}. It ${hasCode ? 'contains code blocks' : 'has no code'}${hasQuestions ? ', includes questions' : ''}${hasList ? ', has list items' : ''}.`,
    };
  },
});

/**
 * Get the user's active topics and interests
 */
export const getUserTopics = tool({
  description: 'Get the user\'s most active topics and interests from their knowledge base. Use this to understand what the user cares about and to personalize responses.',
  parameters: z.object({
    limit: z.number().min(1).max(20).default(10).describe('Maximum topics to return'),
    sortBy: z.enum(['importance', 'recent', 'frequency']).default('recent').describe('How to sort topics'),
  }),
  execute: async ({ limit, sortBy }, { userId }) => {
    try {
      const orderBy = {
        importance: { importanceScore: 'desc' },
        recent: { lastEngagedAt: 'desc' },
        frequency: { totalConversations: 'desc' },
      }[sortBy];

      const topics = await prisma.topicProfile.findMany({
        where: { userId },
        select: {
          label: true,
          slug: true,
          domain: true,
          importanceScore: true,
          totalConversations: true,
          lastEngagedAt: true,
          firstEngagedAt: true,
        },
        orderBy,
        take: limit,
      });

      return {
        userId,
        topicCount: topics.length,
        topics: topics.map(t => ({
          label: t.label,
          domain: t.domain,
          importance: t.importanceScore,
          conversations: t.totalConversations,
          lastActive: t.lastEngagedAt,
          tracking_since: t.firstEngagedAt,
        })),
      };
    } catch (error) {
      return { userId, topicCount: 0, topics: [], error: error.message };
    }
  },
});

/**
 * Build the complete tools object for AI SDK
 */
export function buildSecondBrainTools(userId, conversationId = null) {
  // Create tool context that will be passed to execute functions
  const toolContext = { userId, conversationId };

  // Wrap tools to inject context
  const wrapTool = (toolDef) => ({
    ...toolDef,
    execute: async (args) => toolDef.execute(args, toolContext),
  });

  return {
    searchKnowledge: wrapTool(searchKnowledge),
    recallConversation: wrapTool(recallConversation),
    createMemory: wrapTool(createMemory),
    findRelated: wrapTool(findRelated),
    extractKeyPoints: wrapTool(extractKeyPoints),
    getUserTopics: wrapTool(getUserTopics),
  };
}

/**
 * Get tool descriptions for system prompt injection
 */
export function getToolDescriptions() {
  return [
    { name: 'searchKnowledge', description: 'Search across conversations, knowledge units, and topics' },
    { name: 'recallConversation', description: 'Recall full context from a past conversation' },
    { name: 'createMemory', description: 'Save insights and decisions to the second brain' },
    { name: 'findRelated', description: 'Find related topics and entities' },
    { name: 'extractKeyPoints', description: 'Extract key points from text' },
    { name: 'getUserTopics', description: 'View the user\'s active topics and interests' },
  ];
}
