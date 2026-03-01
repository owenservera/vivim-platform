# VIVIM SDK CLI Enhancement Design Plan

> **Status**: Design Complete  
> **Version**: 1.0.0  
> **Date**: February 2026

---

## Executive Summary

This document outlines a comprehensive design for enhancing the VIVIM SDK CLI to enable seamless interaction with AI CLI agents via MCP (Model Context Protocol) and installable skills. The design builds on the existing robust CLI foundation while adding modern integration patterns.

**Key Goals**:
1. Enable AI agents to interact with VIVIM SDK programmatically via MCP
2. Provide installable skill packages for common agent workflows
3. Maintain backward compatibility with existing CLI usage
4. Follow industry best practices (STDIO transport, JSON-RPC 2.0)

---

## Part 1: Current SDK CLI Analysis

### 1.1 Existing Architecture

The VIVIM SDK already has a well-structured CLI foundation:

```
sdk/src/cli/
├── vivim-git.ts          # Git integration CLI (bin: vivim)
├── vivim-node.ts         # Full node CLI (bin: vivim-node)
├── agent-cli.ts          # AI Agent CLI wrapper (800+ lines)
├── agent-utils.ts        # Agent utilities and helpers
├── index.ts              # Module exports
└── self-design-commands.ts
```

### 1.2 Existing Capabilities

| Component | Purpose |
|-----------|---------|
| `AIAgentCLI` | Main CLI class with command registration, execution, output formatting |
| `AgentSession` | Session management for agent interactions |
| `BuildAgent` | Specialized class for build-related tasks |
| `ResearchAgent` | Specialized class for research tasks |
| `CLIBuilder` | Fluent builder for CLI creation |

### 1.3 Command Categories

The existing CLI supports these command groups:

- **Identity**: `identity`, `identity create`
- **Memory**: `memory create`, `memory search`, `memory list`
- **Content**: `content create`, `content feed`, `content search`
- **Social**: `social follow`, `social circles`, `social circle create`
- **Chat**: `chat new`, `chat list`, `chat send`
- **Storage**: `storage status`, `storage pins`
- **System**: `help`, `format`, `context`, `exit`

### 1.4 Output Formats

- `json` - Full JSON output
- `text` - Human-readable text
- `markdown` - Markdown-formatted
- `compact` - Single-line format (`OK|...` or `ERR|...`)

---

## Part 2: MCP Server Integration Design

### 2.1 Overview

We will implement an MCP server that exposes all CLI commands as MCP tools, enabling AI agents to interact with VIVIM SDK through the standardized MCP protocol.

### 2.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent / LLM                           │
└─────────────────────────┬───────────────────────────────────┘
                          │ JSON-RPC 2.0
                          │ (STDIO / HTTP / SSE)
┌─────────────────────────▼───────────────────────────────────┐
│                  VIVIM MCP Server                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Tool Registry    │  Command Mapper  │  Auth Handler │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  STDIO Transport  │  HTTP Transport  │ SSE Transport│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  VivimSDK Core                              │
│  (Identity, Memory, Content, Social, Chat, Storage)         │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Tool Definitions

All CLI commands will be exposed as MCP tools with proper schema:

#### Identity Tools

