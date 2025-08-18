import { z } from 'zod';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  type: string;
  field: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const FieldSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object', 'reference']),
  required: z.boolean().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    regex: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

const RelationshipSchema = z.object({
  targetType: z.string(),
  relationType: z.enum(['one-to-one', 'one-to-many', 'many-to-many']),
  required: z.boolean().optional(),
});

const ContentTypeSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Key must start with a letter and contain only alphanumeric characters and underscores'),
  name: z.string().min(1),
  fields: z.array(FieldSchema),
  relationships: z.array(RelationshipSchema).optional(),
  metadata: z.record(z.any()).optional(),
});

export class ContentTypeValidator {
  private errors: ValidationError[] = [];

  public validateStructure(contentType: any): ValidationResult {
    this.errors = [];
    
    try {
      ContentTypeSchema.parse(contentType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.errors = error.errors.map(err => ({
          type: 'INVALID_STRUCTURE',
          field: err.path.join('.'),
          message: err.message,
          severity: 'error' as ValidationSeverity,
        }));
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  public validateBusinessRules(contentType: any): ValidationResult {
    this.errors = [];

    // Business Rule: Content type name cannot start with underscore
    if (contentType.name && contentType.name.startsWith('_')) {
      this.errors.push({
        type: 'BUSINESS_RULE_VIOLATION',
        field: 'name',
        message: 'Content type name cannot start with underscore',
        severity: 'error',
      });
    }

    // Business Rule: At least one field is required
    if (!contentType.fields || contentType.fields.length === 0) {
      this.errors.push({
        type: 'BUSINESS_RULE_VIOLATION',
        field: 'fields',
        message: 'Content type must have at least one field',
        severity: 'error',
      });
    }

    // Business Rule: Field keys must be unique
    if (contentType.fields && Array.isArray(contentType.fields)) {
      const fieldKeys = contentType.fields.map((f: any) => f.key);
      const duplicates = fieldKeys.filter((key: string, index: number) => fieldKeys.indexOf(key) !== index);
      
      if (duplicates.length > 0) {
        duplicates.forEach((key: string) => {
          this.errors.push({
            type: 'BUSINESS_RULE_VIOLATION',
            field: `fields.${key}`,
            message: `Duplicate field key: ${key}`,
            severity: 'error',
          });
        });
      }
    }

    // Business Rule: Reserved field names
    const reservedFieldNames = ['id', '_id', '__v', 'createdAt', 'updatedAt', 'deletedAt'];
    if (contentType.fields && Array.isArray(contentType.fields)) {
      contentType.fields.forEach((field: any, index: number) => {
        if (reservedFieldNames.includes(field.key)) {
          this.errors.push({
            type: 'BUSINESS_RULE_VIOLATION',
            field: `fields[${index}].key`,
            message: `Reserved field name: ${field.key}`,
            severity: 'error',
          });
        }
      });
    }

    // Business Rule: Reference fields must have valid target
    if (contentType.fields && Array.isArray(contentType.fields)) {
      contentType.fields.forEach((field: any, index: number) => {
        if (field.type === 'reference' && !field.metadata?.targetType) {
          this.errors.push({
            type: 'BUSINESS_RULE_VIOLATION',
            field: `fields[${index}].metadata.targetType`,
            message: 'Reference field must specify targetType in metadata',
            severity: 'error',
          });
        }
      });
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  public validate(contentType: any): ValidationResult {
    const structureResult = this.validateStructure(contentType);
    const businessRulesResult = this.validateBusinessRules(contentType);

    return {
      valid: structureResult.valid && businessRulesResult.valid,
      errors: [...structureResult.errors, ...businessRulesResult.errors],
    };
  }
}