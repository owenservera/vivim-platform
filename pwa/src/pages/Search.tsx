import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { IOSCard, IOSSkeletonList, EmptySearch } from '../components/ios';
import { CoreApi } from '../lib/core-api';
import { conversationService } from '../lib/service/conversation-service';
import { useIOSToast } from '../components/ios';
import type { Conversation } from '../types/conversation';

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Conversation[]>([]);
  const [serverResults, setServerResults] = useState<any[]>([]);
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
      setServerResults([]);
      return;
    }

    setLoading(true);

    try {
      if (searchMode === 'local') {
        const conversations = await conversationService.getAll();
        const filtered = conversations.filter(conv =>
          conv.title.toLowerCase().includes(query.toLowerCase()) ||
          conv.provider.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } else {
        const response = await CoreApi.search(query);
        setServerResults(response);
      }
    } catch (error) {
      showToast('Search failed', { variant: 'error' });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Search</h1>

        <div className="space-y-4">
          <IOSCard>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </IOSCard>

          <div className="flex gap-2">
            <button
              onClick={() => setSearchMode('local')}
              className={`px-4 py-2 rounded-lg ${searchMode === 'local' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Local
            </button>
            <button
              onClick={() => setSearchMode('server')}
              className={`px-4 py-2 rounded-lg ${searchMode === 'server' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Server
            </button>
          </div>

          {loading ? (
            <IOSSkeletonList count={3} />
          ) : searchMode === 'local' ? (
            results.length > 0 ? (
              results.map((conv) => (
                <Link key={conv.id} to={`/conversation/${conv.id}`}>
                  <IOSCard>
                    <h3 className="font-semibold">{conv.title}</h3>
                    <p className="text-sm text-gray-500">{conv.provider}</p>
                  </IOSCard>
                </Link>
              ))
            ) : searchQuery ? (
              <EmptySearch onAction={() => setSearchQuery('')} />
            ) : null
          ) : (
            serverResults.length > 0 ? (
              serverResults.map((result) => (
                <Link key={result.id} to={`/conversation/${result.id}`}>
                  <IOSCard>
                    <h3 className="font-semibold">{result.title}</h3>
                    <p className="text-sm text-gray-500">{result.provider}</p>
                  </IOSCard>
                </Link>
              ))
            ) : searchQuery ? (
              <EmptySearch onAction={() => setSearchQuery('')} />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
