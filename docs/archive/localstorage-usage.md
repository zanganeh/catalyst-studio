# localStorage Usage Documentation

## Overview
After the removal of feature flags (Epic 2), this document describes the current usage of localStorage in Catalyst Studio.

## Current localStorage Keys

### 1. `contentTypes`
- **Location**: `/lib/context/content-type-context.tsx`
- **Purpose**: Stores user-defined content types
- **Format**: JSON stringified array of content type objects
- **Persistence**: Until manually cleared

### 2. `navigationState` 
- **Location**: `/lib/context/navigation-context.tsx`
- **Purpose**: Stores navigation state and history
- **Format**: JSON stringified navigation state object
- **Persistence**: Until manually cleared or reset

### 3. `preview-settings`
- **Location**: `/lib/context/preview-context.tsx`
- **Purpose**: Stores preview panel settings (zoom, device frame, etc.)
- **Format**: JSON stringified preview settings object
- **Persistence**: Until manually cleared

### 4. `deployment-history`
- **Location**: `/lib/deployment/mock-deployment-service.ts`
- **Purpose**: Stores mock deployment history for development
- **Format**: JSON stringified array of deployment records
- **Persistence**: Until manually cleared

### 5. Storage Service Keys
- **Location**: `/lib/storage/storage-service.ts`
- **Purpose**: Generic storage service for various app data
- **Keys**: Dynamic based on usage (projects, chats, etc.)
- **Format**: JSON stringified data
- **Persistence**: Until manually cleared

## Removed Keys (Epic 2)

### `featureFlags` (REMOVED)
- **Previous Purpose**: Stored feature flag states
- **Removal Date**: Epic 2 completion
- **Cleanup**: Automatic via `feature-flag-cleanup.ts` utility

## Migration Flag

### `featureFlagsMigrated`
- **Location**: `/lib/utils/feature-flag-cleanup.ts`
- **Purpose**: Indicates that feature flag cleanup has been performed
- **Format**: String value "true"
- **Persistence**: Permanent (until manual clear)

## Storage Best Practices

1. **Key Naming**: Use descriptive, namespaced keys (e.g., `catalyst-studio-{feature}`)
2. **Error Handling**: Always wrap localStorage operations in try-catch blocks
3. **Validation**: Validate data when reading from localStorage
4. **Cleanup**: Provide utilities for users to clear specific data
5. **Size Limits**: Be aware of localStorage 5-10MB limits

## User Data Management

Users can clear localStorage data via:
- Browser developer tools (Application > Storage > Local Storage)
- Application settings (if implemented)
- Manual JavaScript: `localStorage.clear()` or `localStorage.removeItem(key)`

## Security Considerations

- Never store sensitive data (passwords, tokens, PII) in localStorage
- localStorage is accessible to all scripts on the same origin
- Data persists until explicitly cleared

## Development Notes

When adding new localStorage usage:
1. Document the key in this file
2. Implement proper error handling
3. Consider providing a cleanup method
4. Test with localStorage disabled/full scenarios