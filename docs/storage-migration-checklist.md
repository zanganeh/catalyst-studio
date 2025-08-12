# Storage Migration Checklist

## Overview
This checklist provides a complete inventory of all storage points that need migration from browser storage to a database-backed solution. Items are grouped by module and prioritized based on dependencies and complexity.

## Migration Priority Levels
- **P0**: Critical - Must migrate first (blocking other features)
- **P1**: High - Core functionality 
- **P2**: Medium - Important but not blocking
- **P3**: Low - Can migrate last

## Complexity Ratings
- **Simple**: Direct key-value storage, minimal relationships
- **Medium**: Some data relationships, moderate refactoring needed
- **Complex**: Complex data structures, significant refactoring required

---

## Module 1: Content Management System
**Priority: P0** | **Overall Complexity: Medium** | **Est. Story Points: 8**

### Storage Points to Migrate:
- [ ] **Content Type Definitions** 
  - Location: `lib/context/content-type-context.tsx`
  - Storage: localStorage key `contentTypes`
  - Complexity: Medium
  - Dependencies: Used by Content Builder, Content Management, Preview
  - Migration Notes: Central to app functionality, needs atomic updates

- [ ] **Content Store (Zustand)**
  - Location: `lib/stores/content-store.ts`
  - Storage: Zustand persist with localStorage/IndexedDB
  - Complexity: Complex
  - Dependencies: Content items, metadata
  - Migration Notes: Already has IndexedDB fallback logic

- [ ] **Navigation State**
  - Location: `lib/context/navigation-context.tsx`
  - Storage: localStorage key `navigation-state`
  - Complexity: Simple
  - Dependencies: UI state only
  - Migration Notes: Could remain in localStorage if needed

### Subtasks:
- [ ] Design database schema for content types
- [ ] Create API endpoints for CRUD operations
- [ ] Implement database service layer
- [ ] Update React contexts to use API
- [ ] Migrate existing localStorage data
- [ ] Update tests

---

## Module 2: Website Storage Service
**Priority: P0** | **Overall Complexity: Complex** | **Est. Story Points: 13**

### Storage Points to Migrate:
- [ ] **Website Data (IndexedDB)**
  - Location: `lib/storage/website-storage.service.ts`
  - Storage: IndexedDB `catalyst_websites_db`
  - Complexity: Complex
  - Dependencies: All website-specific data
  - Migration Notes: Already uses IndexedDB, needs server migration

- [ ] **Storage Service Strategies**
  - Location: `lib/storage/storage-service.ts`
  - Storage: Multiple (IndexedDB, localStorage, sessionStorage)
  - Complexity: Complex
  - Dependencies: Fallback chain for all storage
  - Migration Notes: Need to replace with API-based strategy

### Subtasks:
- [ ] Design website data schema
- [ ] Implement website API endpoints
- [ ] Create data partitioning strategy
- [ ] Handle large data uploads/downloads
- [ ] Implement caching strategy
- [ ] Update storage service interface

---

## Module 3: AI Integration
**Priority: P2** | **Overall Complexity: Simple** | **Est. Story Points: 3**

### Storage Points to Migrate:
- [ ] **AI Prompts (Temporary)**
  - Location: Multiple files in `app/studio/[id]/ai/`
  - Storage: sessionStorage key `ai_prompt_${websiteId}`
  - Complexity: Simple
  - Dependencies: Studio chat interface
  - Migration Notes: May not need migration (temporary data)

- [ ] **Project Context**
  - Location: `hooks/use-context-aware-chat.ts`
  - Storage: localStorage key `project-context`
  - Complexity: Simple
  - Dependencies: AI context awareness
  - Migration Notes: Could be part of website data

### Subtasks:
- [ ] Evaluate if temporary storage needs migration
- [ ] Design context storage in database
- [ ] Update hooks to use API

---

## Module 4: Preview System
**Priority: P3** | **Overall Complexity: Simple** | **Est. Story Points: 2**

### Storage Points to Migrate:
- [ ] **Preview Settings**
  - Location: `lib/context/preview-context.tsx`
  - Storage: localStorage key `preview-settings`
  - Complexity: Simple
  - Dependencies: Preview panel UI
  - Migration Notes: User preferences, could stay client-side

