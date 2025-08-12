# Storage Audit Report
Generated: 2025-08-12

## Executive Summary
This audit identifies all browser storage usage across the Catalyst Studio codebase. The application uses a mix of localStorage, sessionStorage, and IndexedDB for various purposes including content management, user settings, and deployment configurations.

## Storage Usage by Type

### 1. localStorage Usage (Primary Storage)

#### Content Management
- **`lib/context/content-type-context.tsx`** (lines 62, 84, 97, 166)
  - Key: `contentTypes`
  - Data: Content type definitions (JSON)
  - Purpose: Persist content type schemas created in Content Builder

- **`app/(dashboard)/content/page.tsx`** (line 23)
  - Key: `contentTypes`
  - Data: Content type definitions
  - Purpose: Load content types for Content Management page

- **`lib/stores/content-store.ts`** (lines 136, 153, 166)
  - Key: Dynamic (Zustand persist)
  - Data: Content items and metadata
  - Purpose: Persist content store state with IndexedDB fallback

#### Navigation State
- **`lib/context/navigation-context.tsx`** (lines 37, 73, 112)
  - Key: `navigation-state`
  - Data: Navigation preferences and state
  - Purpose: Persist user navigation preferences

#### Preview Settings
- **`lib/context/preview-context.tsx`** (lines 316, 332)
  - Key: `preview-settings`
  - Data: Preview configuration (viewport, theme, etc.)
  - Purpose: Persist preview panel settings

- **`components/preview/preview-controls.tsx`** (lines 182, 195)
  - Key: `previewSettings`
  - Data: Preview settings state
  - Purpose: Persist preview control settings

#### Deployment Configuration
- **`components/deployment/cms-provider-selector.tsx`** (lines 52, 80, 89)
  - Key: `cms-provider-configs`
  - Data: CMS provider configurations
  - Purpose: Store CMS provider settings

- **`lib/deployment/mock-deployment-service.ts`** (lines 167, 188, 192, 210)
  - Key: `deployment_history`
  - Data: Deployment history records
  - Purpose: Track deployment history

#### Migration & Legacy Data
- **`lib/storage/migration.ts`** (lines 11-14, 55, 93-94, 146, 163-176, 189, 245-261, 302)
  - Keys: 
    - `catalyst_brand_identity`
    - `catalyst_visual_identity`
    - `catalyst_content`
    - `catalyst_settings`
    - `catalyst_migration_version`
    - `catalyst_migration_date`
    - `catalyst_backup`
  - Data: Legacy data and migration metadata
  - Purpose: Handle data migration from v1 to v2

#### Project Context
- **`hooks/use-context-aware-chat.ts`** (lines 39, 50)
  - Key: `project-context`
  - Data: Project metadata for AI context
  - Purpose: Maintain AI chat context

### 2. sessionStorage Usage (Temporary Storage)

#### AI Prompt Storage
- **`app/studio/[id]/ai/ai-panel-with-context.tsx`** (lines 34, 42)
  - Key: `ai_prompt_${websiteId}`
  - Data: AI prompt and context
  - Purpose: Temporarily store AI prompts during navigation

- **`app/studio/[id]/ai/page.tsx`** (line 16)
  - Key: `ai_prompt_${websiteId}`
  - Data: AI prompt data
  - Purpose: Retrieve stored AI prompts

- **`components/dashboard/website-creator.tsx`** (line 27)
  - Key: `ai_prompt_${websiteId}`
  - Data: Initial AI prompt for website creation
  - Purpose: Pass prompt from dashboard to studio

- **`components/studio/studio-chat-wrapper.tsx`** (lines 41, 51)
  - Key: `ai_prompt_${websiteId}`
  - Data: AI prompt data
  - Purpose: Handle AI prompt lifecycle in studio

### 3. IndexedDB Usage (Large Data Storage)

#### Website Storage Service
- **`lib/storage/website-storage.service.ts`** (lines 30, 329, 399, 486)
  - Database: `catalyst_websites_db`
  - Data: Website data including content, settings
  - Purpose: Store large website data with partitioning

#### Storage Service Fallback
- **`lib/storage/storage-service.ts`** (lines 12-25)
  - Database: Dynamic based on context
  - Data: Fallback storage for large data
  - Purpose: Provide IndexedDB as primary storage option

