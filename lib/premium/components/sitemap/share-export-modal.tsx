import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Share2, Download, Link, Copy, Check, FileJson, 
  FileImage, FileText, Users, Lock, Globe, QrCode
} from 'lucide-react'
import { Node, Edge, getNodesBounds, getViewportForBounds } from 'reactflow'
import { toPng, toPdf } from '@/lib/premium/export-utils'
import QRCode from 'qrcode'

interface ShareExportModalProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
  projectId?: string
}

type SharePermission = 'view' | 'comment' | 'edit'

export function ShareExportModal({ isOpen, onClose, nodes, edges, projectId = 'demo-project' }: ShareExportModalProps) {
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [permission, setPermission] = useState<SharePermission>('view')
  const [isPublic, setIsPublic] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  // Generate share link
  React.useEffect(() => {
    if (isOpen) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/demo/sitemap-builder?project=${projectId}&mode=${permission}`
      setShareLink(link)
      
      // Generate QR code
      QRCode.toDataURL(link, { width: 200 }, (err, url) => {
        if (!err) setQrCode(url)
      })
    }
  }, [isOpen, projectId, permission])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJSON = () => {
    const data = { 
      version: '1.0',
      projectId,
      timestamp: new Date().toISOString(),
      nodes, 
      edges,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        exportedBy: 'Current User'
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${projectId}-${Date.now()}.json`
    a.click()
  }

  const handleExportPNG = async () => {
    setExporting(true)
    try {
      // Get the React Flow container
      const flowElement = document.querySelector('.react-flow') as HTMLElement
      if (!flowElement) return

      // Calculate bounds to fit all nodes
      const bounds = getNodesBounds(nodes)
      const viewport = getViewportForBounds(
        bounds,
        flowElement.offsetWidth,
        flowElement.offsetHeight,
        0.5,
        2
      )

      // Export as PNG
      const dataUrl = await toPng(flowElement, {
        backgroundColor: '#111827',
        width: bounds.width + 200,
        height: bounds.height + 200,
        style: {
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
        }
      })

      // Download
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `sitemap-${projectId}-${Date.now()}.png`
      a.click()
    } catch (error) {
      console.error('Export PNG failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const flowElement = document.querySelector('.react-flow') as HTMLElement
      if (!flowElement) return

      await toPdf(flowElement, {
        filename: `sitemap-${projectId}-${Date.now()}.pdf`,
        projectName: 'Sitemap Project',
        nodes,
        edges
      })
    } catch (error) {
      console.error('Export PDF failed:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportSVG = () => {
    // Create SVG representation
    const svg = createSVGFromNodesAndEdges(nodes, edges)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${projectId}-${Date.now()}.svg`
    a.click()
  }

  const handleExportMarkdown = () => {
    // Create markdown representation
    const markdown = createMarkdownFromNodes(nodes, edges)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${projectId}-${Date.now()}.md`
    a.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Share & Export</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share your sitemap with others or export it in various formats
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="share" className="data-[state=active]:bg-gray-700">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-gray-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4 mt-4">
            {/* Permission Settings */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Share Settings</label>
              <div className="flex gap-2">
                <Button
                  variant={permission === 'view' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPermission('view')}
                  className={permission === 'view' ? 'bg-[#FF5500]' : 'bg-white/10 border-white/20'}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  View Only
                </Button>
                <Button
                  variant={permission === 'comment' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPermission('comment')}
                  className={permission === 'comment' ? 'bg-[#FF5500]' : 'bg-white/10 border-white/20'}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Can Comment
                </Button>
                <Button
                  variant={permission === 'edit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPermission('edit')}
                  className={permission === 'edit' ? 'bg-[#FF5500]' : 'bg-white/10 border-white/20'}
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Can Edit
                </Button>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Share Link</label>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={handleCopyLink}
                  className="bg-white/10 border-white/20 hover:bg-white/20"
                  variant="outline"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">QR Code</label>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Public Access Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm font-medium">Public Access</p>
                <p className="text-xs text-gray-400">Anyone with the link can access</p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPublic ? 'bg-[#FF5500]' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {/* JSON Export */}
              <button
                onClick={handleExportJSON}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileJson className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-medium">JSON</p>
                  <p className="text-xs text-gray-400">Data format</p>
                </div>
              </button>

              {/* PNG Export */}
              <button
                onClick={handleExportPNG}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileImage className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm font-medium">PNG Image</p>
                  <p className="text-xs text-gray-400">High quality</p>
                </div>
              </button>

              {/* PDF Export */}
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileText className="h-8 w-8 text-red-400" />
                <div>
                  <p className="text-sm font-medium">PDF Document</p>
                  <p className="text-xs text-gray-400">Printable</p>
                </div>
              </button>

              {/* SVG Export */}
              <button
                onClick={handleExportSVG}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileImage className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm font-medium">SVG Vector</p>
                  <p className="text-xs text-gray-400">Scalable</p>
                </div>
              </button>

              {/* Markdown Export */}
              <button
                onClick={handleExportMarkdown}
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FileText className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium">Markdown</p>
                  <p className="text-xs text-gray-400">Documentation</p>
                </div>
              </button>

              {/* Figma Export (placeholder) */}
              <button
                disabled
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 opacity-50 rounded-lg cursor-not-allowed"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded" />
                <div>
                  <p className="text-sm font-medium">Figma</p>
                  <p className="text-xs text-gray-400">Coming soon</p>
                </div>
              </button>
            </div>

            {exporting && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-400">Exporting...</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Helper functions for export formats
function createSVGFromNodesAndEdges(nodes: Node[], edges: Edge[]): string {
  const bounds = getNodesBounds(nodes)
  const padding = 50
  const width = bounds.width + padding * 2
  const height = bounds.height + padding * 2

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#111827"/>
    <g transform="translate(${padding}, ${padding})">`;

  // Draw edges
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    if (sourceNode && targetNode) {
      svg += `<line x1="${sourceNode.position.x + 150}" y1="${sourceNode.position.y + 40}" 
                    x2="${targetNode.position.x + 150}" y2="${targetNode.position.y}" 
                    stroke="rgba(255,255,255,0.2)" stroke-width="2"/>`;
    }
  })

  // Draw nodes
  nodes.forEach(node => {
    svg += `<rect x="${node.position.x}" y="${node.position.y}" 
                  width="300" height="80" 
                  fill="#1F2937" stroke="rgba(255,255,255,0.2)" 
                  rx="8" ry="8"/>
            <text x="${node.position.x + 150}" y="${node.position.y + 40}" 
                  fill="white" text-anchor="middle" font-family="Arial" font-size="14">
                  ${node.data.label}
            </text>`;
  })

  svg += '</g></svg>';
  return svg
}

function createMarkdownFromNodes(nodes: Node[], edges: Edge[]): string {
  let markdown = '# Sitemap Structure\n\n'
  markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`
  markdown += `## Pages (${nodes.length})\n\n`

  // Create hierarchy
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  )

  const getChildren = (nodeId: string): Node[] => {
    const childIds = edges
      .filter(e => e.source === nodeId)
      .map(e => e.target)
    return nodes.filter(n => childIds.includes(n.id))
  }

  const renderNode = (node: Node, level: number = 0): string => {
    const indent = '  '.repeat(level)
    let output = `${indent}- **${node.data.label}**`
    if (node.data.url) output += ` (${node.data.url})`
    output += '\n'
    
    if (node.data.description) {
      output += `${indent}  _${node.data.description}_\n`
    }
    
    if (node.data.sections?.length) {
      output += `${indent}  Sections: ${node.data.sections.join(', ')}\n`
    }

    const children = getChildren(node.id)
    children.forEach(child => {
      output += renderNode(child, level + 1)
    })

    return output
  }

  rootNodes.forEach(node => {
    markdown += renderNode(node)
  })

  return markdown
}