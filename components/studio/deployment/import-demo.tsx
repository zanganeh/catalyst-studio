'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Loader2, Bot, Database, FileText, Sparkles, Globe, Server, Brain, Zap, AlertCircle, TrendingUp, Clock, Shield, Search, BarChart3, ArrowRight } from 'lucide-react'
import { DemoLayout } from './demo-layout'

export function ImportDemo() {
  const router = useRouter()
  const [urlInput, setUrlInput] = useState('https://example.com')
  const [hasStarted, setHasStarted] = useState(false)
  const [contentCount, setContentCount] = useState(0)
  const [contentTypeCount, setContentTypeCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'analyzing' | 'importing' | 'processing' | 'complete'>('waiting')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [throughput, setThroughput] = useState(0)
  const [confidence, setConfidence] = useState(95)
  const [warnings, setWarnings] = useState(0)
  const [currentItem, setCurrentItem] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [importedPages, setImportedPages] = useState<string[]>([])
  const [seoScore, setSeoScore] = useState(87)

  const targetContent = 20
  const targetContentTypes = 5

  const contentItems = [
    'Homepage', 'About Us', 'Contact Form', 'Product Catalog', 'Blog Posts',
    'News Articles', 'Team Members', 'Case Studies', 'FAQ Section', 'Privacy Policy',
    'Terms of Service', 'Product Details', 'Customer Reviews', 'Gallery Images',
    'Video Library', 'Download Center', 'Newsletter Archive', 'Event Calendar'
  ]

  const pageNames = [
    '/portfolio/retail/westfield-plaza', '/projects/residential/parkview-towers', 
    '/portfolio/commercial/meridian-business-park', '/services/design-build',
    '/projects/mixed-use/harmony-square', '/portfolio/hospitality/grandview-hotel',
    '/services/construction-management', '/projects/healthcare/regional-medical-center',
    '/portfolio/education/university-commons', '/services/pre-construction',
    '/projects/industrial/logistics-hub', '/portfolio/retail/fashion-district',
    '/team/project-managers', '/portfolio/residential/sunset-apartments',
    '/services/sustainability', '/projects/office/corporate-headquarters',
    '/portfolio/recreation/aquatic-center', '/services/renovation',
    '/projects/retail/marketplace-pavilion', '/portfolio/residential/garden-estates',
    '/services/consulting', '/projects/civic/community-center',
    '/portfolio/mixed-use/downtown-crossing', '/case-studies/stadium-renovation',
    '/portfolio/hospitality/resort-expansion', '/projects/residential/riverfront-condos',
    '/services/facility-management', '/portfolio/commercial/tech-campus',
    '/projects/healthcare/specialty-clinic', '/portfolio/education/elementary-school'
  ]

  const handleStartImport = () => {
    if (urlInput) {
      setHasStarted(true)
      setStatus('connecting')
      // Store URL in sessionStorage for other demos
      sessionStorage.setItem('importedUrl', urlInput)
    }
  }

  const handleContinueToSitemap = () => {
    // Navigate to sitemap with the imported data
    router.push('/demo/sitemap-builder?imported=true')
  }

  useEffect(() => {
    if (!hasStarted) return

    // Progress bar (drives everything else)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 3
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          setStatus('complete')
          setAiProcessing(false)
          setCurrentItem('Import Complete')
          
          // Ensure final values
          setContentCount(targetContent)
          setContentTypeCount(targetContentTypes)
          setWarnings(3)
          return 100
        }
        
        // Update content count based on progress
        const targetContentForProgress = Math.floor((newProgress / 100) * targetContent)
        setContentCount(current => {
          if (current < targetContentForProgress) {
            const increment = Math.min(Math.floor(Math.random() * 20) + 10, targetContentForProgress - current)
            setThroughput(Math.floor(increment * 3.3)) // items/sec
            return current + increment
          }
          return current
        })
        
        // Update content types based on progress (slightly delayed)
        const targetTypesForProgress = Math.floor((newProgress / 100) * targetContentTypes)
        setContentTypeCount(current => {
          if (current < targetTypesForProgress && newProgress > 10) {
            return Math.min(current + 1, targetTypesForProgress)
          }
          return current
        })
        
        // Update confidence slightly
        setConfidence(95 + Math.floor(Math.random() * 5))
        
        // Update SEO score
        setSeoScore(87 + Math.floor(Math.random() * 11))
        
        
        // Occasionally add warnings
        if (Math.random() < 0.02 && newProgress > 20) {
          setWarnings(prev => Math.min(prev + 1, 3))
        }
        
        // Update current processing item
        if (newProgress % 5 === 0) {
          setCurrentItem(contentItems[Math.floor(Math.random() * contentItems.length)])
        }
        
        // Add log entries
        if (newProgress % 10 === 0) {
          setLogs(prev => [`[${new Date().toLocaleTimeString()}] Processing batch ${Math.floor(newProgress / 10)}/10...`, ...prev].slice(0, 5))
        }
        
        // Add imported pages
        if (newProgress % 3 === 0 && importedPages.length < 20) {
          const randomPage = pageNames[Math.floor(Math.random() * pageNames.length)]
          setImportedPages(prev => [...prev, randomPage].slice(-20))
        }
        
        return newProgress
      })
    }, 30) // Super fast progress

    // Connection phase (0.3 seconds)
    const connectionTimer = setTimeout(() => {
      setStatus('analyzing')
    }, 300)

    // Start AI analysis (0.6 seconds)
    const analysisTimer = setTimeout(() => {
      setAiProcessing(true)
      setStatus('importing')
    }, 600)

    // Status updates
    const processingTimer = setTimeout(() => {
      if (status !== 'complete') {
        setStatus('processing')
      }
    }, 1000)

    return () => {
      clearTimeout(connectionTimer)
      clearTimeout(analysisTimer)
      clearTimeout(processingTimer)
      clearInterval(progressInterval)
    }
  }, [hasStarted])

  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return 'Enter URL to begin import'
      case 'connecting':
        return 'Connecting to Sitecore instance...'
      case 'analyzing':
        return 'AI analyzing content structure...'
      case 'importing':
        return 'Importing and categorizing content...'
      case 'processing':
        return 'Processing content relationships...'
      case 'complete':
        return 'Import completed successfully!'
      default:
        return 'Initializing...'
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'complete':
        return 'text-green-400'
      case 'connecting':
        return 'text-blue-400'
      default:
        return 'text-[#FF5500]'
    }
  }

  return (
    <DemoLayout title="AI Content Import" subtitle="Step 1: Import Content">
      <>
          {/* URL Input Section - Always visible at top */}
          {!hasStarted && (
            <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-white/80 mb-2 block">Enter Website URL to Import</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                    <Button
                      onClick={handleStartImport}
                      disabled={!urlInput}
                      className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Start Import
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Section - Website Info & Metrics */}
          {hasStarted && (
          <div className="grid grid-cols-2 gap-4">
            {/* Website Info Card */}
            <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#FF5500]" />
                  <h2 className="text-sm font-semibold text-white">Website Configuration</h2>
                </div>
                <Badge className={hasStarted ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" : "bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"}>
                  <Server className="h-3 w-3 mr-1" />
                  {hasStarted ? 'Connected' : 'Ready'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/60">Website URL</label>
                  <p className="text-sm font-semibold text-white truncate">{urlInput}</p>
                </div>
                <div>
                  <label className="text-xs text-white/60">CMS Technology</label>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    Sitecore
                    <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">v10.3</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-md border border-blue-500/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <TrendingUp className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-blue-400">Speed</span>
                </div>
                <div className="text-xl font-bold text-white">{throughput}</div>
                <div className="text-xs text-white/60">items/sec</div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-md border border-purple-500/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <Brain className="h-3 w-3 text-purple-400" />
                  <span className="text-xs text-purple-400">AI Score</span>
                </div>
                <div className="text-xl font-bold text-white">{confidence}%</div>
                <div className="text-xs text-white/60">accuracy</div>
              </div>

              <div className="rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 backdrop-blur-md border border-yellow-500/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <Search className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs text-yellow-400">SEO</span>
                </div>
                <div className="text-xl font-bold text-white">{seoScore}/100</div>
                <div className="text-xs text-white/60">optimized</div>
              </div>
            </div>
          </div>
          )}

          {/* Main Content Area */}
          {hasStarted && (
          <div className="flex-1 grid grid-cols-3 gap-4">
            {/* Left Column - Import Progress */}
            <div className="col-span-2 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#FF5500]" />
                  <h2 className="text-sm font-semibold text-white">Import Progress</h2>
                </div>
                <div className="flex items-center gap-2">
                  {aiProcessing && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Processing
                    </Badge>
                  )}
                  {status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-[#FF5500] animate-spin" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Status Message */}
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusMessage()}</p>
                  <span className="text-xs text-white/60">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <Progress value={progress} className="h-2 bg-white/10" />

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-3 w-3 text-blue-400" />
                      <label className="text-xs text-white/60">Content Digested</label>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {contentCount.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/60">/ {targetContent.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-white/50">Pages, Articles, Media</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="h-3 w-3 text-purple-400" />
                      <label className="text-xs text-white/60">Content Types</label>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {contentTypeCount}
                      </span>
                      <span className="text-xs text-white/60">/ {targetContentTypes}</span>
                    </div>
                    <div className="text-xs text-white/50">AI-Identified</div>
                  </div>
                </div>

                {/* AI Analysis Details */}
                {aiProcessing && (
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-3 w-3 text-purple-400 animate-pulse" />
                      <span className="text-xs font-medium text-purple-300">AI Analysis Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/5 rounded px-2 py-1 border border-white/10 text-center">
                        <span className="text-purple-300 text-xs">Schema</span>
                      </div>
                      <div className="bg-white/5 rounded px-2 py-1 border border-white/10 text-center">
                        <span className="text-purple-300 text-xs">Classify</span>
                      </div>
                      <div className="bg-white/5 rounded px-2 py-1 border border-white/10 text-center">
                        <span className="text-purple-300 text-xs">Relations</span>
                      </div>
                    </div>
                  </div>
                )}


                {/* Live Import Feed - Pages Being Imported */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10 h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3 text-[#FF5500] animate-pulse" />
                    <span className="text-xs font-medium text-white">Live Import Stream</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    {importedPages.length > 0 ? (
                      importedPages.map((page, i) => (
                        <div 
                          key={`${page}-${i}`} 
                          className="text-green-400 animate-fade-in"
                          style={{
                            opacity: 1 - (i * 0.03),
                            animation: i === importedPages.length - 1 ? 'slideIn 0.3s ease-out' : 'none'
                          }}
                        >
                          <span className="text-[#FF5500]">✓</span> {page}
                        </div>
                      ))
                    ) : (
                      <div className="text-white/40">Initializing import stream...</div>
                    )}
                  </div>
                </div>

                {/* Completion Message with Continue Button */}
                {status === 'complete' && (
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-300">Import Successful!</p>
                          <p className="text-xs text-green-400/80">All content imported with AI analysis.</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleContinueToSitemap}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                      >
                        Build Sitemap
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Security & SEO Analysis */}
            <div className="space-y-3">
              {/* Security Analysis */}
              <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-md border border-green-500/20 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-semibold text-white">Security Analysis</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">SSL Certificate</span>
                    <span className="text-green-400">✓ Valid</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">HTTPS Redirect</span>
                    <span className="text-green-400">✓ Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Security Headers</span>
                    <span className="text-yellow-400">⚠ Partial</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Content Policy</span>
                    <span className="text-green-400">✓ Secure</span>
                  </div>
                </div>
              </div>

              {/* SEO Optimization */}
              <div className="rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 backdrop-blur-md border border-yellow-500/20 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-white">SEO Optimization</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Meta Tags</span>
                    <span className="text-green-400">{Math.floor(contentCount / 12)} found</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Sitemap</span>
                    <span className="text-green-400">✓ Generated</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Schema Markup</span>
                    <span className="text-yellow-400">Adding...</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Page Speed</span>
                    <span className="text-green-400">89/100</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-3">
                <h3 className="text-xs font-semibold text-white mb-2">Import Status</h3>
                <div className="space-y-2 text-xs text-white/70">
                  {progress > 80 && <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Finalizing...
                  </div>}
                  {progress > 60 && <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                    Optimizing...
                  </div>}
                  {progress > 40 && <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                    Analyzing...
                  </div>}
                  {progress > 20 && <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#FF5500] rounded-full animate-pulse" />
                    Scanning...
                  </div>}
                  {progress > 0 && <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                    Connected
                  </div>}
                </div>
              </div>
            </div>
          </div>
          )}
      </>
    </DemoLayout>
  )
}