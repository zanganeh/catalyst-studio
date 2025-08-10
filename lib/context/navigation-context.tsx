'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NavigationState, NavigationContextValue, ViewType } from '@/lib/navigation/types'
import { useProject } from '@/lib/context/project-context'

const NAVIGATION_STORAGE_KEY = 'catalyst-navigation-state'

const defaultNavigationState: NavigationState = {
  expandedSections: [],
  activeView: ViewType.Overview,
  searchQuery: '',
  lastVisited: {
    [ViewType.Overview]: '/overview',
    [ViewType.Content]: '/content',
    [ViewType.Analytics]: '/analytics',
    [ViewType.Development]: '/development',
    [ViewType.Integrations]: '/integrations'
  }
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  useProject() // Just to ensure the context is available
  
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(NAVIGATION_STORAGE_KEY)
      if (stored) {
        try {
          return { ...defaultNavigationState, ...JSON.parse(stored) }
        } catch {
          return defaultNavigationState
        }
      }
    }
    return defaultNavigationState
  })

  // Detect active view from pathname
  useEffect(() => {
    const pathSegments = pathname.split('/')
    const viewSegment = pathSegments[1] || 'overview'
    
    const newView = Object.values(ViewType).includes(viewSegment as ViewType) 
      ? (viewSegment as ViewType) 
      : ViewType.Overview
    
    if (newView !== navigationState.activeView) {
      setNavigationState(prev => ({
        ...prev,
        activeView: newView,
        lastVisited: {
          ...prev.lastVisited,
          [newView]: pathname
        }
      }))
    }
  }, [pathname, navigationState.activeView])

  // Persist state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NAVIGATION_STORAGE_KEY, JSON.stringify(navigationState))
    }
  }, [navigationState])

  const toggleSection = useCallback((sectionId: string) => {
    setNavigationState(prev => {
      const isExpanded = prev.expandedSections.includes(sectionId)
      return {
        ...prev,
        expandedSections: isExpanded
          ? prev.expandedSections.filter(id => id !== sectionId)
          : [...prev.expandedSections, sectionId]
      }
    })
  }, [])

  const setActiveView = useCallback((view: ViewType) => {
    setNavigationState(prev => ({ ...prev, activeView: view }))
    const targetPath = navigationState.lastVisited[view] || `/${view}`
    router.push(targetPath)
  }, [router, navigationState.lastVisited])

  const setSearchQuery = useCallback((query: string) => {
    setNavigationState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  const updateLastVisited = useCallback((view: ViewType, path: string) => {
    setNavigationState(prev => ({
      ...prev,
      lastVisited: {
        ...prev.lastVisited,
        [view]: path
      }
    }))
  }, [])

  const resetNavigation = useCallback(() => {
    setNavigationState(defaultNavigationState)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NAVIGATION_STORAGE_KEY)
    }
  }, [])

  const value: NavigationContextValue = {
    navigationState,
    toggleSection,
    setActiveView,
    setSearchQuery,
    updateLastVisited,
    resetNavigation
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
}