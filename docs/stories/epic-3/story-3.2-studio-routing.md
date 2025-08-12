# Story 3.2: Studio ID-Based Routing Implementation

## Story Metadata
- **Epic**: Epic 3 - Multi-Website Support Enhancement
- **Story ID**: 3.2
- **Branch**: `feature/epic-3-story-3.2-studio-routing`
- **Estimated Points**: 5
- **Priority**: P0 (Foundation - Required for Multi-Website)
- **Dependencies**: Story 3.1 (Storage Schema) must be complete

## User Story
As a **developer**,  
I want **to modify the studio to accept and process website ID parameters**,  
so that **the studio can load different website contexts based on the route**.

## Context from PRD
This story transforms the existing single-website studio into a multi-website capable studio by adding ID-based routing. The studio must accept an optional ID parameter and load the appropriate website context from the storage service implemented in Story 3.1. Backward compatibility is critical - the studio must continue to work without an ID for existing single-website users.

## Technical Requirements

### 1. Create Dynamic Studio Routes
**Location**: `app/studio/[id]/`

Create the following Next.js 15 dynamic route structure:
```
app/
  studio/
    [id]/
      layout.tsx        # WebsiteContext wrapper
      page.tsx          # Main studio page
      ai/
        page.tsx        # AI panel with context
      content/
        page.tsx        # Content management
      preview/
        page.tsx        # Preview with context
      settings/
        page.tsx        # Website-specific settings
```

### 2. Implement WebsiteContext Provider
**Location**: `lib/context/website-context.tsx`

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';

interface WebsiteContextValue {
  websiteId: string;
  website: WebsiteData | null;
  isLoading: boolean;
  error: Error | null;
  
  // Operations
  updateWebsite: (updates: Partial<WebsiteData>) => Promise<void>;
  deleteWebsite: () => Promise<void>;
  switchWebsite: (id: string) => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextValue | null>(null);

export function WebsiteContextProvider({
  websiteId,
  children
}: {
  websiteId: string;
  children: React.ReactNode;
}) {
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const storageService = new WebsiteStorageService();
  
  // Load website data on mount and ID change
  useEffect(() => {
    loadWebsiteData();
  }, [websiteId]);
  
  // Implementation details...
}

export const useWebsiteContext = () => {
  const context = useContext(WebsiteContext);
  if (!context) {
    throw new Error('useWebsiteContext must be used within WebsiteContextProvider');
  }
  return context;
};
```

### 3. Studio Layout with Context
**Location**: `app/studio/[id]/layout.tsx`

```typescript
import { WebsiteContextProvider } from '@/lib/context/website-context';
import { StudioShell } from '@/components/studio/studio-shell';

export default function StudioLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  // Handle optional ID parameter
  const websiteId = params.id || 'default';
  
  return (
    <WebsiteContextProvider websiteId={websiteId}>
      <StudioShell>
        {children}
      </StudioShell>
    </WebsiteContextProvider>
  );
}
```

### 4. Backward Compatibility Layer
**Location**: `app/studio/page.tsx` (Legacy route)

```typescript
import { redirect } from 'next/navigation';

export default function LegacyStudioPage() {
  // Redirect legacy /studio to /studio/default
  redirect('/studio/default');
}
```

### 5. Update Existing Studio Components
All existing studio components need to be updated to use the WebsiteContext:

```typescript
// Example: components/studio/studio-header.tsx
import { useWebsiteContext } from '@/lib/context/website-context';

