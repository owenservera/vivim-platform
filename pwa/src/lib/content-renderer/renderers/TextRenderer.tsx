/**
 * Global Content Rendering Toolkit - Text Renderer
 * Renders text and markdown content
 */

import React, { memo, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import type { TextRendererProps } from '../ContentRenderer.types';

// ============================================================================
// TEXT RENDERER COMPONENT
// ============================================================================

export const TextRenderer: React.FC<TextRendererProps> = memo(({
  block,
  config,
  theme,
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Get content
  const content = typeof block.content === 'string' 
    ? block.content 
    : String(block.content ?? '');

  const format = block.metadata?.format || 'markdown';
  const maxLength = block.metadata?.maxLength;
  const showTruncation = block.metadata?.showTruncation;

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!config.enableCopyToClipboard || !onCopy) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[TextRenderer] Failed to copy:', error);
    }
  }, [content, config.enableCopyToClipboard, onCopy]);

  // Handle expand/collapse
  const handleToggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // Truncate content if needed
  const displayContent = showTruncation && maxLength && content.length > maxLength
    ? content.substring(0, maxLength) + '...'
    : content;

  return (
    <div
      className={`content-text-renderer ${block.className || ''}`}
      data-display={block.display || 'block'}
    >
      {/* Markdown or plain text */}
      {format === 'markdown' || format === undefined ? (
        <div className="content-text-markdown">
          <ReactMarkdown
            components={{
              // Custom components for markdown elements
              a: ({ node, ...props }) => (
                <a
                  {...props}
                  className="content-text-link"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              ),
              p: ({ node, ...props }) => (
                <p {...props} className="content-text-paragraph" />
              ),
              h1: ({ node, ...props }) => (
                <h1 {...props} className="content-text-heading content-text-h1" />
              ),
              h2: ({ node, ...props }) => (
                <h2 {...props} className="content-text-heading content-text-h2" />
              ),
              h3: ({ node, ...props }) => (
                <h3 {...props} className="content-text-heading content-text-h3" />
              ),
              code: ({ node, inline, ...props }) => (
                <code {...props} className={inline ? 'content-text-inline-code' : 'content-text-code-block'} />
              ),
              pre: ({ node, ...props }) => (
                <pre {...props} className="content-text-pre" />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote {...props} className="content-text-blockquote" />
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="content-text-plain">
          {displayContent}
        </div>
      )}

      {/* Copy button */}
      {config.enableCopyToClipboard && onCopy && content.length > 20 && (
        <button
          onClick={handleCopy}
          className="content-text-copy-button"
          aria-label="Copy text"
          type="button"
        >
          {copied ? (
            <Check className="content-text-copy-icon content-text-copy-success" />
          ) : (
            <Copy className="content-text-copy-icon" />
          )}
        </button>
      )}

      {/* Expand button for truncated content */}
      {showTruncation && maxLength && content.length > maxLength && (
        <button
          onClick={handleToggle}
          className="content-text-expand-button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          aria-expanded={expanded}
          type="button"
        >
          <span className="content-text-expand-text">
            {expanded ? 'Show less' : 'Show more'}
          </span>
        </button>
      )}
    </div>
  );
});

TextRenderer.displayName = 'TextRenderer';

export default TextRenderer;
