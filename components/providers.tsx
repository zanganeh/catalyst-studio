'use client'

import React from 'react'
import { ProjectContextProvider } from '@/lib/context/project-context'
import { NavigationProvider } from '@/lib/context/navigation-context'
import { PreviewProvider } from '@/lib/context/preview-context'
import { ContentTypeProvider } from '@/lib/context/content-type-context'
import { QueryProvider } from '@/lib/providers/query-provider'
import { ProviderContextProvider } from '@/lib/providers/context'

export function Providers({ children }: { children: React.ReactNode }) {
  // Get provider ID from environment or use 'auto' for automatic detection
  const providerId = process.env.NEXT_PUBLIC_CMS_PROVIDER || 'auto';
  
  return (
    <QueryProvider>
      <ProviderContextProvider providerId={providerId}>
        <ProjectContextProvider>
          <NavigationProvider>
            <PreviewProvider>
              {children}
            </PreviewProvider>
          </NavigationProvider>
        </ProjectContextProvider>
      </ProviderContextProvider>
    </QueryProvider>
  )
}