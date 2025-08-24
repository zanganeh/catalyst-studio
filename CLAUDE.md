# CLAUDE.md - AI Integration Guide

## Repository Organization: Open Source vs Premium

### Structure Overview
This repository follows a dual-repository strategy with clear separation:

```
catalyst-studio-premium/ (Private Repository)
├── app/                    # Open source app code
├── components/             
│   ├── ui/                # Common UI components (open source)
│   └── studio/            # Open source studio components
├── lib/
│   ├── providers/         # Open source providers
│   └── premium/           # ALL PREMIUM CONTENT HERE
│       ├── demo-app/      # Premium demo applications
│       ├── components/    # Premium components
│       ├── hooks/         # Premium hooks
│       └── *.ts          # Premium utilities
└── .github/
    └── workflows/
        └── sync-to-public.yml  # Auto-sync to public repo
```

### Key Rules

#### 1. **ALL Premium Content Goes Under `lib/premium/`**
- Never place premium features outside `lib/premium/`
- This includes demos, components, hooks, and utilities
- Makes sync simple: just remove `lib/premium/` for public

#### 2. **Common Code Stays in Standard Locations**
- Basic UI components: `components/ui/`
- Core functionality: `app/`, `lib/providers/`
- These sync to both repositories

#### 3. **Import Paths**
- Premium imports: `@/lib/premium/...`
- Common imports: `@/components/ui/...`, `@/lib/...`
- Never import premium in common code

### GitHub Actions Auto-Sync

The workflow automatically syncs to public repo on every push:
1. Removes `lib/premium/` directory
2. Removes internal scripts
3. Pushes clean version to public repo

**Required Setup:**
- Add `PUBLIC_REPO_TOKEN` secret to premium repo
- Token needs `repo` scope for public repository

### Working with the Repositories

#### Daily Development
```bash
# Work in premium repo only
git add .
git commit -m "feat: your changes"
git push premium main  # Auto-syncs to public
```

#### Adding Premium Features
```bash
# Always create under lib/premium/
mkdir -p lib/premium/new-feature
# Add your premium code there
```

#### Bug Fixes (affects both repos)
```bash
# Fix in common code
git commit -m "fix: bug in common component"
git push premium main  # Auto-syncs fix to public
```

### File Organization Examples

**Premium Component:**
```
lib/premium/components/sitemap/professional-nodes.tsx
```

**Premium Demo:**
```
lib/premium/demo-app/sitemap-builder/page.tsx
```

**Common Component (in both repos):**
```
components/ui/button.tsx
```

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
- **Category Classification**: Distinguishes between 'page' (routable content) and 'component' (reusable blocks)

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

#### Select Provider
```bash
# Via code
typeSystem.selectProvider('optimizely');
typeSystem.selectProvider('mock'); // For testing

# Get available providers
typeSystem.getAvailableProviders(); // ['optimizely', 'mock', 'contentful', 'strapi']
```

#### Transform Content Types
```bash
# Transform to universal format
const universal = await provider.transformToUniversal(optimizelyType);

# Transform from universal format
const platformType = await provider.transformFromUniversal(universalType);
```

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

### Content Type Categories

**CRITICAL**: Every content type MUST have a category field set to either 'page' or 'component'.

#### Category: 'page'
- **Purpose**: Content that is directly routable and has its own URL
- **Examples**: BlogPost, ProductPage, LandingPage, ArticlePage
- **Required Fields**: Should include `title` and `slug` for routing
- **Validation**: 
  - Should NOT have URL fields (pages are routable themselves)
  - Can include SEO fields (metaTitle, metaDescription)
  - Can have multiple complex fields

#### Category: 'component' 
- **Purpose**: Reusable content blocks that can be embedded in pages
- **Examples**: HeroSection, CTAComponent, TestimonialCard, ContentArea
- **Characteristics**: 
  - Focused and reusable
  - Should be limited in complexity (max 8 fields recommended)
  - Should NOT include SEO fields
  - Should NOT include routing fields (slug, URL)

#### AI Integration Requirements
When generating content types via AI:
```typescript
// ALWAYS specify category when creating types
await createContentType({
  name: 'BlogPost',
  category: 'page', // REQUIRED
  fields: [...],
  // ...
});
```

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
- Verify category is 'page' or 'component'
- Check for required fields (title/slug for pages)

