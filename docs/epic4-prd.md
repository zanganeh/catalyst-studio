# Catalyst Studio Storage Migration Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Assessment: Enhancement Complexity

This is a **SIGNIFICANT enhancement** that warrants a full PRD:
- **Scope**: Complete migration from browser storage to server-side SQL database
- **Complexity**: Requires systematic audit, modular migration approach, ORM selection, and API design
- **Impact**: Architectural change affecting entire data layer
- **Stories**: Multiple module-specific migration stories needed

### Existing Project Overview

**Analysis Source**: IDE-based fresh analysis

**Current Project State**: 
Catalyst Studio is a web application for creating and managing digital projects. It currently stores all data locally in the browser using localStorage, sessionStorage, and potentially IndexedDB. The application includes features for content management, project organization, and various studio tools.

### Available Documentation Analysis

**Available Documentation**:
- ✓ Previous Epic documentation (Epic 1-3)
- ✓ Front-end specifications  
- ✓ Testing guide
- ✓ Local storage usage documentation
- ✓ Data storage requirements
- ✓ Epic 4 brief
- ⚠️ Missing: Complete tech stack documentation, API documentation, coding standards

### Enhancement Scope Definition

**Enhancement Type**: 
- ✓ Technology Stack Upgrade (adding backend infrastructure)
- ✓ Major Feature Modification (data persistence layer)
- ✓ Integration with New Systems (SQL database, ORM)

**Enhancement Description**: 
Migrating all browser-based local storage mechanisms to a server-side SQL database with full CRUD APIs using a modern ORM, enabling centralized data persistence, cross-device access, and setting the foundation for future collaboration features.

**Impact Assessment**:
- ✓ Major Impact (architectural changes required)

### Goals and Background Context

**Goals**:
- Eliminate data loss risk from browser storage limitations
- Enable cross-device data access and synchronization  
- Provide foundation for multi-user collaboration features
- Remove browser storage size constraints
- Implement professional data management with transactions and relationships

**Background Context**:
The current browser storage approach was suitable for initial development but now limits Catalyst Studio's growth potential. Users face data loss risks, cannot access work across devices, and are constrained by storage quotas. This migration addresses these fundamental limitations while establishing infrastructure for future enterprise features. The modular migration approach allows incremental validation while maintaining existing functionality throughout the transition.

### Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial Draft | 2025-08-12 | 0.1 | Created initial PRD for Epic 4 Storage Migration | John (PM) |

## Requirements

### Functional Requirements

**FR1**: The system shall provide a comprehensive audit tool to identify and document all current local storage usage patterns across the entire codebase.

**FR2**: The system shall implement a SQL database schema that accommodates all data structures currently using browser storage.

**FR3**: The system shall provide full CRUD (Create, Read, Update, Delete) REST API endpoints for each identified data entity.

**FR4**: The system shall integrate a modern ORM (Prisma, TypeORM, or Drizzle) to simplify database operations and reduce boilerplate code.

**FR5**: The client application shall be refactored to use server API calls instead of browser storage, with no backward compatibility requirements.

**FR6**: Each functional module (content types, content items, etc.) shall be implemented as a separate story following gitflow practices.

**FR7**: The backend server shall run as part of the existing `npm run dev` command alongside the frontend development server.

**FR8**: The API shall use JSON payloads optimized for the application's needs.

### Non-Functional Requirements

**NFR1**: The ORM implementation shall handle at least 95% of data operations without requiring raw SQL queries.

**NFR2**: Each CRUD endpoint shall be implementable in less than 50 lines of code using the chosen ORM.

**NFR3**: The system shall not implement authentication, rate limiting, or performance optimization in this phase.

**NFR4**: The backend shall integrate seamlessly into the existing development workflow without requiring separate server management.

**NFR5**: The solution shall use Node.js/Express or similar JavaScript-based backend for consistency with the frontend stack.

**NFR6**: Database setup shall be automated as part of the development environment initialization.

### Compatibility Requirements

**CR1**: **Development Workflow Compatibility**: The backend must integrate into the existing `npm run dev` workflow without requiring additional terminal windows or commands.

**CR2**: **Build Process Compatibility**: The build process must bundle both frontend and backend appropriately for development and production.

**CR3**: **Repository Structure Compatibility**: The backend code must fit logically within the existing monorepo structure.

**CR4**: **Development Environment Compatibility**: The solution must work with the existing development tools and IDE configurations.

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: TypeScript, JavaScript  
**Frameworks**: Next.js (with App Router), React  
**Database**: SQLite for development, PostgreSQL/MySQL for production  
**Infrastructure**: Next.js integrated development environment, monorepo structure  
**External Dependencies**: npm packages, UI libraries, Prisma/Drizzle ORM

### Integration Approach

**Database Integration Strategy**: Use Next.js native capabilities - no separate server needed. Database connections managed through singleton pattern in `/lib/db`. ORM (Prisma/Drizzle) handles migrations and schema management. SQLite database file stored in project root (git-ignored).

**API Integration Strategy**: Implement API routes using Next.js App Router pattern in `/app/api/[module]/route.ts`. Each module gets its own API folder with route handlers for GET, POST, PUT, DELETE methods. Share TypeScript types between frontend and API routes.

**Frontend Integration Strategy**: Replace localStorage calls with fetch to Next.js API routes. Use React Query or SWR for data fetching and caching. Server Components can directly use ORM for data fetching where appropriate.

**Testing Integration Strategy**: Test API routes using Next.js testing patterns. Use test database for integration tests. Mock API responses for component testing.

### Code Organization and Standards

**File Structure Approach**: 
```
app/
├── api/                    # API routes
│   ├── content-types/
│   │   └── route.ts       # CRUD for content types
│   ├── content-items/
│   │   └── route.ts       # CRUD for content items
│   └── [other-modules]/
├── (studio)/              # Route groups for UI
lib/
├── db/                    # Database client & config
│   ├── client.ts         # Singleton DB connection
│   └── schema.ts         # Prisma/Drizzle schema
types/                     # Shared TypeScript types
```

**Naming Conventions**: API routes follow Next.js convention `/api/[resource]`. Database tables use snake_case. API responses use camelCase to match frontend.

**Coding Standards**: Existing ESLint/Prettier configuration applies to API routes. Follow RESTful conventions in route handlers. Use Next.js error handling patterns.

**Documentation Standards**: Document API routes with JSDoc/TSDoc. Include example requests/responses. Update README with database setup.

### Deployment and Operations

**Build Process Integration**: Next.js dev server handles everything - no separate backend server needed. `npm run dev` runs Next.js which serves both frontend and API. Database migrations run as part of dev setup script.

**Deployment Strategy**: Development uses SQLite with automatic setup. Production deployment uses standard Next.js deployment (Vercel, self-hosted, etc.). Environment variables handle database connection differences.

**Monitoring and Logging**: Use Next.js built-in logging. Structured logging in API routes. ORM query logging in development mode.

**Configuration Management**: Use `.env.local` for local development variables. `.env.production` for production database. Next.js automatically loads appropriate env file.

### Risk Assessment and Mitigation

**Technical Risks**: Next.js API routes have request size limits. Complex queries might need optimization. Cold starts could affect API response times in serverless deployments.

**Integration Risks**: Server Components vs Client Components data fetching patterns need clear guidelines. Caching strategy between React Query and Next.js cache needs coordination. Database connection pooling in serverless environment requires attention.

**Deployment Risks**: SQLite to PostgreSQL migration path needs planning. Serverless deployment may require connection pooling service. Development vs production environment differences.

**Mitigation Strategies**: Start with simple CRUD operations to establish patterns. Use Next.js caching appropriately for read-heavy operations. Document when to use Server Components vs API routes. Test connection pooling early if targeting serverless.

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision**: Single comprehensive epic for the entire storage migration with rationale:
- All work shares the same technical foundation (ORM setup, API patterns)
- Dependencies between modules require coordinated implementation
- Single epic allows tracking overall migration progress
- Reduces overhead of epic management for tightly coupled work

## Epic 4: Catalyst Studio Storage Migration to SQL Database

**Epic Goal**: Replace all browser-based local storage with server-side SQL database storage, implementing full CRUD APIs using Next.js API routes and a modern ORM, enabling persistent, scalable data management.

**Integration Requirements**: All new API routes must follow Next.js App Router conventions, integrate seamlessly with existing React components, maintain current user workflows, and run within the standard Next.js development environment.

### Story 4.1: Storage Audit and Migration Planning

As a developer,  
I want to audit all browser storage usage and create a migration plan,  
so that I have a complete map of what needs to be migrated.

