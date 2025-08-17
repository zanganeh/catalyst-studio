import { createContentType, updateContentType } from '../../../services/content-type-service';
import { VersionHistoryManager } from '../VersionHistoryManager';
import prisma from '../../../db/prisma';

// Mock prisma
jest.mock('../../../db/prisma', () => ({
  __esModule: true,
  default: {
    contentType: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    contentTypeVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    contentItem: {
      count: jest.fn()
    }
  }
}));

// Mock console methods
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Hash System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI edits trigger hash calculation', () => {
    it('should calculate hash when creating content type from UI', async () => {
      const mockContentType = {
        id: 'ct_123',
        websiteId: 'web_123',
        name: 'Blog Post',
        fields: JSON.stringify({
          name: 'Blog Post',
          fields: [
            { name: 'title', type: 'text', required: true }
          ]
        }),
        settings: JSON.stringify({
          pluralName: 'Blog Posts',
          icon: '📝'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.contentType.create as jest.Mock).mockResolvedValue(mockContentType);
      (prisma.contentTypeVersion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.contentTypeVersion.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await createContentType({
        websiteId: 'web_123',
        name: 'Blog Post',
        pluralName: 'Blog Posts',
        icon: '📝',
        fields: [
          { 
            id: 'field_1',
            name: 'title', 
            label: 'Title',
            type: 'text', 
            required: true,
            order: 1
          }
        ]
      }, 'UI');

      // Verify content type was created
      expect(prisma.contentType.create).toHaveBeenCalled();

      // Verify version history was tracked
      expect(prisma.contentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          typeKey: 'ct_123',
          versionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          parentHash: null,
          changeSource: 'UI',
          author: 'system',
          message: 'Content type created'
        })
      });

      expect(result.name).toBe('Blog Post');
    });

    it('should calculate hash when updating content type from UI', async () => {
      const existingContentType = {
        id: 'ct_123',
        websiteId: 'web_123',
        name: 'Blog Post',
        fields: JSON.stringify({
          name: 'Blog Post',
          fields: [
            { name: 'title', type: 'text', required: true }
          ]
        }),
        settings: JSON.stringify({
          pluralName: 'Blog Posts',
          icon: '📝'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedContentType = {
        ...existingContentType,
        name: 'Article',
        fields: JSON.stringify({
          name: 'Article',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'author', type: 'text', required: false }
          ]
        })
      };

      (prisma.contentType.findUnique as jest.Mock).mockResolvedValue(existingContentType);
      (prisma.contentType.update as jest.Mock).mockResolvedValue(updatedContentType);
      (prisma.contentTypeVersion.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        versionHash: 'previous_hash_123'
      });
      (prisma.contentTypeVersion.create as jest.Mock).mockResolvedValue({ id: 2 });

      const result = await updateContentType('ct_123', {
        name: 'Article',
        fields: [
          { 
            id: 'field_1',
            name: 'title', 
            label: 'Title',
            type: 'text', 
            required: true,
            order: 1
          },
          { 
            id: 'field_2',
            name: 'author', 
            label: 'Author',
            type: 'text', 
            required: false,
            order: 2
          }
        ]
      }, 'UI');

      // Verify content type was updated
      expect(prisma.contentType.update).toHaveBeenCalled();

      // Verify version history was tracked with parent hash
      expect(prisma.contentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          typeKey: 'ct_123',
          versionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          parentHash: 'previous_hash_123',
          changeSource: 'UI',
          author: 'system',
          message: 'Content type updated'
        })
      });

      expect(result.name).toBe('Article');
    });
  });

  describe('AI tool modifications trigger hash calculation', () => {
    it('should calculate hash when AI creates content type', async () => {
      const mockContentType = {
        id: 'ct_ai_123',
        websiteId: 'web_123',
        name: 'Product',
        fields: JSON.stringify({
          name: 'Product',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'price', type: 'number', required: true }
          ]
        }),
        settings: JSON.stringify({
          pluralName: 'Products',
          icon: '🛍️'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.contentType.create as jest.Mock).mockResolvedValue(mockContentType);
      (prisma.contentTypeVersion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.contentTypeVersion.create as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await createContentType({
        websiteId: 'web_123',
        name: 'Product',
        pluralName: 'Products',
        icon: '🛍️',
        fields: [
          { 
            id: 'field_1',
            name: 'name', 
            label: 'Name',
            type: 'text', 
            required: true,
            order: 1
          },
          { 
            id: 'field_2',
            name: 'price', 
            label: 'Price',
            type: 'number', 
            required: true,
            order: 2
          }
        ]
      }, 'AI');

      // Verify version history was tracked with AI source
      expect(prisma.contentTypeVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changeSource: 'AI'
        })
      });
    });
  });

  describe('Version history is properly maintained', () => {
    it('should maintain parent-child relationships in version tree', async () => {
      const manager = new VersionHistoryManager(prisma);

      // Mock a chain of versions
      const versions = [
        { id: 1, versionHash: 'hash1', parentHash: null, createdAt: new Date('2024-01-01') },
        { id: 2, versionHash: 'hash2', parentHash: 'hash1', createdAt: new Date('2024-01-02') },
        { id: 3, versionHash: 'hash3', parentHash: 'hash2', createdAt: new Date('2024-01-03') }
      ];

      (prisma.contentTypeVersion.findMany as jest.Mock).mockResolvedValue(versions);

      const history = await manager.getVersionHistory('test_type');

      expect(history).toHaveLength(3);
      // The mock returns the array as-is, which is already ordered by createdAt desc
      expect(history[0].versionHash).toBe('hash1'); 
      expect(history[0].parentHash).toBeNull(); // Original version
      expect(history[1].versionHash).toBe('hash2');
      expect(history[1].parentHash).toBe('hash1');
      expect(history[2].versionHash).toBe('hash3');
      expect(history[2].parentHash).toBe('hash2'); // Most recent
    });

    it('should retrieve specific version by hash', async () => {
      const manager = new VersionHistoryManager(prisma);

      const mockVersion = {
        id: 2,
        versionHash: 'specific_hash',
        typeKey: 'test_type',
        contentSnapshot: JSON.stringify({ name: 'Test', version: 2 })
      };

      (prisma.contentTypeVersion.findUnique as jest.Mock).mockResolvedValue(mockVersion);

      const version = await manager.getVersionByHash('specific_hash');

      expect(version).toEqual(mockVersion);
      expect(prisma.contentTypeVersion.findUnique).toHaveBeenCalledWith({
        where: { versionHash: 'specific_hash' }
      });
    });
  });

  describe('Hash consistency across different change sources', () => {
    it('should generate same hash for same content regardless of source', async () => {
      const contentData = {
        websiteId: 'web_123',
        name: 'TestType',
        pluralName: 'TestTypes',
        icon: '🧪',
        fields: [
          { 
            id: 'field_1',
            name: 'testField', 
            label: 'Test Field',
            type: 'text' as const, 
            required: true,
            order: 1
          }
        ]
      };

      const mockContentType = {
        id: 'ct_test',
        websiteId: 'web_123',
        name: 'TestType',
        fields: JSON.stringify({
          name: 'TestType',
          fields: contentData.fields
        }),
        settings: JSON.stringify({
          pluralName: 'TestTypes',
          icon: '🧪'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.contentType.create as jest.Mock).mockResolvedValue(mockContentType);
      (prisma.contentTypeVersion.findFirst as jest.Mock).mockResolvedValue(null);

      let capturedHashes: string[] = [];
      (prisma.contentTypeVersion.create as jest.Mock).mockImplementation((args: any) => {
        capturedHashes.push(args.data.versionHash);
        return Promise.resolve({ id: capturedHashes.length });
      });

      // Create from UI
      await createContentType(contentData, 'UI');
      
      // Create from AI
      await createContentType(contentData, 'AI');
      
      // Create from SYNC
      await createContentType(contentData, 'SYNC');

      // All three should generate the same hash for the same content
      expect(capturedHashes).toHaveLength(3);
      expect(capturedHashes[0]).toBe(capturedHashes[1]);
      expect(capturedHashes[1]).toBe(capturedHashes[2]);
    });
  });
});