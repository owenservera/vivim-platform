/**
 * Enhanced Content Renderer with Mermaid, LaTeX, and Markdown support
 * Version 2.0 - Improved rendering with better performance and accessibility
 */

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { 
  Code, 
  Table, 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  FileText, 
  Loader2,
  Image,
  Terminal,
  AlertTriangle,
  Copy,
  Check
} from 'lucide-react';
import type { ContentBlock, ContentPart, Message } from '../../types/conversation';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../hooks/useToast';

// Dynamic imports for heavy libraries
let mermaid: any = null;
let katex: any = null;

// Initialize libraries lazily with better error handling
async function initMermaid() {
  if (!mermaid) {
    try {
      mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      });
    } catch (error) {
      console.warn('Mermaid library not available:', error);
      return null;
    }
  }
  return mermaid;
}

async function initKatex() {
  if (!katex) {
    try {
      katex = await import('katex');
    } catch (error) {
      console.warn('KaTeX library not available:', error);
      return null;
    }
  }
  return katex;
}

// Utility function to generate unique IDs
const generateId = (prefix: string = 'part') => `${prefix}-${Math.random().toString(36).substring(2, 9)}`;

// Props for the content renderer
export interface ContentRendererProps {
  content: string | ContentBlock[] | ContentPart[];
  className?: string;
  showMetadata?: boolean;
  maxImageWidth?: number;
  enableCopy?: boolean;
}

// Props for individual part renderers
interface PartRendererProps {
  part: ContentBlock | ContentPart;
  index: number;
  enableCopy?: boolean;
  maxImageWidth?: number;
}

// Type guards for content
const isContentBlock = (part: ContentBlock | ContentPart): part is ContentBlock => {
  return 'type' in part && typeof part.type === 'string';
};

const isStringContent = (content: any): content is string => {
  return typeof content === 'string';
};

const isArrayContent = (content: any): content is ContentBlock[] | ContentPart[] => {
  return Array.isArray(content);
};

/**
 * Main Content Renderer Component - Memoized for performance
 */
export const ContentRenderer: React.FC<ContentRendererProps> = memo(({ 
  content, 
  className = '',
  showMetadata = false,
  maxImageWidth = 800,
  enableCopy = true 
}) => {
  const toast = useToast();

  // Handle string content (legacy/simple text)
  if (isStringContent(content)) {
    return (
      <div className={`prose prose-invert max-w-none text-sm ${className}`}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  // Handle array of content parts
  if (!isArrayContent(content)) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        <AlertCircle className="inline w-4 h-4 mr-1" />
        Invalid content format
      </div>
    );
  }

  // Filter out empty or invalid parts
  const validParts = content.filter(part => {
    if (!part) return false;
    if (isStringContent(part.content)) return part.content.trim().length > 0;
    if (Array.isArray(part.content)) return part.content.length > 0;
    return true;
  });

  if (validParts.length === 0) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        <FileText className="inline w-4 h-4 mr-1" />
        No content to display
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Rendered content">
      {validParts.map((part, index) => (
        <ContentPart 
          key={part.id || generateId(`part-${index}`)} 
          part={part} 
          index={index}
          enableCopy={enableCopy}
          maxImageWidth={maxImageWidth}
        />
      ))}
    </div>
  );
});

ContentRenderer.displayName = 'ContentRenderer';

/**
 * Individual Content Part Renderer - Memoized for performance
 */
const ContentPart: React.FC<PartRendererProps> = memo(({ part, index, enableCopy = true, maxImageWidth = 800 }) => {
  const type = part.type;

  const renderPart = () => {
    switch (type) {
      case 'text':
        return <TextPart part={part as any} enableCopy={enableCopy} />;
      case 'code':
        return <CodePart part={part as any} enableCopy={enableCopy} />;
      case 'image':
        return <ImagePart part={part as any} maxImageWidth={maxImageWidth} />;
      case 'latex':
      case 'math':
        return <LatexPart part={part as any} />;
      case 'table':
        return <TablePart part={part as any} />;
      case 'mermaid':
        return <MermaidPart part={part as any} />;
      case 'tool_call':
        return <ToolCallPart part={part as any} />;
      case 'tool_result':
        return <ToolResultPart part={part as any} />;
      case 'link':
        return <LinkPart part={part as any} />;
      case 'audio':
        return <AudioPart part={part as any} />;
      case 'video':
        return <VideoPart part={part as any} />;
      case 'file':
        return <FilePart part={part as any} />;
      case 'html':
        return <HtmlPart part={part as any} />;
      case 'quote':
        return <QuotePart part={part as any} />;
      default:
        return <UnknownPart part={part} />;
    }
  };

  return (
    <div 
      className="content-part"
      data-index={index}
      data-type={type}
      role="group"
      aria-label={`${type} content, item ${index + 1}`}
    >
      {renderPart()}
    </div>
  );
});

