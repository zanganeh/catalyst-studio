# Epic 9: Visual Sitemap Builder - Project Brief

## 1. Executive Summary

### Project Title
Visual Sitemap Builder - Production Implementation

### Project Code
Epic 9

### Project Type
Feature Enhancement - Core Platform Capability

### Business Objective
Transform the existing React Flow sitemap demonstration into a production-ready visual site structure management system, enabling users to intuitively create, modify, and manage their website hierarchies through a drag-and-drop interface connected to the production database.

### Strategic Alignment
This project directly supports Catalyst Studio's mission to democratize web development by providing a visual, intuitive interface for managing complex site structures without requiring technical expertise. It bridges the gap between visual design and technical implementation, reducing the barrier to entry for content creators and site managers.

### Estimated Investment
- **Timeline**: 6 weeks
- **Team Size**: 2-3 developers
- **Budget Allocation**: ~240-360 development hours

### Expected ROI
- **Time to Value**: Immediate upon deployment
- **Efficiency Gains**: Target 50% reduction in site structure creation time (baseline measurement required post-launch)
- **User Adoption**: Expected 85% of active users to utilize within first month
- **Support Reduction**: 40% decrease in support tickets related to site structure management

---

## 2. Business Context

### Current State Analysis

#### Pain Points
1. **Complex Navigation Management**: Users currently manage site structures through forms and lists, making it difficult to visualize hierarchies
2. **Error-Prone Process**: Manual URL management and parent-child relationships lead to broken links and orphaned pages
3. **Limited Bulk Operations**: No efficient way to reorganize large sections of a site
4. **Poor User Experience**: Current interface requires technical understanding of hierarchical relationships
5. **Inefficient Workflow**: Creating multi-level site structures requires numerous page loads and form submissions

#### Market Context
- Competitors (Webflow, Wix, Squarespace) offer visual site builders as core features
- Visual interfaces have become the industry standard for site management
- Users expect WYSIWYG experiences in modern web platforms
- Growing demand for no-code/low-code solutions in enterprise settings

### Opportunity Assessment

#### Strategic Value
- **Competitive Differentiation**: Premium feature that justifies subscription pricing
- **Platform Stickiness**: Visual tools increase user engagement and reduce churn
- **Enterprise Appeal**: Visual management tools are essential for enterprise adoption
- **Upsell Potential**: Gateway feature for premium tier conversions

#### User Value
- **Intuitive Management**: Visual representation matches mental models of site structure
- **Faster Development**: Drag-and-drop reduces time from concept to implementation
- **Reduced Errors**: Visual feedback prevents common structural mistakes
- **Better Collaboration**: Non-technical stakeholders can participate in site planning

---

## 3. Problem Statement

### Core Problem
Content creators and site managers struggle to efficiently create and manage complex website hierarchies using traditional form-based interfaces, resulting in errors, inefficiencies, and poor user experience that limits platform adoption and user satisfaction.

### Problem Dimensions

#### Technical Challenges
- Disconnection between visual demo and production data
- Lack of real-time synchronization with database
- No automatic layout algorithm for optimal visualization
- Missing undo/redo functionality for user confidence
- Absence of bulk operation capabilities

#### User Experience Challenges
- Cognitive load of understanding hierarchical relationships in list views
- Difficulty visualizing impact of structural changes
- Time-consuming process for site reorganization
- No visual feedback for page relationships and dependencies
- Limited ability to manage components within pages

#### Business Impact
- **User Retention**: 30% of trial users cite site management complexity as abandonment reason
- **Support Costs**: 25% of support tickets relate to site structure issues
- **Feature Adoption**: Only 40% of users utilize advanced site features due to complexity
- **Competitive Disadvantage**: Lack of visual tools cited in 60% of competitive loss reviews

---

## 4. Solution Overview

### Proposed Solution
Implement a production-ready visual sitemap builder by enhancing the existing React Flow demo with database connectivity, automatic layout algorithms, comprehensive state management, and essential user features including undo/redo, bulk operations, and component management.

### Solution Architecture

#### Core Components
1. **Visual Interface Layer**
   - React Flow-based drag-and-drop canvas
   - Automatic DAG layout engine using Dagre
   - Real-time visual feedback and animations
   - Multi-select and bulk operation UI

2. **State Management Layer**
   - Zustand-based centralized state store
   - Optimistic UI updates with rollback capability
   - Debounced save queue with conflict resolution
   - Comprehensive undo/redo with 50-operation history

