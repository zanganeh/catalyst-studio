'use client'

import React, { useEffect } from 'react'
import { ProjectContextProvider } from '@/lib/context/project-context'
import { NavigationProvider } from '@/lib/context/navigation-context'
import { PreviewProvider } from '@/lib/context/preview-context'
import { ContentTypeProvider } from '@/lib/context/content-type-context'
import { initializeFeatureFlagCleanup } from '@/lib/utils/feature-flag-cleanup'

export function Providers({ children }: { children: React.ReactNode }) {
  // One-time cleanup of legacy feature flag data
  useEffect(() => {
    initializeFeatureFlagCleanup()
  }, [])
  return (
    <ProjectContextProvider>
      <NavigationProvider>
        <ContentTypeProvider>
          <PreviewProvider>
            {children}
          </PreviewProvider>
        </ContentTypeProvider>
      </NavigationProvider>
    </ProjectContextProvider>
  )
}