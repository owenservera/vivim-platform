import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, Sparkles, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { conversationService } from '../lib/service/conversation-service';
import { conversationSyncService } from '../lib/conversation-sync-service';
import { listConversationsForRecommendation, getForYouFeed } from '../lib/recommendation';
import { logger } from '../lib/logger';
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
import {
  useBookmarks,
  useCircles,
  useFeatureCapabilities
} from '../lib/feature-hooks';
import { featureService } from '../lib/feature-service';
import type { RecommendationItem } from '../lib/recommendation/types';
import type { Conversation } from '../types/conversation';
import type { AIResult, AIAction } from '../types/features';

export const Home: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [circleManagerOpen, setCircleManagerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast: showToast } = useIOSToast();
  const navigate = useNavigate();
  const capabilities = useFeatureCapabilities();
  const { isBookmarked } = useBookmarks();
  const { circles, refresh: refreshCircles } = useCircles();

  const loadConversations = useCallback(async (pageNum = 1) => {
    try {
      setError(null);
      setLoading(pageNum === 1); // Only show loading for initial load

      const list = await conversationService.getAllConversations();
      const pageSize = 10;
      const start = (pageNum - 1) * pageSize;
      const pagedList = list.slice(start, start + pageSize);

      if (pageNum === 1) {
        setConversations(pagedList);
      } else {
        setConversations((prev) => [...prev, ...pagedList]);
      }

      // Load metadata for conversations (with timeout protection)
      if (pagedList.length > 0) {
        const metadataPromises = pagedList.map(async (convo) => {
          try {
            const metadata = await featureService.getMetadata(convo.id);
            return { id: convo.id, metadata, error: null };
          } catch (err) {
            logger.error(`Failed to load metadata for conversation ${convo.id}`, { error: err });
            return { id: convo.id, metadata: null, error: err };
          }
        });

        const metadataResults = await Promise.all(metadataPromises);
        const newPinnedIds = new Set<string>();
        const newArchivedIds = new Set<string>();

        metadataResults.forEach(({ id, metadata }) => {
          if (metadata?.isPinned) newPinnedIds.add(id);
          if (metadata?.isArchived) newArchivedIds.add(id);
        });

        setPinnedIds(newPinnedIds);
        setArchivedIds(newArchivedIds);
      }

    } catch (err) {
      logger.error('Failed to load conversations', { error: err });
      setError('Failed to load conversations. Pull to retry.');
      showToast(toast.error('Failed to load conversations'));
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
      logger.error('Failed to load recommendations', { error: err });
      // Don't show error for recommendations as it's not critical
    }
  }, []);

  useEffect(() => {
    loadConversations(1);
    loadRecommendations();
  }, [loadConversations, loadRecommendations]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const syncFromBackend = async () => {
      if (!isOnline) {
        setSyncError('Offline - changes will sync when online');
        return;
      }

      try {
        setSyncing(true);
        setSyncError(null);

        // Check if sync is needed and perform sync
        const needsSync = await conversationSyncService.needsSync();
        if (needsSync) {
          const result = await conversationSyncService.syncConversations();
          
          if (result && result.success && result.synced > 0) {
            await loadConversations(1);
          } else if (result && Array.isArray(result.errors) && result.errors.length > 0) {
            setSyncError(result.errors.join('; '));
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
        setSyncError(`Sync failed: ${errorMessage}.`);
      } finally {
        setSyncing(false);
      }
    };
    syncFromBackend();
  }, [loadConversations, isOnline]);

  const handleManualSync = useCallback(async () => {
    if (!isOnline || syncing) return;

    try {
      setSyncing(true);
      setSyncError(null);

      const result = await conversationSyncService.syncConversations({ force: true });

      if (result && result.success) {
        if (result.synced > 0) {
          showToast(toast.success(`Synced ${result.synced} conversations`));
          await loadConversations(1);
        } else {
          showToast(toast.info('Already up to date'));
        }
      } else if (result) {
        showToast(toast.error(`Sync failed: ${result.errors.join('; ')}`));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
      showToast(toast.error(`Sync failed: ${errorMessage}`));
    } finally {
      setSyncing(false);
    }
  }, [isOnline, syncing, loadConversations, showToast, toast]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          loadConversations(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loading, page, loadConversations]);

  const handleContinue = useCallback((id: string) => {
    navigate(`/ai/conversation/${id}`);
  }, [navigate]);

  const handleFork = useCallback((id: string, forkId: string) => {
    logger.info('Conversation forked', { originalId: id, forkId });
    showToast(toast.success('Conversation forked'));
  }, [showToast]);

  const handlePinToggle = useCallback((id: string, pinned: boolean) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      if (pinned) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleArchiveToggle = useCallback((id: string, archived: boolean) => {
    setArchivedIds(prev => {
      const next = new Set(prev);
      if (archived) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleDuplicate = useCallback((_id: string, _newId: string) => {
    loadConversations(1);
  }, [loadConversations]);

  const handleAIClick = useCallback((action: AIAction, id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      if (action === 'continue_chat') {
        navigate(`/ai/conversation/${id}`);
      } else {
        setSelectedConversation(convo);
        setAiPanelOpen(true);
      }
    }
  }, [conversations, navigate]);

  const handleAIResult = useCallback((result: AIResult) => {
    logger.info('AI action completed', { action: result.action });
  }, []);

  const handleShare = useCallback((id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      setSelectedConversation(convo);
      setShareDialogOpen(true);
    }
  }, [conversations]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleShareToCircle = useCallback((id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (convo) {
      setSelectedConversation(convo);
      setCircleManagerOpen(true);
    }
  }, [conversations]);

  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      {recommendations.length > 0 && (
        <div className="py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 mb-3">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              For You
            </h2>
          </div>
          <div className="px-4">
            <IOSStories
              stories={recommendations.slice(0, 5).map((item) => ({
                id: item.conversation.id,
                name: item.conversation.title.substring(0, 10) || 'AI',
                initials: (item.conversation.title || 'AI').substring(0, 2).toUpperCase(),
                onClick: () => {
                  navigate(`/ai/conversation/${item.conversation.id}`);
                },
              }))}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </p>
        </div>
      )}

      {(syncing || syncError || !isOnline) && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing...</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline - changes saved locally</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>{syncError || 'Ready to sync'}</span>
              </>
            )}
          </div>
          {!isOnline && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              Retry
            </button>
          )}
        </div>
      )}

      <div className="flex-1 px-4 py-4">
        {loading && conversations.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Loading Conversations
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we fetch your conversations...
              </p>
            </div>
            <IOSSkeletonList count={5} showAvatar />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <WifiOff className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Failed to Load Conversations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                loadConversations(1);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <EmptyMessages
            onAction={() => {
              navigate('/chat');
            }}
          />
        ) : (
          <div className="space-y-3">
            {sortedConversations.map((convo) => (
              <ErrorBoundary
                key={convo.id}
                onError={(error) => {
                  logger.error(`Error rendering conversation card ${convo.id}`, { error });
                }}
              >
                <ConversationCard
                  conversation={convo}
                  isPinned={pinnedIds.has(convo.id)}
                  isArchived={archivedIds.has(convo.id)}
                  onContinue={handleContinue}
                  onFork={handleFork}
                  onPinToggle={handlePinToggle}
                  onArchiveToggle={handleArchiveToggle}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onAIClick={handleAIClick}
                  onShare={handleShare}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>

      {!loading && conversations.length === 0 && (
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-3">
            <IOSButton
              variant="primary"
              fullWidth
              icon={<Plus className="w-5 h-5" />}
              onClick={() => navigate('/chat')}
            >
              Start New Chat
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
                } catch (err) {
                  showToast(toast.error('Failed to load demo data'));
                  setLoading(false);
                }
              }}
            >
              Load Demo Data
            </IOSButton>
          </div>
        </div>
      )}

      <div ref={observerTarget} className="h-8 w-full" />

      {selectedConversation && (
        <>
          <ShareDialog
            conversationId={selectedConversation.id}
            conversationTitle={selectedConversation.title}
            open={shareDialogOpen}
            onClose={() => {
              setShareDialogOpen(false);
              setSelectedConversation(null);
            }}
          />
          <AIActionsPanel
            conversationId={selectedConversation.id}
            conversationTitle={selectedConversation.title}
            conversationContent={JSON.stringify(selectedConversation.messages)}
            open={aiPanelOpen}
            onClose={() => {
              setAiPanelOpen(false);
              setSelectedConversation(null);
            }}
            onResult={handleAIResult}
          />
          <CircleManager
            circles={circles}
            open={circleManagerOpen}
            onClose={() => {
              setCircleManagerOpen(false);
              setSelectedConversation(null);
            }}
            mode="share"
            conversationId={selectedConversation.id}
            onShareToCircle={async (circleId) => {
              const success = await featureService.shareToCircle(selectedConversation.id, circleId);
              if (success) {
                showToast(toast.success('Shared to circle'));
                setCircleManagerOpen(false);
              } else {
                showToast(toast.error('Failed to share to circle'));
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export const HomeWithProvider: React.FC = () => {
  return (
    <IOSToastProvider>
      <Home />
    </IOSToastProvider>
  );
};

export default Home;
