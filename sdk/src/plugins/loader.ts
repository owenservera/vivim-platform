/**
 * VIVIM SDK — Plugin Loader System
 *
 * Inspired by vCode's `src/services/plugins/` pattern.
 * Generic plugin lifecycle: discovery → installation → loading → execution → auto-update.
 *
 * Plugins can provide:
 * - Tools (callable by agents)
 * - Nodes (loadable into the SDK graph)
 * - Skills (reusable workflows)
 * - Commands (user-facing operations)
 *
 * Plugin format: a JS/TS module exporting a `VivimPlugin` object.
 */

import type { Tool } from '../core/tools.js';
import type { APINodeDefinition } from '../core/types.js';

/**
 * Plugin source type.
 */
export type PluginSourceType = 'local' | 'registry' | 'github' | 'npm' | 'ipfs';

/**
 * Plugin status.
 */
export type PluginStatus = 'discovered' | 'installed' | 'loading' | 'loaded' | 'error' | 'disabled';

/**
 * Plugin metadata.
 */
export interface PluginManifest {
  /** Unique plugin name */
  name: string;
  /** Semantic version */
  version: string;
  /** Plugin description */
  description: string;
  /** Plugin author */
  author?: string;
  /** License */
  license?: string;
  /** Homepage/docs URL */
  homepage?: string;
  /** Minimum SDK version required */
  minSdkVersion?: string;
  /** Plugin dependencies */
  dependencies?: string[];
  /** Plugin capabilities */
  capabilities: PluginCapability[];
}

/**
 * Plugin capability declaration.
 */
export interface PluginCapability {
  type: 'tool' | 'node' | 'skill' | 'command' | 'hook' | 'middleware';
  name: string;
  description: string;
}

/**
 * Installed plugin info.
 */
export interface InstalledPlugin {
  manifest: PluginManifest;
  source: PluginSourceType;
  sourcePath: string;
  status: PluginStatus;
  installedAt: number;
  lastLoadedAt?: number;
  error?: string;
}

/**
 * Plugin exports — what a plugin module must export.
 */
export interface PluginExports {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Tools provided by this plugin */
  tools?: Tool<any, any>[];
  /** Node definitions provided by this plugin */
  nodes?: APINodeDefinition<any>[];
  /** Skills provided by this plugin */
  skills?: Array<{ name: string; description: string; execute: (input: unknown) => Promise<unknown> }>;
  /** Plugin initialization function */
  init?: (context: PluginContext) => Promise<void>;
  /** Plugin cleanup function */
  destroy?: () => Promise<void>;
}

/**
 * Context provided to plugins during initialization.
 */
export interface PluginContext {
  /** SDK version */
  sdkVersion: string;
  /** Logger for the plugin */
  log: {
    info: (msg: string, data?: unknown) => void;
    warn: (msg: string, data?: unknown) => void;
    error: (msg: string, data?: unknown) => void;
  };
  /** Access to the SDK's tool registry */
  registerTool: (tool: Tool<any, any>) => void;
  /** Access to the SDK's node loader */
  registerNode: (node: APINodeDefinition<any>) => void;
  /** Get config for this plugin */
  getConfig: () => Record<string, unknown>;
  /** Emit plugin events */
  emitEvent: (type: string, data: unknown) => void;
}

/**
 * Plugin event.
 */
export interface PluginEvent {
  type: 'plugin_discovered' | 'plugin_installed' | 'plugin_loaded' | 'plugin_error' | 'plugin_removed';
  pluginName: string;
  timestamp: number;
  data?: unknown;
}

/**
 * Plugin Loader — discovers, installs, loads, and manages plugins.
 */
export class PluginLoader {
  private plugins: Map<string, InstalledPlugin> = new Map();
  private pluginExports: Map<string, PluginExports> = new Map();
  private listeners: Array<(event: PluginEvent) => void> = [];

  constructor(
    private pluginDirectories: string[] = [],
    private autoLoad = true
  ) {}

  /**
   * Discover plugins in configured directories.
   */
  async discover(): Promise<PluginManifest[]> {
    const manifests: PluginManifest[] = [];

    for (const dir of this.pluginDirectories) {
      try {
        // In production, scan directory for plugin manifests
        // For now, this is a hook for external systems to register plugins
        const discovered = await this.scanDirectory(dir);
        manifests.push(...discovered);
      } catch (error) {
        this.emitEvent({
          type: 'plugin_error',
          pluginName: dir,
          timestamp: Date.now(),
          data: { error: String(error) },
        });
      }
    }

    return manifests;
  }

  /**
   * Install a plugin from a source.
   */
  async install(
    name: string,
    source: PluginSourceType,
    sourcePath: string,
    manifest: PluginManifest
  ): Promise<InstalledPlugin> {
    const plugin: InstalledPlugin = {
      manifest,
      source,
      sourcePath,
      status: 'installed',
      installedAt: Date.now(),
    };

    this.plugins.set(name, plugin);

    this.emitEvent({
      type: 'plugin_installed',
      pluginName: name,
      timestamp: Date.now(),
      data: { source, sourcePath },
    });

    return plugin;
  }

