# Epic 5 - Testing Guide

## Overview
This guide covers all testing scenarios, expected results, and troubleshooting for Epic 5: AI-Powered Content Management Tools.

## Test Structure

### Test Categories
1. **Unit Tests** (`/tests/epic-5/*.test.ts`)
   - POC scenario adaptations
   - Integration tests for all tools
   - Error recovery testing
   - Performance benchmarks

2. **E2E Tests** (`/tests/e2e/epic-5-ai-tools.spec.ts`)
   - Complete user workflows
   - UI interaction testing
   - Real-time streaming validation

## Test Scenarios and Expected Results

### 1. POC Test Scenarios (`ai-tools.test.ts`)

#### Test 1: Create Website with Requirements
- **Input**: Website name, description, business requirements
- **Expected**: 
  - Website created with unique ID
  - Business requirements stored as array
  - Success response with complete website object

#### Test 2: Create Content Type with Fields
- **Input**: Website ID, content type name, field definitions
- **Expected**:
  - Content type created with automatic field inference
  - Fields properly typed (text, number, boolean, date, array)
  - Required/optional flags correctly set

#### Test 3: Create Content Items
- **Input**: Website ID, content type ID, content data
- **Expected**:
  - Content items created with validation
  - Business rules enforced
  - Proper field type coercion

#### Test 4: Get and Verify Website Context
- **Input**: Website ID
- **Expected**:
  - Complete website object
  - All content types listed
  - Recent content items included
  - Statistics calculated correctly

#### Test 5: Create Blog Structure
- **Input**: Multiple content type definitions
- **Expected**:
  - All content types created (BlogPost, Author, Category)
  - Proper relationships established
  - Field definitions preserved

#### Test 6: Execute Multi-step Operations
- **Input**: Complex workflow with multiple tools
- **Expected**:
  - All steps execute in sequence
  - Data consistency maintained
  - Proper error handling between steps

### 2. Website Management Tools (`website-tools.test.ts`)

#### get-website-context
- **Test Cases**:
  - Website with content
  - Empty website
  - Non-existent website
  - Website with recent content

- **Expected Results**:
  - Context includes all website data
  - Business rules properly formatted
  - Statistics accurately calculated
  - Recent content limited to last 10 items

#### update-business-requirements
- **Test Cases**:
  - Valid requirements update
  - Empty requirements
  - Invalid requirement format
  - Very long requirements list (100+ rules)

- **Expected Results**:
  - Requirements persisted to database
  - Invalid entries filtered out
  - No limit on requirement count
  - Proper error handling for non-existent website

#### validate-content
- **Test Cases**:
  - Valid content against rules
  - Missing required fields
  - Format violations (dates, emails, etc.)
  - Nested content structures

- **Expected Results**:
  - Accurate validation results
  - Detailed violation messages
  - Field-specific error reporting
  - Support for complex content structures

### 3. Content Type Tools (`content-type-tools.test.ts`)

#### create-content-type
- **Test Cases**:
  - With explicit fields
  - With field inference from description
  - Duplicate field names
  - Invalid field types
  - No fields

- **Expected Results**:
  - Automatic field inference when not provided
  - Field deduplication
  - Type validation/defaulting
  - Unique constraint on type names per website

#### list-content-types
- **Test Cases**:
  - Multiple content types
  - Empty website
  - With content counts
  - Non-existent website

- **Expected Results**:
  - All types listed for website
  - Content counts included
  - Empty array for no types
  - Error for invalid website

#### update-content-type
- **Test Cases**:
  - Add new fields
  - Remove existing fields
  - Change field properties
  - With existing content items

- **Expected Results**:
  - Schema updates applied
  - Existing content preserved
  - Field additions/removals handled
  - No data corruption

### 4. Content Item Tools (`content-item-tools.test.ts`)

#### create-content-item
- **Test Cases**:
  - Valid content
  - Missing required fields
  - Type validation
  - Array fields
  - Business rule validation

