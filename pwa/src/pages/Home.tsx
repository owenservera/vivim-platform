import React, {
  useEffect, useState, useRef, useCallback, useMemo
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  Plus, Bot, RefreshCw, WifiOff, Database, AlertCircle, CloudOff,
  Search, Grid2x2, List, Pin, Archive, MessageSquare, LayoutList,
  BookOpen, Sparkles, X, SlidersHorizontal, Clock, BarChart2,
  FileCode
} from 'lucide-react';

/* Services & Utils */
import { conversationService } from '../lib/service/conversation-service';
import { unifiedRepository } from '../lib/db/unified-repository';
import { listConversationsForRecommendation, getForYouFeed } from '../lib/recommendation';
import { logger } from '../lib/logger';
import { apiClient } from '../lib/api';
import { useAIChat } from '../hooks/useAI';
import { useCircles } from '../lib/feature-hooks';
import { featureService } from '../lib/feature-service';
import { useHomeUIStore } from '../stores/useHomeUIStore';
import { cn } from '../lib/utils';

/* Components */
import { ChatInputBox } from '../components/ChatInputBox';
import {
  IOSStories,
  ShareDialog,
  AIActionsPanel,
  CircleManager,
  useIOSToast,
  toast,
} from '../components/ios';
import { FeedItemCard } from '../components/features/conversation/FeedItemCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Sentinel } from '../components/sovereignty/Sentinel';
import { KnowledgeGraph } from '../components/sovereignty/KnowledgeGraph';

/* Types */
import type { RecommendationItem } from '../lib/recommendation/types';
import type { Conversation } from '../types/conversation';
import type { AIResult, AIAction } from '../types/features';

import './Home.css';

type FilterTab = 'all' | 'pinned' | 'archived' | 'recent';
type SortBy = 'date' | 'messages' | 'title';

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
const isNew = (dateString: string | undefined) => {
  if (!dateString) return false;
  const diff = Date.now() - new Date(dateString).getTime();
  return diff < 86400000 * 2; // last 48h
};

const computeStats = (convos: Conversation[]) => {
  const total = convos.length;
  const totalMessages = convos.reduce((s, c) => s + (c.stats?.totalMessages ?? c.messages?.length ?? 0), 0);
  const totalWords = convos.reduce((s, c) => s + (c.stats?.totalWords ?? 0), 0);
  const totalCode = convos.reduce((s, c) => s + (c.stats?.totalCodeBlocks ?? 0), 0);
  return { total, totalMessages, totalWords, totalCode };
};

