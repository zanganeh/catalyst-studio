import { listContentItems } from '../list-content-items';
import { getClient } from '@/lib/db/client';

jest.mock('@/lib/db/client');

describe('list-content-items Tool', () => {
  const mockPrisma = {
    contentItem: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
  });

  it('should validate parameters', async () => {
    const result = await listContentItems.execute({
      limit: 15,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
    
    expect(mockPrisma.contentItem.count).toHaveBeenCalled();
    expect(mockPrisma.contentItem.findMany).toHaveBeenCalled();
  });

  it('should list content items successfully', async () => {
    const mockContentItems = [
      {
        id: 'item1',
        websiteId: 'website1',
        contentTypeId: 'type1',
        slug: 'test-item',
        status: 'published',
        data: JSON.stringify({ title: 'Test Item' }),
        metadata: JSON.stringify({ author: 'John' }),
        publishedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        contentType: {
          id: 'type1',
          name: 'Article',
          fields: JSON.stringify({ fields: [] }),
          settings: JSON.stringify({})
        },
        website: {
          id: 'website1',
          name: 'Test Site',
          category: 'blog',
          description: null,
          metadata: null,
          icon: null,
          settings: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      }
    ];

    mockPrisma.contentItem.count.mockResolvedValue(1);
    mockPrisma.contentItem.findMany.mockResolvedValue(mockContentItems);

    const result = await listContentItems.execute({
      websiteId: 'website1',
      limit: 10,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('item1');
    expect(result.items[0].data).toEqual({ title: 'Test Item' });
    expect(result.pagination.total).toBe(1);
  });

  it('should filter by content type', async () => {
    mockPrisma.contentItem.count.mockResolvedValue(0);
    mockPrisma.contentItem.findMany.mockResolvedValue([]);

    await listContentItems.execute({
      contentTypeId: 'type1',
      limit: 10,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contentTypeId: 'type1' }
      })
    );
  });

  it('should filter by status', async () => {
    mockPrisma.contentItem.count.mockResolvedValue(0);
    mockPrisma.contentItem.findMany.mockResolvedValue([]);

    await listContentItems.execute({
      status: 'published',
      limit: 10,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'published' }
      })
    );
  });

  it('should handle pagination correctly', async () => {
    mockPrisma.contentItem.count.mockResolvedValue(50);
    mockPrisma.contentItem.findMany.mockResolvedValue([]);

    const result = await listContentItems.execute({
      limit: 20,
      page: 2,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20
      })
    );
    expect(result.pagination.hasNext).toBe(true);
    expect(result.pagination.hasPrev).toBe(true);
    expect(result.pagination.totalPages).toBe(3);
  });

  it('should enforce bulk limit of 20 items', async () => {
    mockPrisma.contentItem.count.mockResolvedValue(100);
    mockPrisma.contentItem.findMany.mockResolvedValue([]);

    const result = await listContentItems.execute({
      limit: 20, // Max allowed
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(mockPrisma.contentItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20
      })
    );
  });

  it('should handle errors gracefully', async () => {
    mockPrisma.contentItem.count.mockRejectedValue(new Error('Database error'));

    const result = await listContentItems.execute({
      limit: 10,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should warn when execution time exceeds 2s', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Simulate slow execution
    mockPrisma.contentItem.count.mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve(1), 2100));
    });
    mockPrisma.contentItem.findMany.mockResolvedValue([]);

    await listContentItems.execute({
      limit: 10,
      page: 1,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('exceeded 2s'));
    consoleSpy.mockRestore();
  });
});