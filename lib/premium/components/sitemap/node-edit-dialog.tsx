'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, X } from 'lucide-react'

interface NodeEditDialogProps {
  isOpen: boolean
  onClose: () => void
  nodeData: {
    id: string
    label: string
    url?: string
    sections?: string[]
    description?: string
    type: string
    metadata?: {
      status?: 'draft' | 'published' | 'archived'
      pageType?: string
    }
  } | null
  onSave: (nodeId: string, updatedData: any) => void
}

const sectionTemplates = [
  'Hero',
  'Features',
  'Testimonials',
  'Call to Action',
  'About',
  'Mission',
  'Team',
  'Gallery',
  'Video',
  'Contact Form',
  'Map',
  'Products',
  'Services',
  'Pricing',
  'FAQ',
  'Blog',
  'Newsletter',
  'Footer',
]

export function NodeEditDialog({
  isOpen,
  onClose,
  nodeData,
  onSave,
}: NodeEditDialogProps) {
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    description: '',
    sections: [] as string[],
    status: 'draft' as 'draft' | 'published' | 'archived',
    pageType: '',
  })
  const [newSection, setNewSection] = useState('')
  
  useEffect(() => {
    if (nodeData) {
      setFormData({
        label: nodeData.label || '',
        url: nodeData.url || '',
        description: nodeData.description || '',
        sections: nodeData.sections || [],
        status: nodeData.metadata?.status || 'draft',
        pageType: nodeData.metadata?.pageType || '',
      })
    }
  }, [nodeData])
  
  const handleSave = () => {
    if (nodeData) {
      onSave(nodeData.id, {
        ...nodeData,
        label: formData.label,
        url: formData.url,
        description: formData.description,
        sections: formData.sections,
        metadata: {
          ...nodeData.metadata,
          status: formData.status,
          pageType: formData.pageType,
        }
      })
      onClose()
    }
  }
  
  const handleAddSection = () => {
    if (newSection && !formData.sections.includes(newSection)) {
      setFormData({
        ...formData,
        sections: [...formData.sections, newSection]
      })
      setNewSection('')
    }
  }
  
  const handleRemoveSection = (index: number) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index)
    })
  }
  
  const handleSectionSelect = (section: string) => {
    if (!formData.sections.includes(section)) {
      setFormData({
        ...formData,
        sections: [...formData.sections, section]
      })
    }
  }
  
  if (!nodeData) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Edit {nodeData.type === 'folder' ? 'Folder' : 'Page'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Make changes to the {nodeData.type} properties and content sections.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="label" className="text-gray-300">
              Title
            </Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Page title"
            />
          </div>
          
          {/* URL (for pages only) */}
          {nodeData.type === 'page' && (
            <div className="grid gap-2">
              <Label htmlFor="url" className="text-gray-300">
                URL Path
              </Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="/page-url"
              />
            </div>
          )}
          
          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Brief description of the page content"
              rows={3}
            />
          </div>
          
          {/* Page Type */}
          {nodeData.type === 'page' && (
            <div className="grid gap-2">
              <Label htmlFor="pageType" className="text-gray-300">
                Page Type
              </Label>
              <Input
                id="pageType"
                value={formData.pageType}
                onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="e.g., Landing, Product, Blog"
              />
            </div>
          )}
          
          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="status" className="text-gray-300">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published' | 'archived') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="draft" className="text-white">Draft</SelectItem>
                <SelectItem value="published" className="text-white">Published</SelectItem>
                <SelectItem value="archived" className="text-white">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Sections (for pages only) */}
          {nodeData.type === 'page' && (
            <div className="grid gap-2">
              <Label className="text-gray-300">Content Sections</Label>
              
              {/* Section Templates */}
              <div className="flex gap-2 items-center">
                <Select onValueChange={handleSectionSelect}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Add from templates" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 max-h-[200px]">
                    {sectionTemplates.map((template) => (
                      <SelectItem 
                        key={template} 
                        value={template}
                        className="text-white"
                      >
                        {template}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-500">or</span>
                <Input
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Custom section"
                />
                <Button
                  onClick={handleAddSection}
                  size="icon"
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Current Sections */}
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {formData.sections.map((section, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-300">{section}</span>
                    <button
                      onClick={() => handleRemoveSection(index)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.sections.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No sections added yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#FF5500] hover:bg-[#FF6600] text-white"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}