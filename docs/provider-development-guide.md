# Provider Development Guide

## Overview

This guide provides step-by-step instructions for creating new CMS providers for the Universal Type System. Providers act as adapters between the universal type system and specific CMS platforms.

## Table of Contents

1. [Provider Interface Requirements](#provider-interface-requirements)
2. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
3. [Testing Guidelines](#testing-guidelines)
4. [Troubleshooting](#troubleshooting)
5. [Performance Optimization](#performance-optimization)

## Provider Interface Requirements

All providers must implement the `ICMSProvider` interface defined in `lib/providers/universal/interfaces/type-provider.ts`:

### Core Interface

```typescript
export interface ICMSProvider {
  // Provider metadata
  readonly name: string;
  readonly version: string;
  readonly supportedFeatures: string[];

  // Content Type Operations
  createContentType(definition: UniversalContentType): Promise<ContentTypeResult>;
  updateContentType(id: string, definition: UniversalContentType): Promise<ContentTypeResult>;
  deleteContentType(id: string): Promise<void>;
  getContentType(id: string): Promise<UniversalContentType | null>;
  listContentTypes(): Promise<UniversalContentType[]>;

  // Transformation Operations
  transformToUniversal(cmsType: any): Promise<UniversalContentType>;
  transformFromUniversal(universalType: UniversalContentType): Promise<any>;

  // Validation Operations
  validateContentType(definition: UniversalContentType): Promise<ValidationResult>;
  getCapabilities(): ProviderCapabilities;
}
```

### Required Types

```typescript
interface UniversalContentType {
  id?: string;
  name: string;
  category: 'page' | 'component';
  fields: UniversalField[];
  metadata?: {
    description?: string;
    version?: string;
    created?: Date;
    modified?: Date;
  };
}

interface UniversalField {
  name: string;
  type: UniversalFieldType;
  required: boolean;
  validation?: ValidationRule[];
  metadata?: Record<string, any>;
}

interface ContentTypeResult {
  success: boolean;
  data?: UniversalContentType;
  error?: string;
  confidence?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
}
```

## Step-by-Step Implementation Guide

### Step 1: Create Provider Directory Structure

```
lib/providers/{provider-name}/
├── index.ts                 # Main provider class
├── types.ts                  # Provider-specific types
├── transformer.ts            # Type transformation logic
├── validator.ts              # Validation logic
├── capabilities.ts           # Feature capabilities
└── __tests__/               # Provider tests
    ├── provider.test.ts
    ├── transformer.test.ts
    └── validator.test.ts
```

### Step 2: Implement the Provider Class

Create `lib/providers/{provider-name}/index.ts`:

```typescript
import { ICMSProvider, UniversalContentType, ContentTypeResult } from '../universal/interfaces/type-provider';
import { Transformer } from './transformer';
import { Validator } from './validator';
import { Capabilities } from './capabilities';

export class MyCustomProvider implements ICMSProvider {
  readonly name = 'MyCustomCMS';
  readonly version = '1.0.0';
  readonly supportedFeatures = ['content-types', 'validation', 'transformation'];

  private transformer: Transformer;
  private validator: Validator;
  private capabilities: Capabilities;

  constructor(config?: ProviderConfig) {
    this.transformer = new Transformer();
    this.validator = new Validator();
    this.capabilities = new Capabilities();
  }

  async createContentType(definition: UniversalContentType): Promise<ContentTypeResult> {
    try {
      // 1. Validate the universal type
      const validation = await this.validateContentType(definition);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Validation failed',
          confidence: validation.confidence
        };
      }

      // 2. Transform to platform-specific format
      const platformType = await this.transformFromUniversal(definition);

      // 3. Create in the CMS (platform-specific API call)
      const created = await this.createInCMS(platformType);

      // 4. Transform back to universal format
      const universal = await this.transformToUniversal(created);

      return {
        success: true,
        data: universal,
        confidence: validation.confidence
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        confidence: 0
      };
    }
  }

  // Implement all other interface methods...
}
```

### Step 3: Implement Type Transformation

Create `lib/providers/{provider-name}/transformer.ts`:

```typescript
export class Transformer {
  /**
   * Transform CMS-specific type to Universal format
   */
  async transformToUniversal(cmsType: any): Promise<UniversalContentType> {
    // Map CMS fields to universal fields
    const fields = cmsType.fields.map(field => this.transformFieldToUniversal(field));

    return {
      id: cmsType.id,
      name: cmsType.name,
      category: this.determineCategory(cmsType),
      fields,
      metadata: {
        description: cmsType.description,
        version: cmsType.version,
        created: cmsType.created,
        modified: cmsType.modified
      }
    };
  }

  /**
   * Transform Universal type to CMS-specific format
   */
  async transformFromUniversal(universalType: UniversalContentType): Promise<any> {
    // Map universal fields to CMS fields
    const fields = universalType.fields.map(field => this.transformFieldFromUniversal(field));

    return {
      // CMS-specific structure
      name: universalType.name,
      fields,
      // Additional CMS-specific properties
    };
  }

  private transformFieldToUniversal(cmsField: any): UniversalField {
    // Field type mapping logic
    const typeMap = {
      'string': 'Text',
      'text': 'LongText',
      'integer': 'Number',
      'float': 'Decimal',
      'boolean': 'Boolean',
      'date': 'Date',
      'datetime': 'DateTime',
      'json': 'JSON',
      'reference': 'ContentReference'
    };

    return {
      name: cmsField.name,
      type: typeMap[cmsField.type] || 'Text',
      required: cmsField.required || false,
      validation: this.transformValidation(cmsField.validation),
      metadata: cmsField.metadata
    };
  }

  private transformFieldFromUniversal(universalField: UniversalField): any {
    // Reverse mapping logic
    const typeMap = {
      'Text': 'string',
      'LongText': 'text',
      'Number': 'integer',
      'Decimal': 'float',
      'Boolean': 'boolean',
      'Date': 'date',
      'DateTime': 'datetime',
      'JSON': 'json',
      'ContentReference': 'reference'
    };

    return {
      name: universalField.name,
      type: typeMap[universalField.type] || 'string',
      required: universalField.required,
      // CMS-specific field properties
    };
  }

  private determineCategory(cmsType: any): 'page' | 'component' {
    // Logic to determine if type is a page or component
    if (cmsType.routable || cmsType.hasUrl || cmsType.isPage) {
      return 'page';
    }
    return 'component';
  }
}
```

### Step 4: Implement Validation

Create `lib/providers/{provider-name}/validator.ts`:

```typescript
export class Validator {
  async validate(definition: UniversalContentType): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let confidence = 100;

    // 1. Validate required fields
    if (!definition.name) {
      errors.push({
        field: 'name',
        message: 'Content type name is required',
        severity: 'error'
      });
      confidence -= 20;
    }

    if (!definition.category) {
      errors.push({
        field: 'category',
        message: 'Category must be either "page" or "component"',
        severity: 'error'
      });
      confidence -= 30;
    }

    // 2. Validate field names
    const fieldNames = new Set<string>();
    for (const field of definition.fields) {
      if (fieldNames.has(field.name)) {
        errors.push({
          field: field.name,
          message: `Duplicate field name: ${field.name}`,
          severity: 'error'
        });
        confidence -= 10;
      }
      fieldNames.add(field.name);

      // Validate field naming convention
      if (!this.isValidFieldName(field.name)) {
        warnings.push({
          field: field.name,
          message: `Field name should use camelCase: ${field.name}`,
          severity: 'warning'
        });
        confidence -= 5;
      }
    }

    // 3. Validate category-specific rules
    if (definition.category === 'page') {
      // Pages should have title and slug
      const hasTitle = definition.fields.some(f => f.name === 'title');
      const hasSlug = definition.fields.some(f => f.name === 'slug');

      if (!hasTitle) {
        warnings.push({
          field: 'fields',
          message: 'Page types should include a "title" field',
          severity: 'warning'
        });
        confidence -= 5;
      }

      if (!hasSlug) {
        warnings.push({
          field: 'fields',
          message: 'Page types should include a "slug" field for routing',
          severity: 'warning'
        });
        confidence -= 5;
      }
    } else if (definition.category === 'component') {
      // Components should be focused (max 8 fields recommended)
      if (definition.fields.length > 8) {
        warnings.push({
          field: 'fields',
          message: `Component has ${definition.fields.length} fields. Consider keeping components focused with 8 or fewer fields.`,
          severity: 'warning'
        });
        confidence -= 5;
      }
    }

    // 4. Calculate final confidence
    confidence = Math.max(0, confidence);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      confidence
    };
  }

  private isValidFieldName(name: string): boolean {
    // Check for camelCase
    return /^[a-z][a-zA-Z0-9]*$/.test(name);
  }
}
```

### Step 5: Define Provider Capabilities

Create `lib/providers/{provider-name}/capabilities.ts`:

```typescript
export class Capabilities {
  getCapabilities(): ProviderCapabilities {
    return {
      supportsContentTypes: true,
      supportsValidation: true,
      supportsTransformation: true,
      supportedFieldTypes: [
        'Text',
        'LongText',
        'Number',
        'Decimal',
        'Boolean',
        'Date',
        'DateTime',
        'Media',
        'ContentReference',
        'JSON'
      ],
      maxFieldsPerType: 100,
      supportsNestedTypes: true,
      supportsCustomValidation: true,
      supportsVersioning: true,
      supportsBulkOperations: false,
      platformSpecific: {
        // Add any platform-specific capabilities
      }
    };
  }

  isFieldTypeSupported(fieldType: string): boolean {
    return this.getCapabilities().supportedFieldTypes.includes(fieldType);
  }

  getFallbackFieldType(unsupportedType: string): string {
    // Define fallback strategies
    const fallbackMap = {
      'RichText': 'LongText',
      'Markdown': 'LongText',
      'HTML': 'LongText',
      'Video': 'Media',
      'Audio': 'Media',
      'File': 'Media',
      'Location': 'JSON',
      'GeoPoint': 'JSON'
    };

    return fallbackMap[unsupportedType] || 'Text';
  }
}
```

### Step 6: Register the Provider

Add your provider to the registry in `lib/providers/universal/registry/type-system-registry.ts`:

```typescript
import { MyCustomProvider } from '../../my-custom-cms';

export class TypeSystemRegistry {
  private providers: Map<string, ICMSProvider> = new Map();

  constructor() {
    this.registerDefaultProviders();
  }

  private registerDefaultProviders() {
    // Register existing providers
    this.register(new OptimizelyProvider());
    this.register(new MockProvider());
    
    // Register your new provider
    this.register(new MyCustomProvider());
  }
}
```

## Testing Guidelines

### Unit Testing

Create comprehensive unit tests for each component:

```typescript
// __tests__/provider.test.ts
import { MyCustomProvider } from '../index';

describe('MyCustomProvider', () => {
  let provider: MyCustomProvider;

  beforeEach(() => {
    provider = new MyCustomProvider();
  });

  describe('createContentType', () => {
    it('should create a valid content type', async () => {
      const definition: UniversalContentType = {
        name: 'TestPage',
        category: 'page',
        fields: [
          { name: 'title', type: 'Text', required: true },
          { name: 'content', type: 'LongText', required: false }
        ]
      };

      const result = await provider.createContentType(definition);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('TestPage');
      expect(result.confidence).toBeGreaterThan(70);
    });

    it('should reject invalid content types', async () => {
      const definition: UniversalContentType = {
        name: '',  // Invalid: empty name
        category: 'invalid' as any,  // Invalid: wrong category
        fields: []
      };

      const result = await provider.createContentType(definition);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.confidence).toBeLessThan(70);
    });
  });

  describe('transformation', () => {
    it('should transform to universal format', async () => {
      const cmsType = {
        id: '123',
        name: 'BlogPost',
        fields: [
          { name: 'title', type: 'string', required: true }
        ]
      };

      const universal = await provider.transformToUniversal(cmsType);

      expect(universal.name).toBe('BlogPost');
      expect(universal.fields[0].type).toBe('Text');
    });

    it('should transform from universal format', async () => {
      const universal: UniversalContentType = {
        name: 'BlogPost',
        category: 'page',
        fields: [
          { name: 'title', type: 'Text', required: true }
        ]
      };

      const cmsType = await provider.transformFromUniversal(universal);

      expect(cmsType.name).toBe('BlogPost');
      expect(cmsType.fields[0].type).toBe('string');
    });
  });
});
```

### Integration Testing

Test the provider with the universal type system:

```typescript
// __tests__/integration.test.ts
import { UniversalTypeSystem } from '@/lib/providers/universal/type-system';

describe('Provider Integration', () => {
  let typeSystem: UniversalTypeSystem;

  beforeEach(() => {
    typeSystem = new UniversalTypeSystem();
    typeSystem.selectProvider('my-custom-cms');
  });

  it('should work with universal type system', async () => {
    const result = await typeSystem.createContentType({
      name: 'IntegrationTest',
      category: 'component',
      fields: [
        { name: 'heading', type: 'Text', required: true }
      ]
    });

    expect(result.success).toBe(true);
  });
});
```

### Test Coverage Requirements

- Minimum 90% code coverage for providers
- 100% coverage for transformation logic
- 100% coverage for validation logic
- Edge cases and error conditions must be tested

## Troubleshooting

### Common Issues and Solutions

#### Issue: Field Type Not Supported

**Problem**: The CMS doesn't support a specific universal field type.

**Solution**: Implement fallback strategies in the transformer:

```typescript
private transformFieldFromUniversal(field: UniversalField): any {
  if (!this.capabilities.isFieldTypeSupported(field.type)) {
    const fallbackType = this.capabilities.getFallbackFieldType(field.type);
    console.warn(`Field type ${field.type} not supported, using ${fallbackType}`);
    
    return {
      name: field.name,
      type: this.mapUniversalToCMS(fallbackType),
      metadata: {
        originalType: field.type,
        fallbackUsed: true
      }
    };
  }
  
  // Normal transformation
  return this.mapUniversalToCMS(field.type);
}
```

#### Issue: Validation Failures

**Problem**: Content types fail validation unexpectedly.

**Solution**: Implement detailed validation logging:

```typescript
async validateContentType(definition: UniversalContentType): Promise<ValidationResult> {
  console.log('Validating content type:', definition.name);
  
  const result = await this.validator.validate(definition);
  
  if (!result.valid) {
    console.error('Validation errors:', result.errors);
    console.warn('Validation warnings:', result.warnings);
  }
  
  console.log('Validation confidence:', result.confidence);
  
  return result;
}
```

#### Issue: Transformation Data Loss

**Problem**: Data is lost during transformation between formats.

**Solution**: Preserve metadata during transformation:

```typescript
async transformToUniversal(cmsType: any): Promise<UniversalContentType> {
  const universal = {
    // ... standard transformation
    metadata: {
      ...this.extractMetadata(cmsType),
      originalFormat: 'cms-specific',
      originalData: JSON.stringify(cmsType),  // Preserve original for debugging
      transformedAt: new Date()
    }
  };
  
  return universal;
}
```

#### Issue: Performance Problems

**Problem**: Provider operations are slow.

**Solution**: See [Performance Optimization](#performance-optimization) section.

## Performance Optimization

### Caching Strategies

Implement caching for frequently accessed data:

```typescript
export class MyCustomProvider implements ICMSProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout = 60000; // 1 minute

  async getContentType(id: string): Promise<UniversalContentType | null> {
    // Check cache first
    const cached = this.getFromCache(id);
    if (cached) {
      return cached;
    }

    // Fetch from CMS
    const result = await this.fetchFromCMS(id);
    
    // Cache the result
    if (result) {
      this.addToCache(id, result);
    }

    return result;
  }

  private getFromCache(key: string): UniversalContentType | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTimeout) {
      return entry.data;
    }
    return null;
  }

  private addToCache(key: string, data: UniversalContentType): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### Batch Operations

Optimize bulk operations:

```typescript
async createMultipleContentTypes(definitions: UniversalContentType[]): Promise<ContentTypeResult[]> {
  // Validate all types first (can be parallelized)
  const validations = await Promise.all(
    definitions.map(def => this.validateContentType(def))
  );

  // Filter valid types
  const validTypes = definitions.filter((_, index) => validations[index].valid);

  // Batch create in CMS (if supported)
  if (this.supportsBatchOperations) {
    return this.batchCreate(validTypes);
  }

  // Fall back to sequential creation
  const results: ContentTypeResult[] = [];
  for (const type of validTypes) {
    results.push(await this.createContentType(type));
  }

  return results;
}
```

### Connection Pooling

For providers that connect to external services:

```typescript
export class MyCustomProvider {
  private connectionPool: ConnectionPool;

  constructor(config?: ProviderConfig) {
    this.connectionPool = new ConnectionPool({
      maxConnections: config?.maxConnections || 10,
      connectionTimeout: config?.connectionTimeout || 5000,
      retryAttempts: config?.retryAttempts || 3
    });
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const connection = await this.connectionPool.acquire();
    
    try {
      return await operation();
    } catch (error) {
      if (this.isRetryableError(error)) {
        return this.executeWithRetry(operation);
      }
      throw error;
    } finally {
      this.connectionPool.release(connection);
    }
  }
}
```

## Best Practices

1. **Always validate before operations** - Never trust input data
2. **Implement comprehensive error handling** - Provide meaningful error messages
3. **Use proper logging** - Log important operations for debugging
4. **Follow the interface strictly** - Ensure full compatibility
5. **Document platform-specific behavior** - Help users understand limitations
6. **Write extensive tests** - Cover edge cases and error conditions
7. **Optimize for common use cases** - Cache frequently accessed data
8. **Provide clear migration paths** - Help users move between providers
9. **Version your provider** - Support backward compatibility
10. **Monitor performance** - Track operation times and optimize bottlenecks

## Example: Complete Mock Provider

See `lib/providers/mock/` for a complete reference implementation that includes:
- Full interface implementation
- Comprehensive testing
- Error handling
- Caching strategies
- Performance optimizations
- Documentation

## Support

For questions or issues with provider development:
1. Check the troubleshooting section
2. Review the mock provider implementation
3. Contact the development team
4. Submit an issue on GitHub