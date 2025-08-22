# Project Brief: Universal CMS Content Type Architecture Enhancement (Epic 7)

## Executive Summary

This project introduces a universal content **type modeling system** - the "jQuery for content modeling" - that provides a consistent abstraction layer across modern headless CMS platforms. Critically, the architecture is designed for **AI-first content type generation**, where AI systems create content types WITHOUT knowing the destination CMS platform. The system focuses on content TYPE definition and schema abstraction (not content management itself), distinguishing between Pages (routable content with URLs) and Components (reusable, non-routable content blocks). Through a sophisticated three-layer type system, AI generation guidelines, and capability-aware adapters, the solution enables seamless content type portability across platforms while respecting platform-specific constraints and capabilities.

**Core Philosophy:** Like jQuery smoothed browser differences without making them identical, this architecture normalizes common content type patterns while preserving platform-specific capabilities through a three-layer type system.

**Platform Alignment & Capability Matrix:**

| CMS Platform | Pages Equivalent | Components Equivalent | Dynamic Areas | Nested Components | Max Depth |
|-------------|------------------|----------------------|---------------|-------------------|-----------|
| **Strapi** | Collection/Single Types | Components | Dynamic Zones | ✅ (limited) | Unlimited |
| **Contentful** | Entries with URLs | Modular Blocks | Reference Fields | ✅ | 10 levels |
| **Sanity** | Documents w/ Routes | Portable Text Blocks | Arrays | ✅ | Unlimited |
| **Optimizely** | Pages (Routable) | Blocks | Content Areas | ✅ | Unlimited |
| **Hygraph** | Models w/ Routes | Components | Union Fields | ✅ | Unlimited |
| **Directus** | Collections | M2A Relations | JSON Fields | ✅ | Unlimited |

## Problem Statement

