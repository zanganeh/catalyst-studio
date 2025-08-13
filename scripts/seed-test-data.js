/**
 * Seed script to create test data for E2E tests
 * Ensures consistent database state for testing
 */

const { PrismaClient } = require('../lib/generated/prisma');
const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  try {
    // Create a default test website if it doesn't exist
    const existingWebsite = await prisma.website.findFirst({
      where: {
        id: 'test_website_default'
      }
    });

    if (!existingWebsite) {
      const website = await prisma.website.create({
        data: {
          id: 'test_website_default',
          name: 'Default Test Website',
          description: 'Pre-seeded website for E2E testing',
          category: 'Testing',
          icon: '🧪',
          settings: JSON.stringify({
            theme: 'light',
            primaryColor: '#007bff'
          }),
          metadata: JSON.stringify({
            createdBy: 'seed-script',
            purpose: 'e2e-testing'
          })
        }
      });
      console.log('✅ Created default test website:', website.id);

      // Create a content type for the test website
      const contentType = await prisma.contentType.create({
        data: {
          websiteId: website.id,
          name: 'Seeded Blog Post',
          fields: JSON.stringify([
            { name: 'title', type: 'text', required: true, label: 'Title' },
            { name: 'content', type: 'richtext', required: true, label: 'Content' },
            { name: 'author', type: 'text', required: false, label: 'Author' },
            { name: 'publishDate', type: 'date', required: false, label: 'Publish Date' }
          ]),
          settings: JSON.stringify({
            singular: 'Blog Post',
            plural: 'Blog Posts',
            icon: '📝'
          })
        }
      });
      console.log('✅ Created content type:', contentType.name);

      // Create sample content items
      const contentItems = await Promise.all([
        prisma.contentItem.create({
          data: {
            websiteId: website.id,
            contentTypeId: contentType.id,
            slug: 'welcome-post',
            data: JSON.stringify({
              title: 'Welcome to Our Blog',
              content: 'This is the first blog post created by the seed script.',
              author: 'Admin',
              publishDate: new Date().toISOString()
            }),
            status: 'published',
            publishedAt: new Date(),
            metadata: JSON.stringify({
              seoTitle: 'Welcome - Test Blog',
              seoDescription: 'Welcome to our test blog'
            })
          }
        }),
        prisma.contentItem.create({
          data: {
            websiteId: website.id,
            contentTypeId: contentType.id,
            slug: 'draft-post',
            data: JSON.stringify({
              title: 'Draft Post Example',
              content: 'This post is still in draft status.',
              author: 'Editor'
            }),
            status: 'draft',
            metadata: JSON.stringify({
              notes: 'Needs review before publishing'
            })
          }
        })
      ]);
      console.log(`✅ Created ${contentItems.length} content items`);
    } else {
      console.log('ℹ️  Default test website already exists');
    }

    // Create additional test website with specific ID for content-builder tests
    const contentBuilderWebsite = await prisma.website.findFirst({
      where: {
        id: 'website_1755059624414_j16yjjrgg'
      }
    });

    if (!contentBuilderWebsite) {
      await prisma.website.create({
        data: {
          id: 'website_1755059624414_j16yjjrgg',
          name: 'Content Builder Test Website',
          description: 'Website specifically for content-builder route testing',
          category: 'Testing',
          icon: '🔨',
          settings: JSON.stringify({
            theme: 'dark',
            features: ['content-builder', 'ai-chat']
          })
        }
      });
      console.log('✅ Created content-builder test website');
    } else {
      console.log('ℹ️  Content-builder test website already exists');
    }

    console.log('\n✨ Test data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedTestData()
  .catch((error) => {
    console.error('Fatal error in seed script:', error);
    process.exit(1);
  });