/**
 * FeedCard Component
 * 
 * Displays a single feed item in the main feed
 */

import { useState, useEffect } from 'react';
import { feedAPI } from '../lib/feed-api';
import type { FeedItem } from '../types/acu';
import { 
  BarChart2, Star, Clock, Calendar, Archive, Zap, 
  Code, FileText, Activity, BookOpen, ExternalLink
} from 'lucide-react';

interface FeedCardProps {
  item: FeedItem;
  onClick?: (conversationId: string) => void;
  onEngagement?: (acuId: string, action: 'view' | 'click' | 'bookmark') => void;
}

export function FeedCard({ item, onClick, onEngagement }: FeedCardProps) {
  const { conversation, acu, score, reason } = item;
  const [bookmarked, setBookmarked] = useState(false);
  const [viewed, setViewed] = useState(false);

  useEffect(() => {
    // Track view when card becomes visible
    if (!viewed && acu) {
      setViewed(true);
      onEngagement?.(acu.id, 'view');
    }
  }, [viewed, acu, onEngagement]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked(!bookmarked);
    if (acu) {
      onEngagement?.(acu.id, 'bookmark');
    }
  };

  const handleClick = () => {
    if (onClick && conversation.id) {
      onClick(conversation.id);
    }
    if (acu) {
      onEngagement?.(acu.id, 'click');
    }
  };

  // Calculate time difference
  const daysSince = Math.floor((Date.now() - new Date(conversation.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const timeDisplay = daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince} days ago`;
  
  const providerDisplay = conversation.provider.charAt(0).toUpperCase() + conversation.provider.slice(1);

  return (
    <div className="feed-card bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {score && (
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <BarChart2 className="w-3 h-3" />
              <span>{score.toFixed(1)}</span>
            </div>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {providerDisplay}
          </span>
        </div>
        <button
          className={`p-1 rounded-full transition-colors ${
            bookmarked 
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
          }`}
          onClick={handleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Star className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {reason && (
        <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 flex items-center space-x-1">
          <Zap className="w-3 h-3" />
          <span>{reason}</span>
        </div>
      )}

      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {conversation.title}
      </h3>

      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timeDisplay}</span>
        </span>
        {conversation.messageCount && (
          <span className="flex items-center space-x-1">
            <FileText className="w-3 h-3" />
            <span>{conversation.messageCount} messages</span>
          </span>
        )}
        {conversation.totalWords && (
          <span>{Math.round(conversation.totalWords / 1000)}k words</span>
        )}
      </div>

      {conversation.metadata?.tags && (conversation.metadata.tags as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {(conversation.metadata.tags as string[]).slice(0, 3).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      {acu && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-2">
            {acu.content}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ACU Score: {acu.qualityOverall}/100
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {acu.type.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1">
          <BookOpen className="w-3 h-3" />
          <span>Read conversation</span>
        </button>
        <ExternalLink className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
}