### Current State Pain Points
- **AI Generation Challenge**: AI systems generate content types WITHOUT knowing destination CMS platform
- **Type System Incompatibility**: No universal way to map content types across platforms (Sanity's Portable Text ≠ Contentful's Rich Text ≠ Strapi's Markdown)
- **Platform Lock-in**: Content types defined in one CMS cannot be easily migrated to another
- **Composition Constraints**: Each platform has unique limitations (Strapi can't nest dynamic zones in components)
- **Validation Portability**: Validation rules don't translate between platforms
- **No Universal Vocabulary**: Lack of standardized content type definitions for AI systems to target

### Industry Gap Analysis
Based on research of leading CMS platforms:
- **Strapi**: Uses Dynamic Zones for flexible content composition
- **Contentful**: Implements Reference Fields and Composable Entries for modular content
- **Optimizely**: Separates Pages and Blocks with Content Areas for composition
- **Kentico**: Distinguishes Content Hub items from Page Builder widgets
- **Umbraco**: Differentiates Document Types from Element Types

Our system needs similar architectural patterns to remain competitive and compatible.

## Proposed Solution

### AI-First Content Type Generation

#### The Core Challenge
Our AI system generates content types WITHOUT knowing the destination CMS platform. This requires a universal type definition that is:
- Platform-agnostic by default
- Self-documenting for AI understanding
- Portable across all major CMS platforms
- Clear enough for AI to generate consistently

#### AI System Prompt Guidelines

```markdown
# Universal Content Type Generation Rules

When generating content types, ALWAYS use this universal structure:

1. **Default to Three-Layer Type System**
   - Start with primitives (text, number, boolean, date)
   - Add common patterns only when necessary (richText, media, reference)
   - Avoid platform-specific extensions unless explicitly requested

2. **Content Type Structure**
   Every content type MUST include:
   - `type`: Either 'page' (routable with URL) or 'component' (reusable block)
   - `name`: PascalCase naming (e.g., BlogPost, HeroSection)
   - `fields`: Array of field definitions using universal types
   - `metadata`: Description and purpose

3. **Field Definition Rules**
   Each field MUST specify:
   - `name`: camelCase field name
   - `type`: Universal type from three-layer system
   - `required`: Boolean for validation
   - `description`: Clear purpose of the field
   - `defaultValue`: Optional default
   
4. **Avoid Platform Assumptions**
   - Never use platform-specific field types (e.g., Sanity's portableText)
   - Never assume platform capabilities (e.g., Strapi's dynamicZone)
   - Always provide fallback strategies for complex types
```

#### AI Platform Detection & Migration Flow

```typescript
// AI generates content type without platform knowledge
const aiGeneratedType = {
  version: "1.0.0",
  type: "page",
  name: "ProductPage",
  metadata: {
    aiGenerated: true,
    targetPlatform: "unknown",
    generationPrompt: "Create a product page with pricing and features"
  },
  fields: [/* universal fields */]
};

// System detects destination platform later
const migrationFlow = {
  step1: "AI generates using universal types only",
  step2: "User selects destination CMS",
  step3: "System runs capability detection",
  step4: "Adapter transforms universal → platform-specific",
  step5: "Report migration confidence and warnings"
};

// Migration confidence scoring
interface MigrationAnalysis {
  platformDetected: string;
  confidence: number;  // 0-100
  compatibleFields: number;
  incompatibleFields: Field[];
  suggestedTransformations: Transform[];
  warnings: string[];
}
```

#### Universal Type Examples for AI Generation

```typescript
// Example 1: Blog Post (Page Type)
{
  "version": "1.0.0",
  "type": "page",
  "name": "BlogPost",
  "isRoutable": true,
  "metadata": {
    "description": "A blog article with rich content and metadata",
    "aiGenerated": true,
    "targetPlatform": "unknown"
  },
  "fields": [
    {
      "name": "title",
      "type": "text",
      "layer": "primitive",
      "required": true,
      "maxLength": 100,
      "description": "The main headline of the blog post"
    },
    {
      "name": "slug",
      "type": "text",
      "layer": "primitive",
      "required": true,
      "pattern": "^[a-z0-9-]+$",
      "description": "URL-friendly version of the title"
    },
    {
      "name": "content",
      "type": "richText",
      "layer": "common",
      "required": true,
      "description": "The main body content with formatting",
      "fallbackStrategy": "markdown"
    },
    {
      "name": "author",
      "type": "reference",
      "layer": "common",
      "referenceType": "Author",
      "required": true,
      "description": "Reference to the author entity"
    },
    {
      "name": "publishDate",
      "type": "date",
      "layer": "primitive",
      "required": true,
      "description": "When the article should be published"
    },
    {
      "name": "featuredImage",
      "type": "media",
      "layer": "common",
      "mediaType": "image",
      "description": "Hero image for the article"
    },
    {
      "name": "tags",
      "type": "collection",
      "layer": "common",
      "itemType": "text",
      "description": "Categorization tags for the article"
    }
  ]
}

// Example 2: Hero Section (Component Type)
{
  "version": "1.0.0",
  "type": "component",
  "name": "HeroSection",
  "isRoutable": false,
  "metadata": {
    "description": "A reusable hero section with headline and CTA",
    "aiGenerated": true,
    "targetPlatform": "unknown"
  },
  "fields": [
    {
      "name": "headline",
      "type": "text",
      "layer": "primitive",
      "required": true,
      "maxLength": 80,
      "description": "Main headline text"
    },
    {
      "name": "subheadline",
      "type": "longText",
      "layer": "primitive",
      "maxLength": 200,
      "description": "Supporting text under the headline"
    },
    {
      "name": "backgroundImage",
      "type": "media",
      "layer": "common",
      "mediaType": "image",
      "description": "Background image for the hero section"
    },
    {
      "name": "primaryButton",
      "type": "component",
      "layer": "common",
      "componentType": "Button",
      "description": "Main call-to-action button"
    },
    {
      "name": "alignment",
      "type": "select",
      "layer": "common",
      "options": ["left", "center", "right"],
      "defaultValue": "center",
      "description": "Text alignment within the hero"
    }
  ]
}
```

### Core Architecture: Three-Layer Type System

#### 1. Universal Primitives (Work Everywhere)
```typescript
// Layer 1: Base types that map cleanly across all platforms
primitives: {
  text: string;        // Maps to: Symbol, String, Short Text
  longText: string;    // Maps to: Text, Long Text, Textarea
  number: number;      // Maps to: Integer, Float, Decimal
  boolean: boolean;    // Universal across all platforms
  date: Date;         // Universal with format variations
  reference: Link;    // Universal concept, platform-specific implementation
}
```

#### 2. Common Patterns (Work in Most Platforms)
```typescript
// Layer 2: Widely supported but may need transformation
common: {
  richText: RichContent;    // Requires transformation between formats
  media: Asset;             // Generally compatible with adaptation
  collection: Array;        // Universal with platform constraints
  component: EmbeddedType;  // Supported with limitations
  select: Enumeration;      // Common with value mapping
}
```

#### 3. Platform Extensions (Platform-Specific)
```typescript
// Layer 3: Unique platform capabilities preserved
extensions: {
  portableText?: SanityBlock;      // Sanity-specific
  dynamicZone?: StrapiZone;        // Strapi-specific  
  contentArea?: OptimizelyArea;    // Optimizely-specific
  groqQuery?: SanityQuery;         // Sanity GROQ
  graphQLField?: GraphQLCustom;    // Hygraph-specific
}
```

### Extended Field Types for MVP

#### Critical Additions to Primitives
```typescript
primitives: {
  text: string;        // Maps to: Symbol, String, Short Text
  longText: string;    // Maps to: Text, Long Text, Textarea
  number: number;      // Maps to: Integer, Float, Decimal
  boolean: boolean;    // Universal across all platforms
  date: Date;         // Universal with format variations
  reference: Link;    // Universal concept, platform-specific implementation
  json: object;       // CRITICAL - For configuration and structured data
  decimal: number;    // For precise numerical values (prices, coordinates)
}
```

#### Critical Additions to Common Patterns
```typescript
common: {
  richText: RichContent;    // Requires transformation between formats
  media: Asset;             // Generally compatible with adaptation
  collection: Array;        // Universal with platform constraints
  component: EmbeddedType;  // Supported with limitations
  select: Enumeration;      // Common with value mapping
  repeater: Array<UniversalField>;  // Dynamic field lists
  slug: string;             // URL-safe identifiers
  tags: string[];           // Content categorization
}
```

### Capability Detection & Graceful Degradation

#### Platform Capability Matrix
```typescript
interface PlatformCapabilities {
  supportsNestedComponents: boolean;
  maxNestingDepth?: number;
  supportsDynamicInComponents: boolean;
  supportsCircularReferences: boolean;
  supportsFieldLevelI18n: boolean;
  richTextFormat: 'markdown' | 'html' | 'portable' | 'structured';
  validationTypes: ValidationCapability[];
}
```

#### Graceful Degradation Strategy
When migrating between platforms with different capabilities:
1. **Best Match**: Use closest equivalent feature
2. **Flatten**: Convert complex structures to simpler ones
3. **Preserve**: Store as JSON with migration warnings
4. **Document**: Clear reporting of transformations applied

### Real-World Transformation Scenarios

#### Scenario 1: Rich Text Migration (Sanity → Optimizely)
```typescript
{
  source: {
    platform: "sanity",
    type: "portableText",
    features: ["marks", "blocks", "custom-components"]
  },
  target: {
    platform: "optimizely",
    type: "XhtmlString",
    format: "html"
  },
  transformation: {
    confidence: 75,
    strategy: "Convert blocks to HTML, simplify custom marks",
    dataLoss: ["Custom components converted to divs", "Some marks simplified"],
    warnings: ["Review custom component rendering after migration"]
  }
}
```

#### Scenario 2: Dynamic Composition (Strapi → Optimizely)
```typescript
{
  source: {
    platform: "strapi",
    type: "dynamicZone",
    components: ["Hero", "TextBlock", "Gallery", "CallToAction"]
  },
  target: {
    platform: "optimizely",
    type: "contentArea",
    allowedTypes: ["HeroBlock", "TextBlock", "GalleryBlock", "CTABlock"]
  },
  transformation: {
    confidence: 85,
    mapping: "1-to-1 with naming convention",
    warnings: ["Component nesting depth may differ", "Validation rules need review"]
  }
}
```

#### Scenario 3: Incompatible Field Handling
```typescript
{
  scenario: "Strapi relation field to Optimizely",
  source: {
    type: "relation",
    relationType: "many-to-many"
  },
  target: {
    type: "ContentReferenceList"
  },
  confidence: 60,
  fallback: "Store as JSON with manual intervention required"
}
```

## Target Users

### Primary User Segment: Content Creators
- **Profile**: Marketing teams, content editors, digital publishers
- **Current Pain**: Manually duplicating content across pages
- **Need**: Reusable content blocks, visual content composition
- **Goal**: Create consistent, maintainable content efficiently

### Secondary User Segment: Developers
- **Profile**: Frontend developers, full-stack engineers, integration specialists
- **Current Pain**: Complex content structures, difficult integrations
- **Need**: Clean APIs, type safety, predictable content structure
- **Goal**: Build flexible, maintainable applications

## Goals & Success Metrics

### Business Objectives
- Reduce content creation time by 50% through reusability
- Decrease content maintenance effort by 60%
- Enable seamless migration from major CMS platforms
- Support 100+ concurrent content editors without performance degradation

### User Success Metrics
- Time to create new page: < 5 minutes using existing components
- Content reuse rate: > 70% of components used multiple times
- Editor satisfaction score: > 8/10
- Zero duplicate content maintenance issues

### Key Performance Indicators (KPIs)
- **Content Velocity**: Number of pages created per week (target: 3x increase)
- **Reusability Index**: Percentage of content that is reused (target: > 70%)
- **Migration Success Rate**: Successful imports from other CMS (target: > 95%)
- **API Response Time**: Content delivery under 100ms

## Refactoring Strategy

### Current State Analysis
- **Existing Optimizely Integration**: Currently implemented but scattered across codebase
- **Refactor Goal**: Consolidate ALL Optimizely knowledge into a single provider module
- **Zero Regression Requirement**: Maintain 100% backward compatibility during refactor

### Refactoring Steps

#### Step 1: Identify & Inventory
```typescript
// Find all Optimizely-specific code in current codebase:
// - API calls to Optimizely
// - Optimizely type definitions
// - Optimizely-specific validation
// - Content Area handling
// - Block/Page distinctions
// - Any hardcoded Optimizely logic
```

#### Step 2: Create Provider Structure
```typescript
// New structure - all Optimizely code moves here
providers/
  optimizely/
    index.ts                    // Export only what's needed
    OptimizelyProvider.ts       // Implements ICMSProvider
    internal/                   // Not exported
      mapping/
      validation/
      api/
      utils/
```

#### Step 3: Gradual Migration
1. Create provider interface based on current usage patterns
2. Implement OptimizelyProvider with existing code
3. Replace direct Optimizely calls with provider calls
4. Test each replacement to ensure no regression
5. Remove old Optimizely code once provider is complete

#### Step 4: Validation
- All existing tests must pass
- No Optimizely imports outside provider module
- Application code uses only ICMSProvider interface
- Performance benchmarks remain within 5% tolerance

### Success Criteria for Refactor
- ✅ All Optimizely logic in one module
- ✅ Single entry point (index.ts)
- ✅ No platform-specific code in app layer
- ✅ Easy to add new providers following same pattern
- ✅ Existing functionality 100% preserved
- ✅ **Versioning system remains completely unchanged**
- ✅ Change tracking continues to work exactly as before
- ✅ Version history and rollback functionality intact

### Versioning System Preservation Strategy

```typescript
// BEFORE (current implementation - DO NOT CHANGE)
class ContentTypeService {
  async updateType(type: ContentType) {
    const changes = this.versioningService.trackChanges(type);
    if (changes.hasChanges()) {
      await this.optimizelyClient.applyChanges(changes);
      await this.versioningService.saveVersion(changes);
    }
  }
}

// AFTER (with provider - versioning logic UNCHANGED)
class ContentTypeService {
  async updateType(platform: string, type: UniversalContentType) {
    const provider = this.registry.getProvider(platform);
    // Provider internally calls THE SAME versioningService
    await provider.updateContentType(type.id, type);
    // Version history works exactly as before
  }
}

// Inside OptimizelyProvider
class OptimizelyProvider {
  constructor(private versioningService: IVersioningService) {
    // Inject EXISTING versioning service
  }
  
  async updateContentType(id: string, type: UniversalContentType) {
    // Use EXISTING versioning logic - don't reinvent
    const changes = this.versioningService.trackChanges(type);
    if (changes.hasChanges()) {
      const optimizelyFormat = this.mapFromUniversal(type);
      await this.client.applyChanges(changes); // Same as before
      await this.versioningService.saveVersion(changes); // Same as before
    }
  }
}
```

## MVP Scope

### Core Features (Must Have)
- **Page Type Definition**: Create and manage routable content with URLs
- **Component Type Definition**: Create and manage reusable, non-routable blocks
- **Dynamic Content Areas**: Add flexible content zones to pages
- **Basic Composition**: Embed components within pages
- **Type Synchronization**: Maintain consistency during content type changes

### Out of Scope for MVP
- Advanced personalization rules
- A/B testing capabilities
- Multi-language content variations
- Complex workflow automation
- AI-powered content suggestions

### MVP Success Criteria (Revised for Implementation)
- ✅ **Provider Encapsulation**: Optimizely logic fully contained in provider module
- ✅ **Zero Regression**: Existing functionality 100% preserved
- ✅ **Extended Field Types**: JSON, repeater, and slug fields supported
- ✅ **Type Compatibility**: 80% field type mapping success rate achieved
- ✅ **Versioning Preserved**: Change tracking system remains unchanged
- ✅ **Error Handling**: Basic error recovery without external monitoring
- ✅ **Transformation Examples**: 5+ real-world migration scenarios documented
- ✅ **Performance**: Provider overhead < 100ms per operation

## Technical Architecture

### AI-First Universal Content Model

```typescript
interface UniversalContentType {
  version: string;                    // Semantic versioning for type evolution
  id: string;
  name: string;
  type: 'page' | 'component';
  isRoutable: boolean;
  fields: UniversalField[];           // Three-layer type system
  capabilities?: PlatformCapabilities; // Optional - not known during AI generation
  validations: UniversalValidation[]; // Portable validation rules
  metadata: TypeMetadata & {
    aiGenerated: boolean;             // Flag for AI-generated types
    targetPlatform?: string;          // 'unknown' when AI generates
    generationPrompt?: string;        // Original prompt used for generation
    confidenceScore?: number;         // AI's confidence in the structure
  };
}

interface UniversalField {
  id: string;
  name: string;
  layer: 'primitive' | 'common' | 'extension';
  type: FieldType;
  platformMappings: Map<Platform, PlatformFieldType>;
  validations?: UniversalValidation[];
  fallbackStrategy?: 'flatten' | 'preserve' | 'transform';
}

interface UniversalValidation {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value: any;
  platformSupport: Map<Platform, boolean>;
  fallback: 'warn' | 'ignore' | 'block';
}

interface MigrationReport {
  source: Platform;
  target: Platform;
  confidence: number;        // 0-100 confidence score
  transformations: Transform[];
  warnings: Warning[];
  dataLossRisk: Field[];
}
```

### Field Type Compatibility Matrix

| Universal Type | Contentful | Strapi | Sanity | Optimizely | Directus |
|---------------|------------|---------|---------|------------|----------|
| text | Symbol | string | string | ShortString | string |
| longText | Text | text | text | LongString | text |
| richText | RichText | richtext | portableText | XhtmlString | wysiwyg |
| number | Number | integer/float | number | Integer | integer |
| boolean | Boolean | boolean | boolean | Boolean | boolean |
| date | Date | datetime | datetime | DateTime | datetime |
| reference | Link | relation | reference | ContentReference | m2o |
| media | Asset | media | image/file | ContentReference | file |
| collection | Array | component[] | array | ContentArea | o2m |

#### Platform-Specific Adapters
Each adapter encapsulates platform complexity:

- **StrapiAdapter**: Handles Dynamic Zones, Collection/Single Types
- **ContentfulAdapter**: Manages Entries, References, Composable structures  
- **OptimizelyAdapter**: Translates Pages/Blocks/Content Areas
- **KenticoAdapter**: Maps Content Hub/Widgets/Page Builder
- **UmbracoAdapter**: Converts Document Types/Element Types/Block Grid

#### Core Components
- **Type Registry**: Centralized registration using universal model
- **Routing Engine**: URL generation and resolution for pages
- **Composition Engine**: Handle nested content and dependency resolution
- **Validation Layer**: Prevent circular dependencies and ensure type safety
- **Adapter Manager**: Orchestrates platform-specific adapters

### Provider-Based Architecture (Refactor Approach)

#### Core Abstraction Layer
The application interacts ONLY with the abstract provider interface, never directly with platform-specific code:

```typescript
// Abstract Provider Interface - What the app uses
interface ICMSProvider {
  // Core operations
  getContentTypes(): Promise<UniversalContentType[]>;
  createContentType(type: UniversalContentType): Promise<void>;
  updateContentType(id: string, type: UniversalContentType): Promise<void>;
  deleteContentType(id: string): Promise<void>;
  
  // Versioning support (EXISTING SYSTEM COMPATIBILITY)
  getContentTypeVersion(id: string): Promise<ContentTypeVersion>;
  getContentTypeChanges(id: string, fromVersion: string): Promise<ChangeSet>;
  applyChangeSet(id: string, changes: ChangeSet): Promise<void>;
  trackChanges(type: UniversalContentType): ChangeSet;
  
  // Validation
  validateContentType(type: UniversalContentType): ValidationResult;
  validateField(field: UniversalField): FieldValidationResult;
  
  // Type mapping
  mapToUniversal(platformType: any): UniversalContentType;
  mapFromUniversal(universalType: UniversalContentType): any;
  
  // Capability detection
  getCapabilities(): PlatformCapabilities;
  checkCompatibility(type: UniversalContentType): CompatibilityReport;
  
  // Migration support
  exportSchema(): Promise<UniversalSchema>;
  importSchema(schema: UniversalSchema): Promise<MigrationReport>;
}

// Provider Registry - Single point of provider management
class ProviderRegistry {
  private providers: Map<string, ICMSProvider> = new Map();
  
  register(platform: string, provider: ICMSProvider): void {
    this.providers.set(platform, provider);
  }
  
  getProvider(platform: string): ICMSProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new Error(`Provider for ${platform} not found`);
    }
    return provider;
  }
  
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
```

#### Provider Module Structure
Each provider is a self-contained module with ALL platform-specific knowledge:

```
providers/
├── optimizely/                  # Current implementation (MVP scope)
│   ├── index.ts                 # Single entry point
│   ├── OptimizelyProvider.ts    # Main provider class
│   ├── mapping/
│   │   ├── TypeMapper.ts        # Universal ↔ Optimizely mapping
│   │   ├── FieldMapper.ts       # Field type conversions
│   │   └── ValidationMapper.ts  # Validation rule mapping
│   ├── validation/
│   │   ├── TypeValidator.ts    # Optimizely-specific validation
│   │   └── ConstraintChecker.ts # Platform constraints
│   ├── api/
│   │   ├── OptimizelyClient.ts # API communication
│   │   └── ResponseParser.ts    # Response transformation
│   └── types/
│       └── optimizely.types.ts  # Optimizely-specific types
│
├── contentful/                   # Future implementation
│   ├── index.ts                 # Single entry point
│   └── ...                      # Same structure pattern
│
├── strapi/                       # Future implementation  
│   ├── index.ts                 # Single entry point
│   └── ...                      # Same structure pattern
│
└── common/                       # Shared interfaces only
    ├── ICMSProvider.ts          # Abstract interface
    ├── UniversalTypes.ts        # Universal type definitions
    └── ValidationTypes.ts       # Common validation types
```

#### Optimizely Provider (Reference Implementation)

```typescript
// providers/optimizely/index.ts - Single entry point
export { OptimizelyProvider } from './OptimizelyProvider';
export type { OptimizelyConfig } from './types/optimizely.types';

// providers/optimizely/OptimizelyProvider.ts
export class OptimizelyProvider implements ICMSProvider {
  private mapper: OptimizelyTypeMapper;
  private validator: OptimizelyValidator;
  private client: OptimizelyClient;
  
  constructor(config: OptimizelyConfig) {
    // All Optimizely-specific initialization
    this.mapper = new OptimizelyTypeMapper();
    this.validator = new OptimizelyValidator();
    this.client = new OptimizelyClient(config);
  }
  
  async getContentTypes(): Promise<UniversalContentType[]> {
    // Optimizely-specific: Get Pages and Blocks
    const pages = await this.client.getPageTypes();
    const blocks = await this.client.getBlockTypes();
    
    // Map to universal format
    return [
      ...pages.map(p => this.mapper.pageToUniversal(p)),
      ...blocks.map(b => this.mapper.blockToUniversal(b))
    ];
  }
  
  mapToUniversal(optimizelyType: any): UniversalContentType {
    // All Optimizely → Universal mapping logic here
    if (optimizelyType.isPage) {
      return this.mapper.pageToUniversal(optimizelyType);
    } else {
      return this.mapper.blockToUniversal(optimizelyType);
    }
  }
  
  mapFromUniversal(universal: UniversalContentType): any {
    // All Universal → Optimizely mapping logic here
    if (universal.type === 'page') {
      return this.mapper.universalToPage(universal);
    } else {
      return this.mapper.universalToBlock(universal);
    }
  }
  
  getCapabilities(): PlatformCapabilities {
    // Optimizely-specific capabilities
    return {
      supportsNestedComponents: true,
      maxNestingDepth: undefined, // Unlimited
      supportsDynamicInComponents: true,
      supportsCircularReferences: false,
      supportsFieldLevelI18n: true,
      richTextFormat: 'html',
      validationTypes: ['required', 'regex', 'range', 'custom'],
      // Optimizely-specific
      supportsContentAreas: true,
      supportsBlocks: true,
      supportsPages: true
    };
  }
  
  // Basic error handling for MVP (without monitoring)
  private async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw new Error(`Operation failed after ${maxRetries} retries: ${lastError.message}`);
  }
}
```

#### Application Usage (Platform-Agnostic)

```typescript
// App code - knows nothing about Optimizely specifics
class ContentTypeService {
  constructor(private registry: ProviderRegistry) {}
  
  async syncContentTypes(sourcePlatform: string, targetPlatform: string) {
    // Get providers - abstracted away
    const sourceProvider = this.registry.getProvider(sourcePlatform);
    const targetProvider = this.registry.getProvider(targetPlatform);
    
    // Work with universal types only
    const types = await sourceProvider.getContentTypes();
    
    for (const type of types) {
      // Check compatibility
      const compatibility = targetProvider.checkCompatibility(type);
      
      if (compatibility.confidence > 80) {
        await targetProvider.createContentType(type);
      } else {
        // Handle incompatibility
        console.warn(`Low compatibility: ${compatibility.warnings}`);
      }
    }
  }
}

// Bootstrap - Only place that knows about specific providers
const registry = new ProviderRegistry();
registry.register('optimizely', new OptimizelyProvider(config));
// Future: registry.register('contentful', new ContentfulProvider(config));
// Future: registry.register('strapi', new StrapiProvider(config));

const service = new ContentTypeService(registry);
```

### Versioning System Integration

#### Existing Versioning System (MUST PRESERVE)
The current versioning system tracks content type changes and propagates only what has changed. This system MUST remain unaffected by the provider refactor:

```typescript
// Existing versioning interfaces - DO NOT CHANGE
interface ContentTypeVersion {
  id: string;
  version: string;
  timestamp: Date;
  changes: ChangeSet;
  author?: string;
}

interface ChangeSet {
  added: Field[];
  modified: Field[];
  removed: Field[];
  metadata?: MetadataChange;
}

// Provider must support existing versioning
export class OptimizelyProvider implements ICMSProvider {
  private versioningService: IVersioningService; // Existing service
  
  async updateContentType(id: string, type: UniversalContentType): Promise<void> {
    // 1. Get current version
    const currentVersion = await this.getContentTypeVersion(id);
    
    // 2. Calculate changes using EXISTING versioning logic
    const changes = this.trackChanges(type);
    
    // 3. Apply only changes (not full replacement)
    if (changes.added.length || changes.modified.length || changes.removed.length) {
      await this.applyChangeSet(id, changes);
      
      // 4. Let existing versioning system handle the rest
      await this.versioningService.recordChange(id, changes);
    }
  }
  
  trackChanges(newType: UniversalContentType): ChangeSet {
    // Use EXISTING change detection logic
    // Provider only wraps it, doesn't replace it
    return this.versioningService.detectChanges(newType);
  }
}
```

#### Versioning Compliance Rules
1. **No Breaking Changes**: Existing version history must remain intact
2. **Change Detection**: Use existing algorithms for detecting changes
3. **Incremental Updates**: Send only changes, not full content types
4. **Version Compatibility**: Support rollback to previous versions
5. **Audit Trail**: Preserve existing audit logging

#### Integration Points
```typescript
// The existing app code for versioning remains unchanged
class ContentTypeManager {
  async updateContentType(platform: string, id: string, type: UniversalContentType) {
    const provider = this.registry.getProvider(platform);
    
    // Provider internally uses existing versioning
    await provider.updateContentType(id, type);
    
    // Existing version history UI/API continues to work
    const history = await this.versionService.getHistory(id);
    // ... existing code unchanged
  }
}
```

### Provider Architecture Benefits
- **Complete Encapsulation**: ALL platform knowledge in one module
- **Single Entry Point**: Each provider has one clear index.ts entry
- **No Leaky Abstractions**: Platform specifics never leak to app code
- **Easy Testing**: Mock the ICMSProvider interface
- **Incremental Development**: Add providers without touching existing code
- **Refactor-Friendly**: Current Optimizely code can be gradually moved into provider
- **Versioning Preserved**: Existing versioning system remains fully functional

### AI Generation Best Practices

#### Default Field Type Mappings for AI
When AI generates content types, it should default to these safe, universal choices:

| User Intent | AI Should Use | Layer | Rationale |
|------------|---------------|-------|-----------|
| "short text" | `text` | primitive | Universal support |
| "paragraph" | `longText` | primitive | Universal support |
| "rich content" | `richText` with markdown fallback | common | Broadest compatibility |
| "image" | `media` with type="image" | common | Standard across platforms |
| "link to another item" | `reference` | common | Universal concept |
| "list of items" | `collection` | common | Arrays are universal |
| "yes/no" | `boolean` | primitive | Universal support |
| "date and time" | `date` | primitive | Universal support |
| "dropdown" | `select` with options | common | Widely supported |

#### AI Generation Principles
1. **Start Simple**: Use primitives unless complexity is explicitly requested
2. **Explicit Descriptions**: Every field must have a clear `description` property
3. **Avoid Nesting**: Keep structures flat unless composition is explicitly needed
4. **Universal Validation**: Use only widely-supported validation rules
5. **Fallback Ready**: Always provide `fallbackStrategy` for common layer types

#### Example AI System Prompt
```markdown
You are generating content types for a universal CMS architecture.

RULES:
1. Always output valid JSON matching the UniversalContentType interface
2. Use only types from the three-layer system (primitive, common, extension)
3. Default to primitive types unless the user explicitly needs more
4. Include metadata.aiGenerated = true
5. Set metadata.targetPlatform = "unknown"
6. Add clear descriptions for every field
7. Avoid platform-specific features unless explicitly requested
8. When in doubt, choose the simpler type that works everywhere

FORBIDDEN:
- Never use platform-specific types (portableText, dynamicZone, etc.)
- Never assume platform capabilities
- Never create circular references
- Never nest components more than 2 levels deep
```

## Constraints & Assumptions

### Constraints
- **CRITICAL: Must preserve existing versioning system completely**
  - Version history must remain intact
  - Change tracking algorithms must not be modified
  - Only send changes, never full replacements
  - Support existing rollback functionality
- Must maintain backward compatibility with existing content
- Performance must not degrade by more than 10%
- Must work within current infrastructure limitations
- Cannot break existing API contracts
- Existing change detection logic must be reused, not replaced

### Key Assumptions
- Users understand the difference between pages and components
- Content editors will adopt component-based thinking
- Performance impact of nested composition is acceptable
- Major CMS platforms will maintain current architectures

## Risks & Mitigation (MVP-Focused)

### Technical Risks
- **Missing Field Types**: JSON and repeater fields are critical for modern CMS
  - *Mitigation*: Add in Week 1 as highest priority
  - *Mitigation*: Test with real Optimizely content types
  
- **Field Type Incompatibility**: Rich text formats don't map cleanly
  - *Mitigation*: Three-layer type system with transformation rules
  - *Mitigation*: Provide 5+ concrete transformation examples
  - *Mitigation*: Accept 75% confidence for complex transformations
  
- **Provider Interface Complexity**: 14+ methods in single interface
  - *Mitigation*: Split into ICMSReader, ICMSWriter, ICMSMigrator
  - *Mitigation*: Use composition pattern for full interface

- **Versioning Integration**: Risk of breaking existing change tracking
  - *Mitigation*: Inject existing service, don't replace
  - *Mitigation*: Comprehensive testing of version history
  - *Mitigation*: Maintain exact same API surface

### MVP-Specific Risks
- **Refactoring Regression**: Breaking existing Optimizely functionality
  - *Mitigation*: Gradual migration with feature flags
  - *Mitigation*: Parallel running of old and new code
  - *Mitigation*: Comprehensive regression test suite
  
- **Performance Degradation**: Provider overhead exceeds 100ms
  - *Mitigation*: Basic caching for type definitions
  - *Mitigation*: Lazy loading of provider modules
  - *Mitigation*: Profile and optimize hot paths

### Deferred Risks (Post-MVP)
- ~~**Security**: API keys, authentication, authorization~~
- ~~**Monitoring**: Health checks, metrics, observability~~
- ~~**Rate Limiting**: API throttling and quota management~~
- **Platform Updates**: Breaking changes in CMS APIs (acceptable for MVP)

## Competitive Analysis

### Platform Strengths We Should Adopt
- **Strapi**: Flexible Dynamic Zones, open-source extensibility
- **Contentful**: Strong API-first approach, composable entries
- **Optimizely**: Mature block/page separation, visual editing
- **Kentico**: Hybrid headless approach, Page Builder flexibility
- **Umbraco**: Strong typing system, block grid editor

### Our Differentiation
- Universal adapter pattern for cross-CMS compatibility
- More flexible composition rules than current platforms
- Better handling of deeply nested content structures
- Unified approach that works across headless and traditional modes

## Implementation Phases (Provider-Based Refactor)

### Phase 1: Core Abstraction & Optimizely Provider (Week 1-2) - MVP SCOPE
- **Refactor existing Optimizely code into provider pattern**
  - Extract all Optimizely-specific logic into provider module
  - Create ICMSProvider interface from existing patterns
  - Implement ProviderRegistry for provider management
  - Ensure zero regression in current Optimizely functionality
- **Establish provider structure**
  - Single entry point (index.ts)
  - Mapping layer (Universal ↔ Optimizely)
  - Validation layer (Optimizely constraints)
  - API client layer (existing Optimizely client)
- **Test abstraction with existing features**

### Phase 2: Universal Type System Integration (Week 3)
- Implement three-layer type system in common module
- Update OptimizelyProvider to use universal types
- Add capability detection to OptimizelyProvider
- Create type transformation utilities
- Validate AI-generated types work with Optimizely

### Phase 3: Migration & Validation Framework (Week 4)
- Build validation system in OptimizelyProvider
- Implement compatibility checking
- Create migration confidence scoring
- Add transformation reporting
- Test with real Optimizely content types

### Phase 4: Provider Template & Documentation (Week 5)
- Create provider development template
- Document provider interface contract
- Build provider testing framework
- Create contribution guidelines
- Prepare for future provider additions

### Future Phases (Post-MVP)
- **Phase 5**: Add Contentful provider
- **Phase 6**: Add Strapi provider  
- **Phase 7**: Add Sanity provider
- **Phase 8**: Community providers & ecosystem

## Next Steps

### Immediate Actions
1. Review and approve architectural approach with stakeholders
2. Set up development environment with type system foundation
3. Create proof-of-concept for page/component separation
4. Design API contracts for content composition
5. Begin migration adapter specifications

### PM Handoff
This Project Brief provides the full context for the Universal CMS Content Type Architecture Enhancement. The architecture aligns with industry standards while providing unique flexibility. Key success factors include maintaining compatibility with major CMS platforms while delivering superior composition capabilities.

## Appendices

### A. Research Summary
- Analyzed 10+ major CMS platforms including newer entrants (Sanity, Hygraph, Directus, Storyblok)
- Identified universal pattern: Pages/Components distinction exists across all platforms
- Confirmed critical gap: No existing universal type abstraction layer
- Validated jQuery analogy: 80% compatibility is sufficient for success

### B. Expert Review Findings
Based on comprehensive expert panel consultation:
- **Unanimous Agreement**: Core Pages/Components abstraction is valid
- **Critical Enhancement**: Three-layer type system essential for success
- **Key Insight**: Focus on TYPE modeling, not content management
- **Platform Reality**: Accept 80% compatibility as victory condition
- **Implementation Strategy**: Start with 3-4 platforms, expand via community

### C. Technical References
- Schema.org Vocabulary Specification
- JSON-LD Context Files
- Strapi Dynamic Zones & Components Documentation
- Contentful Content Model & Field Types
- Sanity Portable Text & GROQ Specification
- GraphQL Federation Patterns
- Platform API Versioning Strategies

### D. Glossary
- **Universal Primitive**: Field type that maps cleanly across all platforms
- **Common Pattern**: Widely supported type requiring transformation
- **Platform Extension**: Unique platform capability preserved in layer 3
- **Capability Detection**: Runtime discovery of platform features
- **Graceful Degradation**: Fallback strategy for unsupported features
- **Migration Confidence Score**: Percentage indicating type portability success
- **Three-Layer Type System**: Primitive → Common → Extension architecture

---

*Document Version: 5.0*  
*Date: 2025-01-19*  
*Status: MVP-Ready with Core Functionality Focus - Approved for Implementation*
*Major Revisions:*
- *v2.0: Incorporated comprehensive expert panel feedback and architectural refinements*
- *v3.0: Added AI-first content type generation with system prompt guidelines and universal type examples*
- *v4.0: Introduced provider-based architecture with complete platform encapsulation and Optimizely as reference implementation*
- *v4.1: Added versioning system integration requirements to ensure existing change tracking remains unaffected*
- *v5.0: MVP scope refinement - Added missing field types (JSON, repeater), concrete transformation examples, simplified success criteria, deferred security/monitoring to post-MVP*