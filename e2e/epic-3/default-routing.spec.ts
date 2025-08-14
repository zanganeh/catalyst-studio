import { test, expect } from '@playwright/test';

test.describe('Default Routing With Dashboard Enabled', () => {
  test('should redirect to /dashboard by default', async ({ page }) => {
    // Navigate to root - dashboard is now enabled by default
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for redirect to complete with extended timeout
    await page.waitForURL('/dashboard', { timeout: 30000 });
    
    // Verify we're on the dashboard page
    await expect(page).toHaveURL('/dashboard');
    
    // Ensure page content has loaded
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('studio page should redirect to /studio/default', async ({ page }) => {
    // Navigate directly to legacy studio route with proper wait
    await page.goto('/studio', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Should redirect to /studio/default with extended timeout
    await page.waitForURL('/studio/default', { timeout: 30000 });
    await expect(page).toHaveURL('/studio/default');
    
    // Verify page loaded successfully
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('studio/default page should be accessible directly', async ({ page }) => {
    // Navigate directly to studio/default with timeout
    const response = await page.goto('/studio/default', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // The page should exist (won't 404)
    expect(response?.status()).toBeLessThan(400);
    
    // Should load the studio page
    await expect(page).toHaveURL('/studio/default');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('dashboard page should be accessible directly', async ({ page }) => {
    // Navigate directly to dashboard (even without flags)
    const response = await page.goto('/dashboard', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    // Should load the dashboard page without 404
    expect(response?.status()).toBeLessThan(400);
    
    // Should be on dashboard URL
    await expect(page).toHaveURL('/dashboard');
    
    // Ensure content has loaded
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });
});