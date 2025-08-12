# Story 3.5: Recent Apps and Website Selection

## Story Metadata
- **Epic**: Epic 3 - Multi-Website Support Enhancement
- **Story ID**: 3.5
- **Branch**: `feature/epic-3-story-3.5-recent-apps`
- **Estimated Points**: 5
- **Priority**: P1 (Important - Enhanced User Experience)
- **Dependencies**: Stories 3.1, 3.2, 3.3, 3.4 must be complete

## User Story
As a **user**,  
I want **to see and access my recently created websites**,  
so that **I can quickly resume work on existing projects**.

## Context from PRD
This story completes the dashboard experience by implementing the Recent Apps section, which provides quick access to previously created websites. The feature displays website cards with relevant metadata, enabling users to instantly jump back into their work. This is critical for productivity as users often work on multiple projects simultaneously and need efficient context switching.

## Technical Requirements

### 1. Recent Apps Component
**Location**: `components/dashboard/recent-apps.tsx`

```typescript
import { useState, useEffect } from 'react';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { WebsiteCard } from './website-card';
import { formatDistanceToNow } from 'date-fns';

interface RecentAppsProps {
  maxItems?: number;
  onWebsiteSelect: (websiteId: string) => void;
  refreshTrigger?: number; // For forcing refresh after creation
}

export function RecentApps({ 
  maxItems = 12, 
  onWebsiteSelect,
  refreshTrigger 
}: RecentAppsProps) {
  const [recentWebsites, setRecentWebsites] = useState<WebsiteMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const storageService = new WebsiteStorageService();
  
  useEffect(() => {
    loadRecentWebsites();
  }, [refreshTrigger]);
  
  const loadRecentWebsites = async () => {
    setIsLoading(true);
    try {
      const websites = await storageService.listWebsites();
      
      // Sort by lastModified date, most recent first
      const sorted = websites.sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      
      setRecentWebsites(sorted);
    } catch (error) {
      console.error('Failed to load recent websites:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const displayedWebsites = showAll 
    ? recentWebsites 
    : recentWebsites.slice(0, maxItems);
  
  if (isLoading) {
    return <RecentAppsSkeleton />;
  }
  
  if (recentWebsites.length === 0) {
    return <EmptyRecentApps />;
  }
  
  return (
    <div className="recent-apps-section">
      <div className="section-header">
        <h2 className="text-2xl font-semibold">Recent Projects</h2>
        {recentWebsites.length > maxItems && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-blue-600 hover:text-blue-700"
          >
            {showAll ? 'Show Less' : `View All (${recentWebsites.length})`}
          </button>
        )}
      </div>
      
      <div className="recent-apps-grid">
        {displayedWebsites.map(website => (
          <WebsiteCard
            key={website.id}
            website={website}
            onClick={() => onWebsiteSelect(website.id)}
            lastModifiedText={formatDistanceToNow(new Date(website.lastModified), { 
              addSuffix: true 
            })}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. Website Card Component
**Location**: `components/dashboard/website-card.tsx`

```typescript
interface WebsiteCardProps {
  website: WebsiteMetadata;
  onClick: () => void;
  lastModifiedText: string;
  isSelected?: boolean;
}

