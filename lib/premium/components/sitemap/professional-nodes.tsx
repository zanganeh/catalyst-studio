import React, { memo, useState, useCallback, useMemo, Fragment } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  FileText, ChevronDown, ChevronUp, Globe, 
  Clock, CheckCircle, AlertCircle, Home, ShoppingBag, 
  Users, Mail, BookOpen, Settings, Grid, Layers, 
  Layout, Type, Image, Video, MessageSquare, Star,
  Zap, Target, TrendingUp, Award, Shield, Database, Folder,
  Plus, X, GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Component type icons mapping
const componentIcons: Record<string, any> = {
  'Hero': Home,
  'Features': Grid,
  'Testimonials': MessageSquare,
  'CTA': Target,
  'Footer': Layers,
  'About': Users,
  'Gallery': Image,
  'Video': Video,
  'Contact': Mail,
  'Map': Globe,
  'Pricing': TrendingUp,
  'FAQ': MessageSquare,
  'Team': Users,
  'Services': ShoppingBag,
  'Blog': BookOpen,
  'Newsletter': Mail,
  'Stats': Database,
  'Awards': Award,
  'Security': Shield,
  'Integration': Zap
}

// Professional color palette
const statusColors = {
  published: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: CheckCircle },
  draft: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Clock },
  review: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: AlertCircle },
  scheduled: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: Clock }
}

// SEO score colors
const seoScoreColors = (score: number) => {
  if (score >= 90) return 'text-emerald-400 bg-emerald-500/10'
  if (score >= 70) return 'text-green-400 bg-green-500/10'
  if (score >= 50) return 'text-amber-400 bg-amber-500/10'
  return 'text-red-400 bg-red-500/10'
}

export interface ProfessionalNodeData {
  label: string
  url?: string
  components?: string[]
  description?: string
  expanded?: boolean
  collapsed?: boolean
  children?: string[]
  color?: string
  isEditing?: boolean
  metadata?: {
    status?: 'published' | 'draft' | 'review' | 'scheduled'
    pageType?: string
    seoScore?: number
    lastModified?: string
    author?: string
    priority?: 'high' | 'medium' | 'low'
    template?: string
  }
  stats?: {
    views?: number
    conversions?: number
    bounceRate?: number
  }
  onToggleCollapse?: (nodeId: string) => void
  onComponentsReorder?: (nodeId: string, components: string[]) => void
  onLabelChange?: (nodeId: string, newLabel: string) => void
  onComponentAdd?: (nodeId: string, component: string, afterIndex?: number) => void
  onComponentRemove?: (nodeId: string, componentIndex: number) => void
}


// Component Item with inline editing
interface ComponentItemProps {
  component: string
  index: number
  nodeId: string
  totalComponents: number
  onMoveUp?: (nodeId: string, index: number) => void
  onMoveDown?: (nodeId: string, index: number) => void
  onComponentRemove?: (nodeId: string, index: number) => void
  onComponentAdd?: (nodeId: string, component: string, afterIndex?: number) => void
}

