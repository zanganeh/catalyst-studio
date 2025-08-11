# Testing Guide for Catalyst Studio

## Local Testing on Windows

This guide documents the testing approach for preserving existing functionality during the brownfield enhancement of Catalyst Studio.

## Prerequisites

- Node.js 18+ installed
- Windows 10/11
- Chrome, Firefox, or Edge browser
- PowerShell or Command Prompt

## Setup

### 1. Install Playwright

```powershell
# Install Playwright (already in package.json)
npm install

# Install Playwright browsers
npx playwright install
```

### 2. Environment Setup

```powershell
# Copy environment variables
copy .env.example .env.local

# Add your OpenRouter API key to .env.local
# OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

## Running Tests

### Quick Test Commands

```powershell
# Run all tests
npm run test

# Run tests in UI mode (recommended for Windows)
npm run test:ui

# Run specific test file
npx playwright test tests/chat.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Run tests with specific browser
npx playwright test --project=chromium
```

### NPM Scripts to Add

Add these to your `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:chrome": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:report": "playwright show-report"
  }
}
```

## Test Structure

### Protection Tests (`tests/chat.spec.ts`)
- **Purpose**: Snapshot current working behavior
- **When to Run**: Before ANY changes to the codebase
- **What it Tests**:
  - Chat page loads successfully
  - All UI elements present
  - Message sending works
  - Loading states display
  - Session persistence
  - Responsive design

### Performance Baselines
- **Page Load**: Should be < 3 seconds
- **Input Response**: Should be < 500ms
- **API Response**: Should be < 2 seconds

## Testing Workflow

### Before Making Changes

1. **Run Baseline Tests**
   ```powershell
   # Ensure dev server is running
   npm run dev
   
   # In another terminal, run tests
   npm run test
   ```

2. **Save Test Results**
   ```powershell
   # Tests generate HTML report
   npm run test:report
   ```

3. **Commit Protection Point**
   ```powershell
   git add .
   git commit -m "TEST: Baseline tests passing before [change description]"
   ```

### After Making Changes

1. **Run Same Tests**
   ```powershell
   npm run test
   ```

2. **Compare Results**
   - All existing tests should still pass
   - Performance should not degrade
   - No new console errors

3. **Document Any Intentional Changes**
   ```powershell
   # If a test needs updating due to intentional change
   git add tests/
   git commit -m "TEST: Update tests for [feature/change]"
   ```

## Testing Epic 1 Features

All Epic 1 features are now permanently enabled and integrated into the codebase:
- Three-column layout
- Catalyst branding
- Glass morphism effects
- Content Type Builder
- Source Code View
- Preview System
- CMS Deployment
- Chat Persistence

These features are tested as part of the standard test suite.

## Error Boundary Testing

The chat is now wrapped in an error boundary. To test:

1. **Simulate Error**: Temporarily add throwing code
2. **Verify Fallback**: Error UI should display
3. **Check Recovery**: "Try Again" should work
4. **Confirm Isolation**: Other parts of app still work

## Monitoring During Tests

Check the console for performance logs:

```
[PERF] ChatPage.mount: 125ms
[PERF] MessageSend: 230ms
[PERF] APIResponse: 1850ms
```

## Troubleshooting

### Common Windows Issues

1. **Port Already in Use**
   ```powershell
   # Find process using port 3000
   netstat -ano | findstr :3000
   
   # Kill process (replace PID with actual number)
   taskkill /PID [PID] /F
   ```

2. **Playwright Browser Issues**
   ```powershell
   # Reinstall browsers
   npx playwright install --force
   ```

3. **Permission Errors**
   - Run PowerShell as Administrator
   - Check antivirus isn't blocking

## Continuous Testing Strategy

### Daily Testing Routine

1. **Morning**: Run full test suite
2. **Before Each Story**: Run protection tests
3. **After Each Story**: Run full suite
4. **End of Day**: Run performance tests

### Test Coverage Goals

- **Existing Features**: 100% coverage
- **New Features**: 80% minimum
- **Critical Paths**: 100% coverage
- **Error Scenarios**: Documented and tested

## Red Flags - Stop Development If:

- ❌ Any existing test fails after changes
- ❌ Performance degrades by >20%
- ❌ Console errors appear in existing features
- ❌ Chat functionality breaks in any way
- ❌ Build warnings increase significantly

## Green Flags - Safe to Continue:

- ✅ All existing tests passing
- ✅ Performance stable or improved
- ✅ No new console errors
- ✅ All Epic 1 features working correctly
- ✅ Error boundaries catching issues

## Contact for Issues

If tests are failing and you can't determine why:

1. Check recent git commits
2. Revert to last known good state
3. Run tests in debug mode
4. Check browser console for errors
5. Document issue with screenshots

Remember: **The existing chat is the crown jewel - protect it at all costs!**