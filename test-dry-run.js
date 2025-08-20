// Test script for dry run mode
import { OptimizelyProvider } from './lib/providers/optimizely/OptimizelyProvider.js';

async function testDryRun() {
  console.log('Testing Dry Run Mode Implementation\n');
  console.log('=====================================\n');
  
  // Create provider instance
  const provider = new OptimizelyProvider();
  
  // Enable dry run mode
  console.log('1. Enabling dry run mode...');
  provider.setDryRun(true);
  
  // Test getting content types
  console.log('\n2. Testing getContentTypes()...');
  const types = await provider.getContentTypes();
  console.log(`   Result: ${types.length} types returned`);
  
  // Test creating a content type
  console.log('\n3. Testing createContentType()...');
  const newType = {
    id: 'TestPage',
    name: 'Test Page',
    description: 'Test content type',
    type: 'page',
    fields: [
      { id: 'title', name: 'Title', type: 'text', required: true }
    ]
  };
  
  try {
    const created = await provider.createContentType(newType);
    console.log(`   Result: Created type with id: ${created.id}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test updating a content type
  console.log('\n4. Testing updateContentType()...');
  try {
    const updated = await provider.updateContentType('TestPage', newType);
    console.log(`   Result: Updated type with id: ${updated.id}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test deleting a content type  
  console.log('\n5. Testing deleteContentType()...');
  try {
    const deleted = await provider.deleteContentType('TestPage');
    console.log(`   Result: Deletion status: ${deleted}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n=====================================');
  console.log('Dry run test completed successfully!');
}

// Run the test
testDryRun().catch(console.error);