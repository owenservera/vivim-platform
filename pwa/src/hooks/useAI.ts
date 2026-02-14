/**
 * useAI Hook
 * React hook for AI completions with TanStack Query
 */

import { useCallback, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAICompletion, streamAICompletion, streamFreshChatCompletion, getAIProviders, getAIModels, startAIConversation } from '../lib/ai-api';
import { useAIStore } from '../lib/ai-store';
import type {
  AIProviderType,
  AIMessage,
  AICompletionRequest,
  AICompletionResponse,
} from '../types/ai';

// Query keys for AI-related queries
export const aiQueryKeys = {
  providers: ['ai', 'providers'] as const,
  models: ['ai', 'models'] as const,
};

/**
 * Fetch available AI providers
 */
export function useAIProviders() {
  return useQuery({
    queryKey: aiQueryKeys.providers,
    queryFn: getAIProviders,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetch available AI models per provider
 */
export function useAIModels() {
  return useQuery({
    queryKey: aiQueryKeys.models,
    queryFn: getAIModels,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * AI Completion State
 */
interface UseAICompletionState {
  isLoading: boolean;
  error: string | null;
  response: AICompletionResponse | null;
}

/**
 * AI Completion Hook (non-streaming)
 */
export function useAICompletion() {
  const [state, setState] = useState<UseAICompletionState>({
    isLoading: false,
    error: null,
    response: null,
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const { defaultProvider, defaultModel, maxTokens, temperature } = useAIStore();

  const complete = useCallback(
    async (messages: AIMessage[], options?: { provider?: AIProviderType; model?: string; maxTokens?: number; temperature?: number }): Promise<AICompletionResponse> => {
      setState({ isLoading: true, error: null, response: null });
      
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const request: AICompletionRequest = {
          messages,
          provider: options?.provider || defaultProvider,
          model: options?.model || defaultModel,
          options: {
            maxTokens: options?.maxTokens || maxTokens,
            temperature: options?.temperature || temperature,
            stream: false,
          },
        };

        const response = await getAICompletion(request, controller.signal);
        setState({ isLoading: false, error: null, response });
        return response;
      } catch (error) {
        if ((error as any).name === 'AbortError') {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({ isLoading: false, error: errorMessage, response: null });
        throw error;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [defaultProvider, defaultModel, maxTokens, temperature]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    ...state,
    complete,
    abort,
  };
}

/**
 * AI Streaming Hook
 */
export function useAIStream() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const { defaultProvider, defaultModel, maxTokens, temperature, enableStreaming } = useAIStore();

  const stream = useCallback(
    async (
      messages: AIMessage[],
      onChunk: (content: string) => void,
      options?: { provider?: AIProviderType; model?: string }
    ): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setContent('');

      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const request: AICompletionRequest = {
          messages,
          provider: options?.provider || defaultProvider,
          model: options?.model || defaultModel,
          options: {
            maxTokens,
            temperature,
            stream: true,
          },
        };

        await streamAICompletion(request, ({ content: chunk, done }) => {
          if (!done && chunk) {
            setContent((prev) => prev + chunk);
            onChunk(chunk);
          }
        }, controller.signal);

        setIsLoading(false);
      } catch (err) {
        if ((err as any).name === 'AbortError') {
          setIsLoading(false);
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [defaultProvider, defaultModel, maxTokens, temperature]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isLoading,
    error,
    content,
    stream,
    abort,
    enableStreaming,
    reset: () => {
      setContent('');
      setError(null);
      setIsLoading(false);
    },
  };
}

/**
 * AI Chat Hook - Combines completion and streaming
 */
export function useAIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const completion = useAICompletion();
  const streaming = useAIStream();

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: 'user', content }]);
  }, []);

  const sendMessage = useCallback(
    async (content: string, options?: { provider?: AIProviderType; model?: string; stream?: boolean }): Promise<string | void> => {
      const newMessage: AIMessage = { role: 'user', content };
      const currentMessages = [...messages, newMessage];
      setMessages(currentMessages);

      setIsLoading(true);
      setError(null);

      const shouldStream = options?.stream ?? streaming.enableStreaming;
      let currentId = conversationId;

      try {
        // Initialize conversation on server if not already done
        if (!currentId) {
          const conversation = await startAIConversation({
            provider: options?.provider || useAIStore.getState().defaultProvider,
            model: options?.model || useAIStore.getState().defaultModel,
            title: content.slice(0, 40) + (content.length > 40 ? '...' : ''),
          });
          currentId = conversation.id;
          setConversationId(currentId);
        }

        if (shouldStream) {
          let fullResponse = '';
          await streaming.stream(
            currentMessages,
            (chunk) => {
              fullResponse += chunk;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, content: fullResponse }];
                }
                return [...prev, { role: 'assistant', content: fullResponse }];
              });
            },
            { ...options, conversationId: currentId } as any
          );
          setIsLoading(false);
          return fullResponse;
        } else {
          const response = await completion.complete(currentMessages, { 
            ...options, 
            conversationId: currentId 
          } as any);
          setMessages((prev) => [...prev, { role: 'assistant', content: response.content }]);
          setIsLoading(false);
          return response.content;
        }
      } catch (err) {
        if ((err as any).name === 'AbortError') {
          setIsLoading(false);
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    [messages, conversationId, completion, streaming, streaming.enableStreaming]
  );

  const stop = useCallback(() => {
    completion.abort();
    streaming.abort();
    setIsLoading(false);
  }, [completion, streaming]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setConversationId(null);
    streaming.reset();
  }, [streaming]);

  const setProvider = useCallback((provider: AIProviderType) => {
    useAIStore.getState().setDefaultProvider(provider);
  }, []);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    addUserMessage,
    sendMessage,
    stop,
    clearMessages,
    setProvider,
    setMessages,
  };
}

/**
 * AI Settings Hook
 * For accessing AI store in components
 */
export function useAISettings() {
  const store = useAIStore();

  return {
    defaultProvider: store.defaultProvider,
    defaultModel: store.defaultModel,
    preferredProviders: store.preferredProviders,
    maxTokens: store.maxTokens,
    temperature: store.temperature,
    enableStreaming: store.enableStreaming,
    apiKeys: store.apiKeys,
    setDefaultProvider: store.setDefaultProvider,
    setDefaultModel: store.setDefaultModel,
    setPreferredProviders: store.setPreferredProviders,
    setMaxTokens: store.setMaxTokens,
    setTemperature: store.setTemperature,
    setEnableStreaming: store.setEnableStreaming,
    setApiKey: store.setApiKey,
    reset: store.reset,
  };
}

/**
 * Fresh Chat Hook - Simple AI chat without context/DB
 * For new conversations that don't need prior context
 */
export function useFreshChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string): Promise<string> => {
    const newMessage = { role: 'user', content };
    setMessages((prev) => [...prev, newMessage]);
    setIsLoading(true);
    setError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let fullResponse = '';
      
      await streamFreshChatCompletion(
        content,
        ({ content: chunk, done }) => {
          if (!done && chunk) {
            fullResponse += chunk;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last.role === 'assistant') {
                return [...prev.slice(0, -1), { role: 'assistant', content: fullResponse }];
              }
              return [...prev, { role: 'assistant', content: fullResponse }];
            });
          }
          if (done) {
            setIsLoading(false);
          }
        },
        controller.signal
      );

      return fullResponse;
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        setIsLoading(false);
        return '';
      }
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stop,
    clearMessages,
  };
}