- [ ] **Preview Controls Settings**
  - Location: `components/preview/preview-controls.tsx`
  - Storage: localStorage key `previewSettings`
  - Complexity: Simple
  - Dependencies: Preview controls UI
  - Migration Notes: Duplicate of above, needs consolidation

### Subtasks:
- [ ] Consolidate preview settings keys
- [ ] Decide if user preferences need server storage
- [ ] Implement user preferences API if needed

---

## Module 5: Deployment System
**Priority: P1** | **Overall Complexity: Medium** | **Est. Story Points: 5**

### Storage Points to Migrate:
- [ ] **CMS Provider Configurations**
  - Location: `components/deployment/cms-provider-selector.tsx`
  - Storage: localStorage key `cms-provider-configs`
  - Complexity: Medium
  - Dependencies: Deployment functionality
  - Migration Notes: Sensitive data, should be server-side

- [ ] **Deployment History**
  - Location: `lib/deployment/mock-deployment-service.ts`
  - Storage: localStorage key `deployment_history`
  - Complexity: Simple
  - Dependencies: Deployment tracking
  - Migration Notes: Historical data, needs persistence

### Subtasks:
- [ ] Design deployment configuration schema
- [ ] Create secure storage for provider credentials
- [ ] Implement deployment history API
- [ ] Add encryption for sensitive configs
- [ ] Update deployment service

---

## Module 6: Migration System
**Priority: P1** | **Overall Complexity: Complex** | **Est. Story Points: 8**

### Storage Points to Migrate:
- [ ] **Legacy Data Keys**
  - Location: `lib/storage/migration.ts`
  - Storage: Various localStorage keys (catalyst_*)
  - Complexity: Complex
  - Dependencies: Data migration process
  - Migration Notes: One-time migration process

- [ ] **Migration Metadata**
  - Location: `lib/storage/migration.ts`
  - Storage: localStorage keys for version/date
  - Complexity: Simple
  - Dependencies: Migration tracking
  - Migration Notes: Could move to database

- [ ] **Backup Data**
  - Location: `lib/storage/migration.ts`
  - Storage: localStorage key `catalyst_backup`
  - Complexity: Medium
  - Dependencies: Rollback capability
  - Migration Notes: Temporary during migration

### Subtasks:
- [ ] Design migration tracking schema
- [ ] Implement server-side migration service
- [ ] Create backup/restore API
- [ ] Handle legacy data transformation
- [ ] Clean up after successful migration

---

## Testing Requirements

### Unit Tests to Update:
- [ ] `lib/storage/__tests__/storage-service.test.ts`
- [ ] `lib/storage/__tests__/migration.test.ts`
- [ ] `lib/storage/__tests__/website-storage.test.ts`
- [ ] `lib/storage/__tests__/quota-monitor.test.ts`
- [ ] `lib/stores/__tests__/content-store.test.ts`
- [ ] `components/deployment/cms-provider-selector.test.tsx`

### Integration Tests to Create:
- [ ] Database connection and operations
- [ ] API endpoint functionality
- [ ] Data migration process
- [ ] Fallback scenarios
- [ ] Error handling

---

## Total Estimation Summary

| Module | Priority | Complexity | Story Points |
|--------|----------|------------|--------------|
| Content Management | P0 | Medium | 8 |
| Website Storage | P0 | Complex | 13 |
| AI Integration | P2 | Simple | 3 |
| Preview System | P3 | Simple | 2 |
| Deployment System | P1 | Medium | 5 |
| Migration System | P1 | Complex | 8 |
| **Total** | - | - | **39** |

## Recommended Migration Sequence

### Phase 1: Foundation (P0)
1. Website Storage Service
2. Content Management System

### Phase 2: Core Features (P1)
3. Deployment System
4. Migration System

### Phase 3: Enhancement (P2-P3)
5. AI Integration
6. Preview System

## Risk Factors
- **Data Loss**: Ensure comprehensive backup before migration
- **Performance**: Large data sets may impact migration time
- **Compatibility**: Maintain backward compatibility during transition
- **User Experience**: Minimize disruption during migration
- **Testing**: Comprehensive testing required for each module

## Success Criteria
- [ ] All storage points migrated to database
- [ ] No data loss during migration
- [ ] Performance meets or exceeds current implementation
- [ ] All tests passing
- [ ] Rollback capability verified
- [ ] Documentation updated