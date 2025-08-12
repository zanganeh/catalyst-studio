import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create sample website
  const website = await prisma.website.create({
    data: {
      name: 'Sample Website',
      description: 'A sample website for development',
      category: 'Development',
      metadata: JSON.stringify({
        theme: 'default',
        settings: {
          enableComments: true,
          enableSearch: true
        }
      })
    }
  })

  console.log('Created website:', website.name)

  // Create sample content type
  const contentType = await prisma.contentType.create({
    data: {
      websiteId: website.id,
      name: 'Blog Post',
      fields: JSON.stringify([
        { name: 'title', type: 'string', required: true },
        { name: 'content', type: 'text', required: true },
        { name: 'author', type: 'string', required: true },
        { name: 'tags', type: 'array', required: false }
      ]),
      settings: JSON.stringify({
        allowComments: true,
        requireApproval: false
      })
    }
  })

  console.log('Created content type:', contentType.name)

  // Create sample content items
  const contentItem = await prisma.contentItem.create({
    data: {
      contentTypeId: contentType.id,
      websiteId: website.id,
      data: JSON.stringify({
        title: 'Welcome to Catalyst Studio',
        content: 'This is your first blog post in Catalyst Studio!',
        author: 'System Admin',
        tags: ['welcome', 'getting-started']
      }),
      status: 'published'
    }
  })

  console.log('Created content item')

  console.log('Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })