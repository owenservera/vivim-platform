import { test as base } from '@playwright/test';
import { VivimDebugKit } from '../utils/vivim-debug-kit';

type VivimFixtures = {
  debugKit: VivimDebugKit;
};

export const test = base.extend<VivimFixtures>({
  debugKit: async ({ page }, use) => {
    const debugKit = new VivimDebugKit(page);
    await debugKit.init();
    
    // Auto-check for errors after each test
    await use(debugKit);
    
    // Post-test validation
    const testInfo = test.info();
    if (testInfo.status !== testInfo.expectedStatus) {
      console.log(`Test failed: ${testInfo.title}. Capturing diagnostic snapshot...`);
      const snapshot = await debugKit.captureDiagnosticSnapshot();
      // Attach snapshot to playwright report
      await testInfo.attach('vivim-diagnostic-snapshot', {
        body: JSON.stringify(snapshot, null, 2),
        contentType: 'application/json',
      });
    }
    
    await debugKit.assertNoErrors();
  },
});

export { expect } from '@playwright/test';
