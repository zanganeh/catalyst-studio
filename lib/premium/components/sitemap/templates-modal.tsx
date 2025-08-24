import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  Layout, ShoppingBag, FileText, Briefcase, GraduationCap, 
  Heart, Home, Building, Palette, Code, Rocket
} from 'lucide-react'
import { Node, Edge } from 'reactflow'
import { ProfessionalNodeData } from './professional-nodes'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (nodes: Node<ProfessionalNodeData>[], edges: Edge[]) => void
}

const templates = [
  {
    id: 'corporate',
    name: 'Corporate Website',
    description: 'Professional business website with company info',
    icon: Building,
    color: '#3B82F6',
    structure: {
      nodes: [
        { id: 'home', label: 'Home', type: 'page', position: { x: 400, y: 50 } },
        { id: 'about', label: 'About', type: 'page', position: { x: 200, y: 200 } },
        { id: 'services', label: 'Services', type: 'folder', position: { x: 400, y: 200 }, color: '#3B82F6' },
        { id: 'service1', label: 'Consulting', type: 'page', position: { x: 300, y: 350 } },
        { id: 'service2', label: 'Development', type: 'page', position: { x: 500, y: 350 } },
        { id: 'team', label: 'Team', type: 'page', position: { x: 600, y: 200 } },
        { id: 'contact', label: 'Contact', type: 'page', position: { x: 800, y: 200 } },
      ],
      edges: [
        { source: 'home', target: 'about' },
        { source: 'home', target: 'services' },
        { source: 'home', target: 'team' },
        { source: 'home', target: 'contact' },
        { source: 'services', target: 'service1' },
        { source: 'services', target: 'service2' },
      ]
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Online store with products and checkout',
    icon: ShoppingBag,
    color: '#10B981',
    structure: {
      nodes: [
        { id: 'home', label: 'Home', type: 'page', position: { x: 400, y: 50 } },
        { id: 'shop', label: 'Shop', type: 'folder', position: { x: 200, y: 200 }, color: '#10B981' },
        { id: 'categories', label: 'Categories', type: 'page', position: { x: 100, y: 350 } },
        { id: 'products', label: 'Products', type: 'page', position: { x: 300, y: 350 } },
        { id: 'cart', label: 'Cart', type: 'page', position: { x: 500, y: 200 } },
        { id: 'checkout', label: 'Checkout', type: 'page', position: { x: 500, y: 350 } },
        { id: 'account', label: 'Account', type: 'folder', position: { x: 700, y: 200 }, color: '#8B5CF6' },
        { id: 'profile', label: 'Profile', type: 'page', position: { x: 650, y: 350 } },
        { id: 'orders', label: 'Orders', type: 'page', position: { x: 750, y: 350 } },
      ],
      edges: [
        { source: 'home', target: 'shop' },
        { source: 'home', target: 'cart' },
        { source: 'home', target: 'account' },
        { source: 'shop', target: 'categories' },
        { source: 'shop', target: 'products' },
        { source: 'cart', target: 'checkout' },
        { source: 'account', target: 'profile' },
        { source: 'account', target: 'orders' },
      ]
    }
  },
  {
    id: 'blog',
    name: 'Blog/Magazine',
    description: 'Content-focused website with articles',
    icon: FileText,
    color: '#F59E0B',
    structure: {
      nodes: [
        { id: 'home', label: 'Home', type: 'page', position: { x: 400, y: 50 } },
        { id: 'blog', label: 'Blog', type: 'folder', position: { x: 300, y: 200 }, color: '#F59E0B' },
        { id: 'latest', label: 'Latest Posts', type: 'page', position: { x: 200, y: 350 } },
        { id: 'categories', label: 'Categories', type: 'page', position: { x: 400, y: 350 } },
        { id: 'about', label: 'About', type: 'page', position: { x: 500, y: 200 } },
        { id: 'authors', label: 'Authors', type: 'page', position: { x: 600, y: 350 } },
        { id: 'newsletter', label: 'Newsletter', type: 'page', position: { x: 700, y: 200 } },
      ],
      edges: [
        { source: 'home', target: 'blog' },
        { source: 'home', target: 'about' },
        { source: 'home', target: 'newsletter' },
        { source: 'blog', target: 'latest' },
        { source: 'blog', target: 'categories' },
        { source: 'about', target: 'authors' },
      ]
    }
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase creative work and projects',
    icon: Palette,
    color: '#EC4899',
    structure: {
      nodes: [
        { id: 'home', label: 'Home', type: 'page', position: { x: 400, y: 50 } },
        { id: 'work', label: 'Work', type: 'folder', position: { x: 250, y: 200 }, color: '#EC4899' },
        { id: 'projects', label: 'Projects', type: 'page', position: { x: 150, y: 350 } },
        { id: 'casestudies', label: 'Case Studies', type: 'page', position: { x: 350, y: 350 } },
        { id: 'about', label: 'About', type: 'page', position: { x: 550, y: 200 } },
        { id: 'contact', label: 'Contact', type: 'page', position: { x: 700, y: 200 } },
      ],
      edges: [
        { source: 'home', target: 'work' },
        { source: 'home', target: 'about' },
        { source: 'home', target: 'contact' },
        { source: 'work', target: 'projects' },
        { source: 'work', target: 'casestudies' },
      ]
    }
  },
  {
    id: 'saas',
    name: 'SaaS Platform',
    description: 'Software as a Service with dashboard',
    icon: Rocket,
    color: '#6366F1',
    structure: {
      nodes: [
        { id: 'home', label: 'Landing', type: 'page', position: { x: 400, y: 50 } },
        { id: 'features', label: 'Features', type: 'page', position: { x: 150, y: 200 } },
        { id: 'pricing', label: 'Pricing', type: 'page', position: { x: 300, y: 200 } },
        { id: 'docs', label: 'Documentation', type: 'folder', position: { x: 450, y: 200 }, color: '#6366F1' },
        { id: 'guides', label: 'Guides', type: 'page', position: { x: 400, y: 350 } },
        { id: 'api', label: 'API Reference', type: 'page', position: { x: 550, y: 350 } },
        { id: 'dashboard', label: 'Dashboard', type: 'folder', position: { x: 650, y: 200 }, color: '#10B981' },
        { id: 'analytics', label: 'Analytics', type: 'page', position: { x: 600, y: 350 } },
        { id: 'settings', label: 'Settings', type: 'page', position: { x: 750, y: 350 } },
      ],
      edges: [
        { source: 'home', target: 'features' },
        { source: 'home', target: 'pricing' },
        { source: 'home', target: 'docs' },
        { source: 'home', target: 'dashboard' },
        { source: 'docs', target: 'guides' },
        { source: 'docs', target: 'api' },
        { source: 'dashboard', target: 'analytics' },
        { source: 'dashboard', target: 'settings' },
      ]
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple one-page or few pages',
    icon: Layout,
    color: '#64748B',
    structure: {
      nodes: [
        { id: 'home', label: 'Home', type: 'page', position: { x: 400, y: 100 } },
        { id: 'about', label: 'About', type: 'page', position: { x: 250, y: 250 } },
        { id: 'contact', label: 'Contact', type: 'page', position: { x: 550, y: 250 } },
      ],
      edges: [
        { source: 'home', target: 'about' },
        { source: 'home', target: 'contact' },
      ]
    }
  },
]

export function TemplatesModal({ isOpen, onClose, onSelectTemplate }: TemplatesModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    const nodes: Node<ProfessionalNodeData>[] = template.structure.nodes.map(node => ({
      id: node.id,
      type: node.type as 'page' | 'folder',
      position: node.position,
      data: {
        label: node.label,
        url: node.type === 'page' ? `/${node.label.toLowerCase().replace(/\s+/g, '-')}` : undefined,
        sections: node.type === 'page' ? ['Hero', 'Content', 'Footer'] : undefined,
        color: node.color,
        expanded: false,
        metadata: node.type === 'page' ? {
          status: 'draft',
          pageType: node.label,
          seoScore: 70,
        } : undefined,
      }
    }))

    const edges: Edge[] = template.structure.edges.map((edge, index) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      style: { stroke: 'rgba(255, 255, 255, 0.2)' },
    }))

    onSelectTemplate(nodes, edges)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-[#FF5500]" />
            Choose a Template
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Start with a pre-built sitemap structure and customize it to your needs
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`p-4 rounded-xl border transition-all hover:scale-[1.02] text-left ${
                  selectedTemplate === template.id
                    ? 'border-[#FF5500] bg-[#FF5500]/10'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: template.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">
                        {template.structure.nodes.length} pages
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">
                        {template.structure.edges.length} connections
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSelectTemplate('minimal')}
            className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0"
          >
            Start from Scratch
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}