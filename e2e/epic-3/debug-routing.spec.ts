import { test, expect } from '@playwright/test';

test.describe('Debug Routing', () => {
  test('check what happens on root page', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log('Console:', msg.text()));
    page.on('pageerror', error => console.log('Page error:', error));
    
    // Navigate to root
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    console.log('Response status:', response?.status());
    
    // Wait a bit to see what happens
    await page.waitForTimeout(2000);
    
    // Get current URL
    const currentUrl = page.url();
    console.log('Current URL after navigation:', currentUrl);
    
    // Get page content
    const content = await page.content();
    console.log('Page content length:', content.length);
    
    // Check if there's any visible text
    const bodyText = await page.locator('body').innerText();
    console.log('Body text:', bodyText);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-root-page.png' });
    
    // The test will pass so we can see the console output
    expect(true).toBe(true);
  });
});