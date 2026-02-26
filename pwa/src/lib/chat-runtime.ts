import { useChat } from 'ai/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { getInitializedChainClient } from './chain-client';
import { toolRegistry } from './tool-registry';
import { EventType } from '@vivim/network-engine';
import { useEffect, useMemo } from 'react';

export function useVivimChatRuntime(conversationId: string | null) {
  const chat = useChat({
    api: '/api/ai/chat', // Default for streaming, but we might want to intercept it
    initialMessages: [],
    // Intercept finish to save to chain
    onFinish: async (message) => {
      if (conversationId) {
        const chain = getInitializedChainClient();
        await chain.createEntity(EventType.MESSAGE_CREATE as any, {
          conversationId,
          role: 'assistant',
          content: message.content,
          createdAt: Date.now()
        });
      }
    }
  });

  const runtime = useChatRuntime(chat);

  // Load history from chain when conversationId changes
  useEffect(() => {
    if (conversationId) {
      const loadHistory = async () => {
        const chain = getInitializedChainClient();
        const events = await chain.getEventStore().queryEvents({
          entityIds: [conversationId],
          types: [EventType.MESSAGE_CREATE]
        });
        
        const history = events.map(e => ({
          id: e.id,
          role: e.payload.role,
          content: e.payload.content,
          createdAt: new Date(parseInt(e.timestamp.split(':')[0], 10))
        }));

        chat.setMessages(history as any);
      };
      loadHistory();
    }
  }, [conversationId]);

  return runtime;
}
