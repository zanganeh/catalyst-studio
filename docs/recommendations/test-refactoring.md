# Test File Refactoring Recommendations

## Current State
Several test files in `/tests/epic-5/` exceed 700 lines, making them difficult to maintain and review:
- `content-item-tools.test.ts` - 727 lines
- `error-recovery.test.ts` - 713 lines  
- `performance.test.ts` - 686 lines

## Recommended Refactoring Strategy

### 1. Split by Test Category
Break large test files into smaller, focused files:

#### content-item-tools.test.ts → 
- `content-item-tools.create.test.ts` - Creation tests
- `content-item-tools.update.test.ts` - Update tests
- `content-item-tools.list.test.ts` - Listing and filtering tests
- `content-item-tools.validation.test.ts` - Validation and error tests

#### error-recovery.test.ts →
- `error-recovery.transactions.test.ts` - Transaction rollback tests
- `error-recovery.conflicts.test.ts` - Concurrent operation tests
- `error-recovery.network.test.ts` - Network and timeout tests
- `error-recovery.validation.test.ts` - Validation error recovery

#### performance.test.ts →
- `performance.execution.test.ts` - Tool execution timing
- `performance.context.test.ts` - Context loading performance
- `performance.bulk.test.ts` - Bulk operation performance
- `performance.benchmarks.test.ts` - Baseline benchmarks

### 2. Extract Shared Test Utilities
Create helper modules to reduce duplication:
- `/tests/epic-5/helpers/test-data.ts` - Shared test fixtures
- `/tests/epic-5/helpers/assertions.ts` - Common assertion helpers
- `/tests/epic-5/helpers/setup.ts` - Database setup/teardown

### 3. Benefits of Refactoring
- **Improved Maintainability**: Easier to find and fix specific tests
- **Better Organization**: Clear separation of concerns
- **Faster Test Runs**: Can run specific test categories in isolation
- **Easier Reviews**: Smaller files are easier to review in PRs
- **Reduced Duplication**: Shared utilities reduce code repetition

### 4. Implementation Timeline
Recommend implementing during next maintenance cycle or when:
- Adding significant new test coverage
- Fixing test infrastructure issues
- During Epic 6 planning phase

### 5. Guidelines for New Tests
Going forward, enforce these limits:
- Maximum 400 lines per test file
- Split files when they exceed this limit
- Use shared utilities for common operations
- Group related tests in describe blocks

## Note
This refactoring is not critical for Story 5.6 completion but should be considered for technical debt reduction in future sprints.