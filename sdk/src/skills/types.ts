/**
 * VIVIM SDK - Skill Types
 * 
 * Type definitions for the skill system
 */

import type { VivimSDK } from '../core/sdk.js';

/**
 * Skill definition
 */
export interface SkillDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  repository?: string;
  tags?: string[];
  capabilities: SkillCapability[];
  configSchema?: Record<string, unknown>;
  dependencies?: SkillDependency[];
}

/**
 * Skill capability types
 */
export type SkillCapabilityType = 'tool' | 'resource' | 'prompt' | 'agent';

/**
 * Skill capability
 */
export interface SkillCapability {
  type: SkillCapabilityType;
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  handler: SkillCapabilityHandler;
}

/**
 * Skill capability handler
 */
export type SkillCapabilityHandler = (
  params: Record<string, unknown>,
  context: SkillContext
) => Promise<SkillCapabilityResult>;

/**
 * Skill context - passed to all capability handlers
 */
export interface SkillContext {
  sdk: VivimSDK;
  skillId: string;
  config: Record<string, unknown>;
  sessionId: string;
}

/**
 * Skill capability result
 */
export interface SkillCapabilityResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Skill dependency
 */
export interface SkillDependency {
  id: string;
  version?: string;
  optional?: boolean;
}

/**
 * Skill installation info
 */
export interface SkillInstallInfo {
  id: string;
  version: string;
  installedAt: number;
  config: Record<string, unknown>;
  enabled: boolean;
}

/**
 * Skill loader function
 */
export type SkillLoader = (sdk: VivimSDK, config?: Record<string, unknown>) => Promise<SkillDefinition>;

/**
 * Built-in skill IDs
 */
export const BUILTIN_SKILLS = {
  MEMORY: '@vivim/skill-memory',
  CONTENT: '@vivim/skill-content',
  RESEARCH: '@vivim/skill-research',
  SOCIAL: '@vivim/skill-social',
  CHAT: '@vivim/skill-chat',
} as const;
