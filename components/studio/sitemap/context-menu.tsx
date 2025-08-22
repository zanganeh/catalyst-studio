'use client'

import { useCallback } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Edit2,
  Plus,
  FolderPlus,
  Layers,
  FileText,
  Folder,
  GitBranch,
  Eye,
  EyeOff,
  Link2,
  Unlink,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react'

interface NodeContextMenuProps {
  children: React.ReactNode
  nodeId: string
  nodeType: string
  onDuplicate: (nodeId: string) => void
  onCopy: (nodeId: string) => void
  onCut: (nodeId: string) => void
  onPaste: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onEdit: (nodeId: string) => void
  onAddChild: (nodeId: string, type: 'page' | 'folder') => void
  onConvertType: (nodeId: string, newType: string) => void
  onToggleVisibility?: (nodeId: string) => void
  onConnect?: (nodeId: string) => void
  onDisconnect?: (nodeId: string) => void
  onExport?: (nodeId: string) => void
  onRefresh?: (nodeId: string) => void
  hasClipboard?: boolean
  isVisible?: boolean
  isConnected?: boolean
  canHaveChildren?: boolean
}

export function NodeContextMenu({
  children,
  nodeId,
  nodeType,
  onDuplicate,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onEdit,
  onAddChild,
  onConvertType,
  onToggleVisibility,
  onConnect,
  onDisconnect,
  onExport,
  onRefresh,
  hasClipboard = false,
  isVisible = true,
  isConnected = true,
  canHaveChildren = true,
}: NodeContextMenuProps) {
  
  const handleDuplicate = useCallback((e: Event) => {
    e.preventDefault()
    onDuplicate(nodeId)
  }, [nodeId, onDuplicate])
  
  const handleCopy = useCallback((e: Event) => {
    e.preventDefault()
    onCopy(nodeId)
  }, [nodeId, onCopy])
  
  const handleCut = useCallback((e: Event) => {
    e.preventDefault()
    onCut(nodeId)
  }, [nodeId, onCut])
  
  const handlePaste = useCallback((e: Event) => {
    e.preventDefault()
    onPaste(nodeId)
  }, [nodeId, onPaste])
  
  const handleDelete = useCallback((e: Event) => {
    e.preventDefault()
    onDelete(nodeId)
  }, [nodeId, onDelete])
  
  const handleEdit = useCallback((e: Event) => {
    e.preventDefault()
    onEdit(nodeId)
  }, [nodeId, onEdit])
  
  const handleAddPage = useCallback((e: Event) => {
    e.preventDefault()
    onAddChild(nodeId, 'page')
  }, [nodeId, onAddChild])
  
  const handleAddFolder = useCallback((e: Event) => {
    e.preventDefault()
    onAddChild(nodeId, 'folder')
  }, [nodeId, onAddChild])
  
  const handleConvertToPage = useCallback((e: Event) => {
    e.preventDefault()
    onConvertType(nodeId, 'page')
  }, [nodeId, onConvertType])
  
  const handleConvertToFolder = useCallback((e: Event) => {
    e.preventDefault()
    onConvertType(nodeId, 'folder')
  }, [nodeId, onConvertType])
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-gray-900/95 backdrop-blur-md border-gray-700">
        {/* Edit Actions */}
        <ContextMenuItem onSelect={handleEdit} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <Edit2 className="mr-2 h-4 w-4" />
          Edit Details
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onSelect={handleDuplicate} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-gray-700" />
        
        {/* Clipboard Actions */}
        <ContextMenuItem onSelect={handleCopy} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onSelect={handleCut} className="text-gray-300 hover:text-white hover:bg-gray-800">
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onSelect={handlePaste} 
          disabled={!hasClipboard}
          className="text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-50"
        >
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator className="bg-gray-700" />
        
        {/* Add Children Actions */}
        {canHaveChildren && (
          <>
            <ContextMenuItem onSelect={handleAddPage} className="text-gray-300 hover:text-white hover:bg-gray-800">
              <Plus className="mr-2 h-4 w-4" />
              Add Child Page
              <ContextMenuShortcut>⌘N</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem onSelect={handleAddFolder} className="text-gray-300 hover:text-white hover:bg-gray-800">
              <FolderPlus className="mr-2 h-4 w-4" />
              Add Child Folder
            </ContextMenuItem>
            
            <ContextMenuSeparator className="bg-gray-700" />
          </>
        )}
        
        {/* Type Conversion */}
        {nodeType === 'folder' ? (
          <ContextMenuItem onSelect={handleConvertToPage} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <FileText className="mr-2 h-4 w-4" />
            Convert to Page
          </ContextMenuItem>
        ) : (
          <ContextMenuItem onSelect={handleConvertToFolder} className="text-gray-300 hover:text-white hover:bg-gray-800">
            <Folder className="mr-2 h-4 w-4" />
            Convert to Folder
          </ContextMenuItem>
        )}
        
        {/* View Actions */}
        {onToggleVisibility && (
          <>
            <ContextMenuSeparator className="bg-gray-700" />
            <ContextMenuItem 
              onSelect={(e) => {
                e.preventDefault()
                onToggleVisibility(nodeId)
              }}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              {isVisible ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Hide Node
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Show Node
                </>
              )}
            </ContextMenuItem>
          </>
        )}
        
        {/* Connection Actions */}
        {(onConnect || onDisconnect) && (
          <>
            <ContextMenuSeparator className="bg-gray-700" />
            {isConnected && onDisconnect ? (
              <ContextMenuItem 
                onSelect={(e) => {
                  e.preventDefault()
                  onDisconnect(nodeId)
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </ContextMenuItem>
            ) : onConnect ? (
              <ContextMenuItem 
                onSelect={(e) => {
                  e.preventDefault()
                  onConnect(nodeId)
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Connect
              </ContextMenuItem>
            ) : null}
          </>
        )}
        
        {/* Advanced Actions */}
        {(onExport || onRefresh) && (
          <>
            <ContextMenuSeparator className="bg-gray-700" />
            {onExport && (
              <ContextMenuItem 
                onSelect={(e) => {
                  e.preventDefault()
                  onExport(nodeId)
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Branch
              </ContextMenuItem>
            )}
            {onRefresh && (
              <ContextMenuItem 
                onSelect={(e) => {
                  e.preventDefault()
                  onRefresh(nodeId)
                }}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Content
              </ContextMenuItem>
            )}
          </>
        )}
        
        <ContextMenuSeparator className="bg-gray-700" />
        
        {/* Delete Action */}
        <ContextMenuItem 
          onSelect={handleDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}