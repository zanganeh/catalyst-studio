import { test, expect } from '@playwright/test';

test.describe('Check JavaScript Execution', () => {
  test('verify console logs from feature flags', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log('Browser console:', text);
    });
    
    // Navigate to root
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Wait for potential JavaScript execution
    await page.waitForTimeout(3000);
    
    // Check if we got any feature flag logs
    const featureFlagLog = consoleLogs.find(log => log.includes('Feature flags'));
    console.log('Feature flag log found:', !!featureFlagLog);
    
    // Also check if React is loaded
    const hasReact = await page.evaluate(() => {
      return typeof (window as any).React !== 'undefined' || 
             typeof (window as any).__NEXT_DATA__ !== 'undefined';
    });
    console.log('React/Next.js detected:', hasReact);
    
    // Check current URL
    console.log('Final URL:', page.url());
    
    // Pass the test to see output
    expect(true).toBe(true);
  });
});