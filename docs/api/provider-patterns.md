# Provider API Documentation

## Overview

This document describes the API patterns for the Universal Type System provider interface. All providers must implement these patterns to ensure compatibility with the system.

## Core Provider Interface

### ICMSProvider

The main interface that all providers must implement:

```typescript
interface ICMSProvider {
  // Provider Identification
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

## Provider Selection API

### Selecting a Provider

```typescript
// Get the type system instance
const typeSystem = UniversalTypeSystem.getInstance();

// List available providers
const providers = typeSystem.getAvailableProviders();
// Returns: ['optimizely', 'contentful', 'strapi', 'mock']

// Select a provider
typeSystem.selectProvider('optimizely');

// Get current provider
const currentProvider = typeSystem.getCurrentProvider();
// Returns: ICMSProvider instance

// Check if provider is selected
const hasProvider = typeSystem.hasProvider();
// Returns: boolean
```

### Provider Registration

```typescript
// Register a custom provider
import { MyCustomProvider } from './providers/my-custom';

const registry = TypeSystemRegistry.getInstance();
registry.register(new MyCustomProvider());

// Unregister a provider
registry.unregister('my-custom');

// Get provider instance
const provider = registry.getProvider('my-custom');
```

## Content Type Operations

### Creating Content Types

```typescript
// Basic creation
const result = await provider.createContentType({
  name: 'BlogPost',
  category: 'page',
  fields: [
    { name: 'title', type: 'Text', required: true },
    { name: 'content', type: 'LongText', required: true }
  ]
});

// Check result
if (result.success) {
  console.log('Created:', result.data);
  console.log('Confidence:', result.confidence);
} else {
  console.error('Failed:', result.error);
}

// With validation
const validation = await provider.validateContentType(definition);
if (validation.valid) {
  const result = await provider.createContentType(definition);
}
```

### Updating Content Types

```typescript
// Get existing type
const existing = await provider.getContentType('blog-post-id');

// Modify fields
existing.fields.push({
  name: 'tags',
  type: 'MultiSelect',
  required: false,
  metadata: {
    options: ['tech', 'business', 'lifestyle']
  }
});

// Update
const result = await provider.updateContentType('blog-post-id', existing);

// Handle version conflicts
if (!result.success && result.error?.includes('version')) {
  // Fetch latest version and retry
  const latest = await provider.getContentType('blog-post-id');
  // Merge changes and retry
}
```

### Deleting Content Types

```typescript
// Simple deletion
await provider.deleteContentType('content-type-id');

// With confirmation
const type = await provider.getContentType('content-type-id');
if (type && confirm(`Delete ${type.name}?`)) {
  await provider.deleteContentType('content-type-id');
}

// Batch deletion
const typesToDelete = ['id1', 'id2', 'id3'];
await Promise.all(typesToDelete.map(id => provider.deleteContentType(id)));
```

### Listing Content Types

```typescript
// Get all types
const allTypes = await provider.listContentTypes();

// Filter by category
const pages = allTypes.filter(type => type.category === 'page');
const components = allTypes.filter(type => type.category === 'component');

// Search by name
const searchTerm = 'blog';
const matching = allTypes.filter(type => 
  type.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// Get with metadata
const typesWithMeta = await Promise.all(
  allTypes.map(async type => ({
    ...type,
    fieldCount: type.fields.length,
    hasValidation: type.fields.some(f => f.validation?.length > 0)
  }))
);
```

## Transformation API

### Transform to Universal Format

```typescript
// From Optimizely
const optimizelyType = {
  Name: 'BlogPost',
  Properties: [
    { Name: 'Title', Type: 'String', Required: true },
    { Name: 'Content', Type: 'XhtmlString', Required: true }
  ]
};

const universal = await provider.transformToUniversal(optimizelyType);
// Result:
{
  name: 'BlogPost',
  category: 'page',
  fields: [
    { name: 'title', type: 'Text', required: true },
    { name: 'content', type: 'LongText', required: true }
  ]
}

// With confidence scoring
const result = await provider.transformToUniversal(cmsType);
console.log('Transformation confidence:', result.metadata.confidence);
```

### Transform from Universal Format

```typescript
// To platform-specific format
const universal = {
  name: 'ProductCard',
  category: 'component',
  fields: [
    { name: 'productName', type: 'Text', required: true },
    { name: 'price', type: 'Decimal', required: true },
    { name: 'image', type: 'Media', required: false }
  ]
};

const platformType = await provider.transformFromUniversal(universal);

// Handle fallbacks
if (platformType.metadata?.fallbacksUsed) {
  console.warn('Fallbacks used:', platformType.metadata.fallbacksUsed);
}
```

### Batch Transformations

```typescript
// Transform multiple types
const universalTypes = [type1, type2, type3];

const platformTypes = await Promise.all(
  universalTypes.map(type => provider.transformFromUniversal(type))
);

// With error handling
const results = await Promise.allSettled(
  universalTypes.map(type => provider.transformFromUniversal(type))
);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);

const failed = results
  .filter(r => r.status === 'rejected')
  .map(r => r.reason);
```

## Validation API

### Basic Validation

```typescript
// Validate a content type
const validation = await provider.validateContentType({
  name: 'MyPage',
  category: 'page',
  fields: [
    { name: 'title', type: 'Text', required: true }
  ]
});

