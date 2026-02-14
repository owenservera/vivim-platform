/**
 * useAIConversations Hook
 * Manages AI conversations list with search, filtering, and selection
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '../lib/service/conversation-service';
import type { Conversation } from '../types/conversation';

/**
 * Conversation filter options
 */
export interface ConversationFilters {
  search: string;
  provider: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
  sortBy: 'recent' | 'oldest' | 'name';
  pinned: boolean | null;
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: ConversationFilters = {
  search: '',
  provider: null,
  dateRange: 'all',
  sortBy: 'recent',
  pinned: null,
};

/**
 * Sort conversations by date
 */
function sortConversations(conversations: Conversation[], sortBy: ConversationFilters['sortBy']): Conversation[] {
  return [...conversations].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    switch (sortBy) {
      case 'recent':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

/**
 * Filter conversations by search term
 */
function filterBySearch(conversations: Conversation[], search: string): Conversation[] {
  if (!search.trim()) return conversations;
  const lowerSearch = search.toLowerCase();
  return conversations.filter(conv =>
    conv.title.toLowerCase().includes(lowerSearch) ||
    conv.provider.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Filter conversations by provider
 */
function filterByProvider(conversations: Conversation[], provider: string | null): Conversation[] {
  if (!provider) return conversations;
  return conversations.filter(conv => conv.provider === provider);
}

/**
 * Filter conversations by date range
 */
function filterByDateRange(conversations: Conversation[], range: ConversationFilters['dateRange']): Conversation[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  return conversations.filter(conv => {
    const convDate = new Date(conv.createdAt);

    switch (range) {
      case 'today':
        return convDate >= today;
      case 'week':
        return convDate >= weekAgo;
      case 'month':
        return convDate >= monthAgo;
      default:
        return true;
    }
  });
}

/**
 * Filter conversations by pinned status
 */
function filterByPinned(conversations: Conversation[], pinned: boolean | null): Conversation[] {
  if (pinned === null) return conversations;
  return conversations.filter(conv => conv.metadata?.isPinned === pinned);
}

/**
 * useAIConversations Hook
 */
export function useAIConversations() {
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<ConversationFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch all conversations
  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => conversationService.getAllConversations(),
    staleTime: 5 * 60 * 1000,
  });

  // Delete conversation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => conversationService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      if (selectedId) setSelectedId(null);
    },
  });

  // Update conversation mutation (for pinning, etc.)
  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      // For now, just refetch - full update would go here
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    },
  });

  // Filtered and sorted conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;

    result = filterBySearch(result, filters.search);
    result = filterByProvider(result, filters.provider);
    result = filterByDateRange(result, filters.dateRange);
    result = filterByPinned(result, filters.pinned);
    result = sortConversations(result, filters.sortBy);

    return result;
  }, [conversations, filters]);

  // Get unique providers for filter
  const providers = useMemo(() => {
    const unique = new Set(conversations.map(c => c.provider));
    return Array.from(unique).sort();
  }, [conversations]);

  // Fetch active conversation details when selected
  const { data: activeConversation = null, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['ai-conversation', selectedId],
    queryFn: () => selectedId ? conversationService.getConversation(selectedId) : null,
    enabled: !!selectedId,
    staleTime: 5 * 60 * 1000,
  });

  // Selected conversation (prefer detailed version, fallback to list item)
  const selectedConversation = useMemo(() => {
    if (activeConversation) return activeConversation;
    if (!selectedId) return null;
    return conversations.find(c => c.id === selectedId) || null;
  }, [activeConversation, selectedId, conversations]);

  // Filter setters
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setProvider = useCallback((provider: string | null) => {
    setFilters(prev => ({ ...prev, provider }));
  }, []);

  const setDateRange = useCallback((dateRange: ConversationFilters['dateRange']) => {
    setFilters(prev => ({ ...prev, dateRange }));
  }, []);

  const setSortBy = useCallback((sortBy: ConversationFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  }, []);

  const setPinned = useCallback((pinned: boolean | null) => {
    setFilters(prev => ({ ...prev, pinned }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const selectConversation = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    if (confirm('Delete this conversation?')) {
      await deleteMutation.mutateAsync(id);
    }
  }, [deleteMutation]);

  const togglePin = useCallback(async (id: string) => {
    await updateMutation.mutateAsync(id);
  }, [updateMutation]);

  return {
    // Data
    conversations: filteredConversations,
    allConversations: conversations,
    providers,
    selectedConversation,
    selectedId,

    // Loading states
    isLoading: isLoading || isLoadingDetails,
    error,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,

    // Actions
    refetch,
    selectConversation,
    deleteConversation,
    togglePin,
    clearFilters,

    // Filter controls
    filters,
    setSearch,
    setProvider,
    setDateRange,
    setSortBy,
    setPinned,
  };
}
