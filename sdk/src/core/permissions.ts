/**
 * VIVIM SDK — Permission System
 *
 * Inspired by vCode toolPermission pattern.
 * Granular tool permissions with wildcard rules.
 *
 * Four modes:
 * - default - Standard permission checks, user confirms sensitive operations
 * - plan - Planning mode, no tools can modify state
 * - auto - Auto-approve for allowed patterns, no confirmation needed
 * - bypass - All permissions granted (power user mode)
 *
 * Rule syntax (wildcard support):
 * - memory/STAR - All memory operations
 * - memory/read - Only read memory
 * - content/write - Write content operations
 * - STAR/read - All read operations across categories
 */

import type { ToolPermission, ToolPermissionLevel, ToolCategory } from './tools.js';

/**
 * Permission mode.
 */
export type PermissionMode = 'default' | 'plan' | 'auto' | 'bypass';

/**
 * Permission action.
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | '*';

/**
 * Permission rule.
 */
export interface PermissionRule {
  /** Rule ID */
  id: string;
  /** Tool name or wildcard pattern */
  tool: string;
  /** Allowed actions for this tool */
  actions: PermissionAction[];
  /** Whether user confirmation is needed */
  requiresConfirmation: boolean;
  /** Rule description */
  description?: string;
  /** When the rule was created */
  createdAt: number;
  /** Whether the rule is active */
  active: boolean;
}

/**
 * Permission check result.
 */
export interface PermissionCheckResult {
  /** Whether the operation is allowed */
  allowed: boolean;
  /** Whether user confirmation is needed */
  requiresConfirmation: boolean;
  /** Reason for the decision */
  reason: string;
  /** Matching rule (if any) */
  matchedRule?: PermissionRule;
}

/**
 * Permission context — data available during permission checks.
 */
export interface PermissionContext {
  /** Current permission mode */
  mode: PermissionMode;
  /** Active permission rules */
  rules: PermissionRule[];
  /** User's identity */
  userId?: string;
  /** Current session */
  sessionId?: string;
}

/**
 * Permission Manager — handles rule-based tool permission enforcement.
 */
export class PermissionManager {
  private mode: PermissionMode = 'default';
  private rules: PermissionRule[] = [];

  constructor(options?: {
    initialMode?: PermissionMode;
    initialRules?: PermissionRule[];
  }) {
    this.mode = options?.initialMode ?? 'default';
    this.rules = options?.initialRules ?? [];
  }

  // ============================================
  // MODE MANAGEMENT
  // ============================================

  /**
   * Get the current permission mode.
   */
  getMode(): PermissionMode {
    return this.mode;
  }

  /**
   * Set the permission mode.
   */
  setMode(mode: PermissionMode): void {
    this.mode = mode;
  }

  /**
   * Enter plan mode (thinking only, no modifications).
   */
  enterPlanMode(): void {
    this.mode = 'plan';
  }

  /**
   * Exit plan mode back to default.
   */
  exitPlanMode(): void {
    this.mode = 'default';
  }

  /**
   * Enter auto mode (auto-approve for allowed patterns).
   */
  enterAutoMode(): void {
    this.mode = 'auto';
  }

  /**
   * Enter bypass mode (all permissions granted).
   */
  enterBypassMode(): void {
    this.mode = 'bypass';
  }

  // ============================================
  // RULE MANAGEMENT
  // ============================================

  /**
   * Add a permission rule.
   */
  addRule(rule: Omit<PermissionRule, 'id' | 'createdAt' | 'active'>): PermissionRule {
    const fullRule: PermissionRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      active: true,
    };

