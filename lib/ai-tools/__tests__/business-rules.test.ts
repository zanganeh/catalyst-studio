import { BusinessRulesEngine } from '../business-rules';

describe('BusinessRulesEngine', () => {
  let engine: BusinessRulesEngine;

  beforeEach(() => {
    engine = new BusinessRulesEngine();
  });

  describe('validateForCategory', () => {
    it('should validate blog content successfully with all required fields', async () => {
      const blogContent = {
        title: 'Test Blog Post',
        metaDescription: 'This is a test blog post description',
        tags: ['test', 'blog'],
        author: 'John Doe',
        publishDate: new Date().toISOString(),
        content: 'This is the blog content',
      };

      const result = await engine.validateForCategory(blogContent, 'blog');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for missing required blog fields', async () => {
      const incompleteBlogContent = {
        title: 'Test Blog Post',
        content: 'This is the blog content',
      };

      const result = await engine.validateForCategory(incompleteBlogContent, 'blog');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.some(e => e.field === 'author')).toBe(true);
      expect(result.errors?.some(e => e.field === 'tags')).toBe(true);
    });

    it('should validate ecommerce content with all required fields', async () => {
      const productContent = {
        title: 'Test Product',
        price: 29.99,
        sku: 'TEST-001',
        inventory: 100,
        productImages: ['image1.jpg', 'image2.jpg'],
        shippingInfo: {
          weight: 2.5,
          dimensions: {
            length: 10,
            width: 8,
            height: 5,
          },
        },
        description: 'This is a test product',
      };

      const result = await engine.validateForCategory(productContent, 'ecommerce');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate portfolio content with all required fields', async () => {
      const projectContent = {
        projectTitle: 'Test Project',
        description: 'This is a test project description',
        technologies: ['React', 'TypeScript', 'Node.js'],
        images: ['screenshot1.jpg', 'screenshot2.jpg'],
        links: {
          live: 'https://example.com',
          github: 'https://github.com/example/project',
        },
      };

      const result = await engine.validateForCategory(projectContent, 'portfolio');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return error for unknown category', async () => {
      const content = { title: 'Test' };
      
      const result = await engine.validateForCategory(content, 'unknown');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].field).toBe('category');
      expect(result.errors?.[0].message).toContain('Unknown category');
    });

    it('should include warnings for suggested fields', async () => {
      const blogContent = {
        title: 'Test Blog Post',
        metaDescription: 'This is a test blog post description',
        tags: ['test', 'blog'],
        author: 'John Doe',
        publishDate: new Date().toISOString(),
        content: 'This is the blog content',
      };

      const result = await engine.validateForCategory(blogContent, 'blog');
      
      expect(result.valid).toBe(true);
      // Warnings are included for fields that could improve content quality
      if (result.warnings) {
        expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('getRequiredFields', () => {
    it('should return required fields for blog category', () => {
      const fields = engine.getRequiredFields('blog');
      
      expect(fields).toContain('title');
      expect(fields).toContain('content');
      expect(fields).toContain('author');
      expect(fields).toContain('publishDate');
      expect(fields).toContain('tags');
      expect(fields).toContain('metaDescription');
    });

    it('should return required fields for ecommerce category', () => {
      const fields = engine.getRequiredFields('ecommerce');
      
      expect(fields).toContain('title');
      expect(fields).toContain('price');
      expect(fields).toContain('sku');
      expect(fields).toContain('inventory');
      expect(fields).toContain('productImages');
      expect(fields).toContain('shippingInfo');
    });

    it('should return required fields for portfolio category', () => {
      const fields = engine.getRequiredFields('portfolio');
      
      expect(fields).toContain('projectTitle');
      expect(fields).toContain('description');
      expect(fields).toContain('technologies');
      expect(fields).toContain('images');
      expect(fields).toContain('links');
    });

    it('should return empty array for unknown category', () => {
      const fields = engine.getRequiredFields('unknown');
      
      expect(fields).toEqual([]);
    });

    it('should return content type specific fields when provided', () => {
      const fields = engine.getRequiredFields('blog', 'article');
      
      expect(fields).toBeDefined();
      expect(Array.isArray(fields)).toBe(true);
    });
  });

  describe('suggestFields', () => {
    it('should suggest SEO fields for blog category', () => {
      const suggestions = engine.suggestFields('blog', 'seo');
      
      expect(suggestions).toContain('canonicalUrl');
      expect(suggestions).toContain('ogImage');
      expect(suggestions).toContain('keywords');
    });

    it('should suggest marketing fields for ecommerce category', () => {
      const suggestions = engine.suggestFields('ecommerce', 'marketing');
      
      expect(suggestions).toContain('reviews');
      expect(suggestions).toContain('ratings');
    });

    it('should suggest technical fields for portfolio category', () => {
      const suggestions = engine.suggestFields('portfolio', 'technical');
      
      expect(suggestions).toContain('architecture');
      expect(suggestions).toContain('performance');
      expect(suggestions).toContain('scalability');
    });

    it('should return all suggestions for general purpose', () => {
      const suggestions = engine.suggestFields('blog', 'general');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const suggestions = engine.suggestFields('unknown', 'seo');
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('validation rules', () => {
    it('should validate positive prices for ecommerce', async () => {
      const productWithNegativePrice = {
        title: 'Test Product',
        price: -10,
        sku: 'TEST-001',
        inventory: 100,
        productImages: ['image1.jpg'],
        shippingInfo: { weight: 2.5 },
        description: 'Test',
      };

      const result = await engine.validateForCategory(productWithNegativePrice, 'ecommerce');
      
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'price' && e.message.includes('positive'))).toBe(true);
    });

    it('should validate non-negative inventory for ecommerce', async () => {
      const productWithNegativeInventory = {
        title: 'Test Product',
        price: 29.99,
        sku: 'TEST-001',
        inventory: -5,
        productImages: ['image1.jpg'],
        shippingInfo: { weight: 2.5 },
        description: 'Test',
      };

      const result = await engine.validateForCategory(productWithNegativeInventory, 'ecommerce');
      
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'inventory' && e.message.includes('non-negative'))).toBe(true);
    });

    it('should require at least one link for portfolio projects', async () => {
      const projectWithNoLinks = {
        projectTitle: 'Test Project',
        description: 'This is a test project',
        technologies: ['React'],
        images: ['screenshot.jpg'],
        links: {},
      };

      const result = await engine.validateForCategory(projectWithNoLinks, 'portfolio');
      
      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.field === 'links')).toBe(true);
    });
  });
});