'use client'

import { memo, useState, useCallback } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  Home, 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  MoreVertical,
  ExternalLink,
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
  Search,
  Lock,
  Settings,
  Hash,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Section type definitions with icons and metadata
const sectionTypes = {
  hero: { 
    icon: Flag, 
    label: 'Hero Section',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  features: { 
    icon: Grid3x3, 
    label: 'Features',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  testimonials: { 
    icon: MessageSquare, 
    label: 'Testimonials',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  },
  cta: { 
    icon: ArrowRight, 
    label: 'Call to Action',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10'
  },
  about: { 
    icon: Users, 
    label: 'About',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  gallery: { 
    icon: Image, 
    label: 'Gallery',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10'
  },
  video: { 
    icon: PlayCircle, 
    label: 'Video',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  },
  contact: { 
    icon: Mail, 
    label: 'Contact Form',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10'
  },
  map: { 
    icon: MapPin, 
    label: 'Map',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10'
  },
  products: { 
    icon: Package, 
    label: 'Products',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10'
  },
  search: { 
    icon: Search, 
    label: 'Search',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10'
  },
  footer: { 
    icon: Layers, 
    label: 'Footer',
    color: 'text-gray-500',
    bgColor: 'bg-gray-600/10'
  }
}

// Helper to get section type from string
function getSectionType(sectionName: string) {
  const normalized = sectionName.toLowerCase()
  for (const [key, value] of Object.entries(sectionTypes)) {
    if (normalized.includes(key)) {
      return value
    }
  }
  // Default section type
  return {
    icon: Hash,
    label: sectionName,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10'
  }
}

export interface EnhancedNodeData {
  label: string
  url?: string
  sections?: string[]
  description?: string
  expanded?: boolean
  collapsed?: boolean
  icon?: string
  color?: string
  metadata?: {
    lastModified?: Date
    author?: string
    status?: 'draft' | 'published' | 'archived'
    seoScore?: number
    pageType?: string
  }
  children?: string[]
  onToggleCollapse?: (nodeId: string) => void
}

// Enhanced Page Node with rich section previews
export const EnhancedPageNode = memo(({ 
  data, 
  selected,
  id 
}: NodeProps<EnhancedNodeData>) => {
  const isHome = data.label?.toLowerCase() === 'home'
  const [isHovered, setIsHovered] = useState(false)
  
  const handleToggleCollapse = useCallback(() => {
    data.onToggleCollapse?.(id)
  }, [data, id])
  
  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <div
        className={cn(
          "relative rounded-xl shadow-xl border backdrop-blur-md",
          "min-w-[280px] max-w-[320px] transition-all duration-300",
          "bg-gradient-to-br transform-gpu",
          isHome 
            ? "from-[#FF5500]/25 via-[#FF5500]/15 to-[#FF6600]/10 border-[#FF5500]/40" 
            : "from-gray-800/90 via-gray-800/80 to-gray-900/90 border-gray-700/50",
          selected && "ring-2 ring-[#FF5500] shadow-2xl scale-[1.03] border-[#FF5500]/60",
          isHovered && !selected && "shadow-2xl scale-[1.01] border-white/30"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5 flex-1">
              {isHome ? (
                <div className="p-1.5 rounded-lg bg-[#FF5500]/20">
                  <Home className="h-5 w-5 text-[#FF5500]" />
                </div>
              ) : (
                <div className="p-1.5 rounded-lg bg-white/10">
                  <FileText className="h-4 w-4 text-white/70" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {data.label}
                </h3>
                {data.url && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-gray-400 truncate">{data.url}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Status Badge */}
            {data.metadata?.status && (
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                data.metadata.status === 'published' && "bg-green-500/20 text-green-400",
                data.metadata.status === 'draft' && "bg-yellow-500/20 text-yellow-400",
                data.metadata.status === 'archived' && "bg-gray-500/20 text-gray-400"
              )}>
                {data.metadata.status}
              </span>
            )}
          </div>
        </div>
        
        {/* Sections Preview */}
        {data.sections && data.sections.length > 0 && (
          <div className="px-4 py-3 space-y-2">
            {(!data.collapsed ? data.sections.slice(0, 4) : data.sections.slice(0, 2)).map((section, idx) => {
              const sectionType = getSectionType(section)
              const Icon = sectionType.icon
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors",
                    sectionType.bgColor,
                    "hover:bg-white/10"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", sectionType.color)} />
                  <span className="text-xs text-gray-300 font-medium">{section}</span>
                </div>
              )
            })}
            {data.sections.length > (data.collapsed ? 2 : 4) && (
              <div className="text-xs text-gray-500 px-2.5 flex items-center gap-1">
                <MoreVertical className="h-3 w-3" />
                +{data.sections.length - (data.collapsed ? 2 : 4)} more sections
              </div>
            )}
          </div>
        )}
        
        {/* Metadata Footer */}
        {(data.metadata?.seoScore !== undefined || data.metadata?.pageType) && (
          <div className="px-4 pb-3 pt-2 border-t border-white/10 flex items-center justify-between">
            {data.metadata.pageType && (
              <span className="text-xs text-gray-500">{data.metadata.pageType}</span>
            )}
            {data.metadata.seoScore !== undefined && (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-1 h-3 rounded-full",
                        i < Math.round(data.metadata.seoScore! / 20)
                          ? "bg-green-400"
                          : "bg-gray-600"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-1">SEO</span>
              </div>
            )}
          </div>
        )}
        
        {/* Collapse/Expand Button */}
        {data.children && data.children.length > 0 && (
          <button
            onClick={handleToggleCollapse}
            className={cn(
              "absolute -bottom-3 left-1/2 transform -translate-x-1/2",
              "w-6 h-6 rounded-full bg-gray-800 border border-gray-600",
              "flex items-center justify-center hover:bg-gray-700 transition-colors",
              "shadow-lg"
            )}
          >
            {data.collapsed ? (
              <ChevronRight className="h-3 w-3 text-gray-400" />
            ) : (
              <ChevronDown className="h-3 w-3 text-gray-400" />
            )}
          </button>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
    </>
  )
})

EnhancedPageNode.displayName = 'EnhancedPageNode'

// Enhanced Folder Node with expand/collapse
export const EnhancedFolderNode = memo(({ 
  data, 
  selected,
  id 
}: NodeProps<EnhancedNodeData>) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleToggleCollapse = useCallback(() => {
    data.onToggleCollapse?.(id)
  }, [data, id])
  
  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
      <div
        className={cn(
          "relative px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md",
          "min-w-[180px] max-w-[220px] transition-all duration-300",
          "bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-900/90",
          "border-gray-700/50 transform-gpu",
          selected && "ring-2 ring-[#FF5500] shadow-2xl scale-[1.03] border-[#FF5500]/60",
          isHovered && !selected && "shadow-2xl scale-[1.01] border-white/30"
        )}
        style={{
          borderColor: selected ? undefined : `${data.color}40`,
          background: selected ? undefined : `linear-gradient(135deg, ${data.color}15 0%, ${data.color}08 100%)`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: `${data.color}20` }}
          >
            <Folder 
              className="h-5 w-5" 
              style={{ color: data.color || '#F97316' }}
            />
          </div>
          <h3 className="text-sm font-semibold text-white truncate flex-1">
            {data.label}
          </h3>
          {data.children && data.children.length > 0 && (
            <button
              onClick={handleToggleCollapse}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              {data.collapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
          )}
        </div>
        {data.children && !data.collapsed && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-xs text-gray-400">
              {data.children.length} {data.children.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        )}
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-3 !h-3"
      />
    </>
  )
})

EnhancedFolderNode.displayName = 'EnhancedFolderNode'

export const enhancedNodeTypes = {
  page: EnhancedPageNode,
  folder: EnhancedFolderNode,
}