const ComponentItem = ({ component, index, nodeId, totalComponents, onMoveUp, onMoveDown, onComponentRemove, onComponentAdd }: ComponentItemProps) => {
  const Icon = componentIcons[component] || Layers
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs nopan nodrag relative',
          'bg-white/[0.02] backdrop-blur-sm border transition-all duration-150',
          isHovered ? 'border-[#FF5500]/50 bg-white/[0.04]' : 'border-white/[0.05]'
        )}
      >
        {/* Drag Handle */}
        <GripVertical className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-50" />
        
        {/* Component Icon */}
        <Icon className="w-3.5 h-3.5 text-gray-400" />
        
        {/* Component Name */}
        <span className="text-gray-300 flex-1 select-none font-medium">{component}</span>
        
        {/* Action Buttons */}
        <div className={cn(
          "flex items-center gap-1 transition-all",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          {/* Move Up */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (index > 0 && onMoveUp) {
                onMoveUp(nodeId, index)
              }
            }}
            disabled={index === 0}
            className={cn(
              "p-1 rounded hover:bg-white/10",
              index === 0 ? "opacity-20 cursor-not-allowed" : "opacity-60 hover:opacity-100"
            )}
          >
            <ChevronUp className="w-3 h-3 text-gray-400" />
          </button>
          
          {/* Move Down */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (index < totalComponents - 1 && onMoveDown) {
                onMoveDown(nodeId, index)
              }
            }}
            disabled={index === totalComponents - 1}
            className={cn(
              "p-1 rounded hover:bg-white/10",
              index === totalComponents - 1 ? "opacity-20 cursor-not-allowed" : "opacity-60 hover:opacity-100"
            )}
          >
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          
          {/* Remove */}
          {onComponentRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onComponentRemove(nodeId, index)
              }}
              className="p-1 rounded hover:bg-red-500/20 opacity-60 hover:opacity-100"
            >
              <X className="w-3 h-3 text-red-400" />
            </button>
          )}
        </div>
      </div>
      
      {/* + Button that appears above first component on hover */}
      {isHovered && index === 0 && (
        <button
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
          onClick={(e) => {
            e.stopPropagation()
            onComponentAdd?.(nodeId, '__OPEN_PICKER__', -1)
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-[#FF5500] rounded-full shadow-lg hover:bg-[#FF6600] transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </button>
      )}
      
      {/* + Button that appears below component on hover */}
      {isHovered && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20"
          onClick={(e) => {
            e.stopPropagation()
            onComponentAdd?.(nodeId, '__OPEN_PICKER__', index)
          }}
        >
          <div className="flex items-center justify-center w-6 h-6 bg-[#FF5500] rounded-full shadow-lg hover:bg-[#FF6600] transition-colors">
            <Plus className="w-4 h-4 text-white" />
          </div>
        </button>
      )}
    </div>
  )
}

// Predefined available component types - Complete list from screenshots
const availableComponentTypes = [
  'Navbar',
  'Footer',
  'Hero Header',
  'Header',
  'Feature Section',
  'Features List Section',
  'How It Works Section',
  'Benefits Section',
  'About Section',
  'CTA Section',
  'Contact Section',
  'Pricing Section',
  'Testimonial Section',
  'FAQ Section',
  'Logo List',
  'Gallery Section',
  'Team Section',
  'Job Listings',
  'Blog List Header',
  'Blog List Section',
  'Blog Post Header',
  'Blog Post Body',
  'Portfolio List',
  'Portfolio Item Header',
  'Portfolio Item Body',
  'Products List',
  'Product Header',
  'Announcement Banner',
  'Project Item Header Section',
  'Ecommerce Product Header Section',
  'Ecommerce Product Section',
]

