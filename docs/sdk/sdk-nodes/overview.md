---
sidebar_position: 3
---

# SDK Nodes

SDK Nodes provide framework-specific adapters and components for integrating VIVIM into your applications.

## Official SDK Nodes

| Node | Package | Framework |
|------|---------|-----------|
| **React** | `@vivim/sdk-react` | React |
| **Vue** | `@vivim/sdk-vue` | Vue 3 |
| **Svelte** | `@vivim/sdk-svelte` | Svelte |
| **Flutter** | `@vivim/sdk-flutter` | Flutter/Dart |
| **React Native** | `@vivim/sdk-react-native` | React Native |
| **Node.js** | `@vivim/sdk-node` | Node.js server |

## React SDK

### Installation

```bash
npm install @vivim/sdk-react
# or
bun add @vivim/sdk-react
```

### Quick Start

```tsx
import { VivimProvider, useSDK, useNode } from '@vivim/sdk-react';

function App() {
  return (
    <VivimProvider config={{
      identity: { autoCreate: true },
      network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
    }}>
      <MyComponent />
    </VivimProvider>
  );
}

function MyComponent() {
  const { sdk, connected } = useSDK();
  const storageNode = useNode('storage');

  const handleSave = async () => {
    await storageNode?.save({
      key: 'my-data',
      value: { hello: 'world' },
    });
  };

  return (
    <div>
      <p>Connected: {connected ? 'Yes' : 'No'}</p>
      <button onClick={handleSave}>Save Data</button>
    </div>
  );
}
```

### Hooks

#### useSDK

```tsx
const { sdk, connected, initializing, error } = useSDK();

// Manual initialization
await sdk.initialize();

// Check connection status
if (connected) {
  console.log('SDK is connected');
}
```

#### useNode

```tsx
const storageNode = useNode('storage');
const identityNode = useNode('identity');
const chatNode = useNode('ai-chat');

// Use the node
await storageNode?.save({ key: 'data', value: data });
```

#### useIdentity

```tsx
const { identity, did, sign, verify } = useIdentity();

// Get DID
console.log(did); // "did:vivim:..."

// Sign data
const signature = await sign(data);

// Verify signature
const valid = await verify(data, signature, publicKey);
```

#### useStorage

```tsx
const { save, load, remove, list } = useStorage();

// Save data
await save('my-key', { hello: 'world' }, { encrypt: true });

// Load data
const data = await load('my-key');

// List keys
const keys = await list();
```

#### useChat

```tsx
const { send, stream, messages, setMessages } = useChat({
  provider: 'openai',
  model: 'gpt-4',
});

// Send message
const response = await send('Hello, AI!');

// Stream response
const stream = await stream('Tell me a story');
for await (const chunk of stream) {
  console.log(chunk);
}
```

#### useMemory

```tsx
const { save, search, getRelated, remove } = useMemory();

// Save memory
await save({
  type: 'conversation',
  content: 'User asked about VIVIM',
  tags: ['sdk', 'question'],
});

// Search
const results = await search('VIVIM SDK');
```

### Components

#### VivimProvider

```tsx
<VivimProvider
  config={{
    identity: { autoCreate: true },
    network: { bootstrapNodes: [...] },
    storage: { defaultLocation: 'local' },
  }}
  onError={(error) => console.error(error)}
  onConnected={() => console.log('Connected!')}
>
  {children}
</VivimProvider>
```

#### StorageProvider

```tsx
<StorageProvider encrypt={true}>
  <MyComponent />
</StorageProvider>
```

#### ChatProvider

```tsx
<ChatProvider
  config={{
    provider: 'openai',
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant.',
  }}
>
  <MyComponent />
</ChatProvider>
```

## Vue SDK

### Installation

```bash
npm install @vivim/sdk-vue
# or
bun add @vivim/sdk-vue
```

### Quick Start

