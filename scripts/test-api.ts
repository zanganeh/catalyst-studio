/**
 * Test script for Website API endpoints
 * Run with: npx tsx scripts/test-api.ts
 */

const BASE_URL = 'http://localhost:3000/api/websites';

interface TestResult {
  test: string;
  passed: boolean;
  message?: string;
  response?: any;
}

const results: TestResult[] = [];

async function logTest(test: string, fn: () => Promise<boolean>) {
  try {
    const passed = await fn();
    results.push({ test, passed });
    console.log(passed ? '✅' : '❌', test);
  } catch (error) {
    results.push({ test, passed: false, message: String(error) });
    console.log('❌', test, '-', error);
  }
}

async function testWebsiteAPI() {
  console.log('🧪 Testing Website API Routes...\n');
  
  let createdId: string | null = null;
  
  // Test 1: POST - Create new website
  await logTest('POST /api/websites - Create website', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Website',
        description: 'A test website for API validation',
        category: 'test',
        metadata: { testKey: 'testValue' }
      })
    });
    
    const data = await res.json();
    createdId = data.data?.id;
    
    return res.status === 201 && data.data?.name === 'Test Website';
  });
  
  // Test 2: GET - List all websites
  await logTest('GET /api/websites - List all', async () => {
    const res = await fetch(BASE_URL);
    const data = await res.json();
    
    return res.status === 200 && Array.isArray(data.data);
  });
  
  // Test 3: GET - Get single website
  await logTest('GET /api/websites/[id] - Get single', async () => {
    if (!createdId) throw new Error('No ID from creation');
    
    const res = await fetch(`${BASE_URL}/${createdId}`);
    const data = await res.json();
    
    return res.status === 200 && data.data?.id === createdId;
  });
  
  // Test 4: PUT - Update website
  await logTest('PUT /api/websites/[id] - Update', async () => {
    if (!createdId) throw new Error('No ID from creation');
    
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Updated Website',
        description: 'Updated description'
      })
    });
    
    const data = await res.json();
    
    return res.status === 200 && data.data?.name === 'Updated Website';
  });
  
  // Test 5: Validation error - Empty name
  await logTest('POST /api/websites - Validation error (empty name)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        category: 'test'
      })
    });
    
    const data = await res.json();
    
    return res.status === 400 && data.error?.code === 'VALIDATION_ERROR';
  });
  
  // Test 6: Validation error - Missing category
  await logTest('POST /api/websites - Validation error (missing category)', async () => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Website'
      })
    });
    
    const data = await res.json();
    
    return res.status === 400 && data.error?.code === 'VALIDATION_ERROR';
  });
  
  // Test 7: Not found error
  await logTest('GET /api/websites/[id] - Not found', async () => {
    const res = await fetch(`${BASE_URL}/non-existent-id`);
    const data = await res.json();
    
    return res.status === 404 && data.error?.code === 'NOT_FOUND';
  });
  
  // Test 8: DELETE - Delete website
  await logTest('DELETE /api/websites/[id] - Delete', async () => {
    if (!createdId) throw new Error('No ID from creation');
    
    const res = await fetch(`${BASE_URL}/${createdId}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    return res.status === 200 && data.data?.message === 'Website deleted successfully';
  });
  
  // Test 9: Verify deletion
  await logTest('GET /api/websites/[id] - Verify deletion', async () => {
    if (!createdId) throw new Error('No ID from creation');
    
    const res = await fetch(`${BASE_URL}/${createdId}`);
    const data = await res.json();
    
    return res.status === 404 && data.error?.code === 'NOT_FOUND';
  });
  
  // Test 10: Verify /api/chat still works
  await logTest('GET /api/chat - Verify existing route', async () => {
    const res = await fetch('http://localhost:3000/api/chat');
    // We just check it doesn't 404 - the actual response might vary
    return res.status !== 404;
  });
  
  // Print summary
  console.log('\n📊 Test Results Summary:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}${r.message ? `: ${r.message}` : ''}`);
    });
  }
  
  return failed === 0;
}

// Run tests
testWebsiteAPI()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  });