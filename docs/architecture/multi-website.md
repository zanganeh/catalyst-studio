# Multi-Website Architecture

## System Design

The multi-website support feature transforms Catalyst Studio from a single-website builder to a comprehensive platform supporting multiple isolated website projects. This document outlines the technical architecture, design decisions, and implementation details.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Dashboard   │───▶│Studio Routes │                  │
│  │     View      │    │  /studio/:id │                  │
│  └──────────────┘    └──────────────┘                  │
│           │                  │                          │
├───────────┼──────────────────┼──────────────────────────┤
│           ▼                  ▼                          │
│  ┌──────────────────────────────────┐                  │
│  │     WebsiteContext Provider      │                  │
│  │  - Current Website ID            │                  │
│  │  - Website Metadata              │                  │
│  │  - Context Switching             │                  │
│  └──────────────────────────────────┘                  │
│                     │                                   │
├─────────────────────┼────────────────────────────────────┤
│                     ▼                                   │
│  ┌──────────────────────────────────┐                  │
│  │   Website Storage Service        │                  │
│  │  - CRUD Operations               │                  │
│  │  - Data Isolation                │                  │
│  │  - Migration Support             │                  │
│  └──────────────────────────────────┘                  │
│                     │                                   │
├─────────────────────┼────────────────────────────────────┤
│                     ▼                                   │
│  ┌──────────────────────────────────┐                  │
│  │   Browser Storage (IndexedDB)    │                  │
│  │  - Website Metadata              │                  │
│  │  - Individual Website Data       │                  │
│  │  - Quota Management              │                  │
│  └──────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Component Structure

### 1. Dashboard Components
Located in `app/dashboard/`

- **DashboardLayout**: Main container providing navigation and layout
- **RecentAppsGrid**: Displays grid of recent websites with previews
- **AIPromptCard**: Interface for AI-powered website creation
- **WebsiteCard**: Individual website preview with metadata
- **StorageIndicator**: Shows storage usage and warnings

### 2. WebsiteContext Provider
Located in `lib/contexts/website-context.tsx`

Provides centralized state management for:
- Current website ID
- Website metadata
- Loading states
- Context switching operations

**Key Methods:**
```typescript
interface WebsiteContextValue {
  currentWebsiteId: string | null;
  currentWebsite: WebsiteMetadata | null;
  websites: WebsiteMetadata[];
  loading: boolean;
  switchWebsite: (id: string) => Promise<void>;
  createWebsite: (data: CreateWebsiteData) => Promise<string>;
  deleteWebsite: (id: string) => Promise<void>;
  refreshWebsites: () => Promise<void>;
}
```

### 3. Storage Service Layer
Located in `lib/storage/website-storage.service.ts`

Handles all storage operations with data isolation:

**Core Operations:**
- `createWebsite()`: Generate UUID, initialize metadata
- `listWebsites()`: Retrieve all website metadata
- `getWebsiteData()`: Load specific website data
- `saveWebsiteData()`: Persist website changes
- `deleteWebsite()`: Remove website and associated data
- `migrateFromSingleWebsite()`: Legacy data migration

**Storage Schema:**
```typescript
// Metadata storage
localStorage['catalyst_websites'] = WebsiteMetadata[]

// Individual website data
localStorage[`catalyst_website_${id}`] = WebsiteData

// Legacy single website (for migration)
localStorage['catalyst_website'] = LegacyWebsiteData
```

### 4. Feature Flag System
Located in `lib/features/feature-flags.ts`

Controls feature rollout and enables A/B testing:

**Features:**
- Percentage-based rollout
- User allowlist/blocklist
- Date range activation
- Environment-based configuration

**Configuration:**
```typescript
enum FeatureFlag {
  MULTI_WEBSITE_SUPPORT = 'multi_website_support',
  AI_WEBSITE_CREATION = 'ai_website_creation',
  DASHBOARD_VIEW = 'dashboard_view'
}
```

## Data Flow

### Website Creation Flow
1. User enters prompt in Dashboard
2. AI service processes prompt
3. Storage service creates website with UUID
4. Context updates with new website
5. Router navigates to `/studio/${id}/ai`
6. Studio loads with AI context

### Website Switching Flow
1. User clicks website in Dashboard
2. Context provider updates currentWebsiteId
3. Router navigates to `/studio/${id}`
4. Studio components reload with new context
5. Previous website state is preserved

### Data Isolation Strategy
Each website maintains isolated:
- Configuration settings
- Content and assets
- Theme preferences
- Plugin states
- Version history

Shared across websites:
- User preferences
- Global settings
- Authentication state
- Feature flags

## Testing Strategy

### Unit Test Coverage (Target: 90%+)
- Storage service operations
- Context provider logic
- Feature flag evaluation
- Component rendering
- Utility functions

### Integration Tests
- Context + Storage integration
- Routing + Context integration
- Dashboard + Studio flow
- Migration process

### E2E Tests
Located in `e2e/epic-3/`

Key scenarios:
- Complete user journey
- Multi-website creation
- Data isolation verification
- Feature flag toggling
- Migration flow

### Performance Tests
- Dashboard load with 50+ websites
- Context switching latency
- Storage operation timing
- Memory usage patterns

