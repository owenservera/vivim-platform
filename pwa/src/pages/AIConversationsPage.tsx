import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Filter,
  MessageSquare,
  Clock,
  Trash2,
  Pin,
  Sparkles,
  X,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Cpu,
  Zap,
  Bot
} from 'lucide-react';
import { useAIConversations } from '../hooks/useAIConversations';
import type { Conversation } from '../types/conversation';
import { RemuxDialog } from '../components/RemuxDialog';
import { ConversationChatView } from '../components/ConversationChatView';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSAvatar, 
  IOSSkeletonList,
  useIOSToast,
  toast
} from '../components/ios';
import { cn } from '../lib/utils';

interface AIConversationsPageProps {
  initialConversationId?: string;
}

export const AIConversationsPage: React.FC<AIConversationsPageProps> = ({ initialConversationId }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const activeId = initialConversationId || paramId;
  const {
    conversations,
    providers,
    selectedConversation,
    selectedId,
    isLoading,
    filters,
    setSearch,
    setProvider,
    setDateRange,
    setSortBy,
    selectConversation,
    deleteConversation,
    clearFilters,
  } = useAIConversations();

  const { toast: showToast } = useIOSToast();

  // Sync URL param with selected conversation
  React.useEffect(() => {
    if (activeId && activeId !== selectedId) {
      selectConversation(activeId);
    }
  }, [activeId, selectConversation, selectedId]);

  const [showFilters, setShowFilters] = useState(false);
  const [showRemux, setShowRemux] = useState(false);
  const [remuxConversation, setRemuxConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    navigate(`/ai/conversation/${id}`);
  };

  const handleRemix = (conversation: Conversation) => {
    setRemuxConversation(conversation);
    setShowRemux(true);
  };

  const handleNewChat = () => {
    navigate('/chat');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const hasActiveFilters = filters.search || filters.provider || filters.dateRange !== 'all' || filters.pinned !== null;

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar - Hidden on mobile if conversation selected */}
      <aside className={cn(
        "w-full md:w-80 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4 px-1">
            <h1 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Intelligence
            </h1>
            <button
              onClick={handleNewChat}
              className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all shadow-lg shadow-blue-500/20 active:scale-90"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-transparent focus:border-blue-500/30 rounded-xl text-sm focus:outline-none transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
              hasActiveFilters 
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Engine</label>
              <select
                value={filters.provider || ''}
                onChange={(e) => setProvider(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="">All Engines</option>
                {providers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Time Horizon</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">Infinity</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto ios-scrollbar-hide">
          {isLoading ? (
            <div className="p-6">
              <IOSSkeletonList count={6} />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center opacity-40">
              <MessageSquare size={40} className="mx-auto mb-4" />
              <p className="text-sm font-bold">No intelligence found</p>
              <button
                onClick={handleNewChat}
                className="mt-4 text-xs font-bold text-blue-500 uppercase tracking-widest"
              >
                Start New Session
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
              {conversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedId === conversation.id}
                  onSelect={() => handleSelectConversation(conversation.id)}
                  onDelete={() => deleteConversation(conversation.id)}
                  onRemix={() => handleRemix(conversation)}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content - Full width on mobile if selected */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950 transition-all",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <ConversationChatView
            conversation={selectedConversation}
            onBack={() => selectConversation(null)}
            onRemix={() => handleRemix(selectedConversation)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-white/10">
              <Cpu className="w-10 h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">
              Awaiting Selection
            </h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Activate a materialization from the repository to visualize the knowledge graph.
            </p>
            <IOSButton
              variant="primary"
              className="mt-8 rounded-full px-8 shadow-xl shadow-blue-500/20"
              onClick={handleNewChat}
              icon={<Zap className="w-4 h-4" />}
            >
              Start New Chat
            </IOSButton>
          </div>
        )}
      </main>

      {/* Remux Dialog */}
      {showRemux && (
        <RemuxDialog
          conversation={remuxConversation}
          onClose={() => {
            setShowRemux(false);
            setRemuxConversation(null);
          }}
          onRemix={(messages) => {
            navigate('/chat', { state: { remixedMessages: messages } });
            setShowRemux(false);
            setRemuxConversation(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Conversation List Item Component
 */
interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRemix: () => void;
  formatDate: (date: string) => string;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onRemix,
  formatDate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "px-4 py-4 cursor-pointer transition-all border-l-4",
        isSelected 
          ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-500" 
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform",
          isSelected && "scale-110",
          conversation.provider === 'zai' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
          conversation.provider === 'chatgpt' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        )}>
          <Bot className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-bold text-sm truncate",
              isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
            )}>
              {conversation.title}
            </h3>
            {conversation.metadata?.isPinned && (
              <Pin className="w-3 h-3 text-blue-500 fill-current" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
              {conversation.provider}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400">
              {conversation.stats.totalMessages} MSGS
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400">
              {formatDate(conversation.createdAt)}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 rounded-lg transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemix();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-3 uppercase tracking-widest"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Remix
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 uppercase tracking-widest"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Conversation List Item Component
 */
interface ConversationListItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRemix: () => void;
  formatDate: (date: string) => string;
}

const ConversationListItemGrid: React.FC<ConversationListItemProps> = ({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onRemix,
  formatDate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onSelect}
      className={`px-4 py-3 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-600/20 border-r-2 border-blue-500' : 'hover:bg-gray-800/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          conversation.provider === 'zai' ? 'bg-green-600/20 text-green-400' :
          conversation.provider === 'chatgpt' ? 'bg-blue-600/20 text-blue-400' :
          'bg-gray-700 text-gray-300'
        }`}>
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
            {conversation.metadata?.isPinned && (
              <Pin className="w-3 h-3 text-gray-500" />
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 capitalize">{conversation.provider}</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">{conversation.stats.totalMessages} messages</span>
            <span className="text-xs text-gray-600">•</span>
            <span className="text-xs text-gray-500">{formatDate(conversation.createdAt)}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-500 hover:text-white rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1 animate-slideIn">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemix();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Remix
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  onNewChat: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onNewChat }) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Conversation Selected</h2>
        <p className="text-gray-500 mb-6">
          Select a conversation from the sidebar or start a new chat with AI
        </p>
        <button
          onClick={onNewChat}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
    </div>
  );
};

export default AIConversationsPage;
