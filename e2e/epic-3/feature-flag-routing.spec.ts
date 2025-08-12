import { test, expect } from '@playwright/test';

test.describe('Feature Flag Routing', () => {
  test('should redirect to /studio/default when feature flags are disabled', async ({ page }) => {
    // Clear any existing feature flags
    await page.goto('/');
    
    // The default behavior without flags should redirect to /studio/default
    await page.waitForURL('/studio/default', { timeout: 10000 });
    await expect(page).toHaveURL('/studio/default');
  });

  test('should redirect to /studio/default without env vars', async ({ page }) => {
    // This test verifies that the feature flag system defaults correctly
    // Without env vars set, it should go to /studio/default (legacy mode)
    
    // Navigate to root
    await page.goto('/');
    
    // Should redirect to studio/default
    await page.waitForURL('/studio/default', { timeout: 10000 });
    await expect(page).toHaveURL('/studio/default');
  });

  test('page.tsx routing logic executes', async ({ page }) => {
    // Navigate to check if the page loads and routing logic runs
    await page.goto('/');
    
    // Wait for any redirect to complete
    await page.waitForLoadState('networkidle');
    
    // Check that we're redirected (proves the code is running)
    const url = page.url();
    expect(url).toContain('studio/default');
  });
});