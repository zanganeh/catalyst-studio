import { ContentTypeValidator } from '../ContentTypeValidator';

describe('ContentTypeValidator', () => {
  let validator: ContentTypeValidator;

  beforeEach(() => {
    validator = new ContentTypeValidator();
  });

  describe('validateStructure', () => {
    it('should validate a valid content type structure', () => {
      const validContentType = {
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
            key: 'content',
            name: 'Content',
            type: 'string',
          },
        ],
      };

      const result = validator.validateStructure(validContentType);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid field type', () => {
      const invalidContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'invalidType', // Invalid type
          },
        ],
      };

      const result = validator.validateStructure(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('INVALID_STRUCTURE');
      expect(result.errors[0].field).toBe('fields.0.type');
    });

    it('should detect missing required fields', () => {
      const invalidContentType = {
        key: 'article',
        // Missing name
        fields: [
          {
            key: 'title',
            // Missing name
            type: 'string',
          },
        ],
      };

      const result = validator.validateStructure(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should validate content type key format', () => {
      const invalidContentType = {
        key: '123invalid', // Key starting with number
        name: 'Invalid',
        fields: [
          {
            key: 'field1',
            name: 'Field 1',
            type: 'string',
          },
        ],
      };

      const result = validator.validateStructure(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'key')).toBe(true);
    });

    it('should validate relationships', () => {
      const contentTypeWithRelationships = {
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
            targetType: 'author',
            relationType: 'one-to-one',
            required: false,
          },
        ],
      };

      const result = validator.validateStructure(contentTypeWithRelationships);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateBusinessRules', () => {
    it('should pass valid business rules', () => {
      const validContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
      };

      const result = validator.validateBusinessRules(validContentType);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect content type name starting with underscore', () => {
      const invalidContentType = {
        key: 'article',
        name: '_Article', // Invalid: starts with underscore
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
      };

      const result = validator.validateBusinessRules(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toContain('cannot start with underscore');
    });

    it('should detect missing fields', () => {
      const invalidContentType = {
        key: 'article',
        name: 'Article',
        fields: [], // No fields
      };

      const result = validator.validateBusinessRules(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.errors[0].field).toBe('fields');
      expect(result.errors[0].message).toContain('at least one field');
    });

    it('should detect duplicate field keys', () => {
      const invalidContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
          {
            key: 'title', // Duplicate key
            name: 'Another Title',
            type: 'string',
          },
        ],
      };

      const result = validator.validateBusinessRules(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate field key'))).toBe(true);
    });

    it('should detect reserved field names', () => {
      const invalidContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'id', // Reserved field name
            name: 'ID',
            type: 'string',
          },
          {
            key: 'createdAt', // Reserved field name
            name: 'Created At',
            type: 'date',
          },
        ],
      };

      const result = validator.validateBusinessRules(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.filter(e => e.message.includes('Reserved field name')).length).toBe(2);
    });

    it('should validate reference fields have targetType', () => {
      const invalidContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'author',
            name: 'Author',
            type: 'reference',
            // Missing metadata.targetType
          },
        ],
      };

      const result = validator.validateBusinessRules(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('must specify targetType'))).toBe(true);
    });

    it('should pass reference fields with targetType', () => {
      const validContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'author',
            name: 'Author',
            type: 'reference',
            metadata: {
              targetType: 'author',
            },
          },
        ],
      };

      const result = validator.validateBusinessRules(validContentType);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate', () => {
    it('should combine structure and business rule validation', () => {
      const validContentType = {
        key: 'article',
        name: 'Article',
        fields: [
          {
            key: 'title',
            name: 'Title',
            type: 'string',
          },
        ],
      };

      const result = validator.validate(validContentType);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return all errors from both validations', () => {
      const invalidContentType = {
        key: '123invalid', // Structure error: invalid key format
        name: '_Article', // Business rule error: starts with underscore
        fields: [], // Business rule error: no fields
      };

      const result = validator.validate(invalidContentType);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      expect(result.errors.some(e => e.type === 'INVALID_STRUCTURE')).toBe(true);
      expect(result.errors.some(e => e.type === 'BUSINESS_RULE_VIOLATION')).toBe(true);
    });
  });
});