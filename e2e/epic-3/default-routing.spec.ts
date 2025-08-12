import { test, expect } from '@playwright/test';

test.describe('Default Routing With Dashboard Enabled', () => {
  test('should redirect to /dashboard by default', async ({ page }) => {
    // Navigate to root - dashboard is now enabled by default
    await page.goto('/');
    
    // Wait for redirect to complete
    await page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify we're on the dashboard page
    await expect(page).toHaveURL('/dashboard');
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