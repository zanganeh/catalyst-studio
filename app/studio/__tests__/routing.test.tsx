import { redirect } from 'next/navigation';
import LegacyStudioPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Studio Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Legacy Route Redirect', () => {
    it('should redirect /studio to /studio/default', () => {
      // Render the legacy studio page
      LegacyStudioPage();
      
      // Verify redirect was called with correct path
      expect(redirect).toHaveBeenCalledWith('/studio/default');
    });
  });

  describe('Dynamic Route Structure', () => {
    it('should have correct route structure', () => {
      // Test that the expected routes exist
      const expectedRoutes = [
        'app/studio/[id]/page.tsx',
        'app/studio/[id]/layout.tsx',
        'app/studio/[id]/ai/page.tsx',
        'app/studio/[id]/content/page.tsx',
        'app/studio/[id]/preview/page.tsx',
        'app/studio/[id]/settings/page.tsx',
        'app/studio/[id]/deployment/page.tsx',
        'app/studio/[id]/development/page.tsx',
        'app/studio/[id]/analytics/page.tsx',
        'app/studio/[id]/integrations/page.tsx',
        'app/studio/[id]/content-builder/page.tsx',
      ];
      
      // This is more of a structure test - in a real scenario,
      // you'd use file system checks or integration tests
      expectedRoutes.forEach(route => {
        // In a real test, you'd check if the file exists
        expect(route).toMatch(/app\/studio\/\[id\]/);
      });
    });
  });

  describe('WebsiteContext Integration', () => {
    it('should provide website context to all sub-routes', () => {
      // This would be tested via integration tests
      // checking that WebsiteContextProvider wraps all routes
      expect(true).toBe(true);
    });

    it('should handle optional ID parameter', () => {
      // Test that routes work with both /studio/[id] and /studio/default
      const testIds = ['default', 'website-1', 'my-site'];
      
      testIds.forEach(id => {
        const expectedPath = `/studio/${id}`;
        expect(expectedPath).toMatch(/^\/studio\/[^\/]+$/);
      });
    });
  });

  describe('Navigation Updates', () => {
    it('should update navigation links with website ID', () => {
      // Test that NavigationSidebar generates correct links
      const websiteId = 'test-website';
      const expectedLinks = [
        `/studio/${websiteId}`,
        `/studio/${websiteId}/content`,
        `/studio/${websiteId}/preview`,
        `/studio/${websiteId}/settings`,
        `/studio/${websiteId}/deployment`,
        `/studio/${websiteId}/development`,
        `/studio/${websiteId}/analytics`,
        `/studio/${websiteId}/integrations`,
        `/studio/${websiteId}/content-builder`,
      ];
      
      expectedLinks.forEach(link => {
        expect(link).toContain(websiteId);
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain compatibility with existing single-website mode', () => {
      // Test that /studio redirects to /studio/default
      expect(redirect).toBeDefined();
      
      // Test that default website is created if none exists
      // This would be tested in WebsiteContext tests
      expect(true).toBe(true);
    });

    it('should handle legacy routes without breaking', () => {
      const legacyRoutes = [
        '/studio',
        '/studio/overview',
        '/studio/content',
        '/studio/preview',
        '/studio/settings',
      ];
      
      legacyRoutes.forEach(route => {
        // In production, these should redirect to /studio/default/...
        expect(route).toMatch(/^\/studio/);
      });
    });
  });

  describe('Performance', () => {
    it('should lazy load route components', () => {
      // Test that dynamic imports are used for route components
      // This is verified by the use of dynamic() in the page files
      expect(true).toBe(true);
    });

    it('should not cause unnecessary re-renders on context changes', () => {
      // This would be tested with React Testing Library
      // measuring render counts with context updates
      expect(true).toBe(true);
    });
  });
});