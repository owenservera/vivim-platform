/**
 * Bookmarks Page
 * Shows all favorited/saved conversations
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import {
  listConversationsForRecommendation,
  getSortedBookmarks,
  clearBookmarks,
  type Conversation
} from '../lib/recommendation';
import './ForYou.css';

interface BookmarkedConversation extends Conversation {
  bookmarkedAt: number;
}

export function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkedConversation[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all bookmarks? This cannot be undone.')) {
      clearBookmarks();
      setBookmarks([]);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="for-you-page">
      <header className="for-you-header">
        <div>
          <h1>Bookmarks</h1>
          <p className="subtitle">
            {bookmarks.length} saved conversation{bookmarks.length !== 1 ? 's' : ''}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-btn"
          >
            Clear All
          </button>
        )}
      </header>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading bookmarks...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookmarks.length === 0 && (
        <div className="empty-container">
          <div className="empty-icon">
            <Star className="w-12 h-12 opacity-20" />
          </div>
          <h2>No bookmarks yet</h2>
          <p>Save important conversations to find them later</p>
        </div>
      )}

      {/* Bookmarks List */}
      {!loading && bookmarks.length > 0 && (
        <div className="recommendations-list">
          {bookmarks.map((convo) => (
            <Link
              key={convo.id}
              to={`/conversation/${convo.id}`}
              className="bookmark-item"
            >
              <div className="bookmark-header">
                <div className="bookmark-icon">
                  <Star className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="bookmark-content">
                  <h4 className="bookmark-title">{convo.title}</h4>
                  <div className="bookmark-meta">
                    <span className="provider-badge">{convo.provider}</span>
                    <span className="dot">•</span>
                    <span>{convo.stats.totalMessages} messages</span>
                    <span className="dot">•</span>
                    <span className="bookmark-time">
                      Saved {formatTimestamp(convo.bookmarkedAt)}
                    </span>
                  </div>
                  {convo.metadata?.tags && (convo.metadata.tags as string[]).length > 0 && (
                    <div className="bookmark-tags">
                      {(convo.metadata.tags as string[]).slice(0, 3).map(tag => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}