  /**
   * Load a plugin — execute its init function and register its capabilities.
   */
  async load(name: string, exports: PluginExports): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    plugin.status = 'loading';

    try {
      // Check SDK version compatibility
      if (exports.manifest.minSdkVersion) {
        // In production, check against actual SDK version
      }

      // Run init
      const context: PluginContext = {
        sdkVersion: '2.0.0',
        log: {
          info: (msg, data) => console.log(`[Plugin:${name}] ${msg}`, data ?? ''),
          warn: (msg, data) => console.warn(`[Plugin:${name}] ${msg}`, data ?? ''),
          error: (msg, data) => console.error(`[Plugin:${name}] ${msg}`, data ?? ''),
        },
        registerTool: (tool) => {
          // Registered via external tool registry
        },
        registerNode: (node) => {
          // Registered via external node loader
        },
        getConfig: () => ({}),
        emitEvent: (type, data) => {
          this.emitEvent({ type: type as PluginEvent['type'], pluginName: name, timestamp: Date.now(), data });
        },
      };

      if (exports.init) {
        await exports.init(context);
      }

      plugin.status = 'loaded';
      plugin.lastLoadedAt = Date.now();
      this.pluginExports.set(name, exports);

      this.emitEvent({
        type: 'plugin_loaded',
        pluginName: name,
        timestamp: Date.now(),
        data: {
          tools: exports.tools?.length ?? 0,
          nodes: exports.nodes?.length ?? 0,
        },
      });

      return true;
    } catch (error) {
      plugin.status = 'error';
      plugin.error = String(error);

      this.emitEvent({
        type: 'plugin_error',
        pluginName: name,
        timestamp: Date.now(),
        data: { error: String(error) },
      });

      return false;
    }
  }

  /**
   * Unload a plugin.
   */
  async unload(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    try {
      const exports = this.pluginExports.get(name);
      if (exports?.destroy) {
        await exports.destroy();
      }

      this.pluginExports.delete(name);
      plugin.status = 'disabled';

      return true;
    } catch (error) {
      plugin.error = String(error);
      return false;
    }
  }

  /**
   * Uninstall (remove) a plugin.
   */
  async uninstall(name: string): Promise<boolean> {
    await this.unload(name);
    const removed = this.plugins.delete(name);

    if (removed) {
      this.emitEvent({
        type: 'plugin_removed',
        pluginName: name,
        timestamp: Date.now(),
      });
    }

    return removed;
  }

  /**
   * Get a plugin's exports.
   */
  getExports(name: string): PluginExports | null {
    return this.pluginExports.get(name) ?? null;
  }

  /**
   * Get plugin info.
   */
  getInfo(name: string): InstalledPlugin | null {
    return this.plugins.get(name) ?? null;
  }

  /**
   * List all plugins.
   */
  listPlugins(): InstalledPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all tools from all loaded plugins.
   */
  getAllPluginTools(): Array<{ tool: Tool<any, any>; pluginName: string }> {
    const tools: Array<{ tool: Tool<any, any>; pluginName: string }> = [];

    for (const [name, exports] of this.pluginExports.entries()) {
      for (const tool of exports.tools ?? []) {
        tools.push({ tool, pluginName: name });
      }
    }

    return tools;
  }

  /**
   * Get all nodes from all loaded plugins.
   */
  getAllPluginNodes(): Array<{ node: APINodeDefinition<any>; pluginName: string }> {
    const nodes: Array<{ node: APINodeDefinition<any>; pluginName: string }> = [];

    for (const [name, exports] of this.pluginExports.entries()) {
      for (const node of exports.nodes ?? []) {
        nodes.push({ node, pluginName: name });
      }
    }

    return nodes;
  }

  /**
   * Subscribe to plugin events.
   */
  onEvent(listener: (event: PluginEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Reload all plugins.
   */
  async reloadAll(): Promise<{ loaded: number; errors: number }> {
    let loaded = 0;
    let errors = 0;

    for (const [name, exports] of this.pluginExports.entries()) {
      const success = await this.load(name, exports);
      if (success) loaded++;
      else errors++;
    }

    return { loaded, errors };
  }

  private emitEvent(event: PluginEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Don't let listener errors break the event flow
      }
    }
  }

  private async scanDirectory(_dir: string): Promise<PluginManifest[]> {
    // In production, scan filesystem for plugin manifests
    return [];
  }

  /**
   * Destroy the plugin loader and unload all plugins.
   */
  async destroy(): Promise<void> {
    for (const name of this.pluginExports.keys()) {
      await this.unload(name);
    }
    this.plugins.clear();
    this.pluginExports.clear();
    this.listeners = [];
  }
}
