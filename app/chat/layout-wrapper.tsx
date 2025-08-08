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
        <div className="p-4">
          {/* Navigation content will go here */}
        </div>
      </NavigationPanel>
      <MainContentPanel>
        <div className="p-4">
          {/* Main content will go here */}
        </div>
      </MainContentPanel>
    </LayoutContainer>
  );
}