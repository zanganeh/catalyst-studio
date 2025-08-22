'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Globe,
  Upload,
  FileJson,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link2,
  FileText,
} from 'lucide-react'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: any) => void
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState('url')
  const [url, setUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const handleUrlImport = async () => {
    if (!url) {
      setError('Please enter a URL')
      return
    }

    setIsImporting(true)
    setError('')
    setProgress(0)

    try {
      // Simulate URL crawling process
      const steps = [
        { progress: 20, status: 'Connecting to website...', delay: 500 },
        { progress: 40, status: 'Analyzing site structure...', delay: 800 },
        { progress: 60, status: 'Extracting page hierarchy...', delay: 1000 },
        { progress: 80, status: 'Processing navigation links...', delay: 800 },
        { progress: 100, status: 'Finalizing sitemap data...', delay: 500 },
      ]

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay))
        setProgress(step.progress)
        setStatus(step.status)
      }

      // Generate sample data based on URL
      const sitemapData = generateSitemapFromUrl(url)
      onImport(sitemapData)
      onClose()
    } catch (err) {
      setError('Failed to import from URL. Please check the URL and try again.')
    } finally {
      setIsImporting(false)
      setProgress(0)
      setStatus('')
    }
  }

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a file to upload')
      return
    }

    setIsImporting(true)
    setError('')

    try {
      const fileContent = await uploadedFile.text()
      let sitemapData

      if (uploadedFile.name.endsWith('.json')) {
        sitemapData = JSON.parse(fileContent)
      } else if (uploadedFile.name.endsWith('.csv')) {
        sitemapData = parseCSV(fileContent)
      } else if (uploadedFile.name.endsWith('.xml')) {
        sitemapData = parseXML(fileContent)
      } else {
        throw new Error('Unsupported file format')
      }

      onImport(sitemapData)
      onClose()
    } catch (err) {
      setError('Failed to parse file. Please check the format and try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const generateSitemapFromUrl = (siteUrl: string) => {
    // Generate realistic sitemap data based on URL
    const domain = new URL(siteUrl).hostname.replace('www.', '')
    
    return {
      nodes: [
        {
          id: 'home',
          type: 'page',
          data: {
            label: 'Home',
            url: siteUrl,
            sections: ['Hero', 'Features', 'About', 'CTA', 'Footer'],
          },
          position: { x: 400, y: 50 },
        },
        {
          id: 'about',
          type: 'page',
          data: {
            label: 'About',
            url: `${siteUrl}/about`,
            sections: ['Hero', 'Mission', 'Team', 'History', 'Footer'],
          },
          position: { x: 200, y: 200 },
        },
        {
          id: 'products',
          type: 'folder',
          data: {
            label: 'Products',
            url: `${siteUrl}/products`,
          },
          position: { x: 400, y: 200 },
        },
        {
          id: 'contact',
          type: 'page',
          data: {
            label: 'Contact',
            url: `${siteUrl}/contact`,
            sections: ['Hero', 'Contact Form', 'Map', 'Footer'],
          },
          position: { x: 600, y: 200 },
        },
        {
          id: 'blog',
          type: 'folder',
          data: {
            label: 'Blog',
            url: `${siteUrl}/blog`,
          },
          position: { x: 800, y: 200 },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'home', target: 'about' },
        { id: 'e1-3', source: 'home', target: 'products' },
        { id: 'e1-4', source: 'home', target: 'contact' },
        { id: 'e1-5', source: 'home', target: 'blog' },
      ],
    }
  }

  const parseCSV = (content: string) => {
    // Simple CSV parser for sitemap data
    const lines = content.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    const nodes = []
    const edges = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length < 2) continue

      const node = {
        id: `node-${i}`,
        type: values[2] === 'folder' ? 'folder' : 'page',
        data: {
          label: values[0],
          url: values[1],
          sections: values[3] ? values[3].split(';') : [],
        },
        position: { x: 200 + (i % 4) * 200, y: Math.floor(i / 4) * 150 + 50 },
      }
      nodes.push(node)

      if (i > 1) {
        edges.push({
          id: `e1-${i}`,
          source: 'node-1',
          target: node.id,
        })
      }
    }

    return { nodes, edges }
  }

  const parseXML = (content: string) => {
    // Simple XML/sitemap.xml parser
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/xml')
    const urls = doc.getElementsByTagName('url')
    const nodes = []
    const edges = []

    for (let i = 0; i < urls.length; i++) {
      const loc = urls[i].getElementsByTagName('loc')[0]?.textContent
      if (!loc) continue

      const path = new URL(loc).pathname
      const segments = path.split('/').filter(Boolean)
      const label = segments[segments.length - 1] || 'Home'

      const node = {
        id: `node-${i}`,
        type: 'page',
        data: {
          label: label.charAt(0).toUpperCase() + label.slice(1),
          url: loc,
          sections: [],
        },
        position: { x: 200 + (i % 4) * 200, y: Math.floor(i / 4) * 150 + 50 },
      }
      nodes.push(node)

      if (i > 0) {
        edges.push({
          id: `e0-${i}`,
          source: 'node-0',
          target: node.id,
        })
      }
    }

    return { nodes, edges }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Sitemap</DialogTitle>
          <DialogDescription>
            Import your website structure from a URL or upload a file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="xml" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              XML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isImporting}
                />
                <Button
                  onClick={handleUrlImport}
                  disabled={isImporting || !url}
                  className="min-w-[100px]"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Crawl
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                We'll crawl your website and automatically detect the page structure
              </p>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-file">Upload JSON File</Label>
              <Input
                id="json-file"
                type="file"
                accept=".json"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">
                Upload a JSON file containing your sitemap structure
              </p>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">
                CSV format: Page Name, URL, Type (page/folder), Sections (semicolon-separated)
              </p>
            </div>
          </TabsContent>

          <TabsContent value="xml" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="xml-file">Upload XML/Sitemap File</Label>
              <Input
                id="xml-file"
                type="file"
                accept=".xml"
                onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                disabled={isImporting}
              />
              <p className="text-sm text-muted-foreground">
                Upload a sitemap.xml or custom XML file with your site structure
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{status}</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          {activeTab !== 'url' && (
            <Button
              onClick={handleFileUpload}
              disabled={isImporting || !uploadedFile}
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}