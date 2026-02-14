# Sharing Analytics and Insights

## Overview

The Sharing Analytics system provides comprehensive visibility into sharing patterns, content reach, and engagement metrics. It enables users to understand how their content is being shared and consumed across the network while maintaining privacy through aggregation and anonymization.

## Analytics Architecture

The analytics system uses the dual-database architecture:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHARING ANALYTICS SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      ANALYTICS CORE                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │    │
│  │  │Event Collector│  │Metric Aggregator│  │  Insight Engine    │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌─────────────────────┬─────────────┴─────────────┬─────────────────────┐ │
│  │                     ▼                             ▼                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │              MASTER DATABASE (PostgreSQL)                    │    │ │
│  │  │  - AnalyticsEvent (all sharing events)                     │    │ │
│  │  │  - AggregatedMetrics (cross-user)                           │    │ │
│  │  │  - User analytics preferences                               │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  │                                                                     │ │
│  │  ┌──────────────────────────────────────────────────────────────┐    │ │
│  │  │              USER DATABASES (SQLite)                         │    │ │
│  │  │  - View counts (per user's content)                         │    │ │
│  │  │  - Share counts (per user's content)                        │    │ │
│  │  │  - Engagement metrics (per user's ACUs)                    │    │ │
│  │  └──────────────────────────────────────────────────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────┬─────────────┴─────────────┬─────────────────────┐ │
│  │                     ▼                             ▼                     │ │
│  │  ┌──────────────────────────┐  ┌────────────────────────────────────┐  │ │
│  │  │    USER-FACING ANALYTICS │  │    NETWORK ANALYTICS              │  │ │
│  │  │  ┌─────────────────────┐  │  │  ┌────────────────────────────┐  │  │ │
│  │  │  │  Dashboard          │  │  │  │  Traffic Analysis        │  │  │ │
│  │  │  │  Activity Log       │  │  │  │  Node Performance         │  │  │ │
│  │  │  │  Reach Insights     │  │  │  │  Content Distribution    │  │  │ │
│  │  │  │  Engagement Metrics │  │  │  │  Network Health          │  │  │ │
│  │  │  └─────────────────────┘  │  │  └────────────────────────────┘  │  │ │
│  │  └──────────────────────────┘  └────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHARING ANALYTICS SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      ANALYTICS CORE                                 │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │    │
│  │  │Event Collector│  │Metric Aggregator│  │  Insight Engine    │    │    │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│  ┌─────────────────────┬─────────────┴─────────────┬─────────────────────┐ │
│  │                     ▼                             ▼                     │ │
│  │  ┌──────────────────────────┐  ┌────────────────────────────────────┐  │ │
│  │  │    USER-FACING ANALYTICS │  │    NETWORK ANALYTICS              │  │ │
│  │  │  ┌─────────────────────┐  │  │  ┌────────────────────────────┐  │  │ │
│  │  │  │  Dashboard          │  │  │  │  Traffic Analysis          │  │  │ │
│  │  │  │  Activity Log       │  │  │  │  Node Performance          │  │  │ │
│  │  │  │  Reach Insights     │  │  │  │  Content Distribution      │  │  │ │
│  │  │  │  Engagement Metrics │  │  │  │  Network Health            │  │  │ │
│  │  │  └─────────────────────┘  │  │  └────────────────────────────┘  │  │ │
│  │  └──────────────────────────┘  └────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Event Collection

### Share Events

Events are collected in the Master Database (PostgreSQL) for cross-user analytics:

```typescript
// Events tracked for sharing analytics - stored in Master DB
interface ShareEvent {
  // Event identification
  eventId: string;
  eventType: ShareEventType;
  timestamp: Date;
  
  // Actor (reference to Master DB User)
  actorDid: string;
  
  // Content (reference to Master DB ContentRecord)
  contentId: string;
  contentType: string;
  
  // Audience
  audienceType: 'public' | 'circle' | 'users' | 'link';
  audienceSize: number;
  
  // Context
  sourceDevice: string;
  sourceIp?: string;
  userAgent?: string;
  
  // Additional data
  metadata: Record<string, any>;
}

type ShareEventType =
  | 'share_created'
  | 'share_viewed'
  | 'share_link_clicked'
  | 'share_accepted'
  | 'share_declined'
  | 'share_revoked'
  | 'share_expired'
  | 'content_saved'
  | 'content_forwarded';
```

### Collection Pipeline

```typescript
class AnalyticsCollector {
  constructor(
    private masterDb: PrismaClient,  // PostgreSQL
    private userDbManager: UserDatabaseManager  // SQLite
  ) {}
  
  // Event collection - stores in Master DB
  async collect(event: ShareEvent): Promise<void> {
    // Store in Master DB for cross-user analytics
    await this.masterDb.analyticsEvent.create({
      data: {
        eventType: event.eventType,
        actorDid: event.actorDid,
        contentRecordId: event.contentId,
        eventData: event.metadata,
        timestamp: event.timestamp
      }
    });
    
    // Update user-specific counts in their SQLite DB
    if (event.eventType === 'share_viewed') {
      await this.updateUserContentStats(event);
    }
  }
  
  // Batch processing
  async processBatch(events: ShareEvent[]): Promise<void> {
    // Batch insert to Master DB
    await this.masterDb.analyticsEvent.createMany({
      data: events.map(e => ({
        eventType: e.eventType,
        actorDid: e.actorDid,
        contentRecordId: e.contentId,
        eventData: e.metadata,
        timestamp: e.timestamp
      }))
    });
  }
  
  // Update user content stats in their SQLite database
  private async updateUserContentStats(event: ShareEvent): Promise<void> {
    // Get content owner from Master DB
    const contentRecord = await this.masterDb.contentRecord.findUnique({
      where: { id: event.contentId }
    });
    
    if (contentRecord) {
      // Update in owner's SQLite database
      const userDb = await this.userDbManager.getUserClient(contentRecord.ownerDid);
      
      if (event.contentType === 'conversation') {
        await userDb.conversation.update({
          where: { id: event.contentId },
          data: {
            viewCount: { increment: 1 },
            uniqueViewers: { increment: 1 } // Simplified
          }
        });
      }
    }
  }
  
  // Privacy processing
  applyPrivacyFilters(events: ShareEvent[]): AnonymizedEvent[] {
    // Remove PII, aggregate data
    return events.map(event => ({
      eventType: event.eventType,
      timestamp: event.timestamp,
      audienceType: event.audienceType,
      isAnonymized: true
    }));
  }
  
  // Storage
  async store(events: AnonymizedEvent[]): Promise<void> {
    await this.masterDb.analyticsEvent.createMany({
      data: events.map(e => ({
        eventType: e.eventType,
        eventData: e,
        isAnonymized: true
      }))
    });
  }
}
```

## Metrics Definition

### User-Level Metrics

```typescript
interface UserSharingMetrics {
  // Sharing activity
  totalShares: number;
  activeShares: number;
  revokedShares: number;
  expiredShares: number;
  
  // Audience breakdown
  publicShares: number;
  circleShares: number;
  directShares: number;
  linkShares: number;
  
  // Engagement
  totalViews: number;
  uniqueViewers: number;
  totalSaves: number;
  totalForwards: number;
  
  // Reach
  estimatedReach: number;
  averageEngagementRate: number;
  
  // Time-based
  sharesThisWeek: number;
  sharesThisMonth: number;
  mostActiveSharingHour: number;
}
```

### Content-Level Metrics

```typescript
interface ContentSharingMetrics {
  // Basic metrics
  contentId: string;
  shareCount: number;
  totalViews: number;
  uniqueViewers: number;
  
  // Audience
  audienceBreakdown: {
    public: number;
    circles: { circleId: string; viewers: number }[];
    users: { did: string; viewers: number }[];
    links: number;
  };
  
  // Engagement
  saves: number;
  forwards: number;
  avgViewDuration: number;
  
  // Timeline
  firstShareAt: Date;
  lastViewAt: Date;
  peakViewsAt: Date;
  viewsOverTime: TimeSeries;
}
```

### Network-Level Metrics

```typescript
interface NetworkAnalyticsMetrics {
  // Content distribution
  totalSharedContent: number;
  totalStorageUsed: number;
  replicationCoverage: number;
  
  // Traffic
  contentRequests: number;
  cacheHitRate: number;
  avgFetchLatency: number;
  
  // Network health
  activeNodes: number;
  contentAvailability: number;
  networkUptime: number;
}
```

## Aggregation Engine

### Time-Based Aggregation

```typescript
class MetricsAggregator {
  // Aggregation windows
  async aggregateHourly(metrics: RawMetrics[]): Promise<AggregatedMetrics>;
  async aggregateDaily(metrics: AggregatedMetrics[]): Promise<DailyMetrics>;
  async aggregateWeekly(metrics: DailyMetrics[]): Promise<WeeklyMetrics>;
  async aggregateMonthly(metrics: WeeklyMetrics[]): Promise<MonthlyMetrics>;
  
  // Real-time aggregation
  async getRealtimeMetrics(window: '1m' | '5m' | '15m'): Promise<RealtimeMetrics>;
}
```

### Privacy-Preserving Aggregation

```typescript
class PrivacyAwareAggregator {
  // Differential privacy
  applyDifferentialPrivacy(
    data: number[],
    epsilon: number
  ): number[];
  
  // K-anonymity
  ensureKAnonymity(
    data: DataPoint[],
    k: number
  ): DataPoint[];
  
  // Aggregation with noise
  async aggregateWithNoise(
    query: AnalyticsQuery,
    privacyBudget: number
  ): Promise<AggregatedResult>;
}
```

## Insight Engine

### Automatic Insights

```typescript
class InsightEngine {
  // Pattern detection
  async detectPatterns(metrics: UserSharingMetrics): Promise<Insight[]>;
  
  // Anomaly detection
  async detectAnomalies(metrics: TimeSeries): Promise<Anomaly[]>;
  
  // Recommendations
  async generateRecommendations(
    userId: string
  ): Promise<Recommendation[]>;
}
```

### Insight Types

```typescript
interface Insight {
  id: string;
  type: 'pattern' | 'anomaly' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  relevanceScore: number;
  suggestedAction?: string;
  data: any;
}
```

### Example Insights

| Insight | Description | Action |
|---------|-------------|--------|
| Peak Sharing Time | You share most content at 3 PM | Schedule important shares for this time |
| High Engagement | Content shared to Circle X gets 2x views | Consider sharing more to this circle |
| Link Performance | 40% of link clicks come from mobile | Optimize preview for mobile |
| Expiring Content | 5 shares expire in 7 days | Review and renew important shares |
| Privacy Alert | Some shares are reaching unintended audiences | Review audience settings |

## User Dashboard

### Dashboard Components

```typescript
interface AnalyticsDashboard {
  // Overview section
  overview: {
    totalShares: number;
    totalViews: number;
    activeShares: number;
    engagementRate: number;
  };
  
  // Charts
  charts: {
    sharingOverTime: ChartConfig;
    audienceBreakdown: ChartConfig;
    topContent: ChartConfig;
    reachMap: ChartConfig;
  };
  
  // Recent activity
  recentActivity: ActivityItem[];
  
  // Insights
  insights: Insight[];
}
```

### Activity Log

```typescript
interface ActivityLog {
  // User's sharing activity
  getUserActivity(
    userDid: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: ShareEventType[];
      limit?: number;
    }
  ): Promise<ActivityItem[]>;
}

interface ActivityItem {
  id: string;
  type: ShareEventType;
  timestamp: Date;
  contentPreview: string;
  audienceSummary: string;
  result?: 'success' | 'failed';
  metadata?: Record<string, any>;
}
```

## Reach Analysis

### Reach Calculation

```typescript
interface ReachAnalyzer {
  // Calculate total reach
  calculateReach(shareId: string): Promise<ReachMetrics>;
  
  // Breakdown by audience type
  getReachBreakdown(shareId: string): Promise<ReachBreakdown>;
  
  // Track individual reach
  trackReach(shareId: string, viewerDid: string): Promise<void>;
  
  // Viral reach (shares of shares)
  calculateViralReach(shareId: string): Promise<ViralMetrics>;
}
```

### Reach Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                        REACH BREAKDOWN                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Primary Reach: 150                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ████████████████████████████████████████░░░░░░░░░░░░░░░░░░ │ │
│  │ 150 direct viewers                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Secondary Reach: 45 (shares of your share)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│  │ 45 people reached through reshares                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Total Unique Reach: 180                                        │
│                                                                  │
│  Graph:                                                         │
│                                                                  │
│     [You]                                                      │
│       │                                                        │
│       ├────▶ Circle A (80 views)                               │
│       │         └─▶ User A1 (share)                           │
│       │         └─▶ User A2 (share)                           │
│       │                                                        │
│       ├────▶ Circle B (45 views)                              │
│       │         └─▶ User B1 (share)                           │
│       │                                                        │
│       ├────▶ Direct (20 views)                                │
│       │         └─▶ Link clicks                               │
│       │                                                        │
│       └────▶ Public (5 views)                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Privacy Controls

### User Privacy Settings

```typescript
interface AnalyticsPrivacySettings {
  // Tracking preferences
  trackViews: boolean;                    // Track when people view
  trackLocation: boolean;                 // Track approximate location
  trackDevice: boolean;                  // Track device types
  
  // Data retention
  retentionPeriod: '30d' | '90d' | '1y' | 'forever';
  
  // Sharing preferences
  shareAnalyticsWithNetwork: boolean;     // Contribute to network analytics
  
  // Anonymization
  anonymizeMyActivity: boolean;          // Anonymize in shared insights
}
```

### Privacy-Preserving Queries

```typescript
class PrivacyPreservingQuery {
  // Query with minimum threshold
  async queryWithThreshold(
    query: AnalyticsQuery,
    minCount: number
  ): Promise<AggregatedResult>;
  
  // Query with noise
  async queryWithNoise(
    query: AnalyticsQuery,
    noiseLevel: number
  ): Promise<AggregatedResult>;
  
  // Query with time delay (for small counts)
  async delayedQuery(
    query: AnalyticsQuery,
    delayMs: number
  ): Promise<AggregatedResult>;
}
```

## API Endpoints

### User Analytics

```typescript
// Get user sharing metrics
GET /api/v1/analytics/user/:did/sharing

// Get user engagement metrics
GET /api/v1/analytics/user/:did/engagement

// Get activity log
GET /api/v1/analytics/user/:did/activity

// Get insights
GET /api/v1/analytics/user/:did/insights
```

### Content Analytics

```typescript
// Get content metrics
GET /api/v1/analytics/content/:contentId

// Get content reach
GET /api/v1/analytics/content/:contentId/reach

// Get content timeline
GET /api/v1/analytics/content/:contentId/timeline
```

### Network Analytics

```typescript
//
GET /api Get network overview/v1/analytics/network/overview

// Get content distribution
GET /api/v1/analytics/network/distribution

// Get node performance
GET /api/v1/analytics/network/nodes/:nodeId
```

## Real-Time Analytics

### WebSocket Updates

```typescript
interface AnalyticsWebSocket {
  // Subscribe to real-time updates
  subscribe(channel: 'user' | 'content' | 'network'): AsyncIterator<AnalyticsEvent>;
  
  // Events
  onShareCreated(event: ShareCreatedEvent): void;
  onContentViewed(event: ContentViewedEvent): void;
  onMetricsUpdated(event: MetricsUpdatedEvent): void;
}
```

### Real-Time Dashboard Metrics

```typescript
interface RealtimeDashboardMetrics {
  // Current active users
  activeUsers: number;
  activeUsersChange: number; // vs last period
  
  // Current shares
  sharesThisHour: number;
  sharesThisHourChange: number;
  
  // Current views
  viewsThisHour: number;
  viewsThisHourChange: number;
  
  // Network
  networkLatency: number;
  networkRequestsPerSecond: number;
}
```

## Integration with Other Systems

### Integration with Sharing Intent

```typescript
// Track share creation
analytics.track('share_created', {
  intentId: intent.id,
  audienceType: intent.audience.type,
  permissions: intent.permissions,
  contentType: content.type
});

// Track share outcomes
analytics.track('share_result', {
  intentId: intent.id,
  result: 'success' | 'failed',
  error?: string,
  duration: durationMs
});
```

### Integration with Network

```typescript
// Track network performance
analytics.track('network_request', {
  contentId: contentId,
  latency: latencyMs,
  success: success,
  nodeId: nodeId
});

// Track storage metrics
analytics.track('storage_metrics', {
  replicationFactor: factor,
  storageUsed: bytes,
  availableSpace: bytes
});
```

## Data Retention

### Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Raw events | 30 days | Processing |
| Aggregated metrics | 1 year | Analysis |
| User insights | 1 year | UX |
| Network metrics | 2 years | Infrastructure |
| Trend data | Forever | Historical |

### Data Cleanup

```typescript
class DataRetentionManager {
  async cleanup(): Promise<CleanupResult> {
    // Delete raw events older than 30 days
    const deletedEvents = await this.deleteOldEvents(30);
    
    // Archive old metrics
    const archivedMetrics = await this.archiveOldMetrics(365);
    
    // Update retention flags
    await this.updateRetentionFlags();
    
    return { deletedEvents, archivedMetrics };
  }
}
```

## Conclusion

The Sharing Analytics system provides comprehensive visibility into VIVIM's sharing ecosystem while respecting user privacy. By implementing:

- Granular event collection
- Privacy-preserving aggregation
- Automatic insight generation
- Real-time updates
- User-controlled privacy settings

The system enables users to understand their sharing impact while maintaining control over their data. Network-level analytics provide infrastructure visibility without compromising individual user privacy.

This analytics layer complements the sharing intent, publishing pipeline, and network orchestration systems to create a complete sharing experience.
