/**
 * Global Content Rendering Toolkit - Main Content Renderer
 * Centralized content rendering component for all content types
 */

import React, { memo, useEffect, useMemo, useCallback } from 'react';
import type {
  ContentBlock,
  ContentCollection,
  ContentRendererProps,
  ContentBlockRendererProps,
} from './ContentRenderer.types';
import {
  ContentTypeRegistry,
} from './ContentRenderer.registry';
import {
  getContentRendererConfig,
  getCurrentTheme,
} from './ContentRenderer.config';
import {
  parseContent,
  filterValidBlocks,
  normalizeContentBlocks,
  isStringContent,
  isArrayContent,
  isObjectContent,
} from './utils/content-parser';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Content Part Renderer - Renders a single content block
 */
const ContentPartRenderer: React.FC<ContentBlockRendererProps> = memo(({
  block,
  index,
  config,
  theme,
  onCopy,
  onDownload,
  onExpand,
  onError,
}) => {
  // Get renderer for this content type
  const Renderer = ContentTypeRegistry.getRenderer(block.type);

  // If no renderer, use fallback
  const ComponentToRender = Renderer || ContentTypeRegistry.getFallbackRenderer();

  if (!ComponentToRender) {
    // Render unknown content as fallback
    return (
      <div
        className="content-part-fallback"
        data-type={block.type}
        data-index={index}
      >
        <div className="content-part-fallback-inner">
          <span className="content-part-type-badge">{block.type}</span>
          <pre className="content-part-raw-content">
            {JSON.stringify(block.content, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  // Render with the appropriate renderer
  return (
    <div
      className="content-part"
      data-type={block.type}
      data-index={index}
      role="group"
      aria-label={`${block.type} content, item ${index + 1}`}
    >
      <ComponentToRender
        block={block}
        index={index}
        config={config}
        theme={theme}
        onCopy={onCopy}
        onDownload={onDownload}
        onExpand={onExpand}
        onError={onError}
      />
    </div>
  );
});

ContentPartRenderer.displayName = 'ContentPartRenderer';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main Content Renderer Component
 */
export const ContentRenderer: React.FC<ContentRendererProps> = memo(({
  content,
  className = '',
  maxImageWidth,
  maxContentHeight,
  enableCopy = true,
  enableDownload = true,
  enableExpand = true,
  enableSyntaxHighlighting = true,
  theme: themeProp,
  lazyLoad = true,
  virtualScroll = false,
  onBlockClick,
  onBlockRender,
  onError,
  customRenderers = {},
}) => {
  // Get config
  const config = getContentRendererConfig();

  // Get theme
  const theme = themeProp || getCurrentTheme();

  // Parse content into blocks
  const { blocks: parsedBlocks, errors: parseErrors } = useMemo(() => {
    return parseContent(content);
  }, [content]);

  // Filter valid blocks
  const validBlocks = useMemo(() => {
    return filterValidBlocks(parsedBlocks);
  }, [parsedBlocks]);

  // Normalize blocks
  const normalizedBlocks = useMemo(() => {
    return normalizeContentBlocks(validBlocks);
  }, [validBlocks]);

  // Handle parse errors
  useEffect(() => {
    parseErrors.forEach(error => {
      console.error('[ContentRenderer] Parse error:', error);
      if (onError) {
        onError(error, { type: 'error', content: error.message, id: 'parse-error' });
      }
    });
  }, [parseErrors, onError]);

  // Handle empty content
  if (normalizedBlocks.length === 0) {
    return (
      <div className={`content-renderer-empty ${className}`}>
        <div className="content-empty-state">
          <svg
            className="content-empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7m2 5h5a2 2 0 002 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6a2 2 0 012-2h2zm3 5h6M9 7h6"
            />
          </svg>
          <p className="content-empty-text">No content to display</p>
        </div>
      </div>
    );
  }

  // Copy handler
  const handleCopy = useCallback(async (content: string) => {
    if (!enableCopy) return;

    try {
      await navigator.clipboard.writeText(content);
      // Could trigger toast here
      console.debug('[ContentRenderer] Content copied to clipboard');
    } catch (error) {
      console.error('[ContentRenderer] Failed to copy:', error);
    }
  }, [enableCopy]);

  // Download handler
  const handleDownload = useCallback((content: any, filename?: string) => {
    if (!enableDownload) return;

    try {
      const blob = new Blob([
        typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'content.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.debug('[ContentRenderer] Content downloaded');
    } catch (error) {
      console.error('[ContentRenderer] Failed to download:', error);
    }
  }, [enableDownload]);

  // Expand handler
  const handleExpand = useCallback(() => {
    console.debug('[ContentRenderer] Expand triggered');
  }, []);

  // Error handler
  const handleError = useCallback((error: Error) => {
    console.error('[ContentRenderer] Render error:', error);
    if (onError) {
      onError(error, { type: 'error', content: error.message, id: 'render-error' });
    }
  }, [onError]);

  // Block click handler
  const handleBlockClick = useCallback((block: ContentBlock, index: number) => {
    if (onBlockClick) {
      onBlockClick(block, index);
    }
  }, [onBlockClick]);

  // Block render handler
  const handleBlockRender = useCallback((block: ContentBlock, index: number) => {
    if (onBlockRender) {
      onBlockRender(block, index);
    }
  }, [onBlockRender]);

  // Render blocks
  return (
    <div
      className={`content-renderer ${className}`}
      role="region"
      aria-label="Rendered content"
      style={{
        maxWidth: maxImageWidth ? `${maxImageWidth}px` : undefined,
        maxHeight: maxContentHeight ? `${maxContentHeight}px` : undefined,
      }}
    >
      {normalizedBlocks.map((block, index) => (
        <ContentPartRenderer
          key={block.id}
          block={block}
          index={index}
          config={{
            ...config,
            customRenderers: { ...config.customRenderers, ...customRenderers },
            enableSyntaxHighlighting,
            enableLazyLoading: lazyLoad,
          }}
          theme={theme}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onExpand={handleExpand}
          onError={handleError}
        />
      ))}
    </div>
  );
});

ContentRenderer.displayName = 'ContentRenderer';

// ============================================================================
// EXPORTS
// ============================================================================

export default ContentRenderer;
export { ContentPartRenderer };
