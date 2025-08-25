# Project Brief: AI-Powered Site Structure Generator

## Executive Summary

This project focuses on building a site structure generator to complement our existing content type and content item generators. The key missing piece is the ability to generate and store hierarchical page relationships (site structure/sitemap) with proper slug management for routing and URL resolution. The UI will provide a Miro-like canvas experience for intuitive visual management of site structures.

## Project Vision

To create a simple, effective site structure generator that:
1. Generates hierarchical site structures/sitemaps from natural language requirements
2. Stores page relationships with proper parent-child hierarchy
3. Manages slugs for URL routing (unique at each level)
4. Provides efficient storage and retrieval mechanisms

## Problem Statement

**Current State:**
- We have working content type and content item generators
- We have website generators
- **Missing:** Site structure generator with hierarchy storage
- No mechanism to store parent-child relationships between pages
- No slug management for URL routing

**Desired State:**
- AI-powered site structure generation from requirements
- Robust storage mechanism for page hierarchies
- Slug-based URL routing with uniqueness per level
- Simple MVP implementation that's scalable

## Key Requirements

### Functional Requirements

1. **Site Structure Generation**
   - AI analyzes requirements and generates hierarchical sitemap
   - Creates tree structure with root page (typically homepage)
   - Assigns appropriate page types based on context
   - Generates meaningful slugs for each page

2. **Slug Management System**
   - **Unique at each level:** Siblings must have unique slugs
   - **URL building:** Full path = concatenated slugs from root
   - **Examples:**
     - Root: `/` (home)
     - Level 1: `/products`, `/about`, `/contact`
     - Level 2: `/products/electronics`, `/products/clothing`
     - Level 3: `/products/electronics/phones`
   - **Validation:** Ensure slug uniqueness within same parent

3. **Storage Mechanism (MVP Hybrid Approach)**
   - **Adjacency List:** `parent_id` field for simple hierarchy
   - **Materialized Path:** `full_path` field for fast URL lookups
   - **Database Schema (MVP):**
     ```sql
     SiteStructure {
       -- Core Fields (MVP Required)
       id: primary key
       website_id: foreign key
       content_item_id: foreign key (links to existing content)
       parent_id: nullable (null = root)
       slug: string (unique within parent)
       full_path: string (e.g., "/products/electronics")
       path_depth: integer (level in tree, 0 = root)
       position: integer (sibling ordering)
       
       -- Timestamps
       created_at: timestamp
       updated_at: timestamp
     }
     ```
   
   - **Key Improvements from Expert Feedback (MVP-friendly):**
     - Added `path_depth` for efficient level-based queries (Strapi expert)
     - Confirmed hybrid approach aligns with WordPress, Drupal patterns
     - Validated slug uniqueness approach matches industry standards

4. **Simple AI Workflow**
   - Single-step generation (no complex multi-agent system)
   - Context-aware slug generation
   - Iterative refinement if needed
   - Clear output format for implementation

5. **Visual Site Structure UI (Miro-like Canvas)**
   - **Core Experience (Miro-inspired):**
     - Infinite canvas with smooth zoom (scroll wheel)
     - Pan by clicking and dragging empty space
     - Clean, minimal interface focused on content
     - Smooth animations for all interactions
     - Familiar UX patterns users already know
   
   - **Simplified Node Interactions:**
     - **Select:** Click node to select and view details
     - **Move:** Drag node to reposition on canvas
     - **Reconnect:** Drag connection line to new parent
     - **Delete:** Select + Delete key (or delete button)
     - **Edit:** Double-click to edit slug/title inline
     - **Add:** Click "+" button on node to add child
   
   - **Visual Design (Miro-style):**
     - Clean card-based nodes with subtle shadows
     - Smooth curved connection lines between nodes
     - Clear visual hierarchy with indentation
     - Hover states for interactive elements
     - Selection outline for active nodes
     - Minimal color palette (grays + accent color)
   
   - **Recommended Library:**
     - **React Flow** - Closest to Miro's experience
     - Supports all required interactions out-of-box
     - Customizable to match Miro's aesthetic
     - Proven performance with large graphs

### Non-Functional Requirements (MVP Scope)

- **Authentication/Authorization:** Not required for MVP
- **Rate Limiting:** Not required for MVP
- **Performance:** Basic implementation acceptable, focus on core functionality
- **Research Tools:** **MANDATORY use of Zen tools for deep research and WebSearch for current best practices**
- **Focus:** Core business value delivery over infrastructure optimization

## Technical Approach

### Storage Architecture (Research-Based Decision)

Based on comprehensive research using Zen tools and WebSearch, the optimal approach for MVP is:

**Hybrid Storage: Adjacency List + Materialized Path**