```typescript
{
  name: "identity_info",
  description: "Get current identity information",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

```typescript
{
  name: "identity_create",
  description: "Create a new VIVIM identity",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Display name for the identity" },
      seed: { type: "string", description: "Optional seed for key derivation" }
    }
  }
}
```

#### Memory Tools

```typescript
{
  name: "memory_create",
  description: "Create a new memory in VIVIM",
  inputSchema: {
    type: "object",
    properties: {
      content: { type: "string", description: "Memory content" },
      type: { 
        type: "string", 
        enum: ["semantic", "episodic", "procedural"],
        default: "semantic"
      },
      tags: { 
        type: "array", 
        items: { type: "string" },
        description: "Tags for categorization"
      }
    },
    required: ["content"]
  }
}
```

```typescript
{
  name: "memory_search",
  description: "Search memories by query",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      type: { type: "string", enum: ["semantic", "episodic", "procedural"] },
      limit: { type: "number", default: 10 }
    },
    required: ["query"]
  }
}
```

#### Content Tools

```typescript
{
  name: "content_create",
  description: "Create new content post",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Content text" },
      visibility: { 
        type: "string", 
        enum: ["public", "circle", "friends", "private"],
        default: "public"
      }
    },
    required: ["text"]
  }
}
```

```typescript
{
  name: "content_feed",
  description: "Get content feed",
  inputSchema: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["following", "popular", "recent"] },
      limit: { type: "number", default: 20 }
    }
  }
}
```

#### Social Tools

```typescript
{
  name: "social_follow",
  description: "Follow a user by their DID",
  inputSchema: {
    type: "object",
    properties: {
      did: { type: "string", description: "DID to follow" }
    },
    required: ["did"]
  }
}
```

```typescript
{
  name: "social_circles",
  description: "List all circles",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

```typescript
{
  name: "social_circle_create",
  description: "Create a new circle",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Circle name" },
      isPublic: { type: "boolean", default: false },
      description: { type: "string" }
    },
    required: ["name"]
  }
}
```

#### Chat Tools

```typescript
{
  name: "chat_new",
  description: "Start a new conversation",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", default: "New Conversation" },
      model: { type: "string", default: "gpt-4" }
    }
  }
}
```

```typescript
{
  name: "chat_send",
  description: "Send a message in a conversation",
  inputSchema: {
    type: "object",
    properties: {
      conversationId: { type: "string", description: "Conversation ID" },
      message: { type: "string", description: "Message to send" }
    },
    required: ["conversationId", "message"]
  }
}
```

#### Storage Tools

```typescript
{
  name: "storage_status",
  description: "Get storage status and statistics",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

```typescript
{
  name: "storage_pins",
  description: "List pinned content",
  inputSchema: {
    type: "object",
    properties: {}
  }
}
```

### 2.4 Transport Options

We will implement all three transport types for maximum flexibility:

| Transport | Use Case | Configuration |
|-----------|----------|---------------|
| **STDIO** | Local CLI tools, direct agent integration | Default for CLI |
| **HTTP SSE** | Browser-based clients, legacy servers | `--transport http` |
| **Streamable HTTP** | Modern remote servers, sessions | `--transport streamable` |

### 2.5 Configuration

```typescript
interface MCPConfig {
  // Server settings
  serverName: string;
  serverVersion: string;
  transport: 'stdio' | 'http' | 'streamable';
  
  // Network settings
  port?: number;
  host?: string;
  
  // Security
  allowedTools?: string[];
  deniedTools?: string[];
  readOnly?: boolean;
  
  // Logging
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  
  // SDK settings
  sdkConfig?: {
    identity?: { did?: string; seed?: string };
    network?: { enableP2P?: boolean };
    storage?: { encryption?: boolean };
  };
}
```

### 2.6 Environment Variables

```bash
# Required
VIVIM_DID=                    # Identity DID
VIVIM_SEED=                  # Identity seed (optional)

# Optional - Network
VIVIM_P2P_ENABLED=true       # Enable P2P networking
VIVIM_BOOTSTRAP_NODES=       # Comma-separated bootstrap nodes

# Optional - MCP Server
VIVIM_MCP_PORT=3000          # HTTP server port
VIVIM_MCP_HOST=localhost     # HTTP server host
VIVIM_MCP_TRANSPORT=stdio    # Transport type
VIVIM_MCP_LOG_LEVEL=info     # Logging level
VIVIM_MCP_READ_ONLY=false    # Read-only mode
```

---

## Part 3: Installable Skills Design

### 3.1 Overview

The skill system provides modular, reusable agent capabilities that can be installed and configured for specific use cases.

### 3.2 Skill Structure

```
@vivim/skills/
├── memory/                  # Memory management skills
│   ├── index.ts
│   ├── remember.ts         # Store information
│   ├── recall.ts           # Retrieve information
│   └── schema.ts           # Skill definitions
├── content/                 # Content creation skills
│   ├── index.ts
│   ├── post.ts
│   └── feed.ts
├── social/                  # Social interaction skills
│   ├── index.ts
│   ├── follow.ts
│   └── circles.ts
├── chat/                    # Chat/assistant skills
│   ├── index.ts
│   ├── converse.ts
│   └── context.ts
└── storage/                 # Storage management skills
    ├── index.ts
    └── status.ts
```

### 3.3 Skill Definition Schema

```typescript
interface SkillDefinition {
  // Identity
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Capabilities
  capabilities: SkillCapability[];
  
  // Configuration
  configSchema?: JSONSchema;
  
  // Dependencies
  dependencies?: SkillDependency[];
  
  // Metadata
  author?: string;
  license?: string;
  repository?: string;
  tags?: string[];
}

interface SkillCapability {
  type: 'tool' | 'resource' | 'prompt' | 'agent';
  name: string;
  description: string;
  inputSchema?: JSONSchema;
  handler: CapabilityHandler;
}

type CapabilityHandler = (
  params: Record<string, unknown>,
  context: SkillContext
) => Promise<CapabilityResult>;
```

### 3.4 Core Skills

#### Memory Skills

```typescript
// Skill: @vivim/skill-memory
export const memorySkill: SkillDefinition = {
  id: '@vivim/skill-memory',
  name: 'VIVIM Memory',
  version: '1.0.0',
  description: 'Long-term memory management for AI agents',
  
  capabilities: [
    {
      type: 'tool',
      name: 'remember',
      description: 'Store important information in long-term memory',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          type: { type: 'string', enum: ['fact', 'concept', 'procedure', 'error'] },
          tags: { type: 'array', items: { type: 'string' } },
          importance: { type: 'number', minimum: 1, maximum: 10 }
        },
        required: ['content']
      },
      handler: async (params, context) => {
        const { content, type = 'fact', tags = [], importance = 5 } = params;
        const memory = await context.sdk.getMemoryNode().create({
          content,
          memoryType: type,
          tags,
          // Store importance in metadata
          metadata: { importance }
        });
        return { success: true, memoryId: memory.id };
      }
    },
    {
      type: 'tool',
      name: 'recall',
      description: 'Search and retrieve memories',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          type: { type: 'string', enum: ['fact', 'concept', 'procedure', 'error'] },
          limit: { type: 'number', default: 10 }
        },
        required: ['query']
      },
      handler: async (params, context) => {
        const { query, type, limit = 10 } = params;
        const results = await context.sdk.getMemoryNode().search({
          text: query,
          types: type ? [type] : undefined,
          limit
        });
        return { success: true, memories: results };
      }
    },
    {
      type: 'tool',
      name: 'remember_error',
      description: 'Store an error and its solution for future reference',
      inputSchema: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          solution: { type: 'string' },
          context: { type: 'string' }
        },
        required: ['error', 'solution']
      },
      handler: async (params, context) => {
        const { error, solution, context: ctx } = params;
        const content = `[ERROR] ${error}\n[SOLUTION] ${solution}\n[CONTEXT] ${ctx || 'N/A'}`;
        const memory = await context.sdk.getMemoryNode().create({
          content,
          memoryType: 'error',
          tags: ['bugfix', 'error']
        });
        return { success: true, memoryId: memory.id };
      }
    }
  ]
};
```

#### Content Skills

```typescript
// Skill: @vivim/skill-content
export const contentSkill: SkillDefinition = {
  id: '@vivim/skill-content',
  name: 'VIVIM Content',
  version: '1.0.0',
  description: 'Create and manage content on the VIVIM network',
  
  capabilities: [
    {
      type: 'tool',
      name: 'post',
      description: 'Create a new post on the network',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          visibility: { 
            type: 'string', 
            enum: ['public', 'circle', 'friends', 'private'],
            default: 'public' 
          },
          circleId: { type: 'string' }
        },
        required: ['text']
      },
      handler: async (params, context) => {
        const { text, visibility = 'public', circleId } = params;
        const content = await context.sdk.getContentNode().create('post', 
          { text }, 
          { visibility, circleId }
        );
        return { success: true, contentId: content.id };
      }
    },
    {
      type: 'tool',
      name: 'feed',
      description: 'Get the content feed',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['following', 'popular', 'recent'] },
          limit: { type: 'number', default: 20 }
        }
      },
      handler: async (params, context) => {
        const { type, limit = 20 } = params;
        const feed = await context.sdk.getContentNode().getFeed({ type, limit });
        return { success: true, posts: feed };
      }
    }
  ]
};
```

#### Research Skills

```typescript
// Skill: @vivim/skill-research
export const researchSkill: SkillDefinition = {
  id: '@vivim/skill-research',
  name: 'VIVIM Research',
  version: '1.0.0',
  description: 'Research and knowledge management for AI agents',
  
  capabilities: [
    {
      type: 'tool',
      name: 'save_finding',
      description: 'Save a research finding with topic categorization',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          content: { type: 'string' },
          source: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['topic', 'content']
      },
      handler: async (params, context) => {
        const { topic, content, source, confidence = 0.8 } = params;
        const memoryContent = `[RESEARCH] ${topic}\n${content}\n[Source: ${source || 'Unknown'}]\n[Confidence: ${confidence}]`;
        const memory = await context.sdk.getMemoryNode().create({
          content: memoryContent,
          memoryType: 'semantic',
          tags: ['research', topic.toLowerCase().replace(/\s+/g, '-')]
        });
        return { success: true, findingId: memory.id };
      }
    },
    {
      type: 'tool',
      name: 'find_research',
      description: 'Search previous research findings',
      inputSchema: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          limit: { type: 'number', default: 10 }
        },
        required: ['topic']
      },
      handler: async (params, context) => {
        const { topic, limit = 10 } = params;
        const results = await context.sdk.getMemoryNode().search({
          text: topic,
          types: ['semantic'],
          limit
        });
        return { success: true, findings: results };
      }
    }
  ]
};
```

### 3.5 Skill Installation & Management

```bash
# Install a skill
vivim skill install @vivim/skill-memory

