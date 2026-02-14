/**
 * Global Content Rendering Toolkit - Configuration
 * Default configuration and config management
 */

import type { ContentRendererConfig } from './ContentRenderer.types';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default content renderer configuration
 */
export const DEFAULT_CONTENT_RENDERER_CONFIG: ContentRendererConfig = {
  // Default options
  defaultMaxImageWidth: 800,
  defaultTheme: 'auto',
  defaultLanguage: 'en',

  // Feature flags
  enableMermaid: true,
  enableKaTeX: true,
  enableSyntaxHighlighting: true,
  enableCopyToClipboard: true,
  enableLazyLoading: true,

  // Performance
  virtualScrollThreshold: 100,
  debounceRenderMs: 100,

  // Error handling
  showErrors: true,

  // Custom renderers (can be extended)
  customRenderers: {},
};

// ============================================================================
// CONFIG STATE
// ============================================================================

/**
 * Global config state
 */
let currentConfig: ContentRendererConfig = { ...DEFAULT_CONTENT_RENDERER_CONFIG };

/**
 * Config subscribers
 */
const configSubscribers: Set<(config: ContentRendererConfig) => void> = new Set();

// ============================================================================
// CONFIG MANAGEMENT
// ============================================================================

/**
 * Get current config
 */
export function getContentRendererConfig(): ContentRendererConfig {
  return { ...currentConfig };
}

/**
 * Set config (partial merge)
 */
export function setContentRendererConfig(config: Partial<ContentRendererConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  notifySubscribers();
}

/**
 * Reset config to defaults
 */
export function resetContentRendererConfig(): void {
  currentConfig = { ...DEFAULT_CONTENT_RENDERER_CONFIG };
  notifySubscribers();
}

/**
 * Subscribe to config changes
 */
export function subscribeToConfig(
  callback: (config: ContentRendererConfig) => void
): () => void {
  configSubscribers.add(callback);
  // Return unsubscribe function
  return () => configSubscribers.delete(callback);
}

/**
 * Notify all subscribers of config changes
 */
function notifySubscribers(): void {
  configSubscribers.forEach(callback => callback({ ...currentConfig }));
}

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

/**
 * Get current theme
 */
export function getCurrentTheme(): 'light' | 'dark' {
  const { theme } = currentConfig;
  
  if (theme === 'auto') {
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  
  return theme || 'light';
}

/**
 * Detect system theme preference
 */
export function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Listen for system theme changes
 */
export function listenToSystemThemeChanges(
  callback: (theme: 'light' | 'dark') => void
): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', listener);

  // Return unsubscribe function
  return () => mediaQuery.removeEventListener('change', listener);
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof ContentRendererConfig): boolean {
  return Boolean(currentConfig[feature]);
}

/**
 * Enable a feature
 */
export function enableFeature(feature: keyof ContentRendererConfig): void {
  if (typeof currentConfig[feature] === 'boolean') {
    currentConfig = { ...currentConfig, [feature]: true };
    notifySubscribers();
  }
}

/**
 * Disable a feature
 */
export function disableFeature(feature: keyof ContentRendererConfig): void {
  if (typeof currentConfig[feature] === 'boolean') {
    currentConfig = { ...currentConfig, [feature]: false };
    notifySubscribers();
  }
}

// ============================================================================
// CUSTOM RENDERERS
// ============================================================================

/**
 * Register a custom renderer
 */
export function registerCustomRenderer(
  type: string,
  renderer: React.ComponentType<any>
): void {
  currentConfig.customRenderers = {
    ...currentConfig.customRenderers,
    [type]: renderer,
  };
  notifySubscribers();
}

/**
 * Unregister a custom renderer
 */
export function unregisterCustomRenderer(type: string): void {
  const { customRenderers } = currentConfig;
  if (customRenderers[type]) {
    const newRenderers = { ...customRenderers };
    delete newRenderers[type];
    currentConfig = { ...currentConfig, customRenderers: newRenderers };
    notifySubscribers();
  }
}

/**
 * Get all custom renderers
 */
export function getCustomRenderers(): Record<string, React.ComponentType<any>> {
  return { ...currentConfig.customRenderers };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize config from localStorage
 */
export function initContentRendererConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = localStorage.getItem('content-renderer-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      currentConfig = { ...DEFAULT_CONTENT_RENDERER_CONFIG, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load content renderer config from localStorage:', error);
  }

  // Listen for system theme changes
  const systemTheme = detectSystemTheme();
  if (currentConfig.theme === 'auto') {
    // Update config with detected theme
    // (This will be resolved at render time)
  }

  // Persist config
  persistConfig();
}

/**
 * Persist config to localStorage
 */
function persistConfig(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('content-renderer-config', JSON.stringify(currentConfig));
  } catch (error) {
    console.warn('Failed to persist content renderer config:', error);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEFAULT_CONTENT_RENDERER_CONFIG,
};
