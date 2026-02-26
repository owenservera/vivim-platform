/**
 * Extension System
 * Allows extending nodes with custom functionality
 */

import { EventEmitter } from 'events';
import type { APINodeDefinition, ExtensionPoint } from '../core/types.js';

/**
 * Extension definition
 */
export interface Extension {
  id: string;
  name: string;
  version: string;
  description?: string;
  
  // Extension point we're extending
  extends: string;
  
  // Priority (lower = higher priority)
  priority?: number;
  
  // Implementation
  implementation: Record<string, unknown>;
  
  // Dependencies
  dependencies?: {
    nodes?: string[];
    packages?: string[];
  };
}

/**
 * Extension instance
 */
export interface ExtensionInstance {
  extension: Extension;
  extensionPoint: ExtensionPoint;
  nodeId: string;
  registeredAt: number;
  active: boolean;
}

/**
 * Extension interface
 */
export interface ExtensionInterface {
  methods: Array<{
    name: string;
    params: Array<{ name: string; type: string }>;
    returns: string;
  }>;
  events?: Array<{
    name: string;
    payload: string;
  }>;
  properties?: Array<{
    name: string;
    type: string;
  }>;
}

/**
 * Extension registry entry
 */
interface ExtensionPointRegistry {
  point: ExtensionPoint;
  nodeId: string;
  extensions: ExtensionInstance[];
}

/**
 * Extension System Implementation
 */
export class ExtensionSystem extends EventEmitter {
  private extensionPoints: Map<string, ExtensionPointRegistry> = new Map();
  private extensions: Map<string, ExtensionInstance> = new Map();
  private loadedExtensions: Map<string, Extension> = new Map();

  constructor() {
    super();
  }

  // ============================================
  // EXTENSION POINT REGISTRATION
  // ============================================

  /**
   * Register an extension point from a node
   */
  registerExtensionPoint(nodeId: string, point: ExtensionPoint): void {
    const registry: ExtensionPointRegistry = {
      point,
      nodeId,
      extensions: [],
    };

    this.extensionPoints.set(point.id, registry);
    this.emit('extension-point:registered', { pointId: point.id, nodeId });
  }

  /**
   * Unregister an extension point
   */
  unregisterExtensionPoint(pointId: string): void {
    const registry = this.extensionPoints.get(pointId);
    if (!registry) return;

    // Deactivate all extensions for this point
    for (const ext of registry.extensions) {
      ext.active = false;
      this.emit('extension:deactivated', { extensionId: ext.extension.id });
    }

    this.extensionPoints.delete(pointId);
    this.emit('extension-point:unregistered', { pointId });
  }

  /**
   * Get extension point info
   */
  getExtensionPoint(pointId: string): ExtensionPoint | undefined {
    return this.extensionPoints.get(pointId)?.point;
  }

  /**
   * List all extension points
   */
  listExtensionPoints(): Array<{ point: ExtensionPoint; nodeId: string; extensionCount: number }> {
    return Array.from(this.extensionPoints.entries()).map(([id, registry]) => ({
      point: registry.point,
      nodeId: registry.nodeId,
      extensionCount: registry.extensions.length,
    }));
  }

  // ============================================
  // EXTENSION REGISTRATION
  // ============================================

  /**
   * Register an extension
   */
  registerExtension(extension: Extension): void {
    const registry = this.extensionPoints.get(extension.extends);
    if (!registry) {
      throw new Error(`Extension point not found: ${extension.extends}`);
    }

    const instance: ExtensionInstance = {
      extension,
      extensionPoint: registry.point,
      nodeId: registry.nodeId,
      registeredAt: Date.now(),
      active: false,
    };

    this.extensions.set(extension.id, instance);
    this.loadedExtensions.set(extension.id, extension);

    this.emit('extension:registered', { extensionId: extension.id, pointId: extension.extends });
  }

  /**
   * Unregister an extension
   */
  unregisterExtension(extensionId: string): void {
    const instance = this.extensions.get(extensionId);
    if (!instance) return;

    instance.active = false;
    this.extensions.delete(extensionId);
    this.loadedExtensions.delete(extensionId);

    // Remove from extension point
    const registry = this.extensionPoints.get(instance.extension.extends);
    if (registry) {
      registry.extensions = registry.extensions.filter(e => e.extension.id !== extensionId);
    }

    this.emit('extension:unregistered', { extensionId });
  }