// Professional Page Node Component with inline component list
export const ProfessionalPageNode = memo(({ id, data, selected }: NodeProps<ProfessionalNodeData>) => {
  const [isHovered, setIsHovered] = useState(false)
  const [components, setComponents] = useState(data.components || [])
  const [editingLabel, setEditingLabel] = useState(data.isEditing || false)
  const [labelValue, setLabelValue] = useState(data.label)
  const [hoveredInsertIndex, setHoveredInsertIndex] = useState<number | null>(null)

  // Update editing state when prop changes
  React.useEffect(() => {
    if (data.isEditing) {
      setEditingLabel(true)
      setLabelValue(data.label)
    } else {
      setEditingLabel(false)
    }
  }, [data.isEditing, data.label])
  
  // Sync components with props
  React.useEffect(() => {
    setComponents(data.components || [])
  }, [data.components])
  
  // Handle component reordering with up/down buttons
  const handleMoveUp = useCallback((nodeId: string, index: number) => {
    if (index > 0) {
      const newComponents = [...components]
      const temp = newComponents[index]
      newComponents[index] = newComponents[index - 1]
      newComponents[index - 1] = temp
      setComponents(newComponents)
      
      // Call parent callback
      if (data.onComponentsReorder) {
        data.onComponentsReorder(id, newComponents)
      }
    }
  }, [components, id, data])
  
  const handleMoveDown = useCallback((nodeId: string, index: number) => {
    if (index < components.length - 1) {
      const newComponents = [...components]
      const temp = newComponents[index]
      newComponents[index] = newComponents[index + 1]
      newComponents[index + 1] = temp
      setComponents(newComponents)
      
      // Call parent callback
      if (data.onComponentsReorder) {
        data.onComponentsReorder(id, newComponents)
      }
    }
  }, [components, id, data])
  
  const status = data.metadata?.status || 'draft'
  const StatusIcon = statusColors[status].icon

  return (
    <div
      className={cn(
        'node-card relative min-w-[320px] max-w-[380px]',
        'bg-gray-900 rounded-xl transition-all duration-200',
        'shadow-lg',
        selected 
          ? 'ring-2 ring-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.3)] scale-[1.02]' 
          : isHovered 
            ? 'shadow-xl scale-[1.01]'
            : '',
        data.collapsed && 'node-collapsed'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          'w-3 h-3 !bg-gradient-to-br from-gray-600 to-gray-700 !border-2 transition-all',
          selected || isHovered ? '!border-[#FF5500] scale-125' : '!border-gray-500'
        )}
      />
      
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className={cn(
              'p-1.5 rounded-lg',
              data.label.toLowerCase() === 'home' 
                ? 'bg-gradient-to-br from-[#FF5500]/20 to-[#FF6600]/20'
                : 'bg-white/5'
            )}>
              <FileText className={cn(
                'w-4 h-4',
                data.label.toLowerCase() === 'home' ? 'text-[#FF5500]' : 'text-gray-400'
              )} />
            </div>
            <div className="flex-1">
              {editingLabel ? (
                <input
                  type="text"
                  value={labelValue}
                  onChange={(e) => setLabelValue(e.target.value)}
                  onBlur={() => {
                    if (data.onLabelChange && labelValue !== data.label) {
                      data.onLabelChange(id, labelValue)
                    }
                    setEditingLabel(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (data.onLabelChange && labelValue !== data.label) {
                        data.onLabelChange(id, labelValue)
                      }
                      setEditingLabel(false)
                    } else if (e.key === 'Escape') {
                      setLabelValue(data.label)
                      setEditingLabel(false)
                    }
                    e.stopPropagation()
                  }}
                  className="font-semibold text-white text-sm bg-white/10 border border-orange-500/50 rounded px-1 outline-none w-full"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 
                  className="font-semibold text-white text-sm cursor-text hover:bg-white/5 px-1 rounded"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingLabel(true)
                  }}
                >
                  {data.label}
                </h3>
              )}
              {data.url && (
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{data.url}</p>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs',
            statusColors[status].bg,
            statusColors[status].border,
            statusColors[status].text,
            'border'
          )}>
            <StatusIcon className="w-3 h-3" />
            <span className="capitalize">{status}</span>
          </div>
        </div>
        
        {/* Metadata */}
        {data.metadata && (
          <div className="flex items-center gap-3 text-xs">
            {data.metadata.seoScore !== undefined && (
              <div className={cn(
                'px-2 py-0.5 rounded-md font-medium',
                seoScoreColors(data.metadata.seoScore)
              )}>
                SEO: {data.metadata.seoScore}%
              </div>
            )}
            {data.metadata.pageType && (
              <span className="text-gray-500">{data.metadata.pageType}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Components Section - Always visible */}
      <div className="p-3">
        {/* Components List - No header needed */}
        <div className="relative">
            {/* Component List with hover insert buttons */}
            {components.length > 0 ? (
              <div 
                className="space-y-1 relative"
                onMouseLeave={() => setHoveredInsertIndex(null)}
              >
                {components.map((component, index) => (
                  <ComponentItem
                    key={`${component}-${index}`}
                    component={component}
                    index={index}
                    nodeId={id}
                    totalComponents={components.length}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onComponentRemove={data.onComponentRemove}
                    onComponentAdd={data.onComponentAdd}
                  />
                ))
              }
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-gray-600 mb-2">No components added</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (data.onComponentAdd) {
                      data.onComponentAdd(id, '__OPEN_PICKER__')
                    }
                  }}
                  className="px-3 py-1.5 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-lg text-xs text-gray-500 hover:text-gray-400 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Add First Component
                </button>
              </div>
            )}
          </div>
      </div>
      
      {/* Stats Footer */}
      {data.stats && (
        <div className="px-3 pb-3 pt-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            {data.stats.views && (
              <span>👁 {data.stats.views.toLocaleString()}</span>
            )}
            {data.stats.conversions && (
              <span>🎯 {data.stats.conversions}%</span>
            )}
            {data.stats.bounceRate && (
              <span>📊 {data.stats.bounceRate}%</span>
            )}
          </div>
        </div>
      )}
      
      {/* Collapse Indicator */}
      {data.collapsed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          'w-3 h-3 !bg-gradient-to-br from-gray-600 to-gray-700 !border-2 transition-all',
          selected || isHovered ? '!border-[#FF5500] scale-125' : '!border-gray-500'
        )}
      />
    </div>
  )
})

