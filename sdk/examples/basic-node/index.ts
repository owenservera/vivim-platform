import { VivimSDK } from '@vivim/sdk';

/**
 * Basic VIVIM Node Example
 * 
 * This example demonstrates how to initialize the SDK and listen for peer connections.
 */

async function main() {
  console.log('🚀 Starting VIVIM Basic Node...');

  // Initialize the SDK
  const sdk = new VivimSDK({
    identity: {
      did: 'example-node-' + Math.random().toString(36).slice(2, 7),
      autoCreate: true
    },
    storage: {
      encryption: true
    }
  });

  // Listen for peer connection events
  sdk.on('network:connected', (peerId) => {
    console.log(`✅ Connected to peer: ${peerId}`);
  });

  // Listen for peer disconnection events
  sdk.on('network:disconnected', (peerId) => {
    console.log(`❌ Disconnected from peer: ${peerId}`);
  });

  // Start the SDK
  try {
    await sdk.initialize();
    console.log('🌐 VIVIM SDK started successfully!');
    console.log(`Node ID: ${sdk.getIdentity()?.did}`);
  } catch (error) {
    console.error('Failed to start VIVIM SDK:', error);
    process.exit(1);
  }
}

main().catch(console.error);
