# Epic 9: Sitemap Builder - MVP Architecture (Simplified)

**Document Version**: 1.0 - MVP Focused  
**Timeline**: 6 weeks  
**Scope**: Productionize existing React Flow demo  
**Team Size**: 2-3 developers

---

## Executive Summary

We are **productionizing an existing React Flow demo** at `/app/premium/demo/sitemap-builder/page.tsx` by connecting it to the Epic 8 database. This is a brownfield project - we have working UI that needs data persistence.

**What we're NOT doing**:
- NOT moving files around
- NOT rebuilding from scratch  
- NOT adding real-time collaboration
- NOT over-engineering for future features

---

## 1. File Locations

**Current Location**: `/app/premium/demo/sitemap-builder/page.tsx`

**Structure**:
- Main page file at page.tsx (already exists)
- Node components in components/nodes.tsx
- Toolbar controls in components/controls.tsx  
- Zustand store in hooks/use-sitemap-store.ts
- Save manager in hooks/use-auto-save.ts
- Transform functions in utils/transform.ts
- Undo manager in utils/undo-manager.ts
- Folder operations in services/folder-service.ts

**Component Files Location**:
- Global components used by sitemap: `/lib/premium/components/globals/` (shared)
- Sitemap-specific components: `/app/premium/demo/sitemap-builder/components/`
- The 4 MVP components (hero, header, footer, cta) are referenced from existing `/lib/premium/components/globals/`
- No new component files needed for MVP

**Note about location**: While new premium features should go under /lib/premium/, this existing demo stays at its current location to avoid breaking changes. This is the brownfield approach - we work with what's already there.

---

## 2. Core Requirements (MVP Only)

### Must Have (Week 1-6)
1. ✅ Load sitemap from database
2. ✅ Save changes (debounced 1 second)
3. ✅ Drag & drop nodes
4. ✅ Auto-layout with Dagre
5. ✅ Undo/redo (50 operations)
6. ✅ 4 components (hero, header, footer, cta)
7. ✅ Owner-only access

### Performance Target
- **Single requirement**: Load < 3 seconds for 100 nodes
- **Acceptable**: 30+ FPS during drag operations

### Out of Scope
- ❌ Real-time collaboration
- ❌ Import/export
- ❌ Component configuration UI
- ❌ Advanced caching strategies
- ❌ Performance monitoring
- ❌ WebSocket/SSE

---

## 3. Technical Stack

```
React Flow → Zustand Store → SaveManager (with retry) → API (transactional) → Epic 8 Services → Database
```

### Dependencies
```json
{
  "reactflow": "^11.10.1",      // Already installed
  "dagre": "^0.8.5",            // For auto-layout
  "@prisma/client": "^5.0.0",   // Already installed
  "zustand": "^4.4.0",          // State management
  "zod": "^3.22.0"              // Input validation
}
```

### Database Migration Required

**Through Prisma Migration**:
1. Update schema.prisma to add 'folder' to ContentTypeCategory enum
2. Run: `npx prisma migrate dev --name add-folder-category`
3. Prisma will generate the SQL and handle the migration

**Manual SQL (if needed)**:
```sql
-- Check if 'folder' already exists first
SELECT 'folder' IN (SELECT unnest(enum_range(NULL::"ContentTypeCategory")));

-- If false, then add it
ALTER TYPE "ContentTypeCategory" ADD VALUE 'folder';
```

**Important**: PostgreSQL doesn't support IF NOT EXISTS for enum values, so check first before adding

---

## 4. State Management (Zustand Store)

**What we use**: Zustand store to manage all the sitemap data

**What the store keeps track of**:
- All nodes and their connections (edges)
- Which nodes are currently selected
- History for undo/redo (last 50 actions)
- What needs to be saved
- Current save status (saving, saved, error)

**Why Zustand instead of React hooks**: 
- Too many things to coordinate (nodes, edges, selection, history, saves)
- React hooks would get messy with this much state
- Zustand keeps everything organized in one place
- Makes it easier to add features later

---

## 5. Save Strategy (SaveManager with Retry)

**How saving works**:
- Collect all changes user makes (add node, delete node, move node, etc)
- Wait 1 second after user stops making changes
- Send all changes together to the server
- If save fails, try again automatically

