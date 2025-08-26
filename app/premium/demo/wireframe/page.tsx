'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DemoLayout } from '@/components/studio/deployment/demo-layout'
import { 
  Loader2, Globe, ZoomIn, ZoomOut, Maximize2, Download,
  ArrowRight, CheckCircle2, Sparkles, Layout, Grid,
  Monitor, Tablet, Smartphone, RefreshCw, Eye
} from 'lucide-react'

interface Wireframe {
  id: string
  pageName: string
  position: { x: number; y: number }
  width: number
  height: number
  selected: boolean
}

export default function WireframeDemo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [importedUrl, setImportedUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [zoom, setZoom] = useState(0.5)
  const [pan, setPan] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedWireframe, setSelectedWireframe] = useState<string | null>(null)
  const [wireframes, setWireframes] = useState<Wireframe[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Check if coming from sitemap and load data
  useEffect(() => {
    const fromSitemap = searchParams.get('from') === 'sitemap'
    if (fromSitemap) {
      const url = sessionStorage.getItem('importedUrl')
      const hasSitemap = sessionStorage.getItem('sitemapGenerated')
      if (url && hasSitemap) {
        setImportedUrl(url)
        // Auto-generate wireframes when coming from sitemap
        generateWireframes()
      }
    }
  }, [searchParams])

  const generateWireframes = useCallback(async () => {
    setIsGenerating(true)
    setProgress(0)
    setStatus('AI analyzing design patterns...')
    setHasGenerated(true)
    
    const steps = [
      { progress: 20, status: 'Understanding site structure...', delay: 800 },
      { progress: 40, status: 'Analyzing design patterns...', delay: 1200 },
      { progress: 60, status: 'Generating layout wireframes...', delay: 1000 },
      { progress: 80, status: 'Optimizing responsive design...', delay: 1500 },
      { progress: 100, status: 'Finalizing wireframes...', delay: 800 }
    ]

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay))
      setProgress(step.progress)
      setStatus(step.status)
    }

    // Generate sample wireframes
    const wireframeData: Wireframe[] = [
      { id: 'home', pageName: 'Homepage', position: { x: 100, y: 100 }, width: 320, height: 480, selected: false },
      { id: 'about', pageName: 'About Us', position: { x: 460, y: 100 }, width: 320, height: 480, selected: false },
      { id: 'products', pageName: 'Products', position: { x: 820, y: 100 }, width: 320, height: 480, selected: false },
      { id: 'blog', pageName: 'Blog', position: { x: 1180, y: 100 }, width: 320, height: 480, selected: false },
      { id: 'contact', pageName: 'Contact', position: { x: 100, y: 620 }, width: 320, height: 480, selected: false },
      { id: 'detail', pageName: 'Product Detail', position: { x: 460, y: 620 }, width: 320, height: 480, selected: false },
    ]

    setWireframes(wireframeData)
    setIsGenerating(false)
    setStatus('Wireframes generated successfully!')
    setTimeout(() => setStatus(''), 3000)
  }, [])

  const handleContinueToStyleGuide = () => {
    // Store wireframe approval and navigate to style guide
    sessionStorage.setItem('wireframesApproved', 'true')
    router.push('/demo/style-guide?from=wireframe')
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
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 2))
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev * 0.8, 0.3))
  const handleZoomReset = () => {
    setZoom(0.5)
    setPan({ x: 50, y: 50 })
  }

  const handleRegenerateWireframes = () => {
    setWireframes([])
    generateWireframes()
  }

  const renderWireframe = (wireframe: Wireframe) => {
    const isSelected = selectedWireframe === wireframe.id
    
    return (
      <div
        key={wireframe.id}
        className={`absolute bg-white rounded-sm shadow-2xl border cursor-pointer transition-all duration-200 ${
          isSelected ? 'border-[#FF5500] ring-2 ring-[#FF5500]/30 shadow-[#FF5500]/20' : 'border-gray-400'
        }`}
        style={{
          left: `${wireframe.position.x}px`,
          top: `${wireframe.position.y}px`,
          width: `${wireframe.width}px`,
          height: `${wireframe.height}px`,
        }}
        onClick={() => setSelectedWireframe(wireframe.id)}
      >
        {/* Wireframe Content */}
        <div className="w-full h-full overflow-hidden bg-white">
          {/* Header */}
          <div className="border-b border-gray-400 bg-gray-50">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-8 h-8 border-2 border-gray-400 rounded flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-400"></div>
                </div>
                <div className="w-20 h-4 border border-gray-300 bg-gray-100"></div>
              </div>
              <div className="flex gap-3">
                <div className="w-12 h-3 border border-gray-300"></div>
                <div className="w-12 h-3 border border-gray-300"></div>
                <div className="w-12 h-3 border border-gray-300"></div>
                <div className="w-12 h-3 border border-gray-300"></div>
                <div className="w-16 h-6 border-2 border-gray-400 rounded-sm flex items-center justify-center">
                  <div className="w-10 h-2 bg-gray-300"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section for Homepage */}
          {wireframe.id === 'home' && (
            <div className="p-4">
              {/* Hero Banner */}
              <div className="border-2 border-dashed border-gray-300 rounded mb-4 p-8 bg-gray-50 relative">
                <div className="absolute top-2 left-2 text-xs text-gray-400 font-mono">[HERO IMAGE]</div>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-48 h-6 border-2 border-gray-400 mb-3"></div>
                  <div className="w-64 h-3 border border-gray-300 mb-2"></div>
                  <div className="w-40 h-3 border border-gray-300 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="px-4 py-2 border-2 border-gray-800 bg-gray-800 rounded-sm">
                      <div className="w-16 h-3 bg-white"></div>
                    </div>
                    <div className="px-4 py-2 border-2 border-gray-400 rounded-sm">
                      <div className="w-16 h-3 bg-gray-400"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border border-gray-300 p-2 bg-gray-50">
                    <div className="w-8 h-8 border-2 border-gray-400 rounded-full mb-2 mx-auto"></div>
                    <div className="w-full h-2 border border-gray-300 mb-1"></div>
                    <div className="w-3/4 h-2 border border-gray-200 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Grid for Products */}
          {wireframe.id === 'products' && (
            <div className="p-4">
              <div className="mb-3">
                <div className="w-32 h-5 border-2 border-gray-400 mb-2"></div>
                <div className="w-48 h-3 border border-gray-300"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="border border-gray-400 bg-white">
                    <div className="border-2 border-dashed border-gray-300 h-20 m-2 bg-gray-50 relative">
                      <div className="absolute top-1 left-1 text-xs text-gray-400 font-mono">[IMG]</div>
                    </div>
                    <div className="px-2 pb-2">
                      <div className="w-full h-3 border border-gray-400 mb-1"></div>
                      <div className="w-3/4 h-2 border border-gray-300 mb-2"></div>
                      <div className="flex justify-between items-center">
                        <div className="w-12 h-3 bg-gray-800"></div>
                        <div className="w-8 h-6 border border-gray-400 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blog List */}
          {wireframe.id === 'blog' && (
            <div className="p-4">
              <div className="mb-3">
                <div className="w-24 h-5 border-2 border-gray-400 mb-2"></div>
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 pb-3 mb-3 border-b border-gray-300">
                  <div className="w-24 h-20 border-2 border-dashed border-gray-300 bg-gray-50 flex-shrink-0 relative">
                    <div className="absolute top-1 left-1 text-xs text-gray-400 font-mono">[IMG]</div>
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-4 border border-gray-400 mb-2"></div>
                    <div className="w-full h-2 border border-gray-300 mb-1"></div>
                    <div className="w-full h-2 border border-gray-300 mb-1"></div>
                    <div className="w-3/4 h-2 border border-gray-300 mb-2"></div>
                    <div className="flex gap-2">
                      <div className="w-16 h-2 border border-gray-400"></div>
                      <div className="w-16 h-2 border border-gray-400"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* About Us Content */}
          {wireframe.id === 'about' && (
            <div className="p-4">
              <div className="mb-4">
                <div className="w-32 h-5 border-2 border-gray-400 mb-3"></div>
                <div className="w-full h-2 border border-gray-300 mb-1"></div>
                <div className="w-full h-2 border border-gray-300 mb-1"></div>
                <div className="w-full h-2 border border-gray-300 mb-1"></div>
                <div className="w-3/4 h-2 border border-gray-300"></div>
              </div>
              
              <div className="mb-3">
                <div className="w-24 h-4 border border-gray-400 mb-2"></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="text-center">
                    <div className="w-16 h-16 border-2 border-gray-400 rounded-full mb-2 mx-auto bg-gray-50"></div>
                    <div className="w-full h-2 border border-gray-400 mb-1"></div>
                    <div className="w-3/4 h-2 border border-gray-300 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Form */}
          {wireframe.id === 'contact' && (
            <div className="p-4">
              <div className="w-32 h-5 border-2 border-gray-400 mb-4"></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="w-16 h-2 border border-gray-400 mb-1 text-xs"></div>
                  <div className="w-full h-8 border border-gray-400 bg-white"></div>
                </div>
                <div>
                  <div className="w-16 h-2 border border-gray-400 mb-1"></div>
                  <div className="w-full h-8 border border-gray-400 bg-white"></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="w-20 h-2 border border-gray-400 mb-1"></div>
                <div className="w-full h-8 border border-gray-400 bg-white"></div>
              </div>
              <div className="mb-3">
                <div className="w-24 h-2 border border-gray-400 mb-1"></div>
                <div className="w-full h-20 border border-gray-400 bg-white"></div>
              </div>
              <div className="px-4 py-2 bg-gray-800 border-2 border-gray-800 rounded-sm inline-block">
                <div className="w-16 h-3 bg-white"></div>
              </div>
            </div>
          )}

          {/* Product Detail */}
          {wireframe.id === 'detail' && (
            <div className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 h-40 bg-gray-50 relative mb-2">
                    <div className="absolute top-2 left-2 text-xs text-gray-400 font-mono">[PRODUCT IMG]</div>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-12 h-12 border border-gray-400 bg-gray-50"></div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="w-full h-5 border-2 border-gray-400 mb-2"></div>
                  <div className="w-20 h-6 bg-gray-800 text-white mb-3"></div>
                  <div className="w-full h-2 border border-gray-300 mb-1"></div>
                  <div className="w-full h-2 border border-gray-300 mb-1"></div>
                  <div className="w-3/4 h-2 border border-gray-300 mb-4"></div>
                  
                  <div className="flex gap-2 mb-3">
                    <div className="px-3 py-2 border-2 border-gray-800 bg-gray-800">
                      <div className="w-20 h-3 bg-white"></div>
                    </div>
                    <div className="px-3 py-2 border-2 border-gray-400">
                      <div className="w-20 h-3 bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Page Label */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className="text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded shadow">
            {wireframe.pageName}
          </span>
        </div>
      </div>
    )
  }

  return (
    <DemoLayout title="AI Wireframe Generation" subtitle="Step 3: Design Wireframes">
      <>
        {/* Top Controls Bar */}
        <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            {/* Status and Controls */}
            <div className="flex items-center gap-4">
              {importedUrl && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Imported: {importedUrl}
                </Badge>
              )}
              
              {hasGenerated && (
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Generated Wireframes
                </Badge>
              )}

              {/* View Mode Toggle */}
              <div className="flex gap-1 border-l border-white/10 pl-4">
                <button
                  onClick={() => setViewMode('desktop')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'desktop' 
                      ? 'bg-[#FF5500]/20 text-[#FF5500]' 
                      : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('tablet')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'tablet' 
                      ? 'bg-[#FF5500]/20 text-[#FF5500]' 
                      : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('mobile')}
                  className={`p-2 rounded transition-all ${
                    viewMode === 'mobile' 
                      ? 'bg-[#FF5500]/20 text-[#FF5500]' 
                      : 'text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

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

              {/* Actions */}
              {hasGenerated && (
                <>
                  <button
                    onClick={handleRegenerateWireframes}
                    className="px-3 py-1.5 text-sm border border-white/10 text-gray-300 hover:bg-white/10 rounded transition-all flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </button>

                  <Button
                    onClick={handleContinueToStyleGuide}
                    className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0"
                  >
                    Generate Style Guide
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {isGenerating && (
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
        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg shadow-xl border border-white/10 overflow-hidden relative">
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
                width: '2000px',
                height: '1200px'
              }}
            >
              {wireframes.length === 0 ? (
                <div className="flex items-center justify-center h-screen">
                  <div className="text-center">
                    <Layout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No wireframes generated yet</h3>
                    <p className="text-sm text-gray-500">Wireframes will appear here after generation</p>
                  </div>
                </div>
              ) : (
                <>
                  {wireframes.map(wireframe => renderWireframe(wireframe))}
                </>
              )}
            </div>
          </div>
        </div>
      </>
    </DemoLayout>
  )
}