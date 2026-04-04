/**
 * Proactive Awareness Engine
 * 
 * Monitors for situations where the system should proactively speak up:
 * - Documentation updated since user last asked about topic
 * - Feature user requested is now available
 * - Known issue user hit has been fixed
 * - Repeated patterns detected
 * 
 * @created March 27, 2026
 */

import { PrismaClient } from '@prisma/client';
import { ProactiveInsight, AssembledCorpusContext } from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface MemoryService {
  searchMemories: (userId: string, input: any) => Promise<any>;
  updateMemory: (userId: string, memoryId: string, input: any) => Promise<any>;
}

export class ProactiveAwarenessEngine {
  private prisma: PrismaClient;
  private memoryService: MemoryService;

  constructor(prisma: PrismaClient, memoryService: MemoryService) {
    this.prisma = prisma;
    this.memoryService = memoryService;
  }

  /**
   * Check for proactive insights before response
   */
  async checkProactiveInsights(
    virtualUserId: string,
    currentQuery: string,
    corpusContext: AssembledCorpusContext
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      // 1. Check for unresolved issues from past conversations
      const unresolvedInsights = await this.checkUnresolvedIssues(virtualUserId, corpusContext);
      insights.push(...unresolvedInsights);

      // 2. Check for doc updates on topics user has asked about
      const updateInsights = await this.checkDocUpdates(virtualUserId);
      insights.push(...updateInsights);

      // 3. Check for feature releases matching past requests
      const featureInsights = await this.checkFeatureReleases(virtualUserId);
      insights.push(...featureInsights);

      // 4. Check for repeated patterns
      const patternInsights = await this.checkRepeatedPatterns(virtualUserId, currentQuery);
      insights.push(...patternInsights);

      // Sort by relevance and return top 3
      return insights
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3);
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Proactive insight check failed');
      return [];
    }
  }

  /**
   * Check for resolved unresolved issues
   */
  private async checkUnresolvedIssues(
    virtualUserId: string,
    corpusContext: AssembledCorpusContext
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      const unresolved = await this.memoryService.searchMemories(virtualUserId, {
        category: 'unresolved_issue',
        isActive: true,
        limit: 10,
      });

      for (const issue of unresolved.memories || []) {
        // Check if corpus has new info that might resolve it
        const resolution = await this.checkIfResolved(issue.content, corpusContext);
        if (resolution) {
          insights.push({
            type: 'ISSUE_RESOLVED',
            content: `Your previous issue "${issue.content}" may be resolved: ${resolution}`,
            relevance: 0.9,
            source: 'corpus_update',
          });
        }
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Unresolved issue check failed');
    }

    return insights;
  }

  /**
   * Check if issue might be resolved based on corpus content
   */
  private async checkIfResolved(
    issueContent: string,
    corpusContext: AssembledCorpusContext
  ): Promise<string | null> {
    // Simple heuristic: check if C2 content mentions resolution
    const c2Content = corpusContext.layers.C2.content || '';

    const resolutionKeywords = [
      'fixed',
      'resolved',
      'solved',
      'now available',
      'no longer',
      'updated to handle',
    ];

    for (const keyword of resolutionKeywords) {
      if (
        c2Content.toLowerCase().includes(keyword) &&
        c2Content.toLowerCase().includes(issueContent.toLowerCase().split(' ')[0])
      ) {
        return `Documentation mentions this is now ${keyword}`;
      }
    }

    return null;
  }

  /**
   * Check for documentation updates
   */
  private async checkDocUpdates(virtualUserId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      // Get user's topic interests
      const user = await this.prisma.virtualUser.findUnique({
        where: { id: virtualUserId },
        select: { topicInterests: true },
      });

      const topicInterests = (user?.topicInterests as string[]) || [];

      for (const topicSlug of topicInterests) {
        // Check for recent updates in this topic
        const updates = await this.prisma.corpusDocumentVersion.findMany({
          where: {
            document: {
              topic: {
                slug: topicSlug,
              },
            },
            publishedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          include: {
            document: {
              select: {
                title: true,
                topic: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { publishedAt: 'desc' },
          take: 1,
        });

        if (updates.length > 0) {
          const update = updates[0];
          insights.push({
            type: 'DOC_UPDATED',
            content: `The ${update.document.topic?.name || topicSlug} documentation was updated: ${update.changelog || 'New content available'}`,
            relevance: 0.7,
            source: 'corpus_update',
          });
        }
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Doc update check failed');
    }

    return insights;
  }

  /**
   * Check for feature releases matching requests
   */
  private async checkFeatureReleases(virtualUserId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      const featureRequests = await this.memoryService.searchMemories(virtualUserId, {
        tags: ['feature-request'],
        isActive: true,
        limit: 10,
      });

      for (const request of featureRequests.memories || []) {
        const released = await this.checkIfFeatureReleased(request.content);
        if (released) {
          insights.push({
            type: 'FEATURE_RELEASED',
            content: `The feature you requested ("${request.content}") is now available!`,
            relevance: 0.95,
            source: 'corpus_update',
          });

          // Mark the request memory as resolved
          await this.memoryService.updateMemory(virtualUserId, request.id, {
            tags: [...(request.tags || []), 'resolved'],
            metadata: {
              ...(request.metadata || {}),
              resolvedAt: new Date().toISOString(),
              resolvedBy: released.version,
            },
          });
        }
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Feature release check failed');
    }

    return insights;
  }

  /**
   * Check if requested feature is now released
   */
  private async checkIfFeatureReleased(
    requestContent: string
  ): Promise<{ released: boolean; version: string } | null> {
    try {
      // Search for recent releases mentioning the feature
      const releases = await this.prisma.corpusDocumentVersion.findMany({
        where: {
          changeType: 'minor',
          publishedAt: {
            gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Last 60 days
          },
        },
        include: {
          document: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 10,
      });

      for (const release of releases) {
        const changelog = (release.changelog || '').toLowerCase();
        const requestKeywords = requestContent.toLowerCase().split(' ').filter(w => w.length > 3);

        const matchCount = requestKeywords.filter(
          (keyword) => changelog.includes(keyword)
        ).length;

        if (matchCount >= 2) {
          return {
            released: true,
            version: release.version,
          };
        }
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Feature check failed');
    }

    return null;
  }

  /**
   * Check for repeated patterns
   */
  private async checkRepeatedPatterns(
    virtualUserId: string,
    currentQuery: string
  ): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];

    try {
      // Get recent conversations
      const conversations = await this.prisma.conversationIndex.findMany({
        where: { virtualUserId },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });

      // Check for repeated issues
      const issueCounts: Record<string, number> = {};
      for (const conv of conversations) {
        for (const issue of conv.issuesDiscussed || []) {
          issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        }
      }

      // If same issue mentioned 3+ times, suggest alternative approach
      for (const [issue, count] of Object.entries(issueCounts)) {
        if (count >= 3) {
          insights.push({
            type: 'RELATED_QUESTION',
            content: `I notice you've encountered "${issue}" multiple times. Would you like me to suggest a different approach or escalate to our support team?`,
            relevance: 0.75,
            source: 'pattern',
          });
        }
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Pattern check failed');
    }

    return insights;
  }
}
