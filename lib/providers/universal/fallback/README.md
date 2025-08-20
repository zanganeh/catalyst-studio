# Fallback Strategies Documentation

## Overview

The fallback system provides strategies for handling type incompatibilities when converting between different CMS platforms. When a direct type mapping is not available or would result in significant data loss, the system applies one of five fallback strategies.

## Fallback Strategies

### 1. BEST_MATCH Strategy
**When Applied**: Default strategy for most type conversions
**Confidence**: 70-95%
**Description**: Finds the closest compatible type in the target platform

Example:
```typescript
// Slug pattern → Text primitive
{
  pattern: CommonPattern.SLUG,
  editable: true
}
// Becomes:
{
  type: PrimitiveType.TEXT,
  pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  maxLength: 255
}
```

### 2. FLATTEN Strategy
**When Applied**: Complex nested structures that exceed platform capabilities
**Confidence**: 50-70%
**Description**: Simplifies complex types to basic equivalents

Example:
```typescript
// Nested component structure
{
  type: 'hero',
  sections: [
    { type: 'text', content: '...' },
    { type: 'image', src: '...' }
  ]
}
// Becomes:
'{"type":"hero","sections":[...]}'
```

### 3. PRESERVE Strategy
**When Applied**: Rich content that would lose significant formatting
**Confidence**: 100% (data preserved)
**Description**: Stores complete data as JSON with metadata

Example:
```typescript
// Rich text with custom blocks
{
  blocks: [...],
  entityMap: {...}
}
// Becomes:
{
  _type: 'preserved',
  _originalType: 'pattern:richText',
  _data: { blocks: [...], entityMap: {...} },
  _fallback: {
    markdown: '...',
    plaintext: '...'
  }
}
```

### 4. DOCUMENT Strategy
**When Applied**: Complex migrations requiring manual intervention
**Confidence**: 60%
**Description**: Adds detailed migration instructions

Example:
```typescript
// Complex component with platform-specific features
{
  _migration: {
    sourceType: 'optimizely:ContentArea',
    targetPlatform: 'contentful',
    migrationSteps: [...],
    considerations: [...]
  },
  _original: {...}
}
```

### 5. REJECT Strategy
**When Applied**: No safe conversion possible
**Confidence**: 0%
**Description**: Fails with clear error message

Example:
```typescript
{
  strategy: 'REJECT',
  success: false,
  errors: [
    'Cannot convert optimizely:PersonalizationRule to strapi',
    'Feature not supported in target platform'
  ]
}
```

## Data Preservation Guarantees

### High Preservation (90-100%)
- PRESERVE strategy: Complete data retained in JSON
- BEST_MATCH with primitives: Direct type mapping
- Collections without complex items

### Medium Preservation (70-89%)
- BEST_MATCH with patterns: Some features may be simplified
- DOCUMENT strategy: Data retained with instructions
- Rich text to markdown conversion

### Low Preservation (50-69%)
- FLATTEN strategy: Structure lost but content preserved
- Complex patterns to primitives
- Media with extensive metadata

## Recovery Procedures

### From PRESERVE Strategy
```typescript
const preserved = /* preserved data */;
const original = preserved._data;
// Full original data available
```

### From DOCUMENT Strategy
```typescript
const documented = /* documented data */;
const original = documented._original;
// Follow _migration.reverseInstructions
```

### From FLATTEN Strategy
```typescript
const flattened = /* flattened string */;
const parsed = JSON.parse(flattened);
// Reconstruct structure manually
```

## Examples by Type

### Rich Text Fallbacks

#### HTML to Markdown
```typescript
// Input: HTML rich text
"<h1>Title</h1><p>Content with <strong>bold</strong></p>"

// Output: Markdown
"# Title\n\nContent with **bold**"

// Confidence: 85%
// Lost: Custom styles, complex tables
// Preserved: Structure, basic formatting
```

#### Portable Text to JSON
```typescript
// Input: Sanity Portable Text
[
  {
    _type: 'block',
    children: [...]
  }
]

// Output: Preserved JSON
{
  _type: 'preserved_rich_text',
  _format: 'portable-text',
  _content: [...],
  _fallback: {
    markdown: '...',
    plaintext: '...'
  }
}

// Confidence: 100%
// Lost: None (preserved)
// Preserved: Everything
```

