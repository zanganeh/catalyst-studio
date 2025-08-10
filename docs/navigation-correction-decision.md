# Navigation System Correction Decision Document

## Date: 2025-01-10
## Author: Sarah (PO)
## Story: 1.5a

## Issues Identified (Evidence-Based)

### 1. Layout Breaking Issue
**Evidence:** When clicking navigation items, the three-column layout disappears
**Root Cause:** `app/(dashboard)/` uses separate layout instead of maintaining parent layout
**PRD Requirement:** FR1 - Three-column layout must persist (Line 88-89)

### 2. Navigation Redundancy
**Evidence:** "Chat" appears in Overview submenu despite being visible in left panel
**Root Cause:** Navigation structure wasn't aligned with actual UI layout
**PRD Requirement:** Chat panel is part of the persistent three-column layout

### 3. Confusing Content Organization
**Evidence:** "Content Types" and "Content Builder" appear to serve same purpose
**Root Cause:** Unclear naming and purpose distinction
**PRD Requirement:** Story 1.3 (Content Type Builder) vs Story 1.6 (Content Management)

### 4. Analytics Structure
**Evidence:** Analytics → Overview creates redundant single-item submenu
**Root Cause:** Over-structuring of navigation
**PRD Note:** Analytics deferred to post-MVP (Story 1.8, Line 382-387)

### 5. Preview Accessibility
**Evidence:** Preview buried under Content section
**Root Cause:** Incorrect categorization
**PRD Requirement:** Story 1.4 - Preview is a major feature requiring prominence

## Decisions Made

### Navigation Structure
```
✅ Overview (direct link to dashboard)
✅ Content (expandable)
   - Content Items (manage instances)
   - Content Modeling (build schemas)
✅ Preview (consider top-level placement)
✅ Development (expandable)
   - Source Code
   - Components
✅ Integrations (expandable)
   - CMS Connections
✅ Analytics (direct link, placeholder)
```

### Layout Approach
- **Decision:** Maintain three-column layout across ALL views
- **Rationale:** PRD explicitly requires persistent layout (FR1)
- **Implementation:** Single layout wrapper, views load in MainContentPanel

### Routing Strategy
- **Decision:** Use internal routing within MainContentPanel
- **Rationale:** Prevents layout breaking, maintains context
- **Implementation:** Catch-all route with view switching logic

## Implementation Priority

1. **CRITICAL:** Fix layout persistence (blocks all other navigation)
2. **HIGH:** Restructure navigation hierarchy
3. **MEDIUM:** Implement smart routing
4. **LOW:** Polish and optimize transitions

## Success Criteria

- [ ] Three-column layout never breaks during navigation
- [ ] No redundant menu items
- [ ] Clear distinction between content management features
- [ ] All views accessible without confusion
- [ ] Chat remains functional during all navigation

## Risks & Mitigations

**Risk:** Breaking existing functionality
**Mitigation:** Incremental changes with feature flags

**Risk:** User confusion during transition
**Mitigation:** Clear communication, maintain backward compatibility briefly

**Risk:** Performance impact from persistent layout
**Mitigation:** Lazy loading, view caching, optimized re-renders

## Next Steps

1. Review Story 1.5a with development team
2. Implement layout persistence first (highest priority)
3. Test thoroughly with existing features
4. Deploy with feature flag for gradual rollout

## References
- PRD: `docs/prd.md`
- Project Brief: `docs/project-brief.md`
- Story 1.5: `docs/stories/1.5.story.md`
- Story 1.5a: `docs/stories/1.5a.story.md`