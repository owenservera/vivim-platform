/**
 * Global Content Rendering Toolkit - Type Definitions
 * Centralized content rendering system for all content types across the app
 */

// ============================================================================
// CONTENT TYPES
// ============================================================================

/**
 * All supported content types in the rendering toolkit
 */
export type ContentType =
  // Basic content
  | 'text'           // Plain text or markdown
  | 'code'           // Code blocks with syntax highlighting
  | 'image'          // Static images
  | 'link'           // URLs and links

  // Rich media
  | 'audio'          // Audio files
  | 'video'          // Video files
  | 'gif'            // Animated GIFs

  // Data & structured
  | 'table'          // Data tables
  | 'json'           // JSON data display
  | 'yaml'           // YAML data display
  | 'xml'            // XML data display

  // Visual & diagrams
  | 'mermaid'        // Mermaid diagrams
  | 'latex'          // LaTeX math
  | 'svg'            // SVG graphics
  | 'chart'          // Charts and graphs

  // Interactive
  | 'form'           // Interactive forms
  | 'quiz'           // Quiz questions
  | 'poll'           // Polls and surveys

  // Embeds
  | 'youtube'        // YouTube embeds
  | 'twitter'        // Twitter embeds
  | 'vimeo'          // Vimeo embeds
  | 'codepen'        // CodePen embeds
  | 'iframe'         // Generic iframe embeds

  // Files & documents
  | 'file'           // File attachments
  | 'pdf'            // PDF documents
  | 'doc'            // Word documents
  | 'spreadsheet'     // Excel/spreadsheet files

  // AI & structured
  | 'tool_call'      // AI tool/function calls
  | 'tool_result'    // AI tool results
  | 'thought'        // AI chain of thought
  | 'reasoning'      // AI reasoning steps
  | 'acu_statement'  // ACU statement blocks
  | 'acu_question'   // ACU question blocks
  | 'acu_answer'     // ACU answer blocks
  | 'acu_code'       // ACU code blocks
  | 'acu_formula'    // ACU formula blocks
  | 'acu_table'      // ACU table blocks
  | 'acu_image'      // ACU image blocks
  | 'acu_tool'       // ACU tool blocks

  // Special
  | 'html'           // Raw HTML
  | 'quote'          // Blockquotes
  | 'divider'        // Horizontal dividers
  | 'spacer'         // Vertical spacers
  | 'callout'        // Callout/alert boxes
  | 'accordion'      // Collapsible sections
  | 'tabs'           // Tabbed content
  | 'timeline'       // Timeline events
  | 'tree'           // Tree structures
  | 'mindmap'        // Mind maps
  | 'kanban'         // Kanban boards
  | 'calendar'       // Calendar events
  | 'location'       // Location/maps
  | 'weather'        // Weather widgets

  // Fallback
  | 'unknown'        // Unknown content types
  | 'error'          // Error states
  | 'loading';       // Loading states

/**
 * ACU (Atomic Content Unit) types
 */
export type ACUType =
  | 'statement'
  | 'question'
  | 'answer'
  | 'code'
  | 'formula'
  | 'table'
  | 'image'
  | 'tool';

// ============================================================================
// CONTENT BLOCKS
// ============================================================================

/**
 * A single content block with metadata
 */
export interface ContentBlock {
  // Identification
  id: string;
  type: ContentType;

  // Content data
  content: string | object | ContentBlock[];

  // Metadata
  metadata?: ContentMetadata;

  // Display options
  display?: 'inline' | 'block' | 'full-width';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center' | 'right';

  // Interaction options
  interactive?: boolean;
  copyable?: boolean;
  downloadable?: boolean;
  expandable?: boolean;
  collapsible?: boolean;

  // Styling
  className?: string;
  style?: React.CSSProperties;

  // Custom data
  [key: string]: any;
}

/**
 * Content metadata
 */
export interface ContentMetadata {
  // Source information
  source?: string;
  provider?: string;
  author?: string;
  timestamp?: string;

  // Content info
  title?: string;
  description?: string;
  language?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
  duration?: number;

  // Visual
  alt?: string;
  caption?: string;
  thumbnail?: string;

  // Technical
  format?: string;
  encoding?: string;
  checksum?: string;

  // ACU specific
  acuType?: ACUType;
  acuId?: string;
  acuParentId?: string;
  confidence?: number;

