# Story 3.6: Testing, Documentation, and Feature Flag

## Story Metadata
- **Epic**: Epic 3 - Multi-Website Support Enhancement
- **Story ID**: 3.6
- **Branch**: `feature/epic-3-story-3.6-testing-docs`
- **Estimated Points**: 8
- **Priority**: P0 (Critical - Required for Production)
- **Dependencies**: Stories 3.1-3.5 must be complete

## User Story
As a **developer**,  
I want **comprehensive testing and documentation for multi-website support**,  
so that **the feature can be safely deployed and maintained**.

## Context from PRD
This final story ensures production readiness through comprehensive testing, documentation, and feature flag implementation. It provides the safety net for gradual rollout, enables quick rollback if issues arise, and ensures future maintainability. This story is critical for risk mitigation and represents the difference between a prototype and production-ready software.

## Technical Requirements

### 1. Feature Flag System
**Location**: `lib/features/feature-flags.ts`

```typescript
import { cookies } from 'next/headers';

export enum FeatureFlag {
  MULTI_WEBSITE_SUPPORT = 'multi_website_support',
  AI_WEBSITE_CREATION = 'ai_website_creation',
  DASHBOARD_VIEW = 'dashboard_view'
}

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage: number;
  allowedUsers?: string[];
  blockedUsers?: string[];
  startDate?: Date;
  endDate?: Date;
  description: string;
}

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<FeatureFlag, FeatureFlagConfig>;
  
  private constructor() {
    this.flags = new Map([
      [FeatureFlag.MULTI_WEBSITE_SUPPORT, {
        enabled: process.env.NEXT_PUBLIC_MULTI_WEBSITE === 'true',
        rolloutPercentage: parseInt(process.env.NEXT_PUBLIC_ROLLOUT_PERCENTAGE || '0'),
        description: 'Enables multi-website management capabilities',
        startDate: new Date('2025-02-01'),
        allowedUsers: process.env.NEXT_PUBLIC_BETA_USERS?.split(',') || []
      }],
      [FeatureFlag.AI_WEBSITE_CREATION, {
        enabled: process.env.NEXT_PUBLIC_AI_CREATION === 'true',
        rolloutPercentage: 100,
        description: 'AI-powered website creation from natural language'
      }],
      [FeatureFlag.DASHBOARD_VIEW, {
        enabled: process.env.NEXT_PUBLIC_DASHBOARD === 'true',
        rolloutPercentage: 100,
        description: 'New dashboard interface for website management'
      }]
    ]);
  }
  
  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }
  
  isEnabled(flag: FeatureFlag, userId?: string): boolean {
    const config = this.flags.get(flag);
    if (!config || !config.enabled) return false;
    
    // Check date range
    const now = new Date();
    if (config.startDate && now < config.startDate) return false;
    if (config.endDate && now > config.endDate) return false;
    
    // Check user allowlist/blocklist
    if (userId) {
      if (config.blockedUsers?.includes(userId)) return false;
      if (config.allowedUsers?.length && config.allowedUsers.includes(userId)) return true;
    }
    
    // Check rollout percentage
    if (config.rolloutPercentage < 100) {
      const hash = this.hashUserId(userId || 'anonymous');
      return (hash % 100) < config.rolloutPercentage;
    }
    
    return true;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Admin functions
  setFlag(flag: FeatureFlag, config: Partial<FeatureFlagConfig>): void {
    const existing = this.flags.get(flag);
    if (existing) {
      this.flags.set(flag, { ...existing, ...config });
    }
  }
  
  getAllFlags(): Map<FeatureFlag, FeatureFlagConfig> {
    return new Map(this.flags);
  }
}

// React Hook
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    // Get user ID from session/context
    const userId = getUserId(); // Implementation depends on auth system
    const service = FeatureFlagService.getInstance();
    setIsEnabled(service.isEnabled(flag, userId));
  }, [flag]);
  
  return isEnabled;
}
```

### 2. Conditional Routing Based on Feature Flags
**Location**: `app/page.tsx` (Root route)

```typescript
import { redirect } from 'next/navigation';
import { FeatureFlagService, FeatureFlag } from '@/lib/features/feature-flags';

export default function RootPage() {
  const flagService = FeatureFlagService.getInstance();
  const multiWebsiteEnabled = flagService.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT);
  const dashboardEnabled = flagService.isEnabled(FeatureFlag.DASHBOARD_VIEW);
  
  if (multiWebsiteEnabled && dashboardEnabled) {
    // New multi-website experience
    redirect('/dashboard');
  } else {
    // Legacy single-website experience
    redirect('/studio');
  }
}
```

### 3. Comprehensive Unit Tests
**Location**: `__tests__/epic-3/`

```typescript
// __tests__/epic-3/storage.test.ts
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';

describe('WebsiteStorageService', () => {
  let service: WebsiteStorageService;
  
  beforeEach(() => {
    service = new WebsiteStorageService();
  });
  
  describe('Multi-Website Operations', () => {
    test('should create multiple websites with unique IDs', async () => {
      const website1 = await service.createWebsite({ name: 'Site 1' });
      const website2 = await service.createWebsite({ name: 'Site 2' });
      
      expect(website1).not.toBe(website2);
      
      const websites = await service.listWebsites();
      expect(websites).toHaveLength(2);
    });
    
    test('should isolate data between websites', async () => {
      const id1 = await service.createWebsite({ name: 'Site 1' });
      const id2 = await service.createWebsite({ name: 'Site 2' });
      
      await service.saveWebsiteData(id1, { content: 'Content 1' });
      await service.saveWebsiteData(id2, { content: 'Content 2' });
      
      const data1 = await service.getWebsiteData(id1);
      const data2 = await service.getWebsiteData(id2);
      
      expect(data1.content).toBe('Content 1');
      expect(data2.content).toBe('Content 2');
    });
    
    test('should handle storage quota warnings', async () => {
      const quotaStatus = await service.checkStorageQuota();
      expect(quotaStatus).toHaveProperty('usage');
      expect(quotaStatus).toHaveProperty('quota');
      expect(quotaStatus).toHaveProperty('percentage');
    });
  });
  
  describe('Migration', () => {
    test('should migrate single-website data', async () => {
      // Setup legacy data
      localStorage.setItem('catalyst_website', JSON.stringify({
        name: 'Legacy Site',
        content: 'Legacy Content'
      }));
      
      await service.migrateFromSingleWebsite();
      
      const websites = await service.listWebsites();
      expect(websites).toHaveLength(1);
      expect(websites[0].id).toBe('default');
      expect(websites[0].name).toBe('Legacy Site');
    });
  });
});
```

### 4. E2E Test Suite
**Location**: `e2e/epic-3/multi-website.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Multi-Website Support', () => {
  test.beforeEach(async ({ page }) => {
    // Enable feature flags
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({
        multi_website_support: true,
        dashboard_view: true,
        ai_website_creation: true
      }));
    });
  });
  
  test('Complete multi-website user flow', async ({ page }) => {
    // 1. Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Catalyst Studio/);
    
    // 2. Create website via AI prompt
    const promptInput = page.locator('textarea[placeholder*="Describe your website"]');
    await promptInput.fill('A portfolio website for a photographer');
    
    await page.click('button:has-text("Create Website")');
    
    // 3. Wait for navigation to studio
    await page.waitForURL(/\/studio\/[^\/]+\/ai/);
    
    // 4. Verify context loaded
    const aiPanel = page.locator('.ai-panel');
    await expect(aiPanel).toContainText('portfolio website');
    
    // 5. Navigate back to dashboard
    await page.goto('/dashboard');
    
    // 6. Verify website appears in recent apps
    const recentApps = page.locator('.recent-apps-grid');
    await expect(recentApps).toContainText('portfolio');
    
    // 7. Click to open website
    await page.click('.website-card:first-child');
    await page.waitForURL(/\/studio\/[^\/]+$/);
    
    // 8. Verify correct website loaded
    const header = page.locator('h1');
    await expect(header).toContainText('portfolio');
  });
  
  test('Website isolation', async ({ page }) => {
    // Create two websites
    await page.goto('/dashboard');
    
    // Website 1
    await page.fill('textarea', 'E-commerce store');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    const url1 = page.url();
    
    // Website 2
    await page.goto('/dashboard');
    await page.fill('textarea', 'Blog platform');
    await page.click('button:has-text("Create")');
    await page.waitForURL(/\/studio\//);
    const url2 = page.url();
    
    // Verify different IDs
    expect(url1).not.toBe(url2);
    
    // Verify data isolation
    await page.goto(url1);
    await expect(page.locator('h1')).toContainText('E-commerce');
    
    await page.goto(url2);
    await expect(page.locator('h1')).toContainText('Blog');
  });
  
  test('Feature flag disabled experience', async ({ page }) => {
    // Disable feature flags
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({
        multi_website_support: false
      }));
    });
    
    await page.goto('/');
    
    // Should redirect to legacy studio
    await expect(page).toHaveURL('/studio');
    
    // No dashboard link visible
    await expect(page.locator('a[href="/dashboard"]')).toHaveCount(0);
  });
});
```

### 5. Migration Documentation
**Location**: `docs/migration-guide.md`

```markdown
# Multi-Website Support Migration Guide

## Overview
This guide helps you migrate from single-website to multi-website mode in Catalyst Studio.

## Prerequisites
- Catalyst Studio version 2.0.0 or higher
- Backup of your current website data
- Node.js 18+ installed

## Migration Steps

### 1. Enable Feature Flags
Add to your `.env.local`:
```bash
NEXT_PUBLIC_MULTI_WEBSITE=true
NEXT_PUBLIC_DASHBOARD=true
NEXT_PUBLIC_AI_CREATION=true
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=100
```

### 2. Run Migration Script
```bash
npm run migrate:multi-website
```

This script will:
- Backup your existing data to `backups/`
- Create a "default" website with your current data
- Update storage schema to support multiple websites
- Verify data integrity

### 3. Verify Migration
1. Navigate to `/dashboard`
2. Check your existing website appears as "default"
3. Open the website and verify all data is intact
4. Create a new test website to verify multi-website works

## Rollback Instructions
If issues occur:

```bash
npm run migrate:rollback
```

Or manually:
1. Set `NEXT_PUBLIC_MULTI_WEBSITE=false`
2. Navigate to `/studio` (legacy mode)
3. Your original data remains accessible

## Gradual Rollout
For production environments:

### Phase 1: Internal Testing (Week 1)
```bash
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=0
NEXT_PUBLIC_BETA_USERS=user1@example.com,user2@example.com
```

### Phase 2: Beta Users (Week 2)
```bash
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=10
```

### Phase 3: General Availability (Week 3)
```bash
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=100
```

## Troubleshooting

### Storage Quota Exceeded
- Clear unused websites: Settings → Storage → Clean Up
- Export and archive old projects
- Increase browser storage limits

### Website Not Loading
- Check browser console for errors
- Verify website ID in URL is valid
- Clear browser cache and reload

### Migration Fails
- Check `logs/migration.log` for errors
- Ensure sufficient storage space
- Try migration in incognito mode

## API Changes

### Before (Single Website)
```javascript
// Old API
const data = await getWebsiteData();
await saveWebsiteData(data);
```

### After (Multi Website)
```javascript
// New API
const data = await getWebsiteData(websiteId);
await saveWebsiteData(websiteId, data);
```

## Support
- GitHub Issues: https://github.com/catalyst-studio/issues
- Discord: https://discord.gg/catalyst
- Email: support@catalyst.studio
```

### 6. Developer Documentation
**Location**: `docs/architecture/multi-website.md`

```markdown
# Multi-Website Architecture

## System Design
[Architecture diagram and detailed technical documentation]

## Component Structure
- Dashboard Components
- WebsiteContext Provider
- Storage Service Layer
- Feature Flag System

## Testing Strategy
- Unit Test Coverage: 90%+
- Integration Tests: All critical paths
- E2E Tests: User flows
- Performance Tests: Load testing

## Deployment Strategy
- Feature flags for gradual rollout
- Monitoring and alerting
- Rollback procedures
- Performance metrics
```

## Acceptance Criteria

### AC1: Feature Flag System ✓
- [ ] Feature flag service implemented with rollout controls
- [ ] Percentage-based rollout functionality
- [ ] User allowlist/blocklist support
- [ ] Date range activation
- [ ] React hook for component integration

