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
  FileCode, ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { conversationService } from '../lib/service/conversation-service';
import { unifiedRepository } from '../lib/db/unified-repository';
import { listConversationsForRecommendation, getForYouFeed } from '../lib/recommendation';
import { logger } from '../lib/logger';
import { apiClient } from '../lib/api';
import { dataSyncService } from '../lib/data-sync-service';
import { useAIChat } from '../hooks/useAI';
import { ChatInputBox } from '../components/ChatInputBox';
import {
  IOSStories,
  IOSButton,
  IOSSkeletonList,
  EmptyMessages,
  ConversationCard,
  ShareDialog,
  AIActionsPanel,
  CircleManager,
  IOSToastProvider,
  useIOSToast,
  toast,
} from '../components/ios';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ContentRenderer } from '../components/content/ContentRenderer';
import { useCircles } from '../lib/feature-hooks';
import { featureService } from '../lib/feature-service';
import type { RecommendationItem } from '../lib/recommendation/types';
import type { Conversation } from '../types/conversation';
import type { AIResult, AIAction } from '../types/features';
import './Home.css';

import { useHomeUIStore } from '../stores/useHomeUIStore';

type FilterTab = 'all' | 'pinned' | 'archived' | 'recent';
type ViewMode = 'list' | 'grid';
type SortBy = 'date' | 'messages' | 'title';

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000)     return 'Just now';
    if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000)  return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const isNew = (dateString: string | undefined) => {
  if (!dateString) return false;
  const diff = Date.now() - new Date(dateString).getTime();
  return diff < 86400000 * 2; // last 48h
};

const getPreviewText = (convo: Conversation): string => {
  if (!convo.messages?.length) return '';
  // Try the last user-message content
  const msgs = [...convo.messages].reverse();
  for (const msg of msgs) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      const parts = (msg as any).parts || msg.content || [];
      if (Array.isArray(parts)) {
        for (const p of parts) {
          if (typeof p === 'string' && p.trim().length > 0) return p.trim();
          if (p?.type === 'text' && p.text?.trim()) return p.text.trim();
        }
      }
      if (typeof msg.content === 'string' && msg.content.trim()) {
        return msg.content.trim();
      }
    }
  }
  return '';
};

const providerColor: Record<string, string> = {
  chatgpt:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  claude:     'bg-orange-50  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
  gemini:     'bg-blue-50    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
  grok:       'bg-red-50     text-red-700     dark:bg-red-900/30     dark:text-red-400',
  perplexity: 'bg-purple-50  text-purple-700  dark:bg-purple-900/30  dark:text-purple-400',
  deepseek:   'bg-cyan-50    text-cyan-700    dark:bg-cyan-900/30    dark:text-cyan-400',
  kimi:       'bg-pink-50    text-pink-700    dark:bg-pink-900/30    dark:text-pink-400',
  qwen:       'bg-indigo-50  text-indigo-700  dark:bg-indigo-900/30  dark:text-indigo-400',
  other:      'bg-gray-100   text-gray-600    dark:bg-gray-800       dark:text-gray-400',
  default:    'bg-gray-100   text-gray-600    dark:bg-gray-800       dark:text-gray-400',
};

const providerEmoji: Record<string, string> = {
  chatgpt: '🤖', claude: '✨', gemini: '💎', grok: '🚀',
  perplexity: '🔮', deepseek: '🔍', kimi: '🎯', qwen: '🌐',
  other: '💬', default: '💬',
};

/* ─────────────────────────────────────────────────
   Enhanced feed card (replaces the old ConversationCard for the home feed)
───────────────────────────────────────────────── */
interface FeedItemCardProps {
  conversation: Conversation;
  isPinned: boolean;
  isArchived: boolean;
  gridMode?: boolean;
  onContinue: (id: string, messages?: any[]) => void;
  onShare: (id: string) => void;
  onPinToggle: (id: string, pinned: boolean) => void;
  onArchiveToggle: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  onFork: (id: string, forkId: string) => void;
  onDuplicate: (id: string, newId: string) => void;
  onAIClick: (action: AIAction, id: string) => void;
  isExpanded?: boolean;
  onExpandToggle?: (id: string) => void;
  overrideMessages?: any[];
  isLoadingAI?: boolean;
}