  // Custom
  [key: string]: any;
}

/**
 * Content collection (array of blocks)
 */
export interface ContentCollection {
  id: string;
  title?: string;
  blocks: ContentBlock[];
  metadata?: ContentMetadata;
}

/**
 * Timeline event for timeline renderer
 */
export interface TimelineEvent {
  id: string;
  date: string | Date;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Poll option for poll renderer
 */
export interface PollOption {
  id: string;
  label: string;
  votes?: number;
  percentage?: number;
}

/**
 * Quiz question for quiz renderer
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

/**
 * Form field for form renderer
 */
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ============================================================================
// RENDERER PROPS
// ============================================================================

/**
 * Content renderer props
 */
export interface ContentRendererProps {
  // Content to render
  content: string | ContentBlock | ContentBlock[] | ContentCollection;

  // Display options
  className?: string;
  maxImageWidth?: number;
  maxContentHeight?: number;

  // Features
  enableCopy?: boolean;
  enableDownload?: boolean;
  enableExpand?: boolean;
  enableSyntaxHighlighting?: boolean;

  // Theme
  theme?: 'light' | 'dark' | 'auto';

  // Performance
  lazyLoad?: boolean;
  virtualScroll?: boolean;

  // Events
  onBlockClick?: (block: ContentBlock, index: number) => void;
  onBlockRender?: (block: ContentBlock, index: number) => void;
  onError?: (error: Error, block: ContentBlock) => void;

  // Custom renderers
  customRenderers?: Record<string, React.ComponentType<any>>;
}

/**
 * Content renderer configuration
 */
export interface ContentRendererConfig {
  // Default options
  defaultMaxImageWidth?: number;
  defaultTheme?: 'light' | 'dark' | 'auto';
  defaultLanguage?: string;

  // Feature flags
  enableMermaid?: boolean;
  enableKaTeX?: boolean;
  enableSyntaxHighlighting?: boolean;
  enableCopyToClipboard?: boolean;
  enableLazyLoading?: boolean;

  // Performance
  virtualScrollThreshold?: number;
  debounceRenderMs?: number;

  // Custom renderers
  customRenderers?: Record<string, React.ComponentType<any>>;

  // Error handling
  showErrors?: boolean;
  errorComponent?: React.ComponentType<{ error: Error; block: ContentBlock }>;

