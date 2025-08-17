import { VersionTree } from '../VersionTree';
import { PrismaClient } from '../../../generated/prisma';

// Mock PrismaClient
jest.mock('../../../generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    contentTypeVersion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    }
  }))
}));

describe('VersionTree', () => {
  let versionTree: VersionTree;
  let mockPrisma: PrismaClient;

  beforeEach(() => {
    mockPrisma = new PrismaClient();
    versionTree = new VersionTree(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildTree', () => {
    it('should build tree from linear history', async () => {
      const mockVersions = [
        {
          versionHash: 'hash1',
          typeKey: 'contentType1',
          author: 'user1',
          createdAt: new Date('2024-01-01'),
          message: 'Initial version',
          parentHash: null,
          parentVersions: [],
          childVersions: []
        },
        {
          versionHash: 'hash2',
          typeKey: 'contentType1',
          author: 'user2',
          createdAt: new Date('2024-01-02'),
          message: 'Second version',
          parentHash: 'hash1',
          parentVersions: [],
          childVersions: []
        },
        {
          versionHash: 'hash3',
          typeKey: 'contentType1',
          author: 'user3',
          createdAt: new Date('2024-01-03'),
          message: 'Third version',
          parentHash: 'hash2',
          parentVersions: [],
          childVersions: []
        }
      ];

      mockPrisma.contentTypeVersion.findMany.mockResolvedValue(mockVersions);

      const tree = await versionTree.buildTree('contentType1');

      expect(tree).not.toBeNull();
      expect(tree?.hash).toBe('hash1');
      expect(tree?.children).toHaveLength(1);
      expect(tree?.children[0].hash).toBe('hash2');
      expect(tree?.children[0].children).toHaveLength(1);
      expect(tree?.children[0].children[0].hash).toBe('hash3');
    });

    it('should handle branching history', async () => {
      const mockVersions = [
        {
          versionHash: 'hash1',
          typeKey: 'contentType1',
          author: 'user1',
          createdAt: new Date('2024-01-01'),
          message: 'Root version',
          parentHash: null,
          parentVersions: [],
          childVersions: []
        },
        {
          versionHash: 'hash2a',
          typeKey: 'contentType1',
          author: 'user2',
          createdAt: new Date('2024-01-02'),
          message: 'Branch A',
          parentHash: 'hash1',
          parentVersions: [],
          childVersions: []
        },
        {
          versionHash: 'hash2b',
          typeKey: 'contentType1',
          author: 'user3',
          createdAt: new Date('2024-01-03'),
          message: 'Branch B',
          parentHash: 'hash1',
          parentVersions: [],
          childVersions: []
        }
      ];

      mockPrisma.contentTypeVersion.findMany.mockResolvedValue(mockVersions);

      const tree = await versionTree.buildTree('contentType1');

      expect(tree).not.toBeNull();
      expect(tree?.hash).toBe('hash1');
      expect(tree?.children).toHaveLength(2);
      
      const childHashes = tree?.children.map(c => c.hash);
      expect(childHashes).toContain('hash2a');
      expect(childHashes).toContain('hash2b');
    });

    it('should return null for empty history', async () => {
      mockPrisma.contentTypeVersion.findMany.mockResolvedValue([]);

      const tree = await versionTree.buildTree('contentType1');

      expect(tree).toBeNull();
    });
  });

  describe('findCommonAncestor', () => {
    it('should find common ancestor in simple case', async () => {
      const mockVersions = {
        'hash3a': {
          versionHash: 'hash3a',
          parentHash: 'hash2',
          parentVersions: []
        },
        'hash3b': {
          versionHash: 'hash3b',
          parentHash: 'hash2',
          parentVersions: []
        },
        'hash2': {
          versionHash: 'hash2',
          parentHash: 'hash1',
          parentVersions: []
        },
        'hash1': {
          versionHash: 'hash1',
          parentHash: null,
          parentVersions: []
        }
      };

      mockPrisma.contentTypeVersion.findUnique.mockImplementation(({ where }) => {
        return Promise.resolve(mockVersions[where.versionHash as keyof typeof mockVersions] || null);
      });

      const ancestor = await versionTree.findCommonAncestor('hash3a', 'hash3b');

      expect(ancestor).toBe('hash2');
    });

    it('should return null when no common ancestor exists', async () => {
      mockPrisma.contentTypeVersion.findUnique.mockResolvedValue(null);

      const ancestor = await versionTree.findCommonAncestor('hash1', 'hash2');

      expect(ancestor).toBeNull();
    });
  });

  describe('getLineage', () => {
    it('should return lineage from current to root', async () => {
      const mockVersions = {
        'hash3': {
          versionHash: 'hash3',
          parentHash: 'hash2',
          parentVersions: []
        },
        'hash2': {
          versionHash: 'hash2',
          parentHash: 'hash1',
          parentVersions: []
        },
        'hash1': {
          versionHash: 'hash1',
          parentHash: null,
          parentVersions: []
        }
      };

      mockPrisma.contentTypeVersion.findUnique.mockImplementation(({ where }) => {
        return Promise.resolve(mockVersions[where.versionHash as keyof typeof mockVersions] || null);
      });

      const lineage = await versionTree.getLineage('hash3');

      expect(lineage).toEqual(['hash3', 'hash2', 'hash1']);
    });

    it('should handle missing versions in lineage', async () => {
      mockPrisma.contentTypeVersion.findUnique.mockResolvedValue(null);

      const lineage = await versionTree.getLineage('nonexistent');

      expect(lineage).toEqual(['nonexistent']);
    });
  });

  describe('visualizeTree', () => {
    it('should visualize simple tree structure', () => {
      const tree = {
        hash: 'abcdef123456',
        typeKey: 'contentType1',
        author: 'user1',
        createdAt: new Date(),
        message: 'Initial version',
        parents: [],
        children: [
          {
            hash: 'fedcba654321',
            typeKey: 'contentType1',
            author: 'user2',
            createdAt: new Date(),
            message: 'Second version',
            parents: [],
            children: []
          }
        ]
      };

      const visualization = versionTree.visualizeTree(tree);

      expect(visualization).toContain('abcdef12');
      expect(visualization).toContain('user1');
      expect(visualization).toContain('Initial version');
      expect(visualization).toContain('fedcba65');
      expect(visualization).toContain('user2');
      expect(visualization).toContain('Second version');
    });

    it('should handle null tree', () => {
      const visualization = versionTree.visualizeTree(null);

      expect(visualization).toBe('No version history');
    });
  });
});