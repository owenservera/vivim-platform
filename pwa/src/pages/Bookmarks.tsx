import { useState, useEffect } from 'react';
import { 
  IOSTopBar, 
  ConversationCard, 
  EmptyBookmarks, 
  IOSSkeletonList,
  IOSButton,
  useIOSToast,
  toast
} from '../components/ios';
import {
  listConversationsForRecommendation,
  getSortedBookmarks,
  clearBookmarks,
  type Conversation
} from '../lib/recommendation';
import { Trash2 } from 'lucide-react';

interface BookmarkedConversation extends Conversation {
  bookmarkedAt: number;
}

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkedConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast: showToast } = useIOSToast();

  useEffect(() => {
    loadBookmarkedConversations();
  }, []);

  const loadBookmarkedConversations = async () => {
    try {
      setLoading(true);

      // Get bookmarked IDs with timestamps
      const savedBookmarks = getSortedBookmarks();

      if (savedBookmarks.length === 0) {
        setBookmarks([]);
        setLoading(false);
        return;
      }

      // Load all conversations
      const allConversations = await listConversationsForRecommendation({ limit: 100 });

      // Filter and merge with bookmark timestamps
      const bookmarked: BookmarkedConversation[] = savedBookmarks
        .map(saved => {
          const conversation = allConversations.find(c => c.id === saved.conversationId);
          return conversation ? { ...conversation, bookmarkedAt: saved.timestamp } : null;
        })
        .filter((c): c is BookmarkedConversation => c !== null)
        .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt);

      setBookmarks(bookmarked);
    } catch (error) {
      console.error('[Bookmarks] Error:', error);
      showToast(toast.error('Failed to load bookmarks'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all bookmarks? This cannot be undone.')) {
      clearBookmarks();
      setBookmarks([]);
      showToast(toast.success('Bookmarks cleared'));
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title="Bookmarks" 
        rightAction={
          bookmarks.length > 0 ? (
            <button 
              onClick={handleClearAll}
              className="text-red-500 font-medium text-sm px-2 py-1"
            >
              Clear
            </button>
          ) : undefined
        }
      />

      <div className="px-4 py-4">
        {loading ? (
          <IOSSkeletonList count={5} />
        ) : bookmarks.length === 0 ? (
          <EmptyBookmarks onAction={() => window.history.back()} />
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              {bookmarks.length} saved conversation{bookmarks.length !== 1 ? 's' : ''}
            </p>
            {bookmarks.map((convo) => (
              <ConversationCard
                key={convo.id}
                conversation={convo}
                variant="default"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookmarks;