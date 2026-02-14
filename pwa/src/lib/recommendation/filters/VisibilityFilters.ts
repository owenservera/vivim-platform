/**
 * Visibility Filters
 * Final filtering before showing to user
 * X Parallel: visibility_filter
 */

import type { Candidate } from '../types';

export class VisibilityFilters {
  /**
   * Apply all visibility filters
   */
  apply(candidates: Candidate[]): Candidate[] {
    let filtered = candidates;

    filtered = this.deduplicate(filtered);
    filtered = this.filterByPrivacy(filtered);
    filtered = this.filterByContext(filtered);
    filtered = this.balanceSources(filtered);

    return filtered;
  }

  /**
   * Remove duplicates
   */
  private deduplicate(candidates: Candidate[]): Candidate[] {
    const seen = new Set<string>();
    return candidates.filter(c => {
      if (seen.has(c.conversation.id)) return false;
      seen.add(c.conversation.id);
      return true;
    });
  }

  /**
   * Filter by privacy level
   */
  private filterByPrivacy(candidates: Candidate[]): Candidate[] {
    return candidates.filter(c =>
      c.conversation.privacy.level !== 'public'
    );
  }

  /**
   * Context-aware filtering
   */
  private filterByContext(candidates: Candidate[]): Candidate[] {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return candidates.filter(c =>
        c.conversation.stats.totalCodeBlocks < 10
      );
    }

    return candidates;
  }

  /**
   * Balance sources (max 10 from each source)
   */
  private balanceSources(candidates: Candidate[]): Candidate[] {
    const sourceCount: Record<string, number> = {};
    const maxPerSource = 10;

    return candidates.filter(c => {
      const count = sourceCount[c.source] || 0;
      if (count >= maxPerSource) return false;
      sourceCount[c.source] = count + 1;
      return true;
    });
  }
}

// Singleton instance
export const visibilityFilters = new VisibilityFilters();
