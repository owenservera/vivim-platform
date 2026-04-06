---
title: "MCP Server"
description: "Connect VIVIM to Claude Desktop, Cursor, and other MCP-compatible tools for seamless AI memory integration."
---

# MCP Server

VIVIM provides a Model Context Protocol (MCP) server that integrates your AI memory directly into Claude Desktop, Cursor, and other MCP-compatible tools.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that lets AI tools access external data sources. VIVIM's MCP server exposes your memory graph as MCP tools, so your AI assistant can search your memories, retrieve context, and build better responses.

## Claude Desktop integration

### Install the MCP server

```bash
# From the VIVIM repository
bun install
```

### Configure Claude Desktop

Open your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the VIVIM MCP server:

```json
{
  "mcpServers": {
    "vivim": {
      "command": "bun",
      "args": ["run", "--cwd", "/path/to/vivim-platform", "@vivim/sdk", "mcp:start"],
      "env": {
        "VIVIM_API_URL": "http://localhost:3000"
      }
    }
  }
}
```

### Available tools

Once configured, Claude can use these VIVIM tools:

| Tool | Description | Example usage |
|---|---|---|
| `vivim_search` | Search your memory graph | "What did we decide about deployment?" |
| `vivim_get_memory` | Retrieve a specific memory by ID | "Show me the details of acu_abc123" |
| `vivim_list_collections` | List memory collections | "What collections do I have?" |
| `vivim_context` | Get assembled context for a query | "Help me code with my project context" |

## Cursor integration

Cursor supports MCP servers natively:



1. **Open Cursor settings**
   Go to `Cursor Settings` → `MCP Servers` → `Add Server`.

  
2. **Configure the server**
   Set the command to `bun` and args to `run --cwd /path/to/vivim-platform @vivim/sdk mcp:start`.

  
3. **Set environment variables**
   Add `VIVIM_API_URL=http://localhost:3000` (or your VIVIM instance URL).

  
4. **Restart Cursor**
   Restart Cursor to load the MCP server. Your VIVIM memories are now available in chat.


## Available MCP tools

### Search memories

```json
{
  "name": "vivim_search",
  "description": "Search the user's VIVIM memory graph",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "type": { "type": "string", "description": "Filter by memory type" },
      "limit": { "type": "number", "description": "Max results", "default": 5 }
    },
    "required": ["query"]
  }
}
```

### Get specific memory

```json
{
  "name": "vivim_get_memory",
  "description": "Retrieve a specific memory by ID",
  "input_schema": {
    "type": "object",
    "properties": {
      "acuId": { "type": "string", "description": "ACU identifier" }
    },
    "required": ["acuId"]
  }
}
```

### List collections

```json
{
  "name": "vivim_list_collections",
  "description": "List all memory collections",
  "input_schema": {
    "type": "object",
    "properties": {}
  }
}
```

### Build context

```json
{
  "name": "vivim_context",
  "description": "Assemble context bundle for a query",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Query to build context for" },
      "maxTokens": { "type": "number", "description": "Token budget", "default": 4000 }
    },
    "required": ["query"]
  }
}
```


::: info
The MCP server runs locally and communicates with your VIVIM instance over HTTP. For self-hosted VIVIM, point `VIVIM_API_URL` to your local server.
:::



::: tip
When using Claude with VIVIM integration, try asking: "Based on my memories, what should I know about [topic]?" to see the full power of contextual AI.
:::

