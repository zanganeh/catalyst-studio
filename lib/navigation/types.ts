import { ReactNode } from 'react'

export enum ViewType {
  Overview = 'overview',
  Content = 'content',
  Analytics = 'analytics',
  Development = 'development',
  Integrations = 'integrations'
}

export interface NavigationItem {
  label: string
  href: string
  icon?: ReactNode
  badge?: string | number
  children?: NavigationItem[]
  tooltip?: string
}

export interface NavigationSection {
  id: string
  label: string
  icon: ReactNode
  expanded: boolean
  items: NavigationItem[]
}

export interface NavigationState {
  expandedSections: string[]
  activeView: ViewType
  searchQuery: string
  lastVisited: Record<ViewType, string>
}

export interface NavigationContextValue {
  navigationState: NavigationState
  toggleSection: (sectionId: string) => void
  setActiveView: (view: ViewType) => void
  setSearchQuery: (query: string) => void
  updateLastVisited: (view: ViewType, path: string) => void
  resetNavigation: () => void
}