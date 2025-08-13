'use client'

import React from 'react'
import { ProjectContextProvider } from '@/lib/context/project-context'
import { NavigationProvider } from '@/lib/context/navigation-context'
import { PreviewProvider } from '@/lib/context/preview-context'
import { ContentTypeProvider } from '@/lib/context/content-type-context'
import { QueryProvider } from '@/lib/providers/query-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ProjectContextProvider>
        <NavigationProvider>
          <ContentTypeProvider>
            <PreviewProvider>
              {children}
            </PreviewProvider>
          </ContentTypeProvider>
        </NavigationProvider>
      </ProjectContextProvider>
    </QueryProvider>
  )
}