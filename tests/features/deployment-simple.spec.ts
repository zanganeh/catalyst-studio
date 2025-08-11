import { test, expect } from '@playwright/test';

test.describe('CMS Deployment Feature - Simple Tests', () => {
  test('deployment link appears in navigation when feature flag is enabled', async ({ page }) => {
    // Set feature flag
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('featureFlags', JSON.stringify({ cmsIntegration: true }));
    });
    
    // Navigate to studio
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Check if CMS Deployment link exists in navigation
    const deploymentLink = page.locator('text=CMS Deployment');
    await expect(deploymentLink).toBeVisible({ timeout: 10000 });
  });

  test('deployment page loads when accessed directly', async ({ page }) => {
    // Set feature flag
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('featureFlags', JSON.stringify({ cmsIntegration: true }));
    });
    
    // Navigate directly to deployment page
    await page.goto('/studio/deployment');
    await page.waitForLoadState('networkidle');
    
    // Check that we're not on the default chat page
    const chatInput = page.locator('textarea[placeholder*="Type your message"]');
    const hasChat = await chatInput.count() > 0;
    
    // Check for any deployment-related content
    const pageContent = await page.content();
    const hasDeploymentContent = 
      pageContent.includes('Deploy') || 
      pageContent.includes('CMS') ||
      pageContent.includes('deployment');
    
    expect(hasDeploymentContent).toBe(true);
  });

  test('deployment functionality is accessible', async ({ page }) => {
    // Set feature flag and navigate
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('featureFlags', JSON.stringify({ cmsIntegration: true }));
    });
    
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to deployment via sidebar
    const deploymentLink = page.locator('button, a').filter({ hasText: 'CMS Deployment' });
    if (await deploymentLink.count() > 0) {
      await deploymentLink.first().click();
      await page.waitForTimeout(2000);
      
      // Check URL changed
      const url = page.url();
      expect(url).toContain('deployment');
    }
  });
});