#!/usr/bin/env bun
/**
 * VIVIM SDK - Skill Management CLI
 * 
 * CLI tool for managing skills
 */

import { parseArgs } from 'util';
import { globalSkillRegistry, registerBuiltinSkills, BUILTIN_SKILLS } from '../skills/index.js';
import { VivimSDK } from '../core/sdk.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().child('skill-cli');

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
VIVIM Skill Manager

Usage: vivim-skill <command> [options]

Commands:
  list              List all available skills
  install <id>      Install a skill
  uninstall <id>    Uninstall a skill
  enable <id>       Enable a skill
  disable <id>      Disable a skill
  info <id>         Show skill information

Options:
  --help            Show this help message

Available Built-in Skills:
  @vivim/skill-memory     - Long-term memory management
  @vivim/skill-content   - Content creation and management  
  @vivim/skill-research  - Research and knowledge management

Examples:
  vivim-skill list
  vivim-skill install @vivim/skill-memory
  vivim-skill info @vivim/skill-memory
`);
}

/**
 * List all skills
 */
async function listSkills(): Promise<void> {
  registerBuiltinSkills(globalSkillRegistry);
  
  const installed = globalSkillRegistry.listInstalled();
  const all = globalSkillRegistry.listSkills();
  
  console.log('\n=== Available Skills ===\n');
  
  for (const skill of all) {
    const isInstalled = globalSkillRegistry.isInstalled(skill.id);
    const isEnabled = globalSkillRegistry.isEnabled(skill.id);
    
    console.log(`📦 ${skill.id}`);
    console.log(`   Name: ${skill.name}`);
    console.log(`   Version: ${skill.version}`);
    console.log(`   Description: ${skill.description}`);
    console.log(`   Status: ${isInstalled ? (isEnabled ? '✅ Enabled' : '❌ Disabled') : '📥 Not installed'}`);
    console.log(`   Capabilities: ${skill.capabilities.map(c => c.name).join(', ')}`);
    console.log();
  }
}

/**
 * Install a skill
 */
async function installSkill(id: string): Promise<void> {
  // Initialize SDK
  const sdk = new VivimSDK();
  await sdk.initialize();
  
  try {
    // Register built-in skills
    registerBuiltinSkills(globalSkillRegistry);
    
    // Load the skill
    await globalSkillRegistry.loadSkill(id, sdk);
    
    console.log(`✅ Skill installed: ${id}`);
  } catch (error) {
    console.error(`❌ Failed to install skill: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Show skill info
 */
async function showSkillInfo(id: string): Promise<void> {
  registerBuiltinSkills(globalSkillRegistry);
  
  const skill = globalSkillRegistry.getSkill(id);
  if (!skill) {
    console.error(`❌ Skill not found: ${id}`);
    process.exit(1);
  }
  
  console.log(`\n=== ${skill.name} ===\n`);
  console.log(`ID: ${skill.id}`);
  console.log(`Version: ${skill.version}`);
  console.log(`Description: ${skill.description}`);
  console.log(`Author: ${skill.author || 'Unknown'}`);
  console.log(`License: ${skill.license || 'Unknown'}`);
  console.log(`Tags: ${skill.tags?.join(', ') || 'None'}`);
  
  console.log('\nCapabilities:');
  for (const cap of skill.capabilities) {
    console.log(`  • ${cap.name} (${cap.type})`);
    console.log(`    ${cap.description}`);
    if (cap.inputSchema) {
      const schema = JSON.stringify(cap.inputSchema);
      console.log(`    Input: ${schema.substring(0, 100)}${schema.length > 100 ? '...' : ''}`);
    }
  }
  
  console.log();
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv,
    options: {
      help: {
        type: 'boolean',
        short: '?',
      },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    showHelp();
    process.exit(0);
  }

  const command = positionals[2] || 'list';
  const arg = positionals[3];

  switch (command) {
    case 'list':
      await listSkills();
      break;
      
    case 'install':
      if (!arg) {
        console.error('Error: Skill ID required');
        console.error('Usage: vivim-skill install <skill-id>');
        process.exit(1);
      }
      await installSkill(arg);
      break;
      
    case 'info':
      if (!arg) {
        console.error('Error: Skill ID required');
        console.error('Usage: vivim-skill info <skill-id>');
        process.exit(1);
      }
      await showSkillInfo(arg);
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
