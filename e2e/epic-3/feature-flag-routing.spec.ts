import { test, expect } from '@playwright/test';

test.describe('Feature Flag Routing', () => {
  test('should redirect to /dashboard when feature flags are enabled by default', async ({ page }) => {
    // Navigate to root - feature flags now default to enabled
    await page.goto('/');
    
    // The default behavior now redirects to /dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect to /dashboard with default configuration', async ({ page }) => {
    // This test verifies that the feature flag system defaults correctly
    // With the new defaults, it should go to /dashboard
    
    // Navigate to root
    await page.goto('/');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('page.tsx routing logic executes', async ({ page }) => {
    // Navigate to check if the page loads and routing logic runs
    await page.goto('/');
    
    // Wait for any redirect to complete
    await page.waitForLoadState('networkidle');
    
    // Check that we're redirected to dashboard (proves the code is running)
    const url = page.url();
    expect(url).toContain('dashboard');
  });
});