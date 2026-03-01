---
sidebar_position: 9
---

# CLI Reference

The VIVIM SDK includes powerful command-line tools for managing nodes, applications, and development workflows.

## Installation

```bash
# Install globally with Bun
bun install -g @vivim/sdk

# Or install from source
cd sdk
bun install
bun run build
bun link
```

## Available Commands

```bash
vivim --help              # Show all commands
vivim <command> --help    # Show help for specific command
```

## Command Categories

- **Agent Commands** - AI agent operations
- **Component Commands** - SDK component management
- **Template Commands** - Component templates
- **Build Commands** - Build and test
- **Git Commands** - Git integration with AI

---

## Agent Commands

### `vivim agent`

Manage AI agents for autonomous operations.

#### Subcommands

```bash
vivim agent list          # List all agents
vivim agent create        # Create new agent
vivim agent run           # Run agent
vivim agent stop          # Stop running agent
```

#### Examples

```bash
# List all agents
vivim agent list

# Create research agent
vivim agent create research --model gpt-4 --prompt "Research AI trends"

# Run agent
vivim agent run research

# Stop agent
vivim agent stop research
```

---

## Component Commands

### `vivim component create`

Create a new SDK component from template.

```bash
vivim component create <name> <type> [options]
```

#### Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `name` | string | Component name |
| `type` | `api-node` \| `sdk-node` \| `extension` | Component type |

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--description` | `-d` | Component description |
| `--path` | `-p` | Output path |
| `--author` | `-a` | Author name |

#### Examples

```bash
# Create API node
vivim component create my-node api-node --description "My custom node"

# Create extension
vivim component create my-ext extension -d "Custom extension" -p ./extensions

