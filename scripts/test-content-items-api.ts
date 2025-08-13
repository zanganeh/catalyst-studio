import { ContentItem, CreateContentItemRequest } from '@/types/api';

const API_BASE = 'http://localhost:3000/api';

async function testAPI() {
  console.log('Testing Content Items API...\n');
  
  const websiteId = 'test-website-id';
  const contentTypeId = 'test-content-type-id';
  let createdItemId: string;
  
  try {
    // Test 1: Create content item
    console.log('1. Testing CREATE...');
    const createData: CreateContentItemRequest = {
      contentTypeId,
      websiteId,
      slug: 'test-item',
      data: { title: 'Test Item', content: 'Test content' },
      metadata: { seo: 'test' },
      status: 'draft',
    };
    
    const createRes = await fetch(`${API_BASE}/content-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData),
    });
    
    if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`);
    const created = await createRes.json();
    createdItemId = created.data.id;
    console.log('✓ Created item:', createdItemId);
    
    // Test 2: Get single item
    console.log('\n2. Testing GET single...');
    const getRes = await fetch(`${API_BASE}/content-items/${createdItemId}`);
    if (!getRes.ok) throw new Error(`Get failed: ${getRes.status}`);
    console.log('✓ Retrieved item');
    
    // Test 3: Update item
    console.log('\n3. Testing UPDATE...');
    const updateRes = await fetch(`${API_BASE}/content-items/${createdItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { title: 'Updated Title', content: 'Updated content' },
        status: 'published',
      }),
    });
    if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
    console.log('✓ Updated item');
    
    // Test 4: Get paginated list
    console.log('\n4. Testing GET list with pagination...');
    const listRes = await fetch(`${API_BASE}/content-items?page=1&limit=10`);
    if (!listRes.ok) throw new Error(`List failed: ${listRes.status}`);
    const list = await listRes.json();
    console.log(`✓ Retrieved ${list.data.length} items (page ${list.pagination.page}/${list.pagination.totalPages})`);
    
    // Test 5: Bulk create
    console.log('\n5. Testing BULK CREATE...');
    const bulkItems = Array.from({ length: 5 }, (_, i) => ({
      contentTypeId,
      websiteId,
      data: { title: `Bulk Item ${i + 1}` },
      status: 'draft' as const,
    }));
    
    const bulkRes = await fetch(`${API_BASE}/content-items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: bulkItems }),
    });
    if (!bulkRes.ok) throw new Error(`Bulk create failed: ${bulkRes.status}`);
    const bulkCreated = await bulkRes.json();
    console.log(`✓ Created ${bulkCreated.data.length} items in bulk`);
    
    // Test 6: Archive (soft delete)
    console.log('\n6. Testing DELETE (archive)...');
    const deleteRes = await fetch(`${API_BASE}/content-items/${createdItemId}`, {
      method: 'DELETE',
    });
    if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
    console.log('✓ Archived item');
    
    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  testAPI();
}