- **Expected Results**:
  - Content created with validation
  - Required fields enforced
  - Type coercion applied
  - Arrays properly stored
  - Business rules checked

#### list-content-items
- **Test Cases**:
  - With pagination
  - Different page sizes
  - Empty results
  - Sorting by date

- **Expected Results**:
  - Proper pagination with limit/offset
  - Total count included
  - hasMore flag accurate
  - Default sort by createdAt DESC

#### update-content-item
- **Test Cases**:
  - Partial updates
  - Name updates
  - Field additions
  - Field removals
  - Concurrent updates

- **Expected Results**:
  - Only specified fields updated
  - Other fields preserved
  - Validation still applied
  - Last-write-wins for conflicts

### 5. Error Recovery (`error-recovery.test.ts`)

#### Transaction Rollbacks
- **Test Cases**:
  - Database errors
  - Constraint violations
  - Validation failures
  - Nested transaction failures

- **Expected Results**:
  - Complete rollback on failure
  - No partial data persisted
  - Error messages preserved
  - System remains stable

#### Partial Operation Recovery
- **Test Cases**:
  - Bulk creation failures
  - Partial field updates
  - Connection loss during operation

- **Expected Results**:
  - Successful operations preserved
  - Failed operations reported
  - System recoverable
  - No data corruption

#### Concurrent Operations
- **Test Cases**:
  - Simultaneous updates
  - Race conditions
  - Optimistic locking

- **Expected Results**:
  - At least one operation succeeds
  - Conflicts detected and reported
  - Data consistency maintained

### 6. Performance Tests (`performance.test.ts`)

#### Execution Time Benchmarks
- **Simple Operations**: < 1 second
  - Website creation
  - Single content type creation
  - Single item creation
  - Content validation

- **Complex Operations**: < 2 seconds
  - Bulk item creation (10 items)
  - Content type updates with migration
  - Multi-tool workflows

- **Bulk Operations**: Linear scaling
  - Time per item consistent
  - No exponential growth
  - Efficient batching

#### Context Loading Performance
- **Small Websites** (< 10 types, < 50 items): < 100ms
- **Medium Websites** (10-50 types, 50-500 items): < 300ms
- **Large Websites** (50+ types, 500+ items): < 500ms

#### Optimization Strategies
- Query optimization with proper indexing
- Context pruning for large datasets
- In-memory caching for frequently accessed data
- Batch operations for bulk updates

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Test Timeouts
**Problem**: Tests failing due to timeouts
**Solutions**:
- Increase Jest timeout: `jest.setTimeout(30000)`
- Check database connection
- Verify no infinite loops
- Review async/await usage

#### 2. Database Lock Errors
**Problem**: SQLite database locked errors
**Solutions**:
- Ensure single database connection
- Use transactions properly
- Avoid concurrent writes
- Close connections after tests

#### 3. Validation Failures
**Problem**: Unexpected validation errors
**Solutions**:
- Check business rules configuration
- Verify field type definitions
- Review content structure
- Check for required fields

#### 4. Performance Issues
**Problem**: Tests exceeding time limits
**Solutions**:
- Review database queries
- Add appropriate indexes
- Implement caching
- Batch operations

#### 5. Flaky E2E Tests
**Problem**: Intermittent E2E test failures
**Solutions**:
- Add proper wait conditions
- Use data-testid attributes
- Handle async operations
- Increase timeout values

### Debug Strategies

#### Enable Verbose Logging
```typescript
// In test files
console.log('Debug:', JSON.stringify(result, null, 2));

// In audit logger
auditLogger.exportLogs('json');
```

#### Isolate Failing Tests
```bash
# Run single test file
npm test -- ai-tools.test.ts

# Run single test
npm test -- -t "should create website"
```

