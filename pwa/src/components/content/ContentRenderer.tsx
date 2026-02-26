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
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from '../../hooks/useToast';

// Simplified types to match the expected pwa context if needed
export type ContentType = 'text' | 'code' | 'image' | 'latex' | 'math' | 'table' | 'mermaid' | 'tool_call' | 'tool_result' | 'link' | 'audio' | 'video' | 'file' | 'html' | 'quote';

// Remark plugin to convert custom directives like :::note into HTML elements
function remarkAdmonitions() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (
        node.type === 'textDirective' ||
        node.type === 'leafDirective' ||
        node.type === 'containerDirective'
      ) {
        const data = node.data || (node.data = {});
        const tagName = node.type === 'textDirective' ? 'span' : 'div';
        
        data.hName = tagName;
        data.hProperties = { 
          className: `admonition admonition-${node.name}`,
          'data-admonition-type': node.name
        };
      }
    });
  };
}

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
      const mermaidModule = await import('mermaid');
      mermaid = mermaidModule.default || mermaidModule;
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
      const katexModule = await import('katex');
      try {
        await import('katex/dist/katex.min.css');
      } catch (e) {}
      katex = katexModule.default || katexModule;
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

/* ── Unified Code Block UI Component ── */
interface CodeBlockUIProps {
  content: string;
  language: string;
  filename?: string;
  enableCopy?: boolean;
}