```vue
<script setup lang="ts">
import { provideVivim, useSDK, useNode } from '@vivim/sdk-vue';

// In your App.vue or main component
provideVivim({
  identity: { autoCreate: true },
  network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
});

// In your components
const { sdk, connected } = useSDK();
const storageNode = useNode('storage');

const handleSave = async () => {
  await storageNode.value?.save({
    key: 'my-data',
    value: { hello: 'world' },
  });
};
</script>

<template>
  <div>
    <p>Connected: {{ connected ? 'Yes' : 'No' }}</p>
    <button @click="handleSave">Save Data</button>
  </div>
</template>
```

### Composables

#### useSDK

```ts
const { sdk, connected, initializing, error } = useSDK();
```

#### useNode

```ts
const storageNode = useNode('storage');
const identityNode = useNode('identity');
```

#### useIdentity

```ts
const { identity, did, sign, verify } = useIdentity();
```

#### useStorage

```ts
const { save, load, remove, list } = useStorage();
```

#### useChat

```ts
const { send, stream, messages } = useChat({
  provider: 'openai',
  model: 'gpt-4',
});
```

## Svelte SDK

### Installation

```bash
npm install @vivim/sdk-svelte
# or
bun add @vivim/sdk-svelte
```

### Quick Start

```svelte
<script lang="ts">
  import { createVivim, useSDK, useNode } from '@vivim/sdk-svelte';

  // Initialize in your root component
  createVivim({
    identity: { autoCreate: true },
    network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
  });

  // Use in components
  const { sdk, connected } = useSDK();
  const storageNode = useNode('storage');

  const handleSave = async () => {
    await storageNode?.save({
      key: 'my-data',
      value: { hello: 'world' },
    });
  };
</script>

<template>
  <div>
    <p>Connected: {$connected ? 'Yes' : 'No'}</p>
    <button on:click={handleSave}>Save Data</button>
  </div>
</template>
```

## Flutter SDK

### Installation

Add to `pubspec.yaml`:

```yaml
dependencies:
  vivim_sdk: ^1.0.0
```

### Quick Start

```dart
import 'package:vivim_sdk/vivim_sdk.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize SDK
  final sdk = VivimSDK(
    config: VivimConfig(
      identity: IdentityConfig(autoCreate: true),
      network: NetworkConfig(
        bootstrapNodes: ['https://bootstrap.vivim.live'],
      ),
      storage: StorageConfig(defaultLocation: 'local'),
    ),
  );
  
  await sdk.initialize();
  
  runApp(MyApp(sdk: sdk));
}
```

### Usage

```dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return VivimProvider(
      sdk: sdk,
      child: Column(
        children: [
          SDKStatusWidget(),
          StorageWidget(),
          ChatWidget(),
        ],
      ),
    );
  }
}

// Using nodes
final storageNode = sdk.getNode<StorageNode>('storage');
await storageNode.save(
  key: 'my-data',
  value: {'hello': 'world'},
  encrypt: true,
);

// Chat
final chatNode = sdk.getNode<AIChatNode>('ai-chat');
final response = await chatNode.send(
  message: 'Hello, AI!',
  provider: 'openai',
  model: 'gpt-4',
);
```

### Widgets

#### VivimProvider

```dart
VivimProvider(
  sdk: sdk,
  child: MyApp(),
)
```

#### SDKStatusWidget

```dart
SDKStatusWidget(
  onConnected: () => print('Connected!'),
  onDisconnected: () => print('Disconnected'),
  builder: (context, status) {
    return Text('Status: $status');
  },
)
```

#### StorageWidget

```dart
StorageWidget(
  encrypt: true,
  builder: (context, storage) {
    return ElevatedButton(
      onPressed: () async {
        await storage.save(key: 'data', value: data);
      },
      child: Text('Save'),
    );
  },
)
```

#### ChatWidget

