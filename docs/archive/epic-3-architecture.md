# 🏗️ CATALYST STUDIO - BROWNFIELD ARCHITECTURE
*Multi-Website Support Enhancement (Epic 3)*

---

## Executive Summary

This brownfield architecture transforms Catalyst Studio from a single-website tool into a comprehensive multi-website management platform. The design prioritizes minimal disruption to existing functionality while enabling powerful new capabilities through ID-based routing, browser storage partitioning, and AI-powered website creation.

**Key Architecture Decisions:**
- Extend (not replace) existing architecture patterns
- Browser-first storage strategy with IndexedDB partitioning
- Context-based state management for website isolation
- Progressive enhancement approach with feature flags
- Zero server-side changes required

---

## Current State Analysis

### Technology Stack Assessment

**Frontend Foundation:**
- **Framework**: Next.js 15.4.5 with React 19.1.0
- **UI Components**: Radix UI primitives + custom component library
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: Zustand for global state
- **Type Safety**: TypeScript with strict mode
- **Build System**: Turbopack for development

**Data Layer:**
- **Storage**: Browser-based (IndexedDB/localStorage)
- **AI Integration**: OpenRouter + AI SDK
- **Form Management**: React Hook Form with Zod validation

**Infrastructure:**
- **Development**: Local development server (port 3001)
- **Testing**: Jest + Playwright for E2E
- **Monitoring**: Custom monitoring.ts utility

### Architecture Patterns Identified

1. **App Router Pattern** - Using Next.js 15 app directory structure
2. **Component-First Design** - Atomic design with UI primitives
3. **Context Providers** - Already using ProjectContext for state
4. **Feature-Based Organization** - Clear separation of concerns
5. **Type-Safe Boundaries** - Zod schemas at data boundaries

---

## Target Architecture Overview

### System Components Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Dashboard          │  Studio/{id}        │  AI Panel       │
│  ┌──────────────┐  │  ┌───────────────┐ │  ┌────────────┐ │
│  │ Website Grid │  │  │ Context-Aware │ │  │ Prompt     │ │
│  │ AI Prompt    │  │  │ Studio        │ │  │ Processing │ │
│  │ Quick Tags   │  │  │ Components    │ │  │ Engine     │ │
│  └──────────────┘  │  └───────────────┘ │  └────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      STATE MANAGEMENT                        │
├─────────────────────────────────────────────────────────────┤
│  WebsiteContext     │  Zustand Stores    │  Feature Flags  │
│  ┌──────────────┐  │  ┌───────────────┐ │  ┌────────────┐ │
│  │ ID Provider  │  │  │ Global State  │ │  │ Multi-Site │ │
│  │ Data Loader  │  │  │ UI State      │ │  │ Toggle     │ │
│  │ Isolation    │  │  │ Cache         │ │  │ Migration  │ │
│  └──────────────┘  │  └───────────────┘ │  └────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Browser Storage    │  AI Services       │  Monitoring      │
│  ┌──────────────┐  │  ┌───────────────┐ │  ┌────────────┐ │
│  │ IndexedDB    │  │  │ OpenRouter    │ │  │ Analytics  │ │
│  │ Partitioned  │  │  │ Prompt Cache  │ │  │ Quotas     │ │
│  │ Migration    │  │  │ Context       │ │  │ Telemetry  │ │
│  └──────────────┘  │  └───────────────┘ │  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action → Dashboard
    ↓
AI Prompt Submission
    ↓
Website Creation Service
    ↓
IndexedDB (Partitioned Storage)
    ↓
Navigation to /studio/{id}
    ↓
WebsiteContext Initialization
    ↓
Studio Component Rendering
    ↓
Context-Aware Operations
```

---

## Detailed Component Architecture

### 1. Browser Storage Layer

**Storage Schema Design:**

```typescript
interface StorageArchitecture {
  // Global metadata
  "catalyst_global": {
    version: string;
    websites: WebsiteMetadata[];
    settings: GlobalSettings;
  };
  
  // Per-website partitioned data
  "website_{id}_config": WebsiteConfig;
  "website_{id}_content": ContentData;
  "website_{id}_assets": AssetReferences;
  "website_{id}_ai_context": AIContext;
}

interface WebsiteMetadata {
  id: string;
  name: string;
  icon?: string;
  createdAt: Date;
  lastModified: Date;
  storageQuota: number;
  category?: string;
}
```

**Storage Service Architecture:**

```typescript
// lib/storage/website-storage.service.ts
class WebsiteStorageService {
  private db: IDBDatabase;
  private quotaMonitor: QuotaMonitor;
  
  // Partitioned operations
  async getWebsiteData(websiteId: string): Promise<WebsiteData>;
  async saveWebsiteData(websiteId: string, data: Partial<WebsiteData>): Promise<void>;
  
  // Migration utilities
  async migrateFromSingleWebsite(): Promise<void>;
  async exportWebsite(websiteId: string): Promise<Blob>;
  
