import { OptimizelyTransformer, TransformationResult, ValidationResult } from '../optimizely-transformer';
import { ExtractedContentType } from '../../extractors/database-extractor';

describe('OptimizelyTransformer', () => {
  let transformer: OptimizelyTransformer;

  beforeEach(() => {
    transformer = new OptimizelyTransformer();
  });

  describe('transformContentType', () => {
    it('should transform a valid content type', () => {
      const input: ExtractedContentType = {
        id: '123',
        websiteId: 'web1',
        websiteName: 'Test Site',
        name: 'Blog Post',
        fields: {
          name: 'Blog Post',
          description: 'A blog post content type',
          fields: [
            { name: 'title', type: 'text', label: 'Title', required: true },
            { name: 'body', type: 'richtext', label: 'Body Content' },
            { name: 'published', type: 'boolean', label: 'Published' }
          ]
        },
        settings: {},
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        metadata: {
          extractedAt: '2024-01-03',
          source: 'catalyst-studio'
        }
      };

      const result = transformer.transformContentType(input);

      expect(result.transformed.key).toBe('BlogPost');
      expect(result.transformed.displayName).toBe('Blog Post');
      expect(result.transformed.baseType).toBe('_component');
      expect(result.transformed.properties).toHaveProperty('title');
      expect(result.transformed.properties.title).toEqual({
        type: 'String',
        displayName: 'Title',
        required: true
      });
      expect(result.transformed.properties.body).toEqual({
        type: 'String',
        displayName: 'Body Content',
        required: false
      });
      expect(result.transformed.properties.published).toEqual({
        type: 'Boolean',
        displayName: 'Published',
        required: false
      });
    });

    it('should handle content type with no fields', () => {
      const input: ExtractedContentType = {
        id: '456',
        websiteId: 'web2',
        websiteName: null,
        name: 'Empty Type',
        fields: {},
        settings: {},
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        metadata: {
          extractedAt: '2024-01-03',
          source: 'catalyst-studio'
        }
      };

      const result = transformer.transformContentType(input);

      expect(result.transformed.properties).toHaveProperty('title');
      expect(Object.keys(result.transformed.properties)).toHaveLength(1);
    });

    it('should sanitize invalid key names', () => {
      const input: ExtractedContentType = {
        id: '789',
        websiteId: 'web3',
        websiteName: 'Test',
        name: '123-Invalid!@#Name',
        fields: {
          fields: [
            { name: '123field', type: 'text' },
            { name: '@special', type: 'text' }
          ]
        },
        settings: {},
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        metadata: {
          extractedAt: '2024-01-03',
          source: 'catalyst-studio'
        }
      };

      const result = transformer.transformContentType(input);

      expect(result.transformed.key).toMatch(/^[A-Za-z][_0-9A-Za-z]*$/);
      expect(result.transformed.key).toBe('Type123InvalidName');
      expect(result.transformed.properties).toHaveProperty('field123field');
      expect(result.transformed.properties).toHaveProperty('special');
    });

    it('should map field types correctly', () => {
      const fieldTypes = [
        { input: 'text', expected: 'String' },
        { input: 'number', expected: 'String' },
        { input: 'boolean', expected: 'Boolean' },
        { input: 'date', expected: 'DateTime' },
        { input: 'unknown', expected: 'String' }
      ];

      fieldTypes.forEach(({ input, expected }) => {
        const contentType: ExtractedContentType = {
          id: 'test',
          websiteId: 'web',
          websiteName: 'Test',
          name: 'Test',
          fields: {
            fields: [{ name: 'field', type: input }]
          },
          settings: {},
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          metadata: {
            extractedAt: '2024-01-03',
            source: 'catalyst-studio'
          }
        };

        const result = transformer.transformContentType(contentType);
        expect(result.transformed.properties.field.type).toBe(expected);
      });
    });
  });

  describe('transformBatch', () => {
    it('should transform multiple content types', () => {
      const input: ExtractedContentType[] = [
        {
          id: '1',
          websiteId: 'web',
          websiteName: 'Test',
          name: 'Type1',
          fields: {},
          settings: {},
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          metadata: {
            extractedAt: '2024-01-03',
            source: 'catalyst-studio'
          }
        },
        {
          id: '2',
          websiteId: 'web',
          websiteName: 'Test',
          name: 'Type2',
          fields: {},
          settings: {},
          createdAt: '2024-01-01',
          updatedAt: '2024-01-02',
          metadata: {
            extractedAt: '2024-01-03',
            source: 'catalyst-studio'
          }
        }
      ];

      const results = transformer.transformBatch(input);

      expect(results).toHaveLength(2);
      expect(results[0].transformed.key).toBe('Type1');
      expect(results[1].transformed.key).toBe('Type2');
    });
  });

  describe('validateTransformation', () => {
    it('should validate a correct transformation', () => {
      const transformation: TransformationResult = {
        original: {} as ExtractedContentType,
        transformed: {
          key: 'ValidKey',
          displayName: 'Valid Display Name',
          description: 'Description',
          baseType: '_component',
          source: 'catalyst-studio-sync',
          sortOrder: 100,
          mayContainTypes: [],
          properties: {
            field1: {
              type: 'String',
              displayName: 'Field 1',
              required: false
            }
          }
        },
        mapping: {
          catalystId: '123',
          optimizelyKey: 'ValidKey',
          fieldMappings: []
        }
      };

      const validation = transformer.validateTransformation(transformation);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const transformation: TransformationResult = {
        original: {} as ExtractedContentType,
        transformed: {
          key: '',
          displayName: '',
          description: 'Description',
          baseType: '',
          source: 'catalyst-studio-sync',
          sortOrder: 100,
          mayContainTypes: [],
          properties: {}
        },
        mapping: {
          catalystId: '123',
          optimizelyKey: '',
          fieldMappings: []
        }
      };

      const validation = transformer.validateTransformation(transformation);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Missing required field: key');
      expect(validation.errors).toContain('Missing required field: displayName');
      expect(validation.errors).toContain('Missing required field: baseType');
    });

    it('should detect invalid key format', () => {
      const transformation: TransformationResult = {
        original: {} as ExtractedContentType,
        transformed: {
          key: '123-invalid-key',
          displayName: 'Valid',
          description: 'Description',
          baseType: '_component',
          source: 'catalyst-studio-sync',
          sortOrder: 100,
          mayContainTypes: [],
          properties: {}
        },
        mapping: {
          catalystId: '123',
          optimizelyKey: '123-invalid-key',
          fieldMappings: []
        }
      };

      const validation = transformer.validateTransformation(transformation);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid key format: 123-invalid-key');
    });

    it('should warn about missing properties', () => {
      const transformation: TransformationResult = {
        original: {} as ExtractedContentType,
        transformed: {
          key: 'ValidKey',
          displayName: 'Valid',
          description: 'Description',
          baseType: '_component',
          source: 'catalyst-studio-sync',
          sortOrder: 100,
          mayContainTypes: [],
          properties: {}
        },
        mapping: {
          catalystId: '123',
          optimizelyKey: 'ValidKey',
          fieldMappings: []
        }
      };

      const validation = transformer.validateTransformation(transformation);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('No properties defined for content type');
    });
  });
});