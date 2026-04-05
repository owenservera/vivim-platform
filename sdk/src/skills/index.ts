/**
 * VIVIM SDK - Skills Module
 * 
 * Installable skills for AI agent workflows
 */

import { SkillRegistry } from './registry.js';
import { createMemorySkillLoader } from './memory/index.js';
import { createContentSkillLoader } from './content/index.js';
import { createResearchSkillLoader } from './research/index.js';
import { BUNDLED_SKILLS } from './bundled.js';

export * from './types.js';
export { SkillRegistry, globalSkillRegistry } from './registry.js';

// Built-in skills
export { memorySkill, createMemorySkillLoader } from './memory/index.js';
export { contentSkill, createContentSkillLoader } from './content/index.js';
export { researchSkill, createResearchSkillLoader } from './research/index.js';

// Bundled skills (16+ skills inspired by vCode)
export {
  BUNDLED_SKILLS,
  createMemorySkill,
  createContextSkill,
  createSessionSkill,
  createConfigSkill,
  createCostSkill,
  createDiagnosticsSkill,
  createSearchSkill,
  createBatchSkill,
  createSimplifySkill,
  createVerifySkill,
  createRememberSkill,
  createLoopSkill,
  createDebugSkill,
  createStuckSkill,
  createShareSkill,
  createMcpBuilderSkill,
} from './bundled.js';

/**
 * Register all built-in skills with a registry
 */
export function registerBuiltinSkills(registry: SkillRegistry): void {
  registry.registerLoader('@vivim/skill-memory', createMemorySkillLoader());
  registry.registerLoader('@vivim/skill-content', createContentSkillLoader());
  registry.registerLoader('@vivim/skill-research', createResearchSkillLoader());
}

/**
 * Register all bundled skills (16+) with a registry
 */
export function registerBundledSkills(registry: SkillRegistry): void {
  for (const factory of BUNDLED_SKILLS) {
    registry.register(factory());
  }
}