**Acceptance Criteria:**
1. Complete grep/search of codebase for localStorage, sessionStorage, and IndexedDB usage
2. Document each storage pattern with location, data structure, and purpose
3. Group storage usage into logical modules (content-types, content-items, etc.)
4. Create migration checklist with all identified storage points
5. Estimate complexity for each module migration

**Integration Verification:**
- IV1: No code changes affect existing functionality
- IV2: All storage patterns are documented without gaps
- IV3: Migration plan covers 100% of identified storage usage

### Story 4.2: Database and ORM Setup

As a developer,  
I want to set up the database infrastructure and ORM,  
so that I have the foundation for all data operations.

**Acceptance Criteria:**
1. Install and configure chosen ORM (Prisma/Drizzle)
2. Set up SQLite for development in project root
3. Create initial database schema based on audit findings
4. Configure database connection singleton in `/lib/db`
5. Add database initialization to development scripts
6. Verify ORM can connect and perform basic operations

**Integration Verification:**
- IV1: Existing app continues to run with `npm run dev`
- IV2: Database setup doesn't interfere with current build process
- IV3: No performance impact on application startup

### Story 4.3: API Route Pattern Implementation

As a developer,  
I want to implement the first API route with full CRUD operations,  
so that I establish the pattern for all subsequent APIs.

**Acceptance Criteria:**
1. Create first API route in `/app/api/[module]/route.ts`
2. Implement GET, POST, PUT, DELETE methods
3. Add proper error handling and response formatting
4. Include TypeScript types for request/response
5. Add basic validation using Zod or similar
6. Document the API pattern for team reference

**Integration Verification:**
- IV1: API routes accessible at `/api/[module]` endpoints
- IV2: Existing routes and pages continue to work
- IV3: API responses follow consistent format

### Story 4.4: Content Types Module Migration

As a developer,  
I want to migrate content types from local storage to database,  
so that content type definitions are persistently stored.

**Acceptance Criteria:**
1. Create content_types table schema in ORM
2. Implement `/app/api/content-types/route.ts` with full CRUD
3. Create service layer for content type operations
4. Replace localStorage calls with API calls in frontend
5. Add data fetching with React Query/SWR
6. Verify all content type operations work correctly

**Integration Verification:**
- IV1: Existing content type features remain functional
- IV2: No data loss during transition
- IV3: UI responsiveness maintained despite API calls

### Story 4.5: Content Items Module Migration

As a developer,  
I want to migrate content items from local storage to database,  
so that user-created content is persistently stored.

**Acceptance Criteria:**
1. Create content_items table with foreign key to content_types
2. Implement `/app/api/content-items/route.ts` with full CRUD
3. Handle relationships between items and types
4. Replace localStorage calls with API calls
5. Implement pagination for large datasets
6. Add optimistic updates for better UX

**Integration Verification:**
- IV1: All existing content items functionality preserved
- IV2: Relationships between types and items maintained
- IV3: Performance acceptable for typical data volumes

### Story 4.6: [Additional Module] Migration

As a developer,  
I want to migrate [specific module] from local storage to database,  
so that [module] data is persistently stored.

**Note**: Repeat this story pattern for each additional module identified in the audit.

**Acceptance Criteria:**
1. Create database schema for module
2. Implement API routes with full CRUD
3. Replace frontend storage calls
4. Add appropriate data fetching
5. Test all module operations
6. Update documentation

**Integration Verification:**
- IV1: Module functionality unchanged from user perspective
- IV2: No conflicts with previously migrated modules
- IV3: Consistent patterns with other migrated modules

### Story 4.7: Testing and Validation

As a developer,  
I want to validate the complete storage migration,  
so that I can confirm all browser storage has been replaced.

**Acceptance Criteria:**
1. Remove/comment all browser storage code
2. Run full application test suite
3. Verify no localStorage/sessionStorage calls remain
4. Test cross-browser compatibility
5. Validate data persistence across sessions
6. Document any remaining cleanup tasks

**Integration Verification:**
- IV1: Application fully functional without browser storage
- IV2: All features work as before migration
- IV3: No performance degradation

### Story 4.8: Development Environment Optimization

As a developer,  
I want to optimize the development setup,  
so that the team has a smooth development experience.

**Acceptance Criteria:**
1. Add database seeding for development
2. Create database reset scripts
3. Add migration commands to package.json
4. Document setup process in README
5. Create troubleshooting guide
6. Add database viewer tool recommendation

**Integration Verification:**
- IV1: New developers can set up environment quickly
- IV2: Existing workflows remain efficient
- IV3: Database operations don't slow development