export function WebsiteCard({ 
  website, 
  onClick, 
  lastModifiedText,
  isSelected = false 
}: WebsiteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const getWebsiteIcon = () => {
    if (website.icon && !imageError) {
      return website.icon;
    }
    
    // Generate fallback icon based on category or name
    const firstLetter = website.name?.charAt(0)?.toUpperCase() || 'W';
    const colors = {
      crm: 'bg-blue-500',
      ecommerce: 'bg-green-500',
      education: 'bg-purple-500',
      portfolio: 'bg-gray-700',
      saas: 'bg-indigo-500',
      default: 'bg-gray-500'
    };
    
    const bgColor = colors[website.category || 'default'];
    
    return (
      <div className={`${bgColor} w-full h-full flex items-center justify-center text-white text-2xl font-bold`}>
        {firstLetter}
      </div>
    );
  };
  
  return (
    <div
      className={`
        website-card 
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isHovered ? 'shadow-lg transform -translate-y-1' : 'shadow-md'}
        transition-all duration-200 cursor-pointer
        bg-white rounded-lg overflow-hidden
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Open ${website.name}`}
    >
      <div className="aspect-video bg-gray-100 relative">
        {typeof website.icon === 'string' ? (
          <img
            src={website.icon}
            alt={`${website.name} preview`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          getWebsiteIcon()
        )}
        
        {website.category && (
          <span className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {website.category}
          </span>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg truncate" title={website.name}>
          {website.name}
        </h3>
        
        {website.description && (
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {website.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <span>{lastModifiedText}</span>
          {website.storageQuota && (
            <span>{formatBytes(website.storageQuota)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 3. Empty State Component
**Location**: `components/dashboard/empty-recent-apps.tsx`

```typescript
export function EmptyRecentApps() {
  return (
    <div className="empty-recent-apps text-center py-12">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
        <FolderOpenIcon className="w-10 h-10 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No projects yet
      </h3>
      
      <p className="text-gray-500 max-w-md mx-auto">
        Create your first website using the prompt above, or select a category to get started quickly.
      </p>
    </div>
  );
}
```

### 4. Skeleton Loading Component
**Location**: `components/dashboard/recent-apps-skeleton.tsx`

```typescript
export function RecentAppsSkeleton() {
  return (
    <div className="recent-apps-section">
      <div className="section-header mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="recent-apps-grid">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="website-card-skeleton bg-white rounded-lg overflow-hidden shadow-md">
            <div className="aspect-video bg-gray-200 animate-pulse" />
            <div className="p-4">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-full mb-3 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Dashboard Integration
**Location**: `app/dashboard/page.tsx` (Update)

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AIPromptSection } from '@/components/dashboard/ai-prompt-section';
import { RecentApps } from '@/components/dashboard/recent-apps';
import { WebsiteGrid } from '@/components/dashboard/website-grid';

export default function Dashboard() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'recent' | 'all'>('recent');
  
  const handleWebsiteCreated = (websiteId: string) => {
    // Trigger refresh of recent apps
    setRefreshTrigger(prev => prev + 1);
    
    // Navigate to studio
    router.push(`/studio/${websiteId}/ai`);
  };
  
  const handleWebsiteSelect = (websiteId: string) => {
    router.push(`/studio/${websiteId}`);
  };
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="text-4xl font-bold">Catalyst Studio</h1>
        <p className="text-gray-600 mt-2">Build amazing websites with AI</p>
      </div>
      
      <AIPromptSection onWebsiteCreated={handleWebsiteCreated} />
      
      <div className="dashboard-content mt-12">
        <div className="view-toggle mb-6">
          <button
            onClick={() => setViewMode('recent')}
            className={`px-4 py-2 ${viewMode === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Recent
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            All Projects
          </button>
        </div>
        
        {viewMode === 'recent' ? (
          <RecentApps
            maxItems={12}
            onWebsiteSelect={handleWebsiteSelect}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <WebsiteGrid
            onWebsiteSelect={handleWebsiteSelect}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>
    </div>
  );
}
```

### 6. Utility Functions
**Location**: `lib/utils/format.ts`

```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}
```

## Acceptance Criteria

### AC1: Recent Apps Display ✓
- [ ] Recent Apps section displays below AI prompt
- [ ] Shows up to 12 most recent websites by default
- [ ] Sorted by last modified date (newest first)
- [ ] Each card shows name, icon/thumbnail, description
- [ ] Last modified shown as relative time (e.g., "2 hours ago")

### AC2: Website Card Interaction ✓
- [ ] Cards are clickable and navigate to `/studio/{id}`
- [ ] Hover effect provides visual feedback
- [ ] Keyboard navigation supported (Tab + Enter)
- [ ] Selected state visible when appropriate
- [ ] Fallback icon when image not available

### AC3: View All Functionality ✓
- [ ] "View All" button appears when >12 websites exist
- [ ] Clicking expands to show all websites
- [ ] "Show Less" option to collapse back
- [ ] Smooth animation for expand/collapse
- [ ] Count shown in button text

### AC4: Empty State ✓
- [ ] Friendly message when no websites exist
- [ ] Visual icon to enhance empty state
- [ ] Guidance text directing to create first website
- [ ] Consistent with overall design language

### AC5: Real-time Updates ✓
- [ ] List updates immediately after website creation
- [ ] Deleted websites removed from display
- [ ] No page refresh required for updates
- [ ] Loading skeleton during data fetch
- [ ] Error handling for failed loads

## Integration Verification

### IV1: Storage Service Integration
- [ ] Correctly fetches websites from WebsiteStorageService
- [ ] Handles storage service errors gracefully
- [ ] Respects storage quota information
- [ ] Maintains data consistency

### IV2: Navigation Flow
- [ ] Clicking website loads correct context in studio
- [ ] Browser history properly maintained
- [ ] Deep linking works correctly
- [ ] No context loss during navigation

### IV3: Dashboard Cohesion
- [ ] Integrates seamlessly with AI prompt section
- [ ] Consistent styling with dashboard
- [ ] Responsive grid layout
- [ ] Performance with 50+ websites

## Implementation Steps

### Step 1: Create Recent Apps Component
1. Build RecentApps container component
2. Implement data fetching from storage
3. Add sorting and filtering logic
4. Handle loading and error states

### Step 2: Build Website Card
1. Create card component with all metadata
2. Add hover and interaction states
3. Implement fallback icon system
4. Add accessibility attributes

### Step 3: Empty and Loading States
1. Design empty state component
2. Create skeleton loader
3. Add animations and transitions
4. Ensure consistent styling

### Step 4: Dashboard Integration
1. Update dashboard page layout
2. Add view mode toggle
3. Connect refresh triggers
4. Wire up navigation

### Step 5: Testing and Polish
1. Test with various website counts
2. Verify real-time updates
3. Check responsive behavior
4. Performance optimization

## Testing Requirements

### Unit Tests
- [ ] RecentApps component logic
- [ ] Sorting and filtering functions
- [ ] Date formatting utilities
- [ ] Card interaction handlers

### Integration Tests
- [ ] Storage service integration
- [ ] Navigation to studio
- [ ] Real-time update flow
- [ ] View mode switching

### E2E Tests
- [ ] Complete recent apps interaction
- [ ] Website selection and navigation
- [ ] Empty state to populated state
- [ ] View all expansion

### Performance Tests
- [ ] Load time with 50+ websites
- [ ] Smooth scrolling performance
- [ ] Memory usage with large lists
- [ ] Animation frame rates

## Dependencies
- Story 3.1 (Storage) - Required for data
- Story 3.2 (Routing) - Required for navigation
- Story 3.3 (Dashboard) - Required for layout
- Story 3.4 (AI Creation) - For refresh triggers
- date-fns library for date formatting

## Risks and Mitigations

1. **Risk**: Performance with many websites
   - **Mitigation**: Virtual scrolling for large lists
   
2. **Risk**: Stale data after changes
   - **Mitigation**: Refresh triggers and polling
   
3. **Risk**: Image loading performance
   - **Mitigation**: Lazy loading and fallbacks

4. **Risk**: Memory leaks from subscriptions
   - **Mitigation**: Proper cleanup in useEffect

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>85% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] QA sign-off

## Notes for Developer
- Use React.memo for card components to prevent unnecessary re-renders
- Implement intersection observer for lazy loading if >50 websites
- Consider adding search/filter functionality in future iteration
- Ensure consistent card heights for clean grid layout
- Add telemetry for usage patterns
- Consider implementing drag-and-drop for favorites

## QA Focus Areas
- Test with 0, 1, 12, 13, 50+ websites
- Verify sorting accuracy
- Check navigation from different card states
- Test keyboard navigation completely
- Verify responsive breakpoints
- Test with long website names
- Check error recovery scenarios
- Validate real-time update timing

---
*Story prepared by Bob, Scrum Master*
*Ready for implementation by AI Developer*