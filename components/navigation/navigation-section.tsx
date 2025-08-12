'use client'

import React, { memo } from 'react'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NavigationSection as NavigationSectionType, NavigationItem } from '@/lib/navigation/types'
import { useNavigation } from '@/lib/context/navigation-context'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavigationSectionProps {
  section: NavigationSectionType
  isActive?: boolean
}

export const NavigationSection = memo(function NavigationSection({ 
  section, 
  isActive = false 
}: NavigationSectionProps) {
  const { navigationState, toggleSection } = useNavigation()
  const pathname = usePathname()
  
  // Use useState to handle hydration mismatch
  const [isExpanded, setIsExpanded] = React.useState(false)
  
  // Update isExpanded after hydration
  React.useEffect(() => {
    setIsExpanded(navigationState.expandedSections.includes(section.id))
  }, [navigationState.expandedSections, section.id])
  
  // All items are now visible
  const visibleItems = section.items
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleSection(section.id)
  }
  
  const renderNavigationItem = (item: NavigationItem, depth = 1) => {
    const isItemActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0
    
    // All children are now visible
    const visibleChildren = item.children || []
    
    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200',
          'hover:bg-white/5 hover:text-orange-400',
          isItemActive && 'bg-orange-500/10 text-orange-400 border-l-2 border-orange-400',
          !isItemActive && 'text-gray-300'
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
    )
    
    return (
      <div key={item.href}>
        {item.tooltip ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {linkContent}
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          linkContent
        )}
        {hasChildren && visibleChildren.length > 0 && (
          <div className="mt-1">
            {visibleChildren.map(child => renderNavigationItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="mb-2">
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          'hover:bg-white/5 hover:text-orange-400',
          isActive && 'text-orange-400',
          !isActive && 'text-gray-300'
        )}
        aria-expanded={isExpanded}
        aria-controls={`section-${section.id}`}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <span className="w-5 h-5">{section.icon}</span>
        <span className="flex-1 text-left">{section.label}</span>
      </button>
      
      <AnimatePresence initial={false}>
        {isExpanded && visibleItems.length > 0 && (
          <motion.div
            id={`section-${section.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1">
              {visibleItems.map(item => renderNavigationItem(item))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})