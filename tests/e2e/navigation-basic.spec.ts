import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Tests', () => {
  test('should navigate to studio routes correctly', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000/studio/overview');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check URL is correct
    expect(page.url()).toContain('/studio/overview');
    
    // Check that content is visible
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Navigate to Content Items
    await page.goto('http://localhost:3000/studio/content');
    await page.waitForLoadState('networkidle');
    
    // Check URL changed
    expect(page.url()).toContain('/studio/content');
    
    // Check content loaded
    const contentHeading = page.locator('text=Content Items').first();
    await expect(contentHeading).toBeVisible();
  });

  test('should display navigation sidebar', async ({ page }) => {
    await page.goto('http://localhost:3000/studio/overview');
    await page.waitForLoadState('networkidle');
    
    // Check navigation sidebar exists
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    
    // Check key navigation items exist
    await expect(page.locator('text=Overview')).toBeVisible();
    await expect(page.locator('text=Content')).toBeVisible();
    await expect(page.locator('text=Preview')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should show chat panel', async ({ page }) => {
    await page.goto('http://localhost:3000/studio/overview');
    await page.waitForLoadState('networkidle');
    
    // Check for chat-related elements
    const chatArea = page.locator('textarea, input[type="text"]').first();
    await expect(chatArea).toBeVisible();
  });
});