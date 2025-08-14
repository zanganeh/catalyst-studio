/**
 * Test suite for /api/websites route handlers
 * Updated for Next.js 15 App Router compatibility:
 * - Proper NextRequest mocking
 * - Response.json() handling
 * - Console error suppression for expected errors
 * - Enhanced Prisma client mocking
 */
import { GET, POST } from '../route';
import { getClient } from '@/lib/db/client';
import { createTestRequest, suppressConsoleError, restoreConsoleError } from './test-helpers';

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  getClient: jest.fn()
}));

describe('/api/websites', () => {
  // Mock global Response for Next.js 15
  beforeAll(() => {
    global.Response = Response;
  });
  let mockPrisma: {
    website: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      website: {
        findMany: jest.fn(),
        create: jest.fn()
      }
    };
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
    suppressConsoleError();
  });

  afterEach(() => {
    jest.clearAllMocks();
    restoreConsoleError();
  });

  describe('GET /api/websites', () => {
    it('should return all active websites', async () => {
      const mockWebsites = [
        {
          id: '1',
          name: 'Test Website',
          description: 'Test description',
          category: 'test',
          metadata: JSON.stringify({ test: true }),
          settings: JSON.stringify({ primaryColor: '#000' }),
          icon: '🌐',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.website.findMany.mockResolvedValue(mockWebsites);

      const response = await GET();
      const data = await response.json();

      expect(mockPrisma.website.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      expect(data.data).toBeDefined();
      expect(data.data[0]).toMatchObject({
        id: '1',
        name: 'Test Website',
        metadata: { test: true },
        settings: { primaryColor: '#000' }
      });
    });

    it('should handle errors gracefully', async () => {
      mockPrisma.website.findMany.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty('error');
    });
  });

  describe('POST /api/websites', () => {
    it('should create a new website', async () => {
      const newWebsite = {
        name: 'New Website',
        description: 'New description',
        category: 'business',
        metadata: { theme: 'dark' },
        settings: { primaryColor: '#007bff' },
        icon: '🚀',
        isActive: true
      };

      const createdWebsite = {
        id: 'new-id',
        ...newWebsite,
        metadata: JSON.stringify(newWebsite.metadata),
        settings: JSON.stringify(newWebsite.settings),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.website.create.mockResolvedValue(createdWebsite);

      const request = createTestRequest(newWebsite);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toBeDefined();
      expect(data.data).toMatchObject({
        id: 'new-id',
        name: newWebsite.name,
        metadata: newWebsite.metadata,
        settings: newWebsite.settings
      });
    });

    it('should handle validation errors', async () => {
      const invalidWebsite = {
        // Missing required 'name' field
        category: 'business'
      };

      const request = createTestRequest(invalidWebsite);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle prisma errors gracefully', async () => {
      const newWebsite = {
        name: 'New Website',
        category: 'business'
      };

      mockPrisma.website.create.mockRejectedValue({ code: 'P2002', meta: { target: ['name'] } });

      const request = createTestRequest(newWebsite);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error.code).toBe('DUPLICATE_ENTRY');
    });

    it('should handle empty request body', async () => {
      const request = createTestRequest(undefined);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });
});