### Media Fallbacks

#### Media Object to URL
```typescript
// Input: Complex media object
{
  url: 'https://example.com/image.jpg',
  alt: 'Description',
  width: 1920,
  height: 1080,
  metadata: {...}
}

// Output: URL string
"https://example.com/image.jpg"

// Confidence: 60%
// Lost: Alt text, dimensions, metadata
// Preserved: URL
```

#### Media to JSON Reference
```typescript
// Input: Platform-specific media
{
  assetId: '123',
  url: '...',
  thumbnails: [...]
}

// Output: Reference format
{
  id: 'media_123',
  type: 'image',
  url: '...',
  metadata: {...}
}

// Confidence: 80%
// Lost: Platform-specific features
// Preserved: Core media data
```

### Component Fallbacks

#### Nested Component to JSON
```typescript
// Input: Complex component
{
  type: 'accordion',
  items: [
    { title: '...', content: {...} }
  ]
}

// Output: Preserved structure
{
  type: 'accordion',
  fields: {
    items: [...]
  },
  metadata: {
    schema: {...}
  }
}

// Confidence: 90%
// Lost: Component validation
// Preserved: Structure and data
```

### Collection Fallbacks

#### Dynamic Zone to Array
```typescript
// Input: Strapi dynamic zone
[
  { __component: 'hero', ... },
  { __component: 'text', ... }
]

// Output: Generic array
[
  { _type: 'hero', ... },
  { _type: 'text', ... }
]

// Confidence: 85%
// Lost: Component validation
// Preserved: Order and content
```

## Best Practices

### Choosing a Strategy

1. **Start with BEST_MATCH**: Try to find compatible type first
2. **Use PRESERVE for rich content**: Maintain formatting for later processing
3. **Apply FLATTEN for simple platforms**: When target has limited capabilities
4. **DOCUMENT complex migrations**: Provide clear instructions
5. **REJECT when unsafe**: Better to fail than corrupt data

### Configuring Options

```typescript
const options: FallbackOptions = {
  preferredStrategy: FallbackStrategy.BEST_MATCH,
  maxDataLoss: 20, // Maximum 20% data loss acceptable
  preserveMetadata: true,
  documentChanges: true,
  strictMode: false,
  confidenceThreshold: 70
};
```

### Handling Results

```typescript
const result = FallbackExecutor.execute(
  value,
  sourceType,
  targetPlatform,
  options
);

if (result.success) {
  // Check confidence and warnings
  if (result.confidence < 80) {
    console.warn('Low confidence transformation:', result.warnings);
  }
  
  // Use transformed data
  const transformed = result.output;
  
  // Store metadata for reversal
  if (result.metadata?.reversible) {
    saveMetadata(result.metadata);
  }
} else {
  // Handle rejection
  console.error('Fallback failed:', result.errors);
  // Manual intervention required
}
```

## Platform-Specific Considerations

### Optimizely
- ContentArea → Collection with metadata
- XhtmlString → Markdown conversion
- Blocks → Component preservation

### Contentful
- RichText → Structured format preservation
- References → ID-based linking
- 10-level nesting limit enforcement

### Strapi
- Dynamic Zones → Flexible collections
- Components → Direct mapping usually possible
- Relations → Reference preservation

### Sanity
- Portable Text → Complex preservation needed
- References → Weak reference support
- Real-time features → Lost in fallback

## Performance Considerations

- **PRESERVE**: Fast but increases storage
- **FLATTEN**: Fast but loses structure
- **BEST_MATCH**: Moderate, requires analysis
- **DOCUMENT**: Slow, generates instructions
- **REJECT**: Fast, immediate failure

## Migration Workflow

1. **Analyze**: Determine fallback needs
2. **Configure**: Set appropriate options
3. **Execute**: Apply fallback strategy
4. **Validate**: Check transformation results
5. **Document**: Record any manual steps needed
6. **Test**: Verify with sample content
7. **Monitor**: Track confidence scores in production