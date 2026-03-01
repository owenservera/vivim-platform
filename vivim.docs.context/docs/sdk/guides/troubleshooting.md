---
sidebar_position: 14
---

# Troubleshooting Guide

Common issues and solutions for VIVIM SDK development.

## Installation Issues

### "Command not found: vivim"

**Problem**: CLI commands not available after installation.

**Solution**:
```bash
# Ensure global installation
bun install -g @vivim/sdk

# Or use bun run
bun run vivim <command>

# Check installation
bun list -g | grep @vivim/sdk
```

### "Module not found: @vivim/sdk"

**Problem**: SDK module cannot be resolved.

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Check package.json
{
  "dependencies": {
    "@vivim/sdk": "^1.0.0"
  }
}
```

## Identity Issues

### "Identity not initialized"

**Problem**: SDK operations fail due to missing identity.

**Solution**:
```typescript
// Ensure identity is created before operations
const sdk = new VivimSDK({
  identity: { autoCreate: true },
});

await sdk.initialize();

// Verify identity exists
const identity = sdk.getIdentity();
if (!identity) {
  throw new Error('Identity not created');
}
```

### "Invalid signature"

**Problem**: Signature verification fails.

**Solution**:
```typescript
// Ensure correct data encoding
const data = { message: 'test' };
const signature = await identity.sign(data);

// Verify with same data structure
const valid = await identity.verify(data, signature);

// Check key format
console.log('Public key:', identity.publicKey);
console.log('DID:', identity.did);
```

## Node Issues

### "Node not found: storage-node"

**Problem**: Cannot load a node.

**Solution**:
```typescript
// Check node is registered
const graph = sdk.getGraph();
const nodes = graph.getNodes();

console.log('Available nodes:', nodes.map(n => n.id));

// Load with error handling
try {
  const node = await sdk.loadNode('storage-node');
} catch (error) {
  console.error('Node load failed:', error.message);
  
  // Check node definition
  const definitions = graph.getNodeDefinitions();
  console.log('Registered definitions:', definitions);
}
```

### "Node initialization failed"

**Problem**: Node fails to initialize.

**Solution**:
```typescript
// Check node configuration
const storageNode = await sdk.loadNode('storage', {
  defaultLocation: 'local',
  encryption: true,
});

// Verify dependencies
const nodeInfo = storageNode.getInfo();
console.log('Dependencies:', nodeInfo.dependencies);

// Install missing dependencies
for (const dep of nodeInfo.dependencies) {
  await sdk.installDependency(dep);
}
```

## Storage Issues

### "Storage operation failed"

**Problem**: Store/retrieve operations fail.

**Solution**:
```typescript
// Check storage availability
const status = await storageNode.getStatus();
console.log('Storage status:', status);

// Verify CID format
const validCid = cid.startsWith('bafy');
if (!validCid) {
  throw new Error('Invalid CID format');
}

// Check encryption
if (result.encrypted) {
  // Ensure decryption key is available
  const identity = sdk.getIdentity();
  if (!identity) {
    throw new Error('Identity required for decryption');
  }
}
```

### "IPFS pinning failed"

**Problem**: Cannot pin content to IPFS.

**Solution**:
```typescript
// Check IPFS gateway connectivity
const gateway = 'https://ipfs.vivim.live';
try {
  await fetch(`${gateway}/api/v0/pin/ls`);
} catch (error) {
  console.error('IPFS gateway unreachable:', gateway);
}

// Use local pinning as fallback
await storageNode.store(data, {
  pin: true,
  location: 'local', // Fallback to local
});
```

## Network Issues

### "Cannot connect to bootstrap node"

**Problem**: P2P network connection fails.

**Solution**:
```typescript
// Check bootstrap node availability
const bootstrapNodes = [
  'https://bootstrap1.vivim.live',
  'https://bootstrap2.vivim.live',
];

for (const node of bootstrapNodes) {
  try {
    await fetch(node);
    console.log('Bootstrap available:', node);
    break;
  } catch {
    console.log('Bootstrap unavailable:', node);
  }
}

// Use alternative bootstrap
const sdk = new VivimSDK({
  network: {
    bootstrapNodes: ['https://backup-bootstrap.vivim.live'],
  },
});
```

### "Sync failed"

**Problem**: State synchronization fails.

**Solution**:
```typescript
const sync = sdk.getSyncProtocol();

// Check sync status
const status = sync.getStatus();
console.log('Sync status:', status);

