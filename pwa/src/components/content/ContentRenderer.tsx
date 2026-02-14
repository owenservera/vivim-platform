/**
 * Enhanced Content Renderer with Mermaid, LaTeX, and Markdown support
 * Version 2.0 - Improved rendering with better performance and accessibility
 */

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Wrench, 
  FileText, 
  Loader2,
  Terminal,
  AlertTriangle,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../hooks/useToast';

// Simplified types to match the expected pwa context if needed
export type ContentType = 'text' | 'code' | 'image' | 'latex' | 'math' | 'table' | 'mermaid' | 'tool_call' | 'tool_result' | 'link' | 'audio' | 'video' | 'file' | 'html' | 'quote';

export interface ContentBlock {
  id?: string;
  type: ContentType;
  content: any;
  metadata?: Record<string, any>;
  language?: string;
  url?: string;
  alt?: string;
  caption?: string;
  display?: 'inline' | 'block';
  [key: string]: any;
}

export interface ContentPart extends ContentBlock {}

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
  maxImageWidth = 800,
  enableCopy = true 
}) => {
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
    // If it's an object but not an array, try to display it as JSON string or text
    const stringified = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    return (
      <div className={`prose prose-invert max-w-none text-sm ${className}`}>
        <ReactMarkdown>{stringified}</ReactMarkdown>
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
        <ContentPartRenderer 
          key={part.id || generateId(`part-${index}`)} 
          part={part as any} 
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
const ContentPartRenderer: React.FC<PartRendererProps> = memo(({ part, index, enableCopy = true, maxImageWidth = 800 }) => {
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
        // Fallback for text-based content that might be missing a type
        if (part.content && typeof part.content === 'string') {
          return <TextPart part={part as any} enableCopy={enableCopy} />;
        }
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

ContentPartRenderer.displayName = 'ContentPartRenderer';

const TextPart: React.FC<{ part: any; enableCopy?: boolean }> = memo(({ part, enableCopy = true }) => {
  const content = isStringContent(part.content) ? part.content : String(part.content ?? '');
  const format = part.metadata?.format || 'markdown';
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Text copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [content, toast]);

  if (format === 'markdown' || format === undefined) {
    return (
      <div className="relative group">
        <div className="prose prose-invert prose-sm max-w-none text-gray-200">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {enableCopy && content.length > 20 && (
          <button
            onClick={handleCopy}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-gray-800/80 hover:bg-gray-700"
            aria-label="Copy text"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-200 whitespace-pre-wrap">
      {content}
    </div>
  );
});

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
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
       toast.error('Failed to copy');
    }
  }, [content, toast]);

  return (
    <div className="my-3 rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {filename ? (
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="text-xs font-mono text-gray-300">{filename || language}</span>
        </div>
        {enableCopy && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        )}
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className={`text-xs font-mono text-gray-300 language-${language}`}>
          {content}
        </code>
      </pre>
    </div>
  );
});

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

  if (error) {
    return (
      <div className="my-3 p-4 rounded-lg bg-red-900/10 border border-red-900/30">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Image failed to load</span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-gray-900/50">
        {!loaded && (
          <div className="aspect-video flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ maxWidth: `${maxImageWidth}px` }}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
      {caption && (
        <p className="mt-2 text-center text-xs text-gray-500 italic">{caption}</p>
      )}
    </div>
  );
});

const LatexPart: React.FC<{ part: any }> = memo(({ part }) => {
  const content = isStringContent(part.content) ? part.content : String(part.content ?? '');
  const display = part.display ?? 'block';
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);

  useEffect(() => {
    const renderMath = async () => {
      try {
        const katexLib = await initKatex();
        if (katexLib) {
          const html = katexLib.renderToString(content, {
            displayMode: display === 'block',
            throwOnError: false,
          });
          setRenderedHtml(html);
        }
      } catch (err) {
        console.error('KaTeX rendering error:', err);
      }
    };
    renderMath();
  }, [content, display]);

  return (
    <div 
      className={`my-4 ${display === 'block' ? 'text-center overflow-x-auto py-2' : 'inline'}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml || content }}
    />
  );
});

const TablePart: React.FC<{ part: any }> = memo(({ part }) => {
  let headers: string[] = [];
  let rows: string[][] = [];

  if (typeof part.content === 'object' && part.content !== null) {
    headers = part.content.headers || [];
    rows = part.content.rows || [];
  }

  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-800 shadow-sm">
      <table className="min-w-full divide-y divide-gray-800">
        <thead className="bg-gray-900/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-transparent">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-800/10">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-gray-300">
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

const MermaidPart: React.FC<{ part: any }> = memo(({ part }) => {
  const [svg, setSvg] = useState<string | null>(null);
  const diagramId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const mermaidLib = await initMermaid();
        if (mermaidLib) {
          const { svg } = await mermaidLib.render(diagramId.current, part.content);
          setSvg(svg);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
      }
    };
    renderDiagram();
  }, [part.content]);

  return (
    <div 
      className="my-4 p-6 bg-white/5 rounded-2xl border border-white/10 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg || '<div class="animate-pulse h-32 w-full bg-gray-800 rounded"></div>' }}
    />
  );
});

const ToolCallPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div className="my-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
    <div className="flex items-center gap-2 text-indigo-400 text-xs font-medium mb-2">
      <Wrench className="w-3.5 h-3.5" />
      <span>Command: {part.name}</span>
    </div>
    <pre className="text-[11px] font-mono text-indigo-300/80 overflow-x-auto">
      {JSON.stringify(part.arguments, null, 2)}
    </pre>
  </div>
));

const ToolResultPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div className={`my-3 p-3 rounded-xl ${part.isError ? 'bg-red-500/5 border border-red-500/20' : 'bg-emerald-500/5 border border-emerald-500/20'}`}>
    <div className={`flex items-center gap-2 text-xs font-medium mb-1 ${part.isError ? 'text-red-400' : 'text-emerald-400'}`}>
      {part.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
      <span>{part.isError ? 'Error Output' : 'Result Output'}</span>
    </div>
    <pre className={`text-[11px] font-mono overflow-x-auto ${part.isError ? 'text-red-300/80' : 'text-emerald-300/80'}`}>
      {typeof part.result === 'string' ? part.result : JSON.stringify(part.result, null, 2)}
    </pre>
  </div>
));

const LinkPart: React.FC<{ part: any }> = memo(({ part }) => (
  <a 
    href={part.url} 
    target="_blank" 
    rel="noopener"
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all text-sm my-1"
  >
    <Globe className="w-3.5 h-3.5" />
    {part.text || part.url}
  </a>
));

const AudioPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div className="my-2 p-2 bg-gray-900 rounded-lg border border-gray-800">
    <audio controls className="w-full h-8">
      <source src={part.url || part.content} />
    </audio>
  </div>
));

const VideoPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div className="my-4 rounded-2xl overflow-hidden border border-gray-800 bg-black">
    <video controls className="w-full h-auto">
      <source src={part.url || part.content} />
    </video>
  </div>
));

const FilePart: React.FC<{ part: any }> = memo(({ part }) => (
  <a 
    href={part.url} 
    download 
    className="flex items-center gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all my-2"
  >
    <div className="p-2 bg-gray-800 rounded-lg">
      <FileText className="w-5 h-5 text-blue-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-200 truncate">{part.name || 'document.pdf'}</div>
      <div className="text-xs text-gray-500 uppercase">{part.metadata?.type || 'file'}</div>
    </div>
  </a>
));

const HtmlPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div 
    className="my-4 max-w-full overflow-x-auto rounded-lg"
    dangerouslySetInnerHTML={{ __html: part.html || part.content }}
  />
));

const QuotePart: React.FC<{ part: any }> = memo(({ part }) => (
  <blockquote className="my-6 pl-6 border-l-4 border-white/20">
    <p className="text-base text-gray-300 italic leading-relaxed">{part.text || part.content}</p>
    {part.author && <cite className="block mt-2 text-sm text-gray-500 not-italic">— {part.author}</cite>}
  </blockquote>
));

const UnknownPart: React.FC<{ part: any }> = ({ part }) => (
  <div className="my-2 p-3 rounded-lg bg-gray-800 border border-dashed border-gray-700">
    <div className="flex items-center gap-2 text-gray-500 text-xs">
      <AlertTriangle className="w-4 h-4" />
      <span>Unsupported: {part.type}</span>
    </div>
  </div>
);

export { ContentRenderer as default };
