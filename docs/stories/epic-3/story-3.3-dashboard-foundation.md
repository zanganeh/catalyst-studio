# Story 3.3: Dashboard Foundation and Layout

## Story Metadata
- **Epic**: Epic 3 - Multi-Website Support Enhancement
- **Story ID**: 3.3
- **Branch**: `feature/epic-3-story-3.3-dashboard-foundation`
- **Estimated Points**: 8
- **Priority**: P0 (Core Feature - Enables Multi-Website UX)
- **Dependencies**: Story 3.1 (Storage Schema) must be complete

## User Story
As a **user**,  
I want **to see a dashboard displaying all my websites**,  
so that **I can view and access all my projects from one place**.

## Context from PRD
The dashboard is the central hub for multi-website management, providing users with a visual overview of all their websites. It follows the Base44 pattern with a card-based grid layout, enabling quick access to any website. This story focuses on the foundation and layout, with AI features coming in Story 3.4.

## Technical Requirements

### 1. Create Dashboard Route and Page
**Location**: `app/dashboard/page.tsx`

```typescript
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { WebsiteGrid } from '@/components/dashboard/website-grid';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { EmptyState } from '@/components/dashboard/empty-state';

export default async function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <div className="container mx-auto px-4 py-8">
        {/* AI Prompt Section - Placeholder for Story 3.4 */}
        <div className="mb-8">
          {/* Will be implemented in Story 3.4 */}
        </div>
        
        {/* Website Grid */}
        <WebsiteGrid />
      </div>
    </DashboardLayout>
  );
}
```

### 2. Dashboard Layout Component
**Location**: `components/dashboard/dashboard-layout.tsx`

```typescript
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold">Catalyst Studio</h1>
            <div className="flex items-center gap-4">
              {/* User menu, settings, etc. */}
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### 3. Website Grid Component
**Location**: `components/dashboard/website-grid.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { WebsiteCard } from './website-card';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { WebsiteMetadata } from '@/lib/storage/types';
import { Skeleton } from '@/components/ui/skeleton';

export function WebsiteGrid() {
  const [websites, setWebsites] = useState<WebsiteMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageService = new WebsiteStorageService();

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      setIsLoading(true);
      const sites = await storageService.listWebsites();
      setWebsites(sites);
    } catch (error) {
      console.error('Failed to load websites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <GridSkeleton />;
  }

  if (websites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {websites.map((website) => (
        <WebsiteCard key={website.id} website={website} />
      ))}
    </div>
  );
}
```

### 4. Website Card Component
**Location**: `components/dashboard/website-card.tsx`

```typescript
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { WebsiteMetadata } from '@/lib/storage/types';

interface WebsiteCardProps {
  website: WebsiteMetadata;
}