// Check results
if (validation.valid) {
  console.log('Confidence:', validation.confidence);
} else {
  console.error('Errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}

// Threshold-based handling
if (validation.confidence > 70) {
  // Automatic application
  await provider.createContentType(definition);
} else if (validation.confidence > 50) {
  // Manual review required
  await requestManualReview(definition, validation);
} else {
  // Rejection
  throw new Error('Content type validation failed');
}
```

### Custom Validation Rules

```typescript
// Add custom validators
const customValidation = async (type: UniversalContentType) => {
  const errors = [];
  const warnings = [];

  // Project-specific rules
  if (type.category === 'page' && !type.fields.find(f => f.name === 'seoTitle')) {
    warnings.push({
      field: 'seoTitle',
      message: 'Pages should include SEO title',
      severity: 'warning'
    });
  }

  // Business logic validation
  if (type.name.startsWith('Product') && !type.fields.find(f => f.name === 'sku')) {
    errors.push({
      field: 'sku',
      message: 'Product types must have SKU field',
      severity: 'error'
    });
  }

  return { errors, warnings };
};

// Combine with provider validation
const providerValidation = await provider.validateContentType(type);
const customResults = await customValidation(type);

const combined = {
  valid: providerValidation.valid && customResults.errors.length === 0,
  errors: [...providerValidation.errors, ...customResults.errors],
  warnings: [...providerValidation.warnings, ...customResults.warnings],
  confidence: providerValidation.confidence
};
```

## Capabilities API

### Checking Provider Capabilities

```typescript
// Get all capabilities
const capabilities = provider.getCapabilities();

// Check specific capabilities
if (capabilities.supportsNestedTypes) {
  // Can use nested content structures
}

if (capabilities.supportedFieldTypes.includes('JSON')) {
  // Can use JSON fields directly
} else {
  // Need to use fallback strategy
}

// Check limits
if (type.fields.length > capabilities.maxFieldsPerType) {
  throw new Error(`Exceeds maximum ${capabilities.maxFieldsPerType} fields`);
}
```

### Capability-Based Decisions

```typescript
// Choose provider based on capabilities
function selectBestProvider(requirements: RequiredCapabilities): string {
  const providers = registry.getAllProviders();
  
  for (const [name, provider] of providers) {
    const caps = provider.getCapabilities();
    
    if (meetsRequirements(caps, requirements)) {
      return name;
    }
  }
  
  // Fallback to mock if no provider meets requirements
  return 'mock';
}

// Dynamic field type selection
function selectFieldType(idealType: string, provider: ICMSProvider): string {
  const caps = provider.getCapabilities();
  
  if (caps.supportedFieldTypes.includes(idealType)) {
    return idealType;
  }
  
  // Use fallback mapping
  return caps.fieldTypeFallbacks?.[idealType] || 'Text';
}
```

## Error Handling Patterns

### Standard Error Responses

```typescript
// Provider errors should follow this format
interface ProviderError {
  code: string;
  message: string;
  details?: any;
  suggestion?: string;
}

// Example error handling
try {
  const result = await provider.createContentType(definition);
} catch (error) {
  if (error.code === 'DUPLICATE_TYPE') {
    // Handle duplicate
    const existing = await provider.getContentType(definition.name);
    // Update instead of create
  } else if (error.code === 'VALIDATION_FAILED') {
    // Show validation errors
    console.error('Validation errors:', error.details);
  } else if (error.code === 'PLATFORM_LIMIT') {
    // Handle platform limitations
    console.warn('Platform limit reached:', error.message);
  } else {
    // Unknown error
    throw error;
  }
}
```

### Retry Patterns

```typescript
// Exponential backoff retry
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (!isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Usage
const result = await retryOperation(
  () => provider.createContentType(definition)
);
```

## Performance Optimization

### Caching Patterns

```typescript
// Simple cache implementation
class CachedProvider implements ICMSProvider {
  private cache = new Map<string, CacheEntry>();
  private cacheTTL = 60000; // 1 minute
  
  async getContentType(id: string): Promise<UniversalContentType | null> {
    // Check cache
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    // Fetch from provider
    const data = await this.provider.getContentType(id);
    
    // Update cache
    if (data) {
      this.cache.set(id, {
        data,
        timestamp: Date.now()
      });
    }
    
    return data;
  }
  
  // Invalidate cache on updates
  async updateContentType(id: string, definition: UniversalContentType) {
    const result = await this.provider.updateContentType(id, definition);
    
    if (result.success) {
      this.cache.delete(id);
    }
    
    return result;
  }
}
```

### Batch Operations

```typescript
// Batch create with progress
async function batchCreateContentTypes(
  types: UniversalContentType[],
  provider: ICMSProvider,
  onProgress?: (completed: number, total: number) => void
): Promise<ContentTypeResult[]> {
  const results: ContentTypeResult[] = [];
  const total = types.length;
  
  // Process in chunks
  const chunkSize = 5;
  for (let i = 0; i < total; i += chunkSize) {
    const chunk = types.slice(i, i + chunkSize);
    
    const chunkResults = await Promise.all(
      chunk.map(type => provider.createContentType(type))
    );
    
    results.push(...chunkResults);
    
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, total), total);
    }
  }
  
  return results;
}
```

## WebSocket/Real-time Updates

```typescript
// Real-time provider updates
class RealtimeProvider extends EventEmitter implements ICMSProvider {
  private ws: WebSocket;
  
  constructor(config: ProviderConfig) {
    super();
    this.ws = new WebSocket(config.wsUrl);
    
    this.ws.on('message', (data) => {
      const event = JSON.parse(data);
      
      switch (event.type) {
        case 'typeCreated':
          this.emit('created', event.data);
          break;
        case 'typeUpdated':
          this.emit('updated', event.data);
          break;
        case 'typeDeleted':
          this.emit('deleted', event.id);
          break;
      }
    });
  }
  
  // Subscribe to changes
  onTypeChange(callback: (event: any) => void) {
    this.on('created', callback);
    this.on('updated', callback);
    this.on('deleted', callback);
  }
}