**Retry logic when save fails**:
- First retry: Wait 2 seconds and try again
- Second retry: Wait 4 seconds and try again  
- Third retry: Wait 6 seconds and try again
- After 3 failures: Show error to user with "Retry" button

**Why this approach**:
- Saves bandwidth by batching changes
- Doesn't interrupt user while they're working
- Handles network issues gracefully
- User doesn't lose work if connection drops

---

## 6. Transform Functions

**transformToReactFlow - Database to Visual**:
- Takes the sitemap tree from database
- Converts each page/folder to a visual node
- Creates connection lines between parent and child nodes
- Adds data like title, URL, and component count to each node
- Returns format that React Flow can display

**transformFromReactFlow - Visual to Database**:
- Looks at what user changed in the visual editor
- Figures out what operations happened (added, deleted, moved nodes)
- Creates a list of changes to send to database
- Makes sure changes happen in right order (delete before create)
- Gives this list to SaveManager to save

**Why we need these**:
- Database stores data differently than React Flow displays it
- These functions translate between the two formats
- Keeps database structure separate from visual representation

---

## 7. UndoManager Implementation

**What the UndoManager does**:
- Keeps track of last 50 things user did
- Lets user undo actions (Ctrl+Z)
- Lets user redo actions (Ctrl+Y)
- Automatically removes old history when over 50 items

**How it works**:
- After each user action, save a snapshot of the sitemap
- When user hits undo, go back to previous snapshot
- When user hits redo, go forward to next snapshot
- If user makes new change after undo, delete the "future" history

**Important details**:
- Only keeps 50 snapshots to save memory
- Doesn't save to database during undo/redo
- Updates undo/redo button states (gray when nothing to undo)
- Works with keyboard shortcuts and toolbar buttons

---

## 8. Component Discovery Pattern

**Component Registry (4 Fixed Components)**:

1. **Hero Section**
   - Default title: "Welcome"
   - Default subtitle: "Get started today"
   - Validation: Title must not be empty

2. **Header**
   - Default logo: "Company"
   - Default navigation: Home, About, Contact
   - Validation: Logo must not be empty

3. **Footer**
   - Default copyright: "© 2024"
   - Validation: Always valid

4. **Call to Action (CTA)**
   - Default heading: "Ready?"
   - Default button: "Get Started"
   - Validation: Button text must not be empty

**How validation works**:
- Before saving, check each component's properties
- If validation fails, show error to user
- Don't save invalid components to database
- Use defaults if user doesn't provide values

**Component Discovery Approach**:

**MVP (Static)**: Use fixed array of 4 components - simple and fast

**Future (Dynamic)**: 
- Phase 1: Keep static registry but make it easier to add components
- Phase 2: Use glob patterns to find component files automatically
- Phase 3: Allow npm packages to register components
- Phase 4: Let users upload custom components

**How to add new components post-MVP**:
- Create component file with standard export format
- Register in central registry
- Component gets discovered automatically
- No need to modify core sitemap code

---

## 9. API Endpoints (Transactional)

### GET /api/sitemap/[websiteId]
**Response Format**:
```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "page",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Homepage",
        "slug": "/",
        "components": ["hero", "cta"],
        "childCount": 0
      }
    },
    {
      "id": "node-2",
      "type": "folder",
      "position": { "x": 0, "y": 150 },
      "data": {
        "label": "Products",
        "slug": "/products",
        "components": [],
        "childCount": 3
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
```

### POST /api/sitemap/save
**Request Format**:
```json
{
  "websiteId": "website-123",
  "operations": [
    { "type": "DELETE", "nodeId": "node-5" },
    { "type": "CREATE", "parentId": "node-1", "data": { "title": "New Page", "type": "page" } },
    { "type": "MOVE", "nodeId": "node-3", "newParentId": "node-2" },
    { "type": "UPDATE", "nodeId": "node-4", "data": { "title": "Updated Title" } },
    { "type": "REORDER", "parentId": "node-1", "nodeIds": ["node-2", "node-3", "node-4"] }
  ]
}
```

