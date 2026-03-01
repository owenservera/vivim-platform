/**
 * VIVIM SDK - Skill Registry
 * 
 * Central registry for managing skills
 */

import type { 
  SkillDefinition, 
  SkillLoader, 
  SkillInstallInfo, 
  SkillContext,
  SkillCapability 
} from './types.js';
import type { VivimSDK } from '../core/sdk.js';

/**
 * Skill Registry - manages all installed skills
 */
export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  private loaders: Map<string, SkillLoader> = new Map();
  private installations: Map<string, SkillInstallInfo> = new Map();
  private enabled: Set<string> = new Set();

  /**
   * Register a skill
   */
  register(skill: SkillDefinition): void {
    if (this.skills.has(skill.id)) {
      throw new Error(`Skill already registered: ${skill.id}`);
    }
    this.skills.set(skill.id, skill);
  }

  /**
   * Register a skill loader (for lazy loading)
   */
  registerLoader(id: string, loader: SkillLoader): void {
    this.loaders.set(id, loader);
  }

  /**
   * Load a skill using its loader
   */
  async loadSkill(id: string, sdk: VivimSDK, config?: Record<string, unknown>): Promise<SkillDefinition> {
    // Check if already loaded
    if (this.skills.has(id)) {
      return this.skills.get(id)!;
    }

    // Check if we have a loader
    const loader = this.loaders.get(id);
    if (!loader) {
      throw new Error(`No loader found for skill: ${id}`);
    }

    // Load the skill
    const skill = await loader(sdk, config);
    this.register(skill);
    this.enable(id);

    return skill;
  }

  /**
   * Install a skill
   */
  install(id: string, version: string, config: Record<string, unknown> = {}): void {
    const installInfo: SkillInstallInfo = {
      id,
      version,
      installedAt: Date.now(),
      config,
      enabled: true,
    };
    this.installations.set(id, installInfo);
    this.enabled.add(id);
  }

  /**
   * Uninstall a skill
   */
  uninstall(id: string): void {
    this.installations.delete(id);
    this.enabled.delete(id);
  }

  /**
   * Enable a skill
   */
  enable(id: string): void {
    if (!this.skills.has(id)) {
      throw new Error(`Skill not found: ${id}`);
    }
    this.enabled.add(id);
  }

  /**
   * Disable a skill
   */
  disable(id: string): void {
    this.enabled.delete(id);
  }

  /**
   * Get a skill by ID
   */
  getSkill(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  /**
   * List all registered skills
   */
  listSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * List enabled skills
   */
  listEnabledSkills(): SkillDefinition[] {
    return Array.from(this.enabled).map(id => this.skills.get(id)).filter(Boolean) as SkillDefinition[];
  }

  /**
   * List installed skills
   */
  listInstalled(): SkillInstallInfo[] {
    return Array.from(this.installations.values());
  }

  /**
   * Get skill capability
   */
  getCapability(skillId: string, capabilityName: string): SkillCapability | undefined {
    const skill = this.skills.get(skillId);
    if (!skill) return undefined;
    
    return skill.capabilities.find(c => c.name === capabilityName);
  }

  /**
   * Execute a skill capability
   */
  async executeCapability(
    skillId: string,
    capabilityName: string,
    params: Record<string, unknown>,
    sdk: VivimSDK
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const capability = this.getCapability(skillId, capabilityName);
    if (!capability) {
      return { success: false, error: `Capability not found: ${capabilityName}` };
    }

    const context: SkillContext = {
      sdk,
      skillId,
      config: this.installations.get(skillId)?.config || {},
      sessionId: crypto.randomUUID(),
    };

    try {
      return await capability.handler(params, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if a skill is enabled
   */
  isEnabled(id: string): boolean {
    return this.enabled.has(id);
  }

  /**
   * Check if a skill is installed
   */
  isInstalled(id: string): boolean {
    return this.installations.has(id);
  }

  /**
   * Clear all skills
   */
  clear(): void {
    this.skills.clear();
    this.loaders.clear();
    this.installations.clear();
    this.enabled.clear();
  }
}

/**
 * Global skill registry instance
 */
export const globalSkillRegistry = new SkillRegistry();
