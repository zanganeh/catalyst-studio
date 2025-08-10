'use client'

import React, { useCallback } from 'react'
import Link from 'next/link'
import { NavigationItem as NavigationItemType } from '@/lib/navigation/types'
import { cn } from '@/lib/utils'
import { useFeatureFlags } from '@/contexts/feature-flag-context'

interface NavigationItemProps {
  item: NavigationItemType
  depth?: number
  isActive?: boolean
}

export function NavigationItem({ item, depth = 0, isActive = false }: NavigationItemProps) {
  const { isEnabled: isFeatureEnabled } = useFeatureFlags()
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const link = e.currentTarget.querySelector('a') as HTMLAnchorElement
      if (link) {
        link.click()
      }
    }
  }, [])
  
  // Check feature flag
  if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
    return null
  }
  
  // Filter children based on feature flags
  const visibleChildren = item.children?.filter(child => 
    !child.featureFlag || isFeatureEnabled(child.featureFlag)
  ) || []
  
  return (
    <div>
      <div
        role="treeitem"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-expanded={visibleChildren.length > 0 ? true : undefined}
        aria-selected={isActive}
      >
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200',
            'hover:bg-white/5 hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/50',
            isActive && 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-400',
            !isActive && 'text-gray-300'
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {item.icon && <span className="w-4 h-4">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full">
              {item.badge}
            </span>
          )}
        </Link>
      </div>
      
      {visibleChildren.length > 0 && (
        <div role="group" className="mt-1">
          {visibleChildren.map((child) => (
            <NavigationItem
              key={child.href}
              item={child}
              depth={depth + 1}
              isActive={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}