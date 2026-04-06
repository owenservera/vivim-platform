itle: "SDK Advanced"
description: "Custom integrations, extension points, encryption key management, and building VIVIM-powered applications."
---

# Advanced Guide

Build custom integrations with VIVIM's extension points, manage encryption keys, and create VIVIM-powered applications from scratch.

## Custom storage backend

Extend the SDK to use a custom storage backend:

```typescript
import { StorageBackend, type StorageConfig } from '@vivim/sdk/storage';

class MyCustomBackend extends StorageBackend {
  async initialize(config: StorageConfig) {
    // Set up connection to your storage
  }

  async read(key: string): Promise<Buffer> {
    // Read encrypted data from your storage
  }

  async write(key: string, data: Buffer): Promise<void> {
    // Write encrypted data to your storage
  }

  async delete(key: string): Promise<void> {
    // Remove data from your storage
  }
}

const vivim = new VIVIM({
  apiUrl: 'https://api.vivim.app',
  storage: new MyCustomBackend(),
});
```

## Custom ACU extractor

Build a custom extractor for non-conversation data sources:

```typescript
import { Extractor, type ExtractorResult } from '@vivim/sdk/extractors';

class CodebaseExtractor extends Extractor {
  name = 'codebase';

  async extract(source: { path: string; content: string }): Promise<ExtractorResult> {
    const acus: NewACU[] = [];

    // Extract conventions from code
    if (source.content.includes('functional component')) {
      acus.push({
        content: 'Project uses functional React components',
        type: 'convention',
        source: { type: 'codebase', path: source.path },
      });
    }

    return { acus };
  }
}

// Register the extractor
vivim.extractors.register(new CodebaseExtractor());

// Run extraction
await vivim.extractors.run('codebase', {
  path: 'src/components/App.tsx',
  content: fileContent,
});
```

## Encryption key management

### Key derivation

```typescript
import { deriveKeys } from '@vivim/sdk/crypto';

const keys = deriveKeys({
  masterSecret: process.env.VIVIM_MASTER_SECRET,
  salt: 'user-specific-salt', // Optional: per-user salt
});

console.log(`Encryption key derived: ${keys.encryptionKey.length} bytes`);
```

### Key rotation

```typescript
// Rotate encryption keys (re-encrypts all data)
await vivim.identity.rotateKeys({
  newMasterSecret: newSecret,
  progressCallback: (progress) => {
    console.log(`Re-encrypted ${progress.completed}/${progress.total} records`);
  },
});
```

### Export keys

```typescript
// Export your keys for backup
const exportData = await vivim.identity.export();
console.log(`Exported ${exportData.acus.length} ACUs`);
console.log(`Key fingerprint: ${exportData.keyFingerprint}`);
```

## Event system

Listen to VIVIM events for real-time integration:

```typescript
// Memory created
vivim.on('memory:created', (acu) => {
  console.log(`New memory: ${acu.content}`);
});

// Memory classified
vivim.on('memory:classified', ({ acu, type }) => {
  console.log(`Classified as ${type}: ${acu.content}`);
});

// Sync completed
vivim.on('sync:complete', ({ peerId, records }) => {
  console.log(`Synced ${records} records with ${peerId}`);
});

// Context assembled
vivim.on('context:assembled', ({ layers, tokenCount }) => {
  console.log(`Context: ${layers.length} layers, ${tokenCount} tokens`);
});
```

## Building a VIVIM app

Full example: a CLI tool that queries your VIVIM memory:

```typescript
#!/usr/bin/env bun
import { VIVIM } from '@vivim/sdk';
import { Command } from 'commander';

const program = new Command();

program
  .name('vivim-cli')
  .description('Query your VIVIM memory from the terminal')
  .argument('<query>', 'Search query')
  .option('-t, --type <type>', 'Filter by memory type')
  .option('-l, --limit <n>', 'Max results', '10')
  .action(async (query, options) => {
    const vivim = new VIVIM({
      apiUrl: process.env.VIVIM_API_URL,
    });

    const results = await vivim.memory.search({
      query,
      filters: options.type ? { types: [options.type] } : undefined,
      limit: parseInt(options.limit),
    });

    for (const acu of results) {
      console.log(`\n[${acu.type}] ${acu.content}`);
      console.log(`  Created: ${acu.createdAt.toISOString()}`);
    }
  });

program.parse();
```

## MCP Server integration

The SDK includes an MCP (Model Context Protocol) server for Claude Desktop and Cursor integration:

```bash
# Start the MCP server
bun run @vivim/sdk mcp:start

# Configure Claude Desktop
# Add to claude_desktop_config.json:
{
  "mcpServers": {
    "vivim": {
      "command": "bun",
      "args": ["run", "@vivim/sdk", "mcp:start"],
      "env": {
        "VIVIM_API_URL": "https://api.vivim.app"
      }
    }
  }
}
```


::: warning
Key rotation re-encrypts all your data. This is a computationally expensive operation. Only rotate keys when necessary and ensure you have a backup.
:::



::: tip
The SDK source is fully documented with JSDoc. Run `bun run sdk:docs` in the repository to generate local API documentation.
:::