#### Migration Support
- **`lib/storage/migration.ts`** (lines 17, 43, 155, 180, 271, 364, 372)
  - Database: Various legacy databases
  - Data: Legacy data during migration
  - Purpose: Handle migration from non-partitioned to partitioned storage

#### Quota Monitoring
- **`lib/storage/quota-monitor.ts`** (lines 55, 133)
  - Database: All databases (monitoring)
  - Data: Database size metadata
  - Purpose: Monitor storage quota usage

## Storage Patterns by Module

### Module 1: Content Management System
**Complexity: Medium**
- Content type definitions (localStorage)
- Content items (Zustand with localStorage/IndexedDB)
- Navigation state (localStorage)
- Files: 
  - `lib/context/content-type-context.tsx`
  - `lib/stores/content-store.ts`
  - `app/(dashboard)/content/page.tsx`

### Module 2: Preview System
**Complexity: Simple**
- Preview settings (localStorage)
- Viewport configurations (localStorage)
- Files:
  - `lib/context/preview-context.tsx`
  - `components/preview/preview-controls.tsx`

### Module 3: AI Integration
**Complexity: Simple**
- Temporary prompt storage (sessionStorage)
- Project context (localStorage)
- Files:
  - `app/studio/[id]/ai/*.tsx`
  - `components/studio/studio-chat-wrapper.tsx`
  - `hooks/use-context-aware-chat.ts`

### Module 4: Deployment System
**Complexity: Medium**
- CMS provider configs (localStorage)
- Deployment history (localStorage)
- Files:
  - `components/deployment/cms-provider-selector.tsx`
  - `lib/deployment/mock-deployment-service.ts`

### Module 5: Website Storage
**Complexity: Complex**
- Website data partitioning (IndexedDB)
- Large data storage (IndexedDB)
- Files:
  - `lib/storage/website-storage.service.ts`
  - `lib/storage/storage-service.ts`

### Module 6: Migration System
**Complexity: Complex**
- Legacy data extraction (localStorage/IndexedDB)
- Backup and restore (localStorage)
- Version tracking (localStorage)
- Files:
  - `lib/storage/migration.ts`
  - `lib/storage/quota-monitor.ts`

## Storage Keys Summary

### localStorage Keys
- `contentTypes` - Content type definitions
- `navigation-state` - Navigation preferences
- `preview-settings` / `previewSettings` - Preview configurations
- `cms-provider-configs` - CMS provider settings
- `deployment_history` - Deployment records
- `project-context` - AI context data
- `catalyst_brand_identity` (legacy)
- `catalyst_visual_identity` (legacy)
- `catalyst_content` (legacy)
- `catalyst_settings` (legacy)
- `catalyst_migration_version` - Migration version
- `catalyst_migration_date` - Migration timestamp
- `catalyst_backup` - Backup data

### sessionStorage Keys
- `ai_prompt_${websiteId}` - Temporary AI prompts

### IndexedDB Databases
- `catalyst_websites_db` - Main website data
- Various legacy databases (for migration)

## Data Size Considerations
- localStorage limit: ~5-10MB per domain
- sessionStorage limit: ~5-10MB per tab
- IndexedDB limit: Based on available disk space
- Current implementation includes size checks in:
  - `lib/stores/content-store.ts` (line 148)
  - `lib/storage/quota-monitor.ts`

## Dependencies
- **Zustand Persist Middleware**: Used in content-store for state persistence
- **Custom Storage Strategies**: Fallback chain (IndexedDB → localStorage → sessionStorage → Memory)
- **Migration Service**: Handles data migration between storage versions

## Test Coverage
Comprehensive test files exist for:
- `lib/storage/__tests__/storage-service.test.ts`
- `lib/storage/__tests__/migration.test.ts`
- `lib/storage/__tests__/website-storage.test.ts`
- `lib/storage/__tests__/quota-monitor.test.ts`
- `lib/stores/__tests__/content-store.test.ts`
- `components/deployment/cms-provider-selector.test.tsx`
- `components/dashboard/__tests__/website-creator.test.tsx`

## Recommendations
1. **Standardize Storage Keys**: Some modules use different key patterns
2. **Consolidate Storage Access**: Multiple direct localStorage calls could use service layer
3. **Data Partitioning**: Consider website-based partitioning for all data types
4. **Size Management**: Implement consistent size checking before storage operations
5. **Migration Path**: Clear upgrade path from localStorage to IndexedDB for large data