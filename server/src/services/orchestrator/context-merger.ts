/**
 * Dual Context Merger
 * 
 * Merges corpus and user context into a single coherent system prompt.
 * Handles deduplication and conflict resolution.
 * 
 * @created March 27, 2026
 */

import {
  AssembledCorpusContext,
  MergedContext,
  AssembledContext,
} from '../../types/corpus';
import { logger } from '../../../lib/logger';

interface CompressedHistory {
  content: string;
  tokenCount: number;
}

export class DualContextMerger {
  /**
   * Merge corpus and user contexts
   */
  async merge(
    corpusContext: AssembledCorpusContext,
    userContext: AssembledContext,
    weights: { corpus: number; user: number },
    conversationHistory: CompressedHistory,
    orchestratorInstructions: string
  ): Promise<MergedContext> {
    const startTime = Date.now();
    const sections: string[] = [];

    try {
      // 1. Orchestrator meta-instructions (always first)
      sections.push(orchestratorInstructions);

      // 2. Company identity (C0) - always present
      if (corpusContext.layers.C0.content) {
        sections.push(corpusContext.layers.C0.content);
      }

      // 3. User identity (L0) - if available
      if (userContext.layers?.L0?.content) {
        sections.push(`## About This User\n${userContext.layers.L0.content}`);
      }

      // 4. User preferences (L1) - if available
      if (userContext.layers?.L1?.content) {
        sections.push(`## User Preferences\n${userContext.layers.L1.content}`);
      }

      // 5. Corpus topic framework (C1)
      if (corpusContext.layers.C1.content) {
        sections.push(`## Topic Context\n${corpusContext.layers.C1.content}`);
      }

      // 6. PRIMARY: Retrieved knowledge (C2) - the main corpus payload
      if (corpusContext.layers.C2.content) {
        sections.push(
          `## Relevant Documentation\n` +
          `Use the following documentation to answer the user's question. ` +
          `Cite sections when possible.\n\n` +
          corpusContext.layers.C2.content
        );
      }

      // 7. Supporting corpus context (C3)
      if (corpusContext.layers.C3.content) {
        sections.push(`## Additional Reference\n${corpusContext.layers.C3.content}`);
      }

      // 8. User context - JIT memories (L5)
      if (userContext.layers?.L5?.content) {
        sections.push(
          `## User History & Context\n` +
          `The following is known about this user from previous interactions:\n\n` +
          userContext.layers.L5.content
        );
      }

      // 9. Freshness / changelog (C4)
      if (corpusContext.layers.C4.content) {
        sections.push(`## Recent Updates\n${corpusContext.layers.C4.content}`);
      }

      // 10. Conversation history (shared)
      if (conversationHistory?.content) {
        sections.push(`## Conversation History\n${conversationHistory.content}`);
      }

      // 11. Deduplication pass
      const deduped = await this.deduplicateContent(sections);

      // 12. Conflict resolution
      const conflictNotes = await this.detectCorpusUserConflicts(corpusContext, userContext);
      if (conflictNotes) {
        deduped.push(`## Note\n${conflictNotes}`);
      }

      const systemPrompt = deduped.join('\n\n---\n\n');

      logger.info(
        { sections: sections.length, assemblyTimeMs: Date.now() - startTime },
        'Context merged'
      );

      return {
        systemPrompt,
        metadata: {
          totalTokens: this.estimateTokens(systemPrompt),
          corpusTokens: corpusContext.totalTokens,
          userTokens: userContext.budget?.totalUsed || 0,
          historyTokens: conversationHistory?.tokenCount || 0,
          corpusConfidence: corpusContext.confidence,
          userMemoriesUsed: userContext.metadata?.memoriesCount || 0,
          citations: corpusContext.citations,
          engineWeights: weights,
          avatarUsed: userContext.metadata?.avatar || 'STRANGER',
          intentDetected: userContext.metadata?.intent || 'CORPUS_QUERY',
          assemblyTimeMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Context merge failed');
      throw error;
    }
  }

  /**
   * Deduplicate content across sections
   */
  private async deduplicateContent(sections: string[]): Promise<string[]> {
    // Simple deduplication: remove exact duplicate sections
    const seen = new Set<string>();
    const deduped: string[] = [];

    for (const section of sections) {
      const normalized = section.trim().toLowerCase();
      if (!seen.has(normalized) && section.trim().length > 0) {
        seen.add(normalized);
        deduped.push(section);
      }
    }

    return deduped;
  }

  /**
   * Detect conflicts between corpus and user context
   */
  private async detectCorpusUserConflicts(
    corpus: AssembledCorpusContext,
    user: AssembledContext
  ): string | null {
    // Check for plan-level conflicts
    const userPlan = this.extractPlanFromUserContext(user);
    const corpusPlan = this.extractPlanFromCorpusContext(corpus);

    if (userPlan && corpusPlan && userPlan !== corpusPlan) {
      return `The user is known to be on the ${userPlan} plan. ` +
        `The retrieved documentation may reference ${corpusPlan} plan features. ` +
        `Tailor your response to the user's actual plan.`;
    }

    return null;
  }

  /**
   * Extract plan from user context
   */
  private extractPlanFromUserContext(user: AssembledContext): string | null {
    // Look for plan mentions in user context layers
    const layers = [
      user.layers?.L0?.content,
      user.layers?.L1?.content,
      user.layers?.L5?.content,
    ].filter(Boolean);

    for (const content of layers) {
      if (!content) continue;

      const planMatch = content.match(/\b(free|starter|team|enterprise|pro|business)\s*(plan|tier)/i);
      if (planMatch) {
        return planMatch[1].toLowerCase();
      }
    }

    return null;
  }

  /**
   * Extract plan from corpus context
   */
  private extractPlanFromCorpusContext(corpus: AssembledCorpusContext): string | null {
    // Look for plan mentions in corpus C2 content
    const c2Content = corpus.layers.C2.content;
    if (!c2Content) return null;

    const planMatch = c2Content.match(/\b(free|starter|team|enterprise|pro|business)\s*(plan|tier)/i);
    if (planMatch) {
      return planMatch[1].toLowerCase();
    }

    return null;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
