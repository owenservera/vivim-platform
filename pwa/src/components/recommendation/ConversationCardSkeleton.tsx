/**
 * Conversation Card Skeleton Component
 * Loading placeholder for conversation cards
 */

import './ConversationCard.css';

export function ConversationCardSkeleton() {
  return (
    <div className="conversation-card skeleton">
      <div className="card-header">
        <div className="skeleton-badge" />
        <div className="skeleton-score" />
        <div className="skeleton-bookmark" />
      </div>

      <div className="skeleton-reason" />

      <div className="skeleton-title" />

      <div className="skeleton-meta" />

      <div className="skeleton-quality" />

      <div className="skeleton-stats" />

      <div className="skeleton-actions" />
    </div>
  );
}