1. **Why Hybrid Approach?**
   - **Adjacency List (parent_id):** Simple for inserts, updates, moves
   - **Materialized Path (full_path):** O(1) URL lookups with index
   - **Best of both worlds:** Simple management + fast queries
   - **Industry standard:** Used by WordPress, Drupal, and modern CMS

2. **Slug Architecture**
   ```
   URL Structure = Hierarchical Slugs
   ├── / (root/home)
   ├── /products (level 1)
   │   ├── /products/electronics (level 2)
   │   │   └── /products/electronics/phones (level 3)
   │   └── /products/clothing (level 2)
   └── /about (level 1)
   ```

3. **Key Operations**
   - **URL Resolution:** `SELECT * WHERE full_path = '/products/electronics'`
   - **Children Query:** `SELECT * WHERE parent_id = ?`
   - **Breadcrumb:** Traverse up using parent_id
   - **Slug Update:** Update full_path for node and all descendants

## Implementation Strategy

### Phase 1: Database Schema Implementation
- Create `SiteStructure` table with hybrid storage fields
- Add indexes on `full_path` for fast URL lookups
- Add unique constraint on `(parent_id, slug)` for sibling uniqueness
- Create foreign key relationships to existing tables

### Phase 2: Site Structure Generator
- **AI Prompt Engineering**
  - Design prompt for hierarchical sitemap generation
  - Include examples of expected output format
  - Specify slug generation rules
  
- **Output Parser**
  - Parse AI-generated sitemap into structured data
  - Validate slug uniqueness at each level
  - Build parent-child relationships

### Phase 3: Storage Layer Implementation
- **CRUD Operations**
  - Create: Insert node with parent_id and build full_path
  - Read: Query by full_path or parent_id
  - Update: Handle slug changes and cascade to children
  - Delete: Handle node deletion with children
  
- **Path Management**
  - Build full_path on insert/update
  - Cascade path updates to descendants on slug change
  - Maintain path integrity

### Phase 4: Miro-like UI Development
- **Canvas Setup (React Flow)**
  - Configure infinite canvas with pan/zoom
  - Style to match Miro's clean aesthetic
  - Implement smooth animations
  - Set up keyboard shortcuts
  
- **Core Interactions (MVP)**
  - Drag nodes to move on canvas
  - Drag connections to change parent
  - Double-click for inline editing
  - Delete key for removal
  - Simple "+" button for adding children
  
- **Visual Polish**
  - Card-style nodes with shadows
  - Smooth bezier curve connections
  - Hover and selection states
  - Minimal, professional color scheme

### Phase 5: Integration & Testing
- Connect to existing content item system
- Test URL resolution performance
- Validate slug uniqueness constraints
- Handle edge cases (circular references, orphans)
- Test UI with large site structures (100+ nodes)

## Best Practices & Guidelines

### Slug Management Rules

1. **Uniqueness Constraints**
   - Slugs must be unique among siblings (same parent)
   - Case-insensitive comparison for uniqueness
   - URL-safe characters only (alphanumeric, hyphens)
   - No special characters or spaces

2. **Slug Generation**
   - Auto-generate from page title
   - Lowercase conversion
   - Replace spaces with hyphens
   - Remove special characters
   - Handle duplicates by appending numbers

3. **URL Path Building**
   - Root page has empty slug or "home"
   - Full path = parent_path + "/" + slug
   - Always maintain consistency between slug and full_path
   - Index full_path for performance

### UI/UX Guidelines (Miro-like Experience)

1. **Interaction Principles**
   - **Simplicity First:** Every action should be intuitive
   - **Direct Manipulation:** What you see is what you edit
   - **Smooth Feedback:** Instant visual response to actions
   - **Minimal UI:** Canvas content is the focus, not controls

2. **Miro-like Behaviors**
   - **Canvas Navigation:** Click + drag to pan, scroll to zoom
   - **Node Selection:** Click to select, Ctrl/Cmd for multi-select
   - **Connection Editing:** Drag connection endpoints to reconnect
   - **Inline Editing:** Double-click any text to edit
   - **Keyboard Shortcuts:** Delete, Ctrl+Z (undo), Ctrl+Y (redo)

3. **Visual Consistency**
   - **Node Design:** Rounded rectangles with subtle shadows
   - **Connections:** Smooth bezier curves, not straight lines
   - **Colors:** Minimal palette - white nodes, gray connections
   - **States:** Hover (highlight), Selected (border), Dragging (opacity)
   - **Typography:** Clean, readable fonts (like Inter or SF Pro)

### Development Guidelines

1. **Database Integrity**
   - Always use transactions for path updates
   - Cascade updates to children when parent changes
   - Prevent circular references
   - Handle orphaned nodes

