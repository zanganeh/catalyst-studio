import { PrismaClient } from '@prisma/client';
import type { CreateContentItemRequest } from '@/types/api';

const prisma = new PrismaClient();

interface LegacyContentItem {
  id: string;
  contentTypeId: string;
  data: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  errors: string[];
}

async function getCurrentWebsiteId(): Promise<string | null> {
  // Try to get the first website or a default one
  const website = await prisma.website.findFirst();
  return website?.id || null;
}

async function migrateContentItems(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    itemsMigrated: 0,
    errors: [],
  };
  
  try {
    console.log('Starting content items migration...');
    
    // 1. Get website ID (required for content items)
    const websiteId = await getCurrentWebsiteId();
    if (!websiteId) {
      result.errors.push('No website found. Please create a website first.');
      return result;
    }
    
    console.log(`Using website ID: ${websiteId}`);
    
    // 2. Read from localStorage (in a browser context, this would be from the client)
    // For the script, we'll simulate reading from a JSON file or environment
    const storedData = process.env.CONTENT_ITEMS_JSON || '[]';
    let legacyItems: LegacyContentItem[] = [];
    
    try {
      legacyItems = JSON.parse(storedData);
      console.log(`Found ${legacyItems.length} items to migrate`);
    } catch (error) {
      result.errors.push(`Failed to parse legacy data: ${error}`);
      return result;
    }
    
    if (legacyItems.length === 0) {
      console.log('No items to migrate');
      result.success = true;
      return result;
    }
    
    // 3. Transform to database format
    const transformedItems: CreateContentItemRequest[] = legacyItems.map((item) => ({
      contentTypeId: item.contentTypeId,
      websiteId: websiteId,
      data: item.data,
      status: 'draft' as const,
      metadata: {},
      publishedAt: null,
    }));
    
    // 4. Batch insert using transaction
    console.log('Beginning database transaction...');
    
    const createdItems = await prisma.$transaction(
      transformedItems.map((item) =>
        prisma.contentItem.create({
          data: {
            contentTypeId: item.contentTypeId,
            websiteId: item.websiteId,
            slug: item.slug || undefined,
            data: JSON.stringify(item.data),
            metadata: item.metadata ? JSON.stringify(item.metadata) : undefined,
            status: item.status || 'draft',
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
          },
        })
      )
    );
    
    result.itemsMigrated = createdItems.length;
    result.success = true;
    
    console.log(`Successfully migrated ${result.itemsMigrated} content items`);
    
    // 5. Verify migration
    const count = await prisma.contentItem.count();
    console.log(`Total content items in database: ${count}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration error: ${error}`);
  } finally {
    await prisma.$disconnect();
  }
  
  return result;
}

// Rollback function if needed
async function rollbackMigration(websiteId: string): Promise<void> {
  try {
    console.log('Rolling back migration...');
    
    // Delete all content items for the website
    const deleted = await prisma.contentItem.deleteMany({
      where: { websiteId },
    });
    
    console.log(`Rolled back ${deleted.count} items`);
  } catch (error) {
    console.error('Rollback failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    const websiteId = process.argv[3];
    if (!websiteId) {
      console.error('Please provide a website ID for rollback');
      process.exit(1);
    }
    rollbackMigration(websiteId)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    migrateContentItems()
      .then((result) => {
        if (result.success) {
          console.log('Migration completed successfully');
          process.exit(0);
        } else {
          console.error('Migration failed:', result.errors);
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
      });
  }
}

export { migrateContentItems, rollbackMigration };