'use client'

import React from 'react'
import { SourceCodeView } from '@/components/development/source-code-view'
import { FileNode } from '@/components/development/file-tree'

export default function DevelopmentPage() {
  const mockFiles: FileNode[] = [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      path: '/src',
      children: [
        {
          id: 'app',
          name: 'app',
          type: 'folder',
          path: '/src/app',
          children: [
            {
              id: 'layout',
              name: 'layout.tsx',
              type: 'file',
              path: '/src/app/layout.tsx',
              extension: 'tsx'
            },
            {
              id: 'page',
              name: 'page.tsx',
              type: 'file',
              path: '/src/app/page.tsx',
              extension: 'tsx'
            },
            {
              id: 'globals',
              name: 'globals.css',
              type: 'file',
              path: '/src/app/globals.css',
              extension: 'css'
            }
          ]
        },
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          children: [
            {
              id: 'ui',
              name: 'ui',
              type: 'folder',
              path: '/src/components/ui',
              children: [
                {
                  id: 'button',
                  name: 'button.tsx',
                  type: 'file',
                  path: '/src/components/ui/button.tsx',
                  extension: 'tsx'
                },
                {
                  id: 'card',
                  name: 'card.tsx',
                  type: 'file',
                  path: '/src/components/ui/card.tsx',
                  extension: 'tsx'
                }
              ]
            },
            {
              id: 'header',
              name: 'header.tsx',
              type: 'file',
              path: '/src/components/header.tsx',
              extension: 'tsx'
            },
            {
              id: 'footer',
              name: 'footer.tsx',
              type: 'file',
              path: '/src/components/footer.tsx',
              extension: 'tsx'
            }
          ]
        },
        {
          id: 'lib',
          name: 'lib',
          type: 'folder',
          path: '/src/lib',
          children: [
            {
              id: 'utils',
              name: 'utils.ts',
              type: 'file',
              path: '/src/lib/utils.ts',
              extension: 'ts'
            },
            {
              id: 'api',
              name: 'api.ts',
              type: 'file',
              path: '/src/lib/api.ts',
              extension: 'ts'
            }
          ]
        }
      ]
    },
    {
      id: 'public',
      name: 'public',
      type: 'folder',
      path: '/public',
      children: [
        {
          id: 'favicon',
          name: 'favicon.ico',
          type: 'file',
          path: '/public/favicon.ico',
          extension: 'ico'
        }
      ]
    },
    {
      id: 'package',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      extension: 'json'
    },
    {
      id: 'tsconfig',
      name: 'tsconfig.json',
      type: 'file',
      path: '/tsconfig.json',
      extension: 'json'
    },
    {
      id: 'readme',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      extension: 'md'
    }
  ]

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-2xl font-bold text-white">Source Code</h1>
        <p className="text-gray-400 text-sm mt-1">
          View and export your generated website code
        </p>
      </div>
      
      <div className="flex-1 p-6">
        <SourceCodeView 
          initialFiles={mockFiles}
          className="h-full"
        />
      </div>
    </div>
  )
}