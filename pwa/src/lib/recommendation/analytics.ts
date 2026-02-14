/**
 * Recommendation Analytics
 * Track user interactions with the recommendation system
 */

import type { RecommendationItem } from './types';

// ============================================================================
// Analytics Events
// ============================================================================

export interface RecommendationEvent {
  eventType: 'feed_generated' | 'recommendation_impression' | 'recommendation_clicked' | 'recommendation_dismissed';
  timestamp: number;
  userId?: string;
  data: {
    feedSize?: number;
    sourceDistribution?: Record<string, number>;
    conversationId?: string;
    rank?: number;
    score?: number;
    source?: string;
    reason?: string;
    timeToClick?: number;
  };
}

// ============================================================================
// Analytics Client
// ============================================================================

class RecommendationAnalytics {
  private enabled: boolean = true;
  private queue: RecommendationEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds

  constructor() {
    if (typeof window === 'undefined') {
      this.enabled = false;
      return;
    }

    // Start flush interval
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * Track feed generation
   */
  trackFeedGenerated(metadata: {
    feedSize: number;
    sourceDistribution: Record<string, number>;
    diversityMetrics: {
      topicSpread: number;
      timeSpread: number;
      providerSpread: number;
    };
  }) {
    this.track({
      eventType: 'feed_generated',
      timestamp: Date.now(),
      data: {
        feedSize: metadata.feedSize,
        sourceDistribution: metadata.sourceDistribution
      }
    });
  }

  /**
   * Track recommendation impression
   */
  trackRecommendationImpression(item: RecommendationItem, rank: number) {
    this.track({
      eventType: 'recommendation_impression',
      timestamp: Date.now(),
      data: {
        conversationId: item.conversation.id,
        rank,
        score: item.score,
        source: item.source,
        reason: item.reason.text
      }
    });
  }

  /**
   * Track batch impressions
   */
  trackImpressions(items: RecommendationItem[]) {
    items.forEach((item, index) => {
      this.trackRecommendationImpression(item, index + 1);
    });
  }

  /**
   * Track recommendation click
   */
  trackRecommendationClicked(
    conversationId: string,
    metadata: { rank: number; score: number; source: string }
  ) {
    this.track({
      eventType: 'recommendation_clicked',
      timestamp: Date.now(),
      data: {
        conversationId,
        ...metadata
      }
    });
  }

  /**
   * Track recommendation dismiss
   */
  trackRecommendationDismissed(
    conversationId: string,
    metadata: { rank: number; score: number; source: string }
  ) {
    this.track({
      eventType: 'recommendation_dismissed',
      timestamp: Date.now(),
      data: {
        conversationId,
        ...metadata
      }
    });
  }

  /**
   * Internal track method
   */
  private track(event: RecommendationEvent) {
    if (!this.enabled) return;

    this.queue.push(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.eventType, event.data);
    }
  }

  /**
   * Flush queued events
   */
  private async flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to your analytics backend
      await this.sendEvents(events);
    } catch (error) {
      console.error('[Analytics] Failed to flush events:', error);
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  /**
   * Send events to analytics backend
   */
  private async sendEvents(events: RecommendationEvent[]): Promise<void> {
    // For Phase 1: Events are stored in localStorage
    // TODO: Implement server analytics backend in Phase 2

    if (import.meta.env.DEV) {
      console.log('[Analytics] Flushing', events.length, 'events');
    }
  }

  /**
   * Disable analytics
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Enable analytics
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Clear queued events
   */
  clearQueue() {
    this.queue = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const analytics = new RecommendationAnalytics();

// ============================================================================
// React Hook for Analytics
// ============================================================================

import { useRef } from 'react';

export function useRecommendationAnalytics() {
  const impressionTracked = useRef<Set<string>>(new Set());

  /**
   * Track feed generation
   */
  const trackFeedGenerated = (metadata: {
    feedSize: number;
    sourceDistribution: Record<string, number>;
    diversityMetrics: {
      topicSpread: number;
      timeSpread: number;
      providerSpread: number;
    };
  }) => {
    analytics.trackFeedGenerated(metadata);
  };

  /**
   * Track impressions (once per conversation)
   */
  const trackImpressions = (items: RecommendationItem[]) => {
    items.forEach((item, index) => {
      const key = item.conversation.id;

      if (!impressionTracked.current.has(key)) {
        analytics.trackRecommendationImpression(item, index + 1);
        impressionTracked.current.add(key);
      }
    });
  };

  /**
   * Track click
   */
  const trackClick = (item: RecommendationItem, rank: number) => {
    analytics.trackRecommendationClicked(item.conversation.id, {
      rank,
      score: item.score,
      source: item.source
    });
  };

  /**
   * Track dismiss
   */
  const trackDismiss = (item: RecommendationItem, rank: number) => {
    analytics.trackRecommendationDismissed(item.conversation.id, {
      rank,
      score: item.score,
      source: item.source
    });
  };

  /**
   * Reset tracked impressions (call when feed regenerates)
   */
  const resetImpressions = () => {
    impressionTracked.current.clear();
  };

  return {
    trackFeedGenerated,
    trackImpressions,
    trackClick,
    trackDismiss,
    resetImpressions
  };
}

// ============================================================================
// Metrics Calculation
// ============================================================================

export function calculateMetrics(events: RecommendationEvent[]) {
  const impressionEvents = events.filter(e => e.eventType === 'recommendation_impression');
  const clickEvents = events.filter(e => e.eventType === 'recommendation_clicked');
  const dismissEvents = events.filter(e => e.eventType === 'recommendation_dismissed');

  const totalImpressions = impressionEvents.length;
  const totalClicks = clickEvents.length;
  const totalDismissals = dismissEvents.length;

  // Click-through rate
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Dismissal rate
  const dismissalRate = totalImpressions > 0 ? (totalDismissals / totalImpressions) * 100 : 0;

  // Average position of clicks
  const clickedPositions = clickEvents
    .map(e => e.data.rank)
    .filter((r): r is number => r !== undefined);

  const avgClickPosition = clickedPositions.length > 0
    ? clickedPositions.reduce((a, b) => a + b, 0) / clickedPositions.length
    : 0;

  // Source distribution
  const sourceDistribution: Record<string, number> = {};
  impressionEvents.forEach(event => {
    const source = event.data.source || 'unknown';
    sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
  });

  return {
    totalImpressions,
    totalClicks,
    totalDismissals,
    ctr: Math.round(ctr * 100) / 100,
    dismissalRate: Math.round(dismissalRate * 100) / 100,
    avgClickPosition: Math.round(avgClickPosition * 10) / 10,
    sourceDistribution
  };
}
