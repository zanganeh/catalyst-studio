# Catalyst Studio Multi-Website Support Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Scope Assessment

This is a **significant enhancement** that warrants a full PRD process. The Multi-Website Support feature requires:
- Architectural changes (adding ID-based routing)
- New dashboard component with AI-powered interface
- Integration with existing studio functionality
- Browser storage schema modifications
- Multiple coordinated development stories

This is not a simple feature addition - it fundamentally transforms how users interact with Catalyst Studio.

### Existing Project Overview

**Analysis Source:** Project Brief and user-provided information

**Current Project State:**
Catalyst Studio currently operates as a single-website management tool with a studio interface at `http://localhost:3001/studio`. The application provides website building and management capabilities through an AI panel and various studio features. It uses browser-based storage (IndexedDB/localStorage) for data persistence and appears to be built with React/Next.js based on the localhost port pattern.

### Available Documentation Analysis

**Available Documentation:**
- ✓ Project Brief (comprehensive overview)
- ✓ Requirements document
- ✓ UI/UX References (Base44 screenshots)
- ⚠️ Partial Tech Stack Documentation (inferred from brief)
- ⚠️ Limited Architecture Documentation
- ❌ Coding Standards (need to analyze existing code)
- ❌ API Documentation (need to verify AI panel interface)
- ❌ Technical Debt Documentation

### Enhancement Scope Definition

**Enhancement Type:**
- ✓ New Feature Addition (Dashboard)
- ✓ Major Feature Modification (Studio ID routing)
- ✓ UI/UX Overhaul (AI-first interface)

**Enhancement Description:**
Transform Catalyst Studio from a single-website tool into a multi-website management platform with an AI-powered dashboard for creating and managing multiple website projects through natural language prompts.

**Impact Assessment:**
- ✓ Significant Impact (substantial existing code changes)
  - Studio must support ID-based routing
  - Browser storage schema needs extension
  - AI panel requires prompt integration

### Goals and Background Context

**Goals:**
- Enable management of 10+ websites per user within single instance
- Reduce context-switching time by 75% between projects
- Provide AI-first website creation through natural language
- Maintain 90% of existing studio features without modification

**Background Context:**
The current single-website limitation prevents Catalyst Studio from serving professional developers and agencies who manage multiple projects. Users must run multiple instances or reconfigure the application for each website. This enhancement addresses workflow inefficiencies and positions Catalyst Studio as an AI-first development platform, following patterns seen in successful tools like Base44.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-08-12 | 1.0 | Created Brownfield PRD for Multi-Website Support | John (PM) |

## Requirements

### Functional Requirements

- **FR1**: The system shall provide a new dashboard route at `/dashboard` displaying all user websites in a card-based grid layout
- **FR2**: The dashboard shall feature an AI-powered "What would you build today?" prompt for natural language website creation
- **FR3**: Users shall be able to create new websites by describing their concept in the prompt, which automatically generates a website entry
- **FR4**: The system shall route website selections to `/studio/{id}` with proper context loading from browser storage
- **FR5**: Quick category tags (CRM, Dev productivity, Educational, etc.) shall provide one-click website type suggestions
- **FR6**: The AI panel at `/studio/{id}/ai` shall receive and process the initial website creation prompt
- **FR7**: Recent Apps section shall display previously created websites with name, icon, and brief description
- **FR8**: All existing studio features shall remain functional when accessed with a website ID parameter
- **FR9**: Browser storage shall maintain separate data contexts for each website ID
- **FR10**: The system shall support a minimum of 50 websites stored in browser storage

### Non-Functional Requirements

- **NFR1**: Dashboard page load time shall not exceed 1.5 seconds with 20 websites displayed
- **NFR2**: Website context switching shall complete within 3 seconds
- **NFR3**: The enhancement shall maintain existing performance characteristics with no more than 10% degradation
- **NFR4**: Browser storage usage shall be optimized to stay within IndexedDB limits (50MB typical)
- **NFR5**: All UI components shall maintain visual consistency with existing studio design patterns
- **NFR6**: The system shall validate all ID parameters to prevent injection attacks
- **NFR7**: Website data isolation shall ensure no cross-contamination between different website contexts

### Compatibility Requirements

- **CR1**: All existing studio API endpoints shall remain unchanged and continue to function with ID parameterization
- **CR2**: Current browser storage schema shall be extended, not replaced, maintaining backward compatibility
- **CR3**: UI components and styling shall use the existing component library and design system
- **CR4**: Integration with existing AI panel shall use current props/context patterns without breaking changes

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: JavaScript/TypeScript  
**Frameworks**: React/Next.js (localhost:3001 pattern)  
**Database**: Browser-based storage (IndexedDB/localStorage)  
**Infrastructure**: Local development environment, Node.js server  
**External Dependencies**: AI processing services, existing studio dependencies

