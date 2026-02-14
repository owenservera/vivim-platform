/**
 * Global Content Rendering Toolkit - Content Type Registry
 * Centralized registry for managing all content type renderers
 */

import React from 'react';
import type {
  ContentType,
  ContentBlock,
  ContentBlockRendererProps,
  ContentTypeRegistry as IContentTypeRegistry,
} from './ContentRenderer.types';

// ============================================================================
// REGISTRY ENTRY
// ============================================================================

/**
 * Registry entry for a content type renderer
 */
interface RegistryEntry {
  type: ContentType;
  renderer: React.ComponentType<ContentBlockRendererProps>;
  priority: number;
}

// ============================================================================
// REGISTRY STATE
// ============================================================================

/**
 * Registered renderers map
 */
const renderers = new Map<ContentType, RegistryEntry[]>();

/**
 * Fallback renderer
 */
let fallbackRenderer: React.ComponentType<ContentBlockRendererProps> | null = null;

// ============================================================================
// REGISTRY IMPLEMENTATION
// ============================================================================

/**
 * Content type registry implementation
 */
export const ContentTypeRegistry: IContentTypeRegistry = {
  /**
   * Register a new content type renderer
   */
  register(
    type: ContentType,
    renderer: React.ComponentType<ContentBlockRendererProps>,
    priority: number = 100
  ): void {
    const entry: RegistryEntry = { type, renderer, priority };

    // Get existing entries for this type
    const existing = renderers.get(type) || [];

    // Add new entry
    existing.push(entry);

    // Sort by priority (higher priority first)
    existing.sort((a, b) => b.priority - a.priority);

    // Update registry
    renderers.set(type, existing);

    console.debug(`[ContentRenderer] Registered renderer for type "${type}" with priority ${priority}`);
  },

  /**
   * Unregister a content type
   */
  unregister(type: ContentType): void {
    const removed = renderers.delete(type);
    
    if (removed) {
      console.debug(`[ContentRenderer] Unregistered renderer for type "${type}"`);
    }
  },

  /**
   * Get renderer for a content type
   */
  getRenderer(type: ContentType): React.ComponentType<ContentBlockRendererProps> | null {
    const entries = renderers.get(type);

    if (!entries || entries.length === 0) {
      return fallbackRenderer;
    }

    // Return highest priority renderer
    return entries[0].renderer;
  },

  /**
   * Check if a type is registered
   */
  hasRenderer(type: ContentType): boolean {
    const entries = renderers.get(type);
    return entries !== undefined && entries.length > 0;
  },

  /**
   * Get all registered types
   */
  getRegisteredTypes(): ContentType[] {
    return Array.from(renderers.keys());
  },

  /**
   * Set fallback renderer
   */
  setFallbackRenderer(renderer: React.ComponentType<ContentBlockRendererProps>): void {
    fallbackRenderer = renderer;
    console.debug('[ContentRenderer] Fallback renderer set');
  },

  /**
   * Get fallback renderer
   */
  getFallbackRenderer(): React.ComponentType<ContentBlockRendererProps> | null {
    return fallbackRenderer;
  },

  /**
   * Clear all renderers
   */
  clear(): void {
    renderers.clear();
    fallbackRenderer = null;
    console.debug('[ContentRenderer] Registry cleared');
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all renderers for a type (for debugging)
 */
export function getRenderersForType(type: ContentType): RegistryEntry[] {
  return renderers.get(type) || [];
}

/**
 * Get renderer priority for a type
 */
export function getRendererPriority(type: ContentType): number | null {
  const entries = renderers.get(type);
  if (!entries || entries.length === 0) {
    return null;
  }
  return entries[0].priority;
}

/**
 * Check if multiple renderers are registered for a type
 */
export function hasMultipleRenderers(type: ContentType): boolean {
  const entries = renderers.get(type);
  return entries !== undefined && entries.length > 1;
}

/**
 * Get registry stats (for debugging)
 */
export function getRegistryStats(): {
  totalTypes: number;
  totalRenderers: number;
  typesWithMultipleRenderers: number;
} {
  const totalTypes = renderers.size;
  let totalRenderers = 0;
  let typesWithMultipleRenderers = 0;

  renderers.forEach((entries) => {
    totalRenderers += entries.length;
    if (entries.length > 1) {
      typesWithMultipleRenderers++;
    }
  });

  return {
    totalTypes,
    totalRenderers,
    typesWithMultipleRenderers,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { RegistryEntry };