## Deployment Strategy

### Phase 1: Internal Testing
- Feature flags disabled by default
- Allowlist for internal testers
- Comprehensive logging
- Quick rollback capability

### Phase 2: Beta Release
- 10% rollout percentage
- Selected beta users
- Performance monitoring
- Feedback collection

### Phase 3: General Availability
- 100% rollout
- Feature flags remain for emergency rollback
- Continuous monitoring
- A/B testing for optimizations

## Security Considerations

### Data Isolation
- Websites cannot access each other's data
- Storage keys include website ID
- Context switching clears sensitive state

### Storage Limits
- Monitor quota usage
- Warn users at 80% capacity
- Prevent data loss from quota exceeded

### Migration Safety
- Automatic backups before migration
- Validation of migrated data
- Rollback capability preserved

## Performance Optimizations

### Lazy Loading
- Dashboard loads website metadata only
- Full website data loaded on demand
- Thumbnail generation async

### Caching Strategy
- Recently accessed websites cached
- Metadata cached with TTL
- Storage operations batched

### Storage Efficiency
- Data compression for large websites
- Cleanup of orphaned data
- Efficient serialization

## Monitoring and Telemetry

### Key Metrics
- Website creation rate
- Storage usage distribution
- Context switch frequency
- Feature flag adoption
- Error rates by component

### Logging Strategy
```typescript
// Structured logging
logger.info('website.created', {
  websiteId: id,
  source: 'ai_prompt',
  duration: ms
});

logger.error('storage.quota_exceeded', {
  usage: bytes,
  quota: maxBytes
});
```

### Health Checks
- Storage availability
- Quota status
- Migration state
- Feature flag service

## API Reference

### WebsiteStorageService

```typescript
class WebsiteStorageService {
  // Website lifecycle
  createWebsite(data: CreateWebsiteData): Promise<string>
  deleteWebsite(id: string): Promise<void>
  
  // Data operations
  getWebsiteData(id: string): Promise<WebsiteData>
  saveWebsiteData(id: string, data: WebsiteData): Promise<void>
  
  // Metadata operations
  listWebsites(): Promise<WebsiteMetadata[]>
  updateWebsiteMetadata(id: string, metadata: Partial<WebsiteMetadata>): Promise<void>
  
  // Utility operations
  exportWebsite(id: string): Promise<ExportData>
  importWebsite(data: ExportData): Promise<string>
  checkStorageQuota(): Promise<QuotaStatus>
  migrateFromSingleWebsite(): Promise<void>
}
```

### FeatureFlagService

```typescript
class FeatureFlagService {
  // Flag evaluation
  isEnabled(flag: FeatureFlag, userId?: string): boolean
  
  // Admin operations
  setFlag(flag: FeatureFlag, config: Partial<FeatureFlagConfig>): void
  getAllFlags(): Map<FeatureFlag, FeatureFlagConfig>
}
```

## Migration Path

### From Single to Multi-Website

1. **Detection**: Check for legacy data presence
2. **Backup**: Create timestamped backup
3. **Transform**: Convert to new schema
4. **Validate**: Verify data integrity
5. **Cleanup**: Remove legacy keys
6. **Verify**: Test website access

### Rollback Procedure

1. Disable feature flags
2. Restore from backup
3. Clear new storage keys
4. Restart application
5. Verify legacy mode works

## Future Enhancements

### Planned Features
- Team collaboration on websites
- Website templates marketplace
- Cloud sync and backup
- Website analytics dashboard
- Version control integration

### Technical Improvements
- IndexedDB for better performance
- WebWorker for background operations
- Service Worker for offline support
- Real-time collaboration
- Server-side storage option

## Troubleshooting Guide

### Common Issues

**Website Not Loading**
- Verify website ID exists
- Check storage permissions
- Clear browser cache
- Review console errors

**Storage Quota Exceeded**
- Export unused websites
- Clear browser storage
- Increase quota limits
- Use cleanup tools

**Migration Failures**
- Check backup exists
- Verify storage space
- Review migration logs
- Try manual migration

**Feature Flag Issues**
- Verify environment variables
- Check user allowlist
- Review rollout percentage
- Clear localStorage flags

## Dependencies

### Required Packages
- Next.js 14+
- React 18+
- TypeScript 5+
- Playwright (E2E tests)
- Jest (Unit tests)

### Browser Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Storage Requirements
- Minimum 100MB available
- IndexedDB support
- LocalStorage enabled
- Cookies enabled (for flags)

## Code Quality Standards

### Testing Requirements
- Unit test coverage >90%
- All critical paths E2E tested
- Performance benchmarks met
- No regression in existing tests

### Code Review Checklist
- [ ] Feature flags properly checked
- [ ] Data isolation verified
- [ ] Error handling comprehensive
- [ ] Performance impact acceptable
- [ ] Documentation updated
- [ ] Tests comprehensive

## Conclusion

The multi-website architecture provides a scalable foundation for Catalyst Studio's evolution from a single-website tool to a comprehensive web development platform. The design prioritizes data isolation, performance, and user experience while maintaining backward compatibility and providing robust migration paths.