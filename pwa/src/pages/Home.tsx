import './Home.css';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Bot, Sparkles, RefreshCw, Wifi, WifiOff, Database, AlertCircle, CheckCircle, CloudOff } from 'lucide-react';
import { conversationService } from '../lib/service/conversation-service';
import { unifiedRepository } from '../lib/db/unified-repository';
import { listConversationsForRecommendation, getForYouFeed } from '../lib/recommendation';
import { logger } from '../lib/logger';
import { apiClient } from '../lib/api';
import { dataSyncService } from '../lib/data-sync-service';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [page, setPage] = useState(1);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [circleManagerOpen, setCircleManagerOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<{
    ready: boolean;
    message?: string;
    totalConversations?: number;
  }>({ ready: false });
  const [debugPanelOpen, setDebugPanelOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [apiSource, setApiSource] = useState<'local' | 'api' | null>(null); // Track where data came from
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const { toast: showToast } = useIOSToast();
  const navigate = useNavigate();
  const capabilities = useFeatureCapabilities();
  const { isBookmarked } = useBookmarks();
  const { circles, refresh: refreshCircles } = useCircles();

  const loadConversations = useCallback(async (pageNum = 1) => {
    const loadId = `load_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    logger.info('HOME', `[${loadId}] ========== LOAD CONVERSATIONS START (page ${pageNum}) ==========`);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Loading timed out after 30 seconds')), 30000);
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

      // --- FALLBACK: If local storage is empty, fetch directly from API ---
      if (list.length === 0 && pageNum === 1 && navigator.onLine) {
        logger.info('HOME', `[${loadId}] Local storage empty, falling back to direct API fetch`);
        try {
          const apiResponse = await Promise.race([
            apiClient.get('/conversations', {
              params: { limit: 50, offset: 0, include_messages: true }
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('API fallback timed out')), 15000)
            )
          ]);

          const apiBatch: any[] = apiResponse?.data?.conversations || [];
          logger.info('HOME', `[${loadId}] API fallback returned ${apiBatch.length} conversations`);

          if (apiBatch.length > 0) {
            // Adapt API conversations to local Conversation type for display
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
              messages: (conv.messages || []).map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.parts || [],
                timestamp: msg.createdAt,
                metadata: msg.metadata || {},
                parts: msg.parts || []
              })),
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

            // Trigger background sync to populate local storage for next time
            dataSyncService.syncFullDatabase((progress) => {
              logger.info('HOME', `[Background Sync] ${progress.phase}: ${progress.message}`);
            }).then(result => {
              if (result.success) {
                logger.info('HOME', `[Background Sync] Complete: ${result.syncedConversations} conversations synced`);
                // Reload from local storage now that sync is done
                conversationService.getAllConversations().then(localList => {
                  if (localList.length > 0) setConversations(localList.slice(0, 10));
                }).catch(() => {});
              }
            }).catch(err => {
              logger.warn('HOME', `[Background Sync] Failed: ${err}`);
            });
          }
        } catch (apiFallbackError) {
          logger.warn('HOME', `[${loadId}] API fallback failed: ${apiFallbackError}`);
          // Don't throw – let the empty state show
        }
      } else {
        setApiSource('local');
      }
      
      const pageSize = 10;
      const start = (pageNum - 1) * pageSize;
      const pagedList = list.slice(start, start + pageSize);

      logger.info('HOME', `[${loadId}] Displaying ${pagedList.length} conversations (page ${pageNum})`);

      if (pageNum === 1) {
        setConversations(pagedList);
      } else {
        setConversations((prev) => [...prev, ...pagedList]);
      }

      const newPinnedIds = new Set<string>();
      const newArchivedIds = new Set<string>();
      
      for (const convo of pagedList) {
        try {
          const meta = await unifiedRepository.getConversation(convo.id);
          if (meta?.metadata?.isPinned) newPinnedIds.add(convo.id);
          if (meta?.metadata?.isArchived) newArchivedIds.add(convo.id);
        } catch {}
      }

      setPinnedIds(newPinnedIds);
      setArchivedIds(newArchivedIds);
      logger.info('HOME', `[${loadId}] Metadata loaded: ${newPinnedIds.size} pinned, ${newArchivedIds.size} archived`);

      logger.info('HOME', `[${loadId}] ========== LOAD CONVERSATIONS COMPLETE ==========`);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('HOME', `[${loadId}] LOAD FAILED: ${errorMsg}`, err instanceof Error ? err : new Error(String(err)));
      
      let userErrorMessage = 'Failed to load conversations';
      if (errorMsg.includes('Storage not initialized')) userErrorMessage = 'Storage is initializing. Please wait...';
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
      // Don't show error for recommendations as it's not critical
    }
  }, []);

  const checkStorageStatus = useCallback(async () => {
    // Add timeout to prevent infinite hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Storage status check timed out after 15 seconds')), 15000);
    });

    try {
      const mainStatus = await Promise.race([
        conversationService.getStorageStatus(),
        timeoutPromise
      ]);

      const stats = await unifiedRepository.getStats();

      const combinedStatus = {
        ready: mainStatus.isReady,
        message: mainStatus.isReady ? 'Storage ready' : 'Storage not ready',
        totalConversations: stats.total
      };

      setStorageStatus(combinedStatus);
      logger.info('HOME', `Storage status updated: ${JSON.stringify(combinedStatus)}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('HOME', `Failed to check storage status: ${errorMsg}`, err instanceof Error ? err : new Error(String(err)));

      // Set a safe default on error/timerout
      setStorageStatus({
        ready: false,
        message: errorMsg.includes('timed out')
          ? 'Storage check timed out. This may be due to browser privacy settings.'
          : `Failed to check storage: ${errorMsg}`
      });
    }
  }, []);

  const collectDebugInfo = useCallback(async () => {
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
        conversations: {
          count: conversations.length,
          loading,
          error
        },
        storage: storageStatus,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Try to get more detailed storage info
      try {
        const detailedStatus = await conversationService.getStorageStatus();
        info.storage = detailedStatus;
      } catch (err) {
        info.storageError = err instanceof Error ? err.message : String(err);
      }

      setDebugInfo(info);
      logger.info('HOME', 'Debug info collected', info);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.error('HOME', `Failed to collect debug info: ${errorMsg}`, err instanceof Error ? err : new Error(String(err)));
      setDebugInfo({ error: errorMsg });
    }
  }, [conversations, loading, error, storageStatus]);

  useEffect(() => {
    // Safety timeout to ensure loading is always cleared even if everything else fails
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        logger.warn('HOME', 'Safety timeout triggered - forcing loading to false');
        setLoading(false);
        setError('Loading timed out. Try refreshing the page or checking browser settings.');
      }
    }, 35000); // 35 seconds - slightly longer than the 30s timeout in loadConversations

    loadConversations(1);
    loadRecommendations();
    checkStorageStatus();

    return () => clearTimeout(safetyTimeout);
  }, [loadConversations, loadRecommendations, checkStorageStatus]);

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

  // Removed automatic sync from backend since full sync happens on login
  // All data should be available locally after login

  // Manual sync removed since full sync happens on login

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

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aPinned = pinnedIds.has(a.id);
      const bPinned = pinnedIds.has(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [conversations, pinnedIds]);

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

      {/* Storage Status Indicator */}
      {!storageStatus.ready && (
        <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-center">
            <Database className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              {storageStatus.message || 'Storage is initializing...'}
            </p>
          </div>
        </div>
      )}

      {storageStatus.ready && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
          <div className="flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-sm text-green-600 dark:text-green-400">
              Storage ready{storageStatus.totalConversations !== undefined ? ` (${storageStatus.totalConversations} conversations)` : ''}
            </p>
          </div>
        </div>
      )}

      {/* API Source Indicator - shows when data is from live API fallback */}
      {apiSource === 'api' && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center">
            <CloudOff className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Showing live data · syncing to local storage in background...
            </p>
          </div>
        </div>
      )}

      {/* Sync UI removed since full sync happens on login */}

      <div className="flex-1 py-4">
        {loading && conversations.length === 0 ? (
          <div className="space-y-4 px-2 sm:px-4">
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
          <div className="space-y-3 px-2 sm:px-4">
            {sortedConversations.map((convo) => (
              <ErrorBoundary
                key={convo.id}
                onError={(error) => {
                  logger.error('HOME', `Error rendering conversation card ${convo.id}`, error instanceof Error ? error : new Error(String(error)));
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
        <div className="px-2 sm:px-4 pb-4">
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

      {/* Manual Refresh Button */}
      <div className="fixed bottom-20 right-4 z-10">
        <button
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              await loadConversations(1);
              await checkStorageStatus();
              showToast(toast.success('Conversations refreshed'));
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              showToast(toast.error(`Failed to refresh: ${errorMsg}`));
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh conversations"
        >
          <RefreshCw className={`w-6 h-6 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Debug Panel Toggle Button - Development only */}
      {import.meta.env.DEV && (
      <div className="fixed bottom-20 right-20 z-10">
        <button
          onClick={async () => {
            if (!debugPanelOpen) {
              await collectDebugInfo();
            }
            setDebugPanelOpen(!debugPanelOpen);
          }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg"
          title="Toggle debug panel"
        >
          <AlertCircle className="w-6 h-6 text-white" />
        </button>
      </div>
      )}

      {/* Debug Panel - Development only */}
      {import.meta.env.DEV && debugPanelOpen && (
        <div className="fixed bottom-32 right-4 z-20 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Debug Panel</h3>
            <button
              onClick={() => setDebugPanelOpen(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ×
            </button>
          </div>
          <div className="p-3 overflow-y-auto max-h-80 text-xs">
            {debugInfo ? (
              <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-all">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Loading debug information...</p>
            )}
          </div>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              onClick={collectDebugInfo}
              className="flex-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                if (debugInfo) {
                  navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                  showToast(toast.success('Debug info copied to clipboard'));
                }
              }}
              className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Copy
            </button>
          </div>
        </div>
      )}

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
