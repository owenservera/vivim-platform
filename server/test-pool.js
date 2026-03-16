// Quick test of the browser pool
import { browserPoolManager } from './src/capture/browser-pool-manager.js';

async function test() {
  console.log('Starting browser pool test...');
  
  try {
    // Initialize
    await browserPoolManager.initialize();
    console.log('✅ Pool initialized');
    
    // Acquire context
    console.log('Acquiring context...');
    const context = await browserPoolManager.acquireContext();
    console.log('✅ Context acquired:', context.workerId);
    
    // Navigate
    console.log('Navigating to example.com...');
    const html = await browserPoolManager.navigate(context, 'https://example.com', 30000);
    console.log('✅ Got HTML, length:', html.length);
    console.log('First 200 chars:', html.substring(0, 200));
    
    // Release
    console.log('Releasing context...');
    await browserPoolManager.releaseContext(context);
    console.log('✅ Context released');
    
    // Shutdown
    await browserPoolManager.shutdown();
    console.log('✅ Pool shut down');
    
    console.log('ALL TESTS PASSED!');
  } catch (e) {
    console.error('TEST FAILED:', e.message);
    console.error(e.stack);
  }
}

test();
