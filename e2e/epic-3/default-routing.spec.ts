import { test, expect } from '@playwright/test';

test.describe('Default Routing Without Feature Flags', () => {
  test('should redirect to /studio/default by default', async ({ page }) => {
    // Navigate to root without any feature flags
    await page.goto('/');
    
    // Wait for redirect to complete (either see loading or direct redirect)
    await page.waitForURL('/studio/default', { timeout: 10000 });
    
    // Verify we're on the studio page
    await expect(page).toHaveURL('/studio/default');
  });

  test('studio page should redirect to /studio/default', async ({ page }) => {
    // Navigate directly to legacy studio route
    await page.goto('/studio');
    
    // Should redirect to /studio/default
    await page.waitForURL('/studio/default', { timeout: 10000 });
    await expect(page).toHaveURL('/studio/default');
  });

  test('studio/default page should be accessible directly', async ({ page }) => {
    // Navigate directly to studio/default
    const response = await page.goto('/studio/default');
    
    // The page should exist (won't 404)
    expect(response?.status()).toBeLessThan(400);
    
    // Should load the studio page
    await expect(page).toHaveURL('/studio/default');
  });

  test('dashboard page should be accessible directly', async ({ page }) => {
    // Navigate directly to dashboard (even without flags)
    const response = await page.goto('/dashboard');
    
    // Should load the dashboard page without 404
    expect(response?.status()).toBeLessThan(400);
    
    // Should be on dashboard URL
    await expect(page).toHaveURL('/dashboard');
  });
});