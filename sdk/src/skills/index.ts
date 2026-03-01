/**
 * VIVIM SDK - Skills Module
 * 
 * Installable skills for AI agent workflows
 */

export * from './types.js';
export { SkillRegistry, globalSkillRegistry } from './registry.js';

// Built-in skills
export { memorySkill, createMemorySkillLoader } from './memory/index.js';
export { contentSkill, createContentSkillLoader } from './content/index.js';
export { researchSkill, createResearchSkillLoader } from './research/index.js';

/**
 * Register all built-in skills with a registry
 */
export function registerBuiltinSkills(registry: SkillRegistry): void {
  registry.registerLoader('@vivim/skill-memory', createMemorySkillLoader());
  registry.registerLoader('@vivim/skill-content', createContentSkillLoader());
  registry.registerLoader('@vivim/skill-research', createResearchSkillLoader());
}
