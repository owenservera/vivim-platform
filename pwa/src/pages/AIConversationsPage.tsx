/**
 * AI Conversations Page
 * Dedicated page for managing AI conversations with sidebar and chat view
 */

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
} from 'lucide-react';
import { useAIConversations } from '../hooks/useAIConversations';
import type { Conversation } from '../types/conversation';
import { RemuxDialog } from '../components/RemuxDialog';
import { ConversationChatView } from '../components/ConversationChatView';

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
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const hasActiveFilters = filters.search || filters.provider || filters.dateRange !== 'all' || filters.pinned !== null;

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-r border-gray-800 bg-gray-900/50">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              AI Conversations
            </h1>
            <button
              onClick={handleNewChat}
              className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={filters.search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
            {filters.search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasActiveFilters ? 'bg-blue-600/20 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-auto w-2 h-2 bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-800 space-y-3 animate-slideIn">
            {/* Provider Filter */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Provider</label>
              <select
                value={filters.provider || ''}
                onChange={(e) => setProvider(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">All Providers</option>
                {providers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <button
                onClick={handleNewChat}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <div className="py-2">
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {selectedConversation ? (
          <ConversationChatView
            conversation={selectedConversation}
            onBack={() => selectConversation(null)}
            onRemix={() => handleRemix(selectedConversation)}
          />
        ) : (
          <EmptyState onNewChat={handleNewChat} />
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
