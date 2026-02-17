import './Analytics.css';
import { useState, useEffect } from 'react';
import { useRecommendationAnalytics, STORAGE_KEYS } from '../lib/recommendation';
import { 
  RefreshCw, LayoutGrid, Eye, MousePointer2, TrendingUp, 
  Tag, Inbox, Shield, MousePointer, XCircle, Activity,
  Trash2
} from 'lucide-react';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSEmptyState,
  useIOSToast,
  toast
} from '../components/ios';
import { cn } from '../lib/utils';

interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export const Analytics: React.FC = () => {
  useRecommendationAnalytics(); 
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const { toast: showToast } = useIOSToast();
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
    const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
    if (stored) {
      const allEvents: AnalyticsEvent[] = JSON.parse(stored);

      const feeds = allEvents.filter(e => e.type === 'feed_generated');
      const impressions = allEvents.filter(e => e.type === 'recommendation_impression');
      const clicks = allEvents.filter(e => e.type === 'clicked');
      const dismissals = allEvents.filter(e => e.type === 'dismissed');

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
    if (confirm('Clear all analytics data?')) {
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
      showToast(toast.success('Analytics cleared'));
    }
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
      case 'clicked': return <MousePointer2 className={className} />;
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
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title="Analytics" 
        rightAction={
          <button 
            onClick={loadAnalytics}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-6">
        {/* Overview */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Overview
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <IOSCard padding="sm" className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <LayoutGrid className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalFeeds}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Feeds Generated</div>
            </IOSCard>
            <IOSCard padding="sm" className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalImpressions}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Impressions</div>
            </IOSCard>
            <IOSCard padding="sm" className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <MousePointer2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalClicks}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Clicks</div>
            </IOSCard>
            <IOSCard padding="sm" className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.clickThroughRate.toFixed(1)}%</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">CTR</div>
            </IOSCard>
          </div>
        </section>

        {/* Top Sources */}
        {stats.topSources.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Top Sources
            </h3>
            <IOSCard padding="md" className="space-y-3">
              {stats.topSources.map(({ source, count }) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate capitalize">{source}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </IOSCard>
          </section>
        )}

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Recent Activity
            </h3>
            {events.length > 0 && (
              <button 
                onClick={handleClearAnalytics}
                className="text-[10px] font-bold text-red-500 uppercase tracking-tighter"
              >
                Clear All
              </button>
            )}
          </div>

          {stats.recentActivity.length === 0 ? (
            <IOSCard padding="lg" className="flex flex-col items-center justify-center text-center opacity-60">
              <Inbox className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No activity recorded yet</p>
            </IOSCard>
          ) : (
            <IOSCard padding="none" className="divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentActivity.map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <EventIcon type={event.type} className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getEventLabel(event.type)}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </IOSCard>
          )}
        </section>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-tight">
            Privacy First: All analytics data is stored locally on your device and never transmitted to our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;