# Create with author
vivim component create my-node api-node --author "John Doe"
```

### `vivim component list`

List all SDK components.

```bash
vivim component list [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--type` | `-t` | Filter by type |
| `--status` | `-s` | Filter by status |

#### Examples

```bash
# List all components
vivim component list

# Filter by type
vivim component list -t api-node

# Filter by status
vivim component list -s published
```

### `vivim component info`

Get component details.

```bash
vivim component info <id>
```

#### Examples

```bash
vivim component info @myorg/node-mynode
```

### `vivim component build`

Build a component.

```bash
vivim component build <id>
```

#### Examples

```bash
vivim component build @myorg/node-mynode
```

### `vivim component test`

Test a component.

```bash
vivim component test <id> [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--coverage` | `-c` | Generate coverage report |
| `--watch` | `-w` | Watch mode |

#### Examples

```bash
# Run tests
vivim component test @myorg/node-mynode

# With coverage
vivim component test @myorg/node-mynode --coverage
```

### `vivim component publish`

Publish a component to registry.

```bash
vivim component publish <id> [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--version` | `-v` | Version bump (major/minor/patch) |
| `--dry-run` | `-n` | Dry run (no actual publish) |

#### Examples

```bash
# Publish with patch version
vivim component publish @myorg/node-mynode -v patch

# Dry run
vivim component publish @myorg/node-mynode --dry-run
```

---

## Template Commands

### `vivim template list`

List available component templates.

```bash
vivim template list
```

#### Available Templates

| Template | Description |
|----------|-------------|
| `api-node` | API node for core functionality |
| `sdk-node` | SDK node for framework integration |
| `network-node` | Network infrastructure node |
| `extension` | Extension for existing nodes |
| `custom` | Custom component |

#### Examples

```bash
vivim template list
```

---

## Git Commands

### `vivim git`

AI-powered Git operations with semantic commit generation.

```bash
vivim git [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--dry-run` | `-d` | Dry run (no actual commit) |
| `--prompt` | `-p` | Enable interactive prompt |
| `--model` | `-m` | AI model to use |

#### Examples

```bash
# Run with defaults
vivim git

# Dry run
vivim git --dry-run

# With custom model
vivim git --model gpt-4o

# Skip prompt
vivim git --no-prompt
```

#### Workflow

1. **Gather Context**: Analyzes working directory and staged changes
2. **Anchor Code**: Creates CID for changes on distributed storage
3. **Generate Commit**: AI generates semantic commit message
4. **Apply Commit**: Creates native git commit (unless dry-run)

#### Example Output

```
🔗 [VIVIM] Initializing On-Chain AI-Git Execution Loop...
📦 Analyzing working directory...
📝 Found 3 modified files, 2 added files
🔗 Anchoring code to IPFS...
📡 CID: bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi
🤖 Generating semantic commit...
✨ Commit: feat(sdk): add memory node with semantic search

🎉 Semantic Workflow Finalized!
📡 Distributed CID: bafy...
```

---

## Node Commands

### `vivim node`

Run decentralized VIVIM node with all applications.

```bash
vivim node [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--port` | `-p` | Port number (default: 9200) |
| `--roles` | `-r` | Node roles (comma-separated) |
| `--config` | `-c` | Config file path |

#### Examples

```bash
# Start node with defaults
vivim node

# Custom port
vivim node --port 9300

# Specific roles
vivim node --roles storage,agent,bootstrap

# With config file
vivim node --config ./node-config.json
```

#### Node Roles

| Role | Description |
|------|-------------|
| `storage` | Storage provider |
| `agent` | AI agent host |
| `bootstrap` | Bootstrap node for peer discovery |
| `relay` | Relay node for P2P connections |

#### Example Output

```
🔗=======================================🔗
  [VIVIM Omni-Node] Booting Edge Serverless
🔗=======================================🔗

✅  Omni-Node fully operational.
🌐  P2P Identity: 16Uiu2HAm...
📡 Listening on: /ip4/0.0.0.0/tcp/9200/ws

Applications Started:
✅ ACU Processor
✅ OmniFeed
✅ Circle Engine
✅ AI Documentation
✅ Crypto Engine
✅ Assistant Engine
✅ Tool Engine
✅ Public Dashboard
✅ Publishing Agent
✅ Roadmap Engine
```

---

## Configuration

### Config File Locations

| Location | Path |
|----------|------|
| **Global** | `~/.vivim/config.json` |
| **Project** | `./vivim.config.json` |
| **Environment** | `.env` |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VIVIM_AI_MODEL` | Default AI model | `gpt-4o` |
| `VIVIM_REGISTRY_URL` | Registry URL | `https://registry.vivim.net` |
| `VIVIM_LOG_LEVEL` | Log level | `info` |
| `VIVIM_CONFIG_PATH` | Config file path | `~/.vivim/config.json` |

### Example Config

```json
{
  "ai": {
    "model": "gpt-4o",
    "apiKey": "sk-..."
  },
  "registry": {
    "url": "https://registry.vivim.net",
    "trustedPublishers": ["did:vivim:vivim-team"]
  },
  "node": {
    "port": 9200,
    "roles": ["storage", "agent"],
    "bootstrapNodes": ["https://bootstrap.vivim.live"]
  },
  "logging": {
    "level": "debug",
    "format": "json"
  }
}
```

---

## Complete Examples

### Create and Publish Node

```bash
# Create new API node
vivim component create my-storage-node api-node \
  --description "Enhanced storage with caching" \
  --author "MyOrg"

# Build the node
vivim component build @myorg/node-my-storage-node

# Run tests
vivim component test @myorg/node-my-storage-node --coverage

# Publish to registry
vivim component publish @myorg/node-my-storage-node -v minor
```

### Run Development Node

```bash
# Start local development node
vivim node --port 9200 --roles storage,agent

# In another terminal, interact with node
vivim agent list
```

### AI-Powered Git Workflow

```bash
# Stage changes
git add .

# Generate semantic commit with AI
vivim git --prompt

# Review and confirm
# AI suggests: feat(memory): add semantic search with embeddings
# Confirm: y

# Commit created both on-chain and in git
```

---

## Troubleshooting

### Common Issues

#### "Command not found: vivim"

```bash
# Ensure SDK is installed globally
bun install -g @vivim/sdk

# Or use bun run
bun run vivim <command>
```

#### "Identity not initialized"

```bash
# Initialize identity first
vivim identity create
```

#### "Registry connection failed"

```bash
# Check registry URL
vivim config get registry.url

# Update if needed
vivim config set registry.url https://registry.vivim.net
```

---

## Related

- [Getting Started](../guides/getting-started) - Quick start guide
- [Self-Design](../core/self-design) - Component development
- [Examples](../examples/basic) - Code examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **CLI Source**: [github.com/vivim/vivim-sdk/tree/main/src/cli](https://github.com/vivim/vivim-sdk/tree/main/src/cli)
