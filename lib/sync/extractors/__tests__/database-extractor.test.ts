import { DatabaseExtractor, ExtractedContentType } from '../database-extractor';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    contentType: {
      findMany: jest.fn(),
      findFirst: jest.fn()
    },
    website: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    }
  }
}));

describe('DatabaseExtractor', () => {
  let extractor: DatabaseExtractor;

  beforeEach(() => {
    extractor = new DatabaseExtractor();
    jest.clearAllMocks();
  });

  describe('extractContentTypes', () => {
    it('should extract all content types with website information', async () => {
      const mockContentTypes = [
        {
          id: 'ct1',
          websiteId: 'web1',
          name: 'Blog Post',
          fields: JSON.stringify([
            { name: 'title', type: 'text', required: true }
          ]),
          settings: JSON.stringify({ published: true }),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          website: {
            id: 'web1',
            name: 'My Website',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        },
        {
          id: 'ct2',
          websiteId: 'web2',
          name: 'Product',
          fields: JSON.stringify([
            { name: 'name', type: 'text', required: true },
            { name: 'price', type: 'number', required: true }
          ]),
          settings: JSON.stringify({ published: false }),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          website: {
            id: 'web2',
            name: 'E-commerce Site',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        }
      ];

      (prisma.contentType.findMany as jest.Mock).mockResolvedValue(mockContentTypes);

      const result = await extractor.extractContentTypes();

      expect(prisma.contentType.findMany).toHaveBeenCalledWith({
        include: { website: true }
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'ct1',
        websiteId: 'web1',
        websiteName: 'My Website',
        name: 'Blog Post',
        fields: [{ name: 'title', type: 'text', required: true }],
        settings: { published: true }
      });
      expect(result[1]).toMatchObject({
        id: 'ct2',
        websiteId: 'web2',
        websiteName: 'E-commerce Site',
        name: 'Product',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'price', type: 'number', required: true }
        ],
        settings: { published: false }
      });
    });

    it('should handle content types without website', async () => {
      const mockContentTypes = [
        {
          id: 'ct1',
          websiteId: 'web1',
          name: 'Blog Post',
          fields: '[]',
          settings: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          website: null
        }
      ];

      (prisma.contentType.findMany as jest.Mock).mockResolvedValue(mockContentTypes);

      const result = await extractor.extractContentTypes();

      expect(result[0].websiteName).toBeNull();
      expect(result[0].settings).toEqual({});
    });

    it('should handle empty results', async () => {
      (prisma.contentType.findMany as jest.Mock).mockResolvedValue([]);

      const result = await extractor.extractContentTypes();

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      (prisma.contentType.findMany as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(extractor.extractContentTypes()).rejects.toThrow('Database connection failed');
    });
  });

  describe('extractContentTypesForWebsite', () => {
    it('should extract content types for a specific website', async () => {
      const mockContentTypes = [
        {
          id: 'ct1',
          websiteId: 'web1',
          name: 'Blog Post',
          fields: JSON.stringify([]),
          settings: JSON.stringify({}),
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          website: {
            id: 'web1',
            name: 'My Website',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
          }
        }
      ];

      (prisma.contentType.findMany as jest.Mock).mockResolvedValue(mockContentTypes);

      const result = await extractor.extractContentTypesForWebsite('web1');

      expect(prisma.contentType.findMany).toHaveBeenCalledWith({
        where: { websiteId: 'web1' },
        include: { website: true }
      });

      expect(result).toHaveLength(1);
      expect(result[0].websiteId).toBe('web1');
    });
  });

  describe('extractWebsites', () => {
    it('should extract all websites', async () => {
      const mockWebsites = [
        {
          id: 'web1',
          name: 'My Website',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          metadata: JSON.stringify({ theme: 'dark' })
        },
        {
          id: 'web2',
          name: 'E-commerce Site',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          metadata: null
        }
      ];

      (prisma.website.findMany as jest.Mock).mockResolvedValue(mockWebsites);

      const result = await extractor.extractWebsites();

      expect(prisma.website.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'web1',
        name: 'My Website'
      });
    });

    it('should handle empty websites', async () => {
      (prisma.website.findMany as jest.Mock).mockResolvedValue([]);

      const result = await extractor.extractWebsites();

      expect(result).toEqual([]);
    });
  });

});