### AC2: Unit Test Coverage ✓
- [ ] Storage service tests >90% coverage
- [ ] Context provider tests complete
- [ ] Routing logic tests
- [ ] AI prompt processing tests
- [ ] Dashboard component tests

### AC3: E2E Test Suite ✓
- [ ] Complete user flow from dashboard to studio
- [ ] Multi-website creation and switching
- [ ] Data isolation verification
- [ ] Feature flag toggle testing
- [ ] Migration flow testing

### AC4: Documentation ✓
- [ ] Migration guide for users
- [ ] Developer architecture documentation
- [ ] API change documentation
- [ ] Troubleshooting guide
- [ ] Rollback procedures

### AC5: Migration Tools ✓
- [ ] Automated migration script
- [ ] Backup functionality before migration
- [ ] Data integrity verification
- [ ] Rollback capability
- [ ] Progress reporting

## Integration Verification

### IV1: Feature Flag Integration
- [ ] All new features respect flag settings
- [ ] Graceful fallback to legacy mode
- [ ] No breaking changes when disabled
- [ ] Admin controls functional

### IV2: Test Suite Execution
- [ ] All existing tests continue passing
- [ ] New tests integrated into CI/CD
- [ ] Performance benchmarks met
- [ ] Coverage reports generated

### IV3: Documentation Accessibility
- [ ] Docs accessible from application
- [ ] Searchable and indexed
- [ ] Version-specific documentation
- [ ] Examples and code snippets work

## Implementation Steps

### Step 1: Feature Flag System
1. Create feature flag service
2. Implement rollout logic
3. Add React hooks
4. Integrate with routing

### Step 2: Unit Test Suite
1. Storage service tests
2. Context provider tests
3. Component tests
4. Integration tests

### Step 3: E2E Tests
1. Setup Playwright configuration
2. Write user flow tests
3. Data isolation tests
4. Performance tests

### Step 4: Documentation
1. Write migration guide
2. Create architecture docs
3. API documentation
4. Troubleshooting guide

### Step 5: Migration Tools
1. Create backup scripts
2. Migration automation
3. Verification tools
4. Rollback procedures

## Testing Requirements

### Unit Tests
- [ ] Feature flag service
- [ ] All new components
- [ ] Storage operations
- [ ] Context switching
- [ ] Migration logic

### Integration Tests
- [ ] Flag + routing integration
- [ ] Storage + context integration
- [ ] Dashboard + studio flow
- [ ] Migration process

### E2E Tests
- [ ] Complete user journeys
- [ ] Feature flag scenarios
- [ ] Performance under load
- [ ] Error recovery

### Performance Tests
- [ ] Dashboard load with 50+ websites
- [ ] Context switching speed
- [ ] Storage operation timing
- [ ] Memory usage patterns

## Dependencies
- All previous stories (3.1-3.5) complete
- Playwright for E2E testing
- Documentation tooling
- CI/CD pipeline updates

## Risks and Mitigations

1. **Risk**: Feature flag complexity
   - **Mitigation**: Simple percentage-based rollout initially
   
2. **Risk**: Test flakiness
   - **Mitigation**: Retry logic and stable selectors
   
3. **Risk**: Documentation drift
   - **Mitigation**: Automated doc generation where possible

4. **Risk**: Migration failures
   - **Mitigation**: Comprehensive backup and rollback

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests passing (>90% coverage)
- [ ] E2E tests passing
- [ ] Documentation complete and reviewed
- [ ] Migration tested with production-like data
- [ ] Feature flags tested in all states
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Code reviewed and approved
- [ ] QA sign-off

## Notes for Developer
- Use existing test patterns from the codebase
- Ensure feature flags are checked at component level
- Document any breaking changes clearly
- Add telemetry for feature flag usage
- Consider A/B testing infrastructure
- Implement proper logging for debugging

## QA Focus Areas
- Test all feature flag combinations
- Verify migration with various data sizes
- Test rollback procedures thoroughly
- Check documentation accuracy
- Validate performance metrics
- Test error scenarios and recovery
- Verify no regression in legacy mode

---
*Story prepared by Bob, Scrum Master*
*Ready for implementation by AI Developer*