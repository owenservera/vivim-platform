import './ForYou.css';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getForYouFeed,
  listConversationsForRecommendation,
  useRecommendationAnalytics,
  generateTestConversations,
  loadUserPreferences,
  updatePreference,
  dismissConversation,
  extractTopics,
  type RecommendationItem,
  type UserPreferences
} from '../lib/recommendation';
import { TopicFilter } from '../components/recommendation/TopicFilter';
import { SettingsPanel } from '../components/recommendation/SettingsPanel';
import { RecommendationsList } from '../components/recommendation/RecommendationsList';
import { 
  AlertCircle, 
  Inbox, 
  PlayCircle, 
  FlaskConical, 
  Sliders, 
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  IOSTopBar, 
  IOSCard, 
  IOSButton, 
  IOSSkeletonList,
  IOSErrorState
} from '../components/ios';
import { cn } from '../lib/utils';

export const ForYou: React.FC = () => {
  const navigate = useNavigate();
  const analytics = useRecommendationAnalytics();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allTopics, setAllTopics] = useState<{ name: string; count: number }[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [_userPrefs, setUserPrefs] = useState<UserPreferences>(() => loadUserPreferences());

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let conversations;

      if (useTestData) {
        conversations = generateTestConversations(25);
      } else {
        conversations = await listConversationsForRecommendation({ limit: 100 });

        if (conversations.length === 0) {
          setLoading(false);
          return;
        }
      }

      const response = await getForYouFeed(conversations, { limit: 20 });

      if (response.status === 'success' && response.data) {
        setRecommendations(response.data.recommendations);
        const topics = extractTopics(conversations);
        setAllTopics(topics);

        analytics.trackFeedGenerated({
          feedSize: response.data.recommendations.length,
          sourceDistribution: response.data.metadata.sources,
          diversityMetrics: response.data.metadata.diversityMetrics
        });

        analytics.trackImpressions(response.data.recommendations);
      } else {
        setError(response.error || 'Failed to generate feed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [useTestData, analytics]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleConversationClick = useCallback((conversationId: string) => {
    const item = recommendations.find(r => r.conversation.id === conversationId);
    if (item) {
      const rank = recommendations.indexOf(item) + 1;
      analytics.trackClick(item, rank);
    }
    navigate(`/conversation/${conversationId}`);
  }, [recommendations, analytics, navigate]);

  const handleDismiss = useCallback((conversationId: string) => {
    const item = recommendations.find(r => r.conversation.id === conversationId);
    if (item) {
      const rank = recommendations.indexOf(item) + 1;
      analytics.trackDismiss(item, rank);
    }

    dismissConversation(conversationId);
    setRecommendations(prev => prev.filter(r => r.conversation.id !== conversationId));
  }, [recommendations, analytics]);

  const handleResetDismissed = useCallback(() => {
    updatePreference('dismissed', []);
    const updated = loadUserPreferences();
    setUserPrefs(updated);
  }, []);

  const handleTopicToggle = useCallback((topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  }, []);

  const handleClearTopics = useCallback(() => {
    setSelectedTopics([]);
  }, []);

  const handlePrefsChange = useCallback((prefs: UserPreferences) => {
    setUserPrefs(prefs);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    loadFeed();
  }, [loadFeed]);

  const handleBack = () => navigate(-1);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="For You" />
        <div className="p-4 space-y-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium uppercase tracking-[0.2em] text-[10px]">Processing Engine...</p>
          </div>
          <IOSSkeletonList count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="For You" />
        <div className="flex-1 flex items-center justify-center p-4">
          <IOSErrorState 
            type="generic"
            title="Engine Error"
            description={error}
            action={{ label: 'Restart Engine', onClick: loadFeed }}
          />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
        <IOSTopBar title="For You" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <div className="max-w-xs">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Initialize Feed</h2>
            <p className="text-sm text-gray-500">Capture more intelligence or activate simulation mode to visualize recommendations.</p>
          </div>
          <IOSButton
            variant="primary"
            className="rounded-full px-8 shadow-xl shadow-blue-500/20"
            onClick={() => setUseTestData(true)}
            icon={<Zap className="w-4 h-4" />}
          >
            Activate Simulation
          </IOSButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-950 pb-20">
      <IOSTopBar 
        title="For You" 
        rightAction={
          <div className="flex items-center">
            <button 
              onClick={handleToggleSettings}
              className={cn(
                "p-2 rounded-full transition-colors",
                showSettings ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "text-gray-500"
              )}
            >
              <Sliders className="w-5 h-5" />
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-6">
        {showSettings && (
          <SettingsPanel
            userPrefs={loadUserPreferences()}
            onPrefsChange={handlePrefsChange}
            onResetDismissed={handleResetDismissed}
          />
        )}

        {!loading && allTopics.length > 0 && (
          <TopicFilter
            topics={allTopics}
            selectedTopics={selectedTopics}
            onTopicToggle={handleTopicToggle}
            onClearAll={handleClearTopics}
          />
        )}

        <RecommendationsList
          recommendations={recommendations}
          loading={loading}
          selectedTopics={selectedTopics}
          onConversationClick={handleConversationClick}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
};

export default ForYou;