  // ============================================
  // EXTENSION ACTIVATION
  // ============================================

  /**
   * Activate an extension
   */
  activateExtension(extensionId: string): void {
    const instance = this.extensions.get(extensionId);
    if (!instance) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    const registry = this.extensionPoints.get(instance.extension.extends);
    if (!registry) {
      throw new Error(`Extension point not found: ${instance.extension.extends}`);
    }

    // Add to active extensions
    if (!registry.extensions.some(e => e.extension.id === extensionId)) {
      registry.extensions.push(instance);
    }

    // Sort by priority
    registry.extensions.sort((a, b) => 
      (a.extension.priority || 100) - (b.extension.priority || 100)
    );

    instance.active = true;
    this.emit('extension:activated', { extensionId });
  }

  /**
   * Deactivate an extension
   */
  deactivateExtension(extensionId: string): void {
    const instance = this.extensions.get(extensionId);
    if (!instance) return;

    instance.active = false;

    const registry = this.extensionPoints.get(instance.extension.extends);
    if (registry) {
      registry.extensions = registry.extensions.filter(e => e.extension.id !== extensionId);
    }

    this.emit('extension:deactivated', { extensionId });
  }

  // ============================================
  // EXTENSION QUERY
  // ============================================

  /**
   * Get extensions for an extension point
   */
  getExtensions(pointId: string): ExtensionInstance[] {
    const registry = this.extensionPoints.get(pointId);
    return registry?.extensions.filter(e => e.active) || [];
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): ExtensionInstance | undefined {
    return this.extensions.get(extensionId);
  }

  /**
   * Check if extension point has extensions
   */
  hasExtensions(pointId: string): boolean {
    const registry = this.extensionPoints.get(pointId);
    return registry?.extensions.some(e => e.active) || false;
  }

  // ============================================
  // EXTENSION INVOCATION
  // ============================================

  /**
   * Invoke extension method
   */
  async invoke<T = unknown>(
    pointId: string,
    method: string,
    ...args: unknown[]
  ): Promise<T | undefined> {
    const registry = this.extensionPoints.get(pointId);
    if (!registry) return undefined;

    const point = registry.point;

    // Find first extension that can handle the call
    for (const instance of registry.extensions) {
      if (!instance.active) continue;

      const impl = instance.extension.implementation;
      const fn = impl[method];

      if (typeof fn === 'function') {
        try {
          // Check if extension has filter/canHandle
          const canHandle = impl['canHandle'] || impl['can' + method.charAt(0).toUpperCase() + method.slice(1)];
          if (typeof canHandle === 'function') {
            const can = await canHandle.apply(impl, args);
            if (!can) continue;
          }

          return await fn.apply(impl, args) as T;
        } catch (error) {
          this.emit('extension:error', { extensionId: instance.extension.id, error });
          throw error;
        }
      }
    }

    return undefined;
  }

  /**
   * Invoke all extensions (for pipeline-style extension points)
   */
  async invokeAll<T = unknown>(
    pointId: string,
    method: string,
    initialValue: T,
    ...args: unknown[]
  ): Promise<T> {
    const registry = this.extensionPoints.get(pointId);
    if (!registry) return initialValue;

    let result = initialValue;

    for (const instance of registry.extensions) {
      if (!instance.active) continue;

      const impl = instance.extension.implementation;
      const fn = impl[method];

      if (typeof fn === 'function') {
        try {
          result = await fn.call(impl, result, ...args) as T;
        } catch (error) {
          this.emit('extension:error', { extensionId: instance.extension.id, error });
        }
      }
    }

    return result;
  }

  // ============================================
  // UTILITY
  // ============================================

  /**
   * Get all registered extensions
   */
  listExtensions(): ExtensionInstance[] {
    return Array.from(this.extensions.values());
  }

  /**
   * Get loaded extension by ID
   */
  getLoadedExtension(extensionId: string): Extension | undefined {
    return this.loadedExtensions.get(extensionId);
  }

  /**
   * Clear all extensions and extension points
   */
  clear(): void {
    this.extensions.clear();
    this.extensionPoints.clear();
    this.loadedExtensions.clear();
  }
}