# Install specific version
vivim skill install @vivim/skill-memory@1.0.0

# List installed skills
vivim skill list

# Remove a skill
vivim skill remove @vivim/skill-memory

# Update a skill
vivim skill update @vivim/skill-memory
```

### 3.6 Skill Configuration

```yaml
# vivim.skills.yaml
skills:
  - id: @vivim/skill-memory
    enabled: true
    config:
      defaultType: semantic
      autoConsolidate: true
      
  - id: @vivim/skill-content
    enabled: true
    config:
      defaultVisibility: public
      
  - id: @vivim/skill-research
    enabled: true
    config:
      confidenceThreshold: 0.7
```

---

## Part 4: Implementation Roadmap

### Phase 1: MCP Server Core (Week 1-2)

| Task | Description | Files |
|------|-------------|-------|
| 1.1 | Create MCP server package | `sdk/src/mcp/index.ts` |
| 1.2 | Implement STDIO transport | `sdk/src/mcp/transports/stdio.ts` |
| 1.3 | Implement tool registry | `sdk/src/mcp/registry.ts` |
| 1.4 | Add MCP SDK dependency | Update `package.json` |
| 1.5 | Create CLI entry point | `src/cli/vivim-mcp.ts` |

### Phase 2: Tool Mapping (Week 2-3)

| Task | Description | Files |
|------|-------------|-------|
| 2.1 | Map identity commands | `sdk/src/mcp/tools/identity.ts` |
| 2.2 | Map memory commands | `sdk/src/mcp/tools/memory.ts` |
| 2.3 | Map content commands | `sdk/src/mcp/tools/content.ts` |
| 2.4 | Map social commands | `sdk/src/mcp/tools/social.ts` |
| 2.5 | Map chat commands | `sdk/src/mcp/tools/chat.ts` |
| 2.6 | Map storage commands | `sdk/src/mcp/tools/storage.ts` |

### Phase 3: Transport & Configuration (Week 3-4)

| Task | Description | Files |
|------|-------------|-------|
| 3.1 | Implement HTTP SSE transport | `sdk/src/mcp/transports/sse.ts` |
| 3.2 | Implement Streamable HTTP | `sdk/src/mcp/transports/streamable-http.ts` |
| 3.3 | Add environment variable support | `sdk/src/mcp/config/env.ts` |
| 3.4 | Add config file support | `sdk/src/mcp/config/file.ts` |
| 3.5 | Implement guard mode | `sdk/src/mcp/guard.ts` |

### Phase 4: Skill System (Week 4-5)

| Task | Description | Files |
|------|-------------|-------|
| 4.1 | Create skill framework | `sdk/src/skills/index.ts` |
| 4.2 | Implement memory skill | `sdk/src/skills/memory/index.ts` |
| 4.3 | Implement content skill | `sdk/src/skills/content/index.ts` |
| 4.4 | Implement research skill | `sdk/src/skills/research/index.ts` |
| 4.5 | Add skill CLI commands | `sdk/src/cli/skills.ts` |

### Phase 5: Testing & Documentation (Week 5-6)

| Task | Description |
|------|-------------|
| 5.1 | Unit tests for all tools |
| 5.2 | Integration tests with MCP clients |
| 5.3 | Documentation and examples |
| 5.4 | Performance benchmarking |

---

## Part 5: File Structure

```
sdk/
├── src/
│   ├── mcp/
│   │   ├── index.ts              # Main MCP server export
│   │   ├── server.ts             # MCP server class
│   │   ├── registry.ts           # Tool registry
│   │   ├── config/
│   │   │   ├── index.ts          # Configuration loader
│   │   │   ├── env.ts            # Environment variables
│   │   │   └── file.ts           # Config file
│   │   ├── transports/
│   │   │   ├── index.ts
│   │   │   ├── stdio.ts
│   │   │   ├── sse.ts
│   │   │   └── streamable-http.ts
│   │   ├── tools/
│   │   │   ├── index.ts
│   │   │   ├── identity.ts
│   │   │   ├── memory.ts
│   │   │   ├── content.ts
│   │   │   ├── social.ts
│   │   │   ├── chat.ts
│   │   │   └── storage.ts
│   │   ├── guard.ts              # Security filtering
│   │   └── types.ts              # MCP types
│   │
│   ├── skills/
│   │   ├── index.ts              # Skill framework
│   │   ├── registry.ts           # Skill registry
│   │   ├── memory/
│   │   │   ├── index.ts
│   │   │   ├── remember.ts
│   │   │   └── recall.ts
│   │   ├── content/
│   │   │   ├── index.ts
│   │   │   ├── post.ts
│   │   │   └── feed.ts
│   │   ├── research/
│   │   │   ├── index.ts
│   │   │   └── save-finding.ts
│   │   └── types.ts              # Skill types
│   │
│   └── cli/
│       ├── vivim-mcp.ts          # MCP CLI entry point
│       ├── vivim-skill.ts        # Skill management CLI
│       └── ...
│
├── package.json
│   └── bin:
│       ├── vivim: "src/cli/vivim-git.ts"
│       ├── vivim-node: "src/cli/vivim-node.ts"
│       ├── vivim-mcp: "src/mcp/server.ts"      # NEW
│       └── vivim-skill: "src/cli/vivim-skill.ts"  # NEW
│
└── examples/
    ├── mcp-cli/                   # CLI usage examples
    └── mcp-server/               # Server setup examples
