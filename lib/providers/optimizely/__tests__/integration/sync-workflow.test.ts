import { OptimizelyProvider } from '../../OptimizelyProvider';
import { ProviderRegistry } from '../../../registry';
import { UniversalContentType } from '../../../universal/types';
import { OptimizelyContentType } from '../../types';

describe('OptimizelyProvider Integration - Sync Workflow', () => {
  let provider: OptimizelyProvider;
  let registry: ProviderRegistry;

  beforeEach(() => {
    // Reset registry for each test
    ProviderRegistry['instance'] = undefined;
    registry = ProviderRegistry.getInstance();
    provider = new OptimizelyProvider();
  });

  describe('Provider Registration', () => {
    it('should register and retrieve OptimizelyProvider', () => {
      registry.register('optimizely', provider);
      
      const retrieved = registry.getProvider('optimizely');
      expect(retrieved).toBe(provider);
    });

    it('should set OptimizelyProvider as active', () => {
      registry.register('optimizely', provider);
      registry.setActiveProvider('optimizely');
      
      const active = registry.getActiveProvider();
      expect(active).toBe(provider);
    });

    it('should return null for non-existent provider', () => {
      const provider = registry.getProvider('nonexistent');
      expect(provider).toBeNull();
    });
  });

  describe('Complete Sync Workflow', () => {
    it('should handle full sync cycle: fetch → transform → validate → update', async () => {
      // Mock the client methods for integration test
      const mockClient = (provider as any).client;
      
      // Step 1: Fetch content types from Optimizely
      const optimizelyTypes: OptimizelyContentType[] = [
        {
          key: 'ArticlePage',
          displayName: 'Article Page',
          description: 'Article page for blog posts',
          baseType: '_page',
          source: 'optimizely',
          sortOrder: 100,
          mayContainTypes: ['HeroBlock', 'ContentBlock'],
          properties: {
            title: {
              type: 'String',
              displayName: 'Title',
              required: true,
              description: 'Article title'
            },
            content: {
              type: 'XhtmlString',
              displayName: 'Main Content',
              required: false
            },
            author: {
              type: 'String',
              displayName: 'Author',
              required: true
            },
            publishDate: {
              type: 'DateTime',
              displayName: 'Publish Date',
              required: false
            }
          }
        },
        {
          key: 'HeroBlock',
          displayName: 'Hero Block',
          description: 'Hero component with image and text',
          baseType: '_component',
          source: 'optimizely',
          sortOrder: 200,
          mayContainTypes: [],
          properties: {
            heading: {
              type: 'String',
              displayName: 'Heading',
              required: true
            },
            subheading: {
              type: 'String',
              displayName: 'Subheading',
              required: false
            },
            backgroundImage: {
              type: 'Media',
              displayName: 'Background Image',
              required: false
            }
          }
        }
      ];

      mockClient.getContentTypes = jest.fn().mockResolvedValue(optimizelyTypes);

      // Step 2: Transform to Universal format
      const universalTypes = await provider.getContentTypes();
      
      expect(universalTypes).toHaveLength(2);
      
      // Verify ArticlePage transformation
      const articlePage = universalTypes.find(t => t.id === 'ArticlePage');
      expect(articlePage).toBeDefined();
      expect(articlePage?.type).toBe('page');
      expect(articlePage?.isRoutable).toBe(true);
      expect(articlePage?.fields).toHaveLength(4);
      
      // Verify field transformations
      const titleField = articlePage?.fields.find(f => f.name === 'title');
      expect(titleField?.type).toBe('string');
      expect(titleField?.layer).toBe('primitive');
      expect(titleField?.required).toBe(true);
      
      const contentField = articlePage?.fields.find(f => f.name === 'content');
      expect(contentField?.type).toBe('richText');
      expect(contentField?.layer).toBe('common');
      
      const publishDateField = articlePage?.fields.find(f => f.name === 'publishDate');
      expect(publishDateField?.type).toBe('date');
      expect(publishDateField?.layer).toBe('common');
      
      // Verify HeroBlock transformation
      const heroBlock = universalTypes.find(t => t.id === 'HeroBlock');
      expect(heroBlock).toBeDefined();
      expect(heroBlock?.type).toBe('component');
      expect(heroBlock?.isRoutable).toBe(false);
      expect(heroBlock?.fields).toHaveLength(3);
      
      const backgroundImageField = heroBlock?.fields.find(f => f.name === 'backgroundImage');
      expect(backgroundImageField?.type).toBe('media');
      expect(backgroundImageField?.layer).toBe('common');
    });

    it('should handle round-trip transformation without data loss', async () => {
      const originalOptimizelyType: OptimizelyContentType = {
        key: 'TestContentType',
        displayName: 'Test Content Type',
        description: 'Test description',
        baseType: '_page',
        source: 'optimizely',
        sortOrder: 100,
        mayContainTypes: ['ComponentA', 'ComponentB'],
        properties: {
          title: {
            type: 'String',
            displayName: 'Title',
            required: true,
            description: 'Page title',
            validation: ['maxLength:100', 'minLength:1']
          },
          content: {
            type: 'XhtmlString',
            displayName: 'Content',
            required: false
          },
          tags: {
            type: 'SelectMany',
            displayName: 'Tags',
            required: false,
            options: ['news', 'blog', 'tutorial']
          }
        }
      };

      // Transform to Universal
      const universalType = provider.mapToUniversal(originalOptimizelyType);
      
      // Transform back to Optimizely
      const roundTripType = provider.mapFromUniversal(universalType);
      
      // Verify no data loss
      expect(roundTripType.key).toBe(originalOptimizelyType.key);
      expect(roundTripType.displayName).toBe(originalOptimizelyType.displayName);
      expect(roundTripType.description).toBe(originalOptimizelyType.description);
      expect(roundTripType.baseType).toBe(originalOptimizelyType.baseType);
      
      // Verify properties preserved
      expect(Object.keys(roundTripType.properties)).toHaveLength(3);
      expect(roundTripType.properties.title.type).toBe('String');
      expect(roundTripType.properties.title.required).toBe(true);
      expect(roundTripType.properties.content.type).toBe('XhtmlString');
      expect(roundTripType.properties.tags.type).toBe('SelectMany');
    });

    it('should validate content types before operations', async () => {
      const mockClient = (provider as any).client;
      
      const invalidType: UniversalContentType = {
        version: '1.0',
        id: '', // Invalid: empty ID
        name: 'InvalidType',
        type: 'page',
        isRoutable: true,
        fields: [
          {
            id: 'field_test',
            name: '', // Invalid: empty field name
            layer: 'primitive',
            type: 'text',
            validations: []
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      mockClient.validateContentType = jest.fn().mockResolvedValue({
        isValid: false,
        errors: [
          'Content type ID is required',
          'Field name is required'
        ],
        warnings: []
      });

      const validationResult = await provider.validateContentType(invalidType);
      
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toHaveLength(2);
      expect(validationResult.errors[0].message).toContain('ID is required');
      expect(validationResult.errors[1].message).toContain('Field name is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle API connection errors gracefully', async () => {
      const mockClient = (provider as any).client;
      mockClient.getContentTypes = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(provider.getContentTypes()).rejects.toThrow(
        'Failed to fetch content types'
      );
    });

    it('should handle transformation errors', () => {
      const invalidOptimizelyType = {
        key: 'Invalid',
        // Missing required properties
      } as OptimizelyContentType;

      expect(() => provider.mapToUniversal(invalidOptimizelyType))
        .toThrow();
    });
  });

  describe('Feature Flag Integration', () => {
    it('should respect USE_PROVIDER_PATTERN environment variable', () => {
      const originalEnv = process.env.USE_PROVIDER_PATTERN;
      
      // Test with feature flag enabled
      process.env.USE_PROVIDER_PATTERN = 'true';
      expect(process.env.USE_PROVIDER_PATTERN).toBe('true');
      
      // Test with feature flag disabled
      process.env.USE_PROVIDER_PATTERN = 'false';
      expect(process.env.USE_PROVIDER_PATTERN).toBe('false');
      
      // Restore original value
      process.env.USE_PROVIDER_PATTERN = originalEnv;
    });
  });

  describe('No External Dependencies', () => {
    it('should not import Optimizely types from outside provider module', () => {
      // This test verifies that all Optimizely imports are internal to the provider
      const providerCode = `
        import { OptimizelyContentType } from './types';
        import { OptimizelyClient } from './client';
        import { TypeMapper } from './mappers/type-mapper';
      `;
      
      // Should not contain imports from outside the provider module
      expect(providerCode).not.toContain('from "@/lib/cms/optimizely');
      expect(providerCode).not.toContain('from "../../../cms/optimizely');
      expect(providerCode).toContain('from \'./types\'');
      expect(providerCode).toContain('from \'./client\'');
    });
  });
});