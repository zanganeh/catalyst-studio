'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  Home, 
  Folder, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  MoreVertical,
  ExternalLink
} from 'lucide-react'

interface CustomNodeData {
  label: string
  url?: string
  sections?: string[]
  description?: string
  expanded?: boolean
  icon?: string
  color?: string
}

export const PageNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  const isHome = data.label?.toLowerCase() === 'home'
  
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={`
          px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md
          min-w-[200px] max-w-[260px] transition-all duration-200
          ${isHome 
            ? 'bg-gradient-to-br from-[#FF5500]/20 to-[#FF6600]/10 border-[#FF5500]/30' 
            : 'bg-gradient-to-br from-white/10 to-white/5 border-white/20'
          }
          ${selected ? 'ring-2 ring-[#FF5500] shadow-xl scale-[1.02]' : ''}
          hover:shadow-xl hover:border-white/30 hover:scale-[1.01]
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isHome ? (
              <Home className="h-5 w-5 text-[#FF5500]" />
            ) : (
              <FileText className="h-4 w-4 text-gray-400" />
            )}
            <h3 className="text-sm font-medium text-white">{data.label}</h3>
          </div>
          <button className="text-gray-400 hover:text-white">
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
        
        {data.url && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{data.url}</span>
          </div>
        )}
        
        {data.sections && data.sections.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            {data.expanded ? (
              <div className="space-y-1">
                {data.sections.slice(0, 3).map((section, idx) => (
                  <div key={idx} className="text-xs text-gray-400">
                    • {section}
                  </div>
                ))}
                {data.sections.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{data.sections.length - 3} more sections
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                {data.sections.length} sections
              </div>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
})

PageNode.displayName = 'PageNode'

export const FolderNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={`
          px-3 py-2 rounded-lg shadow-lg border backdrop-blur-md
          min-w-[140px] max-w-[180px] transition-all duration-200
          bg-gradient-to-br from-white/10 to-white/5 border-white/20
          ${selected ? 'ring-2 ring-[#FF5500] shadow-xl scale-[1.02]' : ''}
          hover:shadow-xl hover:border-white/30 hover:scale-[1.01]
        `}
      >
        <div className="flex items-center gap-2">
          <Folder 
            className="h-5 w-5" 
            style={{ color: data.color || '#F97316' }}
          />
          <h3 className="text-sm font-medium text-white truncate">{data.label}</h3>
          <button className="ml-auto text-gray-400 hover:text-white">
            {data.expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
})

FolderNode.displayName = 'FolderNode'

export const SectionNode = memo(({ data, selected }: NodeProps<CustomNodeData>) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div
        className={`
          px-3 py-2 rounded shadow border
          min-w-[120px] max-w-[160px] transition-all duration-200
          bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700
          ${selected ? 'ring-2 ring-[#FF5500] shadow-lg' : ''}
          hover:shadow-lg hover:border-gray-600
        `}
      >
        <div className="text-xs font-medium text-gray-300">{data.label}</div>
        {data.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {data.description}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  )
})

SectionNode.displayName = 'SectionNode'

export const nodeTypes = {
  page: PageNode,
  folder: FolderNode,
  section: SectionNode,
}