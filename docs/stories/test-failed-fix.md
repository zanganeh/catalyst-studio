# Epic: Test Suite Stabilization and Fixes

**Epic ID**: EPIC-TEST-FIX  
**Priority**: High  
**Status**: In Progress  
**Created**: 2025-08-14  
**Sprint**: Current  

## Overview
This epic addresses all failing unit and E2E tests discovered during test suite execution. The goal is to achieve 100% test passage rate across all test suites.

**Current State**:
- Unit Tests: 240/316 passing (76% success rate)
- E2E Tests: 167/270 passing (62% success rate)
- Total Failing Tests: 106 tests require fixes

## Git Flow Structure
All fixes will follow feature branch workflow:
- Base branch: `main`
- Feature branches: `feature/test-fix-[component-name]`
- Commit format: `fix(test): [component] - description`
- PR required for each task completion

---

## 🔴 Critical Priority Tasks

### Task 1: Fix Database Seed Timeout
**Branch**: `feature/test-fix-database-seed`  
**File**: `__tests__/database/seed.test.ts`  
**Issue**: Test exceeds 5000ms timeout  
**Solution**:
```typescript
// Increase timeout to 30 seconds for database operations
it('should handle reset and reseed correctly', async () => {
  // Add timeout configuration
}, 30000);
```
**Acceptance Criteria**:
- [ ] Database seed test completes within timeout
- [ ] All seed operations verified
- [ ] No hanging database connections

---

### Task 2: Fix AI Context Token Estimation
**Branch**: `feature/test-fix-ai-context-pruning`  
**File**: `__tests__/utils/ai-context-pruning.test.ts:111`  
**Issue**: Token calculation mismatch (Expected: 5, Received: 7)  
**Solution**:
```typescript
// Update token estimation algorithm
// Review character to token ratio calculation
// Verify with actual tokenizer if available
```
**Acceptance Criteria**:
- [ ] Token estimation matches expected values
- [ ] Algorithm documented with calculation logic
- [ ] Edge cases covered

---

### Task 3: Fix Code Export Service Tests
**Branch**: `feature/test-fix-code-export`  
**File**: `lib/export/code-export-service.test.ts`  
**Issues**:
1. ZIP file path normalization
2. Mock configuration errors
3. Error handling validation

**Solution**:
```typescript
// Fix mock setup for Blob and URL.createObjectURL
// Normalize paths for cross-platform compatibility
// Properly mock JSZip operations
```
**Acceptance Criteria**:
- [ ] All export service tests passing
- [ ] Mocks properly configured
- [ ] Path handling works on Windows/Unix

---

## 🟡 High Priority Tasks

### Task 4: Fix Source Code View Component
**Branch**: `feature/test-fix-source-code-view`  
**File**: `components/development/__tests__/source-code-view.test.tsx`  
**Issue**: Component not rendering expected tab content  
**Solution**:
```typescript
// Fix async rendering issues
// Verify state management in tests
// Update waitFor assertions
```
**Acceptance Criteria**:
- [ ] Component renders all tabs correctly
- [ ] File selection works in tests
- [ ] State updates properly tracked

---

### Task 5: Fix API Route Tests
**Branch**: `feature/test-fix-api-routes`  
**Files**:
- `app/api/websites/__tests__/route.test.ts`
- `app/api/websites/__tests__/[id].route.test.ts`

**Issues**: Request/Response mocking failures  
**Solution**:
```typescript
// Update Next.js 15 API route test patterns
// Fix Request/Response mocks
// Validate Prisma mock setup
```
**Acceptance Criteria**:
- [ ] All API route tests passing
- [ ] Proper error handling tested
- [ ] CRUD operations validated

---

### Task 6: Fix Studio Routing Tests
**Branch**: `feature/test-fix-studio-routing`  
**File**: `app/studio/__tests__/routing.test.tsx`  
**Issue**: Navigation and redirect tests failing  
**Solution**:
```typescript
// Mock Next.js navigation properly
// Fix router push/replace in tests
// Validate middleware behavior
```
**Acceptance Criteria**:
- [ ] All routing tests passing
- [ ] Navigation flows validated
- [ ] Redirects work correctly

---

## 🟢 Medium Priority Tasks

### Task 7: Fix Content Component Tests
**Branch**: `feature/test-fix-content-components`  
**Files**:
- `components/content/__tests__/content-list.test.tsx`
- `components/content/__tests__/form-generator.test.tsx`

**Issues**: Component rendering and form validation  
**Solution**:
```typescript
// Fix React Hook Form mocking
// Update component queries
// Validate form submissions
```
**Acceptance Criteria**:
- [ ] Content list renders correctly
- [ ] Form generation works
- [ ] Validation rules tested

---

### Task 8: Fix Dashboard Component Tests
**Branch**: `feature/test-fix-dashboard-components`  
**Files**:
- `components/dashboard/__tests__/ai-prompt-section.test.tsx`
- `components/dashboard/__tests__/quick-category-tags.test.tsx`
- `components/dashboard/__tests__/website-creator.test.tsx`

**Issues**: Component interaction and state management  
**Solution**:
```typescript
// Fix Zustand store mocking
// Update user interaction tests
// Validate AI integration mocks
```
**Acceptance Criteria**:
- [ ] All dashboard components render
- [ ] User interactions work
- [ ] State updates properly

