import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')
  
  // Clean existing data
  await prisma.aIContext.deleteMany()
  await prisma.contentItem.deleteMany()
  await prisma.contentType.deleteMany()
  await prisma.website.deleteMany()
  
  console.log('✨ Cleaned existing data')
  
  // Create websites
  const techBlog = await prisma.website.create({
    data: {
      name: 'TechVerse Blog',
      description: 'A technology blog covering the latest in software development',
      category: 'Technology',
      icon: '💻',
      metadata: JSON.stringify({
        domain: 'techverse.example.com',
        language: 'en',
        timezone: 'UTC',
        analytics: 'GA-123456789'
      }),
      settings: JSON.stringify({
        theme: 'dark',
        features: ['comments', 'search', 'newsletter'],
        seo: {
          defaultTitle: 'TechVerse - Software Development Blog',
          defaultDescription: 'Latest articles on web development, AI, and cloud computing'
        }
      }),
      isActive: true
    }
  })
  
  const ecommerce = await prisma.website.create({
    data: {
      name: 'ShopFlow Store',
      description: 'Modern e-commerce platform for digital products',
      category: 'E-commerce',
      icon: '🛍️',
      metadata: JSON.stringify({
        domain: 'shopflow.example.com',
        language: 'en',
        currency: 'USD',
        timezone: 'America/New_York'
      }),
      settings: JSON.stringify({
        theme: 'light',
        features: ['cart', 'wishlist', 'reviews', 'recommendations'],
        payment: {
          providers: ['stripe', 'paypal'],
          taxCalculation: 'automatic'
        }
      }),
      isActive: true
    }
  })
  
  const portfolio = await prisma.website.create({
    data: {
      name: 'Creative Portfolio',
      description: 'Designer portfolio showcasing digital art and UX projects',
      category: 'Portfolio',
      icon: '🎨',
      metadata: JSON.stringify({
        domain: 'creative.example.com',
        language: 'en',
        owner: 'Jane Designer',
        social: {
          twitter: '@janedesigner',
          linkedin: 'jane-designer',
          dribbble: 'janedesigner'
        }
      }),
      settings: JSON.stringify({
        theme: 'minimal',
        features: ['gallery', 'contact', 'testimonials'],
        display: {
          layout: 'grid',
          animations: true,
          lightbox: true
        }
      }),
      isActive: true
    }
  })
  
  console.log('✅ Created 3 websites')
  
  // Create content types for tech blog
  const blogPost = await prisma.contentType.create({
    data: {
      websiteId: techBlog.id,
      key: 'blog-post',
      name: 'Blog Post',
      pluralName: 'Blog Posts',
      displayField: 'title',
      fields: JSON.stringify([
        { name: 'title', type: 'text', required: true, maxLength: 200 },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'excerpt', type: 'textarea', required: true, maxLength: 500 },
        { name: 'content', type: 'richtext', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'category', type: 'select', options: ['JavaScript', 'Python', 'DevOps', 'AI/ML', 'Web Development'] },
        { name: 'tags', type: 'array', itemType: 'text' },
        { name: 'featuredImage', type: 'image', required: false },
        { name: 'publishDate', type: 'datetime', required: true },
        { name: 'readTime', type: 'number', min: 1, max: 60 }
      ]),
      schema: JSON.stringify({
        displayName: 'Blog Posts',
        icon: '📝',
        defaultStatus: 'draft',
        enableComments: true,
        enableSearch: true
      })
    }
  })
  
  const author = await prisma.contentType.create({
    data: {
      websiteId: techBlog.id,
      key: 'author',
      name: 'Author',
      pluralName: 'Authors',
      displayField: 'name',
      fields: JSON.stringify([
        { name: 'name', type: 'text', required: true },
        { name: 'bio', type: 'textarea', required: true },
        { name: 'avatar', type: 'image', required: false },
        { name: 'email', type: 'email', required: true },
        { name: 'social', type: 'object', fields: [
          { name: 'twitter', type: 'text' },
          { name: 'github', type: 'text' },
          { name: 'linkedin', type: 'text' }
        ]}
      ]),
      schema: JSON.stringify({
        displayName: 'Authors',
        icon: '👤',
        singleton: false
      })
    }
  })
  
  // Create content types for e-commerce
  const product = await prisma.contentType.create({
    data: {
      websiteId: ecommerce.id,
      key: 'product',
      name: 'Product',
      pluralName: 'Products',
      displayField: 'name',
      fields: JSON.stringify([
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'description', type: 'richtext', required: true },
        { name: 'price', type: 'number', required: true, min: 0 },
        { name: 'comparePrice', type: 'number', required: false, min: 0 },
        { name: 'sku', type: 'text', required: true, unique: true },
        { name: 'inventory', type: 'number', required: true, min: 0 },
        { name: 'category', type: 'select', options: ['Electronics', 'Books', 'Courses', 'Templates'] },
        { name: 'images', type: 'array', itemType: 'image', maxItems: 10 },
        { name: 'features', type: 'array', itemType: 'text' },
        { name: 'digital', type: 'boolean', default: true }
      ]),
      schema: JSON.stringify({
        displayName: 'Products',
        icon: '📦',
        enableSearch: true,
        enableFilters: true
      })
    }
  })
  
  // Create content types for portfolio
  const project = await prisma.contentType.create({
    data: {
      websiteId: portfolio.id,
      key: 'project',
      name: 'Project',
      pluralName: 'Projects',
      displayField: 'title',
      fields: JSON.stringify([
        { name: 'title', type: 'text', required: true },
        { name: 'client', type: 'text', required: false },
        { name: 'year', type: 'number', required: true, min: 2020, max: 2030 },
        { name: 'description', type: 'richtext', required: true },
        { name: 'role', type: 'text', required: true },
        { name: 'technologies', type: 'array', itemType: 'text' },
        { name: 'images', type: 'array', itemType: 'image' },
        { name: 'link', type: 'url', required: false },
        { name: 'featured', type: 'boolean', default: false },
        { name: 'category', type: 'select', options: ['Web Design', 'Mobile App', 'Branding', 'UI/UX'] }
      ]),
      schema: JSON.stringify({
        displayName: 'Portfolio Projects',
        icon: '🎯',
        sortBy: 'year',
        sortOrder: 'desc'
      })
    }
  })
  
  console.log('✅ Created 4 content types')
  
  // Create content items for blog
  const blogPosts = [
    {
      contentTypeId: blogPost.id,
      websiteId: techBlog.id,
      slug: 'getting-started-with-nextjs-14',
      status: 'published',
      publishedAt: new Date('2024-01-15'),
      data: JSON.stringify({
        title: 'Getting Started with Next.js 14',
        slug: 'getting-started-with-nextjs-14',
        excerpt: 'Learn the fundamentals of Next.js 14 and build your first full-stack application with the App Router.',
        content: '<h2>Introduction</h2><p>Next.js 14 brings exciting new features including...</p>',
        author: 'Alex Developer',
        category: 'Web Development',
        tags: ['Next.js', 'React', 'TypeScript', 'Web Development'],
        featuredImage: '/images/nextjs-14-hero.jpg',
        publishDate: '2024-01-15T10:00:00Z',
        readTime: 8
      }),
      metadata: JSON.stringify({
        views: 1250,
        likes: 89,
        comments: 12
      })
    },
    {
      contentTypeId: blogPost.id,
      websiteId: techBlog.id,
      slug: 'understanding-react-server-components',
      status: 'published',
      publishedAt: new Date('2024-01-20'),
      data: JSON.stringify({
        title: 'Understanding React Server Components',
        slug: 'understanding-react-server-components',
        excerpt: 'Deep dive into React Server Components and how they change the way we build React applications.',
        content: '<h2>What are Server Components?</h2><p>React Server Components represent a new paradigm...</p>',
        author: 'Sarah Engineer',
        category: 'JavaScript',
        tags: ['React', 'RSC', 'Performance', 'JavaScript'],
        featuredImage: '/images/rsc-explained.jpg',
        publishDate: '2024-01-20T14:30:00Z',
        readTime: 12
      }),
      metadata: JSON.stringify({
        views: 980,
        likes: 67,
        comments: 8
      })
    },
    {
      contentTypeId: blogPost.id,
      websiteId: techBlog.id,
      slug: 'ai-powered-code-review',
      status: 'draft',
      data: JSON.stringify({
        title: 'AI-Powered Code Review: The Future of Development',
        slug: 'ai-powered-code-review',
        excerpt: 'Exploring how AI tools are revolutionizing code review processes and improving code quality.',
        content: '<h2>The Evolution of Code Review</h2><p>Traditional code review has been...</p>',
        author: 'Mike Tech',
        category: 'AI/ML',
        tags: ['AI', 'Code Review', 'Development Tools', 'Automation'],
        featuredImage: '/images/ai-code-review.jpg',
        publishDate: '2024-02-01T09:00:00Z',
        readTime: 10
      })
    }
  ]
  
  for (const post of blogPosts) {
    const postData = JSON.parse(post.data);
    const { data, ...postWithoutData } = post;
    await prisma.contentItem.create({ 
      data: {
        ...postWithoutData,
        title: postData.title,
        content: data
      }
    })
  }
  
  console.log('✅ Created 3 blog posts')
  
  // Create products for e-commerce
  const products = [
    {
      contentTypeId: product.id,
      websiteId: ecommerce.id,
      slug: 'javascript-masterclass',
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        name: 'JavaScript Masterclass Course',
        slug: 'javascript-masterclass',
        description: '<p>Complete JavaScript course from basics to advanced concepts including ES6+, async programming, and more.</p>',
        price: 89.99,
        comparePrice: 149.99,
        sku: 'COURSE-JS-001',
        inventory: 999,
        category: 'Courses',
        images: ['/products/js-course-1.jpg', '/products/js-course-2.jpg'],
        features: ['30 hours of video content', 'Lifetime access', 'Certificate of completion', 'Source code included'],
        digital: true
      }),
      metadata: JSON.stringify({
        sales: 145,
        rating: 4.8,
        reviews: 42
      })
    },
    {
      contentTypeId: product.id,
      websiteId: ecommerce.id,
      slug: 'react-component-library',
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        name: 'React Component Library Pro',
        slug: 'react-component-library',
        description: '<p>Premium React component library with 100+ customizable components for modern web applications.</p>',
        price: 49.99,
        sku: 'TEMPLATE-REACT-001',
        inventory: 999,
        category: 'Templates',
        images: ['/products/react-lib-1.jpg', '/products/react-lib-2.jpg'],
        features: ['100+ components', 'TypeScript support', 'Dark mode', 'Figma files included', 'Regular updates'],
        digital: true
      }),
      metadata: JSON.stringify({
        sales: 89,
        rating: 4.9,
        reviews: 28
      })
    }
  ]
  
  for (const prod of products) {
    const prodData = JSON.parse(prod.data);
    const { data, ...prodWithoutData } = prod;
    await prisma.contentItem.create({ 
      data: {
        ...prodWithoutData,
        title: prodData.name,
        content: data
      }
    })
  }
  
  console.log('✅ Created 2 products')
  
  // Create portfolio projects
  const projects = [
    {
      contentTypeId: project.id,
      websiteId: portfolio.id,
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        title: 'E-Commerce Platform Redesign',
        client: 'TechMart Inc.',
        year: 2024,
        description: '<p>Complete redesign of an e-commerce platform focusing on improved UX and conversion optimization.</p>',
        role: 'Lead UI/UX Designer',
        technologies: ['Figma', 'React', 'Next.js', 'Tailwind CSS'],
        images: ['/portfolio/ecommerce-1.jpg', '/portfolio/ecommerce-2.jpg'],
        link: 'https://techmart.example.com',
        featured: true,
        category: 'Web Design'
      })
    },
    {
      contentTypeId: project.id,
      websiteId: portfolio.id,
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        title: 'Mobile Banking App',
        client: 'FinanceFlow',
        year: 2023,
        description: '<p>Designed a modern mobile banking application with focus on accessibility and security.</p>',
        role: 'UI/UX Designer',
        technologies: ['Sketch', 'React Native', 'Principle'],
        images: ['/portfolio/banking-1.jpg', '/portfolio/banking-2.jpg'],
        link: null,
        featured: true,
        category: 'Mobile App'
      })
    }
  ]
  
  for (const proj of projects) {
    const projData = JSON.parse(proj.data);
    const { data, ...projWithoutData } = proj;
    await prisma.contentItem.create({ 
      data: {
        ...projWithoutData,
        title: projData.title,
        content: data,
        slug: projData.title.toLowerCase().replace(/\s+/g, '-')
      }
    })
  }
  
  console.log('✅ Created 2 portfolio projects')
  
  // Create AI contexts
  const aiContexts = [
    {
      websiteId: techBlog.id,
      sessionId: 'session-blog-001',
      messages: JSON.stringify([
        { role: 'user', content: 'Help me write a blog post about React hooks' },
        { role: 'assistant', content: 'I can help you write a comprehensive blog post about React hooks. Let me structure it for you...' },
        { role: 'user', content: 'Focus on useState and useEffect' },
        { role: 'assistant', content: 'Great! Let\'s create a detailed guide on useState and useEffect hooks with practical examples...' }
      ]),
      metadata: JSON.stringify({
        model: 'gpt-4',
        totalTokens: 1250,
        temperature: 0.7,
        context: 'Blog content creation'
      }),
      summary: 'Discussion about creating React hooks blog post focusing on useState and useEffect',
      isActive: true
    },
    {
      websiteId: ecommerce.id,
      sessionId: 'session-shop-001',
      messages: JSON.stringify([
        { role: 'user', content: 'Generate product descriptions for a new tech gadget' },
        { role: 'assistant', content: 'I\'ll create compelling product descriptions for your tech gadget. Could you provide more details about the product?' },
        { role: 'user', content: 'It\'s a smart home assistant device' },
        { role: 'assistant', content: 'Perfect! Here\'s a compelling product description for your smart home assistant...' }
      ]),
      metadata: JSON.stringify({
        model: 'gpt-3.5-turbo',
        totalTokens: 800,
        temperature: 0.8,
        context: 'Product content generation'
      }),
      summary: 'Product description generation for smart home assistant device',
      isActive: false
    },
    {
      websiteId: portfolio.id,
      sessionId: 'session-portfolio-001',
      messages: JSON.stringify([
        { role: 'user', content: 'Help me write a case study for my latest project' },
        { role: 'assistant', content: 'I\'d be happy to help you create a compelling case study. Let\'s start with the project overview...' }
      ]),
      metadata: JSON.stringify({
        model: 'gpt-4',
        totalTokens: 450,
        temperature: 0.6,
        context: 'Portfolio case study creation'
      }),
      summary: 'Case study creation assistance for portfolio project',
      isActive: true
    }
  ]
  
  for (const aiContext of aiContexts) {
    const { messages, summary, isActive, ...contextData } = aiContext;
    await prisma.aIContext.create({ 
      data: {
        ...contextData,
        context: JSON.parse(messages)
      }
    })
  }
  
  console.log('✅ Created 3 AI contexts')
  
  // Create author content items
  const authors = [
    {
      contentTypeId: author.id,
      websiteId: techBlog.id,
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        name: 'Alex Developer',
        bio: 'Full-stack developer with 10+ years of experience in web technologies. Passionate about React, Node.js, and cloud architecture.',
        avatar: '/authors/alex.jpg',
        email: 'alex@techverse.com',
        social: {
          twitter: '@alexdev',
          github: 'alexdeveloper',
          linkedin: 'alex-developer'
        }
      })
    },
    {
      contentTypeId: author.id,
      websiteId: techBlog.id,
      status: 'published',
      publishedAt: new Date(),
      data: JSON.stringify({
        name: 'Sarah Engineer',
        bio: 'Senior software engineer specializing in React and TypeScript. Conference speaker and open source contributor.',
        avatar: '/authors/sarah.jpg',
        email: 'sarah@techverse.com',
        social: {
          twitter: '@saraheng',
          github: 'sarahengineer',
          linkedin: 'sarah-engineer'
        }
      })
    }
  ]
  
  for (const auth of authors) {
    const authData = JSON.parse(auth.data);
    const { data, ...authWithoutData } = auth;
    await prisma.contentItem.create({ 
      data: {
        ...authWithoutData,
        title: authData.name,
        slug: authData.name.toLowerCase().replace(/\s+/g, '-'),
        content: data
      }
    })
  }
  
  console.log('✅ Created 2 authors')
  
  console.log('\n🎉 Database seeding completed successfully!')
  console.log('📊 Summary:')
  console.log('  - 3 Websites')
  console.log('  - 4 Content Types')
  console.log('  - 9 Content Items')
  console.log('  - 3 AI Contexts')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })