import { ValidationError, ValidationResult, ValidationSeverity } from './ContentTypeValidator';

export interface CompatibilityCheckResult extends ValidationResult {
  compatible: boolean;
  warnings: ValidationError[];
}

export class CompatibilityChecker {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  private readonly OPTIMIZELY_SUPPORTED_FIELD_TYPES = [
    'string',
    'number',
    'boolean',
    'date',
    'reference',
  ];

  private readonly OPTIMIZELY_UNSUPPORTED_FEATURES = {
    regexValidation: 'Regex validation is not supported in Optimizely',
    deepNesting: 'Deep object nesting beyond 3 levels is not supported',
    customValidators: 'Custom validation functions are not supported',
  };

  private readonly OPTIMIZELY_NAMING_RULES = {
    maxLength: 100,
    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
    reservedPrefixes: ['sys_', 'optimizely_', '__'],
  };

  public checkPlatformCompatibility(contentType: any, platform: string = 'optimizely'): CompatibilityCheckResult {
    this.errors = [];
    this.warnings = [];

    if (platform.toLowerCase() === 'optimizely') {
      this.checkOptimizelyCompatibility(contentType);
    }

    return {
      valid: this.errors.length === 0,
      compatible: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private checkOptimizelyCompatibility(contentType: any): void {
    // Check content type naming conventions
    this.checkNamingConventions(contentType);
    
    // Check field type compatibility
    this.checkFieldTypeCompatibility(contentType);
    
    // Check relationships and constraints
    this.checkRelationshipCompatibility(contentType);
    
    // Check for unsupported features
    this.checkUnsupportedFeatures(contentType);
  }

  private checkNamingConventions(contentType: any): void {
    // Check content type key
    if (contentType.key) {
      if (contentType.key.length > this.OPTIMIZELY_NAMING_RULES.maxLength) {
        this.errors.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: 'key',
          message: `Content type key exceeds maximum length of ${this.OPTIMIZELY_NAMING_RULES.maxLength} characters`,
          severity: 'error',
        });
      }

      if (!this.OPTIMIZELY_NAMING_RULES.pattern.test(contentType.key)) {
        this.errors.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: 'key',
          message: 'Content type key must start with a letter and contain only alphanumeric characters and underscores',
          severity: 'error',
        });
      }

      const hasReservedPrefix = this.OPTIMIZELY_NAMING_RULES.reservedPrefixes.some(prefix => 
        contentType.key.toLowerCase().startsWith(prefix)
      );
      
      if (hasReservedPrefix) {
        this.errors.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: 'key',
          message: `Content type key cannot start with reserved prefixes: ${this.OPTIMIZELY_NAMING_RULES.reservedPrefixes.join(', ')}`,
          severity: 'error',
        });
      }
    }

    // Check field naming conventions
    if (contentType.fields && Array.isArray(contentType.fields)) {
      contentType.fields.forEach((field: any, index: number) => {
        if (field.key && field.key.length > this.OPTIMIZELY_NAMING_RULES.maxLength) {
          this.errors.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].key`,
            message: `Field key exceeds maximum length of ${this.OPTIMIZELY_NAMING_RULES.maxLength} characters`,
            severity: 'error',
          });
        }

        if (field.key && !this.OPTIMIZELY_NAMING_RULES.pattern.test(field.key)) {
          this.errors.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].key`,
            message: 'Field key must start with a letter and contain only alphanumeric characters and underscores',
            severity: 'error',
          });
        }
      });
    }
  }

  private checkFieldTypeCompatibility(contentType: any): void {
    if (!contentType.fields || !Array.isArray(contentType.fields)) {
      return;
    }

    contentType.fields.forEach((field: any, index: number) => {
      // Check if field type is supported
      if (field.type && !this.OPTIMIZELY_SUPPORTED_FIELD_TYPES.includes(field.type)) {
        if (field.type === 'array' || field.type === 'object') {
          this.warnings.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].type`,
            message: `Field type "${field.type}" requires special handling in Optimizely. Will be converted to JSON string`,
            severity: 'warning',
          });
        } else {
          this.errors.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].type`,
            message: `Field type "${field.type}" is not supported in Optimizely`,
            severity: 'error',
          });
        }
      }

      // Check validation rules
      if (field.validation) {
        if (field.validation.regex) {
          this.warnings.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].validation.regex`,
            message: 'Optimizely does not support regex validation. This will be ignored during sync',
            severity: 'warning',
          });
        }

        // Check for complex validation rules
        const complexValidationKeys = Object.keys(field.validation).filter(
          key => !['min', 'max', 'required', 'options'].includes(key)
        );
        
        if (complexValidationKeys.length > 0) {
          this.warnings.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].validation`,
            message: `Complex validation rules (${complexValidationKeys.join(', ')}) are not supported in Optimizely`,
            severity: 'warning',
          });
        }
      }
    });
  }

  private checkRelationshipCompatibility(contentType: any): void {
    if (!contentType.relationships || !Array.isArray(contentType.relationships)) {
      return;
    }

    contentType.relationships.forEach((relationship: any, index: number) => {
      // Check many-to-many relationships
      if (relationship.relationType === 'many-to-many') {
        this.warnings.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: `relationships[${index}].relationType`,
          message: 'Many-to-many relationships require special handling in Optimizely through junction tables',
          severity: 'warning',
        });
      }

      // Check circular references
      if (relationship.targetType === contentType.key) {
        this.warnings.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: `relationships[${index}].targetType`,
          message: 'Self-referential relationships may cause issues during sync. Handle with care',
          severity: 'warning',
        });
      }
    });
  }

  private checkUnsupportedFeatures(contentType: any): void {
    if (!contentType.fields || !Array.isArray(contentType.fields)) {
      return;
    }

    // Check for deep nesting in object fields
    contentType.fields.forEach((field: any, index: number) => {
      if (field.type === 'object' && field.metadata?.schema) {
        const nestingLevel = this.calculateNestingDepth(field.metadata.schema);
        if (nestingLevel > 3) {
          this.errors.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `fields[${index}].metadata.schema`,
            message: this.OPTIMIZELY_UNSUPPORTED_FEATURES.deepNesting,
            severity: 'error',
          });
        }
      }

      // Check for custom validators
      if (field.validation?.customValidator) {
        this.warnings.push({
          type: 'PLATFORM_INCOMPATIBLE',
          field: `fields[${index}].validation.customValidator`,
          message: this.OPTIMIZELY_UNSUPPORTED_FEATURES.customValidators,
          severity: 'warning',
        });
      }
    });

    // Check for unsupported metadata
    if (contentType.metadata) {
      const unsupportedMetadataKeys = ['customRenderer', 'dynamicFields', 'computedFields'];
      const foundUnsupported = Object.keys(contentType.metadata).filter(key => 
        unsupportedMetadataKeys.includes(key)
      );

      if (foundUnsupported.length > 0) {
        foundUnsupported.forEach(key => {
          this.warnings.push({
            type: 'PLATFORM_INCOMPATIBLE',
            field: `metadata.${key}`,
            message: `Metadata property "${key}" is not supported in Optimizely and will be ignored`,
            severity: 'warning',
          });
        });
      }
    }
  }

  private calculateNestingDepth(schema: any, currentDepth: number = 1): number {
    if (!schema || typeof schema !== 'object') {
      return currentDepth;
    }

    let maxDepth = currentDepth;
    
    Object.values(schema).forEach((value: any) => {
      if (value && typeof value === 'object') {
        const depth = this.calculateNestingDepth(value, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    });

    return maxDepth;
  }
}