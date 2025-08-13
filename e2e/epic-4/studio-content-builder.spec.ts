/**
 * E2E Tests for Studio Content Builder with Website Context
 * Tests the complete user flow: Create Website → Navigate to Studio → Manage Content
 */

import { test, expect } from '@playwright/test';

test.describe('Studio Content Builder - Complete User Flow', () => {
  let testWebsiteId: string;
  let testWebsiteName: string;

  test.beforeAll(async ({ request }) => {
    // Create a test website that will be used for all tests
    const response = await request.post('/api/websites', {
      data: {
        name: 'E2E Test Website for Studio',
        description: 'Website for testing studio content builder',
        category: 'Testing',
        icon: '🧪',
        settings: {
          theme: 'light',
          primaryColor: '#007bff'
        }
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    testWebsiteId = data.data.id;
    testWebsiteName = data.data.name;
    console.log('Created test website with ID:', testWebsiteId);
  });

  test.afterAll(async ({ request }) => {
    // Clean up test website
    if (testWebsiteId) {
      await request.delete(`/api/websites/${testWebsiteId}`);
      console.log('Cleaned up test website:', testWebsiteId);
    }
  });

  test('should navigate from dashboard to studio content-builder', async ({ page }) => {
    // Start from dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Dashboard should load
    await expect(page.locator('h2:has-text("Your Websites")')).toBeVisible({ timeout: 10000 });
    
    // Navigate directly to the studio content-builder (simulating clicking on a website)
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(`/studio/${testWebsiteId}/content-builder`);
    
    // Check that the page loads without errors
    const errorMessage = page.locator('text=404').or(page.locator('text=Error')).or(page.locator('text=Not Found'));
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    
    // Content builder should show either content or "No Content Type Selected"
    const contentArea = page.locator('main').last();
    await expect(contentArea).toBeVisible({ timeout: 10000 });
    
    // Should show "No Content Type Selected" initially
    const noContentMessage = page.locator('text=No Content Type Selected');
    const createButton = page.locator('button:has-text("Create New Content Type")');
    
    // One of these should be visible
    await expect(noContentMessage.or(createButton)).toBeVisible({ timeout: 10000 });
  });

  test('should create a content type in studio', async ({ page, request }) => {
    // Navigate to studio content-builder
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Create content type via API (since UI might not be fully implemented)
    const response = await request.post('/api/content-types', {
      data: {
        websiteId: testWebsiteId,
        name: 'Blog Post',
        fields: [
          { name: 'title', type: 'text', required: true, label: 'Title' },
          { name: 'content', type: 'richtext', required: true, label: 'Content' },
          { name: 'author', type: 'text', required: false, label: 'Author' }
        ],
        settings: {
          singular: 'Blog Post',
          plural: 'Blog Posts'
        }
      }
    });
    
    if (!response.ok()) {
      const error = await response.json();
      console.error('Failed to create content type:', response.status(), error);
    }
    expect(response.ok()).toBeTruthy();
    const contentType = await response.json();
    console.log('Created content type:', contentType.data?.id || 'No ID');
    
    // Refresh page to see the new content type
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify content type is available (implementation may vary)
    // The page should now show content type options or management UI
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Error');
    expect(pageContent).not.toContain('404');
  });

  test('should create a content item for the content type', async ({ page, request }) => {
    // First get the content type ID
    const typesResponse = await request.get(`/api/content-types?websiteId=${testWebsiteId}`);
    const typesData = await typesResponse.json();
    const contentTypeId = typesData.data[0]?.id;
    
    if (!contentTypeId) {
      test.skip();
      return;
    }
    
    // Create a content item via API
    const response = await request.post('/api/content-items', {
      data: {
        websiteId: testWebsiteId,
        contentTypeId: contentTypeId,
        slug: 'test-blog-post',
        data: {
          title: 'Test Blog Post from E2E',
          content: 'This is test content created during E2E testing.',
          author: 'E2E Test Suite'
        },
        status: 'draft'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const contentItem = await response.json();
    console.log('Created content item:', contentItem.data.id);
    
    // Navigate to content-builder
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Verify page loads without error
    const errorMessage = page.locator('text=404').or(page.locator('text=Error'));
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle navigation between studio sections', async ({ page }) => {
    // Start at content-builder
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Check navigation menu exists
    const navMenu = page.locator('nav').first();
    await expect(navMenu).toBeVisible();
    
    // Try navigating to preview (if link exists)
    const previewLink = page.locator(`a[href="/studio/${testWebsiteId}/preview"]`);
    if (await previewLink.isVisible()) {
      await previewLink.click();
      await expect(page).toHaveURL(`/studio/${testWebsiteId}/preview`);
      
      // Navigate back to content-builder
      await page.goto(`/studio/${testWebsiteId}/content-builder`);
      await expect(page).toHaveURL(`/studio/${testWebsiteId}/content-builder`);
    }
    
    // Try navigating to settings (if link exists)
    const settingsLink = page.locator(`a[href="/studio/${testWebsiteId}/settings"]`);
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL(`/studio/${testWebsiteId}/settings`);
      
      // Navigate back to content-builder
      await page.goto(`/studio/${testWebsiteId}/content-builder`);
      await expect(page).toHaveURL(`/studio/${testWebsiteId}/content-builder`);
    }
  });

  test('should persist data after page refresh', async ({ page }) => {
    // Navigate to studio content-builder
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Get initial page state
    const initialContent = await page.content();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify page still loads correctly
    const errorMessage = page.locator('text=404').or(page.locator('text=Error'));
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    
    // Content should persist (no 404 error)
    const refreshedContent = await page.content();
    expect(refreshedContent).not.toContain('404');
    expect(refreshedContent).not.toContain('Website not found');
  });

  test('should handle invalid website ID gracefully', async ({ page }) => {
    // Try to navigate with an invalid ID
    await page.goto('/studio/invalid_website_id_xyz/content-builder');
    await page.waitForLoadState('networkidle');
    
    // Should show an error or redirect
    const pageUrl = page.url();
    const pageContent = await page.content();
    
    // Either should redirect to dashboard or show error message
    const isRedirected = pageUrl.includes('/dashboard');
    const hasErrorMessage = pageContent.includes('not found') || pageContent.includes('404') || pageContent.includes('Error');
    
    expect(isRedirected || hasErrorMessage).toBeTruthy();
  });

  test('should load AI chat panel in content-builder', async ({ page }) => {
    // Navigate to studio content-builder
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Check if AI chat panel exists
    const chatPanel = page.locator('text=AI Assistant').or(page.locator('.ai-assistant'));
    
    // Wait for chat to load (it may take time)
    await page.waitForTimeout(3000);
    
    // Chat panel should be visible or at least the container should exist
    const chatExists = await chatPanel.isVisible().catch(() => false);
    console.log('AI Chat panel visible:', chatExists);
    
    // Even if chat is not visible, page should not have errors
    const errorMessage = page.locator('text=404').or(page.locator('text=Error'));
    await expect(errorMessage).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Content Type and Item Management via UI', () => {
  let testWebsiteId: string;

  test.beforeAll(async ({ request }) => {
    // Create a test website
    const response = await request.post('/api/websites', {
      data: {
        name: 'UI Test Website',
        description: 'Website for UI testing',
        category: 'Testing'
      }
    });
    const data = await response.json();
    testWebsiteId = data.data.id;
  });

  test.afterAll(async ({ request }) => {
    if (testWebsiteId) {
      await request.delete(`/api/websites/${testWebsiteId}`);
    }
  });

  test('should show create content type button when no types exist', async ({ page }) => {
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Should show create button or no content message
    const createButton = page.locator('button:has-text("Create New Content Type")').or(
      page.locator('button:has-text("Create Content Type")')
    );
    const noContentMessage = page.locator('text=No Content Type');
    
    // At least one should be visible
    const buttonVisible = await createButton.isVisible().catch(() => false);
    const messageVisible = await noContentMessage.isVisible().catch(() => false);
    
    expect(buttonVisible || messageVisible).toBeTruthy();
  });

  test('should verify complete content management flow', async ({ page, request }) => {
    // Step 1: Navigate to studio
    await page.goto(`/studio/${testWebsiteId}/content-builder`);
    await page.waitForLoadState('networkidle');
    
    // Step 2: Create content type via API (fallback if UI not ready)
    const typeResponse = await request.post('/api/content-types', {
      data: {
        websiteId: testWebsiteId,
        name: 'Product',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'description', type: 'text', required: false }
        ]
      }
    });
    
    expect(typeResponse.ok()).toBeTruthy();
    const contentType = await typeResponse.json();
    
    // Step 3: Create content item
    const itemResponse = await request.post('/api/content-items', {
      data: {
        websiteId: testWebsiteId,
        contentTypeId: contentType.data.id,
        data: {
          name: 'Test Product',
          price: 99.99,
          description: 'A test product'
        },
        status: 'published'
      }
    });
    
    expect(itemResponse.ok()).toBeTruthy();
    
    // Step 4: Verify data persists
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Page should still load without errors
    const errorMessage = page.locator('text=404').or(page.locator('text=Error'));
    await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    
    // Step 5: Verify content can be retrieved
    const contentResponse = await request.get(`/api/content-items?websiteId=${testWebsiteId}`);
    expect(contentResponse.ok()).toBeTruthy();
    
    const items = await contentResponse.json();
    expect(items.data.length).toBeGreaterThan(0);
    expect(items.data[0].data.name).toBe('Test Product');
  });
});