// Manual sync trigger
try {
  await sync.syncNow();
} catch (error) {
  console.error('Sync failed:', error.message);
  
  // Check parent connection
  if (!status.connected) {
    await sync.connectToParent(parentDid);
  }
}
```

## Memory Issues

### "Memory search returns no results"

**Problem**: Semantic search returns empty results.

**Solution**:
```typescript
// Check memory exists
const memories = await memoryNode.search({
  text: 'query',
  limit: 10,
});

console.log('Total memories:', memories.length);

// Verify embeddings
if (memories.length === 0) {
  // Check if embeddings were generated
  const memory = await memoryNode.get(memoryId);
  console.log('Has embedding:', !!memory.embedding);
  
  // Regenerate embeddings
  await memoryNode.consolidate();
}
```

### "Memory consolidation failed"

**Problem**: Memory consolidation process fails.

**Solution**:
```typescript
// Check memory count
const stats = await memoryNode.getStats();
console.log('Memory count:', stats.totalCount);

// Consolidate in batches
if (stats.totalCount > 1000) {
  // Process in smaller batches
  await memoryNode.consolidate({
    batchSize: 100,
    types: ['episodic'], // Specific types first
  });
}
```

## Performance Issues

### "Slow operations"

**Problem**: SDK operations are slow.

**Solution**:
```typescript
// Enable caching
const cacheExt = new CacheExtension({
  storage: 'memory',
  ttl: 3600,
});

sdk.getExtensionSystem().registerExtension(cacheExt);

// Use batch operations
const results = await Promise.all(
  items.map(item => storageNode.store(item))
);

// Check network latency
const startTime = Date.now();
await storageNode.retrieve(cid);
const latency = Date.now() - startTime;

console.log('Operation latency:', latency, 'ms');
```

### "High memory usage"

**Problem**: Application uses too much memory.

**Solution**:
```typescript
// Clear caches
await storageNode.clearCache();

// Unload unused nodes
await sdk.unloadNode('unused-node');

// Limit concurrent operations
const semaphore = new Semaphore(10); // Max 10 concurrent

async function limitedStore(data: any) {
  await semaphore.acquire();
  try {
    return await storageNode.store(data);
  } finally {
    semaphore.release();
  }
}
```

## Debug Mode

### Enable Debug Logging

```typescript
// Environment variable
process.env.DEBUG = 'true';

// Or configure logger
import { setLogger, Logger } from '@vivim/sdk/utils';

const debugLogger = new Logger({
  level: 'debug',
  prefix: 'VIVIM',
  timestamps: true,
});

setLogger(debugLogger);
```

### Debug Events

```typescript
// Listen to all SDK events
sdk.on('*', (event) => {
  console.log('SDK Event:', event.type, event.data);
});

// Listen to node events
const node = await sdk.loadNode('storage');
node.on('*', (event) => {
  console.log('Node Event:', event.type, event.payload);
});
```

## Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `SDK_NOT_INITIALIZED` | SDK not initialized | Call `await sdk.initialize()` |
| `NODE_NOT_FOUND` | Node doesn't exist | Check node ID, register node |
| `NODE_LOAD_FAILED` | Node loading failed | Check dependencies, config |
| `IDENTITY_CREATION_FAILED` | Cannot create identity | Check seed, entropy |
| `OPERATION_RECORD_FAILED` | RecordKeeper failed | Check storage, connection |
| `ANCHOR_FAILED` | State anchoring failed | Check network, IPFS |
| `VALIDATION_ERROR` | Data validation failed | Check schema, types |

## Getting Help

### Resources

- **GitHub Issues**: [Report bugs](https://github.com/vivim/vivim-sdk/issues)
- **Discussions**: [Ask questions](https://github.com/vivim/vivim-sdk/discussions)
- **Discord**: [Join community](https://discord.gg/vivim)

### Debug Information

When reporting issues, include:

```typescript
// Collect debug info
const debugInfo = {
  sdkVersion: SDK_VERSION,
  nodeVersion: process.version,
  platform: process.platform,
  identity: sdk.getIdentity()?.did,
  loadedNodes: sdk.getGraph().getNodes().map(n => n.id),
  networkStatus: sdk.getNetworkStatus(),
};

console.log('Debug info:', debugInfo);
```

## Related

- [Testing Guide](./testing) - Testing strategies
- [Advanced Examples](../examples/advanced) - Complex patterns

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **Issues**: [github.com/vivim/vivim-sdk/issues](https://github.com/vivim/vivim-sdk/issues)
