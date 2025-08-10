# Backlog: Content Type Builder Enhancements

## Status
Backlog

## Overview
This backlog contains enhancement features for the Content Type Builder that were identified during Story 1.3 implementation but deemed non-critical for the initial release.

## Backlog Items

### 1. Content Type Schema Export/Import
**Priority**: Medium  
**Story Points**: 3  
**Description**: Add functionality to export and import content type schemas for sharing and backup purposes.

**Tasks:**
- [ ] Create export functionality to download content type schemas as JSON
- [ ] Add import functionality to load content type schemas from JSON files
- [ ] Validate imported schemas against current type definitions
- [ ] Handle conflicts when importing schemas with existing content types
- [ ] Add UI components for export/import in content builder

**Acceptance Criteria:**
- Users can export all or selected content types as a JSON file
- Users can import content type schemas from a JSON file
- System validates and reports any conflicts or issues during import
- Import process allows users to choose conflict resolution strategy

---

### 2. Content Type Versioning System
**Priority**: Low  
**Story Points**: 5  
**Description**: Implement versioning for content type definitions to track changes over time.

**Tasks:**
- [ ] Design versioning schema for content type definitions
- [ ] Create version history storage mechanism
- [ ] Implement version comparison/diff functionality
- [ ] Add UI for viewing version history
- [ ] Create rollback functionality to previous versions
- [ ] Add version notes/comments capability

**Acceptance Criteria:**
- Each content type change creates a new version entry
- Users can view the history of changes for any content type
- Users can compare differences between versions
- Users can rollback to a previous version if needed
- Version history includes timestamp and optional notes

---

### 3. Performance Testing Suite
**Priority**: Low  
**Story Points**: 2  
**Description**: Create comprehensive performance tests for the Content Type Builder.

**Tasks:**
- [ ] Create performance test with 50+ fields
- [ ] Test drag-and-drop performance with large field lists
- [ ] Measure and optimize render times for complex content types
- [ ] Add performance benchmarks to CI/CD pipeline
- [ ] Document performance optimization opportunities

**Acceptance Criteria:**
- Performance tests cover scenarios with 50-100 fields
- All operations complete within performance targets (<2 seconds)
- Drag-and-drop maintains 60fps with large field lists
- Performance regression tests prevent degradation

---

### 4. Advanced Field Types
**Priority**: Medium  
**Story Points**: 8  
**Description**: Add more sophisticated field types for advanced use cases.

**Tasks:**
- [ ] Implement JSON field type with schema validation
- [ ] Add repeater/array field type for collections
- [ ] Create conditional field type (show/hide based on other fields)
- [ ] Implement computed/formula field type
- [ ] Add field groups/sections for better organization

**Acceptance Criteria:**
- New field types are fully integrated with the builder
- Each field type has appropriate validation and configuration options
- Field types work correctly with persistence and relationships
- UI properly represents each field type's unique characteristics

---

### 5. Bulk Operations
**Priority**: Low  
**Story Points**: 3  
**Description**: Add bulk operations for managing multiple fields at once.

**Tasks:**
- [ ] Implement multi-select for fields
- [ ] Add bulk delete functionality
- [ ] Create bulk property update capability
- [ ] Add copy/paste functionality for fields
- [ ] Implement field templates/presets

**Acceptance Criteria:**
- Users can select multiple fields for bulk operations
- Bulk operations include delete, update properties, and reorder
- Operations provide confirmation dialogs for destructive actions
- Undo/redo capability for bulk operations

---

### 6. TypeScript Type Safety Improvements
**Priority**: Medium  
**Story Points**: 2  
**Description**: Refine TypeScript types to resolve type narrowing issues identified during code review.

**Tasks:**
- [ ] Refactor ValidationRules to use discriminated union pattern
- [ ] Fix type narrowing issues in field-properties-panel.tsx
- [ ] Add missing properties to Relationship interface in addRelationship calls
- [ ] Create type guards for ValidationRules field type checking
- [ ] Add proper type overloads for field validation methods

**Acceptance Criteria:**
- All TypeScript compilation errors are resolved
- ValidationRules properly narrows based on field type
- No use of type assertions or any types
- Type safety maintained throughout the codebase
- All existing tests continue to pass

**Technical Details:**
- Current issue: ValidationRules union type doesn't narrow properly when accessing field-specific properties
- Solution: Implement discriminated union with a `type` field or create separate validation interfaces per field type
- Files affected: 
  - `lib/content-types/types.ts`
  - `components/content-builder/field-properties-panel.tsx`
  - `app/content-builder/relationships/page.tsx`

---

## Notes
- These items were identified during Story 1.3 implementation
- Core functionality is complete and working without these enhancements
- Items can be promoted to active stories based on user feedback and priorities
- E2E tests exist for current functionality; unit tests deemed unnecessary given coverage

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-09 | 1.0 | Initial backlog created from Story 1.3 remaining items | James (Dev) |
| 2025-01-09 | 1.1 | Added TypeScript type safety improvements from code review | James (Dev) |