/**
 * VIVIM SDK - Research Skill
 * 
 * Skill for research and knowledge management
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
 * Save Finding - Save a research finding
 */
const saveFindingCapability: SkillCapability = {
  type: 'tool',
  name: 'save_finding',
  description: 'Save a research finding with topic categorization',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Research topic',
      },
      content: {
        type: 'string',
        description: 'Research content or finding',
      },
      source: {
        type: 'string',
        description: 'Source of the information',
      },
      confidence: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        default: 0.8,
        description: 'Confidence level (0-1)',
      },
    },
    required: ['topic', 'content'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const content = `[RESEARCH] ${params.topic}\n${params.content}\n[Source: ${params.source || 'Unknown'}]\n[Confidence: ${params.confidence || 0.8}]`;
      
      const memory = await memoryNode.create({
        content,
        memoryType: 'semantic',
        tags: ['research', String(params.topic).toLowerCase().replace(/\s+/g, '-')],
      });

      return {
        success: true,
        data: {
          findingId: memory.id,
          topic: params.topic,
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
 * Find Research - Search previous research
 */
const findResearchCapability: SkillCapability = {
  type: 'tool',
  name: 'find_research',
  description: 'Search previous research findings',
  inputSchema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Topic to search for',
      },
      limit: {
        type: 'number',
        default: 10,
      },
    },
    required: ['topic'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      const results = await memoryNode.search({
        text: params.topic as string,
        types: ['semantic'],
        limit: (params.limit as number) || 10,
      });

      return {
        success: true,
        data: {
          count: results.length,
          findings: results.map(m => ({
            id: m.id,
            content: m.content,
            tags: m.tags,
            createdAt: m.createdAt,
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
 * Save Concept - Save a conceptual understanding
 */
const saveConceptCapability: SkillCapability = {
  type: 'tool',
  name: 'save_concept',
  description: 'Save a conceptual understanding or explanation',
  inputSchema: {
    type: 'object',
    properties: {
      concept: {
        type: 'string',
        description: 'Concept name',
      },
      explanation: {
        type: 'string',
        description: 'Explanation of the concept',
      },
      examples: {
        type: 'array',
        items: { type: 'string' },
        description: 'Examples illustrating the concept',
      },
      relatedConcepts: {
        type: 'array',
        items: { type: 'string' },
        description: 'Related concepts',
      },
    },
    required: ['concept', 'explanation'],
  },
  handler: async (params: Record<string, unknown>, context: SkillContext): Promise<SkillCapabilityResult> => {
    try {
      const memoryNode = await context.sdk.getMemoryNode();
      
      let content = `[CONCEPT] ${params.concept}\n\n${params.explanation}`;
      
      if (params.examples && Array.isArray(params.examples)) {
        content += `\n\n[EXAMPLES]\n${(params.examples as string[]).map(e => `- ${e}`).join('\n')}`;
      }
      
      if (params.relatedConcepts && Array.isArray(params.relatedConcepts)) {
        content += `\n\n[RELATED CONCEPTS]\n${(params.relatedConcepts as string[]).join(', ')}`;
      }
      
      const memory = await memoryNode.create({
        content,
        memoryType: 'concept',
        tags: ['concept', 'knowledge', String(params.concept).toLowerCase().replace(/\s+/g, '-')],
      });

      return {
        success: true,
        data: {
          conceptId: memory.id,
          concept: params.concept,
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
 * Research skill definition
 */
export const researchSkill: SkillDefinition = {
  id: '@vivim/skill-research',
  name: 'VIVIM Research',
  version: '1.0.0',
  description: 'Research and knowledge management for AI agents',
  author: 'VIVIM Team',
  license: 'MIT',
  tags: ['research', 'knowledge', 'ai', 'learning'],
  capabilities: [
    saveFindingCapability,
    findResearchCapability,
    saveConceptCapability,
  ],
};

/**
 * Create research skill loader
 */
export function createResearchSkillLoader(): SkillLoader {
  return async (sdk: VivimSDK): Promise<SkillDefinition> => {
    return researchSkill;
  };
}
