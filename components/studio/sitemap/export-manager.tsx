'use client'

import { useState } from 'react'
import { Node, Edge } from 'reactflow'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Package,
  Figma,
  Code2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ExportManagerProps {
  isOpen: boolean
  onClose: () => void
  nodes: Node[]
  edges: Edge[]
}

export function ExportManager({
  isOpen,
  onClose,
  nodes,
  edges,
}: ExportManagerProps) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExportJSON = () => {
    const data = { nodes, edges, meta: { version: '1.0', exportDate: new Date().toISOString() } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Label', 'URL', 'Type', 'Status', 'SEO Score', 'Parent', 'Sections']
    const rows = nodes.map(node => {
      const parent = edges.find(e => e.target === node.id)?.source || ''
      return [
        node.id,
        node.data.label || '',
        node.data.url || '',
        node.type || '',
        node.data.metadata?.status || '',
        node.data.metadata?.seoScore || '',
        parent,
        (node.data.sections || []).join('; ')
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    // Create a more detailed Excel-compatible CSV with additional sheets simulation
    const mainSheet = [
      ['Sitemap Export', '', '', '', '', '', '', ''],
      ['Generated:', new Date().toLocaleString(), '', '', '', '', '', ''],
      ['Total Pages:', nodes.filter(n => n.type === 'page').length, '', '', '', '', '', ''],
      ['Total Folders:', nodes.filter(n => n.type === 'folder').length, '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['ID', 'Page Name', 'URL', 'Type', 'Status', 'SEO Score', 'Parent', 'Sections'],
    ]

    const dataRows = nodes.map(node => {
      const parent = edges.find(e => e.target === node.id)?.source || 'root'
      return [
        node.id,
        node.data.label || '',
        node.data.url || '',
        node.type || '',
        node.data.metadata?.status || 'draft',
        node.data.metadata?.seoScore || '0',
        parent,
        (node.data.sections || []).join(', ')
      ]
    })

    const excelContent = [
      ...mainSheet,
      ...dataRows,
      ['', '', '', '', '', '', '', ''],
      ['Summary', '', '', '', '', '', '', ''],
      ['Published Pages:', nodes.filter(n => n.data.metadata?.status === 'published').length, '', '', '', '', '', ''],
      ['Draft Pages:', nodes.filter(n => n.data.metadata?.status === 'draft').length, '', '', '', '', '', ''],
      ['Average SEO Score:', Math.round(nodes.reduce((acc, n) => acc + (n.data.metadata?.seoScore || 0), 0) / nodes.length), '', '', '', '', '', ''],
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([excelContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-excel-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportMarkdown = () => {
    // Create markdown representation
    const buildTree = (parentId: string | null, level: number = 0): string => {
      const children = parentId 
        ? nodes.filter(n => edges.some(e => e.source === parentId && e.target === n.id))
        : nodes.filter(n => !edges.some(e => e.target === n.id))

      return children.map(node => {
        const indent = '  '.repeat(level)
        const prefix = level === 0 ? '# ' : `${indent}- `
        const status = node.data.metadata?.status === 'published' ? '✅' : '📝'
        const seo = node.data.metadata?.seoScore ? ` (SEO: ${node.data.metadata.seoScore})` : ''
        
        let result = `${prefix}${status} **${node.data.label}**${seo}`
        if (node.data.url) result += `\n${indent}  URL: ${node.data.url}`
        if (node.data.sections?.length) result += `\n${indent}  Sections: ${node.data.sections.join(', ')}`
        
        const childContent = buildTree(node.id, level + 1)
        if (childContent) result += '\n' + childContent
        
        return result
      }).join('\n')
    }

    const markdown = `# Sitemap Structure\n\nGenerated: ${new Date().toLocaleString()}\n\n${buildTree(null)}`
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sitemap-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportReact = () => {
    // Generate React Router structure
    const generateRoutes = (): string => {
      const routes = nodes
        .filter(n => n.type === 'page' && n.data.url)
        .map(node => {
          const componentName = node.data.label?.replace(/\s+/g, '') || 'Page'
          return `  <Route path="${node.data.url}" element={<${componentName} />} />`
        })
        .join('\n')

      return `import { Routes, Route } from 'react-router-dom'

// Import your page components
${nodes.filter(n => n.type === 'page').map(n => 
  `import ${n.data.label?.replace(/\s+/g, '') || 'Page'} from './pages/${n.data.label?.replace(/\s+/g, '') || 'Page'}'`
).join('\n')}

function App() {
  return (
    <Routes>
${routes}
    </Routes>
  )
}

export default App`
    }

    const code = generateRoutes()
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `routes-${Date.now()}.jsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyStructure = () => {
    const structure = nodes.map(n => ({
      id: n.id,
      label: n.data.label,
      url: n.data.url,
      type: n.type,
      parent: edges.find(e => e.target === n.id)?.source
    }))
    
    navigator.clipboard.writeText(JSON.stringify(structure, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-900/95 backdrop-blur-xl border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-400" />
            Export Sitemap
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="standard">Standard Formats</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="design">Design Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportJSON}
                className="p-4 rounded-lg border border-gray-700 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left"
              >
                <FileJson className="h-8 w-8 text-purple-400 mb-2" />
                <h3 className="font-medium text-white mb-1">JSON</h3>
                <p className="text-xs text-gray-400">Complete data structure with all properties</p>
              </button>

              <button
                onClick={handleExportCSV}
                className="p-4 rounded-lg border border-gray-700 hover:border-green-500 hover:bg-green-500/10 transition-all text-left"
              >
                <FileSpreadsheet className="h-8 w-8 text-green-400 mb-2" />
                <h3 className="font-medium text-white mb-1">CSV</h3>
                <p className="text-xs text-gray-400">Simple spreadsheet format</p>
              </button>

              <button
                onClick={handleExportExcel}
                className="p-4 rounded-lg border border-gray-700 hover:border-green-500 hover:bg-green-500/10 transition-all text-left"
              >
                <FileSpreadsheet className="h-8 w-8 text-green-400 mb-2" />
                <h3 className="font-medium text-white mb-1">Excel (CSV)</h3>
                <p className="text-xs text-gray-400">Detailed spreadsheet with summary</p>
                <Badge className="mt-2 bg-green-500/20 text-green-400">Enhanced</Badge>
              </button>

              <button
                onClick={handleExportMarkdown}
                className="p-4 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
              >
                <FileText className="h-8 w-8 text-blue-400 mb-2" />
                <h3 className="font-medium text-white mb-1">Markdown</h3>
                <p className="text-xs text-gray-400">Documentation format</p>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleExportReact}
                className="p-4 rounded-lg border border-gray-700 hover:border-cyan-500 hover:bg-cyan-500/10 transition-all text-left"
              >
                <Code2 className="h-8 w-8 text-cyan-400 mb-2" />
                <h3 className="font-medium text-white mb-1">React Router</h3>
                <p className="text-xs text-gray-400">Route configuration for React</p>
                <Badge className="mt-2 bg-cyan-500/20 text-cyan-400">New</Badge>
              </button>

              <button
                onClick={handleCopyStructure}
                className="p-4 rounded-lg border border-gray-700 hover:border-yellow-500 hover:bg-yellow-500/10 transition-all text-left"
              >
                <Copy className="h-8 w-8 text-yellow-400 mb-2" />
                <h3 className="font-medium text-white mb-1">Copy Structure</h3>
                <p className="text-xs text-gray-400">Copy to clipboard as JSON</p>
                {copied && <Badge className="mt-2 bg-green-500/20 text-green-400">Copied!</Badge>}
              </button>

              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <Package className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">Next.js Routes</h3>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>

              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <FileCode className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">API Schema</h3>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <Figma className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">Figma</h3>
                <p className="text-xs text-gray-500">Export to Figma plugin</p>
                <Badge className="mt-2 bg-gray-500/20 text-gray-400">Pro</Badge>
              </button>

              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <ExternalLink className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">Webflow</h3>
                <p className="text-xs text-gray-500">Direct Webflow integration</p>
                <Badge className="mt-2 bg-gray-500/20 text-gray-400">Pro</Badge>
              </button>

              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <Package className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">Framer</h3>
                <p className="text-xs text-gray-500">Export to Framer</p>
                <Badge className="mt-2 bg-gray-500/20 text-gray-400">Pro</Badge>
              </button>

              <button
                disabled
                className="p-4 rounded-lg border border-gray-700 opacity-50 cursor-not-allowed text-left"
              >
                <FileText className="h-8 w-8 text-gray-500 mb-2" />
                <h3 className="font-medium text-gray-500 mb-1">PDF</h3>
                <p className="text-xs text-gray-500">High-quality PDF export</p>
                <Badge className="mt-2 bg-gray-500/20 text-gray-400">Pro</Badge>
              </button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {nodes.length} pages • {edges.length} connections
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}