```

---

## Part 6: Usage Examples

### 6.1 Starting MCP Server (STDIO)

```bash
# Run MCP server with STDIO transport
vivim-mcp

# With configuration
VIVIM_DID=did:key:xxx VIVIM_SEED=seedxxx vivim-mcp
```

### 6.2 Starting MCP Server (HTTP)

```bash
# Run HTTP server on custom port
vivim-mcp --transport http --port 3000

# With config file
vivim-mcp --config vivim.mcp.yaml
```

### 6.3 AI Agent Integration

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'vivim-mcp',
  args: [],
  env: {
    VIVIM_DID: 'did:key:xxx',
    VIVIM_SEED: 'seedxxx'
  }
});

const client = new Client({
  name: 'ai-agent',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// Create memory
const memoryResult = await client.callTool({
  name: 'memory_create',
  arguments: {
    content: 'Important: Use bcrypt for password hashing',
    type: 'semantic',
    tags: ['security', 'best-practice']
  }
});

// Get feed
const feedResult = await client.callTool({
  name: 'content_feed',
  arguments: {
    type: 'following',
    limit: 20
  }
});
```

### 6.4 Using Skills

```typescript
import { loadSkill } from '@vivim/sdk/skills';
import { VivimSDK } from '@vivim/sdk';

const sdk = new VivimSDK();
await sdk.initialize();

// Load memory skill
const memorySkill = await loadSkill('@vivim/skill-memory', sdk);

// Use skill capability
const result = await memorySkill.remember(
  'Remember that the auth module uses JWT tokens',
  'fact',
  ['authentication', 'security']
);

// Search memory
const memories = await memorySkill.recall('JWT tokens', 5);
```

