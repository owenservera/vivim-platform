/**
 * VIVIM SDK - Memory Skill
 * 
 * Skill for long-term memory management
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
 * Remember - Store important information
 */
const rememberCapability: SkillCapability = {
  type: 'tool',
  name: 'remember',
  description: 'Store important information in long-term memory',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Information to remember',
      },
      type: {
        type: 'string',
        enum: ['fact', 'concept', 'procedure', 'error', 'semantic'],
        default: 'fact',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization',
        default: [],
      },
      importance: {
        type: 'number',
        minimum: 1,
        maximum: 10,
        default: 5,
        description: 'Importance level (1-10)',
      },
    },
    required: ['content'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const getMemoryType = (type: string): any => {
        switch (type) {
          case 'fact': return 'factual';
          case 'concept': return 'semantic';
          case 'procedure': return 'procedural';
          case 'error': return 'analytical';
          case 'semantic': return 'semantic';
          default: return 'factual';
        }
      };

      const memory = await memoryNode.create({
        content: params.content as string,
        memoryType: getMemoryType((params.type as string) || 'fact'),
        category: 'general',
        tags: (params.tags as string[]) || [],
      });

      return {
        success: true,
        data: {
          memoryId: memory.id,
          type: memory.memoryType,
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
 * Recall - Search and retrieve memories
 */
const recallCapability: SkillCapability = {
  type: 'tool',
  name: 'recall',
  description: 'Search and retrieve memories',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      type: {
        type: 'string',
        enum: ['fact', 'concept', 'procedure', 'error', 'semantic'],
      },
      limit: {
        type: 'number',
        default: 10,
        description: 'Maximum results',
      },
    },
    required: ['query'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const getMemoryType = (type: string): any => {
        switch (type) {
          case 'fact': return 'factual';
          case 'concept': return 'semantic';
          case 'procedure': return 'procedural';
          case 'error': return 'analytical';
          case 'semantic': return 'semantic';
          default: return undefined;
        }
      };

      const results = await memoryNode.search({
        text: params.query as string,
        types: params.type ? [getMemoryType(params.type as string)].filter(Boolean) : undefined,
        limit: (params.limit as number) || 10,
      });

      return {
        success: true,
        data: {
          count: results.length,
          memories: results.map(m => ({
            id: m.id,
            content: m.content,
            type: m.memoryType,
            tags: m.tags,
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
 * Remember Error - Store error and solution
 */
const rememberErrorCapability: SkillCapability = {
  type: 'tool',
  name: 'remember_error',
  description: 'Store an error and its solution for future reference',
  inputSchema: {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'Error message or description',
      },
      solution: {
        type: 'string',
        description: 'Solution or fix',
      },
      context: {
        type: 'string',
        description: 'Additional context about where the error occurred',
      },
    },
    required: ['error', 'solution'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const content = `[ERROR] ${params.error}\n[SOLUTION] ${params.solution}\n[CONTEXT] ${params.context || 'N/A'}`;
      
      const memory = await memoryNode.create({
        content,
        memoryType: 'semantic',
        category: 'error',
        tags: ['bugfix', 'error', 'fix'],
      });

      return {
        success: true,
        data: {
          memoryId: memory.id,
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
 * Remember Code - Store code-related information
 */
const rememberCodeCapability: SkillCapability = {
  type: 'tool',
  name: 'remember_code',
  description: 'Remember code patterns, implementations, or snippets',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Code pattern or function name',
      },
      context: {
        type: 'string',
        description: 'Implementation context or explanation',
      },
      language: {
        type: 'string',
        description: 'Programming language',
      },
    },
    required: ['pattern', 'context'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const content = `[CODE] ${params.pattern}\n[LANGUAGE] ${params.language || 'unknown'}\n[CONTEXT] ${params.context}`;
      
      const memory = await memoryNode.create({
        content,
        memoryType: 'procedural',
        category: 'code',
        tags: ['code', 'pattern', params.language as string || 'programming'].filter(Boolean),
      });

      return {
        success: true,
        data: {
          memoryId: memory.id,
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
 * Memory skill definition
 */
export const memorySkill: SkillDefinition = {
  id: '@vivim/skill-memory',
  name: 'VIVIM Memory',
  version: '1.0.0',
  description: 'Long-term memory management for AI agents',
  author: 'VIVIM Team',
  license: 'MIT',
  tags: ['memory', 'ai', 'agent', 'storage'],
  capabilities: [
    rememberCapability,
    recallCapability,
    rememberErrorCapability,
    rememberCodeCapability,
  ],
};

/**
 * Create memory skill loader
 */
export function createMemorySkillLoader(): SkillLoader {
  return async (sdk: VivimSDK): Promise<SkillDefinition> => {
    return memorySkill;
  };
}
