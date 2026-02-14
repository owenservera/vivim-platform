/**
 * For You Feed Page
 * Displays personalized recommendations using X-algorithm
 * Refactored for simplicity and performance
 */

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
import { AlertCircle, Inbox, PlayCircle, FlaskConical, Sliders, RefreshCw } from 'lucide-react';
import './ForYou.css';

export function ForYou() {
  const navigate = useNavigate();
  const analytics = useRecommendationAnalytics();

  // State
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useTestData, setUseTestData] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [allTopics, setAllTopics] = useState<{ name: string; count: number }[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Load user preferences with memoization
  const [_userPrefs, setUserPrefs] = useState<UserPreferences>(() => loadUserPreferences());

  // Load feed - memoized to prevent unnecessary re-renders
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load conversations
      let conversations;

      if (useTestData) {
        console.log('[ForYou] Using test data');
        conversations = generateTestConversations(25);
      } else {
        conversations = await listConversationsForRecommendation({ limit: 100 });

        if (conversations.length === 0) {
          setError('No conversations yet. Capture some conversations or enable test mode below.');
          setLoading(false);
          return;
        }
      }

      // Generate feed
      const response = await getForYouFeed(conversations, { limit: 20 });

      if (response.status === 'success' && response.data) {
        setRecommendations(response.data.recommendations);

        // Extract topics from conversations
        const topics = extractTopics(conversations);
        setAllTopics(topics);

        // Track analytics
        analytics.trackFeedGenerated({
          feedSize: response.data.recommendations.length,
          sourceDistribution: response.data.metadata.sources,
          diversityMetrics: response.data.metadata.diversityMetrics
        });

        // Track impressions
        analytics.trackImpressions(response.data.recommendations);
      } else {
        setError(response.error || 'Failed to generate feed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('[ForYou] Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  }, [useTestData, analytics]);

  // Initial load
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Handlers
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

  // Memoized handlers to prevent unnecessary re-renders
  const handleToggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    loadFeed();
  }, [loadFeed]);

  if (loading) {
    return (
      <div className="for-you-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Generating your feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="for-you-page">
        <div className="error-container">
          <div className="error-icon">
            <AlertCircle className="w-12 h-12 opacity-20" />
          </div>
          <h2>Unable to generate feed</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="for-you-page">
        <div className="empty-container">
          <div className="empty-icon">
            <Inbox className="w-12 h-12 opacity-20" />
          </div>
          <h2>No recommendations yet</h2>
          <p>Capture more conversations or enable test mode to see recommendations</p>
          <button
            className="btn-test-mode"
            onClick={() => setUseTestData(true)}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Use Test Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="for-you-page">
      <header className="for-you-header">
        <div>
          <h1>For You</h1>
          <p className="subtitle">Personalized discoveries from your library</p>
        </div>
        <div className="header-actions">
          {useTestData && (
            <span className="test-mode-badge">
              <FlaskConical className="w-3 h-3 mr-1" />
              Test Mode
            </span>
          )}
          <button
            className="icon-btn"
            onClick={handleToggleSettings}
            title="Recommendation settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

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
  );
}