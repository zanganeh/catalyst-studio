/**
 * Integration tests for slug management system
 * Tests database-level slug operations and constraints
 */

import type { PrismaClient } from '@/lib/generated/prisma';
import { prisma } from '@/lib/prisma';
import {
  checkSlugUniqueness,
  ensureUniqueSlug,
  generateUniqueSlug,
  getExistingSlugs
} from '../slug-validator';
import { generateSlug } from '../slug-manager';

// Test database setup
const TEST_WEBSITE_ID = 'test-website-' + Date.now();
const TEST_PARENT_ID = 'test-parent-' + Date.now();

describe('Slug Integration Tests', () => {
  beforeAll(async () => {
    // Create test website
    await prisma.website.create({
      data: {
        id: TEST_WEBSITE_ID,
        name: 'Test Website for Slug Integration',
        subdomain: 'test-slug-' + Date.now(),
        category: 'test'
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.siteStructure.deleteMany({
      where: { websiteId: TEST_WEBSITE_ID }
    });
    
    await prisma.website.delete({
      where: { id: TEST_WEBSITE_ID }
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear site structures before each test
    await prisma.siteStructure.deleteMany({
      where: { websiteId: TEST_WEBSITE_ID }
    });
  });

  describe('Database Uniqueness Constraint', () => {
    it('should enforce unique slugs at same parent level', async () => {
      // Create first page
      await prisma.siteStructure.create({
        data: {
          id: 'page-1',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'about-us',
          title: 'About Us',
          type: 'page',
          fullPath: '/about-us',
          depth: 0,
          position: 0
        }
      });

      // Attempt to create duplicate slug
      await expect(
        prisma.siteStructure.create({
          data: {
            id: 'page-2',
            websiteId: TEST_WEBSITE_ID,
            parentId: null,
            slug: 'about-us',
            title: 'About Us Duplicate',
            type: 'page',
            fullPath: '/about-us',
            depth: 0,
            position: 1
          }
        })
      ).rejects.toThrow();
    });

    it('should allow same slug at different parent levels', async () => {
      // Create parent page
      const parent = await prisma.siteStructure.create({
        data: {
          id: 'parent-page',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'products',
          title: 'Products',
          type: 'page',
          fullPath: '/products',
          depth: 0,
          position: 0
        }
      });

      // Create child with "overview" slug
      await prisma.siteStructure.create({
        data: {
          id: 'child-1',
          websiteId: TEST_WEBSITE_ID,
          parentId: parent.id,
          slug: 'overview',
          title: 'Products Overview',
          type: 'page',
          fullPath: '/products/overview',
          depth: 1,
          position: 0
        }
      });

      // Create another parent
      const parent2 = await prisma.siteStructure.create({
        data: {
          id: 'parent-page-2',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'services',
          title: 'Services',
          type: 'page',
          fullPath: '/services',
          depth: 0,
          position: 1
        }
      });

      // Should allow same "overview" slug under different parent
      const child2 = await prisma.siteStructure.create({
        data: {
          id: 'child-2',
          websiteId: TEST_WEBSITE_ID,
          parentId: parent2.id,
          slug: 'overview',
          title: 'Services Overview',
          type: 'page',
          fullPath: '/services/overview',
          depth: 1,
          position: 0
        }
      });

      expect(child2.slug).toBe('overview');
    });

    it('should handle case-insensitive uniqueness', async () => {
      // Create page with lowercase slug
      await prisma.siteStructure.create({
        data: {
          id: 'page-lower',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'contact',
          title: 'Contact',
          type: 'page',
          fullPath: '/contact',
          depth: 0,
          position: 0
        }
      });

      // Check uniqueness with different cases
      const isUniqueUpper = await checkSlugUniqueness('CONTACT', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      const isUniqueMixed = await checkSlugUniqueness('Contact', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      expect(isUniqueUpper).toBe(false);
      expect(isUniqueMixed).toBe(false);
    });
  });

  describe('Concurrent Slug Creation', () => {
    it('should handle concurrent slug creation attempts', async () => {
      // Simulate concurrent requests for same slug
      const promises = Array(5).fill(null).map((_, i) => 
        ensureUniqueSlug('popular-page', {
          websiteId: TEST_WEBSITE_ID,
          parentId: null
        }).then(async (slug) => {
          // Actually create the page to reserve the slug
          return await prisma.siteStructure.create({
            data: {
              id: `concurrent-${i}-${Date.now()}`,
              websiteId: TEST_WEBSITE_ID,
              parentId: null,
              slug: slug,
              title: `Popular Page ${i}`,
              type: 'page',
              fullPath: `/${slug}`,
              depth: 0,
              position: i
            }
          });
        })
      );

      const results = await Promise.all(promises);
      const slugs = results.map(r => r.slug);

      // All slugs should be unique
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(5);

      // Should have base slug and numbered variants
      expect(slugs).toContain('popular-page');
      expect(slugs.some(s => s.match(/^popular-page-\d+$/))).toBe(true);
    });
  });

  describe('Parent-Child Slug Relationships', () => {
    it('should maintain slug uniqueness within parent context', async () => {
      // Create parent structure
      const parent = await prisma.siteStructure.create({
        data: {
          id: 'parent-structure',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'documentation',
          title: 'Documentation',
          type: 'page',
          fullPath: '/documentation',
          depth: 0,
          position: 0
        }
      });

      // Create children with unique slugs
      const child1 = await prisma.siteStructure.create({
        data: {
          id: 'child-guide-1',
          websiteId: TEST_WEBSITE_ID,
          parentId: parent.id,
          slug: 'getting-started',
          title: 'Getting Started',
          type: 'page',
          fullPath: '/documentation/getting-started',
          depth: 1,
          position: 0
        }
      });

      const child2 = await prisma.siteStructure.create({
        data: {
          id: 'child-guide-2',
          websiteId: TEST_WEBSITE_ID,
          parentId: parent.id,
          slug: 'api-reference',
          title: 'API Reference',
          type: 'page',
          fullPath: '/documentation/api-reference',
          depth: 1,
          position: 1
        }
      });

      // Verify slugs are stored correctly
      const existingSlugs = await getExistingSlugs(TEST_WEBSITE_ID, parent.id);
      expect(existingSlugs).toContain('getting-started');
      expect(existingSlugs).toContain('api-reference');

      // Try to create duplicate - should get suffix
      const duplicateSlug = await ensureUniqueSlug('getting-started', {
        websiteId: TEST_WEBSITE_ID,
        parentId: parent.id
      });

      expect(duplicateSlug).toBe('getting-started-1');
    });

    it('should handle deep nesting correctly', async () => {
      // Create nested structure
      const root = await prisma.siteStructure.create({
        data: {
          id: 'root-page',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'docs',
          title: 'Docs',
          type: 'page',
          fullPath: '/docs',
          depth: 0,
          position: 0
        }
      });

      const level1 = await prisma.siteStructure.create({
        data: {
          id: 'level-1',
          websiteId: TEST_WEBSITE_ID,
          parentId: root.id,
          slug: 'guides',
          title: 'Guides',
          type: 'page',
          fullPath: '/docs/guides',
          depth: 1,
          position: 0
        }
      });

      const level2 = await prisma.siteStructure.create({
        data: {
          id: 'level-2',
          websiteId: TEST_WEBSITE_ID,
          parentId: level1.id,
          slug: 'advanced',
          title: 'Advanced',
          type: 'page',
          fullPath: '/docs/guides/advanced',
          depth: 2,
          position: 0
        }
      });

      // Each level should maintain its own slug uniqueness
      const rootSlugs = await getExistingSlugs(TEST_WEBSITE_ID, null);
      const level1Slugs = await getExistingSlugs(TEST_WEBSITE_ID, root.id);
      const level2Slugs = await getExistingSlugs(TEST_WEBSITE_ID, level1.id);

      expect(rootSlugs).toContain('docs');
      expect(level1Slugs).toContain('guides');
      expect(level2Slugs).toContain('advanced');
    });
  });

  describe('Slug Conflict Resolution', () => {
    it('should generate unique slugs with numeric suffixes', async () => {
      // Create initial pages
      for (let i = 0; i < 3; i++) {
        const slug = i === 0 ? 'test-page' : `test-page-${i}`;
        await prisma.siteStructure.create({
          data: {
            id: `page-${i}`,
            websiteId: TEST_WEBSITE_ID,
            parentId: null,
            slug: slug,
            title: `Test Page ${i}`,
            type: 'page',
            fullPath: `/${slug}`,
            depth: 0,
            position: i
          }
        });
      }

      // Generate unique slug should find next available
      const uniqueSlug = await ensureUniqueSlug('test-page', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      expect(uniqueSlug).toBe('test-page-3');
    });

    it('should handle slug updates correctly', async () => {
      // Create a page
      const page = await prisma.siteStructure.create({
        data: {
          id: 'update-test-page',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'original-slug',
          title: 'Original Title',
          type: 'page',
          fullPath: '/original-slug',
          depth: 0,
          position: 0
        }
      });

      // Create another page
      await prisma.siteStructure.create({
        data: {
          id: 'another-page',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'another-slug',
          title: 'Another Page',
          type: 'page',
          fullPath: '/another-slug',
          depth: 0,
          position: 1
        }
      });

      // Check if we can update to same slug (excluding self)
      const canKeepSame = await checkSlugUniqueness('original-slug', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null,
        excludeId: page.id
      });

      expect(canKeepSame).toBe(true);

      // Check if we can update to existing slug
      const canUseExisting = await checkSlugUniqueness('another-slug', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null,
        excludeId: page.id
      });

      expect(canUseExisting).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of existing slugs efficiently', async () => {
      // Create many pages
      const createPromises = [];
      for (let i = 0; i < 50; i++) {
        createPromises.push(
          prisma.siteStructure.create({
            data: {
              id: `perf-page-${i}`,
              websiteId: TEST_WEBSITE_ID,
              parentId: null,
              slug: `page-${i}`,
              title: `Page ${i}`,
              type: 'page',
              fullPath: `/page-${i}`,
              depth: 0,
              position: i
            }
          })
        );
      }
      await Promise.all(createPromises);

      // Measure slug generation time
      const start = performance.now();
      const uniqueSlug = await generateUniqueSlug('New Page Title', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });
      const end = performance.now();

      expect(uniqueSlug).toBe('new-page-title');
      expect(end - start).toBeLessThan(100); // Should be fast even with many existing slugs
    });

    it('should validate slugs quickly', async () => {
      // Create some test data
      await prisma.siteStructure.create({
        data: {
          id: 'perf-test-page',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: 'performance-test',
          title: 'Performance Test',
          type: 'page',
          fullPath: '/performance-test',
          depth: 0,
          position: 0
        }
      });

      // Measure validation time
      const start = performance.now();
      
      const checks = [];
      for (let i = 0; i < 10; i++) {
        checks.push(
          checkSlugUniqueness(`test-slug-${i}`, {
            websiteId: TEST_WEBSITE_ID,
            parentId: null
          })
        );
      }
      
      await Promise.all(checks);
      const end = performance.now();
      
      const avgTime = (end - start) / 10;
      expect(avgTime).toBeLessThan(10); // Each validation should be < 10ms
    });
  });

  describe('Edge Cases', () => {
    it('should handle null parent correctly', async () => {
      const slug1 = await generateUniqueSlug('Root Page 1', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      await prisma.siteStructure.create({
        data: {
          id: 'root-1',
          websiteId: TEST_WEBSITE_ID,
          parentId: null,
          slug: slug1,
          title: 'Root Page 1',
          type: 'page',
          fullPath: `/${slug1}`,
          depth: 0,
          position: 0
        }
      });

      const slug2 = await generateUniqueSlug('Root Page 1', {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      expect(slug1).toBe('root-page-1');
      expect(slug2).toBe('root-page-1-1');
    });

    it('should handle very long titles', async () => {
      const longTitle = 'This is a very long title that should be truncated ' + 
                       'when converted to a slug because it exceeds the maximum ' +
                       'allowed length for database storage and URL handling ' +
                       'according to our system requirements and constraints ' +
                       'which specify a maximum of 255 characters per slug';

      const slug = await generateUniqueSlug(longTitle, {
        websiteId: TEST_WEBSITE_ID,
        parentId: null
      });

      expect(slug.length).toBeLessThanOrEqual(255);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle special characters in titles', async () => {
      const specialTitles = [
        'Café & Restaurant',
        '50% Off Sale!',
        'Contact@Email.com',
        'Q&A Section',
        'C++ Programming'
      ];

      for (const title of specialTitles) {
        const slug = await generateUniqueSlug(title, {
          websiteId: TEST_WEBSITE_ID,
          parentId: null
        });

        expect(slug).toMatch(/^[a-z0-9-]+$/);
        expect(slug.length).toBeGreaterThan(0);
      }
    });
  });
});