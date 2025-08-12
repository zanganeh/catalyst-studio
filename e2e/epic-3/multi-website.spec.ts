import { test, expect } from '@playwright/test';

test.describe('Multi-Website Support', () => {
  test.beforeEach(async ({ page }) => {
    // Enable feature flags
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({
        multi_website_support: true,
        dashboard_view: true,
        ai_website_creation: true
      }));
    });
  });
  
  test('Complete multi-website user flow', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Catalyst Studio/, { timeout: 10000 });
    
    // 2. Create website via AI prompt
    const promptInput = page.locator('textarea[placeholder*="Describe your website"]');
    await expect(promptInput).toBeVisible({ timeout: 5000 });
    await promptInput.fill('A portfolio website for a photographer');
    
    const createButton = page.locator('button:has-text("Create Website")');
    await expect(createButton).toBeEnabled({ timeout: 5000 });
    await createButton.click();
    
    // 3. Wait for navigation to studio with timeout
    await page.waitForURL(/\/studio\/[^\/]+\/ai/, { timeout: 15000 });
    
    // 4. Verify context loaded
    const aiPanel = page.locator('.ai-panel');
    await expect(aiPanel).toBeVisible({ timeout: 10000 });
    await expect(aiPanel).toContainText('portfolio website');
    
    // 5. Navigate back to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 6. Verify website appears in recent apps
    const recentApps = page.locator('.recent-apps-grid');
    await expect(recentApps).toBeVisible({ timeout: 5000 });
    await expect(recentApps).toContainText('portfolio');
    
    // 7. Click to open website
    const firstCard = page.locator('.website-card:first-child');
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    await firstCard.click();
    await page.waitForURL(/\/studio\/[^\/]+$/, { timeout: 10000 });
    
    // 8. Verify correct website loaded
    const header = page.locator('h1');
    await expect(header).toBeVisible({ timeout: 5000 });
    await expect(header).toContainText('portfolio');
  });
  
  test('Website isolation', async ({ page }) => {
    // Create two websites
    await page.goto('/dashboard');
    
    // Website 1
    await page.fill('textarea[placeholder*="Describe your website"]', 'E-commerce store');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    const url1 = page.url();
    
    // Website 2
    await page.goto('/dashboard');
    await page.fill('textarea[placeholder*="Describe your website"]', 'Blog platform');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    const url2 = page.url();
    
    // Verify different IDs
    expect(url1).not.toBe(url2);
    
    // Verify data isolation
    await page.goto(url1);
    await expect(page.locator('h1')).toContainText('E-commerce');
    
    await page.goto(url2);
    await expect(page.locator('h1')).toContainText('Blog');
  });
  
  test('Feature flag disabled experience', async ({ page }) => {
    // Disable feature flags
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({
        multi_website_support: false
      }));
    });
    
    await page.goto('/');
    
    // Should redirect to legacy studio
    await expect(page).toHaveURL('/studio');
    
    // No dashboard link visible
    await expect(page.locator('a[href="/dashboard"]')).toHaveCount(0);
  });
  
  test('Dashboard recent websites display', async ({ page }) => {
    // Setup multiple websites
    await page.addInitScript(() => {
      const websites = [
        { id: 'web1', name: 'Portfolio Site', lastModified: new Date().toISOString() },
        { id: 'web2', name: 'E-commerce Store', lastModified: new Date().toISOString() },
        { id: 'web3', name: 'Blog Platform', lastModified: new Date().toISOString() }
      ];
      localStorage.setItem('catalyst_websites', JSON.stringify(websites));
    });
    
    await page.goto('/dashboard');
    
    // Check all websites are displayed
    const websiteCards = page.locator('.website-card');
    await expect(websiteCards).toHaveCount(3);
    
    // Verify names are correct
    await expect(websiteCards.nth(0)).toContainText('Portfolio Site');
    await expect(websiteCards.nth(1)).toContainText('E-commerce Store');
    await expect(websiteCards.nth(2)).toContainText('Blog Platform');
  });
  
  test('AI website creation flow', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Fill in AI prompt
    const promptInput = page.locator('textarea[placeholder*="Describe your website"]');
    await promptInput.fill('Create a modern SaaS landing page with pricing tiers');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Should navigate to AI creation page
    await page.waitForURL(/\/studio\/[^\/]+\/ai/);
    
    // Verify AI context is loaded
    const aiContext = page.locator('.ai-context');
    await expect(aiContext).toContainText('SaaS landing page');
    await expect(aiContext).toContainText('pricing tiers');
  });
  
  test('Website switching preserves state', async ({ page }) => {
    // Create first website
    await page.goto('/dashboard');
    await page.fill('textarea[placeholder*="Describe"]', 'Website A');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    
    // Make some changes (simulate editing)
    await page.evaluate(() => {
      localStorage.setItem('current_website_state', JSON.stringify({
        content: 'Website A content',
        modified: true
      }));
    });
    
    // Switch to dashboard and create second website
    await page.goto('/dashboard');
    await page.fill('textarea[placeholder*="Describe"]', 'Website B');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    
    // Make changes to Website B
    await page.evaluate(() => {
      localStorage.setItem('current_website_state', JSON.stringify({
        content: 'Website B content',
        modified: true
      }));
    });
    
    // Go back to dashboard and switch to Website A
    await page.goto('/dashboard');
    await page.click('.website-card:has-text("Website A")');
    
    // Verify Website A state is preserved
    const stateA = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('current_website_state') || '{}');
    });
    expect(stateA.content).toBe('Website A content');
  });
  
  test('Storage quota warning', async ({ page }) => {
    // Simulate high storage usage
    await page.addInitScript(() => {
      // Mock storage quota
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: async () => ({
            usage: 4500000000, // 4.5 GB
            quota: 5000000000  // 5 GB
          })
        }
      });
    });
    
    await page.goto('/dashboard');
    
    // Should show storage warning
    const warning = page.locator('.storage-warning');
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('90%');
  });
  
  test('Migration from single website', async ({ page }) => {
    // Setup legacy single website data
    await page.addInitScript(() => {
      localStorage.setItem('catalyst_website', JSON.stringify({
        name: 'My Legacy Site',
        content: 'Legacy content',
        theme: 'dark'
      }));
    });
    
    await page.goto('/dashboard');
    
    // Should show migration prompt
    const migrationPrompt = page.locator('.migration-prompt');
    await expect(migrationPrompt).toBeVisible();
    
    // Click migrate
    await page.click('button:has-text("Migrate")');
    
    // Wait for migration to complete
    await page.waitForSelector('.migration-success');
    
    // Verify legacy site appears as default
    const defaultWebsite = page.locator('.website-card:has-text("My Legacy Site")');
    await expect(defaultWebsite).toBeVisible();
    
    // Open it and verify data
    await defaultWebsite.click();
    await page.waitForURL(/\/studio\//);
    
    // Check that legacy data is preserved
    const content = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('catalyst_website_default') || '{}');
    });
    expect(content.theme).toBe('dark');
  });
});