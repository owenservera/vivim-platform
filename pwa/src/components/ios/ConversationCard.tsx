import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  GitFork, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Pin,
  Archive,
  Trash2,
  Copy,
  Sparkles,
  Zap,
  Loader2,
  X,
} from 'lucide-react';
import { IOSCard, IOSAvatar } from './index';
import { useIOSToast, toast } from './Toast';
import { 
  useBookmarks, 
  useFork, 
  useShare, 
  useAIActions, 
  useConversationActions,
  useFeatureCapabilities 
} from '../../lib/feature-hooks';
import { featureService } from '../../lib/feature-service';
import { cn } from '../../lib/utils';
import type { Conversation } from '../../types/conversation';
import type { AIAction } from '../../types/features';

interface ConversationCardProps {
  conversation: Conversation;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  className?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  onPinToggle?: (id: string, pinned: boolean) => void;
  onArchiveToggle?: (id: string, archived: boolean) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string, newId: string) => void;
  onFork?: (id: string, forkId: string) => void;
  onContinue?: (id: string) => void;
  onAIClick?: (action: AIAction, id: string) => void;
  onRefresh?: () => void;
  onShare?: (id: string) => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  variant = 'default',
  showActions = true,
  className,
  isPinned = false,
  isArchived = false,
  onPinToggle,
  onArchiveToggle,
  onDelete,
  onDuplicate,
  onFork,
  onContinue,
  onAIClick,
  ...props
}) => {
  // onRefresh and onShare are available in props but not used here
  const { onRefresh: _onRefresh, onShare: _onShare } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [localPinned, setLocalPinned] = useState(isPinned);
  const [localArchived, setLocalArchived] = useState(isArchived);
  const { toast: showToast } = useIOSToast();
  const capabilities = useFeatureCapabilities();
  
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { fork, forking } = useFork();
  const { generateLink, generating: sharing } = useShare();
  const { executing: aiExecuting } = useAIActions();
  const { duplicate, duplicating, deleteConversation, deleting } = useConversationActions();

  const isLocalBookmarked = isBookmarked(conversation.id);

  const providerIcons: Record<string, string> = {
    chatgpt: '🤖',
    claude: '✨',
    gemini: '💎',
    grok: '🚀',
    zai: '⚡',
    qwen: '🌐',
    deepseek: '🔍',
    kimi: '🎯',
    perplexity: '🔮',
    other: '💬',
    default: '💬',
  };

  const providerColors: Record<string, string> = {
    chatgpt: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    claude: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    gemini: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    grok: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    zai: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    perplexity: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    kimi: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };

  const handleContinue = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContinue?.(conversation.id);
  }, [conversation.id, onContinue]);

  const handleFork = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!capabilities.lineage) {
      showToast(toast.error('Forking is not available'));
      return;
    }

    const forkId = await fork(conversation.id, `Fork: ${conversation.title}`);
    if (forkId) {
      showToast(toast.success('Conversation forked successfully'));
      onFork?.(conversation.id, forkId);
    } else {
      showToast(toast.error('Failed to fork conversation'));
    }
  }, [conversation.id, conversation.title, fork, onFork, capabilities.lineage, showToast]);

  const handlePin = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !localPinned;
    setLocalPinned(newState);
    
    const success = newState 
      ? await featureService.pin(conversation.id)
      : await featureService.unpin(conversation.id);
    
    if (success) {
      showToast(toast.success(newState ? 'Pinned' : 'Unpinned'));
      onPinToggle?.(conversation.id, newState);
    } else {
      setLocalPinned(!newState);
      showToast(toast.error('Failed to update pin status'));
    }
  }, [conversation.id, localPinned, onPinToggle, showToast]);

  const handleArchive = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !localArchived;
    setLocalArchived(newState);
    
    const success = newState
      ? await featureService.archive(conversation.id)
      : await featureService.unarchive(conversation.id);
    
    if (success) {
      showToast(toast.success(newState ? 'Archived' : 'Unarchived'));
      onArchiveToggle?.(conversation.id, newState);
    } else {
      setLocalArchived(!newState);
      showToast(toast.error('Failed to update archive status'));
    }
  }, [conversation.id, localArchived, onArchiveToggle, showToast]);

  const handleBookmark = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const success = await toggleBookmark(conversation.id);
    if (success) {
      showToast(toast.success(isLocalBookmarked ? 'Bookmark removed' : 'Bookmarked'));
    } else {
      showToast(toast.error('Failed to update bookmark'));
    }
  }, [conversation.id, isLocalBookmarked, toggleBookmark, showToast]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!capabilities.sharing) {
      showToast(toast.error('Sharing is not available'));
      return;
    }

    setShowMenu(false);
    
    const link = await generateLink(conversation.id, {
      visibility: 'link',
      allowComments: true,
      allowForks: true,
      attributionRequired: true,
    });

    if (link) {
      try {
        await navigator.clipboard.writeText(link.url);
        showToast(toast.success('Share link copied to clipboard'));
      } catch {
        showToast(toast.info(`Share link: ${link.url}`));
      }
    } else {
      showToast(toast.error('Failed to generate share link'));
    }
  }, [conversation.id, generateLink, capabilities.sharing, showToast]);

  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    const success = await deleteConversation(conversation.id);
    if (success) {
      showToast(toast.success('Conversation deleted'));
      onDelete?.(conversation.id);
    } else {
      showToast(toast.error('Failed to delete conversation'));
    }
  }, [conversation.id, deleteConversation, onDelete, showToast]);

  const handleDuplicate = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newId = await duplicate(conversation.id);
    if (newId) {
      showToast(toast.success('Conversation duplicated'));
      onDuplicate?.(conversation.id, newId);
    } else {
      showToast(toast.error('Failed to duplicate conversation'));
    }
  }, [conversation.id, duplicate, onDuplicate, showToast]);

  const handleAISummarize = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!capabilities.aiActions) {
      showToast(toast.error('AI features are not available'));
      return;
    }

    setShowAISuggestions(false);
    onAIClick?.('summarize', conversation.id);
  }, [conversation.id, onAIClick, capabilities.aiActions, showToast]);

  const handleAIContinue = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAISuggestions(false);
    onContinue?.(conversation.id);
  }, [conversation.id, onContinue]);

  const handleAIFindRelated = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAISuggestions(false);
    onAIClick?.('find_related', conversation.id);
  }, [conversation.id, onAIClick]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();

      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (variant === 'compact') {
    return (
      <Link to={`/ai/conversation/${conversation.id}`} className="block">
        <IOSCard
          variant="outlined"
          padding="sm"
          className={cn('group', className)}
        >
          <div className="flex items-center gap-3">
            <IOSAvatar
              initials={providerIcons[conversation.provider] || providerIcons.default}
              size="sm"
              className={providerColors[conversation.provider] || providerColors.default}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {conversation.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {conversation.stats?.totalMessages ?? conversation.messages?.length ?? 0} messages · {formatDate(conversation.stats?.lastMessageAt || conversation.createdAt)}
              </p>
            </div>
            {localPinned && <Pin className="w-4 h-4 text-blue-500" />}
          </div>
        </IOSCard>
      </Link>
    );
  }

  const isActionLoading = forking || sharing || duplicating || deleting || aiExecuting;

  return (
    <div className={cn('relative', className)}>
      <Link to={`/ai/conversation/${conversation.id}`}>
        <IOSCard
          variant="default"
          padding="md"
          hoverable
          clickable
          className={cn(
            'group transition-all',
            localPinned && 'border-l-4 border-l-blue-500',
            localArchived && 'opacity-60'
          )}
        >
          <div className="flex items-start gap-4">
            <IOSAvatar
              initials={providerIcons[conversation.provider] || providerIcons.default}
              size="lg"
              showRing={localPinned}
              className={providerColors[conversation.provider] || providerColors.default}
            />
            
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {conversation.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {conversation.provider}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.stats?.totalMessages ?? conversation.messages?.length ?? 0} messages
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conversation.createdAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  {localPinned && <Pin className="w-4 h-4 text-blue-500 fill-current" />}
                  {isLocalBookmarked && <Bookmark className="w-4 h-4 text-amber-500 fill-current" />}
                  {localArchived && <Archive className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {showActions && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <button
                    onClick={handleContinue}
                    disabled={isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                  >
                    {aiExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Continue
                  </button>
                  
                  <button
                    onClick={handleFork}
                    disabled={!capabilities.lineage || isActionLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {forking ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitFork className="w-4 h-4" />}
                    Fork
                  </button>

                  <button
                    onClick={() => setShowAISuggestions(!showAISuggestions)}
                    disabled={!capabilities.aiActions}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI
                  </button>

                  <div className="flex-1" />

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    disabled={isActionLoading}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </IOSCard>
      </Link>

      {showAISuggestions && (
        <div className="absolute left-16 right-4 mt-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              AI Actions
            </p>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAISummarize}
              disabled={aiExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {aiExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Summarize
            </button>
            <button
              onClick={handleAIContinue}
              disabled={aiExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Continue
            </button>
            <button
              onClick={handleAIFindRelated}
              disabled={!capabilities.semanticSearch || aiExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              Find Related
            </button>
          </div>
        </div>
      )}

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute right-4 top-16 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-40 py-1">
            <button
              onClick={handlePin}
              disabled={isActionLoading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Pin className="w-4 h-4" />
              {localPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleBookmark}
              disabled={isActionLoading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Bookmark className={cn('w-4 h-4', isLocalBookmarked && 'fill-current')} />
              {isLocalBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            </button>
            <button
              onClick={handleShare}
              disabled={!capabilities.sharing || sharing}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Share
            </button>
            <button
              onClick={handleDuplicate}
              disabled={duplicating}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              Duplicate
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={handleArchive}
              disabled={isActionLoading}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              {localArchived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationCard;
