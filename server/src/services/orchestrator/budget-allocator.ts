/**
 * Dual Budget Allocator
 * 
 * Allocates token budget between corpus and user context engines.
 * 
 * @created March 27, 2026
 */

import { UserAvatar } from '../../types/corpus';

interface DualBudgetAllocation {
  totalBudget: number;
  corpusBudget: {
    total: number;
    layers: {
      C0_identity: number;
      C1_topic: number;
      C2_knowledge: number;
      C3_supporting: number;
      C4_freshness: number;
    };
  };
  userBudget: {
    total: number;
    layers: {
      L0_identity: number;
      L1_prefs: number;
      L2_topic: number;
      L3_entity: number;
      L4_conversation: number;
      L5_jit: number;
      L6_history: number;
      L7_message: number;
    };
  };
  sharedBudget: {
    systemInstructions: number;
    conversationHistory: number;
  };
}

export class DualBudgetAllocator {
  /**
   * Allocate budget between corpus and user engines
   */
  allocate(
    totalBudget: number,
    weights: { corpus: number; user: number },
    avatar: UserAvatar,
    hasConversation: boolean,
    conversationTokens: number
  ): DualBudgetAllocation {
    // Reserve fixed costs
    const systemInstructions = 200; // Orchestrator meta-instructions
    const messageReserve = 100; // User message (L7)
    const remaining = totalBudget - systemInstructions - messageReserve;

    // Conversation history is SHARED - both engines contribute
    const historyBudget = hasConversation
      ? Math.min(
          Math.floor(remaining * 0.25), // Max 25% of remaining
          Math.min(conversationTokens, 4000)
        )
      : 0;

    const afterHistory = remaining - historyBudget;

    // Split remaining between corpus and user engines
    const corpusTotal = Math.floor(afterHistory * weights.corpus);
    const userTotal = Math.floor(afterHistory * weights.user);

    return {
      totalBudget,
      corpusBudget: {
        total: corpusTotal,
        layers: this.allocateCorpusLayers(corpusTotal, avatar),
      },
      userBudget: {
        total: userTotal,
        layers: this.allocateUserLayers(userTotal, avatar, hasConversation),
      },
      sharedBudget: {
        systemInstructions,
        conversationHistory: historyBudget,
      },
    };
  }

  /**
   * Allocate corpus layer budgets
   */
  private allocateCorpusLayers(total: number, avatar: UserAvatar): {
    C0_identity: number;
    C1_topic: number;
    C2_knowledge: number;
    C3_supporting: number;
    C4_freshness: number;
  } {
    // C0 is fixed regardless of avatar
    const C0 = Math.min(300, total);
    const remaining = total - C0;

    return {
      C0_identity: C0,
      C1_topic: Math.floor(remaining * 0.08),
      C2_knowledge: Math.floor(remaining * 0.55), // Primary knowledge chunk
      C3_supporting: Math.floor(remaining * 0.25),
      C4_freshness: Math.floor(remaining * 0.12),
    };
  }

  /**
   * Allocate user layer budgets
   */
  private allocateUserLayers(
    total: number,
    avatar: UserAvatar,
    hasConversation: boolean
  ): {
    L0_identity: number;
    L1_prefs: number;
    L2_topic: number;
    L3_entity: number;
    L4_conversation: number;
    L5_jit: number;
    L6_history: number;
    L7_message: number;
  } {
    if (avatar === 'STRANGER') {
      // Stranger: minimal user context (no identity yet)
      return {
        L0_identity: 0,
        L1_prefs: 0,
        L2_topic: 0,
        L3_entity: 0,
        L4_conversation: 0,
        L5_jit: Math.floor(total * 0.3),
        L6_history: Math.floor(total * 0.7),
        L7_message: 0, // Handled in shared
      };
    }

    // Acquaintance+: distribute based on what's available
    const allocations = {
      L0_identity: Math.floor(total * 0.1),
      L1_prefs: Math.floor(total * 0.08),
      L2_topic: Math.floor(total * 0.12),
      L3_entity: Math.floor(total * 0.1),
      L4_conversation: hasConversation ? Math.floor(total * 0.15) : 0,
      L5_jit: Math.floor(total * 0.25),
      L6_history: Math.floor(total * 0.2),
      L7_message: 0,
    };

    // Scale up for KNOWN users
    if (avatar === 'KNOWN') {
      allocations.L0_identity = Math.floor(total * 0.12);
      allocations.L5_jit = Math.floor(total * 0.3);
      allocations.L4_conversation = hasConversation ? Math.floor(total * 0.18) : allocations.L4_conversation;
    }

    return allocations;
  }
}
