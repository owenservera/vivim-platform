import { z } from 'zod';
import { getInitializedChainClient } from './chain-client';
import { getInitializedContentClient } from './content-client';
import { ContentType } from '@vivim/network-engine';

export interface RegisteredTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
  uiComponent?: string;
}

class VivimToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  register(tool: RegisteredTool) {
    this.tools.set(tool.name, tool);
  }

  getTools() {
    return Array.from(this.tools.values());
  }

  async execute(name: string, params: any) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool ${name} not found`);
    
    // Validate
    const validated = tool.parameters.parse(params);
    return await tool.execute(validated);
  }

  private registerDefaultTools() {
    this.register({
      name: 'store_content',
      description: 'Store content on the distributed network',
      parameters: z.object({
        content: z.string(),
        type: z.enum(['post', 'image', 'video', 'acu', 'memory', 'conversation']),
        visibility: z.enum(['public', 'circle', 'friends', 'private']),
        tags: z.array(z.string()).optional(),
      }),
      execute: async (params) => {
        const contentClient = getInitializedContentClient();
        const result = await contentClient.createContent({
          type: params.type as any,
          text: params.content,
          visibility: params.visibility as any,
          tags: params.tags
        });
        return {
          success: true,
          cid: result.cid,
          message: `Content stored with CID: ${result.cid}`
        };
      },
      uiComponent: 'StorageReceipt'
    });

    this.register({
      name: 'save_memory',
      description: 'Save information to distributed AI memory',
      parameters: z.object({
        content: z.string(),
        importance: z.number().min(0).max(1).optional(),
        tags: z.array(z.string()).optional(),
      }),
      execute: async (params) => {
        const chainClient = getInitializedChainClient();
        const result = await chainClient.createEntity('memory' as any, {
          content: params.content,
          importance: params.importance || 0.5,
          tags: params.tags || []
        });
        return {
          success: true,
          memoryId: result.entityId,
          message: 'Memory saved successfully'
        };
      },
      uiComponent: 'MemorySavedCard'
    });

    this.register({
      name: 'follow_user',
      description: 'Follow a user by their DID',
      parameters: z.object({
        did: z.string().describe('DID of the user to follow'),
      }),
      execute: async (params) => {
        const chainClient = getInitializedChainClient();
        await chainClient.createEntity('social:follow' as any, {
          targetDid: params.did
        });
        return {
          success: true,
          message: `Now following ${params.did}`
        };
      },
      uiComponent: 'FollowReceipt'
    });
  }
}

export const toolRegistry = new VivimToolRegistry();
