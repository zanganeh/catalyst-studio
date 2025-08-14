import { getWebsiteContext } from '../get-website-context';
import { WebsiteService } from '@/lib/services/website-service';

// Mock WebsiteService
jest.mock('@/lib/services/website-service');

describe('getWebsiteContext tool', () => {
  let mockWebsiteService: jest.Mocked<WebsiteService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebsiteService = WebsiteService as any;
  });

  it('should retrieve website context successfully', async () => {
    const mockWebsite = {
      id: 'test-website-id',
      name: 'Test Website',
      category: 'blog',
      description: 'Test website description',
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
      metadata: JSON.stringify({
        contentTypes: ['article', 'news'],
        requiredFields: { article: ['title', 'content'] },
        validationRules: { minTitleLength: 10 },
        seoRequirements: { titleMaxLength: 60 },
        customRules: [],
      }),
      contentTypes: [{ id: '1' }, { id: '2' }],
      contentItems: [{ id: 'item1' }],
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(mockWebsite);

    const result = await getWebsiteContext.execute({ websiteId: 'test-website-id' });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.website.id).toBe('test-website-id');
    expect(result.data.website.name).toBe('Test Website');
    expect(result.data.businessRequirements.category).toBe('blog');
    expect(result.data.websiteMetadata.contentTypes).toEqual(['article', 'news']);
    expect(result.data.executionTime).toBeDefined();
  });

  it('should return error when website not found', async () => {
    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(null);

    const result = await getWebsiteContext.execute({ websiteId: 'non-existent-id' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Website with ID non-existent-id not found');
  });

  it('should handle service errors gracefully', async () => {
    mockWebsiteService.prototype.getWebsite = jest.fn().mockRejectedValue(new Error('Database error'));

    const result = await getWebsiteContext.execute({ websiteId: 'test-website-id' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
    expect(result.executionTime).toBeDefined();
  });

  it('should complete execution within 2 seconds', async () => {
    const mockWebsite = {
      id: 'test-website-id',
      name: 'Test Website',
      category: 'blog',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockWebsite), 100))
    );

    const startTime = Date.now();
    const result = await getWebsiteContext.execute({ websiteId: 'test-website-id' });
    const executionTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(2000);
  });

  it('should handle websites with minimal metadata', async () => {
    const minimalWebsite = {
      id: 'minimal-id',
      name: 'Minimal Website',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockWebsiteService.prototype.getWebsite = jest.fn().mockResolvedValue(minimalWebsite);

    const result = await getWebsiteContext.execute({ websiteId: 'minimal-id' });

    expect(result.success).toBe(true);
    expect(result.data.businessRequirements.category).toBe('general');
    expect(result.data.businessRequirements.contentTypes).toEqual([]);
    expect(result.data.websiteMetadata).toEqual({});
  });
});