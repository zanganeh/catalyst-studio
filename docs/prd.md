# Catalyst Studio Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Existing Project Overview

#### Analysis Source
- IDE-based fresh analysis
- Project brief available at: `project-brief.md`
- Mockup HTML available at: `/index.html`

#### Current Project State
**Catalyst Studio** is an AI-powered website builder that enables digital teams to visually prototype, build, and deploy professional websites to their existing CMS platforms. The current implementation includes:

- **AI Chat Interface**: Working implementation using OpenRouter and Vercel AI SDK v4 for conversational website building
- **Visual Mockup**: Customer-approved HTML prototype showcasing the three-column layout with chat panel, navigation sidebar, and main content area
- **Core Vision**: Platform that bridges ideation and implementation through AI-driven generation of content models, sample content, and Next.js frontend code
- **CMS Integration Focus**: Primary targets are Optimizely, Contentful, and Strapi for enterprise deployments

The project is positioned as an intelligent workspace for rapid prototyping with a "build and hand off" philosophy, ensuring users own everything with no ongoing vendor dependency.

### Available Documentation Analysis

#### Available Documentation
- ✓ Project Brief (comprehensive vision and strategy document)
- ✓ Visual Mockup (customer-approved UI/UX prototype)
- ✓ Tech Stack Documentation (partial - OpenRouter, Vercel AI SDK v4)
- ⚬ Source Tree/Architecture (needs documentation)
- ⚬ Coding Standards (to be established)
- ⚬ API Documentation (needs documentation for AI chat implementation)
- ⚬ External API Documentation (OpenRouter integration needs documentation)
- ✓ UX/UI Guidelines (demonstrated in mockup with Catalyst X visual identity)
- ⚬ Technical Debt Documentation (early stage, minimal debt)

### Enhancement Scope Definition

#### Enhancement Type
- ✓ Major Feature Modification
- ✓ Integration with New Systems
- ✓ UI/UX Implementation (from mockup to production)
- ✓ Technology Stack Enhancement

#### Enhancement Description
Transform the existing simple AI chatbot implementation and approved HTML mockup into a fully-functional brownfield MVP that delivers the core Catalyst Studio experience. This includes implementing the visual prototype's UI/UX, enhancing the AI chat with structured prompts and workflows, integrating content modeling capabilities, and establishing the foundation for CMS deployment features.

#### Impact Assessment
- ✓ Significant Impact (substantial existing code changes)
- The current simple chat implementation will be significantly enhanced with structured prompt systems, workflow management, and integration with the visual UI components from the mockup

### Goals and Background Context

#### Goals
- Transform the approved HTML mockup into a production React/Next.js application maintaining the exact UI/UX customers have validated
- Enhance the simple AI chat to support structured website generation workflows with content modeling
- Implement the core content type builder and visual preview capabilities demonstrated in the mockup
- Establish the foundation for CMS integration starting with mock deployments
- Create a working MVP that demonstrates the complete user journey from natural language to website prototype

#### Background Context
The project has reached a critical milestone with customer validation of the UI/UX through the HTML mockup. The existing AI chat implementation using OpenRouter and Vercel AI SDK provides a working foundation for conversational interactions. Now we need to bridge these elements - transforming the static mockup into a dynamic application while enhancing the AI capabilities to deliver on the core value proposition of rapid website prototyping and CMS deployment.

This enhancement is essential to move from proof-of-concept to a functional MVP that can be demonstrated to potential users and early adopters. The focus is on delivering the core experience that validates the product-market fit while maintaining flexibility for future enhancements.

### Change Log
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial PRD | 2025-01-08 | 1.0 | Brownfield PRD for MVP implementation | PM |
| PO Validation Updates | 2025-01-08 | 2.0 | Revised after PO Master Checklist validation - decomposed Story 1.1, added protection requirements, moved persistence earlier, deferred analytics | Sarah (PO) |

## Critical Pre-Development Requirements (v2.0)

### Protection Layer (MUST COMPLETE BEFORE STORY 1.1a)
1. **Snapshot Testing**: Create Playwright tests capturing current chat behavior
2. **Error Boundaries**: Wrap existing chat in error handling
3. **Feature Flags**: Implement toggle system for new features
4. **Performance Baseline**: Document current load/response times
5. **Git Protection Branch**: Create checkpoint for rollback

### Testing Infrastructure
- **Platform**: Windows local development
- **Framework**: Playwright for E2E testing
- **Approach**: Run tests locally before/after each story
- **Coverage Goal**: 100% for existing features, 80% for new

## Requirements

