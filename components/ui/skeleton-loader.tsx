import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  showAvatar?: boolean
  showTitle?: boolean
}

export function SkeletonLoader({ 
  className = '', 
  lines = 3,
  showAvatar = false,
  showTitle = true
}: SkeletonLoaderProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      )}
      
      {showTitle && (
        <div className="h-6 bg-gray-700 rounded w-2/3 mb-4" />
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-700 rounded"
            style={{
              width: `${Math.random() * 30 + 70}%`
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-1/2 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-700 rounded" />
        <div className="h-3 bg-gray-700 rounded w-5/6" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full animate-pulse">
      <div className="h-10 bg-gray-700 rounded mb-2" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-800/50 rounded mb-1" />
      ))}
    </div>
  )
}