---

## Part 7: Security Considerations

### 7.1 Guard Mode

Implement tool filtering for security:

```bash
# Allow only read operations
vivim-mcp --allow 'memory_*,content_*,social_circles' --deny '*_create,*_delete'

# Read-only mode
vivim-mcp --read-only
```

### 7.2 Input Validation

All tool inputs will be validated against JSON Schema before execution.

### 7.3 Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  keyGenerator: (toolName: string) => string;
}
```

---

## Appendix A: MCP Protocol Reference

### Message Types

| Type | Description |
|------|-------------|
| `initialize` | Initialize connection between client and server |
| `tools/list` | List available tools |
| `tools/call` | Call a specific tool |
| `resources/list` | List available resources |
| `resources/read` | Read a resource |
| `prompts/list` | List available prompts |
| `prompts/get` | Get a specific prompt |

### Response Format

```typescript
interface ToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

---

## Appendix B: Migration Guide

### From CLI to MCP

Existing CLI users can continue using the CLI as-is. For MCP integration:

1. Install the MCP server: `npm install @vivim/sdk`
2. Start the MCP server: `vivim-mcp`
3. Connect your AI agent to the MCP server

### Configuration Migration

| Old Config | New Config |
|-----------|------------|
| CLI flags | `vivim.mcp.yaml` |
| Environment variables | Same + `VIVIM_MCP_*` prefix |
| Output format | Built into MCP protocol |

---

## Summary

This design plan provides a comprehensive approach to enhancing the VIVIM SDK CLI with:

1. **MCP Server**: Full MCP protocol implementation with STDIO, HTTP SSE, and Streamable HTTP transports
2. **Tool Mapping**: All existing CLI commands exposed as MCP tools with proper JSON Schema
3. **Skill System**: Modular, installable skill packages for common agent workflows
4. **Security**: Guard mode, input validation, and rate limiting

The implementation follows industry best practices and maintains backward compatibility with existing CLI usage while enabling powerful AI agent integration.
