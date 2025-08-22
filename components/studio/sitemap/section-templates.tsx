'use client'

import { 
  Flag, 
  Grid3x3, 
  MessageSquare, 
  ArrowRight, 
  Users, 
  Image, 
  PlayCircle, 
  Mail, 
  MapPin, 
  Package,
  FileText,
  DollarSign,
  HelpCircle,
  Newspaper,
  BarChart,
  Shield,
  Star,
  Clock,
  Award,
  Briefcase,
  Settings,
  Search,
  ShoppingCart,
  Heart,
  Share2,
  Download,
  Upload,
  Zap,
  Layers
} from 'lucide-react'

export interface SectionTemplate {
  id: string
  name: string
  category: 'hero' | 'content' | 'features' | 'social' | 'commerce' | 'navigation' | 'footer'
  icon: any
  description: string
  estimatedContent: {
    images: number | string
    text: number
    videos?: number
  }
  defaultProps?: {
    background?: 'light' | 'dark' | 'gradient'
    layout?: 'centered' | 'split' | 'grid' | 'carousel'
  }
}

export const sectionTemplates: SectionTemplate[] = [
  // Hero Sections
  {
    id: 'hero-basic',
    name: 'Hero Section',
    category: 'hero',
    icon: Flag,
    description: 'Main landing area with headline and CTA',
    estimatedContent: { images: 1, text: 150 },
    defaultProps: { background: 'gradient', layout: 'centered' }
  },
  {
    id: 'hero-split',
    name: 'Split Hero',
    category: 'hero',
    icon: Flag,
    description: 'Hero with text on one side, image on other',
    estimatedContent: { images: 1, text: 200 },
    defaultProps: { background: 'light', layout: 'split' }
  },
  {
    id: 'hero-video',
    name: 'Video Hero',
    category: 'hero',
    icon: PlayCircle,
    description: 'Hero section with background video',
    estimatedContent: { images: 0, text: 100, videos: 1 },
    defaultProps: { background: 'dark', layout: 'centered' }
  },
  
  // Features Sections
  {
    id: 'features-grid',
    name: 'Features Grid',
    category: 'features',
    icon: Grid3x3,
    description: 'Grid layout showcasing features',
    estimatedContent: { images: '3-6', text: 300 },
    defaultProps: { layout: 'grid' }
  },
  {
    id: 'features-carousel',
    name: 'Features Carousel',
    category: 'features',
    icon: Grid3x3,
    description: 'Sliding carousel of features',
    estimatedContent: { images: '4-8', text: 400 },
    defaultProps: { layout: 'carousel' }
  },
  {
    id: 'features-list',
    name: 'Features List',
    category: 'features',
    icon: FileText,
    description: 'Vertical list of features with icons',
    estimatedContent: { images: 0, text: 500 },
    defaultProps: { layout: 'centered' }
  },
  
  // Content Sections
  {
    id: 'about',
    name: 'About Section',
    category: 'content',
    icon: Users,
    description: 'Company or product information',
    estimatedContent: { images: 1, text: 400 }
  },
  {
    id: 'mission',
    name: 'Mission Statement',
    category: 'content',
    icon: Award,
    description: 'Company mission and values',
    estimatedContent: { images: 0, text: 300 }
  },
  {
    id: 'team',
    name: 'Team Section',
    category: 'content',
    icon: Users,
    description: 'Team member profiles',
    estimatedContent: { images: '4-12', text: 600 },
    defaultProps: { layout: 'grid' }
  },
  {
    id: 'timeline',
    name: 'Timeline',
    category: 'content',
    icon: Clock,
    description: 'Company history or project timeline',
    estimatedContent: { images: 0, text: 800 }
  },
  {
    id: 'stats',
    name: 'Statistics',
    category: 'content',
    icon: BarChart,
    description: 'Key metrics and numbers',
    estimatedContent: { images: 0, text: 200 }
  },
  
  // Social Proof
  {
    id: 'testimonials',
    name: 'Testimonials',
    category: 'social',
    icon: MessageSquare,
    description: 'Customer reviews and testimonials',
    estimatedContent: { images: '3-6', text: 450 },
    defaultProps: { layout: 'carousel' }
  },
  {
    id: 'case-studies',
    name: 'Case Studies',
    category: 'social',
    icon: Briefcase,
    description: 'Detailed success stories',
    estimatedContent: { images: '2-4', text: 1200 }
  },
  {
    id: 'logos',
    name: 'Client Logos',
    category: 'social',
    icon: Award,
    description: 'Grid of client or partner logos',
    estimatedContent: { images: '6-12', text: 50 }
  },
  {
    id: 'reviews',
    name: 'Reviews',
    category: 'social',
    icon: Star,
    description: 'Product or service reviews',
    estimatedContent: { images: 0, text: 600 }
  },
  
  // Commerce
  {
    id: 'pricing',
    name: 'Pricing Tables',
    category: 'commerce',
    icon: DollarSign,
    description: 'Pricing plans and options',
    estimatedContent: { images: 0, text: 500 },
    defaultProps: { layout: 'grid' }
  },
  {
    id: 'products',
    name: 'Product Grid',
    category: 'commerce',
    icon: Package,
    description: 'Product showcase grid',
    estimatedContent: { images: '6-12', text: 600 },
    defaultProps: { layout: 'grid' }
  },
  {
    id: 'cart',
    name: 'Shopping Cart',
    category: 'commerce',
    icon: ShoppingCart,
    description: 'Shopping cart summary',
    estimatedContent: { images: 0, text: 200 }
  },
  
  // Navigation & CTA
  {
    id: 'cta',
    name: 'Call to Action',
    category: 'navigation',
    icon: ArrowRight,
    description: 'Conversion-focused section',
    estimatedContent: { images: 0, text: 50 },
    defaultProps: { background: 'gradient' }
  },
  {
    id: 'contact',
    name: 'Contact Form',
    category: 'navigation',
    icon: Mail,
    description: 'Contact form with fields',
    estimatedContent: { images: 0, text: 150 }
  },
  {
    id: 'map',
    name: 'Location Map',
    category: 'navigation',
    icon: MapPin,
    description: 'Interactive map with location',
    estimatedContent: { images: 1, text: 100 }
  },
  {
    id: 'search',
    name: 'Search Section',
    category: 'navigation',
    icon: Search,
    description: 'Search functionality',
    estimatedContent: { images: 0, text: 50 }
  },
  {
    id: 'newsletter',
    name: 'Newsletter Signup',
    category: 'navigation',
    icon: Mail,
    description: 'Email subscription form',
    estimatedContent: { images: 0, text: 100 }
  },
  {
    id: 'faq',
    name: 'FAQ Section',
    category: 'content',
    icon: HelpCircle,
    description: 'Frequently asked questions',
    estimatedContent: { images: 0, text: 1000 }
  },
  {
    id: 'blog',
    name: 'Blog Posts',
    category: 'content',
    icon: Newspaper,
    description: 'Latest blog articles',
    estimatedContent: { images: '3-6', text: 600 },
    defaultProps: { layout: 'grid' }
  },
  {
    id: 'gallery',
    name: 'Image Gallery',
    category: 'content',
    icon: Image,
    description: 'Photo or portfolio gallery',
    estimatedContent: { images: '8-20', text: 100 },
    defaultProps: { layout: 'grid' }
  },
  
  // Footer
  {
    id: 'footer',
    name: 'Footer',
    category: 'footer',
    icon: Layers,
    description: 'Site footer with links and info',
    estimatedContent: { images: 0, text: 200 }
  },
  {
    id: 'footer-minimal',
    name: 'Minimal Footer',
    category: 'footer',
    icon: Layers,
    description: 'Simple footer with copyright',
    estimatedContent: { images: 0, text: 50 }
  }
]

export function getSectionsByCategory(category: string) {
  return sectionTemplates.filter(t => t.category === category)
}

export function getSectionById(id: string) {
  return sectionTemplates.find(t => t.id === id)
}

export function estimateTotalContent(sections: string[]) {
  let totalImages = 0
  let totalText = 0
  let totalVideos = 0
  
  sections.forEach(sectionName => {
    const template = sectionTemplates.find(t => 
      t.name.toLowerCase() === sectionName.toLowerCase()
    )
    
    if (template) {
      if (typeof template.estimatedContent.images === 'string') {
        const [min, max] = template.estimatedContent.images.split('-').map(Number)
        totalImages += Math.ceil((min + max) / 2)
      } else {
        totalImages += template.estimatedContent.images
      }
      
      totalText += template.estimatedContent.text
      totalVideos += template.estimatedContent.videos || 0
    }
  })
  
  return { totalImages, totalText, totalVideos }
}