  // Quota management
  async checkStorageQuota(): Promise<StorageQuota>;
  async cleanupOldData(websiteId: string): Promise<void>;
}
```

### 2. Routing Architecture

**Route Structure:**

```
/dashboard                    → Dashboard with AI prompt
/studio/{id}                  → Website-specific studio
/studio/{id}/ai              → AI panel with context
/studio/{id}/content         → Content management
/studio/{id}/preview         → Preview with website context
/studio/{id}/settings        → Website-specific settings
```

**Dynamic Route Implementation:**

```typescript
// app/studio/[id]/layout.tsx
export default function StudioLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <WebsiteContextProvider websiteId={params.id}>
      <StudioShell>
        {children}
      </StudioShell>
    </WebsiteContextProvider>
  );
}
```

### 3. Context Management Architecture

**WebsiteContext Design:**

```typescript
// lib/context/website-context.tsx
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

export function WebsiteContextProvider({
  websiteId,
  children
}: {
  websiteId: string;
  children: React.ReactNode;
}) {
  // Load website data from partitioned storage
  // Provide isolated context to all children
  // Handle state synchronization
}
```

### 4. Dashboard Architecture

**Component Structure:**

```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  return (
    <DashboardLayout>
      <AIPromptSection />
      <QuickCategoryTags />
      <WebsiteGrid />
      <RecentWebsites />
    </DashboardLayout>
  );
}

// components/dashboard/ai-prompt.tsx
function AIPromptSection() {
  // "What would you build today?" interface
  // Natural language processing
  // Website creation flow
}

// components/dashboard/website-grid.tsx
function WebsiteGrid() {
  // Card-based layout
  // Virtualized rendering for performance
  // Click navigation to /studio/{id}
}
```

### 5. AI Integration Architecture

**Prompt Flow:**

```typescript
interface AIWebsiteCreation {
  // Step 1: User enters prompt in dashboard
  prompt: string;
  
  // Step 2: Process and enhance prompt
  processedPrompt: {
    websiteName: string;
    description: string;
    category: string;
    suggestedFeatures: string[];
  };
  
  // Step 3: Create website entry
  websiteId: string;
  
  // Step 4: Pass to AI panel
  navigation: {
    url: `/studio/${websiteId}/ai`;
    context: ProcessedPrompt;
  };
}
```

---

## Migration Strategy

### Phase 1: Foundation (Story 1.1 & 1.2)
```
Week 1-2:
├── Implement storage service with partitioning
├── Add website metadata schema
├── Create migration utilities
└── Add ID-based routing to studio
```

### Phase 2: Dashboard (Story 1.3 & 1.4)
```
Week 3-4:
├── Build dashboard layout and components
├── Implement AI prompt interface
├── Add website creation flow
└── Connect to storage service
```

### Phase 3: Integration (Story 1.5 & 1.6)
```
Week 5-6:
├── Complete recent apps functionality
├── Add comprehensive testing
├── Implement feature flags
└── Documentation and migration guide
```

---

## Technical Implementation Details

### Performance Optimizations

1. **Virtual Scrolling** for website grid (50+ websites)
2. **Lazy Loading** for studio components
3. **IndexedDB Transactions** batched for efficiency
4. **React.memo** for expensive components
5. **Debounced** storage operations

### Security Considerations

```typescript
// Security measures
const securityMeasures = {
  // ID validation
  validateWebsiteId: (id: string) => {
    return /^[a-zA-Z0-9-_]+$/.test(id);
  },
  
  // Storage isolation
  enforcePartitioning: true,
  
  // XSS prevention
  sanitizePrompts: true,
  
  // CSRF protection
  validateOrigin: true
};
```

### Monitoring & Analytics

```typescript
// Enhanced monitoring for multi-website
interface MonitoringEnhancements {
  // Track per-website metrics
  websiteMetrics: {
    storageUsage: number;
    lastAccessed: Date;
    operationCount: number;
  };
  
  // Dashboard analytics
  dashboardMetrics: {
    websiteCount: number;
    aiPromptsUsed: number;
    switchingTime: number;
  };
  
  // Performance tracking
  performanceMetrics: {
    dashboardLoadTime: number;
    studioSwitchTime: number;
    storageOperationTime: number;
  };
}
```

---

## Risk Mitigation Architecture

### Storage Quota Management

```typescript
class StorageQuotaManager {
  private readonly WARNING_THRESHOLD = 0.8; // 80%
  private readonly CRITICAL_THRESHOLD = 0.95; // 95%
  
