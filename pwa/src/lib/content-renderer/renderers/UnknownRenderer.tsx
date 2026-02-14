/**
 * Global Content Rendering Toolkit - Unknown/Fallback Renderer
 * Fallback renderer for unknown or unsupported content types
 */

import React, { memo } from 'react';
import { AlertCircle, FileText, RefreshCw } from 'lucide-react';
import type { ContentBlockRendererProps } from '../ContentRenderer.types';

// ============================================================================
// UNKNOWN RENDERER COMPONENT
// ============================================================================

export const UnknownRenderer: React.FC<ContentBlockRendererProps> = memo(({
  block,
  theme,
}) => {
  // Get content for display
  const content = typeof block.content === 'string'
    ? block.content
    : JSON.stringify(block.content, null, 2);

  // Truncate content for display
  const truncatedContent = typeof content === 'string' && content.length > 200
    ? content.substring(0, 200) + '...'
    : content;

  return (
    <div className={`content-unknown-renderer ${block.className || ''}`}>
      {/* Icon */}
      <div className="content-unknown-icon">
        <AlertCircle className="content-unknown-icon-svg" />
      </div>

      {/* Message */}
      <div className="content-unknown-content">
        <h3 className="content-unknown-title">
          Unknown Content Type
        </h3>
        <p className="content-unknown-description">
          This content type ({block.type}) is not supported by the current renderer.
        </p>
      </div>

      {/* Raw content preview */}
      <div className="content-unknown-preview">
        <div className="content-unknown-preview-header">
          <FileText className="content-unknown-preview-icon" />
          <span className="content-unknown-preview-title">Raw Content</span>
        </div>
        <pre className="content-unknown-preview-content">
          <code className="content-unknown-preview-code">
            {truncatedContent}
          </code>
        </pre>
        {typeof content === 'string' && content.length > 200 && (
          <button className="content-unknown-show-more">
            Show full content
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="content-unknown-actions">
        <button
          className="content-unknown-action-button"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="content-unknown-action-icon" />
          <span className="content-unknown-action-text">Reload Page</span>
        </button>
      </div>
    </div>
  );
});

UnknownRenderer.displayName = 'UnknownRenderer';

export default UnknownRenderer;
