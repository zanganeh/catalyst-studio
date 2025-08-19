// MockProvider Unit Tests

import { MockProvider } from '../mock/MockProvider';
import { UniversalContentType } from '../universal/types';

describe('MockProvider', () => {
  let provider: MockProvider;

  beforeEach(() => {
    provider = new MockProvider();
  });

  describe('Interface Implementation', () => {
    it('should implement all ICMSProvider methods', () => {
      expect(provider.getContentTypes).toBeDefined();
      expect(provider.getContentType).toBeDefined();
      expect(provider.createContentType).toBeDefined();
      expect(provider.updateContentType).toBeDefined();
      expect(provider.deleteContentType).toBeDefined();
      expect(provider.validateContentType).toBeDefined();
      expect(provider.getProviderCapabilities).toBeDefined();
      expect(provider.mapToUniversal).toBeDefined();
      expect(provider.mapFromUniversal).toBeDefined();
    });
  });

  describe('getContentTypes', () => {
    it('should return array of content types', async () => {
      const types = await provider.getContentTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should include blog-post type', async () => {
      const types = await provider.getContentTypes();
      const blogPost = types.find(t => t.id === 'blog-post');
      expect(blogPost).toBeDefined();
      expect(blogPost?.name).toBe('Blog Post');
      expect(blogPost?.type).toBe('page');
      expect(blogPost?.isRoutable).toBe(true);
    });

    it('should include hero-section component', async () => {
      const types = await provider.getContentTypes();
      const heroSection = types.find(t => t.id === 'hero-section');
      expect(heroSection).toBeDefined();
      expect(heroSection?.name).toBe('Hero Section');
      expect(heroSection?.type).toBe('component');
      expect(heroSection?.isRoutable).toBe(false);
    });

    it('should include fields with all three layers', async () => {
      const types = await provider.getContentTypes();
      const blogPost = types.find(t => t.id === 'blog-post');
      
      const primitiveField = blogPost?.fields.find(f => f.layer === 'primitive');
      const commonField = blogPost?.fields.find(f => f.layer === 'common');
      const extensionField = blogPost?.fields.find(f => f.layer === 'extension');
      
      expect(primitiveField).toBeDefined();
      expect(commonField).toBeDefined();
      expect(extensionField).toBeDefined();
    });
  });

  describe('getContentType', () => {
    it('should return specific content type by ID', async () => {
      const type = await provider.getContentType('blog-post');
      expect(type).toBeDefined();
      expect(type?.id).toBe('blog-post');
    });

    it('should return null for non-existent type', async () => {
      const type = await provider.getContentType('non-existent');
      expect(type).toBeNull();
    });
  });

  describe('createContentType', () => {
    it('should create new content type', async () => {
      const newType: UniversalContentType = {
        version: '1.0.0',
        id: 'test-type',
        name: 'Test Type',
        type: 'page',
        isRoutable: true,
        fields: [
          {
            id: 'field1',
            name: 'Field 1',
            layer: 'primitive',
            type: 'text'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const created = await provider.createContentType(newType);
      expect(created.id).toBe('test-type');
      
      const retrieved = await provider.getContentType('test-type');
      expect(retrieved).toBeDefined();
    });

    it('should fail validation for invalid type', async () => {
      const invalidType: any = {
        // Missing required fields
        name: 'Invalid'
      };

      await expect(provider.createContentType(invalidType))
        .rejects.toThrow('Validation failed');
    });

    it('should add metadata if not present', async () => {
      const typeWithoutMetadata: any = {
        version: '1.0.0',
        id: 'test-no-metadata',
        name: 'Test No Metadata',
        type: 'page',
        isRoutable: false,
        fields: [
          {
            id: 'field1',
            name: 'Field 1',
            layer: 'primitive',
            type: 'text'
          }
        ]
      };

      const created = await provider.createContentType(typeWithoutMetadata);
      expect(created.metadata).toBeDefined();
      expect(created.metadata.createdAt).toBeDefined();
    });
  });

  describe('updateContentType', () => {
    it('should update existing content type', async () => {
      const existingType = await provider.getContentType('blog-post');
      if (!existingType) throw new Error('Blog post not found');

      const updated = {
        ...existingType,
        name: 'Updated Blog Post'
      };

      const result = await provider.updateContentType('blog-post', updated);
      expect(result.name).toBe('Updated Blog Post');
      
      const retrieved = await provider.getContentType('blog-post');
      expect(retrieved?.name).toBe('Updated Blog Post');
    });

    it('should throw error for non-existent type', async () => {
      const type: UniversalContentType = {
        version: '1.0.0',
        id: 'non-existent',
        name: 'Non Existent',
        type: 'page',
        isRoutable: false,
        fields: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await expect(provider.updateContentType('non-existent', type))
        .rejects.toThrow("Content type 'non-existent' not found");
    });
  });

  describe('deleteContentType', () => {
    it('should delete existing content type', async () => {
      const deleted = await provider.deleteContentType('blog-post');
      expect(deleted).toBe(true);
      
      const retrieved = await provider.getContentType('blog-post');
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent type', async () => {
      const deleted = await provider.deleteContentType('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('validateContentType', () => {
    it('should validate valid content type', async () => {
      const validType: UniversalContentType = {
        version: '1.0.0',
        id: 'valid-type',
        name: 'Valid Type',
        type: 'page',
        isRoutable: true,
        fields: [
          {
            id: 'field1',
            name: 'Field 1',
            layer: 'primitive',
            type: 'text'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const result = await provider.validateContentType(validType);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid type', async () => {
      const invalidType: any = {
        // Missing required fields
        fields: []
      };

      const result = await provider.validateContentType(invalidType);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should return warnings for best practices', async () => {
      const typeWithoutDescription: UniversalContentType = {
        version: '1.0.0',
        id: 'no-description',
        name: 'No Description',
        type: 'page',
        // No description field
        isRoutable: false,
        fields: [
          {
            id: 'field1',
            name: 'Field 1',
            layer: 'primitive',
            type: 'text'
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const result = await provider.validateContentType(typeWithoutDescription);
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.field === 'description')).toBe(true);
    });
  });

  describe('getProviderCapabilities', () => {
    it('should return provider capabilities', () => {
      const capabilities = provider.getProviderCapabilities();
      
      expect(capabilities.supportsComponents).toBe(true);
      expect(capabilities.supportsPages).toBe(true);
      expect(capabilities.supportsRichText).toBe(true);
      expect(capabilities.supportsMedia).toBe(true);
      expect(capabilities.supportsReferences).toBe(true);
      expect(capabilities.supportsLocalizations).toBe(false);
      expect(capabilities.supportsVersioning).toBe(false);
      expect(capabilities.supportsScheduling).toBe(false);
      expect(capabilities.supportsWebhooks).toBe(false);
    });

    it('should include custom capabilities', () => {
      const capabilities = provider.getProviderCapabilities();
      expect(capabilities.customCapabilities).toBeDefined();
      expect(capabilities.customCapabilities?.supportsMockData).toBe(true);
    });
  });

  describe('Type Mapping', () => {
    it('should map to universal format', () => {
      const nativeType = { id: 'test', name: 'Test' };
      const universal = provider.mapToUniversal(nativeType);
      expect(universal).toBe(nativeType);
    });

    it('should map from universal format', () => {
      const universalType: UniversalContentType = {
        version: '1.0.0',
        id: 'test',
        name: 'Test',
        type: 'page',
        isRoutable: false,
        fields: [],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      const native = provider.mapFromUniversal(universalType);
      expect(native).toBe(universalType);
    });
  });

  describe('Provider Identification', () => {
    it('should return provider ID', () => {
      expect(provider.getProviderId()).toBe('mock');
    });
  });

  describe('Performance', () => {
    it('should complete getContentTypes within performance benchmark', async () => {
      const start = Date.now();
      await provider.getContentTypes();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be under 100ms for mock
    });

    it('should complete getContentType within performance benchmark', async () => {
      const start = Date.now();
      await provider.getContentType('blog-post');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(20); // Should be under 20ms for mock
    });

    it('should complete validateContentType within performance benchmark', async () => {
      const type = await provider.getContentType('blog-post');
      if (!type) throw new Error('Type not found');
      
      const start = Date.now();
      await provider.validateContentType(type);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30); // Should be under 30ms for mock
    });
  });
});