#### Issue: Transformation Failures
```typescript
// Check provider capabilities
const caps = provider.getCapabilities();
console.log('Supported types:', caps.supportedFieldTypes);

// Use fallback for unsupported types
if (!caps.supportedFieldTypes.includes('JSON')) {
  // Use Text field with serialization
  field.type = 'Text';
  field.metadata.serialized = true;
}
```

#### Issue: Provider Not Found
```typescript
// List available providers
const providers = typeSystem.getAvailableProviders();
console.log('Available:', providers);

// Use mock provider as fallback
if (!providers.includes(requestedProvider)) {
  typeSystem.selectProvider('mock');
}
```

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

### Universal Type Generation Patterns

#### Pattern: Check Before Create
```typescript
// AI should ALWAYS check for existing types first
const existing = await typeLoader.findSimilar('BlogPost');
if (existing.confidence > 80) {
  return { action: 'reuse', type: existing.type };
}
// Only create if no suitable match found
```

#### Pattern: Category-Based Generation
```typescript
// Pages MUST have routing fields
if (category === 'page') {
  fields.push(
    { name: 'title', type: 'Text', required: true },
    { name: 'slug', type: 'Text', required: true }
  );
}
// Components MUST be simple
if (category === 'component' && fields.length > 8) {
  throw new Error('Components should have 8 or fewer fields');
}
```

#### Pattern: Confidence-Based Application
```typescript
const validation = await validator.validate(type);
if (validation.confidence > 70) {
  // Automatic application
  await provider.createContentType(type);
} else if (validation.confidence > 50) {
  // Manual review required
  await requestReview(type, validation);
} else {
  // Rejection - regenerate
  await regenerateWithFeedback(type, validation);
}
```

### Transformation Validation Rules

#### Rule: Platform Capability Check
```typescript
// Before transformation, check platform capabilities
const capabilities = provider.getCapabilities();
if (!capabilities.supportsContentTypes) {
  throw new Error('Provider does not support content types');
}

// Check field type support
for (const field of type.fields) {
  if (!capabilities.supportedFieldTypes.includes(field.type)) {
    // Use fallback strategy
    field.type = getFallbackType(field.type, capabilities);
  }
}
```

#### Rule: Preserve Metadata During Transformation
```typescript
// Always preserve original metadata
const transformed = {
  ...platformType,
  metadata: {
    ...platformType.metadata,
    originalType: universalType,
    transformedAt: new Date(),
    confidence: calculatedConfidence
  }
};
```

#### Rule: Validate After Transformation
```typescript
// Always validate transformed types
const transformed = await provider.transformFromUniversal(universal);
const validation = await provider.validateContentType(transformed);

if (!validation.valid) {
  console.error('Transformation produced invalid type:', validation.errors);
  // Apply recovery strategy
}
```

### AI Content Type Generation Guidelines

#### MANDATORY Requirements
1. **Category Field**: EVERY type MUST have `category: 'page' | 'component'`
2. **Naming Convention**: Types use PascalCase, fields use camelCase
3. **Validation First**: ALWAYS validate before applying
4. **Check Existing**: ALWAYS check for existing types before creating
5. **Confidence Scoring**: ALWAYS calculate and report confidence

#### Generation Process
```typescript
// 1. Analyze request
const intent = analyzeUserRequest(request);

// 2. Check existing types
const existing = await findExistingTypes(intent);
if (existing.match > 80) {
  return suggestReuse(existing);
}

// 3. Generate new type
const newType = generateType(intent);

// 4. Validate
const validation = await validate(newType);

// 5. Apply confidence threshold
if (validation.confidence < 70) {
  return requestManualReview(newType, validation);
}

// 6. Create type
return await createContentType(newType);
```

#### Category-Specific Rules

**Pages (`category: 'page'`)**
- MUST have `title` field (Text, required)
- MUST have `slug` field (Text, required)
- SHOULD have SEO fields (metaTitle, metaDescription)
- CAN have unlimited fields
- SHOULD NOT have URL fields (pages ARE the URL)

**Components (`category: 'component'`)**
- MUST be focused (single purpose)
- SHOULD have ≤8 fields
- MUST NOT have SEO fields
- MUST NOT have routing fields (slug)
- SHOULD be reusable across pages

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

6. **Handle Transformations Carefully**
   - Always preserve metadata
   - Use appropriate fallback strategies
   - Validate after transformation
   - Log confidence scores

7. **Provider Selection Strategy**
   - Use mock provider for testing
   - Select provider based on project configuration
   - Check provider capabilities before operations
   - Handle provider-specific limitations

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