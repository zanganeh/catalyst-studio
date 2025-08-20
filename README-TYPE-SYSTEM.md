# Universal Type System - Quick Start Guide

## Installation

```bash
npm install @catalyst/universal-types @catalyst/optimizely-provider
```

## Basic Setup

```typescript
import { createTypeSystem } from '@catalyst/universal-types';
import { createOptimizelyProvider } from '@catalyst/optimizely-provider';

// Initialize type system with provider
const typeSystem = createTypeSystem({
  providers: [createOptimizelyProvider()],
  defaultPlatform: 'optimizely'
});
```

## Creating Primitives

### Using Factory Functions

```typescript
import { createTextPrimitive, createNumberPrimitive } from '@catalyst/universal-types';

// Create a text field
const titleField = createTextPrimitive({
  maxLength: 100,
  required: true,
  pattern: '^[A-Z].*' // Must start with capital letter
});

// Create a number field
const priceField = createNumberPrimitive({
  min: 0,
  max: 10000,
  precision: 2,
  required: true
});
```

### Using Classes Directly

```typescript
import { TextPrimitive, DatePrimitive } from '@catalyst/universal-types';

const description = new TextPrimitive({
  maxLength: 500,
  trim: true
});

const publishDate = new DatePrimitive({
  includeTime: false,
  minDate: new Date()
});
```

## Validation

```typescript
// Validate a value
const result = titleField.validate('Hello World');
if (result.valid) {
  console.log('Value is valid!');
} else {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}

// Validate with type system (includes platform compatibility)
const systemResult = typeSystem.validate(titleField, 'optimizely');
```

## Transformation

```typescript
// Transform value to match primitive constraints
const transformed = priceField.transform('42.999');
console.log(transformed.value); // 43.00 (rounded to 2 decimal places)

// Transform between platforms
const htmlContent = '<p>Rich text content</p>';
const result = typeSystem.transform(
  htmlContent,
  'optimizely',  // from platform
  'contentful',  // to platform
  CommonPattern.RICH_TEXT
);
```

## Platform Compatibility

```typescript
// Check if a type is compatible with a platform
const compatibility = typeSystem.checkCompatibility(
  PrimitiveType.TEXT,
  'optimizely'
);

console.log(`Compatibility: ${compatibility.confidence}%`);
console.log('Warnings:', compatibility.warnings);
```

## Common Patterns

```typescript
import { CommonPattern } from '@catalyst/universal-types';

// Rich Text
const richTextField = {
  pattern: CommonPattern.RICH_TEXT,
  format: 'html'
};

// Media/Asset
const imageField = {
  pattern: CommonPattern.MEDIA,
  allowedTypes: ['image/jpeg', 'image/png']
};

// Collection
const tagsField = {
  pattern: CommonPattern.TAGS,
  maxItems: 10
};
```

## Advanced Usage

### Custom Validation

```typescript
const emailField = createTextPrimitive({
  pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
  lowercase: true,
  trim: true
});
```

### Decimal Precision

```typescript
const currencyField = createDecimalPrimitive({
  precision: 10,  // Total digits
  scale: 2,       // Decimal places
  min: '0.00',
  max: '999999.99'
});
```

### Date Ranges

```typescript
const eventDate = createDatePrimitive({
  minDate: new Date(),
  maxDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  includeTime: true
});
```

### JSON Structures

```typescript
const configField = createJsonPrimitive({
  maxDepth: 5,
  maxSize: 1024 * 100, // 100KB
  schema: {
    // JSON Schema validation (if implemented)
  }
});
```

## Type Detection

```typescript
import { primitiveRegistry } from '@catalyst/universal-types';

// Detect type from value
const detectedType = primitiveRegistry.detectType('Hello World');
console.log(detectedType); // 'text'

// Create primitive from value
const primitive = primitiveRegistry.createFromValue(42.5, {
  required: true
});
console.log(primitive.typeId); // 'decimal' or 'number'
```

## Serialization

```typescript
// Convert to JSON
const json = titleField.toJSON();
console.log(json);
// { type: 'text', maxLength: 100, required: true, pattern: '^[A-Z].*' }

// Restore from JSON
const restored = primitiveRegistry.fromJSON(json);
```

## Multiple Providers

```typescript
// Register multiple providers
const typeSystem = createTypeSystem({
  providers: [
    createOptimizelyProvider(),
    createContentfulProvider(),
    createStrapiProvider()
  ]
});

// Check support across platforms
const platforms = typeSystem.getPlatforms();
console.log('Supported platforms:', platforms);

// Transform between any registered platforms
const result = typeSystem.transform(
  value,
  'optimizely',
  'contentful',
  PrimitiveType.TEXT
);
```

## Error Handling

```typescript
try {
  // Create with invalid config
  const invalid = createNumberPrimitive({
    min: 100,
    max: 50  // Error: min > max
  });
} catch (error) {
  console.error('Configuration error:', error.message);
}

// Handle transformation failures
const result = numberField.transform('not a number');
if (!result.success) {
  console.error('Transformation failed:', result.warnings);
}
```

## Best Practices

1. **Always validate configuration** - The system throws errors for invalid configs
2. **Check transformation results** - Transformations may have warnings
3. **Use appropriate primitive types** - Text for <256 chars, LongText for more
4. **Handle platform differences** - Check compatibility before migrations
5. **Cache type instances** - Reuse primitives when possible

## API Reference

### TypeSystem Methods
- `validate(type, platform?)` - Validate a type definition
- `transform(value, from, to, type)` - Transform between platforms
- `checkCompatibility(type, platform?)` - Check platform compatibility
- `getExtensions(platform)` - Get platform-specific extensions
- `getPlatforms()` - List registered platforms

### Primitive Methods
- `validate(value)` - Validate a value
- `transform(value)` - Transform a value
- `getDefaultValue()` - Get default value
- `clone(config?)` - Create a copy with new config
- `serialize()` - Convert to plain object
- `toJSON()` - Convert to JSON

### Registry Methods
- `create(typeId, config?)` - Create primitive by ID
- `detectType(value)` - Detect type from value
- `fromJSON(json)` - Create from JSON
- `registerCustomType(id, class)` - Register custom primitive

## Support

For issues or questions, please refer to the [architecture documentation](./docs/architecture/type-system-complete.md) or create an issue in the repository.