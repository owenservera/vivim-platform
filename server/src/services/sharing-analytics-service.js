import { getPrismaClient } from '../lib/database.js';
import { logger } from '../lib/logger.js';

const log = logger.child({ module: 'sharing-analytics-service' });
const prisma = getPrismaClient();

export async function trackShareEvent({
  eventType,
  actorDid,
  intentId,
  contentRecordId,
  eventData = {}
}) {
  return prisma.analyticsEvent.create({
    data: {
      eventType,
      actorDid,
      intentId,
      contentRecordId,
      eventData,
      timestamp: new Date()
    }
  });
}

export async function getUserSharingMetrics(userDid, options = {}) {
  const { startDate, endDate } = options;
  
  const where = {
    actorDid: userDid,
    timestamp: {}
  };
  
  if (startDate) where.timestamp.gte = new Date(startDate);
  if (endDate) where.timestamp.lte = new Date(endDate);

  const events = await prisma.analyticsEvent.findMany({ where });

  const metrics = {
    totalShares: events.filter(e => e.eventType === 'SHARE_CREATED').length,
    totalViews: events.filter(e => e.eventType === 'SHARE_VIEWED').length,
    linkClicks: events.filter(e => e.eventType === 'LINK_CLICKED').length,
    sharesAccepted: events.filter(e => e.eventType === 'SHARE_ACCEPTED').length,
    sharesDeclined: events.filter(e => e.eventType === 'SHARE_DECLINED').length,
    sharesRevoked: events.filter(e => e.eventType === 'SHARE_REVOKED').length,
    contentSaved: events.filter(e => e.eventType === 'CONTENT_SAVED').length,
    contentForwarded: events.filter(e => e.eventType === 'CONTENT_FORWARDED').length
  };

  return metrics;
}

export async function getContentAnalytics(contentRecordId) {
  const events = await prisma.analyticsEvent.findMany({
    where: { contentRecordId },
    orderBy: { timestamp: 'desc' }
  });

  const uniqueViewers = new Set(
    events.filter(e => e.actorDid).map(e => e.actorDid)
  );

  return {
    totalViews: events.filter(e => e.eventType === 'SHARE_VIEWED').length,
    uniqueViewers: uniqueViewers.size,
    linkClicks: events.filter(e => e.eventType === 'LINK_CLICKED').length,
    saves: events.filter(e => e.eventType === 'CONTENT_SAVED').length,
    forwards: events.filter(e => e.eventType === 'CONTENT_FORWARDED').length,
    timeline: events.map(e => ({
      type: e.eventType,
      timestamp: e.timestamp,
      actor: e.actorDid
    }))
  };
}

export async function getUserActivity(userDid, options = {}) {
  const { limit = 50, eventTypes, startDate, endDate } = options;

  const where = { actorDid: userDid };
  if (eventTypes?.length) where.eventType = { in: eventTypes };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = new Date(startDate);
    if (endDate) where.timestamp.lte = new Date(endDate);
  }

  return prisma.analyticsEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit
  });
}

export async function generateUserInsights(userDid) {
  const recentEvents = await prisma.analyticsEvent.findMany({
    where: { actorDid: userDid },
    orderBy: { timestamp: 'desc' },
    take: 100
  });

  const insights = [];

  const shareCount = recentEvents.filter(e => e.eventType === 'SHARE_CREATED').length;
  const viewCount = recentEvents.filter(e => e.eventType === 'SHARE_VIEWED').length;
  
  if (shareCount > 0 && viewCount > 0) {
    const engagementRate = viewCount / shareCount;
    if (engagementRate > 5) {
      insights.push({
        insightType: 'RECOMMENDATION',
        title: 'High Engagement Rate',
        description: `Your shares have ${engagementRate.toFixed(1)}x views on average. Consider sharing more content.`,
        confidence: 0.8,
        relevanceScore: 0.9
      });
    }
  }

  const last24h = recentEvents.filter(e => 
    e.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  if (last24h.length > 10) {
    insights.push({
      insightType: 'PATTERN_DETECTED',
      title: 'Active Sharing Pattern',
      description: 'You have been very active in the last 24 hours.',
      confidence: 0.9,
      relevanceScore: 0.7
    });
  }

  if (insights.length > 0) {
    await prisma.insight.createMany({
      data: insights.map(i => ({
        ...i,
        userDid,
        generatedAt: new Date()
      }))
    });
  }

  return insights;
}

export async function getInsights(userDid, options = {}) {
  const { unreadOnly = false, limit = 20 } = options;
  
  const where = { userDid };
  if (unreadOnly) where.isRead = false;

  return prisma.insight.findMany({
    where,
    orderBy: { generatedAt: 'desc' },
    take: limit
  });
}

export async function markInsightRead(insightId) {
  return prisma.insight.update({
    where: { id: insightId },
    data: { isRead: true, readAt: new Date() }
  });
}

export async function dismissInsight(insightId) {
  return prisma.insight.update({
    where: { id: insightId },
    data: { isDismissed: true }
  });
}

export const sharingAnalyticsService = {
  trackShareEvent,
  getUserSharingMetrics,
  getContentAnalytics,
  getUserActivity,
  generateUserInsights,
  getInsights,
  markInsightRead,
  dismissInsight
};

export default sharingAnalyticsService;
