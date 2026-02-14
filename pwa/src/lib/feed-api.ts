/**
 * Feed API Client
 *
 * Client for interacting with the feed API
 */

import type { FeedResponse, EngagementEvent } from '../types/acu';
import { userFeedService } from './user-feed-service';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class FeedAPI {
  private baseUrl: string;
  private userId: string;
  private useLocalMode: boolean;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
    this.userId = 'default-user'; // TODO: Get from auth
    // Only use local mode if explicitly enabled via env var
    this.useLocalMode = import.meta.env.VITE_USE_LOCAL_FEED === 'true';
  }

  /**
   * Get personalized feed
   */
  async getFeed(options: {
    tab?: 'for-you' | 'following' | 'topics' | 'bookmarks';
    limit?: number;
    offset?: number;
    topic?: string;
    minQuality?: number;
  } = {}): Promise<FeedResponse> {
    // If in local mode, use the user feed service
    if (this.useLocalMode) {
      return userFeedService.getUserFeed(options);
    }

    const {
      tab = 'for-you',
      limit = 20,
      offset = 0,
      topic,
      minQuality = 60,
    } = options;

    const params = new URLSearchParams({
      tab,
      limit: limit.toString(),
      offset: offset.toString(),
      minQuality: minQuality.toString(),
    });

    if (topic) {
      params.append('topic', topic);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/feed?${params}`, {
      headers: {
        'x-user-id': this.userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Feed API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Track engagement event
   */
  async trackEngagement(
    acuId: string,
    action: EngagementEvent['action'],
    metadata?: EngagementEvent['metadata']
  ): Promise<void> {
    // If in local mode, use the user feed service
    if (this.useLocalMode) {
      return userFeedService.trackEngagement(acuId, action, metadata);
    }

    const event: Partial<EngagementEvent> = {
      acuId,
      action,
      metadata,
    };

    const response = await fetch(`${this.baseUrl}/api/v1/feed/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': this.userId,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('Failed to track engagement:', response.statusText);
      // Don't throw - engagement tracking is non-critical
    }
  }

  /**
   * Set user ID for requests
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Toggle local mode
   */
  setLocalMode(enabled: boolean) {
    this.useLocalMode = enabled;
  }
}

// Singleton instance
export const feedAPI = new FeedAPI();