ContentPart.displayName = 'ContentPart';

/**
 * Text Part Renderer with Markdown support and copy functionality
 */
const TextPart: React.FC<{ part: any; enableCopy?: boolean }> = memo(({ part, enableCopy = true }) => {
  const content = isStringContent(part.content) ? part.content : String(part.content ?? '');
  const format = part.metadata?.format || 'markdown';
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Text copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy text');
    }
  }, [content, toast]);

  if (format === 'markdown' || format === undefined) {
    return (
      <div className="relative group">
        <div className="prose prose-invert prose-sm max-w-none text-gray-950 dark:text-gray-200">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {enableCopy && content.length > 10 && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-gray-700/50 hover:bg-gray-700/80"
            aria-label="Copy text"
            title="Copy text"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-950 dark:text-gray-200 whitespace-pre-wrap">
      {content}
    </div>
  );
});

TextPart.displayName = 'TextPart';

/**
 * Code Part Renderer with syntax highlighting and copy functionality
 */
const CodePart: React.FC<{ part: any; enableCopy?: boolean }> = memo(({ part, enableCopy = true }) => {
  let content = '';
  if (isStringContent(part.content)) {
    content = part.content;
  } else {
    content = JSON.stringify(part.content, null, 2);
  }

  const language = part.language || part.metadata?.language || 'text';
  const filename = part.metadata?.filename;
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy code');
    }
  }, [content, toast]);

  // Truncate very long code blocks for performance
  const shouldTruncate = content.length > 1000;
  const displayContent = shouldTruncate ? content.substring(0, 1000) + '...' : content;

  return (
    <div className="my-3 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
      {(filename || language) && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border-b border-gray-700">
          {filename ? (
            <>
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-300 font-mono">{filename}</span>
            </>
          ) : (
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="ml-auto text-[10px] text-gray-500 uppercase">{language}</span>
          {enableCopy && (
            <button
              onClick={handleCopy}
              className="ml-2 p-1 rounded hover:bg-gray-700 transition-colors"
              aria-label="Copy code"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
            </button>
          )}
        </div>
      )}
      <pre className="p-3 overflow-x-auto">
        <code className={`text-xs font-mono text-gray-300 language-${language}`}>
          {displayContent}
        </code>
      </pre>
      {shouldTruncate && (
        <div className="px-3 py-1 bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400 text-center">
          Code truncated for performance. Click copy to view full code.
        </div>
      )}
    </div>
  );
});

CodePart.displayName = 'CodePart';

/**
 * Image Part Renderer with lazy loading and error handling
 */
const ImagePart: React.FC<{ part: any; maxImageWidth?: number }> = memo(({ part, maxImageWidth = 800 }) => {
  let src = '';
  if (isStringContent(part.content)) {
    src = part.content;
  } else if (part.url) {
    src = part.url;
  }

  const alt = part.alt || part.metadata?.alt || 'Image';
  const caption = part.caption || part.metadata?.caption;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState(1);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  const handleZoom = () => {
    setScale(scale === 1 ? 2 : 1);
  };

  if (error) {
    return (
      <div className="my-3 p-4 rounded-lg bg-red border border-red-900/50">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load image</span>
        </div>
        <p className="text-xs text-red-300 mt-2 font-mono break-all">{src}</p>
      </div>
    );
  }

  return (
    <div className="my-3">
      <div className={`relative inline-block ${scale > 1 ? 'cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={handleZoom}>
        {!loaded && (
          <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ minWidth: '200px', minHeight: '150px' }}>
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`rounded-lg max-w-full h-auto border border-gray-700 transition-transform ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ maxWidth: `${maxImageWidth}px`, transform: `scale(${scale})` }}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
      {caption && (
        <p className="text-xs text-gray-400 text-center mt-2 italic">{caption}</p>
      )}
    </div>
  );
});

ImagePart.displayName = 'ImagePart';

/**
 * LaTeX/Math Part Renderer with KaTeX - Improved error handling and loading states
 */
