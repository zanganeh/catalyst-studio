'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './sitemap-print.css'

import { DemoLayoutFullWidth } from '@/lib/premium/components/layouts/demo-layout-fullwidth'
import { professionalNodeTypes } from '@/lib/premium/components/sitemap/professional-nodes'
import { SaveStatusIndicator } from '@/lib/premium/components/sitemap/save-status-indicator'
import { useSitemapStore } from '@/lib/premium/stores/sitemap-store'
import { useAutoSave } from '@/lib/premium/hooks/use-auto-save'
import { calculateLayout } from '@/lib/premium/components/sitemap/layout/dagre-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, Upload, ArrowRight, CheckCircle2,
  Plus, Layout, RefreshCw, AlertCircle,
  Undo2, Redo2, Save, Database
} from 'lucide-react'

// Demo website ID - in production this would come from route params or context
const DEMO_WEBSITE_ID = 'demo-website-001'

function SitemapFlowDB() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fitView, zoomTo, getZoom } = useReactFlow()
  
  // Zustand store state
  const {
    nodes,
    edges,
    websiteId,
    isLoading,
    errorState,
    selectedNodes,
    saveStatus,
    loadStructure,
    addNode,
    updateNode,
    deleteNodes,
    moveNode,
    setSelectedNodes,
    onNodesChange,
    onEdgesChange,
    onConnect,
    undo,
    redo,
    canUndo,
    canRedo
  } = useSitemapStore()
  
  // Auto-save hook
  const { hasUnsavedChanges, saveNow, retry } = useAutoSave({
    enabled: true,
    warnOnUnload: true
  })
  
  // Load data from database on mount
  useEffect(() => {
    loadStructure(DEMO_WEBSITE_ID)
  }, [])
  
  // Apply layout when nodes change significantly
  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return
    
    const layoutConfig = {
      rankdir: 'TB' as const,
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
      width: 320,
      height: 200
    }
    
    // Ensure nodes have proper type for layout calculation
    const layoutNodes = nodes.map(node => ({
      ...node,
      type: (node.type || 'page') as 'page' | 'folder'
    }))
    
    const layoutResult = calculateLayout(layoutNodes, edges, layoutConfig)
    
    // Update node positions in store
    if (layoutResult.success && layoutResult.nodes) {
      layoutResult.nodes.forEach(node => {
        updateNode(node.id, { position: node.position })
      })
    }
    
    setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100)
  }, [nodes, edges, updateNode, fitView])
  
  // Handle add new node
  const handleAddNode = useCallback(() => {
    addNode(null, {
      title: 'New Page',
      slug: 'new-page',
      contentTypeId: 'default-page-type' // TODO: Get actual content type ID
    })
  }, [addNode])
  
  // Handle delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length > 0) {
      deleteNodes(selectedNodes)
    }
  }, [selectedNodes, deleteNodes])
  
  // Handle export
  const handleExportJson = useCallback(() => {
    const data = { 
      nodes, 
      edges,
      websiteId,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${websiteId}-${Date.now()}.json`
    a.click()
  }, [nodes, edges, websiteId])
  
  // Node click handler
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      const isSelected = selectedNodes.includes(node.id)
      if (isSelected) {
        setSelectedNodes(selectedNodes.filter(id => id !== node.id))
      } else {
        setSelectedNodes([...selectedNodes, node.id])
      }
    } else {
      // Single select
      setSelectedNodes([node.id])
    }
  }, [selectedNodes, setSelectedNodes])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo()) undo()
      }
      
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        if (canRedo()) redo()
      }
      
      // Delete key
      if (e.key === 'Delete' && selectedNodes.length > 0) {
        e.preventDefault()
        handleDeleteSelected()
      }
      
      // L for auto-layout
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleAutoLayout()
      }
      
      // N for new node
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleAddNode()
      }
      
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, handleDeleteSelected, handleAutoLayout, handleAddNode, saveNow, undo, redo, canUndo, canRedo])
  
  return (
    <>
      {/* Save Status Indicator */}
      <SaveStatusIndicator showDetails />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={professionalNodeTypes}
        fitView={false}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full h-full"
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.2)' }
        }}
      >
        <Background 
          gap={20} 
          size={1.5} 
          color="rgba(255, 255, 255, 0.03)" 
        />
        
        <Panel position="top-left" className="flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2 glass-panel rounded-lg p-2 shadow-lg">
            
            {/* Database Status */}
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Database className="h-3 w-3 mr-1" />
              Connected to DB
            </Badge>
            
            {/* Loading Indicator */}
            {isLoading && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Loading...
              </Badge>
            )}
            
            {/* Error Indicator */}
            {errorState && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errorState.message}
              </Badge>
            )}
            
            {/* Add Node Button */}
            <Button
              onClick={handleAddNode}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Page
            </Button>
            
            {/* Auto Layout Button */}
            <Button
              onClick={handleAutoLayout}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Layout className="h-4 w-4 mr-2" />
              Auto Layout
            </Button>
            
            {/* Undo/Redo Buttons */}
            <div className="flex items-center gap-1">
              <Button
                onClick={undo}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                disabled={!canUndo()}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                onClick={redo}
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 disabled:opacity-50"
                disabled={!canRedo()}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Save Now Button */}
            {hasUnsavedChanges && (
              <Button
                onClick={() => saveNow()}
                size="sm"
                variant="outline"
                className="bg-green-500/20 border-green-500/30 hover:bg-green-500/30"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Now
              </Button>
            )}
            
            {/* Export Button */}
            <Button
              onClick={handleExportJson}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            {/* Selected Nodes Info */}
            {selectedNodes.length > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {selectedNodes.length} selected
              </Badge>
            )}
          </div>
        </Panel>
        
        <Controls className="bg-white/10 border-white/20" />
        
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'folder') return '#F97316'
            if (node.data?.label === 'Home') return '#FF5500'
            return '#6B7280'
          }}
          className="bg-black/50 border border-white/10"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </>
  )
}

export default function SitemapBuilderDemoDB() {
  return (
    <DemoLayoutFullWidth 
      title="Sitemap Builder (Database Connected)" 
      subtitle="Live database integration with auto-save"
    >
      <div className="h-full w-full absolute inset-0">
        <ReactFlowProvider>
          <SitemapFlowDB />
        </ReactFlowProvider>
      </div>
    </DemoLayoutFullWidth>
  )
}