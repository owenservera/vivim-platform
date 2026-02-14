/**
 * Global Content Rendering Toolkit - Code Renderer
 * Renders code blocks with syntax highlighting
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import { FileText, Terminal, Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import type { CodeRendererProps } from '../ContentRenderer.types';

// ============================================================================
// CODE RENDERER COMPONENT
// ============================================================================

export const CodeRenderer: React.FC<CodeRendererProps> = memo(({
  block,
  config,
  theme,
  onCopy,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [wordWrap, setWordWrap] = useState(block.metadata?.wordWrap !== false);

  // Get content
  const content = typeof block.content === 'string'
    ? block.content
    : JSON.stringify(block.content, null, 2);

  const language = block.language || block.metadata?.language || 'text';
  const filename = block.metadata?.filename || `code.${getLanguageExtension(language)}`;
  const showLineNumbers = block.metadata?.showLineNumbers !== false;
  const showLanguage = block.metadata?.showLanguage !== false;
  const showCopyButton = block.metadata?.showCopyButton !== false;
  const showDownloadButton = block.metadata?.showDownloadButton !== false;
  const maxHeight = block.metadata?.maxHeight;

  // Calculate line count
  const lineCount = content.split('\n').length;

  // Handle copy
  const handleCopy = useCallback(async () => {
    if (!config.enableCopyToClipboard || !onCopy) return;

    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy(content);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[CodeRenderer] Failed to copy:', error);
    }
  }, [content, config.enableCopyToClipboard, onCopy]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!onDownload) return;

    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onDownload(content, filename);
    } catch (error) {
      console.error('[CodeRenderer] Failed to download:', error);
    }
  }, [content, filename, onDownload]);

  // Handle expand/collapse
  const handleToggle = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // Handle word wrap toggle
  const handleToggleWordWrap = useCallback(() => {
    setWordWrap(!wordWrap);
  }, [wordWrap]);

  // Generate line numbers
  const lineNumbers = showLineNumbers
    ? Array.from({ length: lineCount }, (_, i) => i + 1)
    : null;

  return (
    <div className={`content-code-renderer ${block.className || ''}`}>
      {/* Header */}
      <div className="content-code-header">
        <div className="content-code-header-left">
          {filename ? (
            <>
              <FileText className="content-code-language-icon" />
              <span className="content-code-language">{filename}</span>
            </>
          ) : (
            <>
              <Terminal className="content-code-language-icon" />
              <span className="content-code-language">{language}</span>
            </>
          )}
        </div>
        <div className="content-code-header-right">
          {/* Copy button */}
          {showCopyButton && config.enableCopyToClipboard && onCopy && (
            <button
              onClick={handleCopy}
              className="content-code-header-button"
              aria-label="Copy code"
              type="button"
            >
              {copied ? (
                <Check className="content-code-header-icon content-code-header-success" />
              ) : (
                <Copy className="content-code-header-icon" />
              )}
            </button>
          )}

          {/* Download button */}
          {showDownloadButton && onDownload && (
            <button
              onClick={handleDownload}
              className="content-code-header-button"
              aria-label="Download code"
              type="button"
            >
              <Download className="content-code-header-icon" />
            </button>
          )}

          {/* Word wrap toggle */}
          <button
            onClick={handleToggleWordWrap}
            className="content-code-header-button"
            aria-label={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
            aria-pressed={wordWrap}
            type="button"
          >
            <div className="content-code-word-wrap-indicator">
              <div className={`content-code-word-wrap-line ${wordWrap ? 'content-code-word-wrap-active' : ''}`} />
              <div className={`content-code-word-wrap-line ${wordWrap ? '' : 'content-code-word-wrap-active'}`} />
            </div>
          </button>

          {/* Expand/collapse */}
          {maxHeight && lineCount > 10 && (
            <button
              onClick={handleToggle}
              className="content-code-header-button"
              aria-label={expanded ? 'Collapse code' : 'Expand code'}
              aria-expanded={expanded}
              type="button"
            >
              {expanded ? (
                <ChevronUp className="content-code-header-icon" />
              ) : (
                <ChevronDown className="content-code-header-icon" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div
        className={`content-code-content ${wordWrap ? 'content-code-content-wrapped' : ''}`}
        style={{
          maxHeight: expanded ? maxHeight : undefined,
        }}
      >
        {/* Line numbers */}
        {lineNumbers && (
          <div className="content-code-line-numbers">
            {lineNumbers.map(lineNum => (
              <div key={lineNum} className="content-code-line-number">
                {lineNum}
              </div>
            ))}
          </div>
        )}

        {/* Code */}
        <pre className="content-code-pre">
          <code className={`content-code-code language-${language}`}>
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
});

CodeRenderer.displayName = 'CodeRenderer';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get file extension for language
 */
function getLanguageExtension(language: string): string {
  const extensions: Record<string, string> = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rs',
    ruby: 'rb',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sql: 'sql',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yml',
    markdown: 'md',
    shell: 'sh',
    bash: 'sh',
    powershell: 'ps1',
    text: 'txt',
  };

  return extensions[language.toLowerCase()] || 'txt';
}

export default CodeRenderer;
