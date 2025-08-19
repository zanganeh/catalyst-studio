# Epic 7: Universal CMS Content Type Architecture - Brownfield Enhancement PRD

**Version**: 1.0  
**Date**: 2025-01-19  
**Author**: John (Product Manager)  
**Status**: Ready for Implementation

---

## 1. Intro Project Analysis and Context

### 1.1 Enhancement Scope Assessment

This is a **SIGNIFICANT enhancement** to the Catalyst Studio project that requires comprehensive planning and multiple coordinated stories. The enhancement introduces a universal content type modeling system - the "jQuery for content modeling" - providing consistent abstraction across modern headless CMS platforms with AI-first content generation capabilities.

### 1.2 Existing Project Overview

**Analysis Source**: Project brief document (epic7-project-brief.md)

**Current Project State**:  
The Catalyst Studio project currently has an Optimizely CMS integration that is functional but scattered across the codebase. The system manages content types with versioning and change tracking capabilities. However, it lacks abstraction for cross-platform compatibility and has no universal content type definition system.

### 1.3 Available Documentation Analysis

- ✅ Tech Stack Documentation (Optimizely implementation details)
- ✅ Source Tree/Architecture (Current scattered implementation)
- ⚠️ Coding Standards (Implied but not documented)
- ✅ API Documentation (Optimizely-specific)
- ✅ External API Documentation (Platform APIs)
- ⚠️ UX/UI Guidelines (Not covered)
- ✅ Technical Debt Documentation (Refactoring needs identified)

### 1.4 Enhancement Scope Definition

**Enhancement Type**:
- ✅ Major Feature Modification (Provider architecture)
- ✅ Integration with New Systems (Multi-CMS support)
- ✅ Technology Stack Upgrade (Universal type system)

**Enhancement Description**:  
Introducing a universal content type modeling system that provides a consistent abstraction layer across modern headless CMS platforms, designed for AI-first content type generation with seamless portability.

**Impact Assessment**: Major Impact (architectural changes required)

### 1.5 Goals and Background Context

**Goals**:
- Enable AI systems to generate content types without knowing destination CMS
- Provide seamless content type migration between CMS platforms  
- Reduce content creation time by 50% through reusability
- Support 100+ concurrent editors without performance degradation (post-MVP)
- Achieve 95%+ migration success rate from other CMS platforms

**Background Context**:  
The project addresses a critical industry gap: no universal way to define and migrate content types across different CMS platforms. Each platform uses incompatible type systems (Sanity's Portable Text ≠ Contentful's Rich Text ≠ Strapi's Markdown), creating platform lock-in and preventing AI systems from generating platform-agnostic content types. This architecture provides the "jQuery for content modeling" - normalizing common patterns while preserving platform capabilities.

### 1.6 Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Creation | 2025-01-19 | 1.0 | Created brownfield PRD for Epic 7 | John (PM) |

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1:** The system shall provide a universal content type definition format that works across all major CMS platforms without requiring platform knowledge during creation.

**FR2:** The AI generation system shall create content types using only the three-layer type system (primitives, common patterns, platform extensions) with automatic fallback strategies.

**FR3:** The OptimizelyProvider shall encapsulate ALL Optimizely-specific logic within a single module with one entry point, implementing the ICMSProvider interface.

**FR4:** The system shall maintain 100% backward compatibility with existing Optimizely content and preserve all current functionality during refactoring.

**FR5:** The universal type system shall support field type mapping with at least 80% success rate across platforms, with clear transformation reporting for incompatible fields.

**FR6:** The provider architecture shall support versioning through the existing change tracking system without any modifications to current versioning logic.

**FR7:** Content types shall be categorized as either 'page' (routable with URLs) or 'component' (reusable, non-routable blocks) with appropriate composition rules.

**FR8:** The system shall provide migration confidence scoring (0-100) when transforming content types between platforms, with detailed warnings for potential data loss.

**FR9:** The adapter system shall implement graceful degradation strategies (best match, flatten, preserve, document) for unsupported platform features.

**FR10:** The system shall support AI-generated content type validation and platform capability detection before applying transformations.

### 2.2 Non-Functional Requirements (MVP-Focused)

**NFR1:** Performance monitoring deferred to post-MVP - focus on functional correctness.

**NFR2:** Performance optimization deferred - acceptable degradation for clean architecture.

**NFR3:** Memory optimization not critical for MVP stage.

**NFR4:** Concurrency testing deferred to post-MVP.

**NFR5:** Response time optimization deferred to post-MVP.

**NFR6:** The provider module structure must allow adding new CMS providers without modifying existing provider code.

**NFR7:** All platform-specific code must be contained within provider modules with no leakage to application layer.

**NFR8:** The system must provide basic error handling with retry logic for transient failures.

### 2.3 Compatibility Requirements (MVP Reality)

**CR1:** API Structure Compatibility - The refactored API structure and contracts must maintain the same patterns (data migration not required).

**CR2:** Schema Structure Compatibility - The schema structure for content types and versioning must follow existing patterns (existing data can be deleted/re-seeded).

**CR3:** UI/UX Consistency - Any UI changes must maintain consistency with existing design patterns.

**CR4:** Integration Structure Compatibility - Integration patterns with external systems must remain consistent (re-configuration acceptable).

**CR5:** Version System Structure - The versioning system architecture must remain unchanged (historical data can be reset).

**CR6:** Change Tracking Logic - The change detection logic patterns must be preserved (historical changes can be cleared).

---

## 3. Technical Constraints and Integration Requirements

### 3.1 Existing Technology Stack

**Languages**: TypeScript/JavaScript  
**Frameworks**: Next.js (React-based), Node.js backend  
**Database**: SQLite (local development), PostgreSQL (production-ready)  
**Infrastructure**: Local development environment, deployment-ready architecture  
**External Dependencies**: Optimizely CMS API, potential future CMS APIs (Contentful, Strapi, Sanity)

### 3.2 Integration Approach

**Database Integration Strategy**: 
- Maintain existing schema patterns for content type definitions
- Provider adapters translate between universal format and storage format
- Seed data approach for development/testing (no migration required)

**API Integration Strategy**:
- Provider pattern wraps all external CMS API calls
- Unified interface (ICMSProvider) for all CMS interactions
- Retry logic with exponential backoff for API resilience

**Frontend Integration Strategy**:
- React components remain CMS-agnostic using universal types
- Provider selection happens at configuration level
- UI components work with universal content type definitions

**Testing Integration Strategy**:
- Mock providers for unit testing
- Integration tests can swap providers easily
- Test data uses universal format for consistency

### 3.3 Code Organization and Standards

**File Structure Approach**:
```
providers/
  optimizely/       # All Optimizely-specific code
    index.ts        # Single entry point
    internal/       # Not exported outside provider
  common/
    ICMSProvider.ts # Shared interface only
```

**Naming Conventions**:
- Providers: `{Platform}Provider` (e.g., OptimizelyProvider)
- Universal types: `Universal{Type}` (e.g., UniversalContentType)
- Mappers: `{Platform}TypeMapper`

**Coding Standards**:
- TypeScript strict mode for type safety
- No platform-specific imports outside provider modules
- All provider methods async for consistency

**Documentation Standards**:
- Each provider includes README with capability matrix
- Transformation examples documented with confidence scores
- AI generation guidelines in universal type definitions

### 3.4 Deployment and Operations

**Build Process Integration**:
- Providers built as separate modules
- Tree-shaking removes unused providers
- Development can run with single provider

**Deployment Strategy**:
- Environment variables select active provider
- Provider configuration injected at runtime
- No code changes needed to switch providers

**Monitoring and Logging**:
- Basic console logging for MVP
- Structured logs for transformation operations
- Error tracking for failed migrations

**Configuration Management**:
- Provider selection via environment variable
- CMS credentials in .env files
- Capability detection at runtime

### 3.5 Risk Assessment and Mitigation

**Technical Risks**:
- **Risk**: Complex Optimizely logic difficult to encapsulate
  - **Mitigation**: Gradual refactoring with parallel old/new code
- **Risk**: Universal type system too restrictive
  - **Mitigation**: Three-layer system with platform extensions
- **Risk**: AI generates incompatible types
  - **Mitigation**: Validation layer before applying changes

**Integration Risks**:
- **Risk**: Breaking existing Optimizely functionality
  - **Mitigation**: Comprehensive test suite before refactoring
- **Risk**: Provider interface too complex
  - **Mitigation**: Start minimal, extend as needed

**Deployment Risks**:
- **Risk**: Provider switching causes data inconsistency
  - **Mitigation**: Development/test only for MVP, can re-seed

**Mitigation Strategies**:
- Feature flags for gradual provider adoption
- Parallel running of old and new code paths
- Comprehensive logging of all transformations
- Rollback plan: Keep existing code until provider proven

---

## 4. Epic and Story Structure

### 4.1 Epic Approach

**Epic Structure Decision**: Single comprehensive epic (Epic 7) for the Universal CMS Content Type Architecture enhancement.

**Rationale**: This enhancement represents a cohesive architectural change where all components are interdependent. The provider pattern is the foundation that enables all other features.

**Critical Requirements**:
- All stories numbered as 7.x
- Each story includes GitFlow branch strategy
- AI adaptation mechanism built into the system
- System prompts updated to leverage new universal type system

**GitFlow Strategy**:
- Main branch: `main`
- Epic branch: `epic/7-universal-cms-architecture`
- Story branches: `feature/epic7-{story-name}`
- Merge strategy: Stories → Epic branch → Main (after full epic completion)

---

## 5. Epic 7: Universal CMS Content Type Architecture

**Epic Goal**: Transform the scattered Optimizely integration into a provider-based architecture with universal content types, enabling AI-first content generation and cross-platform portability.

**Integration Requirements**: 
- Maintain existing functionality while refactoring to provider pattern
- Preserve versioning and change tracking systems
- Update AI system prompts to use universal type definitions
- Enable GitFlow for parallel story development

### Story 7.0: Environment Setup & Credential Management

**GitFlow Branch**: `feature/epic7-environment-setup`

As a developer,  
I want clear documentation and setup process for all required credentials and environment configuration,  
so that development can begin without blockers.

**Acceptance Criteria:**
1. Comprehensive guide for obtaining Optimizely API credentials created
2. .env.template file with all required environment variables
3. Secure credential storage process documented
4. Local development setup guide with step-by-step instructions
5. Fallback configuration for development without live API access
6. Troubleshooting guide for common credential issues

**Specific Requirements:**
- Document Optimizely account setup process
- Specify required API scopes and permissions
- Include example values in .env.template
- Define credential rotation process
- Document how to verify credentials are working

**Integration Verification:**
- IV1: Developer can set up local environment following documentation
- IV2: All required credentials properly configured
- IV3: Mock mode works without real credentials

### Story 7.1: Provider Architecture Foundation & Interface Definition

**GitFlow Branch**: `feature/epic7-provider-foundation`

As a developer,  
I want to establish the provider architecture foundation with the ICMSProvider interface,  
so that all CMS-specific code can be properly encapsulated.

**Acceptance Criteria:**
1. ICMSProvider interface defined with all required methods
2. ProviderRegistry class implemented for provider management
3. Common types (UniversalContentType, UniversalField) defined
4. Basic project structure created (providers/, common/)
5. TypeScript strict mode configured for providers

**Integration Verification:**
- IV1: Existing Optimizely code continues to function unchanged
- IV2: No breaking changes to current API surface
- IV3: Build process succeeds with new structure

### Story 7.2: Extract & Encapsulate Optimizely Logic

**GitFlow Branch**: `feature/epic7-optimizely-extraction`

As a developer,  
I want to extract all Optimizely-specific code into the OptimizelyProvider module,  
so that platform-specific logic is completely isolated.

**Acceptance Criteria:**
1. All Optimizely API calls moved to OptimizelyProvider
2. Optimizely type definitions isolated in provider module
3. Mapping layer created for Universal ↔ Optimizely types
4. Single entry point (index.ts) exports only necessary items
5. No Optimizely imports remain outside provider module

**Integration Verification:**
- IV1: All existing Optimizely features continue working
- IV2: Versioning system integration points preserved
- IV3: Test suite passes without modifications

### Story 7.3: Implement Three-Layer Type System

**GitFlow Branch**: `feature/epic7-type-system`

As a developer,  
I want to implement the three-layer type system (primitives, common, extensions),  
so that content types can be defined in a platform-agnostic way.

**Acceptance Criteria:**
1. Primitive types defined and documented
2. Common patterns layer implemented with transformations
3. Platform extensions structure created
4. Field type compatibility matrix implemented
5. Fallback strategies defined for each type

**Integration Verification:**
- IV1: Existing content types can be represented in universal format
- IV2: Type conversions maintain data integrity
- IV3: Validation rules properly mapped

### Story 7.4: Create AI System Prompt Integration

**GitFlow Branch**: `feature/epic7-ai-integration`

As an AI system,  
I want clear guidelines and type definitions for content generation,  
so that I can create platform-agnostic content types.

**Acceptance Criteria:**
1. AI system prompt templates created with universal type rules
2. Content type generation examples documented in `prompts/universal-types/`
3. Validation system for AI-generated types with specific rules
4. Metadata structure includes AI generation tracking
5. CLAUDE.md updated with universal type generation patterns
6. System prompts stored in `prompts/universal-types/generation-rules.md`
7. Type examples catalog in `prompts/universal-types/type-examples.json`
8. Platform capability matrix in `prompts/universal-types/platform-mappings.json`

**Specific AI Integration Requirements:**
- Create comprehensive prompt templates for content type generation
- Define validation rules for AI-generated types
- Include 10+ example universal content types
- Document transformation confidence thresholds
- Create prompt injection points for provider-specific rules

**Integration Verification:**
- IV1: AI can generate valid universal content types
- IV2: Generated types pass validation
- IV3: Types can be successfully applied to Optimizely

### Story 7.5: Migration & Transformation Engine

**GitFlow Branch**: `feature/epic7-migration-engine`

As a developer,  
I want a migration engine that transforms content types between platforms,  
so that content types can be ported with confidence scoring.

**Acceptance Criteria:**
1. Transformation rules defined for all type mappings
2. Confidence scoring algorithm implemented (0-100)
3. Migration report generation with warnings
4. Graceful degradation strategies implemented
5. Real-world transformation examples documented

**Integration Verification:**
- IV1: Existing Optimizely types can be exported to universal format
- IV2: Universal types can be imported to Optimizely
- IV3: Round-trip transformation maintains type integrity

### Story 7.6: Update Application Layer & Testing

**GitFlow Branch**: `feature/epic7-app-integration`

As a developer,  
I want the application layer to use only the provider interface,  
so that the system is truly platform-agnostic.

**Acceptance Criteria:**
1. All direct Optimizely calls replaced with provider calls
2. Provider injection configured at application bootstrap
3. Mock provider created for testing
4. Integration tests updated for provider pattern
5. Environment configuration for provider selection

**Integration Verification:**
- IV1: Application functions identically with provider abstraction
- IV2: All existing tests pass with provider pattern
- IV3: Provider can be swapped via configuration

### Story 7.7: Documentation & AI Training Data

**GitFlow Branch**: `feature/epic7-documentation`

As a team member,  
I want comprehensive documentation and AI training data,  
so that the system can be maintained and AI can effectively use it.

**Acceptance Criteria:**
1. Provider development guide created with step-by-step instructions
2. AI system prompts finalized in `prompts/universal-types/` directory
3. Transformation examples catalog with 10+ real-world scenarios
4. API documentation updated with provider patterns
5. CLAUDE.md updated with:
   - Universal type generation patterns
   - Provider selection commands
   - Transformation validation rules
   - AI content type generation guidelines
6. .env.example with all configuration variables documented
7. README updated with Epic 7 features and usage

**Integration Verification:**
- IV1: Documentation accurately reflects implementation
- IV2: AI successfully uses new type system
- IV3: Examples work as documented

---

## 6. AI Adaptation Mechanism

### 6.1 System Prompt Structure

AI system prompts will be stored in `prompts/universal-types/` directory with the following structure:

```
prompts/
  universal-types/
    generation-rules.md      # Core rules for AI content type generation
    type-examples.json       # Example universal content types
    validation-rules.md      # Validation criteria for AI-generated types
    platform-mappings.json   # Platform capability matrix
```

### 6.2 AI Generation Guidelines

```markdown
# Universal Content Type Generation Rules

When generating content types, ALWAYS use this universal structure:

1. Default to Three-Layer Type System
   - Start with primitives (text, number, boolean, date)
   - Add common patterns only when necessary (richText, media, reference)
   - Avoid platform-specific extensions unless explicitly requested

2. Content Type Structure
   Every content type MUST include:
   - type: Either 'page' (routable with URL) or 'component' (reusable block)
   - name: PascalCase naming (e.g., BlogPost, HeroSection)
   - fields: Array of field definitions using universal types
   - metadata: Description and purpose

3. Field Definition Rules
   Each field MUST specify:
   - name: camelCase field name
   - type: Universal type from three-layer system
   - required: Boolean for validation
   - description: Clear purpose of the field
   - defaultValue: Optional default
   
4. Avoid Platform Assumptions
   - Never use platform-specific field types
   - Never assume platform capabilities
   - Always provide fallback strategies for complex types

5. Validation Rules
   - All generated types must pass UniversalTypeValidator
   - Confidence score must be >70% for automatic application
   - Manual review required for scores between 50-70%
   - Reject transformations below 50% confidence
```

### 6.3 CLAUDE.md Integration

The following content will be added to CLAUDE.md for AI assistance:

```markdown
## Universal Content Type System

When working with content types in Catalyst Studio:

1. **Always use universal type definitions** from the three-layer system
2. **Check provider capabilities** before suggesting platform-specific features
3. **Generate types using** the templates in prompts/universal-types/
4. **Validate all types** through UniversalTypeValidator before application
5. **Use confidence scoring** to assess transformation quality

### Commands for Content Type Operations
- `npm run generate:type` - Generate new universal content type
- `npm run validate:type` - Validate universal type definition
- `npm run transform:type` - Transform between platforms
- `npm run confidence:check` - Check transformation confidence score
```

### 6.4 Continuous Improvement

- AI performance metrics tracked per generation
- Successful type definitions added to example library
- Failed transformations analyzed for pattern improvements
- System prompts refined based on usage patterns

---

## 7. Credential Management & Environment Setup

### 7.1 Optimizely API Credentials

**Obtaining Credentials:**
1. Log into Optimizely CMS admin panel
2. Navigate to Settings → API Keys
3. Create new API key with following scopes:
   - Content Type Read/Write
   - Content Read/Write
   - Media Read/Write
4. Copy the API key and Project ID

**Storing Credentials:**
```bash
# .env.local (for local development)
OPTIMIZELY_API_KEY=your_api_key_here
OPTIMIZELY_PROJECT_ID=your_project_id_here
OPTIMIZELY_API_URL=https://api.optimizely.com/v2
PROVIDER_TYPE=optimizely

# Optional: Mock mode for development without API
USE_MOCK_PROVIDER=false
MOCK_DATA_PATH=./mock-data/optimizely
```

### 7.2 Environment Configuration Template

**Required .env.template file:**
```bash
# CMS Provider Configuration
PROVIDER_TYPE=optimizely # Options: optimizely, contentful, strapi, mock

# Optimizely Configuration
OPTIMIZELY_API_KEY=
OPTIMIZELY_PROJECT_ID=
OPTIMIZELY_API_URL=https://api.optimizely.com/v2

# Feature Flags
ENABLE_PROVIDER_PATTERN=false # Set to true to use new provider pattern
ENABLE_AI_GENERATION=false # Set to true to enable AI type generation

# Development Settings
USE_MOCK_PROVIDER=false # Set to true for offline development
MOCK_DATA_PATH=./mock-data
LOG_LEVEL=info # Options: debug, info, warn, error

# Transformation Settings
MIN_CONFIDENCE_SCORE=70 # Minimum confidence for auto-apply
MAX_TRANSFORMATION_DEPTH=10 # Maximum nesting depth
```

### 7.3 Security Best Practices

- Never commit .env files to version control
- Use environment-specific files (.env.local, .env.production)
- Rotate API keys regularly
- Use read-only keys for development when possible
- Implement key encryption for production environments

---

## 8. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- Story 7.0: Environment Setup & Credential Management (2 days)
- Story 7.1: Provider Architecture Foundation (3 days)
- Story 7.2: Extract & Encapsulate Optimizely Logic (5 days)

### Phase 2: Type System (Week 3)
- Story 7.3: Implement Three-Layer Type System (3 days)
- Story 7.4: Create AI System Prompt Integration (2 days)

### Phase 3: Migration (Week 4)
- Story 7.5: Migration & Transformation Engine (5 days)

### Phase 4: Integration (Week 5)
- Story 7.6: Update Application Layer & Testing (3 days)
- Story 7.7: Documentation & AI Training Data (2 days)

**Total Estimated Duration:** 25 days (5 weeks)

---

## 9. Success Criteria

### MVP Success Metrics
- ✅ Provider Encapsulation: Optimizely logic fully contained in provider module
- ✅ Zero Regression: Existing functionality 100% preserved
- ✅ Extended Field Types: JSON, repeater, and slug fields supported
- ✅ Type Compatibility: 80% field type mapping success rate achieved
- ✅ Versioning Preserved: Change tracking system remains unchanged
- ✅ Error Handling: Basic error recovery without external monitoring
- ✅ Transformation Examples: 5+ real-world migration scenarios documented
- ✅ AI Integration: System prompts enable platform-agnostic content generation

### Post-MVP Goals
- Add Contentful provider
- Add Strapi provider
- Performance optimization
- Production monitoring
- Advanced error handling

---

## 10. Appendices

### A. Three-Layer Type System Details

**Layer 1: Universal Primitives**
- text, longText, number, boolean, date, json, decimal

**Layer 2: Common Patterns**
- richText, media, collection, component, select, repeater, slug, tags

**Layer 3: Platform Extensions**
- Platform-specific features preserved but isolated

### B. Platform Capability Matrix

| CMS Platform | Pages Equivalent | Components Equivalent | Dynamic Areas | Nested Components | Max Depth |
|-------------|------------------|----------------------|---------------|-------------------|-----------|
| Strapi | Collection/Single Types | Components | Dynamic Zones | ✅ (limited) | Unlimited |
| Contentful | Entries with URLs | Modular Blocks | Reference Fields | ✅ | 10 levels |
| Sanity | Documents w/ Routes | Portable Text Blocks | Arrays | ✅ | Unlimited |
| Optimizely | Pages (Routable) | Blocks | Content Areas | ✅ | Unlimited |

### C. References
- Original Project Brief: epic7-project-brief.md
- Schema.org Vocabulary Specification
- Platform API Documentation

---

*Document Version: 1.0*  
*Date: 2025-01-19*  
*Status: Ready for Implementation*  
*Epic: 7 - Universal CMS Content Type Architecture*