### Functional Requirements
- **FR1**: The application shall implement the three-column layout from the approved mockup with chat panel (360px), navigation sidebar (260px), and flexible main content area
- **FR2**: The AI chat interface shall maintain the existing OpenRouter and Vercel AI SDK integration while adding structured prompt templates for website generation workflows
- **FR3**: The content type builder shall provide visual field management with drag-and-drop capabilities as demonstrated in the mockup
- **FR4**: The system shall generate appropriate content models based on natural language project descriptions using AI
- **FR5**: The preview system shall support device switching between desktop, tablet, and mobile views with accurate responsive frames
- **FR6**: The navigation system shall implement expandable sections for content management, analytics, development, and integrations
- **FR7**: The system shall support project persistence to save and reload work across sessions
- **FR8**: The AI assistant shall provide contextual responses for content creation, deployment, SEO, and analytics queries
- **FR9**: The modal system shall handle content editing and field type selection with proper overlay management
- **FR10**: The system shall generate sample content that demonstrates the content model with realistic placeholder data

### Non-Functional Requirements
- **NFR1**: The application shall maintain the Catalyst X visual identity with the specified color palette (#FF5500, #212121, #0077CC, #00AA55) and geometric design language
- **NFR2**: The system shall generate complete website prototypes within 60 seconds of receiving project description
- **NFR3**: The preview updates shall render within 2 seconds of making changes
- **NFR4**: The application shall support Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+ browsers
- **NFR5**: The UI shall maintain glass morphism effects and smooth animations with cubic-bezier transitions as per the mockup
- **NFR6**: The application shall use Inter font family with specified weight variations (200, 400, 500, 700)
- **NFR7**: The system shall handle API rate limits from OpenRouter gracefully with queuing and retry logic
- **NFR8**: The application shall maintain responsive design for desktop and tablet usage (mobile view for preview only)

### Compatibility Requirements
- **CR1**: The enhanced AI chat must maintain compatibility with the existing OpenRouter API integration and Vercel AI SDK v4 implementation
- **CR2**: The application must preserve the ability to switch between different AI models available through OpenRouter
- **CR3**: The UI implementation must exactly match the customer-approved mockup's visual design and interaction patterns
- **CR4**: The system architecture must support future integration with Optimizely, Contentful, and Strapi CMS platforms

## User Interface Enhancement Goals

### Integration with Existing UI
The new React/Next.js implementation will faithfully reproduce the approved HTML mockup's design, maintaining:
- The established three-column layout architecture
- Glass morphism effects with backdrop blur and transparency
- Catalyst X brand identity with geometric 45-degree angle motifs
- Smooth hover animations and transform effects
- Consistent emoji icon system for navigation elements
- The established color palette and typography system

### Modified/New Screens and Views
- **Chat Panel**: Enhanced from simple chat to structured conversation with suggestion chips and typing indicators
- **Content Type Builder**: Interactive visual schema builder with field management
- **Preview System**: Multi-device responsive preview with frame switching
- **Analytics Dashboard**: Mock implementation with real-time visitor tracking visualization
- **Source Code Editor**: Syntax-highlighted code view with file browser
- **Modals**: Content editing and field type selection overlays
- **Navigation Sidebar**: Expandable sections with consistent interaction patterns

### UI Consistency Requirements
- All new components must use the established Catalyst X design tokens
- Maintain the 45-degree geometric pattern throughout new elements
- Preserve the glass morphism aesthetic with consistent backdrop-filter values
- Use the defined transition timing functions (cubic-bezier) for all animations
- Ensure color usage follows the brand palette strictly
- Maintain the established spacing and typography scale

## Technical Constraints and Integration Requirements

### Existing Technology Stack
**Languages**: TypeScript, JavaScript
**Frameworks**: Next.js 14+, React 18, Vercel AI SDK v4
**Styling**: Tailwind CSS (to be implemented based on mockup styles)
**AI Integration**: OpenRouter API
**Infrastructure**: Vercel deployment-ready
**External Dependencies**: OpenRouter for AI models, future CMS APIs

### Integration Approach
**Database Integration Strategy**: Initially use in-memory/localStorage for project persistence, prepare for PostgreSQL migration
**API Integration Strategy**: Maintain existing OpenRouter integration, add abstraction layer for future CMS APIs
**Frontend Integration Strategy**: Convert HTML mockup to React components, maintain exact visual fidelity
**Testing Integration Strategy**: Implement Jest/React Testing Library for component testing, Playwright for E2E

### Code Organization and Standards
**File Structure Approach**: Feature-based organization within Next.js app directory structure
**Naming Conventions**: React component PascalCase, utilities camelCase, consistent with Next.js conventions
**Coding Standards**: ESLint with Next.js recommended rules, Prettier for formatting
**Documentation Standards**: JSDoc for complex functions, README for setup, inline comments for business logic

### Deployment and Operations
**Build Process Integration**: Next.js build pipeline with TypeScript compilation
**Deployment Strategy**: Vercel deployment with preview deployments for PRs
**Monitoring and Logging**: Console logging for development, prepare for production logging service
**Configuration Management**: Environment variables for API keys, next.config.js for build configuration

### Risk Assessment and Mitigation
**Technical Risks**: API rate limiting from OpenRouter, complexity of AI prompt engineering
**Integration Risks**: Future CMS API compatibility, maintaining UI consistency during React conversion
**Deployment Risks**: Managing secrets and API keys securely, performance at scale
**Mitigation Strategies**: Implement rate limiting queue, comprehensive error handling, progressive enhancement approach, thorough testing of mockup conversion

## Epic and Story Structure

### Epic Approach
**Epic Structure Decision**: Single comprehensive epic for the brownfield MVP enhancement. This approach is optimal because all features are tightly integrated to deliver the core Catalyst Studio experience. The enhancement transforms the existing simple implementation into the full MVP vision demonstrated in the approved mockup.

## Epic 1: Catalyst Studio MVP Implementation

**Epic Goal**: Transform the existing AI chat implementation and approved HTML mockup into a fully functional Catalyst Studio MVP that enables users to generate website prototypes through natural language conversations

**Integration Requirements**: Maintain compatibility with existing OpenRouter integration, preserve exact UI/UX from customer-approved mockup, establish foundation for future CMS deployments

### Story 1.1a: Basic Three-Column Layout Structure (v2.0 - Decomposed)
**Priority**: P0 - Critical Foundation | **Effort**: 2-4 hours | **Risk**: Low

As a developer,
I want to implement the basic three-column layout structure,
so that we have a foundation without breaking existing functionality.

#### Acceptance Criteria
1. Three-column grid implemented (360px + 260px + flex)
2. Existing chat remains in left panel unchanged
3. Empty shells for navigation and main content
4. No visual styling - structure only
5. Feature flag: `threeColumnLayout` controls activation

#### Protection Requirements
- [ ] Run chat tests before starting
- [ ] Verify chat still works with new layout
- [ ] Performance remains within baseline
- [ ] Can toggle layout on/off via feature flag

---

### Story 1.1b: Catalyst X Visual Identity (v2.0 - Decomposed)
**Priority**: P0 - Brand Critical | **Effort**: 3-4 hours | **Risk**: Low

As a designer,
I want to apply the Catalyst X visual identity incrementally,
so that we match the approved mockup without disrupting functionality.

#### Acceptance Criteria
1. Color tokens defined (#FF5500, #212121, #0077CC, #00AA55)
2. Inter font family applied (weights: 200, 400, 500, 700)
3. Geometric patterns added as CSS
4. Existing components retain functionality
5. Feature flag: `catalystBranding` controls activation

#### Protection Requirements
- [ ] Visual changes don't affect chat logic
- [ ] Colors meet WCAG AA contrast requirements
- [ ] No performance degradation from fonts/patterns

---

### Story 1.1c: Glass Morphism & Animations (v2.0 - Decomposed)
**Priority**: P1 - Enhancement | **Effort**: 2-3 hours | **Risk**: Medium

As a user,
I want smooth animations and glass morphism effects,
so that the interface feels modern and responsive.

#### Acceptance Criteria
1. Backdrop-blur effects on panels
2. Hover animations (scale, opacity)
3. Transition timing (200-300ms)
4. Feature flag: `glassMorphism` and `animations`
5. Fallback for browsers without backdrop-filter support

#### Protection Requirements
- [ ] Animations maintain 60fps
- [ ] Reduced motion respects user preferences
- [ ] Performance impact < 10% on load time

---

### Story 1.1d: Base Component Structure (v2.0 - Decomposed)
**Priority**: P0 - Foundation | **Effort**: 3-4 hours | **Risk**: Low

As a developer,
I want to establish the component structure for all UI sections,
so that subsequent stories have containers ready.

#### Acceptance Criteria
1. Component shells created for all major sections
2. Folder structure matches architecture doc
3. Navigation routing prepared (not functional)
4. Props interfaces defined
5. Storybook stories for components

#### Protection Requirements
- [ ] No impact on existing chat component
- [ ] All components have error boundaries
- [ ] TypeScript strict mode compliance

### Story 1.2: Enhance AI Chat with Structured Workflows

As a user,
I want the AI chat to guide me through website creation with structured prompts,
so that I can easily describe and refine my website requirements.

#### Acceptance Criteria
1. Structured prompt templates implemented for website generation
2. Suggestion chips provide quick actions (Add Newsletter, More Content, Deploy)
3. Typing indicator shows when AI is processing
4. Conversation history properly managed with user/AI message styling
5. Context-aware responses based on project state

#### Integration Verification
- IV1: Existing OpenRouter and Vercel AI SDK integration continues working
- IV2: Chat maintains visual design from mockup exactly
- IV3: Response times remain under 2 seconds for UI updates

### Story 1.3: Implement Content Type Builder

As a content creator,
I want to visually build and manage content types with fields,
so that I can define my website's data structure without coding.

#### Acceptance Criteria
1. Visual content type builder with field management interface
2. Drag-and-drop functionality for field reordering
3. Modal system for field type selection (text, image, date, etc.)
4. Field properties configuration (required, default values, validation)
5. Visual representation of content model relationships

#### Integration Verification
- IV1: UI components match mockup's content type builder exactly
- IV2: Smooth animations and interactions as demonstrated
- IV3: Modal system properly manages z-index and overlay behavior

### Story 1.4: Create Preview System with Device Switching

As a user,
I want to preview my website on different devices,
so that I can ensure responsive design before deployment.

#### Acceptance Criteria
1. Device switcher for desktop, tablet, and mobile views
2. Accurate device frames with proper dimensions
3. Live preview updates within 2 seconds of changes
4. Responsive content rendering within device frames
5. Preview navigation between generated pages

#### Integration Verification
- IV1: Preview frames match mockup's visual design
- IV2: Device switching maintains smooth transitions
- IV3: Generated content renders correctly in all device views

### Story 1.5: Implement Navigation and View Management

As a user,
I want to navigate between different sections of the application,
so that I can access all features of Catalyst Studio.

#### Acceptance Criteria
1. Expandable navigation sections with arrow indicators
2. View switching between Overview, Content, Analytics, Development, Integrations
3. Active state indication for current view
4. Smooth transitions between views
5. Proper state management for each view

#### Integration Verification
- IV1: Navigation behavior matches mockup exactly
- IV2: All views load without breaking application state
- IV3: Navigation performance remains smooth with no lag

### Story 1.6: Add Content Management and Editing

As a content editor,
I want to create and edit content items,
so that I can populate my website with real data.

#### Acceptance Criteria
1. Content list view with all items for selected content type
2. Modal-based content creation and editing forms
3. Form fields dynamically generated based on content type
4. Save and cancel functionality with proper state management
5. Content preview in list view

#### Integration Verification
- IV1: Modal system matches mockup's design and behavior
- IV2: Form generation works with all field types
- IV3: Content changes reflect immediately in preview

### Story 1.7: Basic Chat Persistence (v2.0 - Moved Earlier in Sequence)
**Priority**: P0 - Data Protection | **Effort**: 4-5 hours | **Risk**: Medium
**Note**: Moved from original position to Sprint 1 to protect user data early

As a user,
I want my chat conversations to persist across sessions,
so that I don't lose my work on refresh.

#### Acceptance Criteria
1. Chat messages saved to localStorage
2. Automatic save on each message
3. Recovery on page reload
4. Clear storage option in settings
5. Feature flag: `projectPersistence`

#### Protection Requirements
- [ ] Existing chat continues working without persistence
- [ ] Storage errors don't crash chat
- [ ] Performance impact < 100ms per save
- [ ] Storage quota handling (5MB limit)

### Story 1.8: DEFERRED - Analytics Dashboard (v2.0)
**Status**: Moved to Post-MVP
**Reason**: Not critical for MVP validation, adds complexity without core value

Original Story: Create analytics dashboard with visitor tracking visualization
Decision: Defer to focus on core journey (Chat → Content → Preview → Export)

### Story 1.9: Add Source Code View

As a developer,
I want to view the generated source code,
so that I can understand and export the website implementation.

#### Acceptance Criteria
1. Syntax-highlighted code editor view
2. File browser showing project structure
3. File tab navigation for open files
4. Code export functionality
5. Proper formatting for different file types

#### Integration Verification
- IV1: Code view matches mockup's editor design
- IV2: Syntax highlighting works for all supported languages
- IV3: Large files display without performance issues

### Story 1.10: Implement Mock CMS Deployment

As a user,
I want to simulate deploying my website to a CMS,
so that I can understand the deployment process.

#### Acceptance Criteria
1. Deployment button with loading states
2. CMS selection interface (Optimizely, Contentful, Strapi)
3. Mock deployment process with progress indication
4. Success/error state handling
5. Connection status indicators for each CMS

#### Integration Verification
- IV1: Deployment UI matches mockup exactly
- IV2: Mock process demonstrates realistic timing
- IV3: Prepared for future real CMS integration

---

## Validation and Sign-off

**Product Owner Review**: This PRD requires review and approval before development begins. The story sequence is designed to incrementally build the MVP while maintaining system stability and visual fidelity to the approved mockup.

**Technical Review**: Development team should review the technical constraints and story sequence to ensure feasibility within the Next.js and Vercel AI SDK architecture.

**Next Steps**: Upon approval, stories will be loaded into the project management system and development can begin with Story 1.1 (Next.js application structure setup).