const CodeBlockUI: React.FC<CodeBlockUIProps> = memo(({ content, language, filename, enableCopy = true }) => {
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
    <div className="my-4 rounded-xl overflow-hidden glass-border bg-[#0d1117] shadow-2xl border border-white/10">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          {filename ? (
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          ) : (
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className="text-[11px] font-medium font-mono text-gray-400 tracking-tight">{filename || language}</span>
        </div>
        {enableCopy && (
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white border border-transparent hover:border-white/10"
            title="Copy code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
      <div className="p-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <SyntaxHighlighter
          language={language || 'text'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            fontSize: 'var(--text-xs, 13px)',
            background: 'transparent',
            lineHeight: '1.6',
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }
          }}
        >
          {String(content).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
CodeBlockUI.displayName = 'CodeBlockUI';

/* ── Custom ReactMarkdown Components ── */
const getMarkdownComponents = (enableCopy: boolean): Components => ({
  code({ node, inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    if (!inline && language === 'mermaid') {
      return <MermaidPart part={{ content: String(children) }} />;
    } else if (!inline && match) {
      return (
        <CodeBlockUI 
          content={String(children)} 
          language={language} 
          enableCopy={enableCopy} 
        />
      );
    } else if (!inline) {
      // Unspecified language block
      return (
        <CodeBlockUI 
          content={String(children)} 
          language="text" 
          enableCopy={enableCopy} 
        />
      );
    }
    // Inline code
    return (
      <code className="px-1.5 py-0.5 mx-0.5 text-[0.85em] font-mono text-indigo-400 bg-indigo-500/10 rounded-md border border-indigo-500/20" {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    // We already handle styling in the 'code' block
    return <>{children}</>;
  },
  table({ children }) {
    return (
      <div className="my-4 overflow-x-auto rounded-xl border border-white/10 shadow-sm bg-[#0d1117]/50">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-white/5">{children}</thead>;
  },
  th({ children }) {
    return <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300 border-t border-gray-200 dark:border-white/5">{children}</td>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-4 pl-4 border-l-4 border-indigo-500/50 text-gray-700 dark:text-gray-400 italic bg-indigo-50 dark:bg-indigo-500/5 py-2 pr-4 rounded-r-lg">
        {children}
      </blockquote>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline decoration-indigo-500/30 dark:decoration-indigo-400/30 underline-offset-2 transition-colors">
        {children}
      </a>
    );
  },
  ul({ children, className, ...props }) {
    return (
      <ul className={`list-disc list-outside ml-5 space-y-1.5 text-gray-800 dark:text-gray-200 my-4 ${className || ''}`} {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, className, ...props }) {
    return (
      <ol className={`list-decimal list-outside ml-5 space-y-1.5 text-gray-800 dark:text-gray-200 my-4 ${className || ''}`} {...props}>
        {children}
      </ol>
    );
  },
  li({ children, className, ...props }) {
    return (
      <li className={`pl-1 leading-relaxed ${className || ''}`} {...props}>
        {children}
      </li>
    );
  },
  h1({ children, className, ...props }) {
    return <h1 className={`text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white ${className || ''}`} {...props}>{children}</h1>;
  },
  h2({ children, className, ...props }) {
    return <h2 className={`text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white ${className || ''}`} {...props}>{children}</h2>;
  },
  h3({ children, className, ...props }) {
    return <h3 className={`text-lg font-semibold mt-6 mb-3 text-gray-900 dark:text-white ${className || ''}`} {...props}>{children}</h3>;
  },
  h4({ children, className, ...props }) {
    return <h4 className={`text-base font-semibold mt-6 mb-3 text-gray-900 dark:text-white ${className || ''}`} {...props}>{children}</h4>;
  },
  div({ node, className, children, ...props }: any) {
    // Handle custom admonitions
    if (className?.includes('admonition')) {
      const type = node?.properties?.['data-admonition-type'] || 'note';
      const typeStyles: Record<string, { bg: string, border: string, icon: React.ReactNode, title: string }> = {
        note: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: <FileText className="w-4 h-4 text-blue-400" />, title: 'Note' },
        warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: <AlertTriangle className="w-4 h-4 text-amber-400" />, title: 'Warning' },
        important: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: <AlertCircle className="w-4 h-4 text-indigo-400" />, title: 'Important' },
        caution: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <AlertTriangle className="w-4 h-4 text-red-400" />, title: 'Caution' }
      };
      
      const style = typeStyles[type] || typeStyles.note;
      
      return (
        <div className={`my-4 p-4 rounded-xl border ${style.bg} ${style.border}`} {...props}>
          <div className="flex items-center gap-2 font-semibold text-sm mb-2 uppercase tracking-wide opacity-80">
            {style.icon}
            <span style={{ color: (style.icon as any)?.props?.className?.match(/text-(\w+)-400/)?.[0]?.replace('text-', '').replace('-400', '') || 'inherit' }}>
              {type}
            </span>
          </div>
          <div className="text-sm text-gray-200 leading-relaxed">
            {children}
          </div>
        </div>
      );
    }
    return <div className={className} {...props}>{children}</div>;
  }
});

/**
 * Main Content Renderer Component - Memoized for performance
 */
export const ContentRenderer: React.FC<ContentRendererProps> = memo(({ 
  content, 
  className = '',
  maxImageWidth = 800,
  enableCopy = true 
}) => {
  const markdownComponents = React.useMemo(() => getMarkdownComponents(enableCopy), [enableCopy]);

  // Handle string content (legacy/simple text)
  if (isStringContent(content)) {
    return (
      <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed ${className}`}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkAdmonitions]} 
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Handle array of content parts
  if (!isArrayContent(content)) {
    // If it's an object but not an array, try to display it as JSON string or text
    const stringified = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
    return (
      <div className={`prose dark:prose-invert max-w-none text-sm leading-relaxed ${className}`}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkAdmonitions]} 
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {stringified}
        </ReactMarkdown>
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
  const isThought = part.metadata?.isThought || part.isThought;
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const markdownComponents = React.useMemo(() => getMarkdownComponents(enableCopy), [enableCopy]);

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

  if (isThought) {
    return (
      <details className="my-3 group/thought">
        <summary className="cursor-pointer flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors list-none select-none text-sm font-medium text-gray-600 dark:text-gray-400">
          <Globe className="w-4 h-4" /> {/* Use a thought/brain icon if available, fallback to Globe */}
          Thought Process
          <div className="ml-auto text-xs opacity-60">Expand</div>
        </summary>
        <div className="mt-2 pl-4 pr-2 py-3 border-l-2 border-indigo-500/30 text-gray-500 dark:text-gray-400 text-[13px] bg-transparent leading-relaxed italic">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkAdmonitions]} 
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </details>
    );
  }

  if (format === 'markdown' || format === undefined) {
    return (
      <div className="relative group/text">
        <div className="prose dark:prose-invert prose-sm max-w-none text-gray-900 dark:text-gray-200 leading-relaxed">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkAdmonitions]} 
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
        {enableCopy && content.length > 20 && (
          <button
            onClick={handleCopy}
            className="absolute top-0 right-0 opacity-0 group-hover/text:opacity-100 transition-opacity p-1.5 rounded bg-gray-800/80 hover:bg-gray-700 backdrop-blur-sm border border-white/10"
            aria-label="Copy text"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-900 dark:text-gray-200 whitespace-pre-wrap">
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

  return <CodeBlockUI content={content} language={language} filename={filename} enableCopy={enableCopy} />;
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
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        {!loaded && (
          <div className="aspect-video flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-600 animate-spin" />
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
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-transparent">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-100 dark:hover:bg-gray-800/10">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-gray-800 dark:text-gray-300">
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
      className="my-4 p-6 bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg || '<div class="animate-pulse h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>' }}
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
  <div className="my-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
    <audio controls className="w-full h-8">
      <source src={part.url || part.content} />
    </audio>
  </div>
));

const VideoPart: React.FC<{ part: any }> = memo(({ part }) => (
  <div className="my-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black">
    <video controls className="w-full h-auto">
      <source src={part.url || part.content} />
    </video>
  </div>
));

const FilePart: React.FC<{ part: any }> = memo(({ part }) => (
  <a 
    href={part.url} 
    download 
    className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all my-2"
  >
    <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
      <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{part.name || 'document.pdf'}</div>
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
  <blockquote className="my-6 pl-6 border-l-4 border-gray-300 dark:border-white/20">
    <p className="text-base text-gray-800 dark:text-gray-300 italic leading-relaxed">{part.text || part.content}</p>
    {part.author && <cite className="block mt-2 text-sm text-gray-500 not-italic">— {part.author}</cite>}
  </blockquote>
));

const UnknownPart: React.FC<{ part: any }> = ({ part }) => (
  <div className="my-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700">
    <div className="flex items-center gap-2 text-gray-500 text-xs">
      <AlertTriangle className="w-4 h-4" />
      <span>Unsupported: {part.type}</span>
    </div>
  </div>
);

export { ContentRenderer as default };
