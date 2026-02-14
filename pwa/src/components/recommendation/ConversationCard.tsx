/**
 * Conversation Card Component
 * Displays a single recommended conversation
 */

import { useState, useEffect } from 'react';
import { qualityCalculator, getTimeDisplay, isBookmarked, toggleBookmark } from '../../lib/recommendation';
import type { RecommendationItem } from '../../lib/recommendation';
import { 
  BarChart2, Star, Clock, Calendar, Archive, Zap, 
  Code, FileText, Activity, BookOpen, X, HelpCircle, Sparkles 
} from 'lucide-react';
import './ConversationCard.css';

interface ConversationCardProps {
  item: RecommendationItem;
  rank: number;
  onClick: (conversationId: string) => void;
  onDismiss: (conversationId: string) => void;
}

// Dynamic Icon Component
const RecommendationIcon = ({ name, className }: { name: string, className?: string }) => {
  const icons: Record<string, any> = {
    clock: Clock,
    calendar: Calendar,
    archive: Archive,
    zap: Zap
  };
  const Icon = icons[name] || Sparkles;
  return <Icon className={className} />;
};

export function ConversationCard({ item, rank, onClick, onDismiss }: ConversationCardProps) {
  const { conversation, score, reason, featureContributions } = item;
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const updateBookmarkStatus = () => {
      setBookmarked(isBookmarked(conversation.id));
    };

    updateBookmarkStatus();
    // Set up interval to periodically check for bookmark changes
    const interval = setInterval(updateBookmarkStatus, 1000);

    return () => clearInterval(interval);
  }, [conversation.id]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = toggleBookmark(conversation.id);
    setBookmarked(newState);
  };

  const qualityBreakdown = qualityCalculator.getBreakdown(conversation);

  // Calculate time difference using useEffect to avoid calling Date.now() during render
  const [daysSince, setDaysSince] = useState(0);
  useEffect(() => {
    const updateDaysSince = () => {
      const calculatedDays = Math.floor((Date.now() - new Date(conversation.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      setDaysSince(calculatedDays);
    };

    updateDaysSince();
    // Update the time display every minute
    const interval = setInterval(updateDaysSince, 60000);

    return () => clearInterval(interval);
  }, [conversation.createdAt]);

  const timeDisplay = getTimeDisplay(daysSince);
  const providerDisplay = conversation.provider.charAt(0).toUpperCase() + conversation.provider.slice(1);

  return (
    <div className="conversation-card">
      <div className="card-header">
        <div className="rank-badge">#{rank}</div>
        <div className="score-display">
          <BarChart2 className="score-icon w-3.5 h-3.5" />
          <span className="score-value">{score.toFixed(0)}</span>
        </div>
        <button
          className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmark}
          title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          <Star className={`bookmark-icon w-4 h-4 ${bookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
        </button>
      </div>

      <div className="reason-banner">
        <RecommendationIcon name={reason.icon} className="reason-icon w-3 h-3" />
        <span className="reason-text">{reason.text}</span>
      </div>

      <h3 className="conversation-title">{conversation.title}</h3>

      <div className="conversation-meta">
        <span className="provider-badge text-xs uppercase tracking-tighter font-bold opacity-70">{providerDisplay}</span>
        <span className="meta-separator">•</span>
        <span className="message-count">{conversation.stats.totalMessages} messages</span>
        <span className="meta-separator">•</span>
        <span className="time-ago">
          <RecommendationIcon name={timeDisplay.icon} className="time-icon w-3 h-3" />
          {timeDisplay.text}
        </span>
      </div>

      {conversation.metadata?.tags && (conversation.metadata.tags as string[]).length > 0 && (
        <div className="tag-list">
          {(conversation.metadata.tags as string[]).slice(0, 3).map(tag => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>
      )}

      <div className="quality-badge" style={{ backgroundColor: qualityBreakdown.color }}>
        <Star className="quality-icon w-3 h-3 fill-white" />
        <span>Quality {qualityBreakdown.overall}/100</span>
      </div>

      <div className="stats-row">
        {conversation.stats.totalCodeBlocks > 0 && (
          <div className="stat-item">
            <Code className="stat-icon w-3 h-3" />
            <span>{conversation.stats.totalCodeBlocks} code blocks</span>
          </div>
        )}
        {conversation.stats.totalWords > 1000 && (
          <div className="stat-item">
            <FileText className="stat-icon w-3 h-3" />
            <span>{(conversation.stats.totalWords / 1000).toFixed(1)}k words</span>
          </div>
        )}
        {conversation.stats.totalMermaidDiagrams > 0 && (
          <div className="stat-item">
            <Activity className="stat-icon w-3 h-3" />
            <span>{conversation.stats.totalMermaidDiagrams} diagrams</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button
          className="btn-primary"
          onClick={() => onClick(conversation.id)}
        >
          <BookOpen className="w-4 h-4" />
          Read
        </button>
        <button
          className="btn-secondary"
          onClick={() => onDismiss(conversation.id)}
        >
          <X className="w-4 h-4" />
          Not interested
        </button>
      </div>

      <div className="feature-breakdown">
        <details>
          <summary className="breakdown-toggle">
            <HelpCircle className="w-3.5 h-3.5" />
            Why am I seeing this?
          </summary>
          <div className="breakdown-content">
            <div className="breakdown-section">
              <h4>Quality Score</h4>
              <div className="breakdown-metric">
                <span>Content Richness</span>
                <span>{qualityBreakdown.components.contentRichness.toFixed(0)}</span>
              </div>
              <div className="breakdown-metric">
                <span>Structure</span>
                <span>{qualityBreakdown.components.structuralDepth.toFixed(0)}</span>
              </div>
              <div className="breakdown-metric">
                <span>Interaction</span>
                <span>{qualityBreakdown.components.interaction.toFixed(0)}</span>
              </div>
            </div>
            <div className="breakdown-section">
              <h4>Feature Contributions</h4>
              <div className="breakdown-metric">
                <span>Quality</span>
                <span>{featureContributions.quality || 0}%</span>
              </div>
              <div className="breakdown-metric">
                <span>Recency</span>
                <span>{featureContributions.recency || 0}%</span>
              </div>
              <div className="breakdown-metric">
                <span>Topic Match</span>
                <span>{featureContributions.topicMatch || 0}%</span>
              </div>
              <div className="breakdown-metric">
                <span>Interaction</span>
                <span>{featureContributions.interaction || 0}%</span>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}