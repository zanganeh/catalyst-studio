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

## Data Structure Changes

### Storage Schema
The storage structure has been updated to support multiple websites:

#### Old Structure
```
localStorage:
  catalyst_website: { ... }  // Single website data
```

#### New Structure
```
localStorage:
  catalyst_websites: [...]   // List of website metadata
  catalyst_website_[id]: { ... }  // Individual website data
```

### Website Metadata
Each website now includes:
- `id`: Unique identifier (UUID)
- `name`: Website name
- `description`: Optional description
- `createdAt`: Creation timestamp
- `lastModified`: Last modification timestamp
- `thumbnail`: Optional preview image

## Migration Script Details

The migration script (`scripts/migrate-multi-website.js`) performs:

1. **Backup Creation**
   - Exports current data to `backups/backup-[timestamp].json`
   - Validates backup integrity

2. **Data Transformation**
   - Creates "default" website entry
   - Migrates existing data to new schema
   - Preserves all settings and content

3. **Verification**
   - Checks data integrity
   - Validates storage quotas
   - Tests read/write operations

4. **Cleanup**
   - Removes legacy storage keys
   - Optimizes storage usage

## Best Practices

### Before Migration
1. Export your current website as backup
2. Document any custom configurations
3. Test in development environment first
4. Communicate changes to team members

### During Migration
1. Monitor browser console for errors
2. Keep backup window open for quick rollback
3. Test immediately after migration
4. Document any issues encountered

### After Migration
1. Verify all features work correctly
2. Test website switching functionality
3. Monitor performance metrics
4. Gather user feedback

## Feature Flag Configuration

### Development Environment
```bash
# Full features enabled
NEXT_PUBLIC_MULTI_WEBSITE=true
NEXT_PUBLIC_DASHBOARD=true
NEXT_PUBLIC_AI_CREATION=true
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=100
```

### Staging Environment
```bash
# Gradual rollout
NEXT_PUBLIC_MULTI_WEBSITE=true
NEXT_PUBLIC_DASHBOARD=true
NEXT_PUBLIC_AI_CREATION=true
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=50
```

### Production Environment
```bash
# Conservative rollout
NEXT_PUBLIC_MULTI_WEBSITE=true
NEXT_PUBLIC_DASHBOARD=true
NEXT_PUBLIC_AI_CREATION=false  # Disabled initially
NEXT_PUBLIC_ROLLOUT_PERCENTAGE=10
NEXT_PUBLIC_BETA_USERS=beta-testers@example.com
```

## Monitoring

### Key Metrics to Track
- Migration success rate
- Storage usage patterns
- Website creation frequency
- Performance impact
- Error rates

### Logging
Enable detailed logging during migration:
```bash
DEBUG=catalyst:migration npm run migrate:multi-website
```

## Support
- GitHub Issues: https://github.com/catalyst-studio/issues
- Discord: https://discord.gg/catalyst
- Email: support@catalyst.studio

## FAQ

**Q: Will I lose my existing website data?**
A: No, the migration creates a backup and preserves all data.

**Q: Can I rollback after migration?**
A: Yes, use the rollback script or manually disable feature flags.

**Q: How much storage do multiple websites use?**
A: Each website uses storage proportional to its content. Monitor via Settings → Storage.

**Q: Can I export/import individual websites?**
A: Yes, each website can be exported and imported independently.

**Q: What happens to shared settings?**
A: Global settings remain shared, website-specific settings are isolated.