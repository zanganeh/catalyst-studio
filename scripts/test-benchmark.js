#!/usr/bin/env node

/**
 * Test Performance Benchmarking Script
 * Measures and tracks test execution performance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BENCHMARK_FILE = path.join(__dirname, '../.test-benchmarks.json');

function loadBenchmarks() {
  if (fs.existsSync(BENCHMARK_FILE)) {
    return JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
  }
  return { history: [] };
}

function saveBenchmarks(data) {
  fs.writeFileSync(BENCHMARK_FILE, JSON.stringify(data, null, 2));
}

function runBenchmark(command, description) {
  console.log(`🔍 Running: ${description}`);
  const startTime = Date.now();
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minutes max
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Completed in ${(duration / 1000).toFixed(2)}s\n`);
    return { success: true, duration, error: null };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Failed after ${(duration / 1000).toFixed(2)}s\n`);
    return { success: false, duration, error: error.message };
  }
}

function main() {
  console.log('🏃 Starting Test Performance Benchmark\n');
  
  const benchmarks = loadBenchmarks();
  const timestamp = new Date().toISOString();
  
  const results = {
    timestamp,
    environment: {
      node: process.version,
      platform: process.platform,
      cpus: require('os').cpus().length,
      memory: Math.round(require('os').totalmem() / 1024 / 1024 / 1024) + 'GB'
    },
    tests: {}
  };

  // Benchmark different test suites
  const testSuites = [
    {
      command: 'npm run test:unit',
      name: 'unit',
      description: 'Unit Tests'
    },
    {
      command: 'npm run test:integration',
      name: 'integration', 
      description: 'Integration Tests'
    },
    {
      command: 'npm run test:coverage:ci',
      name: 'coverage',
      description: 'Coverage Tests'
    }
  ];

  for (const suite of testSuites) {
    results.tests[suite.name] = runBenchmark(suite.command, suite.description);
  }

  // Calculate total time
  const totalDuration = Object.values(results.tests)
    .reduce((sum, test) => sum + test.duration, 0);
  
  results.totalDuration = totalDuration;

  // Add to history
  benchmarks.history.push(results);
  
  // Keep only last 50 runs
  if (benchmarks.history.length > 50) {
    benchmarks.history = benchmarks.history.slice(-50);
  }

  saveBenchmarks(benchmarks);

  // Generate performance report
  console.log('📊 Performance Summary:');
  console.log('========================');
  
  Object.entries(results.tests).forEach(([name, result]) => {
    const status = result.success ? '✅' : '❌';
    const time = (result.duration / 1000).toFixed(2);
    console.log(`${status} ${name.padEnd(12)} ${time}s`);
  });
  
  console.log(`\n⏱️  Total Time: ${(totalDuration / 1000).toFixed(2)}s`);

  // Compare with previous runs
  if (benchmarks.history.length > 1) {
    const previous = benchmarks.history[benchmarks.history.length - 2];
    const improvement = previous.totalDuration - totalDuration;
    const percentage = ((improvement / previous.totalDuration) * 100).toFixed(1);
    
    if (improvement > 0) {
      console.log(`🚀 Performance improved by ${(improvement / 1000).toFixed(2)}s (${percentage}%)`);
    } else {
      console.log(`⚠️  Performance regression: ${(Math.abs(improvement) / 1000).toFixed(2)}s (${Math.abs(percentage)}%)`);
    }
  }

  // Performance insights
  console.log('\n💡 Performance Insights:');
  
  if (totalDuration > 60000) { // > 1 minute
    console.log('   • Consider running tests in parallel for faster feedback');
    console.log('   • Review test database setup for optimization opportunities');
  }
  
  if (results.tests.coverage && results.tests.coverage.duration > 30000) {
    console.log('   • Coverage collection is slow - consider selective coverage');
  }

  const failedTests = Object.values(results.tests).filter(t => !t.success);
  if (failedTests.length > 0) {
    console.log('   • Some tests failed - performance might be affected by errors');
    process.exit(1);
  }

  console.log('\n📈 Benchmark saved to .test-benchmarks.json');
}

if (require.main === module) {
  main();
}

module.exports = { main };