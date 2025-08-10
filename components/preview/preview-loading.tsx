'use client'

/**
 * Preview Loading Skeleton
 * Story 1.4: Loading state for preview components
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface PreviewLoadingProps {
  className?: string
}

export function PreviewLoading({ className }: PreviewLoadingProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Device frame skeleton */}
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          {/* Frame */}
          <div className="w-[800px] h-[600px] bg-gray-200 rounded-2xl">
            {/* Browser chrome */}
            <div className="h-8 bg-gray-300 rounded-t-2xl flex items-center px-3 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              </div>
              <div className="flex-1 mx-4 h-5 bg-gray-400 rounded" />
            </div>
            
            {/* Content area */}
            <div className="p-8 space-y-4">
              <div className="h-8 bg-gray-300 rounded w-3/4" />
              <div className="h-4 bg-gray-300 rounded w-full" />
              <div className="h-4 bg-gray-300 rounded w-5/6" />
              <div className="h-4 bg-gray-300 rounded w-4/5" />
              
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="h-32 bg-gray-300 rounded" />
                <div className="h-32 bg-gray-300 rounded" />
                <div className="h-32 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}