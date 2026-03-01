/**
 * VIVIM SDK - MCP Tools Index
 * 
 * Register all MCP tools
 */

import { ToolRegistry } from '../registry.js';
import { registerIdentityTools } from './identity.js';
import { registerMemoryTools } from './memory.js';
import { registerContentTools } from './content.js';
import { registerSocialTools } from './social.js';
import { registerChatTools } from './chat.js';
import { registerStorageTools } from './storage.js';

/**
 * Create and populate the tool registry
 */
export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register all tool categories
  registerIdentityTools(registry);
  registerMemoryTools(registry);
  registerContentTools(registry);
  registerSocialTools(registry);
  registerChatTools(registry);
  registerStorageTools(registry);

  return registry;
}

/**
 * Default tool registry instance
 */
export const defaultToolRegistry = createToolRegistry();
