# Testing Infrastructure Documentation

## Overview

This document outlines the comprehensive testing infrastructure implemented for Catalyst Studio, including performance optimizations and coverage reporting.

## Test Performance Optimizations

### Jest Configuration Improvements

- **Parallel Execution**: Tests run on 50% of available CPU cores
- **Intelligent Caching**: Dedicated cache directory for faster subsequent runs
- **Custom Test Sequencer**: Optimal execution order (fast tests first, database tests last)
- **Global Setup/Teardown**: Efficient database initialization and cleanup

### Test Categories & Execution Order

1. **Utils Tests** (Priority 1) - Fast utility function tests
2. **Hooks Tests** (Priority 2) - React hooks testing
3. **Components Tests** (Priority 3) - UI component testing
4. **Lib Tests** (Priority 4) - Library and service tests
5. **Integration Tests** (Priority 5) - Cross-component integration
6. **API Tests** (Priority 6) - API endpoint testing
7. **Database Tests** (Priority 7) - Database operations
8. **Epic Tests** (Priority 8) - End-to-end feature testing

### Performance Scripts

```bash
# Standard test execution
npm test

# Performance optimized tests
npm run test:performance

# Parallel unit tests
npm run test:unit

# Integration tests only
npm run test:integration
```

## Coverage Reporting

### Coverage Thresholds

- **Global**: 80% minimum for all metrics
- **Components**: 80% (UI components)
- **Hooks**: 85% (Critical business logic)
- **Lib**: 75% (Supporting libraries)

### Coverage Scripts

```bash
# Generate coverage report
npm run test:coverage

# CI-friendly coverage (no watch mode)
npm run test:coverage:ci

# Full coverage analysis
npm run test:coverage:full

# Analyze coverage gaps
npm run test:coverage:analyze

# Check thresholds only
npm run test:coverage:check
```

### Coverage Reports

Multiple format support:
- **HTML**: Interactive browsable report
- **LCOV**: Standard format for CI/CD
- **JSON**: Programmatic analysis
- **Text**: Console output
- **Clover**: XML format for tools

## CI/CD Integration

### GitHub Actions Workflow

The `test-coverage.yml` workflow provides:

- **Multi-Node Testing**: Tests on Node.js 18.x and 20.x
- **Codecov Integration**: Automatic coverage uploads
- **PR Comments**: Coverage reports on pull requests
- **Threshold Enforcement**: Fails CI if coverage drops
- **Artifact Storage**: 7-day retention of coverage reports

### Codecov Configuration

- **Project Coverage**: 80% target with 1% threshold
- **Patch Coverage**: 80% for new code
- **Smart Ignoring**: Excludes generated files and configs
- **Flag-based Reports**: Separate tracking for unit vs integration tests

## E2E Test Improvements

### Playwright Optimizations

- **Parallel Workers**: 50% CPU cores locally, 2 workers in CI
- **Multiple Reporters**: HTML, JUnit, GitHub integration
- **Enhanced Timeouts**: Optimized for stability
- **Comprehensive Browser Coverage**: Desktop and mobile testing

### E2E Scripts

```bash
# Standard E2E tests
npm run test:e2e

# Parallel E2E execution
npm run test:e2e:parallel

# Headed mode (visible browser)
npm run test:e2e:headed

# Browser-specific tests
npm run test:chrome
npm run test:firefox
npm run test:webkit

# Mobile testing
npm run test:mobile
```

## Pre-commit Hooks

### Coverage Enforcement

The pre-commit hook (`scripts/pre-commit-coverage.js`) ensures:

- Tests pass before commits
- Coverage thresholds are met
- Detailed feedback on failures
- Option to bypass (not recommended)

To enable:
```bash
# Add to .git/hooks/pre-commit
#!/bin/sh
node scripts/pre-commit-coverage.js
```

## Coverage Analysis

### Automated Analysis

The coverage analyzer (`scripts/coverage-analysis.js`) provides:

- **Threshold Validation**: Automatic pass/fail determination
- **Gap Identification**: Files needing attention
- **Metric Breakdown**: Lines, branches, functions, statements
- **Prioritized Recommendations**: Worst coverage files first

### Usage

```bash
# Run analysis after coverage generation
npm run test:coverage:analyze

# Or as part of full coverage workflow
npm run test:coverage:full
```

## Best Practices

### Test Organization

1. **Unit Tests**: In `__tests__` directories alongside source
2. **Integration Tests**: In `__tests__/integration/`
3. **E2E Tests**: In `e2e/` directory
4. **Test Helpers**: Shared utilities in test helper files

### Coverage Optimization

1. **Focus on Critical Paths**: Prioritize business logic
2. **Test Edge Cases**: Branch coverage through error scenarios
3. **Mock External Dependencies**: Faster, more reliable tests
4. **Avoid Testing Implementation Details**: Test behavior, not internals

### Performance Tips

1. **Use Test Sequencer**: Let the system optimize execution order
2. **Enable Caching**: Faster subsequent test runs
3. **Parallel Execution**: Leverage multi-core systems
4. **Database Optimization**: Use setup/teardown for efficient DB handling

## Monitoring & Alerts

### Coverage Trends

Track coverage over time through:
- Codecov dashboard
- GitHub PR comments
- CI/CD pipeline reports
- Local analysis scripts

### Quality Gates

Automatic enforcement at:
- Pre-commit hooks
- Pull request checks
- CI/CD pipeline stages
- Deployment gates

## Troubleshooting

### Common Issues

1. **Cache Problems**: Clear with `rm -rf .jest-cache`
2. **Database Locks**: Ensure proper cleanup in teardown
3. **Timeout Issues**: Adjust `testTimeout` in jest.config.js
4. **Coverage Gaps**: Use analyzer to identify specific files

### Debug Commands

```bash
# Debug test failures
npm run test:debug

# Verbose coverage output
npm run test:coverage -- --verbose

# Single test file
npm test -- --testPathPattern=specific-test

# Watch mode with coverage
npm run test:coverage:watch
```

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Screenshot comparison
2. **Performance Testing**: Load and stress testing
3. **Accessibility Testing**: a11y compliance checks
4. **Security Testing**: OWASP compliance scanning
5. **Mutation Testing**: Test quality validation

### Integration Opportunities

1. **SonarQube**: Code quality metrics
2. **Lighthouse CI**: Performance monitoring
3. **Percy**: Visual testing
4. **Snyk**: Security vulnerability scanning

---

For questions or improvements, please refer to the development team or create an issue in the project repository.