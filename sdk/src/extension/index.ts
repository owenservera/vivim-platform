/**
 * VIVIM SDK Extension Module Exports
 */

export {
  ExtensionSystem,
  type Extension,
  type ExtensionInstance,
  type ExtensionInterface,
} from './extension-system.js';

// Assistant-UI Adapter (assistant-ui-VIVIM patterns)
export {
  VivimSDKTransport,
  createAssistantRuntimeConfig,
  toAssistantUIMessage,
  fromAssistantUIMessage,
  type StreamParams,
  type StreamChunk,
  type VivimSDKTransportConfig,
} from './assistant-ui-adapter.js';

// Tool-UI Adapter (tool-ui-VIVIM patterns)
export {
  ToolUIAdapter,
  createToolUIAdapter,
  type ToolUIComponent,
  type ToolRenderContext,
  type ToolRenderResult,
  type ToolAction,
  type ValidationResult,
  // Default components
  ApprovalCardComponent,
  DataTableComponent,
  ChartComponent,
  CodeBlockComponent,
} from './tool-ui-adapter.js';
