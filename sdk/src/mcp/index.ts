/**
 * VIVIM SDK - MCP Module
 * 
 * MCP server implementation for AI agent integration
 */

export { MCPServer, createMCPServerFromEnv } from './server.js';
export { ToolRegistry, globalToolRegistry } from './registry.js';
export { StdioTransport, createStdioTransport } from './transports/stdio.js';
export * from './types.js';
export * from './tools/index.js';