**Response (Success)**:
```json
{
  "success": true,
  "savedAt": "2024-01-20T10:00:00Z",
  "operationsProcessed": 5
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Operation failed: Cannot create circular dependency",
  "failedOperation": { "type": "MOVE", "nodeId": "node-3" }
}
```

### PATCH /api/sitemap/[nodeId]/components
**Purpose**: Update which components are on a specific page

**What it does**:
- Takes a node ID and list of components
- Checks that the node is a page (not a folder)
- Validates each component exists in our registry
- Updates the database with new component list
- Returns confirmation with updated component list

**Request needs**:
- List of components with their type (hero, cta, etc)
- Order for each component (which comes first)
- Any custom properties for the components

**Response gives**:
- Success or failure status
- Updated list of components
- Timestamp of when it was saved

**Validation checks**:
- Node must be a page, not a folder
- Component types must be valid (hero, header, footer, cta)
- Component IDs must be unique within the page
- Component properties must pass validation rules
- Order values must be sequential (0, 1, 2, etc)

## 10. Component Validation

**When validation happens**:
- When user assigns component to page
- Before saving to database
- When loading from database (cleanup bad data)

**What gets validated**:
- Component type exists in registry
- Required properties are present
- Property values meet requirements (not empty, correct format)
- No duplicate components on same page (one hero max, etc)

**Validation failure handling**:
- Show clear error message to user
- Highlight the problem component
- Prevent save until fixed
- Offer to use defaults to fix issues

---

## 10. React Flow Node Components

**PageNode Component**:
- Visual box that represents a page
- Shows page title and URL
- Displays component count (like "3 components")
- Has connection points on top and bottom
- Different color/style than folders
- Size: 320x200 pixels for content visibility

**FolderNode Component**:
- Visual box that represents a folder
- Shows folder name
- Displays child count (like "5 items")
- Has connection points on top and bottom
- Different visual style (maybe dashed border)
- Same size as pages for consistency

**Node Features**:
- Draggable to reorganize sitemap
- Clickable to select
- Double-click to edit title
- Right-click for context menu (add child, delete, etc)
- Visual feedback when hovering or selected

## 11. Folder Service Implementation

**What folders are**:
- Organizational containers (like folders on your computer)
- Group related pages together
- Don't have actual content or components
- Can't be accessed as web pages (return 404)

**How to create a folder**:
- Create ContentType with category='folder' if doesn't exist
- Create SiteStructure entry with:
  - contentTypeId pointing to folder type
  - contentItemId as NULL (folders have no content)
  - parentId for hierarchy position
  - title for display
  - slug for URL path (though it returns 404)

**Database relationships**:
- SiteStructure table handles the tree
- ContentType defines if it's page or folder
- ContentItem only exists for pages, not folders
- Prisma relations handle the connections

**Folder rules**:
- Can contain both pages and other folders
- Can't have components attached
- Must return 404 if someone tries to visit the URL
- Used only for organizing the sitemap visually

---

## 11. Error Handling Strategy

**ErrorBoundary Implementation**:
- Wrap entire sitemap builder in error boundary
- Catch React rendering errors and display fallback UI
- Log errors to console for debugging
- Provide "Reset" button to restore last known good state

**User-Friendly Error Messages**:
- Network errors: "Connection lost. Your changes are saved locally and will sync when reconnected."
- Save failures: "Unable to save changes. Retrying... (attempt 2 of 3)"
- Load failures: "Unable to load sitemap. Please refresh the page."
- Validation errors: "Invalid operation: Folders cannot have components."
- Permission errors: "You don't have permission to edit this sitemap."

**Recovery Strategies**:
- Auto-save to localStorage on network failure
- Restore from localStorage on next load
- Retry failed operations with exponential backoff (2s, 4s, 6s)
- Provide manual save button when auto-save fails
- Show sync status indicator (saved/saving/error)

**LocalStorage Schema**:
```json
{
  "sitemap_[websiteId]_backup": {
    "nodes": [],
    "edges": [],
    "timestamp": "2024-01-20T10:00:00Z",
    "version": 1
  },
  "sitemap_[websiteId]_pending": {
    "operations": [],
    "timestamp": "2024-01-20T10:00:00Z"
  }
}
```

