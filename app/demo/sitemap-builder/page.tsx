'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import './sitemap-print.css'

import { DemoLayoutFullWidth } from '@/components/studio/deployment/demo-layout-fullwidth'
import { ImportModal } from '@/components/studio/sitemap/import-modal'
import { professionalNodeTypes, ProfessionalNodeData } from '@/components/studio/sitemap/professional-nodes'
import { NodeEditDialog } from '@/components/studio/sitemap/node-edit-dialog'
import { KeyboardShortcutsHelp } from '@/components/studio/sitemap/keyboard-shortcuts-help'
import { TemplatesModal } from '@/components/studio/sitemap/templates-modal'
import { CommentsSystem } from '@/components/studio/sitemap/comments-system'
import { ShareExportModal } from '@/components/studio/sitemap/share-export-modal'
import { VersionHistory } from '@/components/studio/sitemap/version-history'
import { AISuggestionsEnhanced } from '@/components/studio/sitemap/ai-suggestions-enhanced'
import { GlobalSectionsLibrary } from '@/components/studio/sitemap/global-sections-library'
import { VirtualCanvas } from '@/components/studio/sitemap/virtual-canvas'
import { ResponsiveWrapper } from '@/components/studio/sitemap/responsive-wrapper'
import { AdvancedFilters } from '@/components/studio/sitemap/advanced-filters'
import { SectionPicker } from '@/components/studio/sitemap/section-picker'
import { useSitemapPerformance } from '@/hooks/use-sitemap-performance'
import { 
  applyAutoLayout, 
 
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
  Download, Upload, ArrowRight, CheckCircle2,
  Plus, Copy, Trash2, Edit2, ChevronDown,
  Maximize2, ZoomIn, Move, Layout,
  Eye, EyeOff, Sparkles, HelpCircle,
  Share2, Clock, Brain, Package, Search, Filter,
  Check, Link2, Printer
} from 'lucide-react'