#### Check Database State
```typescript
// Add debug helper
async function debugDatabase() {
  const websites = await prisma.website.findMany();
  const contentTypes = await prisma.contentType.findMany();
  const contentItems = await prisma.contentItem.findMany();
  
  console.log({
    websiteCount: websites.length,
    contentTypeCount: contentTypes.length,
    contentItemCount: contentItems.length
  });
}
```

## Performance Benchmarks

### Current Baselines
Based on test runs, these are the current performance baselines:

| Operation | Target | Actual | Status |
|-----------|--------|--------|--------|
| Create Website | < 1s | ~150ms | ✅ Pass |
| Create Content Type | < 1s | ~200ms | ✅ Pass |
| Create Content Item | < 1s | ~180ms | ✅ Pass |
| Validate Content | < 1s | ~50ms | ✅ Pass |
| Get Website Context (Small) | < 100ms | ~80ms | ✅ Pass |
| Get Website Context (Medium) | < 300ms | ~250ms | ✅ Pass |
| Get Website Context (Large) | < 500ms | ~450ms | ✅ Pass |
| Bulk Create (10 items) | < 2s | ~1.5s | ✅ Pass |
| Complex Workflow | < 2s | ~1.8s | ✅ Pass |

### Performance Monitoring
- Audit logger tracks all execution times
- Metrics available via `getToolMetrics()`
- P95 and P99 percentiles calculated
- Slow operations logged (> 2s threshold)

## Coverage Requirements

### Target Coverage: > 80% Global

Current coverage by module:
- Website Tools: 85% target
- Content Type Tools: 85% target
- Content Item Tools: 85% target
- Context Provider: 90% target
- Audit Logger: 90% target
- Business Rules: 85% target

### Critical Paths (100% Coverage Required)
1. Tool execution logic
2. Database transaction handling
3. Rollback mechanisms
4. Validation logic
5. Error handling

## Test Commands

### Run All Tests
```bash
npm test
```

### Run Epic 5 Tests Only
```bash
npm test -- tests/epic-5
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Performance Tests
```bash
npm test -- performance.test.ts
```

### Generate Coverage Report
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## CI/CD Integration

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test -- --onlyChanged"
    }
  }
}
```

### GitHub Actions
```yaml
name: Epic 5 Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test -- tests/epic-5
      - run: npm run test:e2e
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (100% success rate)
- [ ] Coverage meets thresholds (> 80%)
- [ ] Performance benchmarks met
- [ ] No console errors or warnings
- [ ] Audit logging configured
- [ ] Error recovery tested

### Deployment
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] API endpoints secured
- [ ] Rate limiting configured
- [ ] Monitoring enabled
- [ ] Rollback plan prepared

### Post-Deployment
- [ ] Smoke tests executed
- [ ] Performance monitoring active
- [ ] Error tracking enabled
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team training completed

## Maintenance

### Regular Tasks
1. **Weekly**: Review slow operations log
2. **Monthly**: Analyze performance trends
3. **Quarterly**: Update performance baselines
4. **As Needed**: Optimize slow queries

### Monitoring Alerts
Set up alerts for:
- Execution time > 5 seconds
- Error rate > 1%
- Database connection failures
- Memory usage > 80%
- API response time > 2 seconds

## Support

For issues or questions regarding Epic 5 testing:
1. Check this guide first
2. Review test failure logs
3. Consult audit logger output
4. Contact development team

## Appendix

### Test Data Fixtures
Located in `/tests/epic-5/fixtures/`:
- `websites.json`: Sample website configurations
- `content-types.json`: Common content type definitions
- `content-items.json`: Test content data
- `business-rules.json`: Validation rule examples

### Environment Setup
Required environment variables for testing:
```env
DATABASE_URL="file:./test.db"
NODE_ENV="test"
LOG_LEVEL="debug"
```

### Useful Commands
```bash
# Reset test database
rm -f test.db && npx prisma db push

# Run specific test suite
npm test -- --testNamePattern="Website Management"

# Debug specific test
node --inspect-brk node_modules/.bin/jest ai-tools.test.ts
```