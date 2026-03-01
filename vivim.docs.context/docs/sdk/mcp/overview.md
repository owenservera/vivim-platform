# MCP (Model Context Protocol)

The VIVIM SDK includes a robust implementation of the Model Context Protocol (MCP), enabling seamless communication between AI models and VIVIM's data storage, identity, and social features.

## Components

### 1. MCP Server (`sdk/src/mcp/server.ts`)
A dedicated server implementation that exposes VIVIM functionalities over standard MCP transports.

### 2. Transports (`sdk/src/mcp/transports/`)
Support for multiple transport layers:
- **HTTP** - Standard web-based communication.
- **WebSocket** - Real-time full-duplex communication.
- **Stdio** - Standard input/output for local processes.
- **LibP2P** - Decentralized peer-to-peer transport.
- **Social** - Integration with ActivityPub/Fediverse streams.

### 3. Tools (`sdk/src/mcp/tools/`)
Pre-built tools for common operations:
- **Chat** - AI conversation management.
- **Content** - Retrieval and parsing of memories.
- **Identity** - DID and profile management.
- **Memory** - Vector search and retrieval.
- **Social** - Federation and sharing.
- **Storage** - Direct database access.

## Usage

```typescript
import { McpServer } from '@vivim/sdk';
import { StdioTransport } from '@vivim/sdk/mcp/transports';

const server = new McpServer({
  name: 'VIVIM Agent',
  version: '1.0.0',
});

// Register tools
server.registerTool('get_memory', ...);

// Start server
await server.connect(new StdioTransport());
```