export function StudioHeader() {
  const { website, isLoading } = useWebsiteContext();
  
  if (isLoading) {
    return <div>Loading website...</div>;
  }
  
  return (
    <header>
      <h1>{website?.name || 'Untitled Website'}</h1>
      {/* Rest of header */}
    </header>
  );
}
```

## Acceptance Criteria

### AC1: Dynamic Route Structure ✓
- [ ] `/studio/[id]` route created and functional
- [ ] All sub-routes (`/ai`, `/content`, `/preview`, `/settings`) work with ID
- [ ] Route parameters properly extracted and passed to components
- [ ] TypeScript types for route params defined

### AC2: WebsiteContext Provider ✓
- [ ] Context provider wraps all studio components
- [ ] Context loads website data from storage service
- [ ] Loading and error states handled gracefully
- [ ] Context operations (update, delete, switch) functional

### AC3: Storage Integration ✓
- [ ] Correct website data loaded based on ID parameter
- [ ] Integration with WebsiteStorageService from Story 3.1
- [ ] Data persistence across navigation
- [ ] Cache invalidation on updates

### AC4: Backward Compatibility ✓
- [ ] `/studio` (no ID) redirects to `/studio/default`
- [ ] Existing single-website users experience no breaking changes
- [ ] Default website created if none exists
- [ ] Migration path for existing data

### AC5: Sub-Route Context Inheritance ✓
- [ ] All studio sections receive website context
- [ ] Navigation between sections maintains context
- [ ] Deep linking to sub-routes works correctly
- [ ] Context updates propagate to all components

## Integration Verification

### IV1: Feature Compatibility
- [ ] All existing studio features work with ID parameter
- [ ] AI panel receives website context
- [ ] Content management scoped to website
- [ ] Preview shows correct website

### IV2: Navigation Integrity
- [ ] Navigation between studio sections maintains website context
- [ ] Browser back/forward preserves context
- [ ] Direct URL access loads correct website
- [ ] No context loss on page refresh

### IV3: Performance
- [ ] No performance degradation in studio load time
- [ ] Context switching < 500ms
- [ ] Memory usage stable with context changes
- [ ] No unnecessary re-renders

## Implementation Steps

### Step 1: Create Route Structure
1. Create `app/studio/[id]/` directory
2. Move existing studio pages to dynamic route
3. Create layout.tsx with context wrapper
4. Set up sub-routes for all studio sections

### Step 2: Implement WebsiteContext
1. Create context provider component
2. Integrate with WebsiteStorageService
3. Implement loading and error states
4. Add context operations

### Step 3: Update Components
1. Identify all studio components
2. Add useWebsiteContext hook usage
3. Update component logic for multi-website
4. Test each component with different IDs

### Step 4: Backward Compatibility
1. Create redirect from `/studio` to `/studio/default`
2. Ensure default website creation
3. Test with existing single-website setup
4. Verify no breaking changes

### Step 5: Testing & Validation
1. Test all routes with various IDs
2. Verify context persistence
3. Performance benchmarks
4. Edge case handling

## Testing Requirements

### Unit Tests
- [ ] WebsiteContext provider logic
- [ ] Route parameter extraction
- [ ] Context operations (update, delete, switch)
- [ ] Default website handling

### Integration Tests
- [ ] Context + Storage integration
- [ ] Navigation flow with context
- [ ] Sub-route context inheritance
- [ ] Backward compatibility scenarios

### E2E Tests
- [ ] Complete studio navigation with ID
- [ ] Context switching between websites
- [ ] Deep linking to sub-routes
- [ ] Legacy route redirects

## Dependencies
- Story 3.1 (Storage Schema) - MUST be complete
- WebsiteStorageService from `lib/storage/`
- Existing studio components
- Next.js 15 app router

## Risks and Mitigations
1. **Risk**: Breaking existing studio functionality
   - **Mitigation**: Comprehensive backward compatibility testing
   
2. **Risk**: Context loss during navigation
   - **Mitigation**: Proper context persistence and state management
   
3. **Risk**: Performance impact from context loading
   - **Mitigation**: Implement caching and lazy loading strategies

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] No regression in existing features
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] QA sign-off

## Notes for Developer
- Use Next.js 15 app router patterns
- Ensure TypeScript strict mode compliance
- Follow existing component patterns
- Test with both new and legacy routes
- Consider implementing route guards for invalid IDs
- Use React.memo for expensive components to prevent re-renders

## QA Focus Areas
- Test with invalid/missing website IDs
- Verify context persistence across refreshes
- Check for memory leaks during context switches
- Validate all studio features with multiple websites
- Test migration from single to multi-website mode

---
*Story prepared by Bob, Scrum Master*
*Ready for implementation by AI Developer*