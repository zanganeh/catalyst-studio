import { createContentItem } from '../create-content-item';
import { getClient } from '@/lib/db/client';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { getContentType } from '@/lib/services/content-type-service';

jest.mock('@/lib/db/client');
jest.mock('@/lib/ai-tools/business-rules');
jest.mock('@/lib/services/content-type-service');

describe('create-content-item Tool', () => {
  const mockPrisma = {
    website: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockContentType = {
    id: 'type1',
    websiteId: 'website1',
    name: 'Article',
    fields: {
      fields: [
        {
          id: 'field1',
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          validation: {
            minLength: 3,
            maxLength: 100
          }
        },
        {
          id: 'field2',
          name: 'content',
          label: 'Content',
          type: 'richtext',
          required: true
        },
        {
          id: 'field3',
          name: 'tags',
          label: 'Tags',
          type: 'multiselect',
          required: false,
          options: [
            { label: 'Tech', value: 'tech' },
            { label: 'News', value: 'news' }
          ]
        }
      ]
    },
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
    (getContentType as jest.Mock).mockResolvedValue(mockContentType);
    (businessRules.validateForCategory as jest.Mock).mockResolvedValue({ valid: true });
  });

  it('should validate required fields', async () => {
    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        // Missing required 'title' and 'content' fields
      },
      status: 'draft'
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'title',
        message: expect.stringContaining('Required')
      })
    );
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'content',
        message: expect.stringContaining('Required')
      })
    );
  });

  it('should validate field types', async () => {
    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        title: 123, // Should be string
        content: 'Valid content',
        tags: 'not-an-array' // Should be array
      },
      status: 'draft'
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'title',
        message: expect.stringContaining('must be a string')
      })
    );
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'tags',
        message: expect.stringContaining('must be an array')
      })
    );
  });

  it('should validate field constraints', async () => {
    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        title: 'AB', // Too short (min 3)
        content: 'Valid content'
      },
      status: 'draft'
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'title',
        message: expect.stringContaining('at least 3 characters')
      })
    );
  });

  it('should create content item successfully', async () => {
    const mockWebsite = {
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
    };

    const mockCreatedItem = {
      id: 'item1',
      websiteId: 'website1',
      contentTypeId: 'type1',
      slug: 'test-article',
      status: 'draft',
      data: JSON.stringify({ title: 'Test Article', content: 'Test content' }),
      metadata: JSON.stringify({ author: 'John' }),
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      contentType: {
        id: 'type1',
        name: 'Article',
        fields: JSON.stringify(mockContentType.fields),
        settings: JSON.stringify({})
      },
      website: mockWebsite
    };

    mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          create: jest.fn().mockResolvedValue(mockCreatedItem)
        }
      };
      return callback(tx);
    });

    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      slug: 'test-article',
      data: {
        title: 'Test Article',
        content: 'Test content'
      },
      metadata: { author: 'John' },
      status: 'draft'
    });

    expect(result.success).toBe(true);
    expect(result.item.id).toBe('item1');
    expect(result.item.data).toEqual({ title: 'Test Article', content: 'Test content' });
    expect(result.item.metadata).toEqual({ author: 'John' });
  });

  it('should apply business rules validation', async () => {
    const mockWebsite = {
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
    };

    mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);
    (businessRules.validateForCategory as jest.Mock).mockResolvedValue({
      valid: false,
      errors: [
        { field: 'metaDescription', message: 'Meta description is required for SEO' }
      ]
    });

    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        title: 'Test Article',
        content: 'Test content'
      },
      status: 'draft'
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'metaDescription',
        message: expect.stringContaining('Meta description')
      })
    );
  });

  it('should wrap creation in transaction', async () => {
    const mockWebsite = {
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
    };

    mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);
    
    const mockTx = {
      contentItem: {
        create: jest.fn()
      }
    };
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      await callback(mockTx);
      return {
        id: 'item1',
        websiteId: 'website1',
        contentTypeId: 'type1',
        slug: null,
        status: 'draft',
        data: JSON.stringify({ title: 'Test' }),
        metadata: null,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        contentType: {
          id: 'type1',
          name: 'Article',
          fields: JSON.stringify(mockContentType.fields),
          settings: JSON.stringify({})
        },
        website: mockWebsite
      };
    });

    await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        title: 'Test',
        content: 'Content'
      },
      status: 'draft'
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockTx.contentItem.create).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (getContentType as jest.Mock).mockRejectedValue(new Error('Database error'));

    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: { title: 'Test' },
      status: 'draft'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should handle JSON field type correctly', async () => {
    const contentTypeWithJson = {
      ...mockContentType,
      fields: {
        fields: [
          {
            id: 'field1',
            name: 'settings',
            label: 'Settings',
            type: 'json',
            required: true
          }
        ]
      }
    };

    (getContentType as jest.Mock).mockResolvedValue(contentTypeWithJson);

    const mockWebsite = {
      id: 'website1',
      name: 'Test Site',
      category: null,
      description: null,
      metadata: null,
      icon: null,
      settings: null,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    mockPrisma.website.findUnique.mockResolvedValue(mockWebsite);
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          create: jest.fn().mockResolvedValue({
            id: 'item1',
            websiteId: 'website1',
            contentTypeId: 'type1',
            slug: null,
            status: 'draft',
            data: JSON.stringify({ settings: { key: 'value' } }),
            metadata: null,
            publishedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            contentType: {
              ...contentTypeWithJson,
              fields: JSON.stringify(contentTypeWithJson.fields),
              settings: JSON.stringify({})
            },
            website: mockWebsite
          })
        }
      };
      return callback(tx);
    });

    const result = await createContentItem.execute({
      websiteId: 'website1',
      contentTypeId: 'type1',
      data: {
        settings: { key: 'value' } // Valid JSON object
      },
      status: 'draft'
    });

    expect(result.success).toBe(true);
    expect(result.item.data.settings).toEqual({ key: 'value' });
  });
});