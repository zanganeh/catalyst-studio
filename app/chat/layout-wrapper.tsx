'use client';

import React from 'react';
import { LayoutContainer, ChatPanel, NavigationPanel, MainContentPanel } from '@/components/layout/layout-container';

/**
 * Layout wrapper for the chat page
 * Applies three-column layout when feature flag is enabled
 * Preserves existing chat functionality completely
 */
export function ChatLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <LayoutContainer>
      <ChatPanel>
        {/* Existing chat goes here unchanged */}
        {children}
      </ChatPanel>
      
      <NavigationPanel>
        {/* Empty shell for now - Story 1.1a */}
      </NavigationPanel>
      
      <MainContentPanel>
        {/* Empty shell for now - Story 1.1a */}
      </MainContentPanel>
    </LayoutContainer>
  );
}