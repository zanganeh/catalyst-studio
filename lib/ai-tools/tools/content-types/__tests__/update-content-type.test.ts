import { updateContentType } from '../update-content-type';
import { contentTypeService } from '@/lib/services/content-type-service';
import { businessRules } from '@/lib/ai-tools/business-rules';
import { getClient } from '@/lib/db/client';

jest.mock('@/lib/services/content-type-service');
jest.mock('@/lib/ai-tools/business-rules');
jest.mock('@/lib/db/client');

describe('updateContentType', () => {
  const mockPrisma = {
    $transaction: jest.fn(),
    contentType: {
      update: jest.fn()
    },
    contentItem: {
      findFirst: jest.fn()
    }
  };

  const mockExistingContentType = {
    id: 'ct1',
    websiteId: 'web1',
    name: 'Blog Post',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'content', type: 'richtext', required: true }
    ],
    settings: { published: true },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getClient as jest.Mock).mockReturnValue(mockPrisma);
    (contentTypeService.getContentType as jest.Mock).mockResolvedValue(mockExistingContentType);
    (businessRules.validateForCategory as jest.Mock).mockReturnValue({ valid: true });
  });

  it('should update content type name', async () => {
    const mockUpdated = {
      ...mockExistingContentType,
      name: 'Article',
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: { update: jest.fn().mockResolvedValue(mockUpdated) }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      name: 'Article'
    });

    expect(result.success).toBe(true);
    expect(result.contentType.name).toBe('Article');
  });

  it('should replace all fields when fields array provided', async () => {
    const newFields = [
      { name: 'headline', type: 'text', required: true },
      { name: 'body', type: 'richtext', required: true }
    ];

    const mockUpdated = {
      ...mockExistingContentType,
      fields: JSON.stringify(newFields),
      updatedAt: new Date()
    };

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: { update: jest.fn().mockResolvedValue(mockUpdated) }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      fields: newFields
    });

    expect(result.success).toBe(true);
    expect(result.contentType.fields).toEqual(newFields);
    expect(result.fieldsModified.total).toBe(2);
  });

  it('should add new fields to existing ones', async () => {
    const newFields = [
      { name: 'author', type: 'text', required: false }
    ];

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            fields: JSON.stringify([...mockExistingContentType.fields, ...newFields]),
            updatedAt: new Date()
          })
        }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      addFields: newFields
    });

    expect(result.success).toBe(true);
    expect(result.contentType.fields).toHaveLength(3);
    expect(result.fieldsModified.added).toBe(1);
  });

  it('should remove specified fields', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            fields: JSON.stringify([mockExistingContentType.fields[0]]),
            updatedAt: new Date()
          })
        }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      removeFields: ['content']
    });

    expect(result.success).toBe(true);
    expect(result.contentType.fields).toHaveLength(1);
    expect(result.contentType.fields[0].name).toBe('title');
    expect(result.fieldsModified.removed).toBe(1);
  });

  it('should warn when removing fields with existing content', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue({ id: 'item1' }) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            fields: JSON.stringify([mockExistingContentType.fields[0]]),
            updatedAt: new Date()
          })
        }
      });
    });

    await updateContentType.execute({
      id: 'ct1',
      removeFields: ['content']
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Removing fields from content type with existing content items')
    );
    consoleSpy.mockRestore();
  });

  it('should add SEO fields for blog category', async () => {
    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            settings: JSON.stringify({ category: 'blog' }),
            updatedAt: new Date()
          })
        }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      category: 'blog'
    });

    expect(result.success).toBe(true);
    
    const fieldNames = result.contentType.fields.map((f: any) => f.name);
    expect(fieldNames).toContain('metaTitle');
    expect(fieldNames).toContain('metaDescription');
  });

  it('should handle content type not found', async () => {
    (contentTypeService.getContentType as jest.Mock).mockResolvedValue(null);

    const result = await updateContentType.execute({
      id: 'non-existent',
      name: 'New Name'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Content type with ID 'non-existent' not found");
  });

  it('should update existing field when adding field with same name', async () => {
    const updatedField = {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Updated Title Label'
    };

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            updatedAt: new Date()
          })
        }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      addFields: [updatedField]
    });

    expect(result.success).toBe(true);
    expect(result.contentType.fields).toHaveLength(2);
    
    const titleField = result.contentType.fields.find((f: any) => f.name === 'title');
    expect(titleField.label).toBe('Updated Title Label');
  });

  it('should handle transaction errors', async () => {
    const error = new Error('Transaction failed');
    mockPrisma.$transaction.mockRejectedValue(error);

    const result = await updateContentType.execute({
      id: 'ct1',
      name: 'Failed Update'
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Transaction failed');
  });

  it('should merge settings when updating', async () => {
    const newSettings = { seoEnabled: true };

    mockPrisma.$transaction.mockImplementation(async (fn) => {
      return fn({
        contentItem: { findFirst: jest.fn().mockResolvedValue(null) },
        contentType: {
          update: jest.fn().mockResolvedValue({
            ...mockExistingContentType,
            settings: JSON.stringify({ ...mockExistingContentType.settings, ...newSettings }),
            updatedAt: new Date()
          })
        }
      });
    });

    const result = await updateContentType.execute({
      id: 'ct1',
      settings: newSettings
    });

    expect(result.success).toBe(true);
    expect(result.contentType.settings.published).toBe(true);
    expect(result.contentType.settings.seoEnabled).toBe(true);
  });

  it('should warn if execution exceeds 2 seconds', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    (contentTypeService.getContentType as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockExistingContentType), 2100))
    );

    await updateContentType.execute({
      id: 'ct1',
      name: 'Slow Update'
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('exceeded 2s'));
    consoleSpy.mockRestore();
  });
});