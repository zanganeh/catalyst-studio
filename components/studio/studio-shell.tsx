'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutContainer, ChatPanel, NavigationPanel, MainContentPanel } from '@/components/layout/layout-container';
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { IsolatedErrorBoundary } from '@/components/error-boundary';
import { StudioChatWrapper } from './studio-chat-wrapper';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'anticipate' as const,
  duration: 0.3
};

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <LayoutContainer>
        {/* Chat Panel - Always visible on left */}
        <ChatPanel>
          <StudioChatWrapper />
        </ChatPanel>
        
        {/* Navigation Panel - Always visible in middle */}
        <NavigationPanel>
          <NavigationSidebar />
        </NavigationPanel>
        
        {/* Main Content Panel - Right side, shows current view */}
        <MainContentPanel>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Breadcrumb */}
            <div className="px-6 py-3 border-b border-gray-700">
              <Breadcrumb />
            </div>
            
            {/* Animated Page Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
              >
                <IsolatedErrorBoundary componentName={`View-${pathname.split('/').pop()}`}>
                  {children}
                </IsolatedErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </MainContentPanel>
      </LayoutContainer>
    </>
  );
}