---

### Task 9: Fix Deployment Component Tests
**Branch**: `feature/test-fix-deployment-components`  
**Files**:
- `components/deployment/cms-provider-selector.test.tsx`
- `components/deployment/deployment-results.test.tsx`
- `components/deployment/deployment-wizard.test.tsx`

**Issues**: Component lifecycle and async operations  
**Solution**:
```typescript
// Fix async state updates
// Mock deployment APIs
// Validate wizard flow
```
**Acceptance Criteria**:
- [ ] Deployment flow tested end-to-end
- [ ] Provider selection works
- [ ] Results display correctly

---

### Task 10: Fix Development Tool Tests
**Branch**: `feature/test-fix-dev-tools`  
**Files**:
- `components/development/editor-error-boundary.test.tsx`
- `components/development/editor-tabs.test.tsx`
- `components/development/file-tree.test.tsx`

**Issues**: Monaco editor mocking and file system operations  
**Solution**:
```typescript
// Mock Monaco editor properly
// Fix file tree interactions
// Validate error boundary
```
**Acceptance Criteria**:
- [ ] Editor components render
- [ ] File operations work
- [ ] Error handling validated

---

## 🔵 E2E Test Fixes

### Task 11: Fix E2E Routing Tests
**Branch**: `feature/test-fix-e2e-routing`  
**Files**:
- `e2e/epic-3/app-routing.spec.ts`
- `e2e/epic-3/default-routing.spec.ts`
- `e2e/epic-3/debug-routing.spec.ts`

**Issues**: Navigation timeouts and redirect failures  
**Solution**:
```typescript
// Increase wait times for navigation
// Fix redirect detection
// Validate URL changes
```
**Acceptance Criteria**:
- [ ] All routing tests pass consistently
- [ ] No flaky test behavior
- [ ] Works across all browsers

---

### Task 12: Fix E2E Content API Tests
**Branch**: `feature/test-fix-e2e-content-api`  
**File**: `e2e/epic-4/content-items-api.spec.ts`  
**Issues**: Bulk operations and API response validation  
**Solution**:
```typescript
// Fix bulk operation handling
// Validate response structures
// Handle async operations properly
```
**Acceptance Criteria**:
- [ ] CRUD operations work
- [ ] Bulk operations succeed
- [ ] Error cases handled

---

### Task 13: Fix E2E Studio Content Builder
**Branch**: `feature/test-fix-e2e-content-builder`  
**File**: `e2e/epic-4/studio-content-builder.spec.ts`  
**Issues**: UI interactions and state persistence  
**Solution**:
```typescript
// Fix element selectors
// Handle dynamic content loading
// Validate data persistence
```
**Acceptance Criteria**:
- [ ] Content creation flow works
- [ ] Navigation between sections
- [ ] Data persists correctly

---

### Task 14: Fix E2E Multi-Website Tests
**Branch**: `feature/test-fix-e2e-multi-website`  
**File**: `e2e/epic-3/multi-website.spec.ts`  
**Issues**: Website isolation and state management  
**Solution**:
```typescript
// Fix website switching logic
// Validate isolation between sites
// Handle storage quota warnings
```
**Acceptance Criteria**:
- [ ] Multiple websites can be created
- [ ] Switching preserves state
- [ ] Storage warnings display

---

### Task 15: Fix Mobile Browser E2E Tests
**Branch**: `feature/test-fix-e2e-mobile`  
**Issues**: JavaScript execution and responsive UI  
**Solution**:
```typescript
// Fix viewport configurations
// Handle mobile-specific interactions
// Validate responsive behavior
```
**Acceptance Criteria**:
- [ ] Tests pass on Mobile Chrome
- [ ] Tests pass on Mobile Safari
- [ ] UI responds correctly to mobile viewport

---

## Test Infrastructure Improvements

### Task 16: Optimize Test Performance
**Branch**: `feature/test-performance`  
**Goals**:
- Reduce test execution time
- Parallelize where possible
- Optimize database operations

**Acceptance Criteria**:
- [ ] Test suite runs in under 5 minutes
- [ ] No timeouts in CI/CD
- [ ] Parallel execution configured

---

### Task 17: Add Test Coverage Reporting
**Branch**: `feature/test-coverage`  
**Goals**:
- Set up coverage thresholds
- Generate coverage reports
- Identify untested code

**Acceptance Criteria**:
- [ ] Coverage reports generated
- [ ] 80% coverage threshold enforced
- [ ] Coverage gaps documented

---

## Success Metrics
- ✅ 100% unit test pass rate
- ✅ 100% E2E test pass rate  
- ✅ Test execution time < 5 minutes
- ✅ No flaky tests in CI/CD
- ✅ 80%+ code coverage

## Testing Strategy
1. Fix critical failures first (blocking CI/CD)
2. Address high-priority component tests
3. Stabilize E2E tests
4. Optimize performance
5. Add missing coverage

## Dependencies
- Jest configuration updates
- Playwright configuration updates
- Mock library updates
- Testing library updates

## Notes
- Each task should be completed in its own feature branch
- All fixes must include documentation of root cause
- Consider adding regression tests for each fix
- Update test documentation as needed

---

## Completion Checklist
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Test coverage > 80%
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] CI/CD pipeline green