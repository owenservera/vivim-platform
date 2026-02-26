# Basic VIVIM Node Example

This example demonstrates the minimal setup required to get a VIVIM node running and connected to the network.

## Running the Example

1. **Install dependencies** (from the SDK root):
   ```bash
   bun install
   ```

2. **Run the example**:
   ```bash
   cd examples/basic-node
   bun run start
   ```

## What it does

- Initializes the `VivimSDK` with a random node ID.
- Enables the `RecordKeeper` (distributed storage).
- Sets the log level to `debug` to see internal operations.
- Listens for `peer:connected` and `peer:disconnected` events.
- Starts the P2P networking stack.
