'use client'

import React from 'react'
import { ProjectContextProvider } from '@/lib/context/project-context'
import { NavigationProvider } from '@/lib/context/navigation-context'
import { PreviewProvider } from '@/lib/context/preview-context'
import { ContentTypeProvider } from '@/lib/context/content-type-context'
import { WebsiteContextProvider } from '@/lib/context/website-context'
import { QueryProvider } from '@/lib/providers/query-provider'
import { ProviderContextProvider } from '@/lib/providers/context'
import { DEFAULT_WEBSITE_ID } from '@/lib/config/constants'

export function Providers({ children }: { children: React.ReactNode }) {
  // Get provider ID from environment or use 'auto' for automatic detection
  const providerId = process.env.NEXT_PUBLIC_CMS_PROVIDER || 'auto';
  
  return (
    <QueryProvider>
      <ProviderContextProvider providerId={providerId}>
        <ProjectContextProvider>
          <WebsiteContextProvider websiteId={DEFAULT_WEBSITE_ID}>
            <NavigationProvider>
              <ContentTypeProvider>
                <PreviewProvider>
                  {children}
                </PreviewProvider>
              </ContentTypeProvider>
            </NavigationProvider>
          </WebsiteContextProvider>
        </ProjectContextProvider>
      </ProviderContextProvider>
    </QueryProvider>
  )
}