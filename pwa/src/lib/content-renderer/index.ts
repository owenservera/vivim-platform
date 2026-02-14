/**
 * Global Content Rendering Toolkit - Main Export
 * Centralized content rendering system for all content types
 */

// ============================================================================
// IMPORT STYLES
// ============================================================================

import './styles/content-renderer.css';
import './renderers/TextRenderer.css';
import './renderers/CodeRenderer.css';
import './renderers/UnknownRenderer.css';

// ============================================================================
// IMPORT RENDERERS
// ============================================================================

import { TextRenderer, CodeRenderer, UnknownRenderer } from './renderers';
import { ContentTypeRegistry } from './ContentRenderer.registry';

// ============================================================================
// REGISTER BUILT-IN RENDERERS
// ============================================================================

// Register built-in renderers with priorities
ContentTypeRegistry.register('text', TextRenderer, 100);
ContentTypeRegistry.register('code', CodeRenderer, 100);
ContentTypeRegistry.register('json', CodeRenderer, 90); // JSON uses code renderer
ContentTypeRegistry.register('yaml', CodeRenderer, 90); // YAML uses code renderer
ContentTypeRegistry.register('xml', CodeRenderer, 90); // XML uses code renderer

// Set fallback renderer
ContentTypeRegistry.setFallbackRenderer(UnknownRenderer);

console.info('[ContentRenderer] Built-in renderers registered');

// ============================================================================
// TYPES
// ============================================================================

export type {
  ContentType,
  ACUType,
  ContentBlock,
  ContentMetadata,
  ContentCollection,
  TimelineEvent,
  PollOption,
  QuizQuestion,
  FormField,
  ContentRendererProps,
  ContentRendererConfig,
  ContentBlockRendererProps,
  TextRendererProps,
  CodeRendererProps,
  ImageRendererProps,
  MediaRendererProps,
  TableRendererProps,
  MermaidRendererProps,
  LatexRendererProps,
  ToolRendererProps,
  ACURendererProps,
  EmbedRendererProps,
  FileRendererProps,
  InteractiveRendererProps,
  CalloutRendererProps,
  TimelineRendererProps,
  ContentTypeRegistry as IContentTypeRegistry,
  ContentRendererPlugin,
  CopyResult,
  DownloadResult,
  ContentParseResult,
  ContentValidationResult,
} from './ContentRenderer.types';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export { default as ContentRenderer, ContentPartRenderer } from './ContentRenderer';

// ============================================================================
// REGISTRY
// ============================================================================

export {
  ContentTypeRegistry,
  getRenderersForType,
  getRendererPriority,
  hasMultipleRenderers,
  getRegistryStats,
} from './ContentRenderer.registry';

// ============================================================================
// CONFIG
// ============================================================================

export {
  getContentRendererConfig,
  setContentRendererConfig,
  resetContentRendererConfig,
  subscribeToConfig,
  getCurrentTheme,
  detectSystemTheme,
  listenToSystemThemeChanges,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  registerCustomRenderer,
  unregisterCustomRenderer,
  getCustomRenderers,
  DEFAULT_CONTENT_RENDERER_CONFIG,
} from './ContentRenderer.config';

// ============================================================================
// PLUGINS
// ============================================================================

export {
  registerPlugin,
  unregisterPlugin,
  getPlugin,
  getAllPlugins,
  getPluginsForContentType,
  hasPlugin,
  getPluginNames,
  initializePlugins,
  destroyAllPlugins,
  transformContentBlock,
  transformContentBlocks,
  validateContentBlock,
  validateContentBlocks,
  getPluginStats,
  isContentTypeHandled,
  getPluginContentTypes,
  plugins as pluginRegistry,
  initializedPlugins,
} from './ContentRenderer.plugins';

// ============================================================================
// UTILITIES
// ============================================================================

export {
  generateContentId,
  isStringContent,
  isArrayContent,
  isObjectContent,
  detectContentType,
  parseContent,
  normalizeContentBlocks,
  filterValidBlocks,
  mergeTextBlocks,
} from './utils/content-parser';

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the content rendering toolkit
 * Call this once at app startup
 */
export function initializeContentRenderer(): void {
  // Initialize config
  const { initContentRendererConfig } = require('./ContentRenderer.config');
  initContentRendererConfig();

  // Initialize plugins
  const { initializePlugins } = require('./ContentRenderer.plugins');
  const { getContentRendererConfig } = require('./ContentRenderer.config');
  initializePlugins(getContentRendererConfig());

  console.info('[ContentRenderer] Initialized');
}

/**
 * Cleanup the content rendering toolkit
 * Call this at app shutdown
 */
export function cleanupContentRenderer(): void {
  // Destroy all plugins
  const { destroyAllPlugins } = require('./ContentRenderer.plugins');
  destroyAllPlugins();

  console.info('[ContentRenderer] Cleaned up');
}
