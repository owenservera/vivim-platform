/**
 * Global Content Rendering Toolkit - Plugin System
 * Extensible plugin architecture for custom content types
 */

import React from 'react';
import type {
  ContentBlock,
  ContentBlockRendererProps,
  ContentRendererPlugin,
  ContentType,
  ContentRendererConfig,
} from './ContentRenderer.types';

// ============================================================================
// PLUGIN STATE
// ============================================================================

/**
 * Registered plugins map
 */
const plugins = new Map<string, ContentRendererPlugin>();

/**
 * Plugin initialization status
 */
const initializedPlugins = new Set<string>();

// ============================================================================
// PLUGIN MANAGEMENT
// ============================================================================

/**
 * Register a content renderer plugin
 */
export function registerPlugin(plugin: ContentRendererPlugin): void {
  const { name, version, contentTypes, renderer, init, transform, validate } = plugin;

  // Validate plugin
  if (!name || !version || !contentTypes || !renderer) {
    console.error('[ContentRenderer] Invalid plugin:', plugin);
    return;
  }

  // Check for duplicate
  if (plugins.has(name)) {
    console.warn(`[ContentRenderer] Plugin "${name}" is already registered`);
    return;
  }

  // Store plugin
  plugins.set(name, plugin);

  console.info(`[ContentRenderer] Plugin "${name}" v${version} registered for types:`, contentTypes.join(', '));
}

/**
 * Unregister a plugin
 */
export function unregisterPlugin(name: string): void {
  const plugin = plugins.get(name);

  if (!plugin) {
    console.warn(`[ContentRenderer] Plugin "${name}" not found`);
    return;
  }

  // Cleanup plugin
  if (plugin.destroy) {
    try {
      plugin.destroy();
    } catch (error) {
      console.error(`[ContentRenderer] Error destroying plugin "${name}":`, error);
    }
  }

  // Remove from initialized set
  initializedPlugins.delete(name);

  // Remove from registry
  plugins.delete(name);

  console.info(`[ContentRenderer] Plugin "${name}" unregistered`);
}

/**
 * Get a plugin by name
 */
export function getPlugin(name: string): ContentRendererPlugin | undefined {
  return plugins.get(name);
}

/**
 * Get all registered plugins
 */
export function getAllPlugins(): ContentRendererPlugin[] {
  return Array.from(plugins.values());
}

/**
 * Get plugins that handle a specific content type
 */
export function getPluginsForContentType(type: ContentType): ContentRendererPlugin[] {
  return Array.from(plugins.values()).filter(plugin =>
    plugin.contentTypes.includes(type)
  );
}

/**
 * Check if a plugin is registered
 */
export function hasPlugin(name: string): boolean {
  return plugins.has(name);
}

/**
 * Get all registered plugin names
 */
export function getPluginNames(): string[] {
  return Array.from(plugins.keys());
}

// ============================================================================
// PLUGIN INITIALIZATION
// ============================================================================

/**
 * Initialize all plugins
 */
export function initializePlugins(config: ContentRendererConfig): void {
  console.info('[ContentRenderer] Initializing plugins...');

  for (const [name, plugin] of plugins.entries()) {
    if (initializedPlugins.has(name)) {
      continue; // Already initialized
    }

    try {
      // Call plugin init if provided
      if (plugin.init) {
        plugin.init(config);
      }

      initializedPlugins.add(name);
      console.debug(`[ContentRenderer] Plugin "${name}" initialized`);
    } catch (error) {
      console.error(`[ContentRenderer] Error initializing plugin "${name}":`, error);
    }
  }

  console.info(`[ContentRenderer] ${initializedPlugins.size} plugins initialized`);
}

/**
 * Destroy all plugins
 */
export function destroyAllPlugins(): void {
  console.info('[ContentRenderer] Destroying all plugins...');

  for (const [name, plugin] of plugins.entries()) {
    try {
      // Call plugin destroy if provided
      if (plugin.destroy) {
        plugin.destroy();
      }

      initializedPlugins.delete(name);
      console.debug(`[ContentRenderer] Plugin "${name}" destroyed`);
    } catch (error) {
      console.error(`[ContentRenderer] Error destroying plugin "${name}":`, error);
    }
  }

  // Clear all plugins
  plugins.clear();
  initializedPlugins.clear();

  console.info('[ContentRenderer] All plugins destroyed');
}

// ============================================================================
// CONTENT TRANSFORMATION
// ============================================================================

/**
 * Transform content block using registered plugins
 */
export function transformContentBlock(
  block: ContentBlock,
  config: ContentRendererConfig
): ContentBlock {
  let transformedBlock = { ...block };

  // Apply all plugin transforms
  for (const plugin of plugins.values()) {
    if (plugin.transform && plugin.contentTypes.includes(block.type)) {
      try {
        const result = plugin.transform(transformedBlock);
        if (result) {
          transformedBlock = result;
        }
      } catch (error) {
        console.error(`[ContentRenderer] Error in plugin "${plugin.name}" transform:`, error);
      }
    }
  }

  return transformedBlock;
}

/**
 * Transform multiple content blocks
 */
export function transformContentBlocks(
  blocks: ContentBlock[],
  config: ContentRendererConfig
): ContentBlock[] {
  return blocks.map(block => transformContentBlock(block, config));
}

// ============================================================================
// CONTENT VALIDATION
// ============================================================================

/**
 * Validate content block using registered plugins
 */
export function validateContentBlock(
  block: ContentBlock
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate with all plugins that handle this type
  for (const plugin of plugins.values()) {
    if (plugin.validate && plugin.contentTypes.includes(block.type)) {
      try {
        const isValid = plugin.validate(block);
        if (!isValid) {
          errors.push(`Validation failed by plugin "${plugin.name}"`);
        }
      } catch (error) {
        console.error(`[ContentRenderer] Error in plugin "${plugin.name}" validation:`, error);
        errors.push(`Validation error in plugin "${plugin.name}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple content blocks
 */
export function validateContentBlocks(
  blocks: ContentBlock[]
): { valid: boolean; errors: Map<string, string[]> } {
  const errors = new Map<string, string[]>();

  blocks.forEach(block => {
    const result = validateContentBlock(block);
    if (!result.valid) {
      errors.set(block.id, result.errors);
    }
  });

  return {
    valid: errors.size === 0,
    errors,
  };
}

// ============================================================================
// PLUGIN UTILITIES
// ============================================================================

/**
 * Get plugin stats
 */
export function getPluginStats(): {
  totalPlugins: number;
  initializedPlugins: number;
  contentTypesCovered: Set<ContentType>;
} {
  const contentTypesCovered = new Set<ContentType>();

  for (const plugin of plugins.values()) {
    plugin.contentTypes.forEach(type => contentTypesCovered.add(type));
  }

  return {
    totalPlugins: plugins.size,
    initializedPlugins: initializedPlugins.size,
    contentTypesCovered,
  };
}

/**
 * Check if a content type is handled by any plugin
 */
export function isContentTypeHandled(type: ContentType): boolean {
  return Array.from(plugins.values()).some(plugin =>
    plugin.contentTypes.includes(type)
  );
}

/**
 * Get all content types handled by plugins
 */
export function getPluginContentTypes(): ContentType[] {
  const types = new Set<ContentType>();

  for (const plugin of plugins.values()) {
    plugin.contentTypes.forEach(type => types.add(type));
  }

  return Array.from(types);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  plugins as pluginRegistry,
  initializedPlugins,
};
