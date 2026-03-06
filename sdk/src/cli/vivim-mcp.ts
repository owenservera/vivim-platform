#!/usr/bin/env bun
/**
 * VIVIM SDK - MCP Server CLI Entry Point
 * 
 * CLI tool to start the MCP server for AI agent integration
 */

import { parseArgs } from 'util';
import { MCPServer, createMCPServerFromEnv } from '../mcp/server.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger().child('mcp-cli');

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
VIVIM MCP Server

Usage: vivim-mcp [options]

Options:
  --transport <type>   Transport type: stdio, http, streamable (default: stdio)
  --port <port>        HTTP server port (default: 3000)
  --host <host>        HTTP server host (default: localhost)
  --read-only          Enable read-only mode
  --allow <patterns>   Comma-separated list of allowed tool patterns
  --deny <patterns>   Comma-separated list of denied tool patterns
  --log-level <level> Log level: debug, info, warn, error (default: info)
  --config <path>     Path to config file
  --help              Show this help message

Environment Variables:
  VIVIM_DID                    Identity DID
  VIVIM_SEED                   Identity seed
  VIVIM_MCP_TRANSPORT          Transport type
  VIVIM_MCP_PORT               HTTP server port
  VIVIM_MCP_HOST               HTTP server host
  VIVIM_MCP_LOG_LEVEL          Log level
  VIVIM_MCP_READ_ONLY          Read-only mode
  VIVIM_MCP_ALLOWED_TOOLS      Allowed tool patterns (comma-separated)
  VIVIM_MCP_DENIED_TOOLS       Denied tool patterns (comma-separated)

Examples:
  # Start with STDIO transport (default)
  vivim-mcp

  # Start HTTP server
  vivim-mcp --transport http --port 3000

  # Read-only mode
  vivim-mcp --read-only

  # Allow only specific tools
  vivim-mcp --allow "memory_*,content_*,identity_info"
`);
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv,
    options: {
      transport: {
        type: 'string',
        short: 't',
      },
      port: {
        type: 'string',
        short: 'p',
      },
      host: {
        type: 'string',
        short: 'h',
      },
      'read-only': {
        type: 'boolean',
        short: 'r',
      },
      allow: {
        type: 'string',
        short: 'a',
      },
      deny: {
        type: 'string',
        short: 'd',
      },
      'log-level': {
        type: 'string',
        short: 'l',
      },
      config: {
        type: 'string',
        short: 'c',
      },
      help: {
        type: 'boolean',
        short: '?',
      },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    showHelp();
    process.exit(0);
  }

  // Get config from environment or CLI args
  const server = createMCPServerFromEnv();

  // Override with CLI args if provided
  if (values.transport) {
    (server as unknown as { config: { transport: string } }).config.transport = String(values.transport) as 'stdio' | 'http' | 'streamable';
  }
  if (values.port) {
    (server as unknown as { config: { port: number } }).config.port = parseInt(String(values.port), 10);
  }
  if (values.host) {
    (server as unknown as { config: { host: string } }).config.host = String(values.host);
  }
  if (values['read-only']) {
    (server as unknown as { config: { readOnly: boolean } }).config.readOnly = true;
  }
  if (values.allow && typeof values.allow === 'string') {
    (server as unknown as { config: { allowedTools: string[] } }).config.allowedTools = values.allow.split(',');
  }
  if (values.deny && typeof values.deny === 'string') {
    (server as unknown as { config: { deniedTools: string[] } }).config.deniedTools = values.deny.split(',');
  }
  if (values['log-level'] && typeof values['log-level'] === 'string') {
    (server as unknown as { config: { logLevel: string } }).config.logLevel = values['log-level'];
  }

  // Handle errors
  server.on('error', (error) => {
    logger.error('MCP server error', { error });
    process.exit(1);
  });

  server.on('initialized', () => {
    logger.info('MCP server initialized');
    console.error(`[VIVIM MCP Server] Started successfully`);
    console.error(`[VIVIM MCP Server] Transport: ${(server as unknown as { config: { transport: string } }).config.transport}`);
  });

  try {
    await server.initialize();
  } catch (error) {
    logger.error('Failed to initialize MCP server', { error });
    console.error(`[VIVIM MCP] Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`[VIVIM MCP] Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