// Usage
provider.onTypeChange((event) => {
  console.log('Type changed:', event);
  // Update UI or cache
});
```

## Testing Provider Implementations

### Unit Testing

```typescript
describe('Provider Implementation', () => {
  let provider: ICMSProvider;
  
  beforeEach(() => {
    provider = new MyProvider();
  });
  
  describe('createContentType', () => {
    it('should create valid type', async () => {
      const type = {
        name: 'TestType',
        category: 'page' as const,
        fields: [
          { name: 'title', type: 'Text' as const, required: true }
        ]
      };
      
      const result = await provider.createContentType(type);
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('TestType');
    });
    
    it('should handle validation errors', async () => {
      const invalidType = {
        name: '',
        category: 'invalid' as any,
        fields: []
      };
      
      const result = await provider.createContentType(invalidType);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Integration Testing

```typescript
describe('Provider Integration', () => {
  it('should work with type system', async () => {
    const typeSystem = new UniversalTypeSystem();
    typeSystem.selectProvider('my-provider');
    
    const result = await typeSystem.createContentType({
      name: 'IntegrationTest',
      category: 'component',
      fields: [
        { name: 'test', type: 'Text', required: true }
      ]
    });
    
    expect(result.success).toBe(true);
  });
});
```

## Migration Patterns

### Migrating Between Providers

```typescript
async function migrateContentTypes(
  sourceProvider: ICMSProvider,
  targetProvider: ICMSProvider,
  options?: MigrationOptions
): Promise<MigrationResult> {
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  // Get all types from source
  const sourceTypes = await sourceProvider.listContentTypes();
  
  for (const type of sourceTypes) {
    try {
      // Check if should migrate
      if (options?.filter && !options.filter(type)) {
        results.skipped.push(type.name);
        continue;
      }
      
      // Transform if needed
      let targetType = type;
      if (options?.transform) {
        targetType = await options.transform(type);
      }
      
      // Validate for target platform
      const validation = await targetProvider.validateContentType(targetType);
      
      if (validation.valid || options?.force) {
        // Create in target
        const result = await targetProvider.createContentType(targetType);
        
        if (result.success) {
          results.successful.push(type.name);
        } else {
          results.failed.push({
            name: type.name,
            error: result.error
          });
        }
      } else {
        results.failed.push({
          name: type.name,
          error: 'Validation failed',
          validation
        });
      }
    } catch (error) {
      results.failed.push({
        name: type.name,
        error: error.message
      });
    }
  }
  
  return results;
}
```

## Best Practices

1. **Always validate before operations**
2. **Handle errors gracefully with meaningful messages**
3. **Implement proper retry logic for transient failures**
4. **Cache frequently accessed data**
5. **Use batch operations for better performance**
6. **Document provider-specific behavior**
7. **Version your API responses**
8. **Implement proper logging**
9. **Use TypeScript for type safety**
10. **Write comprehensive tests**

## API Reference Summary

### Core Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `createContentType` | Creates new content type | `Promise<ContentTypeResult>` |
| `updateContentType` | Updates existing type | `Promise<ContentTypeResult>` |
| `deleteContentType` | Deletes content type | `Promise<void>` |
| `getContentType` | Gets single type | `Promise<UniversalContentType \| null>` |
| `listContentTypes` | Lists all types | `Promise<UniversalContentType[]>` |
| `transformToUniversal` | Transform to universal | `Promise<UniversalContentType>` |
| `transformFromUniversal` | Transform from universal | `Promise<any>` |
| `validateContentType` | Validate type definition | `Promise<ValidationResult>` |
| `getCapabilities` | Get provider capabilities | `ProviderCapabilities` |

### Response Types

| Type | Description |
|------|-------------|
| `ContentTypeResult` | Operation result with success/error |
| `ValidationResult` | Validation with errors/warnings/confidence |
| `UniversalContentType` | Universal type definition |
| `UniversalField` | Field definition |
| `ProviderCapabilities` | Provider feature support |

### Error Codes

| Code | Description |
|------|-------------|
| `DUPLICATE_TYPE` | Type already exists |
| `VALIDATION_FAILED` | Validation errors |
| `PLATFORM_LIMIT` | Platform limitation reached |
| `TRANSFORMATION_FAILED` | Cannot transform type |
| `NOT_FOUND` | Type not found |
| `PERMISSION_DENIED` | Insufficient permissions |
| `NETWORK_ERROR` | Connection issues |