const initialNodes: Node<ProfessionalNodeData>[] = [
  {
    id: 'home',
    type: 'page',
    position: { x: 600, y: 50 },
    data: { 
      label: 'Home',
      url: '/',
      components: ['Hero', 'Features', 'Testimonials', 'CTA', 'Footer'],
      description: 'Main landing page with brand introduction and key value props',
      expanded: false,
      metadata: {
        status: 'published',
        pageType: 'Landing',
        seoScore: 85,
        priority: 'high',
        lastModified: '2024-01-15',
        author: 'Marketing Team'
      },
      stats: {
        views: 12450,
        conversions: 3.2,
        bounceRate: 42
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
      components: ['Hero', 'About', 'Features', 'Gallery', 'Footer'],
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
      components: ['Hero', 'Contact', 'Map', 'Footer'],
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
      components: ['Hero', 'Features', 'Gallery', 'CTA', 'Footer'],
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
      components: ['Hero', 'Features', 'Video', 'Testimonials', 'Footer'],
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
      components: ['Hero', 'About', 'Features', 'Contact', 'Footer'],
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState<ProfessionalNodeData>(initialNodes)
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
  const [editingNode, setEditingNode] = useState<Node<ProfessionalNodeData> | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentNodeId, setCommentNodeId] = useState<string | null>(null)
  const [shareExportOpen, setShareExportOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [aiSuggestionsOpen, setAISuggestionsOpen] = useState(false)
  const [globalSectionsOpen, setGlobalSectionsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [spacePressed, setSpacePressed] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<any>(null)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [colorCodingEnabled, setColorCodingEnabled] = useState(true)
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false)
  const [sectionPickerNodeId, setSectionPickerNodeId] = useState<string | null>(null)
  const [sectionPickerAfterIndex, setSectionPickerAfterIndex] = useState<number | undefined>(undefined)

  // Performance optimization hook
  const {
    optimizeNodes,
    optimizeEdges,
    loadProgressively,
    debounce,
    isLoading: perfLoading,
    loadProgress: perfProgress,
    metrics
  } = useSitemapPerformance({
    enableVirtualization: nodes.length > 50,
    enableCaching: true,
    enableProgressiveLoading: nodes.length > 100
  })

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
    // Don't select node if space is pressed (panning mode)
    if (spacePressed) return
    
    // Handle drag-to-connect mode
    if (isConnecting && connectingFrom) {
      if (connectingFrom !== node.id) {
        // Create new edge
        const newEdge: Edge = {
          id: `${connectingFrom}-${node.id}-${Date.now()}`,
          source: connectingFrom,
          target: node.id,
          type: 'smoothstep',
          style: { stroke: 'rgba(255, 255, 255, 0.2)' },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255, 255, 255, 0.2)' }
        }
        setEdges((eds) => [...eds, newEdge])
      }
      setIsConnecting(false)
      setConnectingFrom(null)
      return
    }
    
    // Handle inline editing on double click
    if (event.detail === 2 && !event.ctrlKey && !event.metaKey) {
      // Double-click handled in node component for inline editing
      return
    }
    
    // Handle multi-select with Ctrl/Cmd or Shift
    if (event.ctrlKey || event.metaKey) {
      setSelectedNodes(prev => {
        const isSelected = prev.some(n => n.id === node.id)
        if (isSelected) {
          return prev.filter(n => n.id !== node.id)
        } else {
          return [...prev, node]
        }
      })
    } else if (event.shiftKey && selectedNodes.length > 0) {
      // Shift+click for range selection
      const lastSelected = selectedNodes[selectedNodes.length - 1]
      const allNodes = nodes.filter(n => !n.hidden)
      const lastIndex = allNodes.findIndex(n => n.id === lastSelected.id)
      const currentIndex = allNodes.findIndex(n => n.id === node.id)
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex)
        const end = Math.max(lastIndex, currentIndex)
        const rangeNodes = allNodes.slice(start, end + 1)
        setSelectedNodes(rangeNodes)
      }
    } else {
      setSelectedNodes([node])
    }
  }, [isConnecting, connectingFrom, setEdges, spacePressed])
  
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Enable inline editing for the node - no modal
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        isEditing: true
      }
    }
    setNodes(nodes => nodes.map(n => 
      n.id === node.id ? updatedNode : { ...n, data: { ...n.data, isEditing: false }}
    ))
  }, [])

  // Inline editing callbacks
  const handleNodeLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
              isEditing: false
            }
          }
        }
        return node
      })
    )
    saveToHistory()
  }, [])

  const handleComponentAdd = useCallback((nodeId: string, component: string, afterIndex?: number) => {
    // Check if this is a request to open the picker modal
    if (component === '__OPEN_PICKER__') {
      setSectionPickerNodeId(nodeId)
      setSectionPickerAfterIndex(afterIndex)
      setSectionPickerOpen(true)
      return
    }
    
    // Otherwise add the component normally
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          const currentComponents = node.data.components || []
          let newComponents: string[]
          
          if (afterIndex !== undefined) {
            if (afterIndex === -1) {
              // Insert at beginning
              newComponents = [component, ...currentComponents]
            } else {
              // Insert after specific index
              newComponents = [
                ...currentComponents.slice(0, afterIndex + 1),
                component,
                ...currentComponents.slice(afterIndex + 1)
              ]
            }
          } else {
            // Add to end
            newComponents = [...currentComponents, component]
          }
          
          return {
            ...node,
            data: {
              ...node.data,
              components: newComponents
            }
          }
        }
        return node
      })
    )
    saveToHistory()
  }, [])

  const handleSectionSelect = useCallback((sectionName: string) => {
    if (sectionPickerNodeId) {
      handleComponentAdd(sectionPickerNodeId, sectionName, sectionPickerAfterIndex)
    }
    setSectionPickerOpen(false)
    setSectionPickerNodeId(null)
    setSectionPickerAfterIndex(undefined)
  }, [sectionPickerNodeId, sectionPickerAfterIndex, handleComponentAdd])

  const handleComponentRemove = useCallback((nodeId: string, componentIndex: number) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          const newComponents = [...(node.data.components || [])]
          newComponents.splice(componentIndex, 1)
          return {
            ...node,
            data: {
              ...node.data,
              components: newComponents
            }
          }
        }
        return node
      })
    )
    saveToHistory()
  }, [])

  const handleComponentsReorder = useCallback((nodeId: string, newComponents: string[]) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              components: newComponents
            }
          }
        }
        return node
      })
    )
    saveToHistory()
  }, [])
  
  // Drag and drop handlers with visual feedback
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setIsDragging(true)
    // Node drag started
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
    // Node drag stopped
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
      // Context menu for node
      if (!selectedNodes.some(n => n.id === node.id)) {
        setSelectedNodes([node])
      }
    },
    [selectedNodes]
  )
  
  // Toggle node collapse/expand with recursive hiding
  const handleToggleCollapse = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const node = nds.find(n => n.id === nodeId)
      if (!node) return nds
      
      const collapsed = !node.data.collapsed
      
      // Get all descendant nodes recursively
      const getDescendants = (parentId: string): string[] => {
        const descendants: string[] = []
        const childEdges = edges.filter(e => e.source === parentId)
        childEdges.forEach(edge => {
          descendants.push(edge.target)
          descendants.push(...getDescendants(edge.target))
        })
        return descendants
      }
      
      const descendantIds = getDescendants(nodeId)
      
      // Update nodes with collapse state and visibility
      return nds.map(n => {
        if (n.id === nodeId) {
          return { ...n, data: { ...n.data, collapsed } }
        }
        if (descendantIds.includes(n.id)) {
          return { ...n, hidden: collapsed }
        }
        return n
      })
    })
    
    // Also hide/show edges connected to hidden nodes
    setEdges((eds) => eds.map(e => {
      const node = nodes.find(n => n.id === e.target || n.id === e.source)
      return { ...e, hidden: node?.hidden }
    }))
  }, [edges, nodes, setEdges])

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
        components: [],
        expanded: false
      }
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  // Enhanced Undo/Redo functionality with debouncing - moved here to fix initialization error
  const saveToHistory = useCallback(() => {
    // Don't save if we're in the middle of an undo/redo operation
    if (history.length > 0 && historyIndex >= 0) {
      const currentState = history[historyIndex]
      if (JSON.stringify(currentState.nodes) === JSON.stringify(nodes) &&
          JSON.stringify(currentState.edges) === JSON.stringify(edges)) {
        return // No changes to save
      }
    }
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push({ 
      nodes: JSON.parse(JSON.stringify(nodes)), 
      edges: JSON.parse(JSON.stringify(edges)) 
    })
    
    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [nodes, edges, history, historyIndex])

  const handleDuplicateNode = useCallback((nodeId?: string, includeChildren: boolean = false) => {
    const node = nodeId ? nodes.find(n => n.id === nodeId) : selectedNodes[0]
    if (!node) return
    
    saveToHistory() // Save state before duplication
    
    const timestamp = Date.now()
    const nodeMap = new Map<string, string>() // Old ID -> New ID mapping
    
    // Duplicate the main node
    const newNodeId = `${node.id}-copy-${timestamp}`
    nodeMap.set(node.id, newNodeId)
    
    const newNode: Node = {
      ...node,
      id: newNodeId,
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
        },
        children: includeChildren && node.data.children 
          ? node.data.children.map((childId: string) => `${childId}-copy-${timestamp}`)
          : []
      }
    }
    
    const newNodes = [newNode]
    const newEdges: Edge[] = []
    
    // If including children, duplicate all descendants
    if (includeChildren && node.data.children) {
      const duplicateDescendants = (parentId: string, parentNewId: string) => {
        const children = nodes.filter(n => 
          edges.some(e => e.source === parentId && e.target === n.id)
        )
        
        children.forEach(child => {
          const childNewId = `${child.id}-copy-${timestamp}`
          nodeMap.set(child.id, childNewId)
          
          newNodes.push({
            ...child,
            id: childNewId,
            position: {
              x: child.position.x + 50,
              y: child.position.y + 50
            },
            data: {
              ...child.data,
              label: `${child.data.label} (Copy)`,
              metadata: {
                ...child.data.metadata,
                status: 'draft'
              }
            }
          })
          
          // Add edge from parent to child
          newEdges.push({
            id: `${parentNewId}-${childNewId}`,
            source: parentNewId,
            target: childNewId,
            type: 'smoothstep',
            style: { stroke: 'rgba(255, 255, 255, 0.2)' }
          })
          
          // Recursively duplicate children
          duplicateDescendants(child.id, childNewId)
        })
      }
      
      duplicateDescendants(node.id, newNodeId)
    }
    
    setNodes((nds) => [...nds, ...newNodes])
    setEdges((eds) => [...eds, ...newEdges])
  }, [nodes, edges, selectedNodes, setNodes, setEdges, saveToHistory])

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
    const newNode: Node<ProfessionalNodeData> = {
      id: childId,
      type,
      position: {
        x: parentNode.position.x,
        y: parentNode.position.y + 150
      },
      data: {
        label: type === 'folder' ? 'New Folder' : 'New Page',
        url: type === 'page' ? '/new-page' : undefined,
        components: type === 'page' ? [] : undefined,
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
            components: newType === 'page' ? [] : undefined,
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
  
  const handleTemplateSelect = (templateNodes: Node<ProfessionalNodeData>[], templateEdges: Edge[]) => {
    const layoutedNodes = applyAutoLayout(templateNodes, templateEdges)
    setNodes(layoutedNodes)
    setEdges(templateEdges)
    setHasGenerated(true)
    saveToHistory()
    setTimeout(() => fitView({ padding: 0.2 }), 100)
  }

  const handleZoomChange = (value: string) => {
    const zoom = parseFloat(value) / 100
    zoomTo(zoom, { duration: 300 })
  }

  // Color coding by page type
  const getNodeColor = useCallback((node: Node<ProfessionalNodeData>) => {
    if (!colorCodingEnabled) return undefined
    
    const pageType = node.data.metadata?.pageType
    switch(pageType) {
      case 'Landing': return '#FF5500'
      case 'Product': return '#3B82F6'
      case 'Blog': return '#10B981'
      case 'Legal': return '#EF4444'
      case 'Support': return '#8B5CF6'
      default: return '#6B7280'
    }
  }, [colorCodingEnabled])

  // Fullscreen mode toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Print function
  const handlePrint = useCallback(() => {
    // Add print legend
    const legend = document.createElement('div')
    legend.className = 'print-legend print-only'
    legend.innerHTML = `
      <div class="print-legend-item">
        <span class="print-legend-color" style="background: #FF5500;"></span>
        <span>Landing Page</span>
      </div>
      <div class="print-legend-item">
        <span class="print-legend-color" style="background: #3B82F6;"></span>
        <span>Product Page</span>
      </div>
      <div class="print-legend-item">
        <span class="print-legend-color" style="background: #10B981;"></span>
        <span>Blog Post</span>
      </div>
      <div class="print-legend-item">
        <span class="print-legend-color" style="background: #EF4444;"></span>
        <span>Legal Page</span>
      </div>
      <div class="print-legend-item">
        <span class="print-legend-color" style="background: #8B5CF6;"></span>
        <span>Support Page</span>
      </div>
    `
    document.body.appendChild(legend)
    
    // Trigger print
    window.print()
    
    // Remove legend after print
    setTimeout(() => {
      document.body.removeChild(legend)
    }, 1000)
  }, [])
  
  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return
    
    const saveTimer = setTimeout(() => {
      if (nodes.length > 0 && !isSaving) {
        setIsSaving(true)
        // Simulate save operation
        setTimeout(() => {
          setLastSaveTime(new Date())
          setIsSaving(false)
          sessionStorage.setItem('sitemapAutoSave', JSON.stringify({ nodes, edges }))
        }, 500)
      }
    }, 3000) // Auto-save after 3 seconds of inactivity
    
    return () => clearTimeout(saveTimer)
  }, [nodes, edges, autoSaveEnabled, isSaving])
  
  // Filter nodes based on search, status, and advanced filters
  const filteredNodes = useMemo(() => {
    let filtered = nodes
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(node => 
        node.data.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.data.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(node => 
        node.data.metadata?.status === filterStatus
      )
    }
    
    // Advanced filters
    if (advancedFilters) {
      // SEO Score filter
      if (advancedFilters.seoScoreMin > 0 || advancedFilters.seoScoreMax < 100) {
        filtered = filtered.filter(node => {
          const score = node.data.metadata?.seoScore || 0
          return score >= advancedFilters.seoScoreMin && score <= advancedFilters.seoScoreMax
        })
      }
      
      // Page type filter
      if (advancedFilters.pageType !== 'all') {
        filtered = filtered.filter(node => 
          node.data.metadata?.pageType?.toLowerCase() === advancedFilters.pageType
        )
      }
      
      // Has components filter
      if (advancedFilters.hasComponents) {
        filtered = filtered.filter(node => 
          node.data.components && node.data.components.length > 0
        )
      }
    }
    
    return filtered
  }, [nodes, searchQuery, filterStatus, advancedFilters])
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0
    if (advancedFilters) {
      if (advancedFilters.seoScoreMin > 0 || advancedFilters.seoScoreMax < 100) count++
      if (advancedFilters.pageType !== 'all') count++
      if (advancedFilters.dateRange !== 'all') count++
      if (advancedFilters.author !== 'all') count++
      if (advancedFilters.hasComments) count++
      if (advancedFilters.hasComponents) count++
    }
    setActiveFiltersCount(count)
  }, [advancedFilters])
  
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

  // Handle spacebar for panning mode
  useEffect(() => {
    const handleSpaceDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        setSpacePressed(true)
        document.body.style.cursor = 'grab'
      }
    }
    
    const handleSpaceUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setSpacePressed(false)
        document.body.style.cursor = 'default'
      }
    }
    
    window.addEventListener('keydown', handleSpaceDown)
    window.addEventListener('keyup', handleSpaceUp)
    
    return () => {
      window.removeEventListener('keydown', handleSpaceDown)
      window.removeEventListener('keyup', handleSpaceUp)
      document.body.style.cursor = 'default'
    }
  }, [])
  
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
      
      // Ctrl/Cmd + X for cut
      if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedNodes.length > 0) {
        e.preventDefault()
        handleCutNode()
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
      
      // N for new node
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleAddNode()
      }
      
      // F for fit view
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        fitView({ padding: 0.2, duration: 800 })
      }
      
      // Plus/Minus for zoom
      if (e.key === '+' || e.key === '=') {
        e.preventDefault()
        const currentZoom = getZoom()
        zoomTo(Math.min(currentZoom * 1.2, 4))
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault()
        const currentZoom = getZoom()
        zoomTo(Math.max(currentZoom * 0.8, 0.1))
      }
      
      // Arrow keys for fine positioning (when node selected)
      if (selectedNodes.length > 0 && !e.ctrlKey && !e.metaKey) {
        const moveDistance = e.shiftKey ? 10 : 1
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setNodes((nds) => nds.map(n => 
            selectedNodes.some(sn => sn.id === n.id) 
              ? { ...n, position: { ...n.position, y: n.position.y - moveDistance } }
              : n
          ))
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setNodes((nds) => nds.map(n => 
            selectedNodes.some(sn => sn.id === n.id) 
              ? { ...n, position: { ...n.position, y: n.position.y + moveDistance } }
              : n
          ))
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setNodes((nds) => nds.map(n => 
            selectedNodes.some(sn => sn.id === n.id) 
              ? { ...n, position: { ...n.position, x: n.position.x - moveDistance } }
              : n
          ))
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          setNodes((nds) => nds.map(n => 
            selectedNodes.some(sn => sn.id === n.id) 
              ? { ...n, position: { ...n.position, x: n.position.x + moveDistance } }
              : n
          ))
        }
      }
      
      // ? for keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShowKeyboardHelp(true)
      }
      
      // L for auto-layout
      if (e.key === 'l' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleAutoLayout()
      }
      
      // G for focus on selected branch
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && selectedNodes.length === 1) {
        e.preventDefault()
        handleFocusBranch(selectedNodes[0].id)
      }
      
      // H for show all (when nodes hidden)
      if (e.key === 'h' && !e.ctrlKey && !e.metaKey && nodes.some(n => n.hidden)) {
        e.preventDefault()
        handleShowAll()
      }
      
      // E for export JSON
      if (e.key === 'e' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleExportJson()
      }
      
      // T for templates
      if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        setTemplatesModalOpen(true)
      }
      
      // I for import
      if (e.key === 'i' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        setImportModalOpen(true)
      }
      
      // S for AI suggestions
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        setAISuggestionsOpen(true)
      }
      
      // Number keys for zoom presets
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleZoomChange('21')
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleZoomChange('50')
      }
      if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleZoomChange('100')
      }
      if (e.key === '4' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault()
        handleZoomChange('200')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodes, clipboard, nodes, edges, handleDeleteNode, handleDuplicateNode, handleEditNode, handleAutoLayout, handleUndo, handleRedo, handleAddNode, handleCutNode, handleExportJson, handleFocusBranch, handleShowAll, handleZoomChange, setNodes, setEdges, fitView, getZoom, zoomTo])

  // Add onToggleCollapse and onComponentsReorder to node data and optimize for large node counts
  const nodesWithHandlers = useMemo(() => {
    // Performance optimization: if too many nodes, enable virtualization hint
    const nodeCount = nodes.length
    const enableOptimizations = nodeCount > 100
    
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onToggleCollapse: handleToggleCollapse,
        onComponentsReorder: handleComponentsReorder,
        onLabelChange: handleNodeLabelChange,
        onComponentAdd: handleComponentAdd,
        onComponentRemove: handleComponentRemove,
        // Add performance hints for large graphs
        ...(enableOptimizations && {
          className: 'will-change-transform'
        })
      }
    }))
  }, [nodes, handleToggleCollapse, handleComponentsReorder, handleNodeLabelChange, handleComponentAdd, handleComponentRemove])

  // Create wrapped node types with context menu - keep this stable
  const wrappedNodeTypes = useMemo(() => {
    const wrapped: any = {}
    
    Object.keys(professionalNodeTypes).forEach((type) => {
      wrapped[type] = professionalNodeTypes[type as keyof typeof professionalNodeTypes]
    })
    
    return wrapped
  }, [])

  // Optimize nodes and edges for performance
  const optimizedNodes = useMemo(() => 
    nodes.length > 50 ? optimizeNodes(nodes) : nodes,
    [nodes, optimizeNodes]
  )
  
  const visibleNodeIds = useMemo(() => 
    new Set(optimizedNodes.filter(n => !n.hidden).map(n => n.id)),
    [optimizedNodes]
  )
  
  const optimizedEdges = useMemo(() => 
    nodes.length > 50 ? optimizeEdges(edges, visibleNodeIds) : edges,
    [edges, visibleNodeIds, optimizeEdges]
  )

  return (
    <>
      {/* Virtual Canvas for performance metrics */}
      {nodes.length > 50 && (
        <VirtualCanvas
          nodes={optimizedNodes}
          edges={optimizedEdges}
          onNodesChange={setNodes}
        />
      )}
      
      {/* Show loading progress for large sitemaps */}
      {perfLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 rounded-lg p-3 shadow-lg">
          <div className="text-sm text-white mb-2">Loading sitemap...</div>
          <Progress value={perfProgress} className="w-48" />
        </div>
      )}
      
      <ReactFlow
        nodes={nodesWithHandlers.map(node => ({
          ...node,
          style: {
            ...node.style,
            borderColor: getNodeColor(node),
            borderWidth: colorCodingEnabled ? 2 : 1,
          }
        }))}
        edges={optimizedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={wrappedNodeTypes}
        nodesDraggable={!spacePressed}
        nodeDragThreshold={3}
        fitView={false}
        className={`bg-gradient-to-br from-gray-900 via-gray-800 to-black w-full h-full sitemap-canvas ${spacePressed ? 'pan-mode' : ''}`}
        panOnDrag={spacePressed ? true : [1, 2]}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        selectNodesOnDrag={false}
        preventScrolling={false}
        elementsSelectable={!spacePressed}
        selectionKeyCode="Shift"
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
        multiSelectionKeyCode={null}
        deleteKeyCode="Delete"
      >
        <Background 
          variant="dots" 
          gap={20} 
          size={1.5} 
          color="rgba(255, 255, 255, 0.03)" 
          className="animate-pulse-slow"
        />
        
        <Panel position="top-left" className="flex flex-col gap-2 pointer-events-none z-10">
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2 glass-panel rounded-lg p-2 pointer-events-auto shadow-lg">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all w-48"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/10 hover:bg-white/10 backdrop-blur-sm transition-all"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filterStatus === 'all' ? 'All' : filterStatus === 'published' ? 'Published' : 'Draft'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                <DropdownMenuItem 
                  onClick={() => setFilterStatus('all')}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  All Pages
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilterStatus('published')}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Published Only
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setFilterStatus('draft')}
                  className="text-gray-300 hover:text-white hover:bg-gray-800"
                >
                  Draft Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Advanced Filters */}
            <AdvancedFilters 
              onFilterChange={setAdvancedFilters}
              activeFiltersCount={activeFiltersCount}
            />
            
            {/* Color Coding Toggle */}
            <Button
              size="sm"
              variant={colorCodingEnabled ? "default" : "outline"}
              onClick={() => setColorCodingEnabled(!colorCodingEnabled)}
              className={colorCodingEnabled ? "bg-orange-500 hover:bg-orange-600" : "bg-white/10 border-white/20 hover:bg-white/20"}
              title="Toggle color coding by page type"
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </Button>
            
            {/* Fullscreen Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={toggleFullscreen}
              className="bg-white/10 border-white/20 hover:bg-white/20"
              title="Toggle fullscreen mode"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            {/* Print Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="bg-white/10 border-white/20 hover:bg-white/20"
              title="Print sitemap"
            >
              <Printer className="h-4 w-4" />
            </Button>
            
            {/* Auto-save Indicator */}
            <div className="flex items-center gap-2 ml-auto">
              {isSaving ? (
                <div className="flex items-center gap-2 text-yellow-400 text-xs">
                  <div className="animate-spin h-3 w-3 border-2 border-yellow-400 border-t-transparent rounded-full" />
                  <span>Saving...</span>
                </div>
              ) : lastSaveTime ? (
                <div className="flex items-center gap-2 text-green-400 text-xs">
                  <Check className="h-3 w-3" />
                  <span>Saved {new Date(lastSaveTime).toLocaleTimeString()}</span>
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Main Toolbar */}
          <div className="flex items-center gap-2 glass-panel rounded-lg p-2 pointer-events-auto shadow-lg">
          {/* Import Status */}
          {importedUrl && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Imported from: {importedUrl}
            </Badge>
          )}
          
          {/* Pan Mode Indicator */}
          {spacePressed && (
            <Badge className="bg-orange-500/30 text-orange-400 border-orange-500/50 animate-pulse">
              <Move className="h-3 w-3 mr-1" />
              Pan Mode (Space)
            </Badge>
          )}
          
          {/* Pan Instructions */}
          {!spacePressed && (
            <Badge className="bg-gray-700/50 text-gray-400 border-gray-600/50 text-xs">
              <Move className="h-3 w-3 mr-1" />
              Hold Space or Right-Click to pan
            </Badge>
          )}
          
          {/* Templates Button */}
          <Button
            onClick={() => setTemplatesModalOpen(true)}
            size="sm"
            variant="outline"
            className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 text-white"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Button>
          
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
          
          {/* AI Suggestions Button */}
          <Button
            onClick={() => setAISuggestionsOpen(true)}
            size="sm"
            variant="outline"
            className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 hover:from-purple-500/30 hover:to-blue-500/30 text-white"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Suggestions
          </Button>
          
          {/* Global Components Button */}
          <Button
            onClick={() => setGlobalSectionsOpen(true)}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            <Package className="h-4 w-4 mr-2" />
            Components
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
          
          {/* Multi-Select Operations */}
          {selectedNodes.length > 1 && (
            <>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {selectedNodes.length} selected
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30"
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Bulk Actions
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900/95 backdrop-blur-md border-gray-700">
                  <DropdownMenuItem 
                    onClick={() => {
                      selectedNodes.forEach(node => handleDuplicateNode(node.id))
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate All
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      saveToHistory()
                      const nodeIds = selectedNodes.map(n => n.id)
                      setNodes((nds) => nds.filter(n => !nodeIds.includes(n.id)))
                      setEdges((eds) => eds.filter(e => 
                        !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
                      ))
                      setSelectedNodes([])
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => {
                      saveToHistory()
                      const nodeIds = selectedNodes.map(n => n.id)
                      setNodes((nds) => nds.map(n => 
                        nodeIds.includes(n.id) 
                          ? { ...n, data: { ...n.data, metadata: { ...n.data.metadata, status: 'published' } } }
                          : n
                      ))
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Set as Published
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      saveToHistory()
                      const nodeIds = selectedNodes.map(n => n.id)
                      setNodes((nds) => nds.map(n => 
                        nodeIds.includes(n.id) 
                          ? { ...n, data: { ...n.data, metadata: { ...n.data.metadata, status: 'draft' } } }
                          : n
                      ))
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Set as Draft
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    onClick={() => {
                      const nodeIds = selectedNodes.map(n => n.id)
                      const selectedData = { nodes: selectedNodes, edges: edges.filter(e => 
                        nodeIds.includes(e.source) || nodeIds.includes(e.target)
                      )}
                      navigator.clipboard.writeText(JSON.stringify(selectedData, null, 2))
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      // Group selected nodes
                      saveToHistory()
                      const groupId = `group-${Date.now()}`
                      const centerX = selectedNodes.reduce((sum, n) => sum + n.position.x, 0) / selectedNodes.length
                      const centerY = selectedNodes.reduce((sum, n) => sum + n.position.y, 0) / selectedNodes.length
                      
                      const groupNode: Node = {
                        id: groupId,
                        type: 'folder',
                        position: { x: centerX, y: centerY - 100 },
                        data: {
                          label: 'New Group',
                          color: '#8B5CF6',
                          children: selectedNodes.map(n => n.id)
                        }
                      }
                      
                      const groupEdges = selectedNodes.map(n => ({
                        id: `${groupId}-${n.id}`,
                        source: groupId,
                        target: n.id,
                        type: 'smoothstep',
                        style: { stroke: 'rgba(255, 255, 255, 0.2)' }
                      }))
                      
                      setNodes((nds) => [...nds, groupNode])
                      setEdges((eds) => [...eds, ...groupEdges])
                    }}
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Group Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {/* Single Selected Node Info */}
          {selectedNodes.length === 1 && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {selectedNodes[0].data.label} selected
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
          
          {/* Connect Mode Button */}
          {isConnecting && (
            <Button
              onClick={() => {
                setIsConnecting(false)
                setConnectingFrom(null)
              }}
              size="sm"
              variant="outline"
              className="bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30 text-white animate-pulse"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Click a page to connect from {nodes.find(n => n.id === connectingFrom)?.data.label}
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
          </div>
        </Panel>
        
        <Panel position="top-right" className="flex items-center gap-2 pointer-events-none z-10">
          <div className="flex items-center gap-2 glass-panel rounded-lg p-2 pointer-events-auto shadow-lg">
          {/* Share & Export Button */}
          <Button
            onClick={() => setShareExportOpen(true)}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            title="Share & Export"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          
          {/* Version History Button */}
          <Button
            onClick={() => setVersionHistoryOpen(true)}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            title="Version History"
          >
            <Clock className="h-4 w-4" />
          </Button>
          
          {/* Help Button */}
          <Button
            onClick={() => setShowKeyboardHelp(true)}
            size="sm"
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
            title="Keyboard Shortcuts (Press ?)"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
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
                onClick={() => handleZoomChange('21')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                21%
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
              <DropdownMenuItem 
                onClick={() => handleZoomChange('300')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                300%
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleZoomChange('400')}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                400%
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
          </div>
        </Panel>
        
        {/* Performance Metrics Panel */}
        {nodes.length > 20 && metrics && (
          <Panel position="bottom-left" className="glass-panel rounded-lg p-3 text-xs">
            <div className="space-y-1 text-gray-400">
              <div className="text-white font-medium mb-2">Performance</div>
              <div className="flex justify-between gap-4">
                <span>Nodes:</span>
                <span className="text-white">{nodes.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Edges:</span>
                <span className="text-white">{edges.length}</span>
              </div>
              {metrics.memoryUsage > 0 && (
                <div className="flex justify-between gap-4">
                  <span>Memory:</span>
                  <span className="text-white">{metrics.memoryUsage.toFixed(1)} MB</span>
                </div>
              )}
              {(metrics.cacheHits > 0 || metrics.cacheMisses > 0) && (
                <div className="flex justify-between gap-4">
                  <span>Cache:</span>
                  <span className="text-green-400">
                    {Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)}%
                  </span>
                </div>
              )}
              {nodes.length > 50 && (
                <div className="text-yellow-400 mt-2">
                  Virtualization Active
                </div>
              )}
            </div>
          </Panel>
        )}
        
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
        nodeData={editingNode ? {
          id: editingNode.id,
          label: editingNode.data.label,
          url: editingNode.data.url,
          components: editingNode.data.components,
          description: editingNode.data.description,
          type: editingNode.type || 'page',
          metadata: editingNode.data.metadata
        } : null}
        onSave={handleSaveNodeEdit}
      />
      
      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
      />
      
      {/* Section Picker Modal */}
      <SectionPicker
        isOpen={sectionPickerOpen}
        onClose={() => {
          setSectionPickerOpen(false)
          setSectionPickerNodeId(null)
        }}
        onSelectSection={handleSectionSelect}
        nodeId={sectionPickerNodeId || undefined}
      />
      
      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{status}</span>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp 
        isOpen={showKeyboardHelp} 
        onClose={() => setShowKeyboardHelp(false)} 
      />
      
      {/* Templates Modal */}
      <TemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
      
      {/* Comments System */}
      {commentsOpen && commentNodeId && (
        <CommentsSystem
          nodeId={commentNodeId}
          isOpen={commentsOpen}
          onClose={() => {
            setCommentsOpen(false)
            setCommentNodeId(null)
          }}
        />
      )}
      
      {/* Share & Export Modal */}
      <ShareExportModal
        isOpen={shareExportOpen}
        onClose={() => setShareExportOpen(false)}
        nodes={nodes}
        edges={edges}
      />
      
      {/* Version History */}
      <VersionHistory
        isOpen={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        currentNodes={nodes}
        currentEdges={edges}
        onRestore={(version) => {
          setNodes(version.nodes)
          setEdges(version.edges)
          saveToHistory()
        }}
      />
      
      {/* AI Suggestions */}
      <AISuggestionsEnhanced
        isOpen={aiSuggestionsOpen}
        onClose={() => setAISuggestionsOpen(false)}
        nodes={nodes}
        edges={edges}
        onAddNode={(node) => {
          setNodes((nds) => [...nds, node])
          saveToHistory()
        }}
        onAddComponent={(nodeId, component) => {
          setNodes((nds) => nds.map(n => 
            n.id === nodeId 
              ? { ...n, data: { ...n.data, components: [...(n.data.components || []), component] } }
              : n
          ))
          saveToHistory()
        }}
        onOptimize={(suggestion) => {
          console.log('Optimize:', suggestion)
          // Implement optimization logic
        }}
      />
      
      {/* Global Components Library */}
      <GlobalSectionsLibrary
        isOpen={globalSectionsOpen}
        onClose={() => setGlobalSectionsOpen(false)}
        onAddComponent={(component) => {
          // Add component to selected node or create new node
          if (selectedNodes.length > 0) {
            const nodeId = selectedNodes[0].id
            setNodes((nds) => nds.map(n => 
              n.id === nodeId 
                ? { ...n, data: { ...n.data, components: [...(n.data.components || []), component.name] } }
                : n
            ))
          }
          saveToHistory()
        }}
        currentComponents={selectedNodes[0]?.data.components || []}
      />
    </>
  )
}

export default function SitemapBuilderDemo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  return (
    <DemoLayoutFullWidth title="Sitemap Builder" subtitle="Step 2: Visualize Site Structure">
      <div className="h-full w-full absolute inset-0">
        <ReactFlowProvider>
          <ResponsiveWrapper 
            onZoomChange={(zoom) => console.log('Zoom:', zoom)}
            onViewportChange={(viewport) => console.log('Viewport:', viewport)}
          >
            <SitemapFlow />
          </ResponsiveWrapper>
        </ReactFlowProvider>
      </div>
    </DemoLayoutFullWidth>
  )
}