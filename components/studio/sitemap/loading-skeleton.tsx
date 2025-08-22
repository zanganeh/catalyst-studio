'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function SitemapLoadingSkeleton() {
  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-32 bg-white/10" />
        <Skeleton className="h-10 w-32 bg-white/10" />
        <Skeleton className="h-10 w-32 bg-white/10" />
      </div>
      
      <div className="relative h-[600px] w-full">
        {/* Central node */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <Skeleton className="h-32 w-64 bg-white/10 rounded-xl" />
        </div>
        
        {/* Child nodes */}
        <div className="absolute top-60 left-1/4">
          <Skeleton className="h-28 w-56 bg-white/10 rounded-xl" />
        </div>
        <div className="absolute top-60 right-1/4">
          <Skeleton className="h-28 w-56 bg-white/10 rounded-xl" />
        </div>
        <div className="absolute top-60 left-1/2 -translate-x-1/2">
          <Skeleton className="h-28 w-56 bg-white/10 rounded-xl" />
        </div>
        
        {/* Grandchild nodes */}
        <div className="absolute bottom-32 left-1/4 -translate-x-12">
          <Skeleton className="h-24 w-48 bg-white/10 rounded-xl" />
        </div>
        <div className="absolute bottom-32 left-1/4 translate-x-12">
          <Skeleton className="h-24 w-48 bg-white/10 rounded-xl" />
        </div>
        
        {/* Connection lines */}
        <svg className="absolute inset-0 pointer-events-none">
          <defs>
            <linearGradient id="skelGradient">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
            </linearGradient>
          </defs>
          <line x1="50%" y1="152" x2="25%" y2="260" stroke="url(#skelGradient)" strokeWidth="2" />
          <line x1="50%" y1="152" x2="50%" y2="260" stroke="url(#skelGradient)" strokeWidth="2" />
          <line x1="50%" y1="152" x2="75%" y2="260" stroke="url(#skelGradient)" strokeWidth="2" />
        </svg>
      </div>
      
      {/* Bottom toolbar */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 bg-white/10 rounded" />
          <Skeleton className="h-8 w-8 bg-white/10 rounded" />
          <Skeleton className="h-8 w-8 bg-white/10 rounded" />
        </div>
        <Skeleton className="h-8 w-32 bg-white/10 rounded" />
      </div>
    </div>
  )
}

export function NodeLoadingSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-8 w-8 rounded-lg bg-white/10" />
        <Skeleton className="h-5 w-32 bg-white/10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
      </div>
    </div>
  )
}