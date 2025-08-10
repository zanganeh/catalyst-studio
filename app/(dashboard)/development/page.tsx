'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Code2, GitBranch, Terminal, FileCode, Package } from 'lucide-react'

export default function DevelopmentPage() {
  const devTools = [
    {
      title: 'Source Code',
      description: 'View and edit your project source code',
      icon: <FileCode className="h-5 w-5" />,
      status: 'Coming in Story 1.9'
    },
    {
      title: 'Version Control',
      description: 'Manage your code with Git integration',
      icon: <GitBranch className="h-5 w-5" />,
      status: 'Coming in Story 1.9'
    },
    {
      title: 'Terminal',
      description: 'Run commands and scripts',
      icon: <Terminal className="h-5 w-5" />,
      status: 'Future Enhancement'
    },
    {
      title: 'Package Manager',
      description: 'Manage dependencies and packages',
      icon: <Package className="h-5 w-5" />,
      status: 'Future Enhancement'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Development</h1>
        <p className="text-gray-400 mt-2">
          Code editor and development tools
        </p>
      </div>

      {/* Development Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devTools.map((tool) => (
          <Card key={tool.title} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg">
                    {tool.icon}
                  </div>
                  <div>
                    <CardTitle className="text-white">{tool.title}</CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      {tool.description}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{tool.status}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled
                  className="border-gray-600 text-gray-400"
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-white">Source Code View Coming Soon</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            The full source code editor and development environment will be implemented in Story 1.9. 
            This will include:
          </p>
          <ul className="list-disc list-inside text-gray-400 mt-3 space-y-1">
            <li>Syntax-highlighted code editor</li>
            <li>File tree navigation</li>
            <li>Real-time code generation</li>
            <li>Export functionality</li>
            <li>Version control integration</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}