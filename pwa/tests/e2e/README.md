# VIVIM Full Frontend Test Kit & Debugging Services

This toolkit provides a comprehensive environment for automated E2E testing and deep debugging of the VIVIM PWA.

## Features

- **Automated E2E Testing**: Powered by Playwright, running tests in real browsers (Chrome, Firefox, Safari).
- **Integrated Debugging**: Tests have direct access to the `UnifiedDebugService` and `ErrorReporter`.
- **Data Flow Tracking**: Verify that background processes, API calls, and DB operations complete successfully.
- **Performance Monitoring**: Assert on render times, memory usage, and network latency during tests.
- **Automatic Diagnostic Snapshots**: On test failure, a full snapshot of the application state (logs, flows, health) is captured and attached to the report.
- **Comprehensive Analysis**: Post-test script that aggregates diagnostic data to identify bottlenecks and common failure patterns.

## Directory Structure

- `pwa/tests/e2e/specs/`: E2E test specifications.
- `pwa/tests/e2e/fixtures/`: Playwright fixtures (use `test` from `vivim-test.ts`).
- `pwa/tests/e2e/utils/`: Utility classes like `VivimDebugKit`.
- `pwa/scripts/`: Analysis and reporting scripts.

## Usage

### Running Tests

```bash
# Run all E2E tests
cd pwa && bun run test:e2e

# Run tests in UI mode
cd pwa && bun run test:e2e:ui

# Run tests in debug mode
cd pwa && bun run test:e2e:debug
```

### Analyzing Results

After running tests, you can generate a comprehensive analysis of all captured diagnostic data:

```bash
cd pwa && bun run test:e2e:analyze
```

This will output a summary to the console and generate a detailed `analysis-report.json` in `pwa/playwright-report/vivim-data/`.

## Writing Tests

Always use the `test` and `expect` from the `vivim-test` fixture to gain access to the `debugKit`.

```typescript
import { test, expect } from '../fixtures/vivim-test';

test('my test', async ({ page, debugKit }) => {
  await page.goto('/');
  
  // Interact with page
  await page.click('#my-button');
  
  // Verify data flow
  await debugKit.waitForFlow('my-request-id');
  
  // Assert no errors occurred during interaction
  await debugKit.assertNoErrors();
});
```

## Debugging Services

The toolkit exposes the following services on the `window` object in development/test mode:
- `window.unifiedDebugService`: Logging, Data Flows, Performance, Health.
- `window.errorReporter`: Error aggregation, Contract validation, Sync issues.
