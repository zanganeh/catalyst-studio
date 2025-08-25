# Epic 9: Sitemap Builder Implementation Guide

## Executive Summary

This document consolidates all research, decisions, and technical specifications for productionizing the sitemap builder. It serves as the single source of truth for the development team to begin implementation.

**Goal**: Connect the existing React Flow sitemap demo to our production database, enabling users to visually create and manage site structures with real data persistence.

**Timeline**: 6 weeks  
**Team Required**: 2-3 developers  
**Status**: Ready for implementation

---

## Quick Start Checklist

Before starting development, ensure you have:
- [ ] Read this entire document
- [ ] Access to the sitemap demo at `/app/premium/demo/sitemap-builder/page.tsx`
- [ ] Understanding of existing Epic 8 infrastructure (SiteStructure, ContentItem, PageOrchestrator)
- [ ] Node.js 18+, PostgreSQL, Prisma CLI installed
- [ ] Reviewed the React Flow documentation

---

## Part 1: What We're Building (MVP Scope)

### Core Features
1. **Visual Sitemap Editor** - Drag-and-drop interface connected to real database
2. **Page & Folder Management** - Create, edit, delete, organize pages and folders
3. **Component System** - Add/remove/reorder components within pages
4. **Smart Layout** - Automatic positioning algorithm (no manual placement needed)
5. **Undo/Redo** - Single-level undo for all operations
6. **Bulk Operations** - Delete multiple items, change status in bulk

### What We're NOT Building (Yet)
- Real-time collaboration
- Import/export functionality
- Rich metadata (SEO scores, analytics)
- Position persistence
- Performance optimization
- Component configuration UI

---

## Part 2: Technical Architecture

### Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Flow UI  │────▶│  API Endpoints  │────▶│    Database     │
│  (Sitemap Demo) │◀────│  (Next.js API)  │◀────│  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   [Auto-Layout]          [Bulk Operations]         [SiteStructure]
   [Undo/Redo]            [Validation]              [ContentItem]
   [Components]           [Permissions]             [ContentType]
```

### Database Schema Changes

```prisma
// 1. Update ContentTypeCategory enum
enum ContentTypeCategory {
  page
  component
  folder  // NEW: Add folder type
}

// 2. SiteStructure already supports hierarchy - no changes needed
// 3. ContentItem will store folder metadata in JSON
```

### Component Architecture

```
/components/globals/         # Global components directory
  /hero/
    ├── index.tsx           # React component
    ├── schema.ts           # Props definition
    ├── defaults.ts         # Default values
    └── README.md           # Documentation
  /cta/
    ├── index.tsx
    └── ...
```

---

## Part 3: Implementation Plan

### Phase 1: Foundation (Week 1-2)

#### 1.1 Database Setup
```typescript
// Migration: Add folder type
-- prisma/migrations/add_folder_type.sql
ALTER TYPE "ContentTypeCategory" ADD VALUE 'folder';

// Service update
class SiteStructureService {
  async createFolder(input: {
    websiteId: string
    parentId?: string
    title: string
    slug: string
  }) {
    // Create ContentType with category='folder'
    // Create ContentItem with basic metadata
    // Create SiteStructure node
  }
}
```

#### 1.2 Component Registration System
```typescript
// lib/components/registry.ts
import { globSync } from 'glob'

export function discoverComponents() {
  const componentPaths = globSync('./components/globals/*/index.tsx')
  
  return componentPaths.map(path => {
    const name = path.split('/')[3]
    return {
      name,
      component: () => import(path),
      schema: () => import(`${path}/../schema.ts`),
      defaults: () => import(`${path}/../defaults.ts`)
    }
  })
}

// Build-time generation (next.config.js)
module.exports = {
  webpack: (config) => {
    config.plugins.push(new ComponentRegistryPlugin())
    return config
  }
}
```

#### 1.3 Auto-Layout Algorithm
```typescript
// lib/sitemap/layout-engine.ts
import dagre from 'dagre'

