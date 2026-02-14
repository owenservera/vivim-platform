/**
 * Similar Conversations Component
 * Shows related conversations when viewing a conversation
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getSimilarConversations,
  type RecommendationItem
} from '../../lib/recommendation';
import { 
  Clock, Calendar, Archive, Zap, BarChart2, 
  Code, FileText, ArrowRight, Sparkles 
} from 'lucide-react';
import './SimilarConversations.css';

interface SimilarConversationsProps {
  conversationId: string;
  className?: string;
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

export function SimilarConversations({ conversationId, className }: SimilarConversationsProps) {
  const [similar, setSimilar] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSimilar() {
      try {
        setLoading(true);

        const response = await getSimilarConversations({
          conversationId,
          limit: 5
        });

        if (response.status === 'success' && response.data) {
          setSimilar(response.data);
        }
      } catch (error) {
        console.error('[SimilarConversations] Error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSimilar();
  }, [conversationId]);

  if (similar.length === 0 && !loading) {
    return null;
  }

  return (
    <div className={`similar-conversations ${className || ''}`}>
      <div className="similar-header">
        <h3>Similar Conversations</h3>
        <span className="count">{similar.length} recommendations</span>
      </div>

      {loading ? (
        <div className="similar-loading">
          <div className="spinner-small" />
        </div>
      ) : (
        <div className="similar-list">
          {similar.slice(0, 3).map((item) => (
            <Link
              key={item.conversation.id}
              to={`/conversation/${item.conversation.id}`}
              className="similar-item"
            >
              <div className="similar-rank">#{similar.indexOf(item) + 1}</div>

              <div className="similar-content">
                <h4 className="similar-title">{item.conversation.title}</h4>

                <div className="similar-meta">
                  <span className="provider-badge text-xs uppercase tracking-tighter font-bold opacity-70">{item.conversation.provider}</span>
                  <span className="dot">•</span>
                  <span className="message-count">{item.conversation.stats.totalMessages} messages</span>
                  <span className="dot">•</span>
                  <div className="reason">
                    <RecommendationIcon name={item.reason.icon} className="reason-icon w-3 h-3" />
                    <span>{item.reason.text}</span>
                  </div>
                </div>

                <div className="similar-stats">
                  <span className="score-badge" title="Relevance score">
                    <BarChart2 className="w-3 h-3" />
                    {Math.round(item.score)}
                  </span>
                  {item.conversation.stats.totalCodeBlocks > 0 && (
                    <span className="stat-badge" title="Code blocks">
                      <Code className="w-3 h-3" />
                      {item.conversation.stats.totalCodeBlocks}
                    </span>
                  )}
                  {item.conversation.stats.totalWords > 1000 && (
                    <span className="stat-badge" title="Long form">
                      <FileText className="w-3 h-3" />
                      {(item.conversation.stats.totalWords / 1000).toFixed(1)}k
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}

          {similar.length > 3 && (
            <Link
              to="/for-you"
              className="similar-view-all"
            >
              View all recommendations
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}