'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationSection } from './navigation-section'
import { NavigationSection as NavigationSectionType, NavigationItem } from '@/lib/navigation/types'
import { usePathname } from 'next/navigation'
import { useFeatureFlags } from '@/contexts/feature-flag-context-stub'
import Link from 'next/link'
import {
  MessageSquare,
  Database,
  Eye,
  BarChart3,
  Code2,
  Plug2,
  FolderOpen,
  Grid3x3,
  Package,
  Settings,
} from 'lucide-react'

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { isEnabled: isFeatureEnabled } = useFeatureFlags()
  
  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])
  
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  const navigationSections: NavigationSectionType[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Home className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Dashboard',
          href: '/overview',
          icon: <Grid3x3 className="h-4 w-4" />,
        },
        {
          label: 'Chat',
          href: '/chat',
          icon: <MessageSquare className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: <Database className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Content Types',
          href: '/content',
          icon: <FolderOpen className="h-4 w-4" />,
        },
        {
          label: 'Content Builder',
          href: '/content-builder',
          icon: <Database className="h-4 w-4" />,
          featureFlag: 'contentTypeBuilder',
        },
        {
          label: 'Preview',
          href: '/preview',
          icon: <Eye className="h-4 w-4" />,
          featureFlag: 'previewSystem',
        },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Overview',
          href: '/analytics',
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'development',
      label: 'Development',
      icon: <Code2 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'Source Code',
          href: '/development',
          icon: <Code2 className="h-4 w-4" />,
        },
        {
          label: 'Components',
          href: '/components',
          icon: <Package className="h-4 w-4" />,
        },
      ]
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: <Plug2 className="h-4 w-4" />,
      expanded: false,
      items: [
        {
          label: 'CMS',
          href: '/integrations',
          icon: <Plug2 className="h-4 w-4" />,
        },
      ]
    },
  ]
  
  const quickAccessItems: NavigationItem[] = [
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ]
  
  return (
    <>
      {/* Hamburger Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90 }}
              animate={{ rotate: 0 }}
              exit={{ rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
      
      {/* Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-gray-800 border-r border-gray-700 z-50 md:hidden overflow-y-auto"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Logo Section */}
            <div className="p-4 border-b border-gray-700 mt-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 transform rotate-45 rounded"></div>
                <div>
                  <h2 className="font-bold text-white">Catalyst Studio</h2>
                  <p className="text-xs text-gray-400">Build faster</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Sections */}
            <div className="p-4">
              <div className="space-y-2">
                {navigationSections.map((section) => (
                  <NavigationSection
                    key={section.id}
                    section={section}
                    isActive={pathname.startsWith(`/${section.id}`)}
                  />
                ))}
                
                {/* Quick Access Items */}
                <div className="pt-4 mt-4 border-t border-gray-700">
                  {quickAccessItems.map((item) => {
                    const isActive = pathname === item.href
                    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
                      return null
                    }
                    return (
                      <Link key={item.href} href={item.href}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start ${
                            isActive 
                              ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' 
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          }`}
                        >
                          {item.icon}
                          <span className="ml-3">{item.label}</span>
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
            
            {/* Footer Section */}
            <div className="p-4 border-t border-gray-700 mt-auto">
              <p className="text-xs text-gray-500 text-center">
                v1.0.0 • Story 1.5
              </p>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  )
}