import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { RefreshCw, WifiOff, MessageSquare, LayoutList, SlidersHorizontal, List, Grid2x2, Sparkles, Globe, Search } from 'lucide-react';

import { useFeed } from '../hooks/useFeed';
import { FeedItemCard } from '../components/features/conversation/FeedItemCard';
import { KnowledgeGraph } from '../components/sovereignty/KnowledgeGraph';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useHomeUIStore } from '../stores/useHomeUIStore';
import { cn } from '../lib/utils';
import { apiClient } from '../lib/api';
import { useIOSToast, toast } from '../components/ios';
import type { Conversation } from '../types/conversation';
import type { FeedItem } from '../types/acu';

type SortBy = 'date' | 'messages' | 'title';

const computeStats = (items: FeedItem[]) => {
  const total = items.length;
  const totalMessages = items.reduce((s, c) => s + (c.conversation.messageCount || c.conversation.messages?.length || 0), 0);
  const totalWords = items.reduce((s, c) => s + (c.conversation.totalWords || 0), 0);
  const totalCode = items.reduce((s, c) => s + (c.conversation.totalCodeBlocks || 0), 0);
  return { total, totalMessages, totalWords, totalCode };
};

export const Scroll: React.FC = () => {
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const { data, loading, error, refetch, hasMore, loadMore } = useFeed({ tab: 'scroll', limit: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { viewMode, searchQuery, sortBy, setViewMode, setSearchQuery, setSortBy } = useHomeUIStore();

  const handleAIClick = useCallback((_action: any, id: string) => {
    navigate(`/ai/conversation/${id}`);
  }, [navigate]);

  const { toast: showToast } = useIOSToast();

  const handleVisibilityToggle = useCallback(async (id: string, visibility: string) => {
    try {
      if (visibility === 'public') {
        const response = await apiClient.put(`/conversations/${id}/visibility`, { visibility: 'public' });
        if (response.status !== 200) throw new Error('Failed to set public visibility');
        showToast(toast.success('Conversation published to Scroll'));
      } else {
        const response = await apiClient.put(`/conversations/${id}/visibility`, { visibility: 'private' });
        if (response.status !== 200) throw new Error('Failed to set private visibility');
        showToast(toast.success('Conversation removed from Scroll'));
      }
      
      // Update local state is harder here since data is from useFeed which might not expose easy setter
      // but refetch will work or we can just wait for next load. For now, refetch.
      refetch();
    } catch (err) {
      console.error('Failed to toggle visibility', err);
      showToast(toast.error('Failed to change visibility'));
    }
  }, [showToast, refetch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [loading, hasMore, loadMore]);

  const items = useMemo(() => data?.items || [], [data?.items]);

  const allSorted = useMemo(() => {
    let list = [...items];
    if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.conversation.capturedAt || b.conversation.createdAt).getTime() - new Date(a.conversation.capturedAt || a.conversation.createdAt).getTime());
    } else if (sortBy === 'messages') {
      list.sort((a, b) => (b.conversation.messageCount || 0) - (a.conversation.messageCount || 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.conversation.title || '').localeCompare(b.conversation.title || ''));
    }
    return list;
  }, [items, sortBy]);

  const filteredItems = useMemo(() => {
    let list = allSorted;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.conversation.title?.toLowerCase().includes(q) ||
        c.conversation.provider?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allSorted, searchQuery]);

  const stats = useMemo(() => computeStats(items), [items]);
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: filteredItems.length,
    estimateSize: (i) => expandedId === filteredItems[i].conversation.id ? 600 : (viewMode === 'grid' ? 180 : 140),
    overscan: 5,
  });

  return (
    <div className="home-feed-wrapper flex flex-col min-h-full pb-20">
      <div className="pt-2 pb-3 bg-card border-b border-border mb-6">
        <p className="px-4 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          Public Network Scroll
        </p>
      </div>

      {items.length > 0 && !loading && (
        <div className="home-stats-banner mb-6">
          <div className="home-stat-pill primary">
            <MessageSquare className="stat-icon" />
            <span className="stat-value">{stats.total}</span>
            Convos
          </div>
          <div className="home-stat-pill emerald">
            <LayoutList className="stat-icon" />
            <span className="stat-value">{stats.totalMessages.toLocaleString()}</span>
            Msgs
          </div>
        </div>
      )}

      {/* Header Area */}
      <div className="mb-6 space-y-4 px-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input 
            type="search"
            placeholder="Search public feed..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-card border-none shadow-sm focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Sort select */}
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none w-11 h-11 opacity-0 absolute inset-0 cursor-pointer z-10"
              title="Sort by"
            >
              <option value="date">Date</option>
              <option value="messages">Messages</option>
              <option value="title">Title</option>
            </select>
            <Button variant="outline" size="icon" className="bg-card border-none shadow-sm">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex bg-card p-1 rounded-xl shadow-sm border border-border/50">
            <button
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
              onClick={() => setViewMode('grid')}
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
            <button
              className={cn("p-2 rounded-lg transition-all", viewMode === 'graph' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
              onClick={() => setViewMode('graph')}
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {loading && items.length === 0 ? (
          <div className="space-y-4 px-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-error-50 dark:bg-error-900/30 flex items-center justify-center mb-4">
              <WifiOff className="w-7 h-7 text-error-500" />
            </div>
            <h3 className="text-base font-semibold mb-1">Could Not Load Feed</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">{error.message}</p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <Globe className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Public Conversations</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              There are no conversations shared to the public network yet.
            </p>
          </div>
        ) : viewMode === 'graph' ? (
          <div className="px-4">
            <KnowledgeGraph 
              conversations={filteredItems.map(i => i.conversation as unknown as Conversation)} 
              onNodeClick={(id) => navigate(`/ai/conversation/${id}`)} 
            />
          </div>
        ) : (
          <div 
            ref={parentRef}
            className="px-4"
            style={{ position: 'relative', height: `${virtualizer.getTotalSize()}px`, width: '100%', maxWidth: '800px', margin: '0 auto' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = filteredItems[virtualRow.index];
              const convo = item.conversation as unknown as Conversation;
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '12px'
                  }}
                >
                  <FeedItemCard
                    conversation={convo}
                    isPinned={false}
                    isArchived={false}
                    gridMode={viewMode === 'grid'}
                    onContinue={() => navigate(`/ai/conversation/${convo.id}`)}
                    onShare={() => {}}
                    onPinToggle={() => {}}
                    onArchiveToggle={() => {}}
                    onDelete={() => {}}
                    onFork={() => {}}
                    onDuplicate={() => {}}
                    onAIClick={handleAIClick}
                    isExpanded={expandedId === convo.id}
                    onExpandToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                    onVisibilityToggle={handleVisibilityToggle}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hasMore ? (
        <div ref={observerTarget} className="h-20 w-full flex items-center justify-center">
          {loading && items.length > 0 && <span className="text-xs text-muted-foreground">Loading more...</span>}
        </div>
      ) : items.length > 0 ? (
        <div className="w-full text-center py-12 text-xs text-muted-foreground font-medium tracking-wide">
          End of public feed
        </div>
      ) : null}
    </div>
  );
};

export default Scroll;