const LatexPart: React.FC<{ part: any }> = memo(({ part }) => {
  const content = isStringContent(part.content) ? part.content : String(part.content ?? '');
  const display = part.display ?? part.metadata?.display ?? 'block';
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderMath = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const katexLib = await initKatex();
        if (!katexLib) {
          setError('KaTeX library not available');
          return;
        }
        const html = katexLib.renderToString(content, {
          displayMode: display === 'block',
          throwOnError: false,
        });
        setRenderedHtml(html);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render math');
      } finally {
        setIsLoading(false);
      }
    };
    renderMath();
  }, [content, display]);

  if (error) {
    return (
      <div className="my-2 p-2 rounded bg-red-900/20 border border-red-700/50">
        <code className="text-xs text-red-300 font-mono">{content}</code>
        <p className="text-[10px] text-red-400 mt-1">{error}</p>
      </div>
    );
  }

  if (isLoading || !renderedHtml) {
    return (
      <div className={`my-2 ${display === 'block' ? 'text-center' : 'inline'}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline" />
      </div>
    );
  }

  return (
    <div 
      className={`my-2 ${display === 'block' ? 'text-center overflow-x-auto' : 'inline'}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
});

LatexPart.displayName = 'LatexPart';

/**
 * Table Part Renderer - Improved accessibility and styling
 */
const TablePart: React.FC<{ part: any }> = memo(({ part }) => {
  let headers: string[] = [];
  let rows: string[][] = [];

  if (typeof part.content === 'object' && part.content !== null) {
    if ('headers' in part.content && 'rows' in part.content) {
      headers = part.content.headers || [];
      rows = part.content.rows || [];
    }
  }

  if (headers.length === 0 && rows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm my-2">
        <Table className="w-4 h-4" />
        <span className="italic">Empty table</span>
      </div>
    );
  }

  return (
    <div className="my-3 overflow-x-auto">
      <table className="min-w-full border border-gray-700 rounded-lg overflow-hidden" role="table" aria-label="Data table">
        <thead className="bg-gray-800">
          <tr>
            {headers.map((header, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-gray-200 border-b border-r border-gray-700" role="columnheader" scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900/50" role="rowgroup">
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-700" role="row">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-sm text-gray-300 border-r border-gray-700" role="cell">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

TablePart.displayName = 'TablePart';

/**
 * Mermaid Diagram Part Renderer - Improved error handling and loading states
 */
const MermaidPart: React.FC<{ part: any }> = memo(({ part }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const diagramId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const mermaidLib = await initMermaid();
        if (!mermaidLib) {
          setError('Mermaid library not available');
          return;
        }
        
        const { svg } = await mermaidLib.render(diagramId.current, part.content);
        setSvg(svg);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsLoading(false);
      }
    };
    
    renderDiagram();
  }, [part.content]);

  if (error) {
    return (
      <div className="my-3 p-3 rounded bg-red-900/20 border border-red-700/50">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Failed to render diagram</span>
        </div>
        <pre className="text-xs text-red-300 overflow-x-auto">{part.content}</pre>
        <p className="text-[10px] text-red-400 mt-2">{error}</p>
      </div>
    );
  }

  if (isLoading || !svg) {
    return (
      <div className="my-3 p-8 flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Rendering diagram...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="my-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});

MermaidPart.displayName = 'MermaidPart';

/**
 * Tool Call Part Renderer
 */
const ToolCallPart: React.FC<{ part: any }> = memo(({ part }) => {
  const name = part.name || part.metadata?.name || 'Unknown tool';
  const arguments_ = part.arguments || part.metadata?.arguments || {};
  
  return (
    <div className="my-2 p-2 rounded bg-blue-900/20 border border-blue-700/50">
      <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-1">
        <Wrench className="w-3 h-3" />
        <span>Tool: {name}</span>
      </div>
      <pre className="text-xs text-blue-300 overflow-x-auto">
        {JSON.stringify(arguments_, null, 2)}
      </pre>
    </div>
  );
});

ToolCallPart.displayName = 'ToolCallPart';

/**
 * Tool Result Part Renderer
 */
const ToolResultPart: React.FC<{ part: any }> = memo(({ part }) => {
  const isError = part.isError || part.metadata?.isError;
  const result = part.result || part.content || '';
  
  return (
    <div className={`my-2 p-2 rounded ${isError ? 'bg-red-900/20 border border-red-700/50' : 'bg-green-900/20 border border-green-700/50'}`}>
      <div className="flex items-center gap-2 text-xs font-medium mb-1">
        {isError ? (
          <>
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-red-400">Tool Error</span>
          </>
        ) : (
          <>
            <CheckCircle className="w-3 h-3 text-green-400" />
            <span className="text-green-400">Tool Result</span>
          </>
        )}
      </div>
      <pre className={`text-xs ${isError ? 'text-red-300' : 'text-green-300'} overflow-x-auto`}>
        {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
});

ToolResultPart.displayName = 'ToolResultPart';

/**
 * Link Part Renderer
 */
const LinkPart: React.FC<{ part: any }> = memo(({ part }) => {
  const url = part.url || part.content?.url || '';
  const text = part.text || part.content?.text || url;
  const title = part.title || part.content?.title;
  
  return (
    <a 
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
    >
      {text}
      {title && <span className="text-gray-500 text-xs ml-1">({title})</span>}
    </a>
  );
});

LinkPart.displayName = 'LinkPart';

/**
 * Audio Part Renderer
 */
const AudioPart: React.FC<{ part: any }> = memo(({ part }) => {
  const src = part.url || part.content || '';
  
  return (
    <div className="my-2">
      <audio controls className="w-full max-w-md">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
});

AudioPart.displayName = 'AudioPart';

/**
 * Video Part Renderer
 */
const VideoPart: React.FC<{ part: any }> = memo(({ part }) => {
  const src = part.url || part.content || '';
  const poster = part.poster || part.metadata?.poster;
  
  return (
    <div className="my-2">
      <video controls className="w-full max-w-xl rounded-lg" poster={poster}>
        <source src={src} />
        Your browser does not support the video element.
      </video>
    </div>
  );
});

VideoPart.displayName = 'VideoPart';

/**
 * File Part Renderer
 */
const FilePart: React.FC<{ part: any }> = memo(({ part }) => {
  const name = part.name || part.metadata?.name || 'Download';
  const url = part.url || part.content?.url || '';
  const size = part.size || part.metadata?.size;
  const type = part.type || part.metadata?.type;
  
  return (
    <a 
      href={url}
      download={name}
      className="inline-flex items-center gap-2 px-3 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
    >
      <FileText className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-200">{name}</span>
      {size && <span className="text-xs text-gray-500">({size})</span>}
      {type && <span className="text-xs text-gray-500">{type}</span>}
    </a>
  );
});

FilePart.displayName = 'FilePart';

/**
 * HTML Part Renderer
 */
const HtmlPart: React.FC<{ part: any }> = memo(({ part }) => {
  const html = part.html || part.content || '';
  
  return (
    <div 
      className="my-2 p-2 bg-gray-800/30 rounded border border-gray-700"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

HtmlPart.displayName = 'HtmlPart';

/**
 * Quote Part Renderer
 */
const QuotePart: React.FC<{ part: any }> = memo(({ part }) => {
  const text = part.text || part.content || '';
  const author = part.author || part.metadata?.author;
  
  return (
    <blockquote className="my-2 pl-4 border-l-2 border-gray-500 italic text-gray-300">
      <p className="text-sm">{text}</p>
      {author && <cite className="text-xs text-gray-500 mt-1 block">— {author}</cite>}
    </blockquote>
  );
});

QuotePart.displayName = 'QuotePart';

/**
 * Unknown Part Renderer - Graceful fallback
 */
const UnknownPart: React.FC<{ part: any }> = ({ part }) => {
  const type = part.type || 'unknown';
  
  return (
    <div className="my-2 p-2 rounded bg-yellow-900/20 border border-yellow-700/50">
      <div className="flex items-center gap-2 text-yellow-400 text-xs font-medium mb-1">
        <AlertTriangle className="w-3 h-3" />
        <span>Unsupported content type: {type}</span>
      </div>
      <pre className="text-xs text-yellow-300 overflow-x-auto">
        {JSON.stringify(part, null, 2)}
      </pre>
    </div>
  );
};

UnknownPart.displayName = 'UnknownPart';

/**
 * Export additional utilities for external use
 */
export { 
  ContentRenderer as default,
  TextPart,
  CodePart,
  ImagePart,
  LatexPart,
  TablePart,
  MermaidPart,
  ToolCallPart,
  ToolResultPart,
  LinkPart,
  AudioPart,
  VideoPart,
  FilePart,
  HtmlPart,
  QuotePart,
  UnknownPart,
};