## 12. Auto-Layout with Dagre

**Dagre Layout Implementation**:
- Import dagre library for graph layout
- Configure with top-bottom direction (rankdir: 'TB')
- Set node separation (100px horizontal, 150px vertical)
- Define node dimensions (320x200 pixels) for proper content display
- Calculate positions for all nodes
- Apply calculated positions to React Flow nodes
- Trigger on "Auto Layout" button click
- Animate position changes for smooth transition

**Layout Configuration**:
```javascript
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 150 });
dagreGraph.setDefaultEdgeLabel(() => ({}));
// Node dimensions: 320x200 for proper component display
```

## 13. Data Model Architecture

### 11.1 Epic 8 Data Model (Existing)

**Key Models**:
- **ContentType**: Has category field ('page' or 'folder')
- **SiteStructure**: Tree hierarchy with parentId relationships
- **ContentItem**: Stores page content and components

**Relationships**:
- Folders: `contentItemId = NULL`, `category = 'folder'`
- Pages: `contentItemId != NULL`, `category = 'page'`

### 11.2 Data Integrity Rules
- **Folders**: `contentType.category = 'folder'` AND `contentItemId = NULL`
- **Pages**: `contentType.category = 'page'` AND `contentItemId != NULL`
- **Hierarchy**: Any node can be parent/child regardless of type
- **Components**: Only pages can have components (via ContentItem.content)

## 14. Service Layer Architecture

### 12.1 Epic 8 Services (Use Directly)

**SiteStructureService**: Handle tree operations
- getTree(), createNode(), updateNode(), deleteNode()
- moveNode(), reorderSiblings()

**ContentItemService**: Manage page content
- updateComponents(), getByStructureId()

**ContentTypeService**: Manage types
- getByCategory(), ensureFolderType()

### 12.2 Service Boundaries
- **SiteStructureService**: Handles all tree operations
- **ContentItemService**: Manages page content only
- **ContentTypeService**: Manages types (page/folder definitions)
- **No new services needed** - Epic 8 services handle everything

## 15. Change Management Architecture

### 15.1 Operation Processing

**Operation Types**: CREATE, UPDATE, DELETE, MOVE, REORDER

