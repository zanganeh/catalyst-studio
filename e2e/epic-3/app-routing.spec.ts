import { test, expect } from '@playwright/test';

test.describe('App Routing', () => {
  test('should redirect to /dashboard from root', async ({ page }) => {
    // Navigate to root
    await page.goto('/');
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('dashboard should be accessible directly', async ({ page }) => {
    // Navigate directly to dashboard
    await page.goto('/dashboard');
    
    // Should stay on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page).toHaveTitle(/Dashboard/);
  });

  test('routing logic executes correctly', async ({ page }) => {
    // Navigate to check if the page loads and routing logic runs
    await page.goto('/');
    
    // Wait for any redirect to complete
    await page.waitForLoadState('networkidle');
    
    // Check that we're redirected to dashboard
    const url = page.url();
    expect(url).toContain('dashboard');
  });
});