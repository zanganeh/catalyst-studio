import { GET, PUT, DELETE } from '../[id]/route';
import { getClient } from '@/lib/db/client';
import { createTestRequest, parseTestResponse } from './setup';

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  getClient: jest.fn()
}));

describe('/api/websites/[id]', () => {
  let mockPrisma: any;
  const params = Promise.resolve({ id: 'test-id' });

  beforeEach(() => {
    mockPrisma = {
      website: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    };
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/websites/[id]', () => {
    it('should return a single website', async () => {
      const mockWebsite = {
        id: 'test-id',
        name: 'Test Website',
        description: 'Test description',
        category: 'test',
        metadata: JSON.stringify({ test: true }),
        settings: JSON.stringify({ primaryColor: '#000' }),
        icon: '🌐',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);

      const request = createTestRequest();
      const response = await GET(request as any, { params });
      const data = await response.json();

      expect(mockPrisma.website.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      });

      expect(data).toEqual({
        data: {
          ...mockWebsite,
          metadata: { test: true },
          settings: { primaryColor: '#000' }
        }
      });
    });

    it('should return 404 if website not found', async () => {
      mockPrisma.website.findUnique.mockResolvedValue(null);

      const request = createTestRequest();
      const response = await GET(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/websites/[id]', () => {
    it('should update a website', async () => {
      const updateData = {
        name: 'Updated Website',
        settings: { primaryColor: '#ff0000' }
      };

      const existingWebsite = {
        id: 'test-id',
        name: 'Old Name',
        isActive: true
      };

      const updatedWebsite = {
        ...existingWebsite,
        ...updateData,
        settings: JSON.stringify(updateData.settings),
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.website.findUnique.mockResolvedValue(existingWebsite);
      mockPrisma.website.update.mockResolvedValue(updatedWebsite);

      const request = createTestRequest(updateData);

      const response = await PUT(request as any, { params });
      const data = await response.json();

      expect(mockPrisma.website.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          name: 'Updated Website',
          settings: JSON.stringify(updateData.settings)
        })
      });

      expect(data).toEqual({
        data: {
          ...updatedWebsite,
          metadata: null,
          settings: updateData.settings
        }
      });
    });

    it('should return 404 if website to update not found', async () => {
      mockPrisma.website.findUnique.mockResolvedValue(null);

      const request = createTestRequest({ name: 'Updated' });

      const response = await PUT(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/websites/[id]', () => {
    it('should soft delete a website', async () => {
      const deletedWebsite = {
        id: 'test-id',
        isActive: false
      };

      mockPrisma.website.update.mockResolvedValue(deletedWebsite);

      const request = createTestRequest();

      const response = await DELETE(request as any, { params });
      const data = await response.json();

      expect(mockPrisma.website.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: { isActive: false }
      });

      expect(data).toEqual({
        data: { message: 'Website deleted successfully' }
      });
    });

    it('should return 404 if website to delete not found', async () => {
      mockPrisma.website.update.mockRejectedValue({ code: 'P2025' });

      const request = createTestRequest();

      const response = await DELETE(request as any, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });
});