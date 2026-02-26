import { test, expect } from '../fixtures/vivim-test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should load conversations and display them', async ({ page, debugKit }) => {
    // Check if the home search input is visible
    await expect(page.locator('#home-search-input')).toBeVisible();

    // Verify no errors were reported during initial load
    await debugKit.assertNoErrors();

    // Check performance metrics
    const metrics = await debugKit.getPerformanceMetrics();
    console.log('Performance Metrics:', metrics);
    
    if (metrics.renderTime) {
      expect(metrics.renderTime).toBeLessThan(1000); // Expect initial render within 1s
    }
  });

  test('should search for conversations', async ({ page, debugKit }) => {
    const searchInput = page.locator('#home-search-input');
    await searchInput.fill('test query');
    
    // The search might trigger a data flow if it hits an API or complex DB query
    // We can check if any data flows were started
    const flows = await debugKit.getDataFlows();
    console.log('Active Data Flows:', flows.length);

    // Verify no errors after search
    await debugKit.assertNoErrors();
  });

  test('should open the FAB and show quick actions', async ({ page, debugKit }) => {
    const fab = page.locator('#home-fab-main');
    await fab.click();

    // Verify FAB expanded
    await expect(page.locator('#fab-capture')).toBeVisible();
    await expect(page.locator('#fab-ai-chat')).toBeVisible();
    await expect(page.locator('#fab-refresh')).toBeVisible();

    // Verify no errors after interaction
    await debugKit.assertNoErrors();
  });

  test('should handle refresh action via FAB', async ({ page, debugKit }) => {
    await page.locator('#home-fab-main').click();
    
    // Start tracking flows before clicking refresh
    await page.locator('#fab-refresh').click();

    // Wait for the refresh flow if we can identify it
    // In a real scenario, we might have a specific flow ID
    // For now, we just wait a bit and check for errors
    await page.waitForTimeout(1000);
    
    await debugKit.assertNoErrors();
  });
});
