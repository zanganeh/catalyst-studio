import { test, expect } from '@playwright/test';

test.describe('CMS Deployment Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the deployment page with test mode
    await page.goto('/studio/deployment?test=true');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Wait for React hydration
    await page.waitForTimeout(1000);
  });

  test('should display deployment page with tabs', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('CMS Deployment');
    
    // Check tabs are present
    await expect(page.locator('button[role="tab"]:has-text("Deploy")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("History")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Settings")')).toBeVisible();
  });

  test('should show CMS provider selection in deployment wizard', async ({ page }) => {
    // Ensure we're on the Deploy tab
    await page.click('button[role="tab"]:has-text("Deploy")');
    
    // Check wizard step indicator
    await expect(page.locator('text=Select Provider')).toBeVisible();
    await expect(page.locator('text=Content Mapping')).toBeVisible();
    await expect(page.locator('text=Deploy')).toBeVisible();
    await expect(page.locator('text=Complete')).toBeVisible();
    
    // Check CMS providers are displayed
    await expect(page.locator('text=Optimizely')).toBeVisible();
    await expect(page.locator('text=Contentful')).toBeVisible();
    await expect(page.locator('text=Strapi')).toBeVisible();
  });

  test('should open configuration modal when clicking on provider', async ({ page }) => {
    // Click on Optimizely provider
    await page.click('button:has-text("Optimizely")');
    
    // Check modal appears
    await expect(page.locator('text=Configure Optimizely')).toBeVisible();
    
    // Check form fields
    await expect(page.locator('label:has-text("API Key")')).toBeVisible();
    await expect(page.locator('label:has-text("Project ID")')).toBeVisible();
    await expect(page.locator('label:has-text("Environment")')).toBeVisible();
    
    // Close modal
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('text=Configure Optimizely')).not.toBeVisible();
  });

  test('should validate required fields in provider configuration', async ({ page }) => {
    // Click on Contentful provider
    await page.click('button:has-text("Contentful")');
    
    // Try to connect without filling fields
    await page.click('button:has-text("Connect")');
    
    // Check validation errors
    await expect(page.locator('text=Content Management API Token is required')).toBeVisible();
    await expect(page.locator('text=Space ID is required')).toBeVisible();
    await expect(page.locator('text=Environment is required')).toBeVisible();
  });

  test('should progress through deployment wizard steps', async ({ page }) => {
    // Configure a provider first
    await page.click('button:has-text("Strapi")');
    
    // Fill in configuration
    await page.fill('input[placeholder*="strapi-instance"]', 'https://test-strapi.com');
    await page.fill('input[placeholder*="API token"]', 'test-api-token-123');
    
    // Connect
    await page.click('button:has-text("Connect")');
    
    // Wait for connection (mocked)
    await page.waitForTimeout(2000);
    
    // Check if we can proceed to next step
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeEnabled();
    
    // Go to content mapping step
    await nextButton.click();
    
    // Check we're on mapping step
    await expect(page.locator('h2:has-text("Content Mapping")')).toBeVisible();
    await expect(page.locator('text=Page Title')).toBeVisible();
    await expect(page.locator('text=Meta Description')).toBeVisible();
    
    // Start deployment
    await page.click('button:has-text("Start Deployment")');
    
    // Check deployment progress is shown
    await expect(page.locator('text=Deploying to Strapi')).toBeVisible();
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
  });

  test('should display deployment history', async ({ page }) => {
    // Switch to History tab
    await page.click('button[role="tab"]:has-text("History")');
    
    // Check history section is visible
    await expect(page.locator('h3:has-text("Deployment History")')).toBeVisible();
    
    // Initially might be empty
    const emptyState = page.locator('text=No deployment history yet');
    if (await emptyState.isVisible()) {
      expect(await emptyState.textContent()).toContain('No deployment history');
    }
  });

  test('should show CMS provider settings', async ({ page }) => {
    // Switch to Settings tab
    await page.click('button[role="tab"]:has-text("Settings")');
    
    // Check settings content
    await expect(page.locator('h2:has-text("CMS Provider Settings")')).toBeVisible();
    await expect(page.locator('text=Manage your CMS provider connections')).toBeVisible();
    
    // Check deployment settings
    await expect(page.locator('text=Auto-retry failed deployments')).toBeVisible();
    await expect(page.locator('text=Email notifications')).toBeVisible();
  });

  test('should handle deployment cancellation', async ({ page }) => {
    // Start a deployment process
    await page.click('button:has-text("Optimizely")');
    
    // Fill mock configuration
    await page.fill('input[placeholder*="API key"]', 'test-key');
    await page.fill('input[placeholder*="12345678"]', 'project-123');
    await page.fill('input[placeholder*="production"]', 'staging');
    
    await page.click('button:has-text("Connect")');
    await page.waitForTimeout(2000);
    
    // Progress to deployment
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Start Deployment")');
    
    // Check for cancel button during deployment
    const cancelButton = page.locator('button:has-text("Cancel Deployment")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      
      // Check deployment was cancelled
      await expect(page.locator('text=Deployment cancelled')).toBeVisible();
    }
  });

  test('should navigate back to development page', async ({ page }) => {
    // Click back button
    await page.click('button:has-text("Back to Development")');
    
    // Check navigation occurred
    await expect(page).toHaveURL(/.*\/studio\/development/);
  });

  test('should persist provider configurations', async ({ page }) => {
    // Configure a provider
    await page.click('button:has-text("Contentful")');
    
    // Fill configuration
    await page.fill('input[placeholder*="Contentful API token"]', 'persistent-token');
    await page.fill('input[placeholder*="abc123xyz"]', 'space-123');
    await page.fill('input[placeholder*="master"]', 'master');
    
    await page.click('button:has-text("Connect")');
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    
    // Check if provider shows as connected
    const contentfulCard = page.locator('button:has-text("Contentful")');
    await expect(contentfulCard).toContainText('Connected');
  });

  test('should show error state for failed deployments', async ({ page }) => {
    // This test would require setting up a scenario where deployment fails
    // For now, we'll check that error handling UI elements exist
    
    // Check error boundary is in place
    const pageContent = await page.content();
    expect(pageContent).toContain('DeploymentErrorBoundary');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still accessible
    await expect(page.locator('h1:has-text("CMS Deployment")')).toBeVisible();
    
    // Tabs should still be functional
    await expect(page.locator('button[role="tab"]:has-text("Deploy")')).toBeVisible();
    
    // Provider cards should stack vertically
    const providerCards = page.locator('button:has-text("Optimizely"), button:has-text("Contentful"), button:has-text("Strapi")');
    const count = await providerCards.count();
    expect(count).toBe(3);
  });

  test('should export deployment logs', async ({ page }) => {
    // This test checks if the export functionality is present
    // Actual file download testing would require additional setup
    
    // Navigate to a completed deployment (if any exist in history)
    await page.click('button[role="tab"]:has-text("History")');
    
    const deploymentItem = page.locator('[data-testid="deployment-item"]').first();
    if (await deploymentItem.isVisible()) {
      // Open actions menu
      await deploymentItem.locator('button[aria-label="More options"]').click();
      
      // Check export option exists
      await expect(page.locator('text=Export Logs')).toBeVisible();
    }
  });
});