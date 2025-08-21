# Content Type Category Field API Documentation

## Overview

As of Story 7.4a, all content types in Catalyst Studio now include an explicit `category` field that distinguishes between two types of content:

- **Page**: Routable content with its own URL (e.g., blog posts, product pages, landing pages)
- **Component**: Reusable content blocks that can be embedded in pages (e.g., hero sections, CTAs, testimonials)

## API Changes

### ContentType Interface

```typescript
interface ContentType {
  id: string;
  name: string;
  pluralName: string;
  icon: string;
  description?: string;
  category: 'page' | 'component'; // NEW: Required field
  fields: Field[];
  relationships: Relationship[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema

```prisma
model ContentType {
  id          String   @id @default(cuid())
  websiteId   String
  name        String
  category    String   @default("page") // NEW: Database column
  fields      Json
  settings    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  @@unique([websiteId, name])
}
```

## API Endpoints

### Create Content Type

**POST** `/api/content-types`

```json
{
  "websiteId": "website-123",
  "name": "BlogPost",
  "pluralName": "BlogPosts",
  "icon": "📝",
  "category": "page", // Optional, defaults to "page"
  "fields": [],
  "relationships": []
}
```

**Response:**
```json
{
  "id": "contenttype-abc",
  "websiteId": "website-123",
  "name": "BlogPost",
  "pluralName": "BlogPosts",
  "icon": "📝",
  "category": "page",
  "fields": [],
  "relationships": [],
  "createdAt": "2024-01-21T10:00:00Z",
  "updatedAt": "2024-01-21T10:00:00Z"
}
```

### Update Content Type

**PUT** `/api/content-types/{id}`

```json
{
  "name": "UpdatedBlogPost",
  "category": "component" // Can change category
}
```

### Get Content Type

**GET** `/api/content-types/{id}`

Response includes the `category` field.

### List Content Types

**GET** `/api/content-types?websiteId={websiteId}`

Optional query parameters:
- `category`: Filter by category (`page` or `component`)

Example: `/api/content-types?websiteId=123&category=component`

## JavaScript/TypeScript Usage

### Creating Content Types

```typescript
import { createContentType } from '@/lib/content-types/types';

// Default to page category
const pageType = createContentType('BlogPost');
console.log(pageType.category); // 'page'

// Explicit page category
const articleType = createContentType('Article', 'page');

// Component category
const heroType = createContentType('HeroSection', 'component');
console.log(heroType.category); // 'component'
```

### Using Content Type Context

```typescript
import { useContentTypes } from '@/lib/context/content-type-context';

function MyComponent() {
  const { createContentType } = useContentTypes();
  
  // Create a new page type
  const newPageType = createContentType('LandingPage', 'page');
  
  // Create a new component type
  const newComponentType = createContentType('CallToAction', 'component');
}
```

## UI Components

### CategorySelectorModal

A modal component for selecting content type category during creation:

```tsx
import { CategorySelectorModal } from '@/components/content-builder/category-selector-modal';

function ContentBuilder() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <CategorySelectorModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSelect={(category) => {
        // category will be 'page' or 'component'
        console.log('Selected category:', category);
      }}
    />
  );
}
```

## Migration Notes

### For Existing Content Types

Content types created before this update will automatically default to `category: 'page'` when loaded. No manual migration is required.

### Database Migration

The migration adds a `category` column with a default value of `'page'`:

```sql
ALTER TABLE "ContentType" 
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'page';
```

## Validation Rules

### Category Values
- Only accepts: `'page'` or `'component'`
- Required field (cannot be null or undefined)
- Defaults to `'page'` if not specified

### TypeScript Type Safety
The category field is strongly typed as a union type:
```typescript
type ContentTypeCategory = 'page' | 'component';
```

## AI Integration

### Prompt Processing

The AI prompt processor now detects category based on content patterns:

```typescript
// Component patterns trigger 'component' category
/component|widget|block|section|element|reusable|modular|embed/i

// Page patterns or default trigger 'page' category
/page|article|post|landing|product|about|contact/i
```

### Universal Type Generation

When generating content types via AI, the category is determined by:
1. Explicit mention in the prompt
2. Pattern detection in the description
3. Default to 'page' for ambiguous cases

## Best Practices

1. **Choose the Right Category**
   - Use `page` for content that needs its own URL
   - Use `component` for reusable content blocks

2. **Icon Conventions**
   - Pages typically use 📄 icon
   - Components typically use 🧩 icon

3. **Naming Conventions**
   - Pages: Often end with "Page" (e.g., `BlogPage`, `ProductPage`)
   - Components: Descriptive of function (e.g., `HeroSection`, `Testimonial`)

4. **Category-Specific Features**
   - Pages may include SEO fields, slugs, and routing information
   - Components focus on visual presentation and reusability

## Examples

### Creating a Blog Post (Page)
```typescript
const blogPost = {
  name: 'BlogPost',
  category: 'page',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    { name: 'publishDate', type: 'date', required: false }
  ]
};
```

### Creating a Hero Section (Component)
```typescript
const heroSection = {
  name: 'HeroSection',
  category: 'component',
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'text', required: false },
    { name: 'backgroundImage', type: 'image', required: false },
    { name: 'ctaButton', type: 'reference', required: false }
  ]
};
```

## Backward Compatibility

- Existing APIs continue to work
- Category defaults to `'page'` if not specified
- No breaking changes to existing content types
- Migration handles legacy data automatically

## Future Enhancements

Potential future category types:
- `layout`: Page layout templates
- `partial`: Smaller reusable fragments
- `email`: Email templates
- `api`: API response structures

These would require additional schema changes and are not part of the current implementation.