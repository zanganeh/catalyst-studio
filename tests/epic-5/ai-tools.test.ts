/**
 * AI Tools Test Suite - Adapted from POC
 * Tests all 10 AI tools with actual database operations
 */

import { allTools } from '@/lib/ai-tools/tools';
import { prisma } from '@/lib/prisma';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Mock the AI SDK
jest.mock('ai');
jest.mock('@ai-sdk/openai');

describe('AI Tools - POC Scenarios Adapted', () => {
  let testWebsiteId: string;
  let testContentTypeId: string;
  let testContentItemId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.contentItem.deleteMany({
      where: { content: { contains: 'TEST_AI_TOOLS' } }
    });
    await prisma.contentType.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    });
    await prisma.website.deleteMany({
      where: { name: { startsWith: 'TEST_' } }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testContentItemId) {
      await prisma.contentItem.deleteMany({
        where: { contentTypeId: testContentTypeId }
      });
    }
    if (testContentTypeId) {
      await prisma.contentType.deleteMany({
        where: { id: testContentTypeId }
      });
    }
    if (testWebsiteId) {
      await prisma.website.deleteMany({
        where: { id: testWebsiteId }
      });
    }
  });

  describe('Test 1: Create website with requirements', () => {
    it('should create a website with business requirements', async () => {
      const createWebsiteTool = allTools.find(t => t.name === 'create-website');
      expect(createWebsiteTool).toBeDefined();

      const result = await createWebsiteTool!.execute({
        name: 'TEST_E-commerce Store',
        description: 'A test online store for selling products',
        businessRequirements: [
          'Product descriptions must be at least 100 characters',
          'All prices must include currency symbol',
          'Categories are required for all products'
        ]
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe('TEST_E-commerce Store');
      expect(result.data.businessRequirements).toHaveLength(3);
      
      testWebsiteId = result.data.id;
    });
  });

  describe('Test 2: Create content type with fields', () => {
    it('should create a content type with automatic field inference', async () => {
      const createContentTypeTool = allTools.find(t => t.name === 'create-content-type');
      expect(createContentTypeTool).toBeDefined();

      const result = await createContentTypeTool!.execute({
        websiteId: testWebsiteId,
        name: 'TEST_Product',
        description: 'Product content type for the store',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'description', type: 'text', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'category', type: 'text', required: true },
          { name: 'inStock', type: 'boolean', required: false },
          { name: 'images', type: 'array', required: false }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe('TEST_Product');
      expect(result.data.fields).toHaveLength(6);
      
      testContentTypeId = result.data.id;
    });
  });

  describe('Test 3: Create content items', () => {
    it('should create multiple content items with validation', async () => {
      const createContentItemTool = allTools.find(t => t.name === 'create-content-item');
      expect(createContentItemTool).toBeDefined();

      // Create first item
      const result1 = await createContentItemTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId,
        name: 'Gaming Laptop',
        content: {
          title: 'High-Performance Gaming Laptop',
          description: 'TEST_AI_TOOLS: Powerful gaming laptop with RTX 4080 graphics card, 32GB RAM, and 2TB SSD storage for the ultimate gaming experience',
          price: 2499.99,
          category: 'Electronics',
          inStock: true,
          images: ['laptop1.jpg', 'laptop2.jpg']
        }
      });

      expect(result1.success).toBe(true);
      expect(result1.data.name).toBe('Gaming Laptop');
      testContentItemId = result1.data.id;

      // Create second item
      const result2 = await createContentItemTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId,
        name: 'Wireless Mouse',
        content: {
          title: 'Ergonomic Wireless Mouse',
          description: 'TEST_AI_TOOLS: Comfortable wireless mouse with precision tracking, customizable buttons, and long battery life for productivity',
          price: 49.99,
          category: 'Accessories',
          inStock: true,
          images: ['mouse1.jpg']
        }
      });

      expect(result2.success).toBe(true);
      expect(result2.data.name).toBe('Wireless Mouse');
    });

    it('should validate content against business rules', async () => {
      const validateContentTool = allTools.find(t => t.name === 'validate-content');
      expect(validateContentTool).toBeDefined();

      // Test with valid content
      const validResult = await validateContentTool!.execute({
        websiteId: testWebsiteId,
        content: {
          title: 'Gaming Keyboard',
          description: 'Mechanical gaming keyboard with RGB lighting, programmable keys, and premium switches for competitive gaming',
          price: '$149.99',
          category: 'Accessories'
        }
      });

      expect(validResult.success).toBe(true);
      expect(validResult.data.isValid).toBe(true);

      // Test with invalid content (short description)
      const invalidResult = await validateContentTool!.execute({
        websiteId: testWebsiteId,
        content: {
          title: 'Mouse Pad',
          description: 'A nice mouse pad', // Too short
          price: '19.99', // Missing currency symbol
          category: '' // Empty category
        }
      });

      expect(invalidResult.success).toBe(true);
      expect(invalidResult.data.isValid).toBe(false);
      expect(invalidResult.data.violations).toHaveLength(3);
    });
  });

  describe('Test 4: Get and verify website context', () => {
    it('should retrieve complete website context', async () => {
      const getWebsiteContextTool = allTools.find(t => t.name === 'get-website-context');
      expect(getWebsiteContextTool).toBeDefined();

      const result = await getWebsiteContextTool!.execute({
        websiteId: testWebsiteId
      });

      expect(result.success).toBe(true);
      expect(result.data.website.id).toBe(testWebsiteId);
      expect(result.data.website.name).toBe('TEST_E-commerce Store');
      expect(result.data.contentTypes).toHaveLength(1);
      expect(result.data.contentTypes[0].name).toBe('TEST_Product');
      expect(result.data.recentContent).toBeInstanceOf(Array);
      expect(result.data.statistics.totalContentTypes).toBe(1);
      expect(result.data.statistics.totalContentItems).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Test 5: Create blog structure with multiple types', () => {
    it('should create a complete blog structure', async () => {
      // Create blog website
      const createWebsiteTool = allTools.find(t => t.name === 'create-website');
      const websiteResult = await createWebsiteTool!.execute({
        name: 'TEST_Tech Blog',
        description: 'Technology and programming blog',
        businessRequirements: [
          'Blog posts must have a publish date',
          'Author information is required',
          'Posts must be categorized'
        ]
      });

      expect(websiteResult.success).toBe(true);
      const blogWebsiteId = websiteResult.data.id;

      // Create BlogPost content type
      const createContentTypeTool = allTools.find(t => t.name === 'create-content-type');
      const blogPostResult = await createContentTypeTool!.execute({
        websiteId: blogWebsiteId,
        name: 'TEST_BlogPost',
        description: 'Blog post content type',
        fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'content', type: 'text', required: true },
          { name: 'author', type: 'text', required: true },
          { name: 'publishDate', type: 'date', required: true },
          { name: 'category', type: 'text', required: true },
          { name: 'tags', type: 'array', required: false }
        ]
      });

      expect(blogPostResult.success).toBe(true);

      // Create Author content type
      const authorResult = await createContentTypeTool!.execute({
        websiteId: blogWebsiteId,
        name: 'TEST_Author',
        description: 'Author profile content type',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'bio', type: 'text', required: true },
          { name: 'email', type: 'text', required: true },
          { name: 'avatar', type: 'text', required: false }
        ]
      });

      expect(authorResult.success).toBe(true);

      // Create Category content type
      const categoryResult = await createContentTypeTool!.execute({
        websiteId: blogWebsiteId,
        name: 'TEST_Category',
        description: 'Blog category content type',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'description', type: 'text', required: true },
          { name: 'slug', type: 'text', required: true }
        ]
      });

      expect(categoryResult.success).toBe(true);

      // Verify structure
      const listContentTypesTool = allTools.find(t => t.name === 'list-content-types');
      const listResult = await listContentTypesTool!.execute({
        websiteId: blogWebsiteId
      });

      expect(listResult.success).toBe(true);
      expect(listResult.data).toHaveLength(3);
      
      const typeNames = listResult.data.map((t: any) => t.name);
      expect(typeNames).toContain('TEST_BlogPost');
      expect(typeNames).toContain('TEST_Author');
      expect(typeNames).toContain('TEST_Category');

      // Cleanup
      await prisma.contentType.deleteMany({
        where: { websiteId: blogWebsiteId }
      });
      await prisma.website.delete({
        where: { id: blogWebsiteId }
      });
    });
  });

  describe('Test 6: Execute multi-step operations', () => {
    it('should handle complex multi-tool operations', async () => {
      // Step 1: List all content items
      const listContentItemsTool = allTools.find(t => t.name === 'list-content-items');
      const listResult = await listContentItemsTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId
      });

      expect(listResult.success).toBe(true);
      const initialCount = listResult.data.length;

      // Step 2: Get content type details
      const getContentTypeTool = allTools.find(t => t.name === 'get-content-type');
      const typeResult = await getContentTypeTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId
      });

      expect(typeResult.success).toBe(true);
      expect(typeResult.data.name).toBe('TEST_Product');

      // Step 3: Update content type with new field
      const updateContentTypeTool = allTools.find(t => t.name === 'update-content-type');
      const updateResult = await updateContentTypeTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId,
        fields: [
          ...typeResult.data.fields,
          { name: 'discount', type: 'number', required: false }
        ]
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data.fields).toHaveLength(7);

      // Step 4: Create bulk content items
      const createContentItemTool = allTools.find(t => t.name === 'create-content-item');
      const bulkPromises = [];
      
      for (let i = 1; i <= 3; i++) {
        bulkPromises.push(
          createContentItemTool!.execute({
            websiteId: testWebsiteId,
            contentTypeId: testContentTypeId,
            name: `TEST_Product_${i}`,
            content: {
              title: `Test Product ${i}`,
              description: `TEST_AI_TOOLS: This is a test product number ${i} with a detailed description that meets the minimum character requirement for testing`,
              price: 99.99 * i,
              category: 'Test Category',
              inStock: i % 2 === 1,
              images: [`product${i}.jpg`],
              discount: i * 10
            }
          })
        );
      }

      const bulkResults = await Promise.all(bulkPromises);
      bulkResults.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Step 5: Verify final count
      const finalListResult = await listContentItemsTool!.execute({
        websiteId: testWebsiteId,
        contentTypeId: testContentTypeId
      });

      expect(finalListResult.success).toBe(true);
      expect(finalListResult.data.length).toBe(initialCount + 3);

      // Step 6: Update business requirements
      const updateBusinessRequirementsTool = allTools.find(t => t.name === 'update-business-requirements');
      const requirementsResult = await updateBusinessRequirementsTool!.execute({
        websiteId: testWebsiteId,
        requirements: [
          'Product descriptions must be at least 100 characters',
          'All prices must include currency symbol',
          'Categories are required for all products',
          'Discount field is optional but must be a percentage'
        ]
      });

      expect(requirementsResult.success).toBe(true);
      expect(requirementsResult.data.businessRequirements).toHaveLength(4);
    });
  });
});