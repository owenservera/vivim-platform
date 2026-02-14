/**
 * TanStack Query Hooks for Data Fetching
 * 
 * Provides:
 * - useConversations: List/search conversations
 * - useConversation: Single conversation detail
 * - useCapture: Capture mutation with optimistic updates
 * - useSearch: Full-text search
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { useSettingsStore } from './stores';
import * as CoreApi from './core-api';
import type { CoreConversation, CoreSearchResult } from './core-api';

// ============================================================================
// Types
// ============================================================================

export interface Conversation {
  id: string;
  title: string;
  provider: string;
  url?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  preview?: string;
  tags?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CaptureRequest {
  url?: string;
  rawHtml?: string;
  provider?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  preview: string;
  score: number;
  highlights?: string[];
}

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  search: (query: string) => ['search', query] as const,
  coreStatus: ['core-status'] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch all conversations
 */
export function useConversations(options?: Omit<UseQueryOptions<Conversation[]>, 'queryKey' | 'queryFn'>) {
  const { apiBaseUrl, useRustCore } = useSettingsStore();

  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async (): Promise<Conversation[]> => {
      if (useRustCore) {
        try {
          const result = await CoreApi.listConversations();
          if (result?.data) {
            return result.data.map((c: CoreConversation) => ({
              id: c.id,
              title: c.title,
              provider: c.provider || 'unknown',
              messageCount: c.stats?.messageCount ?? 0,
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            }));
          }
        } catch (e) {
          console.warn('Rust Core unavailable, falling back to API:', e);
        }
      }

      // Fallback to Express API
      const response = await fetch(`${apiBaseUrl}/api/v1/conversations`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      return data.conversations || [];
    },
    ...options,
  });
}

/**
 * Fetch single conversation with messages
 */
export function useConversation(id: string) {
  const { apiBaseUrl, useRustCore } = useSettingsStore();

  return useQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: async () => {
      if (useRustCore) {
        try {
          const result = await CoreApi.getConversation(id);
          if (result) {
            return result;
          }
        } catch (e) {
          console.warn('Rust Core unavailable:', e);
        }
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      return response.json();
    },
    enabled: !!id,
  });
}

/**
 * Fetch messages for a conversation
 */
export function useMessages(conversationId: string) {
  const { apiBaseUrl, useRustCore } = useSettingsStore();

  return useQuery({
    queryKey: queryKeys.messages(conversationId),
    queryFn: async (): Promise<Message[]> => {
      if (useRustCore) {
        try {
          const result = await CoreApi.getMessages(conversationId);
          if (Array.isArray(result)) {
            return result as Message[];
          }
        } catch (e) {
          console.warn('Rust Core unavailable:', e);
        }
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      return data.messages || [];
    },
    enabled: !!conversationId,
  });
}

/**
 * Capture a conversation (mutation with optimistic update)
 */
export function useCapture() {
  const queryClient = useQueryClient();
  const { apiBaseUrl } = useSettingsStore();

  return useMutation({
    mutationFn: async (request: CaptureRequest) => {
      const response = await fetch(`${apiBaseUrl}/api/v1/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Capture failed');
      }

      return response.json();
    },

    // Optimistic update
    onMutate: async (newCapture) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(queryKeys.conversations);

      // Optimistically add placeholder
      const optimisticConversation: Conversation = {
        id: `temp-${Date.now()}`,
        title: newCapture.url || 'New Capture',
        provider: newCapture.provider || 'unknown',
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preview: 'Capturing...',
      };

      queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (old = []) => [
        optimisticConversation,
        ...old,
      ]);

      return { previousConversations, optimisticId: optimisticConversation.id };
    },

    // Rollback on error
    onError: (err, _variables, context) => {
      console.error('Capture error:', err);
      if (context?.previousConversations) {
        queryClient.setQueryData(queryKeys.conversations, context.previousConversations);
      }
    },

    // Replace optimistic with real data
    onSuccess: (data, _variables, context) => {
      queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (old = []) => 
        old.map(c => c.id === context?.optimisticId ? data.conversation : c)
      );
    },

    // Always refetch after
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

/**
 * Search conversations (with debounce handled by caller)
 */
export function useSearch(query: string) {
  const { useRustCore } = useSettingsStore();

  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];

      if (useRustCore) {
        try {
          const results = await CoreApi.searchConversations(query);
          if (Array.isArray(results)) {
            return results.map((r: CoreSearchResult) => ({
              id: r.id,
              title: r.title,
              preview: r.sourceUrl || '',
              score: r.rank ?? 1,
            }));
          }
        } catch (e) {
          console.warn('Rust Core search unavailable:', e);
        }
      }

      // Local search fallback would go here
      return [];
    },
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // Cache search results for 30 seconds
  });
}

/**
 * Check Rust Core availability
 */
export function useCoreStatus() {
  return useQuery({
    queryKey: queryKeys.coreStatus,
    queryFn: async () => {
      try {
        const status = await CoreApi.checkCoreStatus();
        return status;
      } catch {
        return { available: false, version: null };
      }
    },
    staleTime: 60 * 1000, // Check every minute
    retry: false,
  });
}

/**
 * Delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { apiBaseUrl, useRustCore } = useSettingsStore();

  return useMutation({
    mutationFn: async (id: string) => {
      if (useRustCore) {
        try {
          const success = await CoreApi.deleteConversation(id);
          if (success) return { success: true };
        } catch (e) {
          console.warn('Rust Core delete unavailable:', e);
        }
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/conversations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
      return response.json();
    },

    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations });
      const previous = queryClient.getQueryData(queryKeys.conversations);
      
      queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (old = []) =>
        old.filter(c => c.id !== deletedId)
      );
      
      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.conversations, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}
