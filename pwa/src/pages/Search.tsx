import './Search.css';
import { useEffect, useState, useCallback } from 'react';
import {
  IOSCard,
  IOSSkeletonList,
  EmptySearch,
  IOSTopBar,
  IOSSearchBar,
  ConversationCard,
  IOSToastProvider,
  useIOSToast,
  toast
} from '../components/ios';
import { CoreApi } from '../lib/core-api';
import { conversationService } from '../lib/service/conversation-service';
import { cn } from '../lib/utils';
import type { Conversation } from '../types/conversation';

export const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'local' | 'server'>('local');
  const { toast: showToast } = useIOSToast();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await CoreApi.checkCoreStatus();
      } catch {
        // Core offline
      }
    };
    checkStatus();
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      if (searchMode === 'local') {
        const conversations = await conversationService.getAllConversations();
        const filtered = conversations.filter(conv =>
          conv.title.toLowerCase().includes(query.toLowerCase()) ||
          conv.provider.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } else {
        const response = await CoreApi.search(query);
        // Map server results to Conversation type if needed
        setResults(response);
      }
    } catch (error) {
      showToast(toast.error('Search failed'));
    } finally {
      setLoading(false);
    }
  }, [searchMode, showToast]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, handleSearch]);

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar title="Search" />
      
      <div className="px-4 py-4 space-y-4">
        <IOSSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search conversations..."
          autoFocus
        />

        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(['local', 'server'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSearchMode(mode)}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize',
                searchMode === mode
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <IOSSkeletonList count={5} />
          ) : results.length > 0 ? (
            results.map((conv) => (
              <ConversationCard 
                key={conv.id} 
                conversation={conv} 
                variant="default"
              />
            ))
          ) : searchQuery ? (
            <EmptySearch onAction={() => setSearchQuery('')} />
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Type something to start searching {searchMode} conversations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
