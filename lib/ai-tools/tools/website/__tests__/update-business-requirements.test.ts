import { updateBusinessRequirements } from '../update-business-requirements';
import { WebsiteService } from '@/lib/services/website-service';
import { getClient } from '@/lib/db/client';

// Mock dependencies
jest.mock('@/lib/services/website-service');
jest.mock('@/lib/db/client');

describe('updateBusinessRequirements tool', () => {
  let mockWebsiteService: jest.Mocked<WebsiteService>;
  let mockPrisma: any;
  let mockTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWebsiteService = WebsiteService as any;
    mockTransaction = jest.fn();
    mockPrisma = {
      $transaction: mockTransaction,
    };
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('should update business requirements successfully', async () => {
    const existingWebsite = {
      id: 'test-website-id',
      name: 'Test Website',
      category: 'blog',
      metadata: JSON.stringify({ seoRequirements: { titleMaxLength: 60 } }),
    };

    const updatedWebsite = {
      ...existingWebsite,
      category: 'ecommerce',
      metadata: JSON.stringify({
        contentTypes: ['product', 'category'],
        seoRequirements: { titleMaxLength: 70, requireOgImage: true },
      }),
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(existingWebsite);
    mockWebsiteService.prototype.updateWebsite = jest.fn().mockResolvedValue(updatedWebsite);
    
    mockTransaction.mockImplementation(async (callback) => {
      return await callback({});
    });

    const result = await updateBusinessRequirements.execute({
      websiteId: 'test-website-id',
      category: 'ecommerce',
      contentTypes: ['product', 'category'],
      seoRequirements: { titleMaxLength: 70, requireOgImage: true },
    });

    expect(result.success).toBe(true);
    expect(result.data.websiteId).toBe('test-website-id');
    expect(result.data.updated.category).toBe('ecommerce');
    expect(result.data.updated.contentTypes).toEqual(['product', 'category']);
    expect(result.data.updated.seoRequirements.requireOgImage).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should return error when website not found', async () => {
    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(null);
    
    mockTransaction.mockImplementation(async (callback) => {
      try {
        return await callback({});
      } catch (error) {
        throw error;
      }
    });

    const result = await updateBusinessRequirements.execute({
      websiteId: 'non-existent-id',
      category: 'blog',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Website with ID non-existent-id not found');
  });

  it('should handle partial updates', async () => {
    const existingWebsite = {
      id: 'test-website-id',
      name: 'Test Website',
      category: 'blog',
      metadata: JSON.stringify({
        contentTypes: ['article'],
        seoRequirements: { titleMaxLength: 60 },
      }),
    };

    const updatedWebsite = {
      ...existingWebsite,
      category: 'portfolio',
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(existingWebsite);
    mockWebsiteService.prototype.updateWebsite = jest.fn().mockResolvedValue(updatedWebsite);
    
    mockTransaction.mockImplementation(async (callback) => {
      return await callback({});
    });

    const result = await updateBusinessRequirements.execute({
      websiteId: 'test-website-id',
      category: 'portfolio',
    });

    expect(result.success).toBe(true);
    expect(result.data.updated.category).toBe('portfolio');
    expect(mockWebsiteService.prototype.updateWebsite).toHaveBeenCalledWith(
      'test-website-id',
      expect.objectContaining({
        category: 'portfolio',
        metadata: expect.any(String),
        updatedAt: expect.any(Date),
      })
    );
  });

  it('should rollback transaction on error', async () => {
    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue({
      id: 'test-website-id',
    });
    mockWebsiteService.prototype.updateWebsite = jest.fn().mockRejectedValue(new Error('Update failed'));
    
    mockTransaction.mockImplementation(async (callback) => {
      try {
        return await callback({});
      } catch (error) {
        // Simulate rollback
        throw error;
      }
    });

    const result = await updateBusinessRequirements.execute({
      websiteId: 'test-website-id',
      category: 'blog',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should merge SEO requirements correctly', async () => {
    const existingWebsite = {
      id: 'test-website-id',
      metadata: JSON.stringify({
        seoRequirements: {
          titleMinLength: 10,
          titleMaxLength: 60,
          requireOgImage: false,
        },
      }),
    };

    const updatedWebsite = {
      ...existingWebsite,
      metadata: JSON.stringify({
        seoRequirements: {
          titleMinLength: 10,
          titleMaxLength: 70,
          requireOgImage: true,
          requireCanonicalUrl: true,
        },
      }),
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(existingWebsite);
    mockWebsiteService.prototype.updateWebsite = jest.fn().mockResolvedValue(updatedWebsite);
    
    mockTransaction.mockImplementation(async (callback) => {
      return await callback({});
    });

    const result = await updateBusinessRequirements.execute({
      websiteId: 'test-website-id',
      seoRequirements: {
        titleMaxLength: 70,
        requireOgImage: true,
        requireCanonicalUrl: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.data.updated.seoRequirements.titleMinLength).toBe(10);
    expect(result.data.updated.seoRequirements.titleMaxLength).toBe(70);
    expect(result.data.updated.seoRequirements.requireOgImage).toBe(true);
    expect(result.data.updated.seoRequirements.requireCanonicalUrl).toBe(true);
  });

  it('should complete execution within 2 seconds', async () => {
    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue({ id: 'test-id' });
    mockWebsiteService.prototype.updateWebsite = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ 
        id: 'test-id', 
        category: 'blog',
        metadata: JSON.stringify({ contentTypes: [] })
      }), 100))
    );
    
    mockTransaction.mockImplementation(async (callback) => {
      return await callback({});
    });

    const startTime = Date.now();
    const result = await updateBusinessRequirements.execute({
      websiteId: 'test-id',
      category: 'blog',
    });
    const executionTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(2000);
  });
});