3. **Data Persistence Layer**
   - RESTful API endpoints for CRUD operations
   - Transactional bulk operation processing
   - Incremental change tracking and saving
   - Database schema extensions for folder support

4. **Component System**
   - Dynamic component discovery and registration
   - Component reordering within pages
   - Default configuration management (components use defaults only - no configuration UI in MVP)
   - Future-ready for visual configuration

### Key Features (MVP Scope)

#### What We're NOT Building (MVP Exclusions)
To ensure clarity on MVP scope, the following features are explicitly excluded:
- **Real-time collaboration** - Single-user editing only, last-write-wins approach
- **Import/export functionality** - No JSON, CSV, or sitemap.xml support in MVP
- **Rich metadata** - No SEO scores, analytics integration in MVP
- **Position persistence** - Layout recalculates on each load, no browser storage
- **Performance optimization** - Accepting degradation beyond ~100 nodes
- **Component configuration UI** - Components use defaults only, no property editing
- **Component versioning** - No versioning system, breaking changes accepted
- **Advanced security** - Basic session auth only, no RBAC or granular permissions
- **Position manual adjustment** - Auto-layout only, no manual positioning

#### Essential Capabilities
1. **Visual Sitemap Editor**
   - Drag-and-drop node positioning
   - Parent-child relationship management
   - Visual hierarchy representation
   - Zoom and pan controls

2. **Page & Folder Management**
   - Create pages and organizational folders
   - Edit titles, slugs, and metadata
   - Delete with cascade handling
   - Move between parents
   - Note: Folders return 404 when accessed directly (security design decision)

3. **Component System**
   - Add components to pages
   - Remove components from pages
   - Reorder components within pages
   - View component inventory

4. **Smart Layout Engine**
   - Automatic DAG-based positioning
   - Configurable spacing and alignment
   - No manual position management required
   - Responsive to hierarchy changes

5. **Undo/Redo System**
   - Comprehensive undo/redo with 50-operation history
   - Keyboard shortcut support (Ctrl+Z/Ctrl+Y)
   - Visual indication of available actions
   - State preservation across operations

6. **Bulk Operations**
   - Multi-select via Shift+Click or area selection
   - Bulk delete with confirmation
   - Bulk status changes
   - Best-effort operation handling

---

## 5. Success Criteria

### Acceptance Criteria

#### Functional Requirements
- [ ] Users can create, edit, delete pages and folders visually
- [ ] Drag-and-drop repositioning updates database relationships
- [ ] Components can be added, removed, and reordered within pages
- [ ] Automatic layout maintains readable visualization
- [ ] Undo/redo works for all user operations
- [ ] Bulk operations process multiple items efficiently
- [ ] Changes persist to database within 1 second
- [ ] System handles up to ~100 nodes (performance degradation accepted beyond this in MVP)

#### Non-Functional Requirements
- [ ] Initial load time < 3 seconds for 100-node sitemap
- [ ] Drag operations respond within 16ms (60 FPS)
- [ ] Save operations complete within 1 second
- [ ] Zero data loss under normal operations
- [ ] Graceful handling of network failures
- [ ] Accessibility compliance (WCAG 2.1 AA)

### Success Metrics

#### Performance Metrics
- **Load Time**: < 3 seconds for typical sitemap (50-100 nodes)
- **Interaction Latency**: < 100ms for user actions
- **Save Latency**: < 1 second for change persistence
- **Frame Rate**: Maintain 60 FPS during drag operations

#### User Experience Metrics
- **Task Completion Time**: Target 50% reduction in site structure creation time (baseline measurement required)
- **Error Rate**: < 1% user errors in structural operations
- **User Satisfaction**: > 4.5/5 rating for sitemap builder
- **Feature Adoption**: 85% of active users within first month

#### Business Metrics
- **Support Ticket Reduction**: 40% decrease in structure-related tickets
- **User Retention**: 15% improvement in 30-day retention
- **Premium Conversion**: 20% increase in trial-to-paid conversion
- **Engagement**: 3x increase in average session duration

---

## 6. Technical Requirements

### Browser Requirements

#### Supported Browsers (MVP)
- **Chrome**: Version 90+ (required)
- **Firefox**: Version 88+ (required)
- **Safari**: Version 14+ (required)
- **Edge**: Version 90+ (required)
- **Internet Explorer**: Not supported

#### Browser Feature Dependencies
- ES6+ JavaScript support
- CSS Grid and Flexbox
- WebGL for React Flow rendering
- Drag and Drop API
- ResizeObserver API

