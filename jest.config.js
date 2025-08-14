const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Performance optimizations
  maxWorkers: '50%', // Use half available CPU cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Test sequencer for optimal execution order
  testSequencer: '<rootDir>/jest.sequencer.js',
  
  // Parallel test execution
  testRunner: 'jest-circus/runner',
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/lib/generated/**',
    '!**/app/layout.tsx',
    '!**/app/page.tsx',
    '!**/app/**/layout.tsx',
    '!**/app/**/loading.tsx',
    '!**/app/**/not-found.tsx',
    '!**/app/**/error.tsx',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './components/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './lib/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  coverageReporters: ['text', 'lcov', 'html', 'json', 'clover'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/?(*.)+(spec|test).{js,jsx,ts,tsx}'
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/tests/', '/e2e/', 'test-helpers.ts', 'test-helpers.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!(monaco-editor|@monaco-editor)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // Database optimization for tests
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Timeout optimizations
  testTimeout: 30000,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)