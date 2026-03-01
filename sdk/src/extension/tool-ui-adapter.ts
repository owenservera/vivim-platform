/**
 * VIVIM SDK - Tool-UI Adapter
 * 
 * Provides integration with tool-ui components for rendering
 * tool calls as interactive UI elements.
 * 
 * @see https://github.com/owenservera/tool-ui-VIVIM
 */

import { z } from 'zod';
import type { ToolCallContentBlock } from '../protocols/chat/types.js';

// ============== Tool UI Component Types ==============

export interface ToolUIComponent<T = unknown> {
  type: string;
  name: string;
  description: string;
  schema: z.ZodSchema<T>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  render: (payload: T, context: ToolRenderContext) => ToolRenderResult;
}

export interface ToolRenderContext {
  toolCallId: string;
  toolName: string;
  conversationId?: string;
  userId?: string;
  timestamp: number;
}

export interface ToolRenderResult {
  component: string;
  props: Record<string, unknown>;
  actions?: ToolAction[];
}

export interface ToolAction {
  id: string;
  type: 'approve' | 'deny' | 'modify' | 'cancel' | 'submit';
  label: string;
  requiresInput?: boolean;
  inputSchema?: z.ZodSchema<unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

// ============== Approval Card Component ==============

export interface ApprovalCardPayload {
  title: string;
  description: string;
  action_type: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requested_by: string;
  details: Record<string, unknown>;
  suggestions?: string[];
  alternatives?: string[];
}

export const ApprovalCardSchema: z.ZodSchema<ApprovalCardPayload> = z.object({
  title: z.string().min(1),
  description: z.string(),
  action_type: z.string(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']),
  requested_by: z.string(),
  details: z.record(z.unknown()),
  suggestions: z.array(z.string()).optional(),
  alternatives: z.array(z.string()).optional(),
});

export const ApprovalCardComponent: ToolUIComponent<ApprovalCardPayload> = {
  type: 'approval-card',
  name: 'Approval Card',
  description: 'Request human approval for an action',
  schema: ApprovalCardSchema,
  riskLevel: 'high',
  requiresApproval: true,
  
  render: (payload, context) => {
    const needsAttention = payload.risk_level === 'high' || payload.risk_level === 'critical';
    
    return {
      component: 'ApprovalCard',
      props: {
        title: payload.title,
        description: payload.description,
        actionType: payload.action_type,
        riskLevel: payload.risk_level,
        requestedBy: payload.requested_by,
        details: payload.details,
        suggestions: payload.suggestions,
        alternatives: payload.alternatives,
        needsAttention,
        timestamp: context.timestamp,
      },
      actions: [
        { id: `${context.toolCallId}-approve`, type: 'approve', label: 'Approve' },
        { id: `${context.toolCallId}-deny`, type: 'deny', label: 'Deny' },
        { id: `${context.toolCallId}-modify`, type: 'modify', label: 'Modify', requiresInput: true },
      ],
    };
  },
};

// ============== Data Table Component ==============

export interface DataTableColumn {
  key: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'link';
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface DataTablePayload {
  title: string;
  columns: DataTableColumn[];
  rows: Record<string, unknown>[];
  total_rows?: number;
  page?: number;
  page_size?: number;
}

export const DataTableSchema: z.ZodSchema<DataTablePayload> = z.object({
  title: z.string(),
  columns: z.array(z.object({
    key: z.string(),
    header: z.string(),
    type: z.enum(['text', 'number', 'date', 'boolean', 'link']),
    sortable: z.boolean().optional(),
    filterable: z.boolean().optional(),
    width: z.string().optional(),
  })),
  rows: z.array(z.record(z.unknown())),
  total_rows: z.number().optional(),
  page: z.number().optional(),
  page_size: z.number().optional(),
});

export const DataTableComponent: ToolUIComponent<DataTablePayload> = {
  type: 'data-table',
  name: 'Data Table',
  description: 'Display data in a tabular format',
  schema: DataTableSchema,
  riskLevel: 'low',
  requiresApproval: false,
  
  render: (payload) => ({
    component: 'DataTable',
    props: {
      title: payload.title,
      columns: payload.columns,
      rows: payload.rows,
      totalRows: payload.total_rows,
      page: payload.page,
      pageSize: payload.page_size,
    },
  }),
};

// ============== Chart Component ==============

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'area';

export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface ChartPayload {
  title: string;
  type: ChartType;
  x_axis: string;
  y_axis: string;
  series: ChartSeries[];
  labels?: string[];
  options?: { stacked?: boolean; legend?: boolean; grid?: boolean };
}

export const ChartSchema: z.ZodSchema<ChartPayload> = z.object({
  title: z.string(),
  type: z.enum(['line', 'bar', 'pie', 'scatter', 'area']),
  x_axis: z.string(),
  y_axis: z.string(),
  series: z.array(z.object({
    name: z.string(),
    data: z.array(z.number()),
    color: z.string().optional(),
  })),
  labels: z.array(z.string()).optional(),
  options: z.object({
    stacked: z.boolean().optional(),
    legend: z.boolean().optional(),
    grid: z.boolean().optional(),
  }).optional(),
});

export const ChartComponent: ToolUIComponent<ChartPayload> = {
  type: 'chart',
  name: 'Chart',
  description: 'Display data as a chart',
  schema: ChartSchema,
  riskLevel: 'low',
  requiresApproval: false,
  
  render: (payload) => ({
    component: 'Chart',
    props: {
      title: payload.title,
      type: payload.type,
      xAxis: payload.x_axis,
      yAxis: payload.y_axis,
      series: payload.series,
      labels: payload.labels,
      options: payload.options,
    },
  }),
};

// ============== Code Block Component ==============

export interface CodeBlockPayload {
  code: string;
  language: string;
  filename?: string;
  highlights?: number[];
  showLineNumbers?: boolean;
  theme?: 'dark' | 'light';
}

export const CodeBlockSchema: z.ZodSchema<CodeBlockPayload> = z.object({
  code: z.string(),
  language: z.string(),
  filename: z.string().optional(),
  highlights: z.array(z.number()).optional(),
  showLineNumbers: z.boolean().optional(),
  theme: z.enum(['dark', 'light']).optional(),
});

export const CodeBlockComponent: ToolUIComponent<CodeBlockPayload> = {
  type: 'code-block',
  name: 'Code Block',
  description: 'Display code with syntax highlighting',
  schema: CodeBlockSchema,
  riskLevel: 'low',
  requiresApproval: false,
  
  render: (payload) => ({
    component: 'CodeBlock',
    props: {
      code: payload.code,
      language: payload.language,
      filename: payload.filename,
      highlights: payload.highlights,
      showLineNumbers: payload.showLineNumbers ?? true,
      theme: payload.theme ?? 'dark',
    },
    actions: [{ id: 'copy', type: 'submit', label: 'Copy' }],
  }),
};

// ============== Tool UI Adapter ==============

export class ToolUIAdapter {
  private registry: Map<string, ToolUIComponent> = new Map();
  private defaultComponents: ToolUIComponent[] = [
    ApprovalCardComponent,
    DataTableComponent,
    ChartComponent,
    CodeBlockComponent,
  ];

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    for (const component of this.defaultComponents) {
      this.registry.set(component.type, component);
    }
  }

  registerComponent<T>(component: ToolUIComponent<T>): void {
    this.registry.set(component.type, component as ToolUIComponent);
  }

  unregisterComponent(type: string): boolean {
    return this.registry.delete(type);
  }

  canRender(toolName: string): boolean {
    return this.registry.has(toolName);
  }

  render(toolCall: ToolCallContentBlock, context: Partial<ToolRenderContext> = {}): ToolRenderResult {
    const component = this.registry.get(toolCall.name);
    
    if (!component) {
      return {
        component: 'FallbackJSON',
        props: {
          toolCallId: toolCall.id,
          toolName: toolCall.name,
          input: toolCall.input,
        },
      };
    }

    const fullContext: ToolRenderContext = {
      toolCallId: toolCall.id,
      toolName: toolCall.name,
      conversationId: context.conversationId,
      userId: context.userId,
      timestamp: context.timestamp || Date.now(),
    };

    return component.render(toolCall.input as never, fullContext);
  }

  validate(toolCall: ToolCallContentBlock): ValidationResult {
    const component = this.registry.get(toolCall.name);
    
    if (!component) {
      return { valid: false, errors: [`No component registered for tool: ${toolCall.name}`] };
    }

    const result = component.schema.safeParse(toolCall.input);
    
    if (result.success) {
      return { valid: true, errors: [] };
    }
    
    return {
      valid: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  requiresApproval(toolName: string): boolean {
    const component = this.registry.get(toolName);
    return component?.requiresApproval ?? false;
  }

  getRiskLevel(toolName: string): 'low' | 'medium' | 'high' | 'critical' {
    const component = this.registry.get(toolName);
    return component?.riskLevel ?? 'low';
  }

  getComponents(): ToolUIComponent[] {
    return Array.from(this.registry.values());
  }

  getComponent<T>(type: string): ToolUIComponent<T> | undefined {
    return this.registry.get(type) as ToolUIComponent<T> | undefined;
  }
}

export function createToolUIAdapter(): ToolUIAdapter {
  return new ToolUIAdapter();
}
