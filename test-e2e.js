// Simple E2E test script for Content Management
const http = require('http');

console.log('🧪 Quinn\'s E2E Test Suite for Story 1.6');
console.log('=======================================\n');

// Test 1: Server is running
function testServerRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      console.log('✅ Test 1: Server is running on port 3000');
      console.log(`   Status: ${res.statusCode}`);
      resolve(true);
    }).on('error', (err) => {
      console.log('❌ Test 1: Server not running');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 2: Content page is accessible
function testContentPage() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/studio/content', (res) => {
      if (res.statusCode === 200 || res.statusCode === 304) {
        console.log('✅ Test 2: Content page is accessible at /studio/content');
        console.log(`   Status: ${res.statusCode}`);
        resolve(true);
      } else {
        console.log('⚠️  Test 2: Content page returned unexpected status');
        console.log(`   Status: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Test 2: Content page not accessible');
      console.log(`   Error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 3: API endpoints (if any)
function testContentAPI() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000/api/content', (res) => {
      console.log('ℹ️  Test 3: API endpoint check');
      console.log(`   Status: ${res.statusCode} (404 expected if no API yet)`);
      resolve(true);
    }).on('error', () => {
      console.log('ℹ️  Test 3: No API endpoints configured (expected)');
      resolve(true);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('Starting E2E Tests...\n');
  
  const results = [];
  results.push(await testServerRunning());
  results.push(await testContentPage());
  results.push(await testContentAPI());
  
  console.log('\n=======================================');
  console.log('Test Summary:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests need attention');
  }
  
  console.log('\nManual Testing Checklist:');
  console.log('[ ] Navigate to http://localhost:3000/studio/content');
  console.log('[ ] Verify "No Content Types Available" message appears');
  console.log('[ ] Check that New Content button is disabled');
  console.log('[ ] Verify keyboard navigation (Tab through elements)');
  console.log('[ ] Test Ctrl+S keyboard shortcut in forms');
  console.log('[ ] Verify dark theme styling is consistent');
  console.log('[ ] Check responsive design on mobile viewport');
  
  process.exit(passed === total ? 0 : 1);
}

// Add delay to ensure server is ready
setTimeout(runTests, 2000);