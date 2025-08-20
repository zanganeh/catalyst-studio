'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Loader2, Sparkles, Globe, FileText, Link2, Hash, Users, Eye, Clock, 
  TrendingUp, ZoomIn, ZoomOut, Maximize2, Download, Upload, Layers,
  GitBranch, FolderOpen, File, ChevronRight, ChevronDown, Plus,
  Settings, Palette, Tag, AlertCircle, Check, X, Move, Copy,
  ExternalLink, Search, Bot, Zap, Grid, Home, Info, Mail, 
  ShoppingCart, BookOpen, Briefcase, Image, Video, MessageSquare,
  Hexagon, CheckCircle2, Activity, Shield, Cloud, Rocket, Folder,
  FileCode, Layout, Database, Package, Terminal, Code, Cpu, MoreVertical
} from 'lucide-react'

interface SiteSection {
  id: string
  title: string
  description?: string
}

interface SiteNode {
  id: string
  type: 'page' | 'folder' | 'section'
  title: string
  description?: string
  sections?: SiteSection[]
  children: SiteNode[]
  position: { x: number; y: number }
  color: string
  expanded: boolean
  icon?: string
}

export default function SitemapBuilderDemo() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [inputMode, setInputMode] = useState<'url' | 'prompt'>('url')
  const [urlInput, setUrlInput] = useState('https://example.com')
  const [promptInput, setPromptInput] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [zoom, setZoom] = useState(0.4)
  const [pan, setPan] = useState({ x: -600, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [sitemap, setSitemap] = useState<SiteNode[]>([])
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuNode, setContextMenuNode] = useState<string | null>(null)

  // Sample sitemap structure with vertical tree hierarchy
  const generateSampleSitemap = (): SiteNode[] => {
    const result: SiteNode[] = []
    const centerX = 1600 // Center position for alignment (moved right for more space)
    const startY = 80 // Home at top
    const levelSpacing = 400 // Vertical spacing between levels (increased for expanded nodes)
    
    // Node dimensions for spacing calculations
    const folderWidth = 160
    const pageWidth = 260
    const minNodeSpacing = 60 // Minimum gap between nodes (increased)
    
    // Home page at the top center - make it collapsed by default for cleaner look
    const homePage: SiteNode = {
      id: 'home-page',
      type: 'page',
      title: 'Home',
      position: { x: centerX, y: startY },
      color: '#FF5500',
      expanded: false,
      sections: [
        { id: 'navbar', title: 'Navbar' },
        { id: 'hero', title: 'Hero Header Section', description: 'Bathurst City Centre. Conveniently located 9 hectares of Bathurst Central City.' },
        { id: 'how-it-works', title: 'How It Works Section', description: 'Discover how to make the most of your visit to Bathurst City Centre.' },
        { id: 'feature', title: 'Feature Section', description: 'Highlight the main features of Bathurst City Centre.' },
        { id: 'cta', title: 'CTA Section', description: 'Some actions to take next. Sign up for newsletters.' },
        { id: 'blog', title: 'Blog List Section', description: 'Showcase recent articles and updates.' },
        { id: 'footer', title: 'Footer' }
      ],
      children: []
    }
    
    // Define main sections that go under Home page
    const mainSections = [
      { id: 'directory', title: 'Directory', color: '#EF4444' },
      { id: 'campaigns', title: 'Campaigns', color: '#F97316' },
      { id: 'promotions', title: 'Promotions', color: '#3B82F6' },
      { id: 'whats-on', title: "What's On", color: '#10B981' },
      { id: 'stores', title: 'Stores', color: '#8B5CF6' }
    ]
    
    // Second level pages
    const secondLevelPages = [
      { id: 'contact', title: 'Contact Us', parentId: 'directory' },
      { id: 'fathers-day', title: 'Fathers Day', parentId: 'campaigns' },
      { id: 'our-community', title: 'Our Community', parentId: 'campaigns' },
      { id: 'whats-on-page', title: "What's On List", parentId: 'whats-on' },
      { id: '2025', title: '2025', parentId: 'campaigns' },
      { id: 'giveaway', title: 'Fathers Giveaway', parentId: 'campaigns' },
      { id: 'optus', title: 'Yes Optus', parentId: 'stores' },
      { id: 'skechers', title: 'Skechers', parentId: 'stores' },
      { id: 'spacesavers', title: 'Spacesavers', parentId: 'stores' },
      { id: 'laurie', title: 'Laurie Claire', parentId: 'stores' },
      { id: 'retail', title: 'Retail Stores', parentId: 'stores' }
    ]
    
    // Calculate positions for level 1 (main sections)
    const level1Y = startY + levelSpacing
    const level2Y = level1Y + levelSpacing
    
    // First, collect all level 2 nodes to calculate global spacing
    const allLevel2Nodes: { parentId: string, nodes: typeof secondLevelPages }[] = []
    mainSections.forEach(section => {
      const childPages = secondLevelPages.filter(p => p.parentId === section.id)
      if (childPages.length > 0) {
        allLevel2Nodes.push({ parentId: section.id, nodes: childPages })
      }
    })
    
    // Calculate total width needed for all level 2 nodes
    const totalLevel2Nodes = allLevel2Nodes.reduce((sum, group) => sum + group.nodes.length, 0)
    const level2NodeSpacing = pageWidth + minNodeSpacing
    const totalLevel2Width = totalLevel2Nodes * level2NodeSpacing
    
    // Calculate spacing for level 1 folders to ensure their children don't overlap
    const minLevel1Spacing = Math.max(
      folderWidth + minNodeSpacing,
      totalLevel2Width / mainSections.length
    )
    
    const level1StartX = centerX - ((mainSections.length - 1) * minLevel1Spacing) / 2
    
    // Track the next available X position for level 2 nodes
    let nextLevel2X = centerX - (totalLevel2Width / 2)
    
    mainSections.forEach((section, index) => {
      const node: SiteNode = {
        id: section.id,
        type: 'folder',
        title: section.title,
        position: { x: level1StartX + (index * minLevel1Spacing), y: level1Y },
        color: section.color,
        expanded: false,
        icon: 'folder',
        sections: [],
        children: []
      }
      homePage.children.push(node)
      
      // Add second level pages for this section
      const childPages = secondLevelPages.filter(p => p.parentId === section.id)
      if (childPages.length > 0) {
        // Position child nodes sequentially without overlap
        childPages.forEach((page, pageIndex) => {
          const pageNode: SiteNode = {
            id: page.id,
            type: 'page',
            title: page.title,
            position: { x: nextLevel2X, y: level2Y },
            color: '#000000',
            expanded: false,
            sections: [
              { id: `${page.id}-nav`, title: 'Navbar' },
              { id: `${page.id}-hero`, title: 'Hero Section' },
              { id: `${page.id}-content`, title: 'Main Content' },
              { id: `${page.id}-footer`, title: 'Footer' }
            ],
            children: []
          }
          node.children.push(pageNode)
          nextLevel2X += level2NodeSpacing
        })
      }
    })
    
    result.push(homePage)
    return result
  }

  const analyzeUrl = useCallback(async () => {
    console.log('analyzeUrl called')
    setIsAnalyzing(true)
    setProgress(0)
    setStatus('Connecting to website...')
    
    const steps = [
      { progress: 20, status: 'Analyzing page structure...', delay: 800 },
      { progress: 40, status: 'Detecting navigation patterns...', delay: 1200 },
      { progress: 60, status: 'Extracting content hierarchy...', delay: 1000 },
      { progress: 80, status: 'Building sitemap structure...', delay: 1500 },
      { progress: 100, status: 'Finalizing visualization...', delay: 800 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
      setProgress(step.progress)
      setStatus(step.status)
    }

    setSitemap(generateSampleSitemap())
    setIsAnalyzing(false)
    setStatus('Sitemap generated successfully!')
    // Auto-center the view with better zoom
    setZoom(0.4)
    setPan({ x: -600, y: 20 })
    setTimeout(() => setStatus(''), 3000)
  }, [])

  const generateFromPrompt = useCallback(async () => {
    setIsAnalyzing(true)
    setProgress(0)
    setStatus('Analyzing your requirements...')
    
    const steps = [
      { progress: 25, status: 'Understanding business goals...', delay: 1000 },
      { progress: 50, status: 'Generating page structure...', delay: 1200 },
      { progress: 75, status: 'Adding content sections...', delay: 1000 },
      { progress: 100, status: 'Optimizing layout...', delay: 800 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
      setProgress(step.progress)
      setStatus(step.status)
    }

    setSitemap(generateSampleSitemap())
    setIsAnalyzing(false)
    setStatus('AI sitemap generated successfully!')
    // Auto-center the view with better zoom
    setZoom(0.4)
    setPan({ x: -600, y: 20 })
    setTimeout(() => setStatus(''), 3000)
  }, [])

  const handleGenerate = () => {
    console.log('Generate clicked', { inputMode, urlInput, promptInput })
    if (inputMode === 'url' && urlInput) {
      console.log('Analyzing URL...')
      analyzeUrl()
    } else if (inputMode === 'prompt' && promptInput) {
      console.log('Generating from prompt...')
      generateFromPrompt()
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('.canvas-viewport')) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.min(Math.max(prev * delta, 0.2), 2))
  }

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNode(nodeId)
  }

  const toggleNodeExpansion = (nodeId: string) => {
    setSitemap(prev => {
      const updateNode = (nodes: SiteNode[]): SiteNode[] => {
        return nodes.map(node => {
          if (node.id === nodeId) {
            return { ...node, expanded: !node.expanded }
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNode(node.children) }
          }
          return node
        })
      }
      return updateNode(prev)
    })
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.2))
  const handleZoomReset = () => {
    setZoom(0.4)
    setPan({ x: -600, y: 20 })
  }

  const exportAsJson = () => {
    const data = JSON.stringify(sitemap, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sitemap.json'
    a.click()
  }

  const renderNode = (node: SiteNode) => {
    const isSelected = selectedNode === node.id
    const isHovered = hoveredNode === node.id
    const isHome = node.id === 'home-page'
    
    return (
      <div
        key={node.id}
        className={`
          absolute backdrop-blur-md rounded-lg shadow-lg border transition-all duration-200 cursor-pointer
          ${isHome ? 'bg-gradient-to-br from-[#FF5500]/20 to-[#FF6600]/10 border-[#FF5500]/30' : 
            'bg-gradient-to-br from-white/10 to-white/5 border-white/10'}
          ${isSelected ? 'ring-2 ring-[#FF5500] shadow-xl' : ''}
          ${isHovered ? 'shadow-xl border-white/20' : ''}
        `}
        style={{
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          width: node.type === 'folder' ? '160px' : '260px',
          minHeight: node.type === 'folder' ? '60px' : 'auto',
          zIndex: isSelected ? 10 : 1
        }}
        onClick={(e) => handleNodeClick(node.id, e)}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        {node.type === 'folder' ? (
          // Folder Node - Compact
          <div className="p-3 flex items-center gap-2">
            <div className="flex-shrink-0">
              <Folder className="h-6 w-6" style={{ color: node.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white truncate">{node.title}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // Add menu functionality here
              }}
              className="text-gray-400 hover:text-white flex-shrink-0"
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        ) : (
          // Page Node - With sections
          <div>
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHome && <Home className="h-5 w-5 text-[#FF5500]" />}
                  <h3 className="text-base font-medium text-white">{node.title}</h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleNodeExpansion(node.id)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  {node.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              </div>
            </div>
            
            {node.expanded && node.sections && (
              <div className="px-3 py-2 space-y-1.5 max-h-64 overflow-y-auto">
                {node.sections.map(section => (
                  <div key={section.id} className="py-1">
                    <p className="text-xs font-medium text-gray-300">{section.title}</p>
                    {section.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{section.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!node.expanded && node.sections && (
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400">{node.sections.length} sections</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderConnections = () => {
    const connections: React.ReactElement[] = []
    
    const renderNodeConnections = (node: SiteNode) => {
      if (node.children && node.children.length > 0) {
        const startX = node.position.x + (node.type === 'folder' ? 80 : 130) // Center of node
        const startY = node.position.y + (node.type === 'folder' ? 60 : 55) // Bottom of node
        
        // Draw vertical line down from parent
        const midY = startY + 100
        
        connections.push(
          <line
            key={`${node.id}-vertical`}
            x1={startX}
            y1={startY}
            x2={startX}
            y2={midY}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
          />
        )
        
        // Calculate horizontal line span
        const childXPositions = node.children.map(child => 
          child.position.x + (child.type === 'folder' ? 80 : 130)
        )
        const minX = Math.min(...childXPositions)
        const maxX = Math.max(...childXPositions)
        
        // Draw horizontal line
        if (node.children.length > 1) {
          connections.push(
            <line
              key={`${node.id}-horizontal`}
              x1={minX}
              y1={midY}
              x2={maxX}
              y2={midY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
          )
        }
        
        // Draw vertical lines to each child
        node.children.forEach(child => {
          const endX = child.position.x + (child.type === 'folder' ? 80 : 130) // Center of child
          const endY = child.position.y // Top of child
          
          connections.push(
            <line
              key={`${node.id}-${child.id}`}
              x1={endX}
              y1={midY}
              x2={endX}
              y2={endY}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="2"
            />
          )
        })
        
        // Recursively render connections for children
        node.children.forEach(child => renderNodeConnections(child))
      }
    }
    
    sitemap.forEach(node => renderNodeConnections(node))
    
    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: '100%', height: '100%', zIndex: 0 }}
      >
        {connections}
      </svg>
    )
  }

  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false)
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showContextMenu])

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="max-w-full h-full flex flex-col gap-4">
          {/* Header */}
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Hexagon className="h-8 w-8 text-[#FF5500] fill-[#FF5500]/20" />
                  <div>
                    <h1 className="text-xl font-bold text-white">Sitemap Builder</h1>
                    <p className="text-xs text-gray-400">Visual website structure generator</p>
                  </div>
                </div>
              </div>
              
              {/* Input Controls */}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setInputMode('url')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      inputMode === 'url' 
                        ? 'bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30' 
                        : 'text-gray-400 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Globe className="h-4 w-4 inline mr-2" />
                    Analyze URL
                  </button>
                  <button
                    onClick={() => setInputMode('prompt')}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      inputMode === 'prompt' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'text-gray-400 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    AI Generate
                  </button>
                </div>
                
                {inputMode === 'url' ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter website URL"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isAnalyzing || !urlInput}
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Analyze'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Describe your website..."
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={isAnalyzing || !promptInput}
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                )}
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-l border-white/10 pl-4">
                  <button
                    onClick={handleZoomOut}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all flex items-center justify-center"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all flex items-center justify-center"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleZoomReset}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all flex items-center justify-center"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={exportAsJson}
                  disabled={sitemap.length === 0}
                  className="px-3 py-1.5 text-sm border border-white/10 text-gray-300 hover:bg-white/10 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{status}</span>
                  <span className="text-xs text-gray-400">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1 bg-white/10" />
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/10 overflow-hidden relative">
            <div
              ref={canvasRef}
              className="w-full h-full overflow-hidden relative canvas-viewport"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleWheel}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <div
                className="relative"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: '6000px',
                  height: '1500px'
                }}
              >
                {sitemap.length === 0 ? (
                  <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                      <GitBranch className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No sitemap generated yet</h3>
                      <p className="text-sm text-gray-500">Enter a URL to analyze or describe your website to get started</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {renderConnections()}
                    {sitemap.map(node => {
                      const renderNodeAndChildren = (n: SiteNode): React.ReactElement[] => {
                        const elements: React.ReactElement[] = [renderNode(n)]
                        if (n.children) {
                          n.children.forEach(child => {
                            elements.push(...renderNodeAndChildren(child))
                          })
                        }
                        return elements
                      }
                      return (
                        <div key={node.id}>
                          {renderNodeAndChildren(node)}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}