/* ─────────────────────────────────────────────────
   Main Home component
───────────────────────────────────────────────── */
export const Home: React.FC = () => {
  const {
    messages: aiMessages,
    setMessages: setAIMessages,
    isLoading: aiLoading,
    sendMessage: sendAIMessage,
    stop: stopAI,
    clearMessages: clearAIMessages
  } = useAIChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [circleManagerOpen, setCircleManagerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<{
    ready: boolean; message?: string; totalConversations?: number;
  }>({ ready: false });
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiSource, setApiSource] = useState<'local' | 'api' | null>(null);

  // ── New UI state (via Zustand) ──
  const { filterTab, viewMode, searchQuery, sortBy, fabExpanded, setFilterTab, setViewMode, setSearchQuery, setSortBy, setFabExpanded } = useHomeUIStore();
  const [fabVisible] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast: showToast } = useIOSToast();
  const navigate = useNavigate();
  const { circles } = useCircles();

  /* ── Load conversations ── */
  const loadConversations = useCallback(async (pageNum = 1) => {
    const loadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    logger.info('HOME', `[${loadId}] ========== LOAD CONVERSATIONS START (page ${pageNum}) ==========`);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Loading timed out after 5 seconds')), 5000);
    });

    try {
      setError(null);
      setLoading(pageNum === 1);

      let list: Conversation[] = [];

      try {
        list = await Promise.race([
          conversationService.getAllConversations(),
          timeoutPromise
        ]);
        logger.info('HOME', `[${loadId}] Retrieved ${list.length} conversations from storage`);
      } catch (serviceError) {
        logger.warn('HOME', `[${loadId}] Storage fetch failed: ${serviceError}`);
      }

      if (list.length === 0 && pageNum === 1 && navigator.onLine) {
        logger.info('HOME', `[${loadId}] Local storage empty, falling back to direct API fetch`);
        try {
          const apiResponse = await Promise.race([
            apiClient.get('/conversations', {
              params: { limit: 50, offset: 0, include_messages: false }
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('API fallback timed out')), 5000)
            )
          ]);

          const apiBatch: any[] = apiResponse?.data?.conversations || [];
          logger.info('HOME', `[${loadId}] API fallback returned ${apiBatch.length} conversations`);

          if (apiBatch.length > 0) {
            list = apiBatch.map((conv: any): Conversation => ({
              id: conv.id,
              title: conv.title || 'Untitled Conversation',
              provider: conv.provider || 'other',
              sourceUrl: conv.sourceUrl || '',
              state: conv.state || 'ACTIVE',
              version: conv.version || 1,
              ownerId: conv.ownerId,
              contentHash: conv.contentHash,
              createdAt: conv.createdAt,
              updatedAt: conv.updatedAt || conv.createdAt,
              capturedAt: conv.capturedAt || conv.createdAt,
              exportedAt: conv.capturedAt || conv.createdAt,
              tags: conv.tags || [],
              messages: [],
              stats: {
                totalMessages: conv.messageCount || (conv.messages?.length ?? 0),
                totalWords: conv.totalWords || 0,
                totalCharacters: conv.totalCharacters || 0,
                totalCodeBlocks: conv.totalCodeBlocks || 0,
                totalMermaidDiagrams: conv.totalMermaidDiagrams || 0,
                totalImages: conv.totalImages || 0,
                totalTables: conv.totalTables || 0,
                totalLatexBlocks: conv.totalLatexBlocks || 0,
                totalToolCalls: conv.totalToolCalls || 0,
                firstMessageAt: conv.createdAt,
                lastMessageAt: conv.updatedAt || conv.createdAt,
              },
              metadata: conv.metadata || {}
            }));

            setApiSource('api');
          }
        } catch (apiFallbackError) {
          logger.warn('HOME', `[${loadId}] API fallback failed: ${apiFallbackError}`);
        }
      } else {
        setApiSource('local');
      }

      const pageSize = 20;
      const start = (pageNum - 1) * pageSize;
      const pagedList = list.slice(start, start + pageSize);

      setHasMore(pagedList.length === pageSize);

      if (pageNum === 1) {
        setConversations(pagedList);
      } else {
        setConversations((prev) => [...prev, ...pagedList]);
      }

      const newPinnedIds = new Set<string>();
      const newArchivedIds = new Set<string>();

      await Promise.all(pagedList.map(async (convo) => {
        try {
          const meta = await unifiedRepository.getMetadata(convo.id);
          if (meta?.isPinned) newPinnedIds.add(convo.id);
          if (meta?.isArchived) newArchivedIds.add(convo.id);
        } catch {}
      }));

      setPinnedIds(prev => new Set([...prev, ...newPinnedIds]));
      setArchivedIds(prev => new Set([...prev, ...newArchivedIds]));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('HOME', `[${loadId}] LOAD FAILED: ${errorMsg}`, err instanceof Error ? err : new Error(String(err)));

      let userErrorMessage = 'Failed to load conversations';
      if (errorMsg.includes('Storage not initialized')) userErrorMessage = 'Storage is initializing. Please wait…';
      else if (errorMsg.includes('indexedDB') || errorMsg.includes('database')) userErrorMessage = 'Database error. Try refreshing.';
      else if (errorMsg.includes('timed out')) userErrorMessage = 'Loading timed out. Check browser settings.';

      setError(`${userErrorMessage}. Pull to retry.`);
      showToast(toast.error(userErrorMessage));
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadRecommendations = useCallback(async () => {
    try {
      const convos = await listConversationsForRecommendation({ limit: 50 });
      if (convos.length > 0) {
        const response = await getForYouFeed(convos, { limit: 3 });
        if (response.status === 'success' && response.data) {
          setRecommendations(response.data.recommendations);
        }
      }
    } catch (err) {
      logger.error('HOME', 'Failed to load recommendations', err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const checkStorageStatus = useCallback(async () => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Storage status check timed out after 15 seconds')), 15000);
    });
    try {
      const mainStatus = await Promise.race([
        conversationService.getStorageStatus(),
        timeoutPromise
      ]);
      const stats = await unifiedRepository.getStats();
      setStorageStatus({ ready: mainStatus.isReady, message: mainStatus.isReady ? 'Storage ready' : 'Storage not ready', totalConversations: stats.total });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setStorageStatus({ ready: false, message: errorMsg.includes('timed out') ? 'Storage check timed out.' : `Failed to check storage: ${errorMsg}` });
    }
  }, []);

  const collectDebugInfo = useCallback(async () => {
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
        conversations: { count: conversations.length, loading, error },
        storage: storageStatus,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      try {
        const detailedStatus = await conversationService.getStorageStatus();
        info.storage = detailedStatus;
      } catch (err) {
        info.storageError = err instanceof Error ? err.message : String(err);
      }
      setDebugInfo(info);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDebugInfo({ error: errorMsg });
    }
  }, [conversations, loading, error, storageStatus]);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading timed out. Try refreshing the page or checking browser settings.');
      }
    }, 35000);

    loadConversations(1);
    loadRecommendations();
    checkStorageStatus();

    return () => clearTimeout(safetyTimeout);
  }, [loadConversations, loadRecommendations, checkStorageStatus]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadConversations(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, [loading, page, loadConversations]);

  /* ── Handlers ── */
  const handleContinue = useCallback((id: string, messages?: any[]) => {
    setActiveChatId(id);
    setExpandedId(id);
    if (messages && messages.length > 0) {
      setAIMessages(messages.map(m => {
        let text = '';
        if (Array.isArray(m.parts || m.content)) {
          text = (m.parts || m.content).map((p: any) => p?.text || p?.content || p).join('');
        } else {
          text = m.content;
        }
        return { role: m.role, content: text };
      }));
    } else {
      setAIMessages([]);
    }
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, [setAIMessages, setActiveChatId]);

  const handleFork = useCallback((id: string, forkId: string) => {
    logger.info('HOME', `Conversation forked from ${id} → ${forkId}`);
    showToast(toast.success('Conversation forked'));
  }, [showToast]);

  const handlePinToggle = useCallback((id: string, pinned: boolean) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (pinned) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const handleArchiveToggle = useCallback((id: string, archived: boolean) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (archived) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setPinnedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setArchivedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const handleDuplicate = useCallback((_id: string, _newId: string) => {
    loadConversations(1);
  }, [loadConversations]);

  const handleAIClick = useCallback((action: AIAction, id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      if (action === 'continue_chat') navigate(`/ai/conversation/${id}`);
      else { setSelectedConversation(convo); setAiPanelOpen(true); }
    }
  }, [conversations, navigate]);

  const handleAIResult = useCallback((_result: AIResult) => {}, []);

  const handleShare = useCallback((id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (convo) { setSelectedConversation(convo); setShareDialogOpen(true); }
  }, [conversations]);

  /* ── Derived lists ── */
  const allSorted = useMemo(() => {
    const list = [...conversations];

    // sort
    if (sortBy === 'date') {
      list.sort((a, b) => {
        const aPinned = pinnedIds.has(a.id), bPinned = pinnedIds.has(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sortBy === 'messages') {
      list.sort((a, b) => (b.stats?.totalMessages ?? 0) - (a.stats?.totalMessages ?? 0));
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [conversations, pinnedIds, sortBy]);

  const filteredConversations = useMemo(() => {
    let list = allSorted;

    // filter tab
    if (filterTab === 'pinned')   list = list.filter(c => pinnedIds.has(c.id));
    if (filterTab === 'archived') list = list.filter(c => archivedIds.has(c.id));
    if (filterTab === 'recent')   list = list.filter(c => isNew(c.createdAt));

    // search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.provider?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allSorted, filterTab, pinnedIds, archivedIds, searchQuery]);

  const stats = useMemo(() => computeStats(conversations), [conversations]);

  const tabCounts = useMemo(() => ({
    all: conversations.length,
    pinned: pinnedIds.size,
    archived: archivedIds.size,
    recent: conversations.filter(c => isNew(c.createdAt)).length,
  }), [conversations, pinnedIds, archivedIds]);

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: filteredConversations.length,
    estimateSize: (i) => expandedId === filteredConversations[i].id ? 600 : (viewMode === 'grid' ? 180 : 140),
    overscan: 5,
  });

  /* ── Render ── */
  return (
    <div className={`home-feed-wrapper flex flex-col min-h-full ${activeChatId ? 'pb-[180px]' : 'pb-20'}`}>

      {/* ── For You Stories ── */}
      {recommendations.length > 0 && (
        <div className="pt-2 pb-3 bg-card border-b border-border mb-6">
          <p className="px-4 mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            For You
          </p>
          <div className="px-4">
            <IOSStories
              stories={recommendations.slice(0, 6).map((item) => ({
                id: item.conversation.id,
                name: item.conversation.title.substring(0, 10) || 'AI',
                initials: (item.conversation.title || 'AI').substring(0, 2).toUpperCase(),
                onClick: () => navigate(`/ai/conversation/${item.conversation.id}`),
              }))}
            />
          </div>
        </div>
      )}

      {/* ── Stats ticker ── */}
      {conversations.length > 0 && !loading && (
        <div className="home-stats-banner mb-6">
          <div className="home-stat-pill primary">
            <MessageSquare className="stat-icon" />
            <span className="stat-value">{stats.total}</span>
            Convos
          </div>
          <div className="home-stat-pill emerald">
            <BarChart2 className="stat-icon" />
            <span className="stat-value">{stats.totalMessages.toLocaleString()}</span>
            Msgs
          </div>
          {stats.totalWords > 0 && (
            <div className="home-stat-pill amber">
              <LayoutList className="stat-icon" />
              <span className="stat-value">{(stats.totalWords / 1000).toFixed(1)}k</span>
              Words
            </div>
          )}
          {stats.totalCode > 0 && (
            <div className="home-stat-pill rose">
              <FileCode className="stat-icon" />
              <span className="stat-value">{stats.totalCode}</span>
              Code
            </div>
          )}
        </div>
      )}

      {/* ── Status Banners ── */}
      <AnimatePresence>
      {!storageStatus.ready && !error && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mx-4 mt-3 px-3 py-2 bg-warning-50 dark:bg-warning-700/20 rounded-xl border border-warning-500/20 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-warning-600 shrink-0" />
            <p className="text-xs text-warning-700 dark:text-warning-400">
              {storageStatus.message || 'Storage is initializing…'}
            </p>
          </div>
        </motion.div>
      )}

      {apiSource === 'api' && !error && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mx-4 mt-3 px-3 py-2 bg-info-50 dark:bg-info-700/20 rounded-xl border border-info-500/20 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <CloudOff className="w-3.5 h-3.5 text-info-600 shrink-0" />
            <p className="text-xs text-info-700 dark:text-info-400">
              Showing live data · syncing locally in background…
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── Header Area ── */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between px-4">
           <Sentinel 
             storageLocation={apiSource === 'api' ? 'ipfs' : 'local'} 
             syncStatus={navigator.onLine ? 'connected' : 'offline'} 
           />
        </div>
        
        <div className="px-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input 
              type="search"
              placeholder="Search conversations..."
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

            {/* View mode toggle */}
            <div className="flex bg-card p-1 rounded-xl shadow-sm border border-border/50">
              <button
                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid2x2 className="w-4 h-4" />
              </button>
              <button
                className={cn("p-2 rounded-lg transition-all", viewMode === 'graph' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary")}
                onClick={() => setViewMode('graph')}
                title="Graph view"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-2">
          {([
            { id: 'all',      label: 'All',      icon: <LayoutList className="w-3 h-3" /> },
            { id: 'recent',   label: 'Recent',   icon: <Clock className="w-3 h-3" /> },
            { id: 'pinned',   label: 'Pinned',   icon: <Pin className="w-3 h-3" /> },
            { id: 'archived', label: 'Archived', icon: <Archive className="w-3 h-3" /> },
          ] as {id: FilterTab; label: string; icon: React.ReactNode}[]).map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0",
                filterTab === tab.id 
                  ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20" 
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tabCounts[tab.id] > 0 && filterTab === tab.id && (
                <span className="ml-1 bg-primary-foreground/20 px-1.5 rounded-full text-[10px]">{tabCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1">
        {loading && conversations.length === 0 ? (
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
            <h3 className="text-base font-semibold mb-1">Could Not Load Conversations</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">{error}</p>
            <Button onClick={() => { setError(null); loadConversations(1); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your second brain awaits</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Capture AI conversations from ChatGPT, Claude, Gemini and more — then search, fork and share them.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button size="lg" className="rounded-xl" onClick={() => navigate('/capture')}>
                <Plus className="w-5 h-5 mr-2" />
                Capture First Conversation
              </Button>
              <Button variant="secondary" size="lg" className="rounded-xl" onClick={async () => {
                  setLoading(true);
                  try {
                    await import('../lib/recommendation/test-data-generator').then(
                      (m) => m.loadTestDataIntoStorage()
                    );
                    window.location.reload();
                  } catch {
                    showToast(toast.error('Failed to load demo data'));
                    setLoading(false);
                  }
                }}>
                <Bot className="w-5 h-5 mr-2" />
                Load Demo Data
              </Button>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 px-6 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-base font-semibold mb-1">No results</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? `No conversations match "${searchQuery}"` : `No ${filterTab} conversations yet.`}
            </p>
            <Button variant="ghost" onClick={() => { setSearchQuery(''); setFilterTab('all'); }}>
              Clear filters
            </Button>
          </div>
        ) : viewMode === 'graph' ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-4">
            <KnowledgeGraph conversations={filteredConversations} onNodeClick={(id) => navigate(`/ai/conversation/${id}`)} />
          </motion.div>
        ) : (
          <>
            {searchQuery && (
              <div className="px-4 py-2 text-xs text-muted-foreground">
                {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
            <div 
              ref={parentRef}
              className="px-4"
              style={{ position: 'relative', height: `${virtualizer.getTotalSize()}px`, width: '100%', maxWidth: '800px', margin: '0 auto' }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const convo = filteredConversations[virtualRow.index];
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
                      isPinned={pinnedIds.has(convo.id)}
                      isArchived={archivedIds.has(convo.id)}
                      gridMode={viewMode === 'grid'}
                      onContinue={handleContinue}
                      onShare={handleShare}
                      onPinToggle={handlePinToggle}
                      onArchiveToggle={handleArchiveToggle}
                      onDelete={handleDelete}
                      onFork={handleFork}
                      onDuplicate={handleDuplicate}
                      onAIClick={handleAIClick}
                      isExpanded={expandedId === convo.id}
                      overrideMessages={activeChatId === convo.id ? aiMessages : undefined}
                      isLoadingAI={activeChatId === convo.id ? aiLoading : false}
                      onExpandToggle={async (id) => {
                        if (expandedId === id) {
                          setExpandedId(null);
                          setActiveChatId(null);
                        } else {
                          setExpandedId(id);
                          const targetConvo = conversations.find(c => c.id === id);
                          if (targetConvo && (!targetConvo.messages || targetConvo.messages.length === 0)) {
                            try {
                              const fullConvo = await unifiedRepository.getConversation(id);
                              if (fullConvo && fullConvo.messages && fullConvo.messages.length > 0) {
                                setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: fullConvo.messages } : c));
                              }
                            } catch (err) {
                              logger.warn('HOME', `Failed to load messages for expansion: ${err}`);
                            }
                          }
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore ? (
        <div ref={observerTarget} className="h-20 w-full" />
      ) : conversations.length > 0 ? (
        <div className="w-full text-center py-12 text-xs text-muted-foreground font-medium tracking-wide">
          You've reached the end of your memory
        </div>
      ) : null}

      {/* FAB Area */}
      {fabVisible && (
        <div className="fixed bottom-24 right-6 lg:bottom-10 lg:right-10 z-[100]">
          <AnimatePresence>
          {fabExpanded && (
            <motion.div className="flex flex-col gap-3 mb-4 items-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="flex items-center gap-3 group"
                onClick={() => { setFabExpanded(false); navigate('/capture'); }}
              >
                <span className="bg-card text-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity">Capture</span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg transform hover:scale-110 active:scale-95 transition-all">
                  <Plus className="w-6 h-6" />
                </div>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="flex items-center gap-3 group"
                onClick={() => { setFabExpanded(false); navigate('/ai-conversations'); }}
              >
                <span className="bg-card text-foreground px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity">AI Chat</span>
                <div className="w-12 h-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center shadow-lg transform hover:scale-110 active:scale-95 transition-all">
                  <Sparkles className="w-6 h-6" />
                </div>
              </motion.button>
            </motion.div>
          )}
          </AnimatePresence>

          <button
            className={cn(
              "w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl transform transition-all duration-300",
              fabExpanded ? "rotate-45 bg-destructive" : "hover:scale-110 active:scale-95"
            )}
            onClick={() => setFabExpanded(!fabExpanded)}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* FAB Backdrop */}
      <AnimatePresence>
      {fabExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/40 backdrop-blur-[2px]"
          onClick={() => setFabExpanded(false)}
        />
      )}
      </AnimatePresence>

      {/* Dialogs */}
      {selectedConversation && (
        <>
          <ShareDialog
            conversationId={selectedConversation.id}
            conversationTitle={selectedConversation.title}
            open={shareDialogOpen}
            onClose={() => { setShareDialogOpen(false); setSelectedConversation(null); }}
          />
          <AIActionsPanel
            conversationId={selectedConversation.id}
            conversationTitle={selectedConversation.title}
            conversationContent={JSON.stringify(selectedConversation.messages)}
            open={aiPanelOpen}
            onClose={() => { setAiPanelOpen(false); setSelectedConversation(null); }}
            onResult={handleAIResult}
          />
          <CircleManager
            circles={circles}
            open={circleManagerOpen}
            onClose={() => { setCircleManagerOpen(false); setSelectedConversation(null); }}
            mode="share"
            conversationId={selectedConversation.id}
            onShareToCircle={async (circleId) => {
              const success = await featureService.shareToCircle(selectedConversation.id, circleId);
              if (success) { showToast(toast.success('Shared to circle')); setCircleManagerOpen(false); }
              else { showToast(toast.error('Failed to share to circle')); }
            }}
          />
        </>
      )}

      {/* Chat Input */}
      {activeChatId && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-[var(--width-sidebar)] z-[1040] p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
          <ChatInputBox 
            onSend={async (message) => {
              if (activeChatId) {
                try {
                  await sendAIMessage(message);
                } catch(e) { console.error(e); }
              }
            }}
            isLoading={aiLoading}
            onStop={stopAI}
            onClose={() => {
              setActiveChatId(null);
              setExpandedId(null);
              clearAIMessages();
            }}
          />
        </div>
      )}
    </div>
  );
};

export const HomeWithProvider: React.FC = () => (
  <IOSToastProvider>
    <Home />
  </IOSToastProvider>
);

export default Home;
