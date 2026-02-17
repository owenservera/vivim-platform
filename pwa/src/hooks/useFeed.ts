/**
 * useFeed Hook
 * 
 * Custom hook for managing feed data in the PWA
 */

import { useState, useEffect, useCallback } from 'react';
import { feedAPI } from '../lib/feed-api';
import type { FeedResponse, FeedItem } from '../types/acu';

interface UseFeedOptions {
  tab?: 'for-you' | 'following' | 'topics' | 'bookmarks';
  limit?: number;
  topic?: string;
  minQuality?: number;
  enabled?: boolean;
}

interface UseFeedReturn {
  data: FeedResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function useFeed(options: UseFeedOptions = {}): UseFeedReturn {
  const {
    tab = 'for-you',
    limit = 20,
    topic,
    minQuality = 60,
    enabled = true
  } = options;

  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchFeed = useCallback(async (currentOffset = 0, isLoadMore = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await feedAPI.getFeed({
        tab,
        limit,
        offset: currentOffset,
        topic,
        minQuality
      });

      if (isLoadMore && data) {
        setData(prev => ({
          ...response,
          items: [...(prev?.items || []), ...response.items]
        }));
      } else {
        setData(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch feed'));
    } finally {
      setLoading(false);
    }
  }, [tab, limit, topic, minQuality, enabled, data]);

  const refetch = useCallback(async () => {
    setOffset(0);
    await fetchFeed(0, false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (data?.hasMore && !loading) {
      const newOffset = offset + limit;
      setOffset(newOffset);
      await fetchFeed(newOffset, true);
    }
  }, [data, loading, offset, limit, fetchFeed]);

  useEffect(() => {
    if (enabled) {
      fetchFeed(0, false);
    }
  }, [fetchFeed, enabled]);

  return {
    data,
    loading,
    error,
    refetch,
    hasMore: data?.hasMore || false,
    loadMore
  };
}