export function calculateLayout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  
  // Configure layout
  g.setGraph({
    rankdir: 'TB',     // Top to bottom
    nodesep: 100,      // Horizontal spacing
    ranksep: 150,      // Vertical spacing
    marginx: 50,
    marginy: 50
  })
  
  // Add nodes
  nodes.forEach(node => {
    g.setNode(node.id, { 
      width: 320,  // Node width
      height: 200  // Node height
    })
  })
  
  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })
  
  // Calculate positions
  dagre.layout(g)
  
  // Map back to React Flow nodes
  return nodes.map(node => ({
    ...node,
    position: g.node(node.id)
  }))
}
```

### Phase 2: Core Integration (Week 3-4)

#### 2.1 Connect Demo to Database
```typescript
// app/premium/demo/sitemap-builder/page.tsx modifications

// Replace hardcoded data
- const initialNodes = [/* hardcoded */]
+ const initialNodes = await fetchSitemapData(websiteId)

async function fetchSitemapData(websiteId: string) {
  const response = await fetch(`/api/sitemap/${websiteId}`)
  const data = await response.json()
  
  // Transform database structure to React Flow nodes
  return transformToReactFlow(data)
}

function transformToReactFlow(siteStructure: TreeNode): Node[] {
  const nodes: Node[] = []
  const edges: Edge[] = []
  
  function traverse(node: TreeNode, parent?: string) {
    nodes.push({
      id: node.id,
      type: node.contentType?.category || 'page',
      data: {
        label: node.title,
        components: node.contentItem?.content?.components || [],
        metadata: node.contentItem?.metadata
      },
      position: { x: 0, y: 0 } // Will be calculated by auto-layout
    })
    
    if (parent) {
      edges.push({
        id: `${parent}-${node.id}`,
        source: parent,
        target: node.id
      })
    }
    
    node.children?.forEach(child => traverse(child, node.id))
  }
  
  traverse(siteStructure)
  return { nodes, edges }
}
```

#### 2.2 Save Functionality
```typescript
// lib/sitemap/save-manager.ts
export class SaveManager {
  private pendingChanges: Change[] = []
  private saveTimeout: NodeJS.Timeout
  
  addChange(change: Change) {
    this.pendingChanges.push(change)
    this.debounceSave()
  }
  
  private debounceSave() {
    clearTimeout(this.saveTimeout)
    this.saveTimeout = setTimeout(() => this.save(), 1000)
  }
  
  private async save() {
    if (this.pendingChanges.length === 0) return
    
    const changes = [...this.pendingChanges]
    this.pendingChanges = []
    
    try {
      await fetch('/api/sitemap/save', {
        method: 'POST',
        body: JSON.stringify({ changes })
      })
    } catch (error) {
      // Re-add changes for retry
      this.pendingChanges.unshift(...changes)
    }
  }
}
```

#### 2.3 API Endpoints
```typescript
// app/api/sitemap/[websiteId]/route.ts
export async function GET(request: Request, { params }) {
  const { websiteId } = params
  
  const tree = await siteStructureService.getTree(websiteId)
  return NextResponse.json(tree)
}

// app/api/sitemap/save/route.ts
export async function POST(request: Request) {
  const { changes } = await request.json()
  
  // Process changes in transaction
  await prisma.$transaction(async (tx) => {
    for (const change of changes) {
      switch (change.type) {
        case 'CREATE_NODE':
          await createNode(tx, change.data)
          break
        case 'UPDATE_NODE':
          await updateNode(tx, change.id, change.data)
          break
        case 'DELETE_NODE':
          await deleteNode(tx, change.id)
          break
        case 'MOVE_NODE':
          await moveNode(tx, change.id, change.newParentId)
          break
      }
    }
  })
  
  return NextResponse.json({ success: true })
}
```

### Phase 3: Essential Features (Week 5-6)

#### 3.1 Undo/Redo Implementation
```typescript
// lib/sitemap/undo-manager.ts
class UndoManager {
  private history: State[] = []
  private currentIndex = -1
  
  push(state: State) {
    // Remove any states after current index
    this.history = this.history.slice(0, this.currentIndex + 1)
    
    // Add new state
    this.history.push(state)
    this.currentIndex++
    
    // Limit history size
    if (this.history.length > 50) {
      this.history.shift()
      this.currentIndex--
    }
  }
  
  undo(): State | null {
    if (this.currentIndex > 0) {
      this.currentIndex--
      return this.history[this.currentIndex]
    }
    return null
  }
  
  redo(): State | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      return this.history[this.currentIndex]
    }
    return null
  }
}

// Integration in React
function useSitemapUndo() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const undoManager = useRef(new UndoManager())
  
  const saveState = useCallback(() => {
    undoManager.current.push({ nodes, edges })
  }, [nodes, edges])
  
  const undo = useCallback(() => {
    const state = undoManager.current.undo()
    if (state) {
      setNodes(state.nodes)
      setEdges(state.edges)
    }
  }, [])
  
  const redo = useCallback(() => {
    const state = undoManager.current.redo()
    if (state) {
      setNodes(state.nodes)
      setEdges(state.edges)
    }
  }, [])
  
  return { undo, redo, saveState }
}
```

#### 3.2 Bulk Operations
```typescript
// app/api/sitemap/bulk/route.ts
export async function POST(request: Request) {
  const { operation, ids, data } = await request.json()
  
  const results = {
    succeeded: [],
    failed: []
  }
  
  // Best-effort approach for MVP
  for (const id of ids) {
    try {
      switch (operation) {
        case 'DELETE':
          await siteStructureService.delete(id)
          results.succeeded.push(id)
          break
          
        case 'UPDATE_STATUS':
          await contentItemService.updateStatus(id, data.status)
          results.succeeded.push(id)
          break
      }
    } catch (error) {
      results.failed.push({ id, error: error.message })
    }
  }
  
  return NextResponse.json(results)
}

// UI Integration
function BulkOperations({ selectedNodes }) {
  const handleBulkDelete = async () => {
    const ids = selectedNodes.map(n => n.id)
    
    if (!confirm(`Delete ${ids.length} items?`)) return
    
    const response = await fetch('/api/sitemap/bulk', {
      method: 'POST',
      body: JSON.stringify({
        operation: 'DELETE',
        ids
      })
    })
    
    const results = await response.json()
    
    if (results.failed.length > 0) {
      alert(`Failed to delete ${results.failed.length} items`)
    }
    
    // Update UI
    removeNodes(results.succeeded)
  }
}
```

#### 3.3 Folder Routing
```typescript
// app/[...slug]/page.tsx
export default async function DynamicPage({ params }) {
  const path = params.slug.join('/')
  const node = await siteStructureService.findByPath(path)
  
  if (!node) {
    notFound()
  }
  
  // MVP: Folders return 404
  if (node.contentType?.category === 'folder') {
    notFound()
  }
  
  // Render page content
  const content = await contentItemService.findById(node.contentItemId)
  return <PageRenderer content={content} />
}
```

---

## Part 4: Critical Implementation Details

### 4.1 Component Discovery Pattern (Decision Required)

**Option A: Build-time Discovery (Recommended)**
```javascript
// build-scripts/generate-components.js
const components = glob.sync('./components/globals/*/index.tsx')
fs.writeFileSync('components.generated.ts', generateRegistry(components))
```
**Pros**: No runtime overhead, tree-shakeable  
**Cons**: Requires build step

**Option B: Runtime Discovery**
```javascript
const context = require.context('./components/globals', true, /index\.tsx$/)
```
**Pros**: No build configuration  
**Cons**: Includes all components in bundle

### 4.2 State Management Strategy

```typescript
// stores/sitemap-store.ts
import { create } from 'zustand'

interface SitemapStore {
  nodes: Node[]
  edges: Edge[]
  selectedNodes: Node[]
  
  // Actions
  addNode: (node: Node) => void
  updateNode: (id: string, data: Partial<Node>) => void
  deleteNode: (id: string) => void
  
  // Bulk actions
  selectNodes: (nodes: Node[]) => void
  bulkDelete: (ids: string[]) => void
  
  // Persistence
  save: () => Promise<void>
  load: (websiteId: string) => Promise<void>
}

export const useSitemapStore = create<SitemapStore>((set, get) => ({
  // Implementation
}))
```

### 4.3 Error Handling Strategy

```typescript
class SitemapErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('Sitemap error:', error, errorInfo)
    
    // Show user-friendly message
    this.setState({
      hasError: true,
      message: this.getUserMessage(error)
    })
  }
  
  getUserMessage(error: Error) {
    if (error.message.includes('permission')) {
      return 'You do not have permission to perform this action'
    }
    if (error.message.includes('network')) {
      return 'Connection lost. Your changes will be saved when reconnected.'
    }
    return 'An error occurred. Please refresh and try again.'
  }
}
```

---

## Part 5: Testing Strategy

### Unit Tests
```typescript
// __tests__/layout-engine.test.ts
describe('Layout Engine', () => {
  it('should position nodes without overlap', () => {
    const nodes = createTestNodes(10)
    const positioned = calculateLayout(nodes, [])
    
    // Check no overlaps
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        expect(nodesOverlap(positioned[i], positioned[j])).toBe(false)
      }
    }
  })
})
```

### Integration Tests
```typescript
// __tests__/sitemap-integration.test.ts
describe('Sitemap Integration', () => {
  it('should save changes to database', async () => {
    // Create node in UI
    const node = await createNodeInUI('Test Page')
    
    // Wait for save
    await waitFor(() => {
      expect(saveManager.pendingChanges).toHaveLength(0)
    })
    
    // Verify in database
    const saved = await prisma.siteStructure.findUnique({
      where: { id: node.id }
    })
    expect(saved).toBeDefined()
  })
})
```

---

## Part 6: Deployment Checklist

### Pre-Deployment
- [ ] Database migrations applied
- [ ] Component registry generated
- [ ] Environment variables configured
- [ ] Error tracking configured

### Performance Validation
- [ ] Load time < 3s for 100 nodes
- [ ] Smooth drag/drop interaction
- [ ] Save operations < 1s

### Feature Validation
- [ ] Create/edit/delete pages works
- [ ] Folders return 404
- [ ] Components reorder correctly
- [ ] Undo/redo functions
- [ ] Bulk operations complete

---

## Part 7: Known Limitations & Future Work

### Current Limitations
1. **No position persistence** - Layout recalculates on each load
2. **No real-time collaboration** - Last write wins
3. **Limited to ~100 pages** - No performance optimization
4. **No component configuration** - Components use defaults only

### Immediate Backlog (Phase 2)
1. Component configuration UI
2. Rich metadata fields
3. Import/export functionality
4. Performance optimization for large sitemaps

### Future Vision (Phase 3)
1. Real-time collaboration (Miro-style)
2. AI-powered suggestions
3. Version control integration
4. Template marketplace

---

## Part 8: Quick Reference

### Key Files
```
/app/premium/demo/sitemap-builder/page.tsx    # Main UI to modify
/lib/services/site-structure/                  # Existing backend services
/components/globals/                           # Component library location
/app/api/sitemap/                             # New API endpoints
/lib/sitemap/                                 # New sitemap utilities
```

### Key Dependencies
```json
{
  "dagre": "^0.8.5",          // Layout algorithm
  "reactflow": "^11.10.1",    // Flow diagram library
  "zustand": "^4.4.7",        // State management
  "immer": "^10.0.3"          // Immutable updates
}
```

### Environment Variables
```env
DATABASE_URL=postgresql://...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Common Commands
```bash
# Generate component registry
npm run build:components

# Run migrations
npx prisma migrate dev

# Start development
npm run dev

# Run tests
npm test
```

---

## Appendix A: API Reference

### Sitemap Endpoints

#### GET /api/sitemap/[websiteId]
Returns complete sitemap tree structure

#### POST /api/sitemap/save
Saves changes to sitemap

#### POST /api/sitemap/bulk
Performs bulk operations

#### POST /api/sitemap/[nodeId]/components
Updates components for a node

---

## Appendix B: Troubleshooting

### Common Issues

**Issue**: Layout overlapping nodes  
**Solution**: Check node dimensions in layout config

**Issue**: Save not working  
**Solution**: Check network tab, verify API endpoint

**Issue**: Undo not working  
**Solution**: Ensure saveState() called before changes

**Issue**: Components not found  
**Solution**: Run `npm run build:components`

---

## Get Started

1. **Set up your environment**
   ```bash
   git checkout -b epic-9-sitemap
   npm install
   npx prisma migrate dev
   ```

2. **Start with Phase 1**
   - Add folder type to enum
   - Set up component structure
   - Implement layout algorithm

3. **Test incrementally**
   - Test each feature in isolation
   - Integration test with real data

4. **Ask questions**
   - Architecture decisions documented above
   - Slack channel: #epic-9-sitemap

---

## Success Metrics

- ✅ Sitemap loads in < 3 seconds
- ✅ All CRUD operations work
- ✅ Undo/redo reliable
- ✅ No data loss
- ✅ Intuitive user experience

This implementation guide provides everything needed to start development immediately. Follow the phases in order, test incrementally, and refer back to this document for technical details.