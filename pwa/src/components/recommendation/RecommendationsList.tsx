/**
 * Recommendations List Component
 * Displays the list of recommendation cards with loading state
 */

import { memo } from 'react';
import { ConversationCard } from './ConversationCard';
import { ConversationCardSkeleton } from './ConversationCardSkeleton';
import type { RecommendationItem } from '../../lib/recommendation';
import { Filter } from 'lucide-react';
import '../../pages/ForYou.css';

interface RecommendationsListProps {
  recommendations: RecommendationItem[];
  loading: boolean;
  onConversationClick: (id: string) => void;
  onDismiss: (id: string) => void;
  selectedTopics?: string[];
}

export const RecommendationsList = memo(function RecommendationsList({
  recommendations,
  loading,
  onConversationClick,
  onDismiss,
  selectedTopics = []
}: RecommendationsListProps) {
  // Filter by selected topics if any
  const filtered = selectedTopics.length === 0
    ? recommendations
    : recommendations.filter(item => {
        const tags = item.conversation.metadata?.tags as string[] | undefined;
        if (!tags || tags.length === 0) return false;
        const itemTopics = tags.map(t => t.toLowerCase().trim());
        return selectedTopics.some(topic => itemTopics.includes(topic));
      });

  if (loading) {
    return (
      <div className="recommendations-list">
        {Array.from({ length: 3 }).map((_, index) => (
          <ConversationCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0 && recommendations.length > 0) {
    return (
      <div className="empty-container">
        <div className="empty-icon">
          <Filter className="w-12 h-12 opacity-20" />
        </div>
        <h2>No matching conversations</h2>
        <p>Try selecting different topics</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-list">
      {filtered.map((item, index) => (
        <ConversationCard
          key={item.conversation.id}
          item={item}
          rank={index + 1}
          onClick={onConversationClick}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
});