### Integration Approach

**Database Integration Strategy**: Extend existing browser storage schema with website-specific namespacing. Each website gets its own storage partition using ID prefix (e.g., `website_{id}_config`)

**API Integration Strategy**: Modify existing API endpoints to accept optional website ID parameter. Maintain backward compatibility by defaulting to single-website mode when ID not provided

**Frontend Integration Strategy**: Wrap existing studio components with WebsiteContext provider to inject ID-based configuration. Dashboard uses shared component library for consistent UI

**Testing Integration Strategy**: Extend existing test suite with multi-website scenarios. Each story branch includes tests for both single and multi-website modes

### Code Organization and Standards

**File Structure Approach**: 
- `/src/pages/dashboard` - New dashboard components
- `/src/contexts/WebsiteContext.js` - ID-based context management
- `/src/services/websiteStorage.js` - Browser storage abstraction
- Existing studio structure remains unchanged

**Naming Conventions**: Follow existing patterns - camelCase for functions, PascalCase for components, kebab-case for routes

**Coding Standards**: Maintain existing ESLint/Prettier configuration. Use existing error handling and logging patterns

**Documentation Standards**: JSDoc comments for new services, README updates for multi-website setup

### Deployment and Operations

**Build Process Integration**: No changes to existing build pipeline. Dashboard builds as part of standard Next.js build

**Deployment Strategy**: Feature flag for multi-website mode during rollout. Gradual migration path for existing users

**Monitoring and Logging**: Extend existing logging to include website ID in all log entries. Monitor browser storage usage per website

**Configuration Management**: Store website metadata in browser storage. No server-side configuration changes required

### Risk Assessment and Mitigation

**Technical Risks**: 
- Browser storage limits may be reached with extensive website data
- ID parameter refactoring might break existing studio features
- AI panel integration complexity unknown

**Integration Risks**: 
- Existing single-website users may experience confusion
- Data migration from single to multi-website mode
- Performance degradation with many websites

**Deployment Risks**: 
- Breaking changes to studio routing
- Browser storage corruption during migration
- Feature flag complexity

**Mitigation Strategies**: 
- Implement storage quota monitoring and warnings
- Comprehensive testing of all studio routes with IDs
- Gradual rollout with feature flags
- Backup/restore functionality for browser storage
- Clear migration documentation and automated migration scripts

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic (Epic-3) for the Multi-Website Support enhancement. This approach is chosen because:
- All features are interrelated and dependent on the core ID-based routing change
- The dashboard and studio modifications must be deployed together for coherent functionality
- Testing and rollback strategies are simpler with a single epic
- The AI-powered creation flow requires coordinated changes across dashboard and studio

This epic will be developed using **gitflow methodology** with:
- Main epic branch: `feature/epic-3-multi-website-support`
- Individual story branches created from the epic branch
- Each story following the pattern: `feature/epic-3-story-X-description`
- Pull requests for each story back to epic branch
- Final epic PR to develop branch after all stories complete

## Epic 3: Multi-Website Support Enhancement

**Epic Goal**: Transform Catalyst Studio from a single-website tool into a comprehensive multi-website management platform with AI-powered website creation, enabling users to manage multiple projects through a centralized dashboard while maintaining all existing studio functionality.

**Integration Requirements**: Seamless integration with existing studio features through ID-based routing, browser storage partitioning, and AI panel prompt passing. Zero disruption to current single-website users with gradual migration path.

### Story 3.1: Browser Storage Schema Extension

As a **developer**,  
I want **to extend the browser storage schema to support multiple website contexts**,  
so that **each website's data remains isolated and properly scoped**.

**Gitflow Branch**: `feature/epic-3-story-1-storage-schema`

#### Acceptance Criteria
1. Browser storage service created with website ID namespacing
2. Storage API supports CRUD operations for website metadata
3. Each website gets isolated storage partition
4. Migration utility converts existing single-website data
5. Storage quota monitoring implemented with warnings at 80% capacity

#### Integration Verification
- IV1: Existing single-website storage continues to work unchanged
- IV2: No data loss during migration from single to multi-website mode
- IV3: Storage operations maintain current performance (< 50ms read/write)

---

### Story 3.2: Studio ID-Based Routing Implementation