// Professional Folder Node Component
export const ProfessionalFolderNode = memo(({ id, data, selected }: NodeProps<ProfessionalNodeData>) => {
  const [isHovered, setIsHovered] = useState(false)
  const [editingLabel, setEditingLabel] = useState(data.isEditing || false)
  const [labelValue, setLabelValue] = useState(data.label)

  // Update editing state when prop changes
  React.useEffect(() => {
    if (data.isEditing) {
      setEditingLabel(true)
      setLabelValue(data.label)
    } else {
      setEditingLabel(false)
    }
  }, [data.isEditing, data.label])

  return (
    <div
      className={cn(
        'node-card relative min-w-[240px] max-w-[300px]',
        'bg-gray-900 rounded-xl transition-all duration-200',
        'shadow-lg',
        selected 
          ? 'ring-2 ring-[#FF5500] shadow-[0_0_20px_rgba(255,85,0,0.3)] scale-[1.02]' 
          : isHovered 
            ? 'shadow-xl scale-[1.01]'
            : '',
        data.collapsed && 'node-collapsed'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ borderColor: data.color || '#F97316', borderWidth: '2px', borderStyle: 'solid' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          'w-3 h-3 !bg-gradient-to-br from-gray-600 to-gray-700 !border-2 transition-all',
          selected || isHovered ? '!border-[#FF5500] scale-125' : '!border-gray-500'
        )}
      />
      
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${data.color || '#F97316'}20` }}
          >
            <Folder className="w-4 h-4" style={{ color: data.color || '#F97316' }} />
          </div>
          <div className="flex-1">
            {editingLabel ? (
              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                onBlur={() => {
                  if (data.onLabelChange && labelValue !== data.label) {
                    data.onLabelChange(id, labelValue)
                  }
                  setEditingLabel(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (data.onLabelChange && labelValue !== data.label) {
                      data.onLabelChange(id, labelValue)
                    }
                    setEditingLabel(false)
                  } else if (e.key === 'Escape') {
                    setLabelValue(data.label)
                    setEditingLabel(false)
                  }
                  e.stopPropagation()
                }}
                className="font-semibold text-white text-sm bg-white/10 border border-orange-500/50 rounded px-1 outline-none w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 
                className="font-semibold text-white text-sm cursor-text hover:bg-white/5 px-1 rounded"
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  setEditingLabel(true)
                }}
              >
                {data.label}
              </h3>
            )}
            {data.children && data.children.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {data.children.length} {data.children.length === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          {data.onToggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onToggleCollapse?.(id)
              }}
              className="p-1 rounded hover:bg-white/10 opacity-60 hover:opacity-100"
            >
              <ChevronDown className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                data.collapsed && '-rotate-90'
              )} />
            </button>
          )}
        </div>
      </div>
      
      {/* Collapse Indicator */}
      {data.collapsed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          'w-3 h-3 !bg-gradient-to-br from-gray-600 to-gray-700 !border-2 transition-all',
          selected || isHovered ? '!border-[#FF5500] scale-125' : '!border-gray-500'
        )}
      />
    </div>
  )
})

// Export all node types
export const professionalNodeTypes = {
  page: ProfessionalPageNode,
  folder: ProfessionalFolderNode,
}

