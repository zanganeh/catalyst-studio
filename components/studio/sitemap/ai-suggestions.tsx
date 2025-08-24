import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Sparkles, Zap, TrendingUp, Shield, Globe, 
  ShoppingCart, Users, FileText, Layers, Plus,
  Brain, Lightbulb, Target, ChevronRight
} from 'lucide-react'
import { Node, Edge } from 'reactflow'

interface AISuggestion {
  id: string
  type: 'page' | 'section' | 'optimization' | 'structure'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  icon: any
  action: () => void
  category: string
}

interface AISuggestionsProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  onAddNode: (node: Node) => void
  onAddSection: (nodeId: string, section: string) => void
  onOptimize: (suggestion: any) => void
}

export function AISuggestions({ 
  isOpen, 
  onClose, 
  nodes, 
  edges, 
  onAddNode, 
  onAddSection,
  onOptimize 
}: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      analyzeSitemap()
    }
  }, [isOpen, nodes, edges])

  const analyzeSitemap = async () => {
    setAnalyzing(true)
    
    // Simulate AI analysis
    setTimeout(() => {
      const newSuggestions: AISuggestion[] = []

      // Page suggestions based on sitemap analysis
      if (!nodes.some(n => n.data.label === 'Privacy Policy')) {
        newSuggestions.push({
          id: 'add-privacy',
          type: 'page',
          title: 'Add Privacy Policy Page',
          description: 'Essential for GDPR compliance and user trust',
          impact: 'high',
          icon: Shield,
          category: 'Legal',
          action: () => {
            onAddNode({
              id: `privacy-${Date.now()}`,
              type: 'page',
              position: { x: 400, y: 500 },
              data: {
                label: 'Privacy Policy',
                url: '/privacy-policy',
                sections: ['Header', 'Content', 'Footer'],
                metadata: { status: 'draft', pageType: 'Legal' }
              }
            })
          }
        })
      }

      if (!nodes.some(n => n.data.label === 'Blog' || n.data.label === 'News')) {
        newSuggestions.push({
          id: 'add-blog',
          type: 'page',
          title: 'Add Blog Section',
          description: 'Improve SEO and engage visitors with content marketing',
          impact: 'high',
          icon: FileText,
          category: 'Content',
          action: () => {
            onAddNode({
              id: `blog-${Date.now()}`,
              type: 'folder',
              position: { x: 600, y: 300 },
              data: {
                label: 'Blog',
                color: '#10B981',
                children: []
              }
            })
          }
        })
      }

      // Section suggestions for existing pages
      const homePage = nodes.find(n => n.data.label === 'Home')
      if (homePage && !homePage.data.sections?.includes('Testimonials')) {
        newSuggestions.push({
          id: 'add-testimonials',
          type: 'section',
          title: 'Add Testimonials to Homepage',
          description: 'Build trust with social proof from satisfied customers',
          impact: 'high',
          icon: Users,
          category: 'Trust',
          action: () => onAddSection(homePage.id, 'Testimonials')
        })
      }

      // Structure optimization suggestions
      if (nodes.length > 10) {
        const orphanNodes = nodes.filter(node => 
          !edges.some(edge => edge.target === node.id) && 
          node.data.label !== 'Home'
        )
        
        if (orphanNodes.length > 0) {
          newSuggestions.push({
            id: 'fix-orphans',
            type: 'structure',
            title: 'Connect Orphaned Pages',
            description: `${orphanNodes.length} pages are not linked from any other page`,
            impact: 'high',
            icon: Globe,
            category: 'Structure',
            action: () => {
              console.log('Fix orphaned pages:', orphanNodes)
              onOptimize({ type: 'connect-orphans', nodes: orphanNodes })
            }
          })
        }
      }

      // SEO optimization suggestions
      const pagesWithoutSEO = nodes.filter(n => 
        n.type === 'page' && 
        (!n.data.metadata?.seoScore || n.data.metadata.seoScore < 70)
      )
      
      if (pagesWithoutSEO.length > 0) {
        newSuggestions.push({
          id: 'improve-seo',
          type: 'optimization',
          title: 'Improve SEO Scores',
          description: `${pagesWithoutSEO.length} pages have low SEO scores`,
          impact: 'medium',
          icon: TrendingUp,
          category: 'SEO',
          action: () => {
            onOptimize({ type: 'improve-seo', pages: pagesWithoutSEO })
          }
        })
      }

      // E-commerce suggestions
      const hasProducts = nodes.some(n => 
        n.data.label?.toLowerCase().includes('product') || 
        n.data.label?.toLowerCase().includes('shop')
      )
      
      if (hasProducts && !nodes.some(n => n.data.label === 'Cart')) {
        newSuggestions.push({
          id: 'add-cart',
          type: 'page',
          title: 'Add Shopping Cart',
          description: 'Essential for e-commerce functionality',
          impact: 'high',
          icon: ShoppingCart,
          category: 'E-commerce',
          action: () => {
            onAddNode({
              id: `cart-${Date.now()}`,
              type: 'page',
              position: { x: 800, y: 300 },
              data: {
                label: 'Cart',
                url: '/cart',
                sections: ['Cart Items', 'Summary', 'Checkout CTA'],
                metadata: { status: 'draft', pageType: 'E-commerce' }
              }
            })
          }
        })
      }

      // Performance suggestions
      const deeplyNestedPages = nodes.filter(node => {
        let depth = 0
        let current = node.id
        while (depth < 5) {
          const parent = edges.find(e => e.target === current)
          if (!parent) break
          current = parent.source
          depth++
        }
        return depth >= 4
      })

      if (deeplyNestedPages.length > 0) {
        newSuggestions.push({
          id: 'reduce-depth',
          type: 'structure',
          title: 'Reduce Navigation Depth',
          description: `${deeplyNestedPages.length} pages are too deeply nested (4+ levels)`,
          impact: 'medium',
          icon: Layers,
          category: 'UX',
          action: () => {
            onOptimize({ type: 'flatten-structure', pages: deeplyNestedPages })
          }
        })
      }

      setSuggestions(newSuggestions)
      setAnalyzing(false)
    }, 1500)
  }

  const categories = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'Legal', label: 'Legal', icon: Shield },
    { id: 'Content', label: 'Content', icon: FileText },
    { id: 'Trust', label: 'Trust', icon: Users },
    { id: 'Structure', label: 'Structure', icon: Globe },
    { id: 'SEO', label: 'SEO', icon: TrendingUp },
    { id: 'E-commerce', label: 'E-commerce', icon: ShoppingCart },
    { id: 'UX', label: 'UX', icon: Layers },
  ]

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory)

  const impactColors = {
    high: 'border-red-500/30 bg-red-500/10 text-red-400',
    medium: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    low: 'border-green-500/30 bg-green-500/10 text-green-400'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#FF5500]" />
            AI Suggestions
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Smart recommendations to improve your sitemap based on best practices
          </DialogDescription>
        </DialogHeader>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                size="sm"
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id 
                    ? 'bg-[#FF5500] hover:bg-[#FF6600]' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }
              >
                <Icon className="h-3 w-3 mr-1" />
                {category.label}
                {category.id !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({suggestions.filter(s => s.category === category.id).length})
                  </span>
                )}
              </Button>
            )
          })}
        </div>

        {/* Suggestions List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {analyzing ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-400">
                <Zap className="h-5 w-5 animate-pulse" />
                Analyzing your sitemap...
              </div>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {selectedCategory === 'all' 
                  ? 'Your sitemap looks great! No suggestions at this time.'
                  : `No ${selectedCategory.toLowerCase()} suggestions available.`}
              </p>
            </div>
          ) : (
            filteredSuggestions.map(suggestion => {
              const Icon = suggestion.icon
              return (
                <Card
                  key={suggestion.id}
                  className="p-4 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white/5">
                        <Icon className="h-5 w-5 text-[#FF5500]" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${impactColors[suggestion.impact]}`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                          {suggestion.description}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              suggestion.action()
                              // Remove suggestion after applying
                              setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
                            }}
                            className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700]"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-white/10 border-white/20 hover:bg-white/20"
                          >
                            Learn More
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
                      }}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      ×
                    </button>
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            Suggestions based on industry best practices and SEO guidelines
          </p>
          <Button
            onClick={analyzeSitemap}
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <Zap className="h-4 w-4 mr-2" />
            Re-analyze
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}