2. **Performance Optimization**
   - Index on full_path for URL lookups
   - Index on parent_id for children queries
   - Consider caching frequently accessed paths
   - Batch updates for bulk operations

3. **Research & Validation**
   - **Use Zen tools for architecture decisions**
   - **Use WebSearch for best practices**
   - Test with real-world site structures
   - Validate against industry standards

## Success Metrics

1. **Performance**
   - Site structure generation: < 5 seconds for 50-page site
   - URL resolution: < 10ms with indexed full_path
   - Bulk operations: < 1 second for 100 nodes
   - UI rendering: < 100ms for 500 nodes
   - Zoom/pan: 60 FPS smooth interaction

2. **Data Integrity**
   - 100% slug uniqueness within same parent
   - Zero broken parent-child relationships
   - Consistent full_path with actual hierarchy

3. **UI/UX Usability**
   - Natural language input generates valid site structure
   - Intuitive drag-drop reorganization
   - Clear visual hierarchy representation
   - < 3 clicks to perform any operation
   - Mobile-responsive canvas view

## Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Slug conflicts | High | Unique constraint at database level, validation layer |
| Path inconsistency | High | Transactional updates, integrity checks |
| Circular references | Medium | Parent validation, prevent self-referencing |
| Performance degradation | Medium | Proper indexing, caching strategy |
| AI hallucination in structure | Low | Output validation, example-based prompts |

## Tools & Technologies

- **Database**: PostgreSQL with hybrid storage pattern
- **AI Integration**: Single prompt for site structure generation
- **Research Tools**: 
  - **Zen consultation (MANDATORY for architecture decisions)**
  - **WebSearch (MANDATORY for best practices research)**
- **Validation**: Slug uniqueness, path integrity checks
- **Version Control**: Git flow with story-based branches

## Next Steps

1. **Immediate Actions**
   - Create database migration for SiteStructure table
   - Design AI prompt for sitemap generation
   - **Use Zen to research optimal tree storage patterns**
   - **Use WebSearch for slug management best practices**

2. **Week 1**
   - Implement database schema with indexes
   - Build CRUD operations for site structure
   - Create slug validation and generation utilities

3. **Week 2**
   - Develop AI prompt and output parser
   - Test with various website requirements
   - Implement path management functions

4. **Week 3**
   - Integration with existing content system
   - Performance testing and optimization
   - Handle edge cases and error scenarios

## Expert Platform Review Summary

### CMS Expert Consensus (7 Platform Architects)

After consulting with experts from Optimizely, Strapi, Contentful, WordPress, Drupal, Sanity, and Sitecore:

**✅ APPROVED BY ALL EXPERTS for MVP:**
1. **Hybrid Storage Pattern** - Unanimously approved as best practice
2. **Slug Uniqueness at Sibling Level** - Matches all platform patterns
3. **Path Depth Addition** - Improves query performance significantly

**Platform Compatibility Confirmation:**
- **WordPress** (43% of web): "Exactly how we do it with post_parent"
- **Drupal**: "This combines best of Drupal's patterns"
- **Strapi**: "Perfect fit, solves our common performance issues"
- **Optimizely**: "Aligns well with our ContentRepository pattern"

**Future Enhancements (Post-MVP):**
- Localization support (when needed)
- Publishing states (when workflow required)
- URL aliases/redirects (for SEO)
- Versioning (for enterprise needs)

**Key Validation:**
All experts confirmed this MVP approach will integrate smoothly with their platforms and can be extended later without breaking changes.

## Appendix: Research Findings Summary

Based on comprehensive research using Zen tools and WebSearch:

### Storage Pattern Comparison

1. **Adjacency List**: Best for simple operations, used by most CMS
2. **Nested Sets**: Complex, good for reads, poor for writes
3. **Materialized Path**: Fast lookups, good balance
4. **Closure Table**: Best for complex queries, high storage cost
5. **Hybrid Approach**: Combines adjacency list + materialized path (RECOMMENDED)

### Industry Standards

- **WordPress**: Uses adjacency list with post_parent
- **Drupal**: Supports multiple patterns, default is adjacency
- **Modern Headless CMS**: API-driven with flexible storage
- **URL Resolution**: Materialized path provides O(1) lookups

### Key Insights

- Slug uniqueness at each level is critical for routing
- Full URL path = concatenated slugs from root to node
- Hybrid approach balances simplicity with performance
- Proper indexing on full_path essential for speed
- Transactional updates prevent path inconsistencies

**Critical Note**: Always use Zen tools for deep storage pattern analysis and WebSearch for current CMS implementation practices.

---

*Document created by: Mary, Business Analyst*  
*Date: 2025-08-21*  
*Epic: Epic 8 - AI-Powered Site Structure Generation*