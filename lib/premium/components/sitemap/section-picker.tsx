'use client'

import React, { useState } from 'react'
import { X, Plus, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionData {
  id: string
  name: string
  category: string
  description?: string
  instances?: number
  preview?: string
}

// Global sections with instance counts
const globalSections: SectionData[] = [
  { id: 'navbar-global', name: 'Navbar', category: 'global', instances: 1 },
  { id: 'footer-global', name: 'Footer', category: 'global', instances: 57 },
  { id: 'navbar-2-global', name: 'Navbar', category: 'global', instances: 56 },
  { id: 'navbar-3-global', name: 'Navbar', category: 'global', instances: 1 },
]

// Categories with their sections - Complete list from screenshots
const sectionCategories = {
  'Blank Section': [],
  'Navbar': [],
  'Footer': [],
  'Hero Header': [],
  'Header': [],
  'Feature': [],
  'Features List': [],
  'How It Works': [],
  'Benefits': [],
  'About': [],
  'CTA': [],
  'Contact': [],
  'Pricing': [],
  'Testimonial': [],
  'FAQ': [],
  'Logo List': [],
  'Gallery': [],
  'Team': [],
  'Job Listings': [],
  'Blog List Header': [],
  'Blog List': [],
  'Blog Post Header': [],
  'Blog Post Body': [],
  'Portfolio List': [],
  'Portfolio Item Header': [],
  'Portfolio Item Body': [],
  'Products List': [],
  'Product Header': [],
  'Announcement Banner': [],
}

// Preview sections data - showing key sections from the screenshots
const previewSections = [
  {
    id: 'about',
    name: 'About Section',
    description: 'Provide information about the company!',
  },
  {
    id: 'how-it-works',
    name: 'How It Works Section',
    description: 'Discover how Bathurst City Centre can meet all your shopping, dining, and entertainment needs.',
  },
  {
    id: 'feature',
    name: 'Feature Section',
    description: 'Describe a feature and its benefits',
  },
  {
    id: 'features-list',
    name: 'Features List Section',
    description: 'Highlight key features like ample parking, diverse shopping options, and family-friendly amenities.',
  },
  {
    id: 'cta',
    name: 'CTA Section',
    description: 'Visit us today and experience the best of Bathurst City Centre!',
  },
  {
    id: 'blog-list',
    name: 'Blog List Section',
    description: 'Stay updated with the latest news, events, and promotions happening at Bathurst City Centre.',
  },
  {
    id: 'footer',
    name: 'Footer',
    description: '',
  },
  {
    id: 'navbar',
    name: 'Navbar',
    description: '',
  },
  {
    id: 'project-header',
    name: 'Project Item Header Section',
    description: 'Curated offers exceptional value in item\'s fashion with a focus on quality and measurable style.',
  },
  {
    id: 'ecommerce-header',
    name: 'Ecommerce Product Header Section',
    description: 'Ally Fashion-forward, affordable styles that embrace fun and individuality.',
  },
  {
    id: 'ecommerce-product',
    name: 'Ecommerce Product Section',
    description: 'Explore our selection of local and trendy.',
  },
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Main hero section with compelling headline and call to action.',
  },
  {
    id: 'benefits',
    name: 'Benefits Section',
    description: 'Showcase the key benefits and advantages.',
  },
  {
    id: 'testimonial',
    name: 'Testimonial Section',
    description: 'Display customer testimonials and reviews.',
  },
  {
    id: 'pricing',
    name: 'Pricing Section',
    description: 'Present pricing plans and packages.',
  },
  {
    id: 'contact',
    name: 'Contact Section',
    description: 'Contact form and information.',
  },
  {
    id: 'faq',
    name: 'FAQ Section',
    description: 'Frequently asked questions and answers.',
  },
  {
    id: 'gallery',
    name: 'Gallery Section',
    description: 'Image gallery showcase.',
  },
  {
    id: 'team',
    name: 'Team Section',
    description: 'Meet the team members.',
  },
  {
    id: 'portfolio',
    name: 'Portfolio List',
    description: 'Showcase portfolio items and projects.',
  },
  {
    id: 'products',
    name: 'Products List',
    description: 'Display product catalog.',
  },
]

interface SectionPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectSection: (sectionName: string) => void
  nodeId?: string
}

export function SectionPicker({ isOpen, onClose, onSelectSection, nodeId }: SectionPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null)

  // Filter sections based on search query
  const filteredGlobalSections = globalSections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCategories = Object.entries(sectionCategories).filter(([category]) =>
    category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredPreviewSections = previewSections.filter(section =>
    section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleSelectSection = (sectionName: string) => {
    onSelectSection(sectionName)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Click outside to close */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-y-0 left-0 z-50 pointer-events-none">
        {/* Left Panel */}
        <div className="w-[320px] bg-gray-900/95 backdrop-blur-md shadow-2xl pointer-events-auto flex flex-col h-full border-r border-white/10">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Add Section</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/50 focus:border-[#FF5500]/50 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* No results message */}
            {searchQuery && filteredGlobalSections.length === 0 && filteredCategories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No sections found for "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[#FF5500] text-sm mt-2 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}

            {/* Global Sections */}
            {filteredGlobalSections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Global sections
                </h3>
                <div className="space-y-2">
                  {filteredGlobalSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSelectSection(section.name)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF5500]/50 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/20 rounded flex items-center justify-center">
                        <div className="w-4 h-4 bg-emerald-500 rounded-sm" />
                      </div>
                      <span className="text-sm font-medium text-gray-200">{section.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{section.instances} instance{section.instances !== 1 ? 's' : ''}</span>
                      <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {filteredCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  {filteredCategories.map(([category, sections]) => (
                  <div key={category} className="border border-white/10 rounded-lg overflow-hidden bg-white/5">
                    <button
                      onClick={() => {
                        // If category has no sub-sections, add it directly
                        if (sections.length === 0) {
                          handleSelectSection(category)
                        } else {
                          // Otherwise toggle to show sub-sections
                          toggleCategory(category)
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                          <div className="w-4 h-4 bg-gray-500 rounded-sm" />
                        </div>
                        <span className="text-sm font-medium text-gray-200">{category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sections.length > 0 && (
                          <span className="text-xs text-gray-500">{sections.length}</span>
                        )}
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#FF5500] transition-colors" />
                      </div>
                    </button>
                    
                    {expandedCategories.has(category) && sections.length > 0 && (
                      <div className="border-t border-white/10 bg-black/20 p-2">
                        {sections.map((section) => (
                          <button
                            key={section.id}
                            onClick={() => handleSelectSection(section.name)}
                            className="w-full text-left p-2 hover:bg-white/10 rounded transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-300">{section.name}</div>
                            {section.description && (
                              <div className="text-xs text-gray-500 mt-1">{section.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}