As a **developer**,  
I want **to modify the studio to accept and process website ID parameters**,  
so that **the studio can load different website contexts based on the route**.

**Gitflow Branch**: `feature/epic-3-story-2-studio-routing`

#### Acceptance Criteria
1. Studio route accepts optional `{id}` parameter at `/studio/{id}`
2. WebsiteContext provider wraps studio components
3. Context loads correct website data from browser storage
4. Default behavior (no ID) maintains single-website compatibility
5. All studio sub-routes properly inherit website ID context

#### Integration Verification
- IV1: All existing studio features work with ID parameter
- IV2: Navigation between studio sections maintains website context
- IV3: No performance degradation in studio load time

---

### Story 3.3: Dashboard Foundation and Layout

As a **user**,  
I want **to see a dashboard displaying all my websites**,  
so that **I can view and access all my projects from one place**.

**Gitflow Branch**: `feature/epic-3-story-3-dashboard-foundation`

#### Acceptance Criteria
1. New `/dashboard` route created and accessible
2. Card-based grid layout implemented matching Base44 pattern
3. Website cards display name, icon/thumbnail, last modified date
4. Responsive design works on desktop and tablet viewports
5. Dashboard loads within 1.5 seconds with 20 websites

#### Integration Verification
- IV1: Dashboard uses existing component library and styles
- IV2: Navigation from dashboard to studio maintains session state
- IV3: Dashboard performance scales linearly with website count

---

### Story 4.4: AI-Powered Website Creation

As a **user**,  
I want **to create new websites by describing them in natural language**,  
so that **I can quickly start new projects without manual configuration**.

**Gitflow Branch**: `feature/epic-3-story-4-ai-creation`

#### Acceptance Criteria
1. "What would you build today?" prompt interface implemented
2. Text input accepts natural language website descriptions
3. Quick category tags provide one-click suggestions
4. Prompt submission creates website entry in browser storage
5. After creation, auto-navigate to `/studio/{id}/ai` with prompt

#### Integration Verification
- IV1: AI panel receives and processes the initial prompt correctly
- IV2: Website creation doesn't affect existing websites
- IV3: Creation completes within 3 seconds including navigation

---

### Story 5.5: Recent Apps and Website Selection

As a **user**,  
I want **to see and access my recently created websites**,  
so that **I can quickly resume work on existing projects**.

**Gitflow Branch**: `feature/epic-3-story-5-recent-apps`

#### Acceptance Criteria
1. Recent Apps section displays below the creation prompt
2. Website cards are clickable and navigate to studio
3. Cards show accurate last modified timestamps
4. Maximum 12 recent apps shown with "View All" option
5. Deleted websites are removed from recent apps

#### Integration Verification
- IV1: Clicking a website loads correct context in studio
- IV2: Recent apps updates immediately after website creation
- IV3: Navigation between websites maintains data integrity

---

### Story 3.6: Testing, Documentation, and Feature Flag

As a **developer**,  
I want **comprehensive testing and documentation for multi-website support**,  
so that **the feature can be safely deployed and maintained**.

**Gitflow Branch**: `feature/epic-3-story-6-testing-docs`

#### Acceptance Criteria
1. Unit tests cover all new storage and routing functions
2. E2E tests verify complete user flows
3. Feature flag enables/disables multi-website mode
4. Migration guide documents upgrade process
5. Developer documentation covers architecture changes

#### Integration Verification
- IV1: All existing tests continue to pass
- IV2: Feature flag correctly toggles between single/multi modes
- IV3: No regression in existing functionality test coverage

---

## Development Workflow

### Gitflow Process for Epic-3

1. **Epic Branch Creation**
   ```bash
   git checkout -b feature/epic-3-multi-website-support develop
   ```

2. **Story Development**
   - Each story creates branch from epic branch
   - Developer completes story on feature branch
   - Create PR back to epic branch for review
   - Merge to epic branch after approval

3. **Epic Completion**
   - All stories merged to epic branch
   - Full regression testing on epic branch
   - Create PR from epic to develop
   - Deploy to staging for UAT

4. **Production Release**
   - Merge develop to main/master
   - Tag release with version number
   - Deploy with feature flag initially disabled

## Success Metrics

- 10+ websites manageable per user
- 75% reduction in context-switching time
- < 3 second website switching
- < 1.5 second dashboard load
- 90% existing features working unchanged
- Zero data loss during migration

## Next Steps

1. Review and approve this PRD
2. Create Epic-3 branch in repository
3. Assign Story 3.1 (Storage Schema) to developer
4. Begin development following gitflow process
5. Schedule weekly epic progress reviews