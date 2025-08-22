# AI Site Generator Service

## Overview

The AI Site Generator Service orchestrates the entire website creation process through multiple phases, transforming business requirements into a complete site structure with content types and pages.

## Installation

```typescript
import { AISiteGeneratorService } from '@/lib/services/ai-site-generator';

const generator = new AISiteGeneratorService();
```

## API Reference

### `generateSite(requirements: string, websiteId: string): Promise<GenerationResult>`

Main entry point for site generation.

**Parameters:**
- `requirements` - Business requirements in natural language
- `websiteId` - Target website ID

**Returns:**
```typescript
interface GenerationResult {
  id: string;
  sitemap: SiteNode[];
  contentTypes: ContentType[];
  pages: Page[];
  status: 'success' | 'partial' | 'failed';
  errors?: GenerationError[];
}
```

### `getProgress(generationId: string): GenerationProgress`

Get the current progress of a generation.

**Returns:**
```typescript
interface GenerationProgress {
  phase: 'sitemap' | 'types' | 'pages' | 'content' | 'complete';
  percentage: number;
  message: string;
  errors: string[];
}
```

### `cancelGeneration(generationId: string): Promise<void>`

Cancel an ongoing generation and trigger rollback.

### `rollback(generationId: string): Promise<void>`

Rollback a failed or cancelled generation.

## Generation Phases

### Phase 1: Sitemap Generation
- Generates hierarchical site structure from requirements
- Validates against depth and page count constraints
- Returns structured JSON with pages and relationships

### Phase 2: Content Type Discovery
- Analyzes sitemap to identify unique content types
- Categorizes types as 'page' or 'component'
- Suggests appropriate fields based on type names

### Phase 3: Content Type Creation
- Creates content types in the database
- Reuses existing types when found
- Maps universal types to platform-specific formats

### Phase 4: Page Creation
- Creates pages with proper parent-child relationships
- Generates hierarchical slugs (parent/child format)
- Associates pages with content types

## Configuration

```typescript
const AI_SITE_GENERATOR_CONFIG = {
  MAX_PAGES: 10,          // Maximum pages per site
  MAX_DEPTH: 3,           // Maximum hierarchy depth
  MAX_RETRIES: 3,         // AI operation retry limit
  CHUNK_SIZE: 10,         // Pages per chunk
  MAX_CONTEXT_TOKENS: 8000,
  RETRY_DELAY: 2000,      // ms between retries
  MAX_BREADTH: 20,        // Maximum children per node
  GENERATION_TIMEOUT: 20000, // 20 seconds
};
```

## Usage Examples

### Basic Site Generation

```typescript
const generator = new AISiteGeneratorService();

const result = await generator.generateSite(
  'Create a portfolio website for a design agency with case studies',
  'website-123'
);

if (result.status === 'success') {
  console.log(`Created ${result.pages.length} pages`);
  console.log(`Created ${result.contentTypes.length} content types`);
}
```

### With Progress Tracking

```typescript
const generator = new AISiteGeneratorService();

// Start generation
const generationPromise = generator.generateSite(requirements, websiteId);

// Poll for progress
const progressInterval = setInterval(() => {
  const progress = generator.getProgress(generationId);
  console.log(`${progress.phase}: ${progress.percentage}%`);
  
  if (progress.phase === 'complete') {
    clearInterval(progressInterval);
  }
}, 1000);

const result = await generationPromise;
```

### Error Handling

```typescript
try {
  const result = await generator.generateSite(requirements, websiteId);
  
  if (result.status === 'failed') {
    console.error('Generation failed:', result.errors);
    // Rollback is automatic
  } else if (result.status === 'partial') {
    console.warn('Partial success:', result.errors);
    // Some pages/types were created
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Validation Rules

### Sitemap Validation
- Maximum depth: 3 levels
- Maximum pages: 10 (MVP limit)
- Maximum breadth: 20 children per node
- Slug format: lowercase alphanumeric with hyphens
- No duplicate slugs allowed

### Content Type Validation
- Category must be 'page' or 'component'
- Page types should include title and slug fields
- Component types should be focused (≤8 fields recommended)
- Names must be unique within a website

## Error Recovery

The service includes automatic error recovery:
- **Retry Logic**: Failed AI operations retry up to 3 times
- **Rollback**: Failed generations trigger automatic rollback
- **Partial Success**: Continues with other items on individual failures
- **Context Preservation**: Maintains context between retries

## Performance Considerations

- **Context Window Management**: Large sites are processed in chunks
- **Parallel Processing**: Content types and pages created concurrently where possible
- **Caching**: Existing types are reused to avoid duplication
- **Timeout**: 20-second limit for MVP scope (10 pages)

## Limitations (MVP)

- Maximum 10 pages per site
- Maximum 3 levels of hierarchy
- Basic content types only (no complex relationships)
- Mock AI implementation for testing
- Limited to English language
- No content population (planned for future)

## Future Enhancements

- Content population (Story 8.6)
- Support for larger sites (100+ pages)
- Multi-language support
- Custom content type templates
- Advanced relationship mapping
- Real-time collaboration
- Version control for generated sites