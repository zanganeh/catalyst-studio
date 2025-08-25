'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Upload, Cloud, Layers, Rocket, Globe, Server, Zap, GitBranch, Package, Shield, Activity, ExternalLink, GitCommit, GitPullRequest, GitMerge, RefreshCw, Search, FileText, Link2, Hash, Users, Eye, Clock, TrendingUp, RotateCcw } from 'lucide-react'
import { DemoLayout } from './demo-layout'

export function ExportDemo() {
  const searchParams = useSearchParams()
  const [contentTypesExported, setContentTypesExported] = useState(0)
  const [contentExported, setContentExported] = useState(0)
  const [buildProgress, setBuildProgress] = useState(0)
  const [status, setStatus] = useState<'connecting' | 'exporting-types' | 'exporting-content' | 'building' | 'deploying' | 'complete'>('connecting')
  const [optimizelyConnected, setOptimizelyConnected] = useState(false)
  const [vercelConnected, setVercelConnected] = useState(false)
  const [deploymentUrl, setDeploymentUrl] = useState('')
  const [exportedItems, setExportedItems] = useState<string[]>([])
  const [buildTime, setBuildTime] = useState(0)
  const [cacheHitRate, setCacheHitRate] = useState(0)
  const [deploymentStatus, setDeploymentStatus] = useState<'pending' | 'building' | 'deploying' | 'live'>('pending')
  const [previewUrl, setPreviewUrl] = useState('')
  const [gitBranch, setGitBranch] = useState('main')
  const [commitHash, setCommitHash] = useState('')
  const [importedUrl, setImportedUrl] = useState<string>('')
  const [hasStarted, setHasStarted] = useState(false)

  const targetContentTypes = 5
  const targetContent = 20

  const contentTypeNames = [
    'PageTemplate', 'ArticleBlock', 'HeroSection', 'ProjectGallery', 'TeamMember',
    'ServiceCard', 'Testimonial', 'ContactForm', 'NavigationMenu', 'FooterBlock',
    'PortfolioItem', 'BlogPost', 'CaseStudy', 'ProductDetail', 'VideoEmbed'
  ]

  const deploymentSteps = [
    'Git: Creating deployment branch',
    'Git: Pushing to origin/production',
    'Vercel: Cloning repository',
    'Vercel: Installing dependencies',
    'Vercel: Running build scripts',
    'Vercel: Generating static pages',
    'Vercel: Optimizing assets',
    'Vercel: Deploying to edge network',
    'Vercel: Configuring domains',
    'Vercel: Live on 300+ edge locations'
  ]

  // Check if coming from style guide
  useEffect(() => {
    const fromStyleGuide = searchParams.get('from') === 'style-guide'
    if (fromStyleGuide) {
      const url = sessionStorage.getItem('importedUrl')
      const hasSitemap = sessionStorage.getItem('sitemapGenerated')
      const hasWireframes = sessionStorage.getItem('wireframesApproved')
      const hasStyleGuide = sessionStorage.getItem('styleGuideApproved')
      if (url && hasSitemap && hasWireframes && hasStyleGuide) {
        setImportedUrl(url)
        // Auto-start export
        setHasStarted(true)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!hasStarted) return

    // Connection phase
    setTimeout(() => {
      setOptimizelyConnected(true)
      setStatus('exporting-types')
    }, 300)

    setTimeout(() => {
      setVercelConnected(true)
    }, 500)

    // Generate commit hash
    setTimeout(() => {
      setCommitHash('a7f8d92')
      setGitBranch('main')
    }, 600)

    // Progress simulation
    const progressInterval = setInterval(() => {
      setBuildProgress(prev => {
        const newProgress = prev + 3
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          setStatus('complete')
          setDeploymentStatus('live')
          setDeploymentUrl('https://tsm-builder-demo.vercel.app')
          setPreviewUrl('https://tsm-builder-a7f8d92.vercel.app')
          setContentTypesExported(targetContentTypes)
          setContentExported(targetContent)
          return 100
        }

        // Update status based on progress
        if (newProgress === 20) {
          setStatus('exporting-types')
        }
        if (newProgress === 40) {
          setStatus('exporting-content')
        }
        if (newProgress === 60) {
          setStatus('building')
          setDeploymentStatus('building')
        }
        if (newProgress === 80) {
          setStatus('deploying')
          setDeploymentStatus('deploying')
        }

        // Update content types export (first 30% of progress)
        if (newProgress < 30) {
          const targetTypes = Math.floor((newProgress / 30) * targetContentTypes)
          setContentTypesExported(current => Math.min(current + 1, targetTypes))
        }

        // Update content export (starts at 10% and continues to 80%)
        if (newProgress >= 10 && newProgress < 80) {
          const targetContentForProgress = Math.floor(((newProgress - 10) / 70) * targetContent)
          setContentExported(current => {
            const increment = Math.min(Math.floor(Math.random() * 30) + 10, targetContentForProgress - current)
            return Math.min(current + increment, targetContentForProgress)
          })
        }

        // Update build time
        if (newProgress >= 60) {
          setBuildTime(prev => prev + 0.3)
        }

        // Update cache hit rate
        setCacheHitRate(Math.min(95, 70 + Math.floor(newProgress / 4)))

        // Add export items
        if (newProgress % 5 === 0 && newProgress < 60) {
          const item = contentTypeNames[Math.floor(Math.random() * contentTypeNames.length)]
          setExportedItems(prev => [...prev, `Exporting: ${item}`].slice(-15))
        }

        return newProgress
      })
    }, 30)

    return () => {
      clearInterval(progressInterval)
    }
  }, [hasStarted])

  const handleRestart = () => {
    // Clear session storage and go back to import
    sessionStorage.clear()
    window.location.href = '/demo/import'
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to services...'
      case 'exporting-types':
        return 'Exporting content types to Optimizely...'
      case 'exporting-content':
        return 'Pushing content to Optimizely CMS...'
      case 'building':
        return 'Building Next.js application...'
      case 'deploying':
        return 'Deploying to Vercel edge network...'
      case 'complete':
        return 'Deployment successful!'
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
    <DemoLayout title="Content Export & Deployment" subtitle="Step 5: Deploy to Production">
      <>

          {/* Start Export Button - Always visible at top when not started */}
          {!hasStarted && (
            <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">Ready to Export & Deploy</h3>
                  <p className="text-xs text-white/60">Export your content to Optimizely CMS and deploy to Vercel</p>
                </div>
                <Button
                  onClick={() => setHasStarted(true)}
                  className="bg-gradient-to-r from-[#FF5500] to-[#FF6600] hover:from-[#FF6600] hover:to-[#FF7700] text-white border-0"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Start Export
                </Button>
              </div>
            </div>
          )}

          {/* Import Status Badge */}
          {importedUrl && hasStarted && (
            <div className="mb-4">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Globe className="h-3 w-3 mr-1" />
                Exporting content from: {importedUrl}
              </Badge>
            </div>
          )}

          {/* Top Section - Service Connections */}
          {hasStarted && (
          <div className="grid grid-cols-3 gap-4">
            {/* Optimizely Connection */}
            <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-blue-500" />
                  <h2 className="text-xs font-semibold text-white">Optimizely CMS SaaS</h2>
                </div>
                <Badge className={optimizelyConnected ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs"}>
                  {optimizelyConnected ? '✓' : '...'}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Environment</span>
                  <span className="text-white">Production</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Connector Version</span>
                  <span className="text-white">v3.2</span>
                </div>
              </div>
            </div>

            {/* Git Sync Status */}
            <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-md border border-purple-500/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitMerge className="h-4 w-4 text-purple-400" />
                  <h2 className="text-xs font-semibold text-white">Git Sync</h2>
                </div>
                {commitHash && (
                  <Badge className={status === 'complete' 
                    ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                    : "bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs animate-pulse"}>
                    {status === 'complete' ? (
                      <>✓ Synced</>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        Syncing
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Branch</span>
                  <span className="text-purple-400 font-mono">{gitBranch}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Commit</span>
                  <span className="text-purple-400 font-mono">{commitHash || 'pending...'}</span>
                </div>
              </div>
            </div>

            {/* Vercel Deployment */}
            <div className="rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-white" />
                  <h2 className="text-xs font-semibold text-white">Vercel Edge</h2>
                </div>
                <Badge className={
                  deploymentStatus === 'live' ? "bg-green-500/20 text-green-400 border-green-500/30 text-xs" :
                  deploymentStatus === 'deploying' ? "bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs animate-pulse" :
                  deploymentStatus === 'building' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs animate-pulse" :
                  "bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs"
                }>
                  {deploymentStatus === 'live' ? 'Live' : 
                   deploymentStatus === 'deploying' ? 'Deploying' :
                   deploymentStatus === 'building' ? 'Building' : 'Ready'}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Framework</span>
                  <span className="text-white">Next.js 14</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Regions</span>
                  <span className="text-white">300+ Edge</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Main Content Area */}
          {hasStarted && (
          <div className="flex-1 grid grid-cols-3 gap-4">
            {/* Left Column - Export Progress */}
            <div className="col-span-2 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#FF5500]" />
                  <h2 className="text-sm font-semibold text-white">Export & Deploy Progress</h2>
                </div>
                <div className="flex items-center gap-2">
                  {status !== 'complete' && status !== 'connecting' && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Processing
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
                  <span className="text-xs text-white/60">{buildProgress}%</span>
                </div>

                {/* Progress Bar */}
                <Progress value={buildProgress} className="h-2 bg-white/10" />

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="h-3 w-3 text-blue-400" />
                      <label className="text-xs text-white/60">Content Types</label>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {contentTypesExported}
                      </span>
                      <span className="text-xs text-white/60">/ {targetContentTypes} exported</span>
                    </div>
                    <div className="text-xs text-white/50">Schemas synchronized</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-3 w-3 text-purple-400" />
                      <label className="text-xs text-white/60">Content Items</label>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">
                        {contentExported.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/60">/ {targetContent.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-white/50">Pushed to CMS</div>
                  </div>
                </div>

                {/* Export Stream */}
                <div className="bg-black/20 rounded-lg p-3 border border-white/10 h-48 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-3 w-3 text-[#FF5500] animate-pulse" />
                    <span className="text-xs font-medium text-white">Export Stream</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    {exportedItems.length > 0 ? (
                      exportedItems.map((item, i) => (
                        <div 
                          key={`${item}-${i}`} 
                          className="text-green-400"
                          style={{
                            opacity: 1 - (i * 0.03)
                          }}
                        >
                          <span className="text-[#FF5500]">→</span> {item}
                        </div>
                      ))
                    ) : (
                      <div className="text-white/40">Preparing export...</div>
                    )}
                  </div>
                </div>

                {/* Deployment Success */}
                {status === 'complete' && deploymentUrl && (
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <div>
                            <p className="text-sm font-medium text-green-300">Workflow Complete!</p>
                            <p className="text-xs text-green-400/80">Successfully imported, mapped, and deployed</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <a href={deploymentUrl} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 bg-blue-500/10 rounded border border-blue-500/20">
                            Visit Live Site <ExternalLink className="h-3 w-3" />
                          </a>
                          <Button
                            onClick={handleRestart}
                            className="text-xs bg-gray-500/10 hover:bg-gray-500/20 text-gray-300 border border-gray-500/20"
                            size="sm"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Start New Import
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Build, Performance, SEO & Analytics */}
            <div className="space-y-3">
              {/* Build Metrics */}
              <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-md border border-purple-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-3 w-3 text-purple-400" />
                  <span className="text-xs font-semibold text-white">Build Metrics</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Build Time</span>
                    <span className="text-purple-400">{buildTime.toFixed(1)}s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Bundle Size</span>
                    <span className="text-green-400">2.3 MB</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Cache Rate</span>
                    <span className="text-green-400">{cacheHitRate}%</span>
                  </div>
                </div>
              </div>

              {/* SEO Optimization */}
              <div className="rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 backdrop-blur-md border border-yellow-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-3 w-3 text-yellow-400" />
                  <span className="text-xs font-semibold text-white">SEO Optimization</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Meta Tags</span>
                    <span className="text-green-400">{Math.floor(contentExported / 10)} indexed</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Sitemap.xml</span>
                    <span className="text-green-400">✓ Generated</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Robots.txt</span>
                    <span className="text-green-400">✓ Configured</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Schema.org</span>
                    <span className="text-yellow-400">Processing...</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Open Graph</span>
                    <span className="text-green-400">✓ All pages</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Canonical URLs</span>
                    <span className="text-green-400">✓ Set</span>
                  </div>
                </div>
              </div>

              {/* Performance Score */}
              <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-md border border-green-500/20 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-semibold text-white">Performance</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Lighthouse</span>
                    <span className="text-green-400">98/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">FCP</span>
                    <span className="text-green-400">0.8s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">TTI</span>
                    <span className="text-green-400">1.2s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Web Vitals</span>
                    <span className="text-green-400">✓ Pass</span>
                  </div>
                </div>
              </div>

              {/* Live Analytics */}
              <div className="rounded-lg bg-black/20 backdrop-blur-md border border-white/10 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-3 w-3 text-green-400" />
                  <span className="text-xs font-medium text-white">Live Analytics</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-blue-400" />
                      <span className="text-xs text-white/60">Views</span>
                    </div>
                    <p className="text-sm font-bold text-white">8</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-purple-400" />
                      <span className="text-xs text-white/60">Visitors</span>
                    </div>
                    <p className="text-sm font-bold text-white">729</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-white/60">Load Time</span>
                    </div>
                    <p className="text-sm font-bold text-white">1.20s</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-white/60">Growth</span>
                    </div>
                    <p className="text-sm font-bold text-white">+12%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}
      </>
    </DemoLayout>
  )
}