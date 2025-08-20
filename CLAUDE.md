# CLAUDE.md - AI Integration Guide

## Universal Type Generation System

### Overview
The Universal Type Generation system provides a hybrid static/dynamic approach for AI-powered content type creation. It combines static templates and rules with dynamic awareness of existing types to prevent duplication and ensure consistency.

### Key Features
- **Dynamic Type Loading**: Automatically discovers primitive types and existing content types
- **Duplicate Prevention**: Checks for existing types before creation
- **Component Reuse**: Identifies and suggests reusable components
- **Confidence Scoring**: Evaluates generated types with 0-100% confidence
- **Platform Compatibility**: Maps universal types to platform-specific implementations
- **Session Awareness**: Tracks types created within the same session

### Commands

#### Generate a New Content Type
```bash
npm run generate:type
```
Launches the type generation workflow with dynamic context.

#### Refresh Type Cache
```bash
npm run refresh:types
```
Refreshes the dynamic type cache for current project.

#### Validate a Type Definition
```bash
npm run validate:type
```
Validates a type definition against rules and existing types.

#### List Available Types
```bash
npm run list:types
```
Shows all available primitive types and existing content types.

### Usage Examples

#### Basic Type Generation
```typescript
// The AI will use dynamic context to generate appropriate type
const request = {
  category: 'page',
  purpose: 'blog articles with rich content'
};

// System checks:
// 1. BlogPost already exists? → Suggest reuse
// 2. No BlogPost? → Generate new type
// 3. Similar types exist? → Suggest extension
```

#### With Validation
```typescript
const newType = {
  name: 'EventPage',
  category: 'page',
  fields: [
    { name: 'title', type: 'Text', required: true },
    { name: 'eventDate', type: 'Date', required: true }
  ]
};

// Validation checks:
// - Name uniqueness
// - Field type validity
// - Naming conventions
// - Confidence score: 85%
```

### Architecture

#### Dynamic Loaders
- `primitive-type-loader.ts`: Discovers all primitive types
- `database-type-loader.ts`: Loads existing content types (filtered by project)
- `property-loader.ts`: Identifies reusable properties

#### Static Templates
- `generation-rules.md`: Rules for type generation
- `content-type-generation.md`: Template for new types
- `duplication-check.md`: Template for duplicate detection

#### Validation System
- `validator.ts`: Validates type definitions
- `confidence-scorer.ts`: Calculates confidence scores

### Troubleshooting

#### Issue: Types Not Loading
```bash
# Check if loaders can access type directories
ls lib/providers/universal/types/primitives/

# Verify database connection
npm run prisma:studio
```

#### Issue: Duplicate Types Created
```bash
# Refresh type cache
npm run refresh:types

# Check existing types
npm run list:types
```

#### Issue: Low Confidence Scores
- Ensure all fields use valid primitive types
- Add validation rules to required fields
- Follow naming conventions (PascalCase for types, camelCase for fields)

### Type Reuse Patterns

#### Pattern 1: Direct Reuse
```
Request: "I need a blog post type"
Existing: BlogPost type exists
Action: USE EXISTING BlogPost
```

#### Pattern 2: Extension
```
Request: "I need a news article with video"
Existing: ArticlePage exists (80% match)
Action: EXTEND ArticlePage with video field
```

#### Pattern 3: Component Reuse
```
Request: "Page with rich content sections"
Existing: ContentArea component exists
Action: REUSE ContentArea in new type
```

### Platform Mapping

#### Optimizely
- Text → String
- LongText → XhtmlString
- Media → ContentReference
- JSON → String (serialized)

#### Contentful
- Text → Symbol
- LongText → RichText
- Media → Asset
- JSON → Object

#### Strapi
- Text → string
- LongText → richtext
- Media → media
- JSON → json

### Best Practices

1. **Always Check Existing Types First**
   - Prevents duplication
   - Maintains consistency
   - Reduces complexity

2. **Use Appropriate Primitive Types**
   - Text for short content (max 255 chars)
   - LongText for rich content
   - Number for integers
   - Decimal for precise values

3. **Include Validation Rules**
   - Required fields should have validation
   - Use patterns for specific formats (email, URL)
   - Set appropriate min/max constraints

4. **Leverage Components**
   - Reuse ContentArea for flexible content
   - Use CTAComponent for calls-to-action
   - Create components for repeated patterns

5. **Follow Naming Conventions**
   - Types: PascalCase (BlogPost, ProductPage)
   - Fields: camelCase (pageTitle, publishDate)
   - Components: Suffix with 'Component'

### Integration Points

#### With Prompt System
```typescript
import { universalTypeGenerationTemplate } from '@/lib/prompts/structured-prompts';
import { universalTypeContextBuilder } from '@/lib/prompts/context/universal-type-context';

// Build context and generate prompt
const context = await universalTypeContextBuilder.buildContext(websiteId);
const prompt = universalTypeGenerationTemplate.userPromptTemplate;
```

#### With Validation
```typescript
import { contentTypeValidator } from '@/prompts/universal-types/validation/validator';

// Initialize and validate
await contentTypeValidator.initialize(websiteId);
const result = await contentTypeValidator.validate(typeDefinition);
```

#### With Confidence Scoring
```typescript
import { confidenceScorer } from '@/prompts/universal-types/validation/confidence-scorer';

// Calculate confidence
const score = confidenceScorer.calculateScore(typeDefinition);
// score.total: 0-100
// score.threshold: automatic|review|manual|rejected
```

### Configuration

#### Environment Variables
```env
# No specific env vars required for MVP
# Uses existing database connection
```

#### Settings
```json
{
  "universalTypes": {
    "enableDynamicLoading": true,
    "cacheTimeout": 60000,
    "confidenceThreshold": 70,
    "maxSessionTypes": 50
  }
}
```

### Migration Guide

#### From Manual Type Creation
1. Run `npm run list:types` to see existing types
2. Use `npm run generate:type` for new types
3. System will suggest reuse automatically

#### From Legacy Templates
1. Static templates remain in `prompts/universal-types/templates/`
2. Dynamic context is injected automatically
3. No changes needed to existing workflows

### Future Enhancements
- Caching for performance optimization
- Real-time type synchronization
- Advanced pattern recognition
- Multi-language support
- Custom validation rules per project