'use client';

import React from 'react';
import { LayoutContainer, ChatPanel, NavigationPanel, MainContentPanel } from '@/components/layout/layout-container';
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';

/**
 * Layout wrapper for the chat page
 * Applies three-column layout
 * Preserves existing chat functionality completely
 */
export function ChatLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <LayoutContainer>
        <ChatPanel>
          {/* Existing chat goes here unchanged */}
          {children}
        </ChatPanel>
        
        <NavigationPanel>
          <NavigationSidebar />
        </NavigationPanel>
        <MainContentPanel>
          <div className="p-4">
            {/* Main content will go here */}
          </div>
        </MainContentPanel>
      </LayoutContainer>
    </>
  );
}