```dart
ChatWidget(
  config: ChatConfig(
    provider: 'openai',
    model: 'gpt-4',
  ),
  builder: (context, chat) {
    return Column(
      children: [
        ...chat.messages.map((msg) => Text(msg.content)),
        ElevatedButton(
          onPressed: () => chat.send('Hello!'),
          child: Text('Send'),
        ),
      ],
    );
  },
)
```

## React Native SDK

### Installation

```bash
npm install @vivim/sdk-react-native
# or
bun add @vivim/sdk-react-native
```

### Quick Start

```tsx
import { VivimProvider, useSDK, useNode } from '@vivim/sdk-react-native';

function App() {
  return (
    <VivimProvider config={{
      identity: { autoCreate: true },
      network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
      storage: { defaultLocation: 'local' },
    }}>
      <MyComponent />
    </VivimProvider>
  );
}

function MyComponent() {
  const { sdk, connected } = useSDK();
  const storageNode = useNode('storage');

  const handleSave = async () => {
    await storageNode?.save({
      key: 'my-data',
      value: { hello: 'world' },
    });
  };

  return (
    <View>
      <Text>Connected: {connected ? 'Yes' : 'No'}</Text>
      <Button title="Save Data" onPress={handleSave} />
    </View>
  );
}
```

## Node.js SDK

### Installation

```bash
npm install @vivim/sdk-node
# or
bun add @vivim/sdk-node
```

### Quick Start

```typescript
import { createVivimServer } from '@vivim/sdk-node';
import express from 'express';

const app = express();

// Create VIVIM server
const vivimServer = await createVivimServer({
  port: 3000,
  config: {
    identity: { autoCreate: true },
    network: { bootstrapNodes: ['https://bootstrap.vivim.live'] },
    storage: { defaultLocation: 'local' },
  },
});

// Mount VIVIM routes
app.use('/vivim', vivimServer.routes);

// Custom route using SDK
app.post('/api/save', async (req, res) => {
  const storageNode = vivimServer.sdk.getNode('storage');
  const result = await storageNode.save({
    key: req.body.key,
    value: req.body.value,
  });
  res.json(result);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Express Middleware

```typescript
import { vivimMiddleware } from '@vivim/sdk-node';

// Add middleware to all routes
app.use(vivimMiddleware({
  sdk: vivimServer.sdk,
  authenticate: true,
}));
```

## Creating Custom SDK Nodes

```typescript
import { SDKNode, SDKNodeConfig } from '@vivim/sdk-core';

interface MyFrameworkConfig {
  theme?: string;
  locale?: string;
}

class MyFrameworkNode implements SDKNode {
  id = 'my-framework';
  version = '1.0.0';
  framework = 'my-framework';
  
  private config?: MyFrameworkConfig;

  async initialize(config: SDKNodeConfig) {
    this.config = config as MyFrameworkConfig;
    // Initialize framework-specific resources
  }

  async destroy() {
    // Cleanup resources
  }

  // Framework-specific methods
  renderComponent(name: string, props: any) {
    // Render framework component
  }

  createState(initialValue: any) {
    // Create reactive state
  }
}

// Register the node
await sdk.registerNode({
  id: 'my-framework',
  name: 'My Framework SDK',
  version: '1.0.0',
  type: 'sdk',
  framework: 'my-framework',
  schema: z.object({
    theme: z.string().optional(),
    locale: z.string().optional(),
  }),
  factory: (config) => {
    const node = new MyFrameworkNode();
    node.initialize(config);
    return node;
  },
});
```

## Related

- [Core SDK](../core/overview) - Core SDK fundamentals
- [API Nodes](../api-nodes/overview) - API nodes
- [Examples](../examples/sdk-nodes) - SDK node examples

## Links

- **GitHub Repository**: [github.com/vivim/vivim-sdk](https://github.com/vivim/vivim-sdk)
- **SDK Nodes Source**: [github.com/vivim/vivim-sdk/tree/main/nodes-sdk](https://github.com/vivim/vivim-sdk/tree/main/nodes-sdk)