    this.rules.push(fullRule);
    return fullRule;
  }

  /**
   * Remove a rule by ID.
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  /**
   * Get all rules.
   */
  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  /**
   * Get active rules only.
   */
  getActiveRules(): PermissionRule[] {
    return this.rules.filter(r => r.active);
  }

  /**
   * Toggle a rule's active state.
   */
  toggleRule(ruleId: string): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return false;
    rule.active = !rule.active;
    return true;
  }

  /**
   * Clear all rules.
   */
  clearRules(): void {
    this.rules = [];
  }

  // ============================================
  // PERMISSION CHECKS
  // ============================================

  /**
   * Check if a tool operation is allowed.
   */
  check(toolName: string, action: PermissionAction, category?: ToolCategory): PermissionCheckResult {
    // Bypass mode: all permissions granted
    if (this.mode === 'bypass') {
      return {
        allowed: true,
        requiresConfirmation: false,
        reason: 'Bypass mode — all permissions granted',
      };
    }

    // Plan mode: only read operations allowed
    if (this.mode === 'plan') {
      if (action === 'read') {
        return {
          allowed: true,
          requiresConfirmation: false,
          reason: 'Plan mode — read operations allowed',
        };
      }
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: 'Plan mode — only read operations are allowed',
      };
    }

    // Find matching rules
    const matchingRules = this.findMatchingRules(toolName, action);

    if (matchingRules.length === 0) {
      // No explicit rules — check default behavior
      return this.getDefaultDecision(toolName, action, category);
    }

    // Use the most permissive matching rule
    const bestRule = matchingRules.find(r => !r.requiresConfirmation) ?? matchingRules[0];

    return {
      allowed: true,
      requiresConfirmation: this.mode !== 'auto' && bestRule.requiresConfirmation,
      reason: bestRule.description ?? `Matched rule: ${bestRule.tool}`,
      matchedRule: bestRule,
    };
  }

  /**
   * Check multiple tool operations at once (batch check).
   */
  checkBatch(
    operations: Array<{ toolName: string; action: PermissionAction; category?: ToolCategory }>
  ): PermissionCheckResult[] {
    return operations.map(op => this.check(op.toolName, op.action, op.category));
  }

  /**
   * Convert a ToolPermission to a PermissionRule.
   */
  static fromToolPermission(
    permission: ToolPermission,
    toolName: string
  ): Omit<PermissionRule, 'id' | 'createdAt' | 'active'> {
    const actions: PermissionAction[] = [];

    switch (permission.level) {
      case 'none':
        break;
      case 'user':
        actions.push('read');
        break;
      case 'provider':
        actions.push('read', 'write');
        break;
      case 'admin':
        actions.push('read', 'write', 'delete', 'admin');
        break;
    }

    return {
      tool: toolName,
      actions: actions.length > 0 ? actions : ['read'],
      requiresConfirmation: permission.requiresConfirmation,
    };
  }

  // ============================================
  // INTERNAL
  // ============================================

  /**
   * Find all rules that match a tool name and action.
   */
  private findMatchingRules(toolName: string, action: PermissionAction): PermissionRule[] {
    return this.rules
      .filter(r => r.active)
      .filter(r => this.matchesPattern(toolName, r.tool) && r.actions.includes(action));
  }

  /**
   * Check if a tool name matches a pattern (supports wildcards).
   */
  private matchesPattern(toolName: string, pattern: string): boolean {
    // Exact match
    if (toolName === pattern) return true;

    // Wildcard: `*` matches any sequence
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(toolName);
    }

    // Category match: toolName starts with pattern
    if (toolName.startsWith(pattern)) return true;

    return false;
  }

  /**
   * Default decision when no rules match.
   */
  private getDefaultDecision(
    _toolName: string,
    action: PermissionAction,
    _category?: ToolCategory
  ): PermissionCheckResult {
    // Conservative default: reads allowed, writes need confirmation
    if (action === 'read') {
      return {
        allowed: true,
        requiresConfirmation: false,
        reason: 'Default — read operations allowed',
      };
    }

    return {
      allowed: true,
      requiresConfirmation: true,
      reason: 'Default — write/delete operations require confirmation',
    };
  }

  /**
   * Export rules as JSON (for portability).
   */
  exportRules(): PermissionRule[] {
    return [...this.rules];
  }

  /**
   * Import rules from JSON.
   */
  importRules(rules: PermissionRule[]): void {
    this.rules = rules;
  }

  /**
   * Get permission statistics.
   */
  getStats(): {
    totalRules: number;
    activeRules: number;
    mode: PermissionMode;
    toolsWithRules: string[];
  } {
    const toolsWithRules = [...new Set(this.rules.filter(r => r.active).map(r => r.tool))];

    return {
      totalRules: this.rules.length,
      activeRules: this.rules.filter(r => r.active).length,
      mode: this.mode,
      toolsWithRules,
    };
  }
}
