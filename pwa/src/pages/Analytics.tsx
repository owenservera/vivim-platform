/**
 * Analytics Dashboard
 * Shows recommendation interaction patterns and insights
 */

import { useState, useEffect } from 'react';
import { useRecommendationAnalytics, STORAGE_KEYS } from '../lib/recommendation';
import { 
  RefreshCw, LayoutGrid, Eye, MousePointer2, TrendingUp, 
  Tag, Inbox, Shield, MousePointer, XCircle, Activity 
} from 'lucide-react';
import './Analytics.css';

interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export function Analytics() {
  useRecommendationAnalytics(); // Intentionally unused, but called for side effects
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [stats, setStats] = useState({
    totalFeeds: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalDismissions: 0,
    clickThroughRate: 0,
    topSources: [] as { source: string; count: number }[],
    recentActivity: [] as AnalyticsEvent[]
  });

  const loadAnalytics = () => {
    // Load events from localStorage
    const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    if (stored) {
      const allEvents: AnalyticsEvent[] = JSON.parse(stored);

      // Calculate stats
      const feeds = allEvents.filter(e => e.type === 'feed_generated');
      const impressions = allEvents.filter(e => e.type === 'recommendation_impression');
      const clicks = allEvents.filter(e => e.type === 'clicked');
      const dismissals = allEvents.filter(e => e.type === 'dismissed');

      // Calculate source distribution
      const sourceMap = new Map<string, number>();
      feeds.forEach(feedEvent => {
        const sources = feedEvent.data.sourceDistribution as Record<string, number> | undefined;
        if (sources) {
          Object.entries(sources).forEach(([source, count]) => {
            sourceMap.set(source, (sourceMap.get(source) || 0) + count);
          });
        }
      });
      const topSources = Array.from(sourceMap.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity
      const recentActivity = allEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      setStats({
        totalFeeds: feeds.length,
        totalImpressions: impressions.length,
        totalClicks: clicks.length,
        totalDismissions: dismissals.length,
        clickThroughRate: impressions.length > 0 ? (clicks.length / impressions.length) * 100 : 0,
        topSources,
        recentActivity
      });

      setEvents(allEvents);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleClearAnalytics = () => {
    localStorage.removeItem(STORAGE_KEYS.ANALYTICS);
    setEvents([]);
    setStats({
      totalFeeds: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalDismissions: 0,
      clickThroughRate: 0,
      topSources: [],
      recentActivity: []
    });
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const EventIcon = ({ type, className }: { type: string, className?: string }) => {
    switch (type) {
      case 'feed_generated': return <LayoutGrid className={className} />;
      case 'recommendation_impression': return <Eye className={className} />;
      case 'clicked': return <MousePointer className={className} />;
      case 'dismissed': return <XCircle className={className} />;
      default: return <Activity className={className} />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'feed_generated': return 'Generated feed';
      case 'recommendation_impression': return 'Viewed recommendation';
      case 'clicked': return 'Clicked recommendation';
      case 'dismissed': return 'Dismissed recommendation';
      default: return type;
    }
  };

  return (
    <div className="analytics-page">
      {/* Overview Stats */}
      <div className="analytics-overview">
        <div className="analytics-header">
          <h3>Overview</h3>
          <button
            onClick={loadAnalytics}
            className="icon-btn"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <LayoutGrid className="w-5 h-5 text-primary-500" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalFeeds}</div>
              <div className="stat-label">Feeds Generated</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Eye className="w-5 h-5 text-accent-500" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalImpressions}</div>
              <div className="stat-label">Impressions</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <MousePointer2 className="w-5 h-5 text-success-500" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalClicks}</div>
              <div className="stat-label">Clicks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp className="w-5 h-5 text-warning-500" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.clickThroughRate.toFixed(1)}%</div>
              <div className="stat-label">Click-through Rate</div>
            </div>
          </div>
        </div>

        {/* Top Sources */}
        {stats.topSources.length > 0 && (
          <div className="analytics-top-sources">
            <h4>Top Recommendation Sources</h4>
            <div className="source-tags">
              {stats.topSources.map(({ source, count }) => (
                <div key={source} className="source-tag">
                  <Tag className="w-3 h-3" />
                  <span>{source}: {count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="analytics-activity">
        <div className="analytics-header">
          <h3>Recent Activity</h3>
          {events.length > 0 && (
            <button
              onClick={handleClearAnalytics}
              className="text-btn"
            >
              Clear All
            </button>
          )}
        </div>

        {stats.recentActivity.length === 0 ? (
          <div className="empty-state-small">
            <Inbox className="w-10 h-10" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="activity-list">
            {stats.recentActivity.map((event, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <EventIcon type={event.type} className="w-4 h-4" />
                </div>
                <div className="activity-content">
                  <div className="activity-label">{getEventLabel(event.type)}</div>
                  <div className="activity-time">{formatTimestamp(event.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy Note */}
      <div className="analytics-privacy">
        <Shield className="w-5 h-5" />
        <p>All analytics data is stored locally on your device and never shared.</p>
      </div>
    </div>
  );
}