'use client'

import { useState, useEffect, useCallback, useMemo, MouseEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  XYPosition,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { DemoLayout } from '@/components/studio/deployment/demo-layout'
import { ImportModal } from '@/components/studio/sitemap/import-modal'
import { enhancedNodeTypes, EnhancedNodeData } from '@/components/studio/sitemap/enhanced-nodes'
import { NodeContextMenu } from '@/components/studio/sitemap/context-menu'
import { NodeEditDialog } from '@/components/studio/sitemap/node-edit-dialog'
import { 
  applyAutoLayout, 
  transformSitemapToFlow, 
  parseImportedData 
} from '@/lib/sitemap/auto-layout'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import { 
  Download, Upload, ArrowRight, CheckCircle2, GitBranch,
  Plus, Copy, Trash2, Edit2, FileText, Folder, ChevronDown,
  Maximize2, Grid, ZoomIn, ZoomOut, Move, Square, Layout,
  Scissors, Clipboard, FolderPlus, Eye, EyeOff
} from 'lucide-react'

const initialNodes: Node<EnhancedNodeData>[] = [
  {
    id: 'home',
    type: 'page',
    position: { x: 600, y: 50 },
    data: { 
      label: 'Home',
      url: '/',
      sections: ['Hero', 'Features', 'Testimonials', 'CTA', 'Footer'],
      description: 'Main landing page with brand introduction and key value props',
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Landing',
        seoScore: 85
      }
    },
  },
  {
    id: 'about',
    type: 'page',
    position: { x: 300, y: 180 },
    data: { 
      label: 'About',
      url: '/about',
      sections: ['Hero', 'About', 'Features', 'Gallery', 'Footer'],
      description: 'Company story, mission, values and team',
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Company',
        seoScore: 75
      }
    },
  },
  {
    id: 'products',
    type: 'folder',
    position: { x: 550, y: 180 },
    data: { 
      label: 'Products',
      color: '#F97316',
      expanded: false,
      children: ['product-1', 'product-2']
    },
  },
  {
    id: 'services',
    type: 'folder',
    position: { x: 750, y: 180 },
    data: { 
      label: 'Services',
      color: '#3B82F6',
      expanded: false
    },
  },
  {
    id: 'contact',
    type: 'page',
    position: { x: 950, y: 180 },
    data: { 
      label: 'Contact',
      url: '/contact',
      sections: ['Hero', 'Contact', 'Map', 'Footer'],
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Contact',
        seoScore: 70
      }
    },
  },
  {
    id: 'product-1',
    type: 'page',
    position: { x: 450, y: 300 },
    data: { 
      label: 'Product A',
      url: '/products/product-a',
      sections: ['Hero', 'Features', 'Gallery', 'CTA', 'Footer'],
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Product',
        seoScore: 90
      }
    },
  },
  {
    id: 'product-2',
    type: 'page',
    position: { x: 650, y: 300 },
    data: { 
      label: 'Product B',
      url: '/products/product-b',
      sections: ['Hero', 'Features', 'Video', 'Testimonials', 'Footer'],
      expanded: false,
      metadata: {
        status: 'draft',
        pageType: 'Product',
        seoScore: 65
      }
    },
  },
  {
    id: 'service-1',
    type: 'page',
    position: { x: 750, y: 300 },
    data: { 
      label: 'Consulting',
      url: '/services/consulting',
      sections: ['Hero', 'About', 'Features', 'Contact', 'Footer'],
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Service',
        seoScore: 80
      }
    },
  },
  {
    id: 'blog',
    type: 'folder',
    position: { x: 1200, y: 180 },
    data: { 
      label: 'Blog',
      color: '#10B981',
      expanded: false
    },
  },
]

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: 'home', 
    target: 'about', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e1-3', 
    source: 'home', 
    target: 'products', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e1-4', 
    source: 'home', 
    target: 'services', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e1-5', 
    source: 'home', 
    target: 'contact', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e1-6', 
    source: 'home', 
    target: 'blog', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e3-6', 
    source: 'products', 
    target: 'product-1', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e3-7', 
    source: 'products', 
    target: 'product-2', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
  { 
    id: 'e4-8', 
    source: 'services', 
    target: 'service-1', 
    type: 'smoothstep',
    style: { stroke: 'rgba(255, 255, 255, 0.2)' }
  },
]

function SitemapFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { fitView, zoomTo, getZoom, getNodes, setNodes: rfSetNodes, setEdges: rfSetEdges } = useReactFlow()
  
  const [nodes, setNodes, onNodesChange] = useNodesState<EnhancedNodeData>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importedUrl, setImportedUrl] = useState<string>('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [hasGenerated, setHasGenerated] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([])
  const [copiedNode, setCopiedNode] = useState<Node | null>(null)
  const [clipboard, setClipboard] = useState<{ nodes: Node[], edges: Edge[] } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<Node<EnhancedNodeData> | null>(null)
  const [contextMenuNode, setContextMenuNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<Node | null>(null)
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Apply auto-layout on initial mount to prevent overlapping
  useEffect(() => {
    // Run auto-layout on initial nodes to ensure proper spacing
    const layoutedNodes = applyAutoLayout(initialNodes, initialEdges)
    
    // Find home node and center the viewport on it
    const homeNode = layoutedNodes.find(n => n.id === 'home')
    if (homeNode) {
      // Adjust all nodes to center home horizontally
      const viewportWidth = window.innerWidth || 1500
      const centerX = viewportWidth / 2
      const homeOffsetX = centerX - homeNode.position.x - 160 // 160 is half of node width
      
      const centeredNodes = layoutedNodes.map(node => ({
        ...node,
        position: {
          ...node.position,
          x: node.position.x + homeOffsetX
        }
      }))
      setNodes(centeredNodes)
    } else {
      setNodes(layoutedNodes)
    }
    
    // Give React Flow time to render before fitting view
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 800 })
    }, 200)
  }, [fitView, setNodes])
  
  // Check if coming from import
  useEffect(() => {
    const isImported = searchParams.get('imported') === 'true'
    if (isImported) {
      const url = sessionStorage.getItem('importedUrl')
      if (url) {
        setImportedUrl(url)
        setHasGenerated(true)
        // Auto-layout the imported nodes
        const layoutedNodes = applyAutoLayout(nodes, edges)
        setNodes(layoutedNodes)
        setTimeout(() => fitView({ padding: 0.2 }), 100)
      }
    }
  }, [searchParams])

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Handle multi-select with Ctrl/Cmd
    if (event.ctrlKey || event.metaKey) {
      setSelectedNodes(prev => {
        const isSelected = prev.some(n => n.id === node.id)
        if (isSelected) {
          return prev.filter(n => n.id !== node.id)
        } else {
          return [...prev, node]
        }
      })
    } else {
      setSelectedNodes([node])
    }
  }, [])
  
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Inline editing on double click
    setEditingNode(node)
    setEditDialogOpen(true)
  }, [])
  
  // Drag and drop handlers with visual feedback
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setIsDragging(true)
    setDraggedNode(node)
    // Save to history before drag
    saveToHistory()
  }, [])
  
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node, dragEvent: any) => {
    // Visual feedback during drag - highlight potential drop zones
    if (dragEvent && dragEvent.target) {
      const targetElement = dragEvent.target as HTMLElement
      targetElement.style.cursor = 'grabbing'
    }
  }, [])
  
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    setIsDragging(false)
    setDraggedNode(null)
    // Auto-arrange children after parent is moved
    if (node.data.children && node.data.children.length > 0) {
      setTimeout(() => {
        const layoutedNodes = applyAutoLayout(nodes, edges)
        setNodes(layoutedNodes)
      }, 100)
    }
  }, [nodes, edges, setNodes])

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      setContextMenuNode(node.id)
      if (!selectedNodes.some(n => n.id === node.id)) {
        setSelectedNodes([node])
      }
    },
    [selectedNodes]
  )
  
  // Toggle node collapse/expand
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const node = nds.find(n => n.id === nodeId)
      if (!node || !node.data.children) return nds
      
      const collapsed = !node.data.collapsed
      const updatedNodes = nds.map(n => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, collapsed } }
        }
        return n
      })
      
      // Hide/show child nodes
      const childIds = node.data.children
      return updatedNodes.map(n => ({
        ...n,
        hidden: collapsed && childIds.includes(n.id) ? true : n.hidden
      }))
    })
  }, [])

  const handleImport = useCallback((data: any) => {
    setIsAnalyzing(true)
    setProgress(0)
    setStatus('Processing imported data...')
    
    // Simulate processing
    setTimeout(() => {
      const { nodes: importedNodes, edges: importedEdges } = parseImportedData(data)
      
      // Apply auto-layout
      const layoutedNodes = applyAutoLayout(importedNodes, importedEdges)
      
      setNodes(layoutedNodes)
      setEdges(importedEdges)
      setHasGenerated(true)
      setIsAnalyzing(false)
      setStatus('Import complete!')
      
      // Fit view to show all nodes
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    }, 1000)
  }, [setNodes, setEdges, fitView])

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = applyAutoLayout(nodes, edges)
    
    // Center on home node
    const homeNode = layoutedNodes.find(n => n.id === 'home' || n.data?.label?.toLowerCase() === 'home')
    if (homeNode) {
      const viewportWidth = window.innerWidth || 1500
      const centerX = viewportWidth / 2
      const homeOffsetX = centerX - homeNode.position.x - 160
      
      const centeredNodes = layoutedNodes.map(node => ({
        ...node,
        position: {
          ...node.position,
          x: node.position.x + homeOffsetX
        }
      }))
      setNodes(centeredNodes)
    } else {
      setNodes(layoutedNodes)
    }
    
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [nodes, edges, setNodes, fitView])

  const handleAddNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'page',
      position: { x: 400, y: 400 },
      data: {
        label: 'New Page',
        url: '/new-page',
        sections: [],
        expanded: false
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const handleDuplicateNode = useCallback((nodeId?: string) => {
    const node = nodeId ? nodes.find(n => n.id === nodeId) : selectedNodes[0]
    if (!node) return
    
    const newNode: Node = {
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      },
      data: {
        ...node.data,
        label: `${node.data.label} (Copy)`,
        metadata: {
          ...node.data.metadata,
          status: 'draft'
        }
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [nodes, selectedNodes, setNodes])

  const handleDeleteNode = useCallback((nodeId?: string) => {
    const nodesToDelete = nodeId ? [nodeId] : selectedNodes.map(n => n.id)
    
    setNodes((nds) => nds.filter(n => !nodesToDelete.includes(n.id)))
    setEdges((eds) => eds.filter(e => 
      !nodesToDelete.includes(e.source) && !nodesToDelete.includes(e.target)
    ))
    setSelectedNodes([])
  }, [selectedNodes, setNodes, setEdges])
  
  const handleEditNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setEditingNode(node)
      setEditDialogOpen(true)
    }
  }, [nodes])
  
  const handleSaveNodeEdit = useCallback((nodeId: string, updatedData: any) => {
    setNodes((nds) => nds.map(n => 
      n.id === nodeId ? { ...n, data: updatedData } : n
    ))
  }, [setNodes])
  
  const handleAddChild = useCallback((parentId: string, type: 'page' | 'folder') => {
    const parentNode = nodes.find(n => n.id === parentId)
    if (!parentNode) return
    
    const childId = `${parentId}-child-${Date.now()}`
    const newNode: Node<EnhancedNodeData> = {
      id: childId,
      type,
      position: {
        x: parentNode.position.x,
        y: parentNode.position.y + 150
      },
      data: {
        label: type === 'folder' ? 'New Folder' : 'New Page',
        url: type === 'page' ? '/new-page' : undefined,
        sections: type === 'page' ? [] : undefined,
        color: type === 'folder' ? '#3B82F6' : undefined,
        expanded: false,
        metadata: type === 'page' ? { status: 'draft' } : undefined
      }
    }
    
    const newEdge: Edge = {
      id: `${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      style: { stroke: 'rgba(255, 255, 255, 0.2)' }
    }
    
    setNodes((nds) => {
      const updated = nds.map(n => {
        if (n.id === parentId) {
          return {
            ...n,
            data: {
              ...n.data,
              children: [...(n.data.children || []), childId]
            }
          }
        }
        return n
      })
      return [...updated, newNode]
    })
    setEdges((eds) => [...eds, newEdge])
  }, [nodes, setNodes, setEdges])
  
  const handleConvertType = useCallback((nodeId: string, newType: string) => {
    setNodes((nds) => nds.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          type: newType,
          data: {
            ...n.data,
            sections: newType === 'page' ? [] : undefined,
            url: newType === 'page' ? '/new-page' : undefined,
            color: newType === 'folder' ? '#3B82F6' : undefined,
          }
        }
      }
      return n
    }))
  }, [setNodes])

  const handleCopyNode = useCallback((nodeId?: string) => {
    const node = nodeId ? nodes.find(n => n.id === nodeId) : selectedNodes[0]
    if (node) {
      setCopiedNode(node)
    }
  }, [nodes, selectedNodes])

  const handleCutNode = useCallback((nodeId?: string) => {
    const node = nodeId ? nodes.find(n => n.id === nodeId) : selectedNodes[0]
    if (node) {
      setCopiedNode(node)
      handleDeleteNode(nodeId)
    }
  }, [nodes, selectedNodes, handleDeleteNode])

  const handlePasteNode = useCallback(() => {
    if (!copiedNode) return
    
    const newNode: Node = {
      ...copiedNode,
      id: `${copiedNode.id}-paste-${Date.now()}`,
      position: {
        x: copiedNode.position.x + 100,
        y: copiedNode.position.y + 100
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [copiedNode, setNodes])

  const handleExportJson = useCallback(() => {
    const data = { nodes, edges }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.json'
    a.click()
  }, [nodes, edges])
  
  const handleExportBranch = useCallback((nodeId: string) => {
    const getDescendants = (id: string): string[] => {
      const descendants: string[] = [id]
      const children = edges.filter(e => e.source === id).map(e => e.target)
      children.forEach(childId => {
        descendants.push(...getDescendants(childId))
      })
      return descendants
    }
    
    const branchNodeIds = getDescendants(nodeId)
    const branchNodes = nodes.filter(n => branchNodeIds.includes(n.id))
    const branchEdges = edges.filter(e => 
      branchNodeIds.includes(e.source) && branchNodeIds.includes(e.target)
    )
    
    const data = { nodes: branchNodes, edges: branchEdges }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `branch-${nodeId}.json`
    a.click()
  }, [nodes, edges])

  const handleContinueToWireframe = () => {
    sessionStorage.setItem('sitemapGenerated', 'true')
    sessionStorage.setItem('sitemapData', JSON.stringify({ nodes, edges }))
    router.push('/demo/wireframe?from=sitemap')
  }

  const handleZoomChange = (value: string) => {
    const zoom = parseFloat(value) / 100
    zoomTo(zoom)
  }
  
  // Undo/Redo functionality
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ nodes: [...nodes], edges: [...edges] })
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [nodes, edges, history, historyIndex])
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setNodes(prevState.nodes)
      setEdges(prevState.edges)
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, setNodes, setEdges])
  
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setNodes(nextState.nodes)
      setEdges(nextState.edges)
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, setNodes, setEdges])
  
  // Focus on branch
  const handleFocusBranch = useCallback((nodeId: string) => {
    const getDescendants = (id: string): string[] => {
      const descendants: string[] = [id]
      const children = edges.filter(e => e.source === id).map(e => e.target)
      children.forEach(childId => {
        descendants.push(...getDescendants(childId))
      })
      return descendants
    }
    
    const branchNodeIds = getDescendants(nodeId)
    setNodes((nds) => nds.map(n => ({
      ...n,
      hidden: !branchNodeIds.includes(n.id)
    })))
    
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [edges, setNodes, fitView])
  
  // Show all nodes
  const handleShowAll = useCallback(() => {
    setNodes((nds) => nds.map(n => ({
      ...n,
      hidden: false
    })))
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }, [setNodes, fitView])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key
      if (e.key === 'Delete' && selectedNodes.length > 0) {
        e.preventDefault()
        handleDeleteNode()
      }
      
      // Enter for edit
      if (e.key === 'Enter' && selectedNodes.length === 1) {
        e.preventDefault()
        handleEditNode(selectedNodes[0].id)
      }
      
      // Ctrl/Cmd + D for duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNodes.length > 0) {
        e.preventDefault()
        handleDuplicateNode()
      }
      
      // Ctrl/Cmd + C for copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodes.length > 0) {
        e.preventDefault()
        const nodesToCopy = selectedNodes
        const edgesToCopy = edges.filter(e => 
          nodesToCopy.some(n => n.id === e.source) &&
          nodesToCopy.some(n => n.id === e.target)
        )
        setClipboard({ nodes: nodesToCopy, edges: edgesToCopy })
      }
      
      // Ctrl/Cmd + V for paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard) {
        e.preventDefault()
        const idMap = new Map<string, string>()
        const newNodes = clipboard.nodes.map(node => {
          const newId = `${node.id}-paste-${Date.now()}`
          idMap.set(node.id, newId)
          return {
            ...node,
            id: newId,
            position: {
              x: node.position.x + 100,
              y: node.position.y + 100
            }
          }
        })
        const newEdges = clipboard.edges.map(edge => ({
          ...edge,
          id: `${edge.id}-paste-${Date.now()}`,
          source: idMap.get(edge.source) || edge.source,
          target: idMap.get(edge.target) || edge.target
        }))
        setNodes((nds) => [...nds, ...newNodes])
        setEdges((eds) => [...eds, ...newEdges])
      }
      
      // Ctrl/Cmd + A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault()
        setSelectedNodes(nodes)
      }
      
      // Ctrl/Cmd + Shift + A for auto-layout
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault()
        handleAutoLayout()
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNodes([])
      }
      
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      }
      
      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y for redo
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || 
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault()
        handleRedo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, clipboard, nodes, edges, handleDeleteNode, handleDuplicateNode, handleEditNode, handleAutoLayout, handleUndo, handleRedo, setNodes, setEdges])

  // Add onToggleCollapse to node data and optimize for large node counts
  const nodesWithHandlers = useMemo(() => {
    // Performance optimization: if too many nodes, enable virtualization hint
    const nodeCount = nodes.length
    const enableOptimizations = nodeCount > 100
    
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onToggleCollapse: handleToggleCollapse,
        // Add performance hints for large graphs
        ...(enableOptimizations && {
          className: 'will-change-transform'
        })
      }
    }))
  }, [nodes, handleToggleCollapse])

  // Context menu handlers wrapped in the render
  const renderNode = useCallback((nodeProps: any) => {
    const NodeComponent = enhancedNodeTypes[nodeProps.type as keyof typeof enhancedNodeTypes]
    if (!NodeComponent) return null
    
    return (
      <NodeContextMenu
        nodeId={nodeProps.id}
        nodeType={nodeProps.type}
        onDuplicate={handleDuplicateNode}
        onCopy={handleCopyNode}
        onCut={handleCutNode}
        onPaste={handlePasteNode}
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onAddChild={handleAddChild}
        onConvertType={handleConvertType}
        onExport={handleExportBranch}
        hasClipboard={!!clipboard}
        canHaveChildren={nodeProps.type === 'folder' || nodeProps.type === 'page'}
      >
        <NodeComponent {...nodeProps} />
      </NodeContextMenu>
    )
  }, [clipboard, handleDuplicateNode, handleCopyNode, handleCutNode, handlePasteNode, handleDeleteNode, handleEditNode, handleAddChild, handleConvertType, handleExportBranch])

  return (
    <>
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={enhancedNodeTypes}
        nodeDragThreshold={1}
        fitView={false}
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black"
        proOptions={{ hideAttribution: true }}
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { 
            stroke: 'rgba(255, 255, 255, 0.2)', 
            strokeWidth: 2,
            strokeDasharray: isDragging ? '5 5' : '0',
          },
          animated: isDragging,
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.2)' }
        }}
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
      >
        <Background variant="dots" gap={20} size={1} color="rgba(255, 255, 255, 0.05)" />
        
        <Panel position="top-left" className="flex items-center gap-4">
          {/* Import Status */}
          {importedUrl && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Imported from: {importedUrl}
            </Badge>
          )}
          
          {/* Import Button */}
          <Button
            onClick={() => setImportModalOpen(true)}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
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
          
          {/* Focus Mode */}
          {selectedNodes.length === 1 && (
            <Button
              onClick={() => handleFocusBranch(selectedNodes[0].id)}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Eye className="h-4 w-4 mr-2" />
              Focus Branch
            </Button>
          )}
          
          {/* Show All (when nodes are hidden) */}
          {nodes.some(n => n.hidden) && (
            <Button
              onClick={handleShowAll}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              Show All
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
            Export JSON
          </Button>
          
          {/* Selected Nodes Info */}
          {selectedNodes.length > 0 && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {selectedNodes.length} selected
            </Badge>
          )}
          
          {/* Quick Actions */}
          {selectedNodes.length === 1 && (
            <Button
              onClick={() => handleEditNode(selectedNodes[0].id)}
              size="sm"
              variant="outline"
              className="bg-white/10 border-white/20 hover:bg-white/20"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          
          {/* Continue Button */}
          {hasGenerated && nodes.length > 0 && (
            <Button
              onClick={handleContinueToWireframe}
              size="sm"
              className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0"
            >
              Generate Wireframes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </Panel>
        
        <Panel position="top-right" className="flex items-center gap-2">
          {/* Zoom Dropdown with Presets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 min-w-[100px]"
              >
                <ZoomIn className="h-4 w-4 mr-2" />
                {Math.round(getZoom() * 100)}%
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
              <DropdownMenuItem 
                onClick={() => handleZoomChange('25')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                25%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('50')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                50%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('75')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                75%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('100')}
                className="text-gray-300 hover:text-white hover:bg-gray-800 font-semibold"
              >
                100% (Default)
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('125')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                125%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('150')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                150%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('200')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                200%
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={() => fitView({ padding: 0.2 })}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Fit to View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Fit View Button */}
          <Button
            onClick={() => fitView({ padding: 0.2 })}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </Panel>
        
        <Controls 
          className="bg-white/10 border-white/20"
          showZoom={true}
          showFitView={false}
        />
        
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'folder') return node.data.color || '#F97316'
            if (node.data.label === 'Home') return '#FF5500'
            return '#6B7280'
          }}
          className="bg-black/50 border border-white/10"
          maskColor="rgba(0, 0, 0, 0.8)"
        />
      </ReactFlow>
      
      {/* Node Edit Dialog */}
      <NodeEditDialog
        isOpen={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setEditingNode(null)
        }}
        nodeData={editingNode}
        onSave={handleSaveNodeEdit}
      />
      
      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />
      
      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{status}</span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </>
  )
}

export default function SitemapBuilderDemo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  return (
    <DemoLayout title="Sitemap Builder" subtitle="Step 2: Visualize Site Structure">
      <div className="h-full w-full">
        <ReactFlowProvider>
          <SitemapFlow />
        </ReactFlowProvider>
      </div>
    </DemoLayout>
  )
}