'use client'

import React from 'react'
import { FeatureFlagProvider } from '@/contexts/feature-flag-context'
import { ProjectContextProvider } from '@/lib/context/project-context'
import { NavigationProvider } from '@/lib/context/navigation-context'
import { PreviewProvider } from '@/lib/context/preview-context'
import { ContentTypeProvider } from '@/lib/context/content-type-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      <ProjectContextProvider>
        <NavigationProvider>
          <ContentTypeProvider>
            <PreviewProvider>
              {children}
            </PreviewProvider>
          </ContentTypeProvider>
        </NavigationProvider>
      </ProjectContextProvider>
    </FeatureFlagProvider>
  )
}