  // Fallbacks
  fallbackComponent?: React.ComponentType<{ type: ContentType; block: ContentBlock }>;
}

/**
 * Content block renderer props
 */
export interface ContentBlockRendererProps {
  block: ContentBlock;
  index: number;
  config: ContentRendererConfig;
  theme: 'light' | 'dark';
  onCopy?: (content: string) => void;
  onDownload?: (content: any, filename?: string) => void;
  onExpand?: () => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// INDIVIDUAL RENDERER PROPS
// ============================================================================

/**
 * Text renderer props
 */
export interface TextRendererProps extends ContentBlockRendererProps {
  format?: 'markdown' | 'html' | 'plain';
  maxLength?: number;
  showTruncation?: boolean;
  enableLinkPreview?: boolean;
}

/**
 * Code renderer props
 */
export interface CodeRendererProps extends ContentBlockRendererProps {
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showLanguage?: boolean;
  showCopyButton?: boolean;
  showDownloadButton?: boolean;
  wordWrap?: boolean;
  maxHeight?: number;
}

/**
 * Image renderer props
 */
export interface ImageRendererProps extends ContentBlockRendererProps {
  src: string;
  alt?: string;
  caption?: string;
  maxWidth?: number;
  maxHeight?: number;
  fit?: 'contain' | 'cover' | 'fill';
  enableLightbox?: boolean;
  enableZoom?: boolean;
  enableDownload?: boolean;
}

/**
 * Media renderer props (audio/video)
 */
export interface MediaRendererProps extends ContentBlockRendererProps {
  src: string;
  type: 'audio' | 'video';
  poster?: string;
  duration?: number;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  enableDownload?: boolean;
}

/**
 * Table renderer props
 */
export interface TableRendererProps extends ContentBlockRendererProps {
  headers: string[];
  rows: (string | number)[][];
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  paginated?: boolean;
  pageSize?: number;
}

/**
 * Mermaid renderer props
 */
export interface MermaidRendererProps extends ContentBlockRendererProps {
  diagram: string;
  type?: 'flowchart' | 'sequence' | 'gantt' | 'class' | 'state' | 'er';
  theme?: 'light' | 'dark' | 'neutral';
  enableZoom?: boolean;
  enableDownload?: boolean;
}

/**
 * LaTeX renderer props
 */
export interface LatexRendererProps extends ContentBlockRendererProps {
  formula: string;
  display?: 'inline' | 'block';
  enableCopy?: boolean;
  enableExport?: boolean;
}

/**
 * Tool renderer props (tool_call, tool_result)
 */
export interface ToolRendererProps extends ContentBlockRendererProps {
  toolName: string;
  parameters?: Record<string, any>;
  result?: any;
  status?: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  errorMessage?: string;
}

/**
 * ACU renderer props
 */
export interface ACURendererProps extends ContentBlockRendererProps {
  acuType: ACUType;
  acuId: string;
  confidence?: number;
  relatedAcus?: string[];
  enableGraph?: boolean;
  enableEdit?: boolean;
}

/**
 * Embed renderer props
 */
export interface EmbedRendererProps extends ContentBlockRendererProps {
  embedType: 'youtube' | 'twitter' | 'vimeo' | 'codepen' | 'iframe';
  url: string;
  embedId?: string;
  aspectRatio?: string;
  privacyEnhanced?: boolean;
}

/**
 * File renderer props
 */
export interface FileRendererProps extends ContentBlockRendererProps {
  filename: string;
  size: number;
  mimetype: string;
  url?: string;
  enablePreview?: boolean;
  enableDownload?: boolean;
}

/**
 * Interactive renderer props (form, quiz, poll)
 */
export interface InteractiveRendererProps extends ContentBlockRendererProps {
  interactiveType: 'form' | 'quiz' | 'poll' | 'accordion' | 'tabs';
  data: any;
  onSubmit?: (data: any) => void;
  onChange?: (data: any) => void;
}

/**
 * Callout renderer props
 */
export interface CalloutRendererProps extends ContentBlockRendererProps {
  calloutType: 'info' | 'warning' | 'error' | 'success' | 'tip';
  title?: string;
  content: string;
  dismissible?: boolean;
}

/**
 * Timeline renderer props
 */
export interface TimelineRendererProps extends ContentBlockRendererProps {
  events: TimelineEvent[];
  orientation?: 'vertical' | 'horizontal';
  showDates?: boolean;
}

// ============================================================================
// REGISTRY & PLUGIN TYPES
// ============================================================================

/**
 * Content type registry for managing renderers
 */
export interface ContentTypeRegistry {
  // Register a new content type renderer
  register(
    type: ContentType,
    renderer: React.ComponentType<ContentBlockRendererProps>,
    priority?: number
  ): void;

  // Unregister a content type
  unregister(type: ContentType): void;

  // Get renderer for a content type
  getRenderer(type: ContentType): React.ComponentType<ContentBlockRendererProps> | null;

  // Check if a type is registered
  hasRenderer(type: ContentType): boolean;

  // Get all registered types
  getRegisteredTypes(): ContentType[];

  // Set fallback renderer
  setFallbackRenderer(renderer: React.ComponentType<ContentBlockRendererProps>): void;

  // Get fallback renderer
  getFallbackRenderer(): React.ComponentType<ContentBlockRendererProps>;

  // Clear all renderers
  clear(): void;
}

/**
 * Content renderer plugin
 */
export interface ContentRendererPlugin {
  // Plugin name
  name: string;

  // Plugin version
  version: string;

  // Content types this plugin handles
  contentTypes: ContentType[];

  // Renderer component
  renderer: React.ComponentType<ContentBlockRendererProps>;

  // Plugin initialization
  init?(config: ContentRendererConfig): void;

  // Plugin cleanup
  destroy?(): void;

  // Transform content before rendering
  transform?(block: ContentBlock): ContentBlock;

  // Validate content
  validate?(block: ContentBlock): boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Copy result
 */
export interface CopyResult {
  success: boolean;
  error?: Error;
}

/**
 * Download result
 */
export interface DownloadResult {
  success: boolean;
  error?: Error;
}

/**
 * Content parse result
 */
export interface ContentParseResult {
  blocks: ContentBlock[];
  errors: Error[];
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