### System Architecture

#### Frontend Stack
```javascript
{
  "core": {
    "framework": "Next.js 14+ (App Router)",
    "ui-library": "React 18+",
    "flow-diagram": "React Flow 11.10+",
    "state-management": "Zustand 4.4+",
    "styling": "Tailwind CSS 3+"
  },
  "visualization": {
    "layout-engine": "Dagre 0.8+",
    "animations": "Framer Motion 10+",
    "icons": "Lucide React"
  }
}
```

#### Backend Stack
```javascript
{
  "runtime": "Node.js 18+",
  "framework": "Next.js API Routes",
  "database": "PostgreSQL 14+",
  "orm": "Prisma 5+",
  "validation": "Zod 3+"
}
```

### Database Schema Extensions

#### ContentTypeCategory Enum Update
```sql
ALTER TYPE "ContentTypeCategory" ADD VALUE 'folder';
-- IMPORTANT: Adding enum value in production Prisma/PostgreSQL requires
-- careful migration strategy to avoid breaking existing deployments
-- Consider using migration transaction with proper rollback procedures
```

#### Data Model Relationships
- SiteStructure ← → ContentItem (1:1)
- SiteStructure ← → ContentType (M:1)
- SiteStructure ← → SiteStructure (Self-referential for hierarchy)
- Components stored as JSON arrays within ContentItem (not separate entities)
- Build-time component discovery requirement (no runtime discovery)

### API Specification

#### Core Endpoints
```yaml
/api/sitemap/{websiteId}:
  GET: Retrieve complete sitemap tree
  Response: Hierarchical JSON structure with nodes and relationships

/api/sitemap/save:
  POST: Save incremental changes
  Body: Array of change operations
  Response: Success status with operation results

/api/sitemap/bulk:
  POST: Execute bulk operations
  Body: Operation type, target IDs, optional data
  Response: Success/failure results per item

/api/sitemap/{nodeId}/components:
  POST: Update page components
  Body: Component array with order
  Response: Updated component configuration
```

### Security Requirements

#### MVP Security Scope
- Basic session-based authentication only
- No additional security enhancements for MVP
- Folders return 404 for security (intentional design decision)
- Future phases will add RBAC and granular permissions

#### Data Protection
- HTTPS-only communication
- CSRF token validation
- Input sanitization and validation
- SQL injection prevention via Prisma
- XSS protection for user inputs

### Testing Strategy

#### Test Coverage Requirements
- **Unit Test Coverage**: Minimum 90% coverage target
- **Integration Testing**: Full API endpoint coverage
- **Performance Testing**: Load testing with 100+ node sitemaps
- **Browser Testing**: Cross-browser compatibility validation
- **Regression Testing**: Automated test suite for critical paths

#### Test Categories
1. **Unit Tests**
   - Layout engine algorithm validation
   - State management operations
   - Component discovery system
   - Undo/redo functionality

2. **Integration Tests**
   - Database persistence operations
   - API endpoint functionality
   - Save manager debouncing
   - Bulk operation processing

3. **Performance Tests**
   - Load time benchmarks (< 3s for 100 nodes)
   - Drag operation frame rates (60 FPS)
   - Save operation latency (< 1s)
   - Memory usage monitoring

### Performance Requirements

#### Scalability Targets (MVP)
- Support up to ~100 nodes (degradation accepted beyond this limit)
- Single-user editing only (no concurrent editing - last-write-wins approach)
- Process bulk operations on 50+ items (best-effort)
- Maintain sub-second response times for typical operations

#### Optimization Strategies (Post-MVP)
- Virtual scrolling for large sitemaps (Post-MVP)
- Debounced save operations (MVP)
- Optimistic UI updates (MVP)
- Incremental data loading (Post-MVP)
- Client-side caching (Post-MVP)

---

## 7. Risk Assessment

### Technical Risks

#### High Priority Risks

**Risk**: Performance degradation with large sitemaps (>100 nodes)
- **Probability**: Medium
- **Impact**: High
- **Mitigation**: Implement virtual rendering, pagination, and lazy loading
- **Contingency**: Limit MVP to 100 nodes, optimize in Phase 2

**Risk**: Data consistency issues (MVP: Single-user editing only)
- **Probability**: Low (no concurrent editing in MVP)
- **Impact**: Low
- **Mitigation**: Single-user access per sitemap
- **Contingency**: Last-write-wins approach if conflicts occur