const FeedItemCard: React.FC<FeedItemCardProps> = ({
  conversation: convo,
  isPinned,
  isArchived,
  gridMode = false,
  onContinue,
  onShare,
  onPinToggle,
  onArchiveToggle,
  onDelete,
  onFork,
  onDuplicate,
  onAIClick,
  isExpanded,
  onExpandToggle,
  overrideMessages,
  isLoadingAI,
}) => {
  const navigate = useNavigate();
  const prov = convo.provider || 'default';
  const previewText = getPreviewText(convo);
  const tags = Array.isArray(convo.tags) ? convo.tags.slice(0, 3) : [];
  const msgCount = convo.stats?.totalMessages ?? convo.messages?.length ?? 0;
  const wordCount = convo.stats?.totalWords ?? 0;
  const codeBlocks = convo.stats?.totalCodeBlocks ?? 0;
  const isNewConvo = isNew(convo.createdAt);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const scrollEl = scrollContainerRef.current;
    const handleScroll = () => {
      const isNearBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 50;
      userScrolledUp.current = !isNearBottom;
    };
    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      if (userScrolledUp.current) return;
      const container = scrollContainerRef.current;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [overrideMessages, isLoadingAI, isExpanded]);

  useEffect(() => {
    if (isExpanded && overrideMessages && cardRef.current) {
       // Scrolling is now managed by the virtualizer or standard flow without brittle magic numbers
       cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [overrideMessages, isLoadingAI, isExpanded]);

  return (
    <ErrorBoundary
      fallback={
        <div className="px-4 py-3 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
          Failed to render
        </div>
      }
    >
      <div
        ref={cardRef}
        className={`conv-card-enhanced ${isPinned ? 'is-pinned' : ''} ${isArchived ? 'is-archived' : ''}`}
        onClick={() => {
          if (gridMode || !onExpandToggle) {
            navigate(`/ai/conversation/${convo.id}`);
          } else {
            onExpandToggle(convo.id);
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { 
          if (e.key === 'Enter') {
            if (gridMode || !onExpandToggle) {
              navigate(`/ai/conversation/${convo.id}`);
            } else {
              onExpandToggle(convo.id);
            }
          }
        }}
        id={`conv-card-${convo.id}`}
      >
        {/* Provider accent strip */}
        <div className={`conv-card-accent ${prov}`} />

        <div className="conv-card-body">
          {/* Top row: provider chip + time + new badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`conv-provider-chip ${providerColor[prov] || providerColor.default}`}>
              {providerEmoji[prov] || '💬'} {prov}
            </span>
            {isNewConvo && (
              <span className="conv-new-badge">✦ New</span>
            )}
            <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-600 flex-shrink-0">
              {formatDate(convo.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-semibold text-gray-900 dark:text-white leading-snug ${gridMode ? 'text-[13px] line-clamp-2' : 'text-sm truncate'}`}>
            {convo.title || 'Untitled Conversation'}
          </h3>

          {/* Preview snippet */}
          {!gridMode && previewText && (
            <p className="conv-preview-text mt-1">{previewText}</p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="conv-tags">
              {tags.map((tag) => (
                <span key={tag} className="conv-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Mini stats */}
          <div className="conv-mini-stats mt-2">
            {msgCount > 0 && (
              <span className="conv-mini-stat">
                <MessageSquare className="w-[11px] h-[11px]" />
                {msgCount}
              </span>
            )}
            {wordCount > 0 && (
              <span className="conv-mini-stat">
                <LayoutList className="w-[11px] h-[11px]" />
                {wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : wordCount}w
              </span>
            )}
            {codeBlocks > 0 && (
              <span className="conv-mini-stat">
                <FileCode className="w-[11px] h-[11px]" />
                {codeBlocks}
              </span>
            )}
          </div>

          {/* Action strip */}
          {!gridMode && (
            <div
              className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onContinue(convo.id, convo.messages); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Continue with AI
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onShare(convo.id); }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                Share
              </button>
              <div className="flex-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = isPinned;
                  onPinToggle(convo.id, !prev);
                }}
                className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title={isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prev = isArchived;
                  onArchiveToggle(convo.id, !prev);
                }}
                className={`p-1.5 rounded-lg transition-colors ${isArchived ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title={isArchived ? 'Unarchive' : 'Archive'}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Grid mode: just a subtle continue hint */}
          {gridMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onContinue(convo.id); }}
              className="mt-2 w-full text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 text-center py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              Continue →
            </button>
          )}

          {/* Full Conversation Expansion */}
          {isExpanded && !gridMode && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Conversation</span>
              </div>
              <div 
                ref={scrollContainerRef}
                className="max-h-[600px] overflow-y-auto pr-2 space-y-6 custom-scrollbar flex flex-col items-stretch"
              >
                {(overrideMessages || convo.messages || []).map((msg: any, i: number) => {
                  const parts = msg.parts || msg.content;
                  if (!parts) return null;
                  
                  return (
                    <div key={msg.id || i} className={`group relative flex flex-col w-full ${msg.role === 'user' ? 'items-end user-message-entry' : 'items-start assistant-message-entry'}`}>
                      <div className={`relative px-4 py-3 text-[13px] rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-br-sm md:max-w-[75%] max-w-[85%] shadow-md' 
                          : 'bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 rounded-bl-sm w-full border border-gray-100 dark:border-white/5 shadow-sm'
                      } overflow-x-hidden transition-all hover:shadow-lg`}>
                        {msg.role === 'user' ? (
                           <div className="whitespace-pre-wrap leading-relaxed">{typeof parts === 'string' ? parts : Array.isArray(parts) ? parts.map((p: any) => p.text || p.content || '').join('') : ''}</div>
                        ) : (
                          <ContentRenderer content={parts} />
                        )}
                        
                        {!overrideMessages && msg.role === 'user' && (
                        <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex right-[calc(100%+0.75rem)]`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onContinue(convo.id, convo.messages.slice(0, i + 1));
                            }}
                            className="bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 rounded-full p-2 text-indigo-600 dark:text-indigo-400 hover:scale-110 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap group/btn"
                            title="Branch conversation from here"
                          >
                            <Sparkles className="w-3.5 h-3.5 group-hover/btn:animate-pulse" />
                            <span className="text-[10px] font-bold pr-1">Branch</span>
                          </button>
                        </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoadingAI && (
                  <div className="flex flex-col items-start w-full assistant-message-entry">
                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl rounded-bl-sm flex items-center gap-1.5 border border-gray-100 dark:border-white/5 shadow-sm">
                       <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></div>
                       <span className="text-[10px] ml-2 font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">Thinking</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

/* ─────────────────────────────────────────────────
   Aggregate stats from conversations
───────────────────────────────────────────────── */
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
  const [fabVisible, _setFabVisible] = useState(true);
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
        <div className="pt-2 pb-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <p className="px-4 mb-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
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
        <div className="home-stats-banner">
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
          className="mx-4 mt-3 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
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
          className="mx-4 mt-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <CloudOff className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Showing live data · syncing locally in background…
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── Sticky Header (Search + View Toggle + Filters) ── */}
      {conversations.length > 0 && (
        <div className="sticky top-0 z-50 bg-[#f8f9fb]/85 dark:bg-[#0a0a0f]/85 backdrop-blur-md pb-1 border-b border-gray-200 dark:border-gray-800 transition-colors">
          <div className="home-search-row">
          <div className="home-search-input-wrap">
            <Search className="search-icon" />
            <input
              type="search"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="home-search-input"
              id="home-search-input"
            />
          </div>

          {/* Sort button */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="appearance-none w-9 h-9 opacity-0 absolute inset-0 cursor-pointer z-10"
              title="Sort by"
            >
              <option value="date">Date</option>
              <option value="messages">Messages</option>
              <option value="title">Title</option>
            </select>
            <button className="home-view-toggle-btn active w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" title="Sort">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* View mode toggle */}
          <div className="home-view-toggle">
            <button
              className={`home-view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              className={`home-view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="home-filter-tabs">
          {([
            { id: 'all',      label: 'All',      icon: <LayoutList className="w-3 h-3" /> },
            { id: 'recent',   label: 'Recent',   icon: <Clock className="w-3 h-3" /> },
            { id: 'pinned',   label: 'Pinned',   icon: <Pin className="w-3 h-3" /> },
            { id: 'archived', label: 'Archived', icon: <Archive className="w-3 h-3" /> },
          ] as {id: FilterTab; label: string; icon: React.ReactNode}[]).map((tab) => (
            <button
              key={tab.id}
              className={`home-filter-tab ${filterTab === tab.id ? 'active' : ''}`}
              onClick={() => setFilterTab(tab.id)}
              id={`filter-tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
              {tabCounts[tab.id] > 0 && filterTab === tab.id && (
                <span className="tab-count">{tabCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1">
        {loading && conversations.length === 0 ? (
          <div className="space-y-3 px-2 sm:px-4 pt-4">
            <IOSSkeletonList count={6} showAvatar />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center text-center py-12 px-6">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <WifiOff className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Could Not Load Conversations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{error}</p>
            <button
              onClick={() => { setError(null); loadConversations(1); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          /* ── Rich empty state ── */
          <div className="home-empty-hero">
            <div className="home-empty-orb">
              <MessageSquare className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h2 className="home-empty-title">Your second brain awaits</h2>
            <p className="home-empty-sub">
              Capture AI conversations from ChatGPT, Claude, Gemini and more — then search, fork and share them.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <IOSButton
                variant="primary"
                fullWidth
                icon={<Plus className="w-5 h-5" />}
                onClick={() => navigate('/capture')}
              >
                Capture First Conversation
              </IOSButton>
              <IOSButton
                variant="secondary"
                fullWidth
                icon={<Bot className="w-5 h-5" />}
                onClick={async () => {
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
                }}
              >
                Load Demo Data
              </IOSButton>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          /* ── No results for filter/search ── */
          <div className="flex flex-col items-center py-16 px-6 text-center">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery ? `No conversations match "${searchQuery}"` : `No ${filterTab} conversations yet.`}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setFilterTab('all'); }}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          </div>
        ) : (
          /* ── Feed ── */
          <>
            {searchQuery && (
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
            <div 
              ref={parentRef}
              className="home-feed-container"
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
                      paddingBottom: '8px'
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

      {/* Intersection sentinel for infinite scroll */}
      {hasMore ? (
        <div ref={observerTarget} className="h-8 w-full" />
      ) : conversations.length > 0 ? (
        <div className="w-full text-center py-8 text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
          You've reached the end
        </div>
      ) : null}

      {/* ── FAB (floating action buttons) ── */}
      {fabVisible && (
        <div className="home-fab-area z-[1020]">
          {/* Mini actions (when expanded) */}
          <AnimatePresence>
          {fabExpanded && (
            <motion.div 
              className="flex flex-col gap-3 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="home-fab-mini"
                onClick={() => { setFabExpanded(false); navigate('/capture'); }}
                id="fab-capture"
              >
                <span className="home-fab-mini-label">Capture</span>
                <span className="home-fab-mini-icon" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <Plus className="w-5 h-5" />
                </span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="home-fab-mini"
                onClick={() => { setFabExpanded(false); navigate('/ai-conversations'); }}
                id="fab-ai-chat"
              >
                <span className="home-fab-mini-label">AI Chat</span>
                <span className="home-fab-mini-icon" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                  <Sparkles className="w-5 h-5" />
                </span>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0 }}
                className="home-fab-mini"
                onClick={async () => {
                  setFabExpanded(false);
                  setLoading(true);
                  setError(null);
                  try {
                    await loadConversations(1);
                    await checkStorageStatus();
                    showToast(toast.success('Refreshed'));
                  } catch {
                    showToast(toast.error('Failed to refresh'));
                  } finally {
                    setLoading(false);
                  }
                }}
                id="fab-refresh"
              >
                <span className="home-fab-mini-label">Refresh</span>
                <span className="home-fab-mini-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                  <RefreshCw className="w-5 h-5" />
                </span>
              </motion.button>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Main FAB */}
          <button
            className={`home-fab-main ${fabExpanded ? 'is-expanded' : ''}`}
            onClick={() => setFabExpanded(!fabExpanded)}
            id="home-fab-main"
            title="Quick actions"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Backdrop to close FAB */}
      <AnimatePresence>
      {fabExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[1010] backdrop-blur-[2px] bg-black/10 dark:bg-black/40"
          onClick={() => setFabExpanded(false)}
        />
      )}
      </AnimatePresence>

      {/* ── Debug Panel (dev only) ── */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-[4.5rem] right-[4.5rem] z-[1020]">
          <button
            onClick={async () => {
              if (!debugPanelOpen) await collectDebugInfo();
              setDebugPanelOpen(!debugPanelOpen);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 shadow-lg active:scale-95 transition-all"
            title="Toggle debug panel"
          >
            <AlertCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {import.meta.env.DEV && debugPanelOpen && (
        <div className="fixed bottom-32 right-4 z-20 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Debug Panel</h3>
            <button onClick={() => setDebugPanelOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">×</button>
          </div>
          <div className="p-3 overflow-y-auto max-h-80 text-xs">
            {debugInfo
              ? <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">{JSON.stringify(debugInfo, null, 2)}</pre>
              : <p className="text-gray-500 dark:text-gray-400">Loading debug information…</p>
            }
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button onClick={collectDebugInfo} className="flex-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800">Refresh</button>
            <button
              onClick={() => { if (debugInfo) { navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)); showToast(toast.success('Copied')); } }}
              className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
            >Copy</button>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
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

      {/* ── Chat Input ── */}
      {activeChatId && (
        <div className="fixed bottom-0 left-0 right-0 z-[1040]">
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