  async checkQuota(): Promise<QuotaStatus> {
    const { usage, quota } = await navigator.storage.estimate();
    
    if (usage / quota > this.CRITICAL_THRESHOLD) {
      return { level: 'critical', action: 'cleanup-required' };
    }
    
    if (usage / quota > this.WARNING_THRESHOLD) {
      return { level: 'warning', action: 'suggest-cleanup' };
    }
    
    return { level: 'ok', action: 'none' };
  }
}
```

### Feature Flag System

```typescript
// lib/features/flags.ts
export const featureFlags = {
  multiWebsiteSupport: {
    enabled: process.env.NEXT_PUBLIC_MULTI_WEBSITE === 'true',
    rolloutPercentage: 100,
    
    // Gradual rollout
    isEnabledForUser: (userId: string) => {
      if (!featureFlags.multiWebsiteSupport.enabled) return false;
      
      // Check rollout percentage
      const hash = hashUserId(userId);
      return hash % 100 < featureFlags.multiWebsiteSupport.rolloutPercentage;
    }
  }
};
```

---

## API Contract Specifications

### Dashboard API

```typescript
// No server API needed - all browser-based
interface DashboardOperations {
  // Client-side only
  listWebsites(): Promise<WebsiteMetadata[]>;
  createWebsite(prompt: string): Promise<string>; // returns ID
  deleteWebsite(id: string): Promise<void>;
  getWebsiteStats(id: string): Promise<WebsiteStats>;
}
```

### Studio Context API

```typescript
interface StudioContextAPI {
  // Context-aware operations
  loadWebsite(id: string): Promise<WebsiteData>;
  saveWebsite(id: string, data: Partial<WebsiteData>): Promise<void>;
  
  // Maintains existing studio API compatibility
  // All existing endpoints work with optional ID parameter
}
```

---

## Testing Strategy

### Unit Testing Architecture

```typescript
// tests/unit/storage.test.ts
describe('WebsiteStorageService', () => {
  test('partitions data by website ID');
  test('migrates single-website data');
  test('enforces quota limits');
  test('handles concurrent operations');
});

// tests/unit/context.test.ts
describe('WebsiteContext', () => {
  test('isolates website data');
  test('switches contexts cleanly');
  test('handles missing websites');
});
```

### E2E Testing Scenarios

```typescript
// tests/e2e/multi-website.spec.ts
test('Complete multi-website flow', async ({ page }) => {
  // 1. Create website via AI prompt
  // 2. Navigate to studio
  // 3. Make changes
  // 4. Return to dashboard
  // 5. Create second website
  // 6. Verify isolation
});
```

---

## Deployment Architecture

### Feature Flag Rollout

```
Stage 1: Internal Testing (Week 1)
├── Enable for development team
├── Monitor performance metrics
└── Gather feedback

Stage 2: Beta Users (Week 2)
├── 10% rollout
├── Monitor storage usage
└── Track switching times

Stage 3: General Availability (Week 3)
├── 100% rollout
├── Migration support active
└── Documentation published
```

### Rollback Strategy

```typescript
// Instant rollback capability
if (criticalIssueDetected) {
  featureFlags.multiWebsiteSupport.enabled = false;
  // Single-website mode resumes immediately
  // No data loss - all websites remain in storage
}
```

---

## Success Metrics & Monitoring

### Key Performance Indicators

1. **Dashboard Load Time**: < 1.5s with 20 websites
2. **Context Switch Time**: < 3s between websites
3. **Storage Efficiency**: < 1MB per website average
4. **AI Prompt Success**: > 90% successful creations
5. **Zero Data Loss**: 100% data integrity maintained

### Monitoring Dashboard

```typescript
interface MonitoringDashboard {
  realtime: {
    activeWebsites: number;
    storageUsage: number;
    activeUsers: number;
  };
  
  performance: {
    p50LoadTime: number;
    p95LoadTime: number;
    errorRate: number;
  };
  
  usage: {
    websitesCreated: number;
    aiPromptsUsed: number;
    averageWebsitesPerUser: number;
  };
}
```

---

## Architecture Decisions Record (ADR)

### ADR-001: Browser Storage Over Server Database
**Decision**: Use IndexedDB for all website data
**Rationale**: 
- Zero server infrastructure changes required
- Instant performance for local operations
- Simplified deployment and rollback
- Privacy-first approach

### ADR-002: Context-Based State Management
**Decision**: Use React Context for website isolation
**Rationale**:
- Leverages existing ProjectContext pattern
- Clean component boundaries
- Server-side rendering compatible
- Simple testing approach

### ADR-003: Feature Flag for Rollout
**Decision**: Implement comprehensive feature flag system
**Rationale**:
- Risk mitigation for production
- Gradual rollout capability
- Instant rollback if needed
- A/B testing opportunity

---

## Next Steps

1. **Review & Approve** this architecture with the team
2. **Create Epic-3 branch** following gitflow
3. **Begin Story 1.1** - Storage Schema Extension
4. **Set up monitoring** for the new features
5. **Prepare migration** documentation

---

*Architecture prepared by Winston, your Holistic System Architect*
*Designed for pragmatic implementation with minimal disruption*