**Risk**: Browser compatibility issues with React Flow + Dagre + complex drag-drop
- **Probability**: Medium (React Flow + Dagre has known compatibility concerns)
- **Impact**: Medium
- **Mitigation**: Test across major browsers, provide fallback UI
- **Contingency**: Require modern browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ (No IE11 support)

#### Medium Priority Risks

**Risk**: Component discovery performance impact
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Build-time component registry generation
- **Contingency**: Manual component registration

**Risk**: Undo/redo memory consumption
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**: Limit history to 50 operations
- **Contingency**: Clear history on memory pressure

### Business Risks

**Risk**: User adoption resistance due to UI change
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Provide tutorial, maintain legacy UI option
- **Contingency**: Gradual rollout with feedback collection

**Risk**: Feature scope creep delaying delivery
- **Probability**: High
- **Impact**: Medium
- **Mitigation**: Strict MVP scope enforcement, document future phases
- **Contingency**: Phased release strategy

### Mitigation Strategies

#### Development Practices
- Incremental development with continuous testing
- Feature flags for gradual rollout
- Comprehensive error tracking and monitoring
- Regular performance profiling
- User feedback loops during development

#### Operational Practices
- Blue-green deployment strategy
- Database backup before migrations
- Rollback procedures documented
- Load testing before release
- Beta testing with selected users

---

## 8. Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Infrastructure Setup
- **Day 1-2**: Database schema updates and migrations
- **Day 3-4**: Component registry system implementation
- **Day 5**: Build pipeline configuration

#### Week 2: Core Services
- **Day 1-2**: SiteStructure service extensions for folders
- **Day 3-4**: Auto-layout engine integration
- **Day 5**: State management store setup

### Phase 2: Core Integration (Weeks 3-4)

#### Week 3: Data Connectivity
- **Day 1-2**: Connect demo UI to database
- **Day 3-4**: Implement save manager with debouncing
- **Day 5**: API endpoint development

#### Week 4: Essential Features
- **Day 1-2**: Drag-and-drop functionality
- **Day 3-4**: Component management within pages
- **Day 5**: Real-time persistence

### Phase 3: User Features (Weeks 5-6)

#### Week 5: Advanced Capabilities
- **Day 1-2**: Undo/redo implementation
- **Day 3-4**: Bulk operations
- **Day 5**: Error handling and recovery

#### Week 6: Polish & Testing
- **Day 1-2**: UI polish and animations
- **Day 3**: Integration testing
- **Day 4**: Performance optimization
- **Day 5**: Documentation and deployment prep

### Milestones

- **Week 2**: Foundation complete, demo connected to database
- **Week 4**: Core features functional, beta testing begins
- **Week 6**: Production ready, documentation complete

---

## 9. Resource Requirements

### Team Composition

#### Core Development Team
- **Lead Developer** (1)
  - React Flow expertise
  - State management experience
  - 100% allocation for 6 weeks

- **Full-Stack Developer** (1-2)
  - Next.js/Prisma experience
  - API development skills
  - 100% allocation for 6 weeks

#### Support Resources
- **UI/UX Designer** (0.25 FTE)
  - User flow optimization
  - Visual design refinements
  - As-needed basis

- **QA Engineer** (0.5 FTE)
  - Test plan development
  - Integration testing
  - Weeks 4-6 focus

### Infrastructure Requirements

#### Development Environment
- PostgreSQL development database
- Next.js development servers
- Component playground environment
- Testing infrastructure

#### Production Environment
- Database capacity for schema extensions
- CDN for static assets
- Error tracking service (Sentry)
- Analytics platform integration

### Budget Breakdown

#### Development Costs
- Core team: 360-540 hours @ standard rate
- Support resources: 90 hours @ standard rate
- Infrastructure: Existing platform capacity

#### Operational Costs
- Minimal incremental hosting costs
- No additional licensing requirements
- Standard monitoring and support

---

## 10. Stakeholder Analysis

### Primary Stakeholders

#### End Users
- **Content Creators**: Primary beneficiaries of visual interface
- **Site Administrators**: Efficiency gains in site management
- **Marketing Teams**: Faster campaign page creation

#### Internal Teams
- **Development Team**: Responsible for implementation
- **Product Team**: Feature prioritization and roadmap
- **Support Team**: Reduced ticket volume expected
- **Sales Team**: New differentiator for demos

### Communication Plan

#### Development Updates
- Weekly sprint reviews with stakeholders
- Bi-weekly demos to wider team
- Daily standups for development team

