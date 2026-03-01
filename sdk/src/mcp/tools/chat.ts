/**
 * VIVIM SDK - Chat Tools
 * 
 * MCP tools for AI chat interactions
 */

import type { MCPToolDefinition, MCPToolHandler, MCPContext, MCPResponse } from '../types.js';
import type { VivimSDK } from '../../core/sdk.js';

/**
 * New conversation tool
 */
export const chatNewTool: MCPToolDefinition = {
  name: 'chat_new',
  description: 'Start a new conversation',
  inputSchema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Conversation title',
        default: 'New Conversation',
      },
      model: {
        type: 'string',
        description: 'AI model to use',
        default: 'gpt-4',
      },
    },
    required: [],
  },
};

/**
 * Chat new handler
 */
export const chatNewHandler: MCPToolHandler = async (
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
    const chatNode = await sdk.getAIChatNode();
    const conversation = await chatNode.createConversation({
      title: (params.title as string) || 'New Conversation',
      model: (params.model as string) || 'gpt-4',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: conversation.id,
          title: conversation.title,
          model: conversation.model,
          createdAt: conversation.createdAt,
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
 * List conversations tool
 */
export const chatListTool: MCPToolDefinition = {
  name: 'chat_list',
  description: 'List conversations',
  inputSchema: {
    type: 'object',
    properties: {
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
 * Chat list handler
 */
export const chatListHandler: MCPToolHandler = async (
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
    const chatNode = await sdk.getAIChatNode();
    const conversations = await chatNode.listConversations();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: conversations.length,
          conversations: conversations.slice(0, (params.limit as number) || 20).map(c => ({
            id: c.id,
            title: c.title,
            model: c.model,
            messageCount: c.messageCount,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
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
 * Send message tool
 */
export const chatSendTool: MCPToolDefinition = {
  name: 'chat_send',
  description: 'Send a message in a conversation',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'Conversation ID',
      },
      message: {
        type: 'string',
        description: 'Message to send',
      },
    },
    required: ['conversationId', 'message'],
  },
};

/**
 * Chat send handler
 */
export const chatSendHandler: MCPToolHandler = async (
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
    const chatNode = await sdk.getAIChatNode();
    const response = await chatNode.sendMessage(
      params.conversationId as string,
      params.message as string
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          response: response.content,
          role: response.role,
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
 * Get conversation tool
 */
export const chatGetTool: MCPToolDefinition = {
  name: 'chat_get',
  description: 'Get a conversation by ID',
  inputSchema: {
    type: 'object',
    properties: {
      conversationId: {
        type: 'string',
        description: 'Conversation ID',
      },
      limit: {
        type: 'number',
        description: 'Maximum messages to return',
        default: 50,
      },
    },
    required: ['conversationId'],
  },
};

/**
 * Chat get handler
 */
export const chatGetHandler: MCPToolHandler = async (
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
    const chatNode = await sdk.getAIChatNode();
    const conversation = await chatNode.getConversation(
      params.conversationId as string,
      (params.limit as number) || 50
    );

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          id: conversation.id,
          title: conversation.title,
          model: conversation.model,
          messages: conversation.messages?.map(m => ({
            role: m.role,
            content: m.content,
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
 * Register all chat tools
 */
export function registerChatTools(registry: { register: (tool: MCPToolDefinition, handler: MCPToolHandler) => void }): void {
  registry.register(chatNewTool, chatNewHandler);
  registry.register(chatListTool, chatListHandler);
  registry.register(chatSendTool, chatSendHandler);
  registry.register(chatGetTool, chatGetHandler);
}