export function WebsiteCard({ website }: WebsiteCardProps) {
  return (
    <Link href={`/studio/${website.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {website.icon ? (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-2xl">{website.icon}</span>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10" />
              )}
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">
                  {website.name}
                </h3>
                {website.category && (
                  <span className="text-xs text-muted-foreground">
                    {website.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Last modified {formatDistanceToNow(new Date(website.lastModified))} ago
          </p>
          {website.description && (
            <p className="text-sm mt-2 line-clamp-2">{website.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
```

### 5. Empty State Component
**Location**: `components/dashboard/empty-state.tsx`

```typescript
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-64 h-64 mb-8">
        {/* Placeholder illustration */}
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
          <svg className="w-32 h-32 text-muted-foreground" /* ... */ />
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-2">No websites yet</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Get started by creating your first website. Use the AI prompt above to describe
        what you want to build.
      </p>
      {/* Button will be added in Story 3.4 */}
    </div>
  );
}
```

### 6. Responsive Design Requirements

The dashboard must be responsive across different viewports:

```css
/* Breakpoints */
- Mobile: < 768px (1 column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: 1024px - 1280px (3 columns)
- Wide: > 1280px (4 columns)
```

### 7. Performance Optimizations

```typescript
// Virtual scrolling for large lists (50+ websites)
import { VirtualList } from '@tanstack/react-virtual';

// Lazy loading for website thumbnails
import { LazyImage } from '@/components/ui/lazy-image';

// Skeleton loading states
import { Skeleton } from '@/components/ui/skeleton';
```

## Acceptance Criteria

### AC1: Dashboard Route ✓
- [ ] `/dashboard` route created and accessible
- [ ] Route loads without errors
- [ ] Proper page metadata set
- [ ] Navigation to dashboard works from any page

### AC2: Card-Based Grid Layout ✓
- [ ] Grid layout displays website cards
- [ ] Cards follow Base44 design pattern
- [ ] Grid responsive (1-4 columns based on viewport)
- [ ] Cards maintain consistent height

### AC3: Website Card Display ✓
- [ ] Cards show website name prominently
- [ ] Icon/thumbnail displayed when available
- [ ] Last modified date shown in relative format
- [ ] Category badge displayed if set
- [ ] Description preview (2 lines max)

### AC4: Responsive Design ✓
- [ ] Mobile view (< 768px): 1 column, full width cards
- [ ] Tablet view (768-1024px): 2 columns
- [ ] Desktop view (1024-1280px): 3 columns
- [ ] Wide view (> 1280px): 4 columns
- [ ] Touch-friendly on mobile devices

### AC5: Performance Target ✓
- [ ] Dashboard loads in < 1.5s with 20 websites
- [ ] Smooth scrolling with 50+ websites
- [ ] No layout shift during loading
- [ ] Skeleton loading states shown

## Integration Verification

### IV1: Component Library Usage
- [ ] Uses existing Radix UI components
- [ ] Follows existing design system tokens
- [ ] Consistent with studio styling
- [ ] Proper dark mode support

### IV2: Navigation Flow
- [ ] Clicking card navigates to `/studio/{id}`
- [ ] Browser back button returns to dashboard
- [ ] Session state maintained during navigation
- [ ] Deep linking to dashboard works

### IV3: Performance Scaling
- [ ] Performance scales linearly with website count
- [ ] Memory usage stable with 100+ websites
- [ ] Virtual scrolling activates at 50+ websites
- [ ] No performance degradation over time

## Implementation Steps

### Step 1: Create Dashboard Structure
1. Create `app/dashboard/` directory
2. Implement dashboard page component
3. Set up dashboard layout wrapper
4. Configure route metadata

### Step 2: Build Core Components
1. Create WebsiteGrid component
2. Implement WebsiteCard component
3. Build EmptyState component
4. Add loading skeletons

### Step 3: Storage Integration
1. Connect to WebsiteStorageService
2. Implement data fetching logic
3. Handle loading and error states
4. Add refresh capability

### Step 4: Responsive Design
1. Implement grid breakpoints
2. Test on various devices
3. Optimize touch interactions
4. Ensure accessibility

### Step 5: Performance Optimization
1. Add virtual scrolling for large lists
2. Implement lazy loading
3. Optimize re-renders
4. Performance testing

## Testing Requirements

### Unit Tests
- [ ] WebsiteGrid component logic
- [ ] WebsiteCard rendering
- [ ] Empty state conditions
- [ ] Date formatting utilities

### Integration Tests
- [ ] Dashboard + Storage integration
- [ ] Navigation to studio routes
- [ ] Data refresh on focus
- [ ] Error handling

### E2E Tests
- [ ] Complete dashboard flow
- [ ] Create website → See in grid
- [ ] Navigate to studio and back
- [ ] Responsive behavior

### Performance Tests
- [ ] Load time with 20 websites
- [ ] Scroll performance with 100 websites
- [ ] Memory usage monitoring
- [ ] Network request optimization

## Dependencies
- Story 3.1 (Storage Schema) - Required for data
- WebsiteStorageService from `lib/storage/`
- Existing UI component library
- Next.js 15 app router
- Tailwind CSS for styling

## Risks and Mitigations
1. **Risk**: Poor performance with many websites
   - **Mitigation**: Virtual scrolling and pagination
   
2. **Risk**: Inconsistent card heights
   - **Mitigation**: Fixed height with content truncation
   
3. **Risk**: Slow initial load
   - **Mitigation**: Progressive loading and caching

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Responsive design verified on all breakpoints
- [ ] Performance benchmarks met (< 1.5s load)
- [ ] Code reviewed and approved
- [ ] Accessibility audit passed
- [ ] Documentation updated

## Notes for Developer
- Use existing Card components from `components/ui/`
- Follow the Base44 screenshot pattern for visual design
- Implement proper loading states to prevent layout shift
- Consider implementing search/filter in future story
- Prepare hooks for AI prompt section (Story 3.4)
- Use semantic HTML for accessibility
- Test with screen readers

## QA Focus Areas
- Test with 0, 1, 20, 50, and 100+ websites
- Verify responsive breakpoints
- Check card click areas (entire card should be clickable)
- Test keyboard navigation
- Verify empty state appears correctly
- Test with long website names and descriptions
- Check performance with slow network

## UI/UX Specifications
- Card hover: Subtle shadow elevation
- Card spacing: 24px (1.5rem) gap
- Card padding: 16px (1rem)
- Border radius: 8px (0.5rem)
- Max card width on wide screens: 320px
- Transition duration: 200ms

---
*Story prepared by Bob, Scrum Master*
*Ready for implementation by AI Developer*