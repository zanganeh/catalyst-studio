'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumb() {
  const pathname = usePathname()
  
  // Generate breadcrumb items from pathname
  const segments = pathname.split('/').filter(Boolean)
  
  const breadcrumbItems = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    return { href, label, icon: null }
  })
  
  // Add home as first item
  const items = [
    { href: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
    ...breadcrumbItems
  ]
  
  if (items.length === 1) {
    return null // Don't show breadcrumb on home page
  }
  
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <React.Fragment key={item.href}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            {isLast ? (
              <span className="text-gray-300 font-medium flex items-center gap-1">
                {item.icon && item.icon}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "text-gray-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                )}
              >
                {item.icon && item.icon}
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}