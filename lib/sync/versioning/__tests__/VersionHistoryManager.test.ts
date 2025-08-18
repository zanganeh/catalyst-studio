import { VersionHistoryManager } from '../VersionHistoryManager';
import { PrismaClient } from '../../../generated/prisma';
import { ContentTypeHasher } from '../ContentTypeHasher';

// Mock Prisma Client
jest.mock('../../../generated/prisma', () => ({
  PrismaClient: jest.fn()
}));

// Mock console methods
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('VersionHistoryManager', () => {
  let manager: VersionHistoryManager;
  let mockPrisma: any;
  let mockContentTypeVersion: any;

  beforeEach(() => {
    // Reset mocks
    mockContentTypeVersion = {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    };

    mockPrisma = {
      contentTypeVersion: mockContentTypeVersion
    };

    manager = new VersionHistoryManager(mockPrisma);
  });

  describe('onDataChange', () => {
    it('should create a new version record for UI changes', async () => {
      const contentType = {
        id: 'test-id',
        key: 'blog',
        name: 'Blog Post',
        fields: [
          { name: 'title', type: 'text' },
          { name: 'content', type: 'richtext' }
        ]
      };

      mockContentTypeVersion.findFirst.mockResolvedValue(null);
      mockContentTypeVersion.create.mockResolvedValue({ id: 1 });

      await manager.onDataChange(contentType, 'UI', 'user123', 'Initial creation');

      expect(mockContentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentTypeId: 'test-id',
          typeKey: 'blog',
          version: 1,
          hash: expect.stringMatching(/^[a-f0-9]{64}$/),
          data: contentType,
          parentHash: null
        })
      });
    });

    it('should link to parent version when previous version exists', async () => {
      const contentType = {
        id: 'test-id',
        key: 'blog',
        name: 'Blog Post Updated',
        fields: []
      };

      const previousVersion = {
        id: 1,
        version: 1,
        hash: 'abc123def456',
        typeKey: 'blog'
      };

      mockContentTypeVersion.findFirst.mockResolvedValue(previousVersion);
      mockContentTypeVersion.create.mockResolvedValue({ id: 2 });

      await manager.onDataChange(contentType, 'AI', 'ai-agent', 'AI update');

      expect(mockContentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentTypeId: 'test-id',
          version: 2,
          parentHash: 'abc123def456'
        })
      });
    });

    it('should handle SYNC source correctly', async () => {
      const contentType = {
        id: 'test-id',
        key: 'product',
        name: 'Product'
      };

      mockContentTypeVersion.findFirst.mockResolvedValue(null);
      mockContentTypeVersion.create.mockResolvedValue({ id: 1 });

      await manager.onDataChange(contentType, 'SYNC');

      expect(mockContentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentTypeId: 'test-id',
          version: 1
        })
      });
    });

    it('should handle errors gracefully without throwing', async () => {
      const contentType = { id: 'test-id', key: 'test', name: 'Test' };
      
      mockContentTypeVersion.findFirst.mockRejectedValue(new Error('DB Error'));
      mockContentTypeVersion.create.mockRejectedValue(new Error('Create failed'));

      // Should not throw
      await expect(
        manager.onDataChange(contentType, 'UI')
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalled();
    });

    it('should use default values when optional parameters are not provided', async () => {
      const contentType = { id: 'test-id', name: 'NoKey' };

      mockContentTypeVersion.findFirst.mockResolvedValue(null);
      mockContentTypeVersion.create.mockResolvedValue({ id: 1 });

      await manager.onDataChange(contentType, 'UI');

      expect(mockContentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentTypeId: 'test-id',
          typeKey: 'NoKey',
          version: 1
        })
      });
    });

    it('should skip if contentTypeId is missing', async () => {
      const contentType = { key: 'test', name: 'Test' };

      await manager.onDataChange(contentType, 'UI');

      expect(mockContentTypeVersion.create).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('ContentType ID is required for version tracking');
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for a content type', async () => {
      const mockHistory = [
        { id: 3, hash: 'hash3', version: 3, createdAt: new Date() },
        { id: 2, hash: 'hash2', version: 2, createdAt: new Date() },
        { id: 1, hash: 'hash1', version: 1, createdAt: new Date() }
      ];

      mockContentTypeVersion.findMany.mockResolvedValue(mockHistory);

      const result = await manager.getVersionHistory('blog', { limit: 5 });

      expect(mockContentTypeVersion.findMany).toHaveBeenCalledWith({
        where: { typeKey: 'blog' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          contentType: true
        }
      });
      expect(result).toEqual(mockHistory);
    });

    it('should use default limit of 10', async () => {
      mockContentTypeVersion.findMany.mockResolvedValue([]);

      await manager.getVersionHistory('test');

      expect(mockContentTypeVersion.findMany).toHaveBeenCalledWith({
        where: { typeKey: 'test' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          contentType: true
        }
      });
    });

    it('should return empty array on error', async () => {
      mockContentTypeVersion.findMany.mockRejectedValue(new Error('DB Error'));

      const result = await manager.getVersionHistory('test');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getVersionByHash', () => {
    it('should return a specific version by hash', async () => {
      const mockVersion = {
        id: 1,
        hash: 'abc123',
        typeKey: 'blog',
        data: { key: 'blog' }
      };

      mockContentTypeVersion.findUnique.mockResolvedValue(mockVersion);

      const result = await manager.getVersionByHash('abc123');

      expect(mockContentTypeVersion.findUnique).toHaveBeenCalledWith({
        where: { hash: 'abc123' }
      });
      expect(result).toEqual(mockVersion);
    });

    it('should return null when version not found', async () => {
      mockContentTypeVersion.findUnique.mockResolvedValue(null);

      const result = await manager.getVersionByHash('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockContentTypeVersion.findUnique.mockRejectedValue(new Error('DB Error'));

      const result = await manager.getVersionByHash('test');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('hash consistency', () => {
    it('should generate same hash for same content', async () => {
      const contentType = {
        id: 'test-id',
        key: 'test',
        name: 'Test Type',
        fields: [{ name: 'field1', type: 'text' }]
      };

      mockContentTypeVersion.findFirst.mockResolvedValue(null);
      let capturedHash1: string = '';
      let capturedHash2: string = '';

      mockContentTypeVersion.create.mockImplementation((args: any) => {
        if (!capturedHash1) {
          capturedHash1 = args.data.hash;
        } else {
          capturedHash2 = args.data.hash;
        }
        return Promise.resolve({ id: 1 });
      });

      await manager.onDataChange(contentType, 'UI');
      await manager.onDataChange(contentType, 'UI');

      expect(capturedHash1).toBe(capturedHash2);
    });

    it('should generate different hashes for different content', async () => {
      const contentType1 = { id: 'test-id-1', key: 'test1', name: 'Test 1' };
      const contentType2 = { id: 'test-id-2', key: 'test2', name: 'Test 2' };

      mockContentTypeVersion.findFirst.mockResolvedValue(null);
      let capturedHash1: string = '';
      let capturedHash2: string = '';

      mockContentTypeVersion.create.mockImplementation((args: any) => {
        if (!capturedHash1) {
          capturedHash1 = args.data.hash;
        } else {
          capturedHash2 = args.data.hash;
        }
        return Promise.resolve({ id: 1 });
      });

      await manager.onDataChange(contentType1, 'UI');
      await manager.onDataChange(contentType2, 'UI');

      expect(capturedHash1).not.toBe(capturedHash2);
    });
  });
});