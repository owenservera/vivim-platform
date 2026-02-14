import { useState, useEffect, useCallback, useRef } from 'react';
import { featureService } from './feature-service';
import { logger } from './logger';
import type { ACUMetadata, ShareConfig, ShareLink, AIResult, AIAction, Circle, RelatedACU, FeatureCapabilities } from '../types/features';

export function useFeatureCapabilities() {
  const [capabilities, setCapabilities] = useState<FeatureCapabilities>({
    aiActions: true,
    sharing: true,
    circles: true,
    offlineQueue: true,
    semanticSearch: false,
    lineage: true,
  });

  useEffect(() => {
    setCapabilities(featureService.getCapabilities());
  }, []);

  return capabilities;
}

export function useConversationMetadata(conversationId: string) {
  const [metadata, setMetadata] = useState<ACUMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await featureService.getMetadata(conversationId);
      setMetadata(data);
    } catch (err) {
      setError('Failed to load metadata');
      logger.error('useConversationMetadata error', { conversationId, error: err });
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  const updateMetadata = useCallback(async (updates: Partial<ACUMetadata>) => {
    const success = await featureService.updateMetadata(conversationId, updates);
    if (success) {
      setMetadata(prev => prev ? { ...prev, ...updates } : null);
    }
    return success;
  }, [conversationId]);

  const pin = useCallback(async () => {
    const success = await featureService.pin(conversationId);
    if (success) {
      setMetadata(prev => prev ? { ...prev, isPinned: true } : null);
    }
    return success;
  }, [conversationId]);

  const unpin = useCallback(async () => {
    const success = await featureService.unpin(conversationId);
    if (success) {
      setMetadata(prev => prev ? { ...prev, isPinned: false } : null);
    }
    return success;
  }, [conversationId]);

  const archive = useCallback(async () => {
    const success = await featureService.archive(conversationId);
    if (success) {
      setMetadata(prev => prev ? { ...prev, isArchived: true } : null);
    }
    return success;
  }, [conversationId]);

  const unarchive = useCallback(async () => {
    const success = await featureService.unarchive(conversationId);
    if (success) {
      setMetadata(prev => prev ? { ...prev, isArchived: false } : null);
    }
    return success;
  }, [conversationId]);

  return {
    metadata,
    loading,
    error,
    refresh: loadMetadata,
    updateMetadata,
    pin,
    unpin,
    archive,
    unarchive,
  };
}

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      const ids = await featureService.getBookmarks();
      setBookmarkedIds(new Set(ids));
      setLoading(false);
    };
    loadBookmarks();
  }, []);

  const bookmark = useCallback(async (conversationId: string) => {
    const success = await featureService.bookmark(conversationId);
    if (success) {
      setBookmarkedIds(prev => new Set([...prev, conversationId]));
    }
    return success;
  }, []);

  const removeBookmark = useCallback(async (conversationId: string) => {
    const success = await featureService.removeBookmark(conversationId);
    if (success) {
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      });
    }
    return success;
  }, []);

  const toggleBookmark = useCallback(async (conversationId: string) => {
    if (bookmarkedIds.has(conversationId)) {
      return removeBookmark(conversationId);
    } else {
      return bookmark(conversationId);
    }
  }, [bookmarkedIds, bookmark, removeBookmark]);

  const isBookmarked = useCallback((conversationId: string) => {
    return bookmarkedIds.has(conversationId);
  }, [bookmarkedIds]);

  return {
    bookmarkedIds,
    loading,
    bookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
  };
}

export function useFork() {
  const [forking, setForking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fork = useCallback(async (conversationId: string, title?: string): Promise<string | null> => {
    try {
      setForking(true);
      setError(null);
      const newId = await featureService.fork(conversationId, title);
      if (!newId) {
        setError('Failed to fork conversation');
      }
      return newId;
    } catch (err) {
      setError('An error occurred while forking');
      return null;
    } finally {
      setForking(false);
    }
  }, []);

  return { fork, forking, error };
}

export function useShare() {
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLink = useCallback(async (conversationId: string, config: ShareConfig) => {
    try {
      setGenerating(true);
      setError(null);
      const link = await featureService.generateShareLink(conversationId, config);
      setShareLink(link);
      return link;
    } catch (err) {
      setError('Failed to generate share link');
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const clearLink = useCallback(() => {
    setShareLink(null);
    setError(null);
  }, []);

  return { generateLink, shareLink, generating, error, clearLink };
}

export function useAIActions() {
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (action: AIAction, conversationId: string, content: string) => {
    try {
      setExecuting(true);
      setError(null);
      setResult(null);

      abortControllerRef.current = new AbortController();

      const aiResult = await featureService.executeAIAction(action, conversationId, content);
      
      if (aiResult) {
        setResult(aiResult);
        return aiResult;
      } else {
        setError('AI action returned no result');
        return null;
      }
    } catch (err) {
      setError('Failed to execute AI action');
      return null;
    } finally {
      setExecuting(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setExecuting(false);
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { execute, result, executing, error, cancel, clear };
}

export function useRelatedConversations(conversationId: string) {
  const [related, setRelated] = useState<RelatedACU[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findRelated = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await featureService.findRelated(conversationId);
      setRelated(results);
      return results;
    } catch (err) {
      setError('Failed to find related conversations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  return { related, loading, error, findRelated };
}

export function useCircles() {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCircles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await featureService.getCircles();
      setCircles(data);
    } catch (err) {
      setError('Failed to load circles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  const createCircle = useCallback(async (name: string, description: string, visibility: 'public' | 'private' | 'secret') => {
    const circle = await featureService.createCircle(name, description, visibility);
    if (circle) {
      setCircles(prev => [...prev, circle]);
    }
    return circle;
  }, []);

  const shareToCircle = useCallback(async (conversationId: string, circleId: string) => {
    return featureService.shareToCircle(conversationId, circleId);
  }, []);

  return {
    circles,
    loading,
    error,
    refresh: loadCircles,
    createCircle,
    shareToCircle,
  };
}

export function useConversationActions() {
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const duplicate = useCallback(async (conversationId: string): Promise<string | null> => {
    try {
      setDuplicating(true);
      const newId = await featureService.duplicate(conversationId);
      return newId;
    } finally {
      setDuplicating(false);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      setDeleting(true);
      return featureService.delete(conversationId);
    } finally {
      setDeleting(false);
    }
  }, []);

  return {
    duplicate,
    duplicating,
    deleteConversation,
    deleting,
  };
}