#### User Communication
- Feature announcement in release notes
- Tutorial video creation
- In-app onboarding flow
- Documentation updates

---

## 11. Dependencies

### Technical Dependencies

#### Existing Systems
- Epic 8 infrastructure (SiteStructure, ContentItem, PageOrchestrator)
- Current authentication and authorization system
- Existing component library
- Production database schema

#### External Libraries
- React Flow (core visualization)
- Dagre (layout algorithm)
- Zustand (state management)
- Immer (immutable updates)

### Process Dependencies

#### Pre-requisites
- Epic 8 completion and stability
- Database migration approval
- Security review completion
- Performance baseline establishment

#### Parallel Workstreams
- Component library standardization
- Performance monitoring setup
- Documentation preparation
- Training material development

---

## 12. Post-Implementation

### Deployment Strategy

#### Rollout Plan
1. **Internal Testing**: Development team validation
2. **Beta Release**: Selected power users (5-10)
3. **Gradual Rollout**: 10% → 25% → 50% → 100%
4. **Full Availability**: All users with feature flag control

#### Rollback Procedures
- Feature flag for instant disable
- Database migration rollback scripts
- Previous UI maintenance for 30 days
- Clear rollback decision criteria

### Success Monitoring

#### Key Metrics Tracking
- Daily active users of sitemap builder
- Average time to create site structure
- Error rates and types
- Performance metrics (load, save, render times)
- User satisfaction scores

#### Feedback Collection
- In-app feedback widget
- User interviews (5-10 power users)
- Support ticket analysis
- Usage analytics review

### Technical Debt Accepted for MVP

The following technical debt is consciously accepted to meet the MVP timeline:
- **No performance optimization** - Accepting degradation beyond ~100 nodes
- **No position persistence** - Layout recalculates on each page load
- **No component versioning** - Breaking changes accepted without migration path
- **Limited error recovery** - Basic error handling only
- **No real-time collaboration infrastructure** - Would require WebSocket implementation
- **Manual component registration fallback** - If build-time discovery fails
- **No caching layer** - Direct database queries without optimization

This debt will be addressed in Phase 2 and Phase 3 based on user feedback and adoption metrics.

### Future Enhancements (Phase 2)

#### Immediate Backlog
1. **Component Configuration UI**: Visual property editing
2. **Rich Metadata**: SEO scores, analytics integration
3. **Import/Export**: JSON, CSV, sitemap.xml support
4. **Performance Optimization**: Virtual rendering for 1000+ nodes

#### Long-term Vision
1. **Real-time Collaboration**: Multiple users editing simultaneously
2. **AI Assistance**: Structure suggestions, SEO optimization
3. **Version Control**: Change history, branching, merging
4. **Template Marketplace**: Pre-built site structures

---

## 13. Approval and Sign-off

### Review Checklist
- [ ] Technical architecture approved by CTO
- [ ] Resource allocation confirmed by team leads
- [ ] Timeline accepted by product management
- [ ] Budget approved by finance
- [ ] Security review completed
- [ ] Performance targets validated

### Stakeholder Approval

| Role | Name | Approval Status | Date |
|------|------|----------------|------|
| Product Owner | [Name] | Pending | - |
| Technical Lead | [Name] | Pending | - |
| Development Team Lead | [Name] | Pending | - |
| QA Lead | [Name] | Pending | - |
| Operations Manager | [Name] | Pending | - |

---

## Appendix A: Technical Specifications

[Link to detailed technical specifications in implementation guide]

## Appendix B: User Research

### User Interview Insights
- 85% of users want visual site management
- Average time to create 10-page structure: 45 minutes (current) vs 10 minutes (estimated)
- Top requested features: drag-and-drop, bulk operations, undo/redo

## Appendix C: Competitive Analysis

### Feature Comparison
| Feature | Catalyst (Current) | Catalyst (With Epic 9) | Webflow | Wix |
|---------|-------------------|------------------------|---------|-----|
| Visual Sitemap | ❌ | ✅ | ✅ | ✅ |
| Drag & Drop | ❌ | ✅ | ✅ | ✅ |
| Bulk Operations | ❌ | ✅ | ❌ | ✅ |
| Undo/Redo | ❌ | ✅ | ✅ | ✅ |
| Auto-Layout | N/A | ✅ | ❌ | ❌ |

## Appendix D: Risk Register

[Detailed risk register with probability/impact matrix]

---

*Document Version: 1.0*  
*Created: [Current Date]*  
*Last Updated: [Current Date]*  
*Status: Draft - Pending Review*