import { updateContentItem } from '../update-content-item';
import { getClient } from '@/lib/db/client';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { getContentType } from '@/lib/services/content-type-service';

jest.mock('@/lib/db/client');
jest.mock('@/lib/ai-tools/business-rules');
jest.mock('@/lib/services/content-type-service');

describe('update-content-item Tool', () => {
  const mockPrisma = {
    contentItem: {
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

  const mockExistingItem = {
    id: 'item1',
    websiteId: 'website1',
    contentTypeId: 'type1',
    slug: 'existing-article',
    status: 'draft',
    data: JSON.stringify({ title: 'Existing Title', content: 'Existing content' }),
    metadata: JSON.stringify({ author: 'John' }),
    publishedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    contentType: {
      id: 'type1',
      name: 'Article',
      fields: JSON.stringify(mockContentType.fields),
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
    (getContentType as jest.Mock).mockResolvedValue(mockContentType);
    (businessRules.validateForCategory as jest.Mock).mockResolvedValue({ valid: true });
    mockPrisma.contentItem.findUnique.mockResolvedValue(mockExistingItem);
  });

  it('should validate item exists', async () => {
    mockPrisma.contentItem.findUnique.mockResolvedValue(null);

    const result = await updateContentItem.execute({
      id: 'nonexistent',
      data: { title: 'New Title' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should validate field types on update', async () => {
    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        title: 123, // Should be string
        tags: 'not-an-array' // Should be array
      }
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

  it('should validate field constraints on update', async () => {
    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        title: 'AB' // Too short (min 3)
      }
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'title',
        message: expect.stringContaining('at least 3 characters')
      })
    );
  });

  it('should merge data correctly', async () => {
    const mockUpdatedItem = {
      ...mockExistingItem,
      data: JSON.stringify({ 
        title: 'Updated Title', 
        content: 'Existing content' // Preserved from existing
      }),
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          update: jest.fn().mockResolvedValue(mockUpdatedItem)
        }
      };
      return callback(tx);
    });

    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        title: 'Updated Title' // Only updating title, content should be preserved
      }
    });

    expect(result.success).toBe(true);
    expect(result.item.data.title).toBe('Updated Title');
    expect(result.item.data.content).toBe('Existing content');
  });

  it('should update metadata correctly', async () => {
    const mockUpdatedItem = {
      ...mockExistingItem,
      metadata: JSON.stringify({ 
        author: 'John', // Preserved
        editor: 'Jane' // Added
      }),
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          update: jest.fn().mockResolvedValue(mockUpdatedItem)
        }
      };
      return callback(tx);
    });

    const result = await updateContentItem.execute({
      id: 'item1',
      metadata: {
        editor: 'Jane' // Adding new metadata field
      }
    });

    expect(result.success).toBe(true);
    expect(result.item.metadata).toEqual({
      author: 'John',
      editor: 'Jane'
    });
  });

  it('should update status correctly', async () => {
    const mockUpdatedItem = {
      ...mockExistingItem,
      status: 'published',
      publishedAt: new Date('2024-02-01'),
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          update: jest.fn().mockResolvedValue(mockUpdatedItem)
        }
      };
      return callback(tx);
    });

    const result = await updateContentItem.execute({
      id: 'item1',
      status: 'published',
      publishedAt: '2024-02-01T00:00:00Z'
    });

    expect(result.success).toBe(true);
    expect(result.item.status).toBe('published');
    expect(result.item.publishedAt).toEqual(new Date('2024-02-01'));
  });

  it('should apply business rules validation for updated fields only', async () => {
    (businessRules.validateForCategory as jest.Mock).mockResolvedValue({
      valid: false,
      errors: [
        { field: 'metaDescription', message: 'Meta description is required' },
        { field: 'author', message: 'Author is required' }
      ]
    });

    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        metaDescription: '' // Only updating this field
      }
    });

    expect(result.success).toBe(false);
    // Should only include error for the field being updated
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0].field).toBe('metaDescription');
  });

  it('should wrap update in transaction', async () => {
    const mockTx = {
      contentItem: {
        update: jest.fn()
      }
    };
    
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      await callback(mockTx);
      return {
        ...mockExistingItem,
        data: JSON.stringify({ title: 'Updated', content: 'Existing content' }),
        updatedAt: new Date()
      };
    });

    await updateContentItem.execute({
      id: 'item1',
      data: { title: 'Updated' }
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockTx.contentItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item1' }
      })
    );
  });

  it('should handle slug updates', async () => {
    const mockUpdatedItem = {
      ...mockExistingItem,
      slug: 'new-slug',
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      const tx = {
        contentItem: {
          update: jest.fn().mockResolvedValue(mockUpdatedItem)
        }
      };
      return callback(tx);
    });

    const result = await updateContentItem.execute({
      id: 'item1',
      slug: 'new-slug'
    });

    expect(result.success).toBe(true);
    expect(result.item.slug).toBe('new-slug');
  });

  it('should handle errors gracefully', async () => {
    mockPrisma.contentItem.findUnique.mockRejectedValue(new Error('Database error'));

    const result = await updateContentItem.execute({
      id: 'item1',
      data: { title: 'New Title' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should not validate fields that are not being updated', async () => {
    // Content type requires 'content' field, but we're only updating 'title'
    // This should not fail validation for the missing 'content' in the update data
    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        title: 'Valid New Title' // Only updating title
        // Not providing 'content', but it exists in the original data
      }
    });

    // Should not have validation errors because 'content' exists in merged data
    expect(result.validationErrors).toBeUndefined();
  });

  it('should validate required fields in merged data', async () => {
    // Simulate existing item missing required field
    const itemWithMissingField = {
      ...mockExistingItem,
      data: JSON.stringify({ title: 'Title Only' }) // Missing required 'content'
    };
    
    mockPrisma.contentItem.findUnique.mockResolvedValue(itemWithMissingField);

    const result = await updateContentItem.execute({
      id: 'item1',
      data: {
        tags: ['tech'] // Updating unrelated field, but merged data still missing 'content'
      }
    });

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual(
      expect.objectContaining({
        field: 'content',
        message: expect.stringContaining('Required')
      })
    );
  });
});