**Processing Order**:
1. Validate all operations first (check for circular refs, orphans)
2. Process deletes (mark as deleted, don't cascade yet)
3. Process creates (new nodes)
4. Process moves (update parentId)
5. Process updates (content changes)
6. Process reorders (sibling positions)
7. Handle cascading deletes last (remove marked nodes and their children)

**Why this order**:
- Validation prevents breaking the tree structure
- Delayed cascade prevents orphaned references
- Moves happen after creates to allow reparenting to new nodes

### 15.2 Transaction Handling

**Transaction Handling with Prisma**:

**Approach**:
- Wrap all operations in single Prisma transaction
- Validate operations before starting transaction
- Process operations in correct order
- If any operation fails, entire transaction rolls back

**Cascade Delete Handling**:
- Prisma handles cascading through relations
- Configure in schema: `onDelete: Cascade` for children relation
- Deleted parent automatically removes all children
- No manual cascade logic needed

**Error Recovery**:
- On transaction failure, nothing is saved
- Return specific error about which operation failed
- Allow user to retry or modify operations

### 15.3 Conflict Resolution
- **Strategy**: Last-write-wins at the node level
- **Granularity**: Each node update is independent
- **No locking**: Acceptable for single-owner MVP
- **Future**: Can add optimistic locking post-MVP

## 16. Component System Architecture

### 14.1 Component Registration

**MVP Approach**: Static array of 4 components
- Each has id, name, and default props
- No dynamic discovery needed
- Components stored in ContentItem.content as array

### 14.2 Extensibility Path
- **MVP**: 4 hardcoded components
- **Phase 2**: Dynamic component loading via registry
- **Phase 3**: Component marketplace/library
- **Migration**: Just add to COMPONENT_REGISTRY array

## 17. Database Integration

**API Implementation**:
1. Use Epic 8's SiteStructureService.getTree()
2. Transform tree to React Flow nodes/edges format
3. Return JSON with nodes and edges arrays
4. Dagre will calculate positions client-side

---

## 18. Testing Strategy (15 Critical Tests)

**Core Functionality Tests (5)**:
```javascript
test('loads sitemap from database', async () => { /* verify tree loads */ });
test('saves changes after 1 second debounce', async () => { /* verify debounce */ });
test('drag and drop updates positions', async () => { /* verify drag */ });
test('auto-layout arranges nodes correctly', async () => { /* verify Dagre */ });
test('undo/redo maintains 50 operation history', async () => { /* verify history */ });
```

**Data Integrity Tests (3)**:
```javascript
test('maintains parent-child relationships', async () => { /* verify hierarchy */ });
test('prevents circular dependencies', async () => { /* verify no loops */ });
test('folders cannot have components', async () => { /* verify folder rules */ });
```

**Security & Performance Tests (7)**:
- Authentication required for all operations
- Only owner can edit sitemap
- Folders return 404 when accessed as URLs
- Loads 100 nodes in < 3 seconds
- Maintains 30+ FPS during drag operations
- Shows exactly 4 available components
- Saves component assignments correctly

---

## 19. Implementation Steps

**6-Week Timeline**:
1. **Week 1-2**: Connect to database, load/save functionality
2. **Week 3-4**: Drag/drop, auto-layout, undo/redo
3. **Week 5**: Component assignment, testing
4. **Week 6**: Bug fixes, deployment

---

## 20. Development Setup

**Package Installation**:
```bash
npm install dagre@^0.8.5 @types/dagre@^0.8.2
npm install zustand@^4.4.0
npm install reactflow@^11.10.1
```

**Environment Setup**:
```bash
# Run database migration
npx prisma migrate dev

# Start development server
npm run dev

# Run tests
npm test -- --testPathPattern=sitemap
```

---

## 21. Performance Optimizations

**Key Performance Targets**:
- Load 100 nodes in under 3 seconds
- Maintain 30+ FPS during drag operations
- Save within 1 second of last change
- Instant undo/redo response

**Optimization Strategies**:
- Use React.memo for node components to prevent unnecessary renders
- Virtualize large sitemaps (only render visible nodes)
- Debounce saves to reduce API calls
- Cache transformed data to avoid recalculation
- Use CSS transforms for drag (not React re-renders)

**Performance Monitoring**:
- Log render times in development
- Track API response times
- Monitor memory usage with large sitemaps
- Test with throttled network to ensure good experience

## 22. Success Criteria

**MVP is complete when**:
1. Can load existing sitemap from database
2. Changes save automatically after 1 second
3. Can drag nodes to reorganize
4. Auto-layout button arranges nodes nicely
5. Undo/redo works for last 50 actions
6. Can assign 4 components to pages
7. Only website owner can edit
8. Folders return 404 when accessed
9. Loads 100 nodes in under 3 seconds
10. All 15 critical tests pass

---

## Implementation Approach

1. **File location**: Keep at existing `/app/premium/demo/sitemap-builder/` location
2. **State management**: Use Zustand for complex state coordination
3. **Save strategy**: Implement SaveManager with retry logic and queuing
4. **Epic 8 integration**: Use existing services directly
5. **Components**: Start with 4 fixed components, extensible design
6. **Testing**: 15 critical tests covering core functionality
7. **Error handling**: Implement ErrorBoundary with recovery strategies
8. **Caching**: Use localStorage for offline fallback
9. **Collaboration**: Single-owner for MVP, multi-user post-MVP
10. **Timeline**: 6-week MVP with clear milestones

---

## Risks & Mitigations

- **Performance**: Accept 100-node limit for MVP
- **Conflicts**: Last-write-wins is acceptable
- **Browsers**: Chrome/Firefox/Safari only
- **Timeline**: Cut features if needed, not quality

---

## Conclusion

This architecture focuses on delivering a working sitemap builder in 6 weeks by:
- Using existing code and infrastructure
- Avoiding unnecessary complexity
- Focusing on core features only
- Leveraging Epic 8 services directly
- Keeping testing minimal but effective

The result will be a functional, performant sitemap builder that can be enhanced post-MVP based on real user feedback.