import { WebsiteService } from '../website-service';
import { getClient } from '@/lib/db/client';
import { ApiError } from '@/lib/api/errors';

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  getClient: jest.fn()
}));

describe('WebsiteService', () => {
  let mockPrisma: any;
  let websiteService: WebsiteService;

  beforeEach(() => {
    mockPrisma = {
      website: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    };
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
    
    // Create new instance for each test
    websiteService = new WebsiteService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWebsites', () => {
    it('should return all active websites', async () => {
      const mockWebsites = [
        {
          id: '1',
          name: 'Website 1',
          metadata: JSON.stringify({ key: 'value' }),
          settings: JSON.stringify({ primaryColor: '#000' }),
          isActive: true
        }
      ];

      mockPrisma.website.findMany.mockResolvedValue(mockWebsites);

      const result = await websiteService.getWebsites();

      expect(mockPrisma.website.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toEqual([
        {
          ...mockWebsites[0],
          metadata: { key: 'value' },
          settings: { primaryColor: '#000' }
        }
      ]);
    });
  });

  describe('getWebsite', () => {
    it('should return a single website', async () => {
      const mockWebsite = {
        id: 'test-id',
        name: 'Test Website',
        metadata: JSON.stringify({ test: true }),
        settings: JSON.stringify({ primaryColor: '#fff' })
      };

      mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);

      const result = await websiteService.getWebsite('test-id');

      expect(mockPrisma.website.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });

      expect(result).toEqual({
        ...mockWebsite,
        metadata: { test: true },
        settings: { primaryColor: '#fff' }
      });
    });

    it('should throw 404 error if website not found', async () => {
      mockPrisma.website.findUnique.mockResolvedValue(null);

      await expect(websiteService.getWebsite('non-existent')).rejects.toThrow(ApiError);
      await expect(websiteService.getWebsite('non-existent')).rejects.toThrow('Website not found');
    });
  });

  describe('createWebsite', () => {
    it('should create a new website', async () => {
      const newWebsiteData = {
        name: 'New Website',
        category: 'business',
        metadata: { theme: 'light' },
        settings: { primaryColor: '#007bff' }
      };

      const createdWebsite = {
        id: 'new-id',
        ...newWebsiteData,
        metadata: JSON.stringify(newWebsiteData.metadata),
        settings: JSON.stringify(newWebsiteData.settings)
      };

      mockPrisma.website.create.mockResolvedValue(createdWebsite);

      const result = await websiteService.createWebsite(newWebsiteData);

      expect(mockPrisma.website.create).toHaveBeenCalledWith({
        data: {
          ...newWebsiteData,
          metadata: JSON.stringify(newWebsiteData.metadata),
          settings: JSON.stringify(newWebsiteData.settings)
        }
      });

      expect(result).toEqual({
        ...createdWebsite,
        metadata: newWebsiteData.metadata,
        settings: newWebsiteData.settings
      });
    });
  });

  describe('updateWebsite', () => {
    it('should update an existing website', async () => {
      const updateData = {
        name: 'Updated Name',
        settings: { primaryColor: '#ff0000' }
      };

      mockPrisma.website.findUnique.mockResolvedValue({ id: 'test-id' });
      mockPrisma.website.update.mockResolvedValue({
        id: 'test-id',
        ...updateData,
        metadata: null,
        settings: JSON.stringify(updateData.settings)
      });

      const result = await websiteService.updateWebsite('test-id', updateData);

      expect(mockPrisma.website.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          name: 'Updated Name',
          settings: JSON.stringify(updateData.settings)
        }
      });

      expect(result.settings).toEqual(updateData.settings);
    });

    it('should throw 404 if website to update not found', async () => {
      mockPrisma.website.findUnique.mockResolvedValue(null);

      await expect(websiteService.updateWebsite('non-existent', {})).rejects.toThrow(ApiError);
    });
  });

  describe('deleteWebsite', () => {
    it('should soft delete a website', async () => {
      mockPrisma.website.update.mockResolvedValue({ id: 'test-id', isActive: false });

      await websiteService.deleteWebsite('test-id');

      expect(mockPrisma.website.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { isActive: false }
      });
    });

    it('should throw 404 if website to delete not found', async () => {
      mockPrisma.website.update.mockRejectedValue({ code: 'P2025' });

      await expect(websiteService.deleteWebsite('non-existent')).rejects.toThrow(ApiError);
    });
  });

  describe('getWebsiteSettings', () => {
    it('should return website settings', async () => {
      const mockWebsite = {
        id: 'test-id',
        settings: JSON.stringify({ primaryColor: '#000', features: { blog: true } })
      };

      mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);

      const result = await websiteService.getWebsiteSettings('test-id');

      expect(result).toEqual({
        primaryColor: '#000',
        features: { blog: true }
      });
    });

    it('should return null if website has no settings', async () => {
      mockPrisma.website.findUnique.mockResolvedValue({ id: 'test-id', settings: null });

      const result = await websiteService.getWebsiteSettings('test-id');

      expect(result).toBeNull();
    });
  });
});