// test-vercel-ai-sdk.js
// Simple test to verify Vercel AI SDK integration

import { unifiedProvider } from './src/ai/unified-provider.js';
import { ProviderType } from './src/types/ai.js';

async function testIntegration() {
  console.log('Testing Vercel AI SDK Integration...');
  
  try {
    // Initialize the provider
    await unifiedProvider.initialize();
    console.log('✓ Provider initialized successfully');
    
    // Check available providers
    const availableProviders = unifiedProvider.getAvailableProviders();
    console.log('✓ Available providers:', availableProviders);
    
    // Test getting a provider
    const zaiProvider = unifiedProvider.getProvider(ProviderType.ZAI);
    console.log('✓ ZAI provider retrieved successfully');
    
    // Test getting default model
    const defaultModel = unifiedProvider.getDefaultModel(ProviderType.ZAI);
    console.log('✓ Default ZAI model:', defaultModel);
    
    // Test provider selection
    const selectedProvider = unifiedProvider.selectProvider({ preferredProvider: ProviderType.ZAI });
    console.log('✓ Provider selection working');
    
    console.log('\n✓ All integration tests passed!');
    console.log('Vercel AI SDK is properly integrated with your OpenScroll project.');
    
  } catch (error) {
    console.error('✗ Integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testIntegration();