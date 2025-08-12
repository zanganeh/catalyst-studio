import { test, expect } from '@playwright/test';

test.describe('Feature Flag Environment Test', () => {
  test.skip('should navigate to dashboard when flags are enabled via window override', async ({ page }) => {
    // SKIPPED: Window overrides need to be set before Next.js initializes
    // This would require environment variables to be set at build/start time
    await page.addInitScript(() => {
      (window as any).NEXT_PUBLIC_MULTI_WEBSITE = 'true';
      (window as any).NEXT_PUBLIC_DASHBOARD = 'true';
    });

    await page.goto('/');
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show dashboard page exists when navigated directly', async ({ page }) => {
    // Navigate directly to dashboard
    const response = await page.goto('/dashboard');
    
    // Should load without 404
    expect(response?.status()).toBeLessThan(400);
    
    // Should be on dashboard URL
    await expect(page).toHaveURL('/dashboard');
    
    // Should have dashboard in title
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('feature flags default to enabled', async ({ page }) => {
    // Navigate without setting any overrides
    await page.goto('/');
    
    // Should go to dashboard (new default behavior)
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });
});