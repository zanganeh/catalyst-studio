import { CompatibilityChecker } from '../CompatibilityChecker';

describe('CompatibilityChecker', () => {
  let checker: CompatibilityChecker;

  beforeEach(() => {
    checker = new CompatibilityChecker();
  });

  describe('checkPlatformCompatibility', () => {
    it('should pass compatible content type for Optimizely', () => {
      const compatibleContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
            required: true,
          },
          {
            key: 'publishDate',
            name: 'Publish Date',
            type: 'date',
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(compatibleContentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.compatible).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unsupported field types', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'metadata',
            name: 'Metadata',
            type: 'object', // Requires special handling
          },
          {
            key: 'tags',
            name: 'Tags',
            type: 'array', // Requires special handling
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true); // Warnings don't make it invalid
      expect(result.warnings.length).toBe(2);
      expect(result.warnings[0].message).toContain('requires special handling');
    });

    it('should detect naming convention violations', () => {
      const contentType = {
        key: 'sys_reserved', // Reserved prefix
        name: 'Reserved',
        fields: [
          {
            key: 'field1',
            name: 'Field 1',
            type: 'string',
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('reserved prefix'))).toBe(true);
    });

    it('should detect long names exceeding maximum length', () => {
      const longKey = 'a'.repeat(101); // 101 characters
      const contentType = {
        key: longKey,
        name: 'Long Name',
        fields: [
          {
            key: 'field1',
            name: 'Field 1',
            type: 'string',
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('exceeds maximum length'))).toBe(true);
    });

    it('should warn about regex validation', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'email',
            name: 'Email',
            type: 'string',
            validation: {
              regex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            },
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('regex validation'))).toBe(true);
    });

    it('should warn about many-to-many relationships', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
        relationships: [
          {
            targetType: 'tag',
            relationType: 'many-to-many',
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Many-to-many'))).toBe(true);
    });

    it('should warn about self-referential relationships', () => {
      const contentType = {
        key: 'category',
        name: 'Category',
        fields: [
          {
            key: 'name',
            name: 'Name',
            type: 'string',
          },
        ],
        relationships: [
          {
            targetType: 'category', // Self-reference
            relationType: 'one-to-many',
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Self-referential'))).toBe(true);
    });

    it('should detect deep nesting in object fields', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'nested',
            name: 'Nested',
            type: 'object',
            metadata: {
              schema: {
                level1: {
                  level2: {
                    level3: {
                      level4: {
                        value: 'too deep',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Deep object nesting'))).toBe(true);
    });

    it('should warn about custom validators', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
            validation: {
              customValidator: 'validateTitle',
            },
          },
        ],
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.message.includes('Custom validation functions'))).toBe(true);
    });

    it('should warn about unsupported metadata properties', () => {
      const contentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
        metadata: {
          customRenderer: 'ArticleRenderer',
          dynamicFields: true,
          computedFields: ['slug'],
        },
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.warnings.filter(w => w.field.startsWith('metadata.')).length).toBe(3);
    });

    it('should handle content types without fields gracefully', () => {
      const contentType = {
        key: 'empty',
        name: 'Empty',
        // No fields array
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle content types without relationships gracefully', () => {
      const contentType = {
        key: 'simple',
        name: 'Simple',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
        // No relationships array
      };

      const result = checker.checkPlatformCompatibility(contentType, 'optimizely');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});