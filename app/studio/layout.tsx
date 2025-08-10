'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutContainer, ChatPanel, NavigationPanel, MainContentPanel } from '@/components/layout/layout-container';
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';
import { MobileNavigation } from '@/components/navigation/mobile-navigation';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { IsolatedErrorBoundary } from '@/components/error-boundary';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// View components - dynamically imported
const ViewComponents = {
  '/studio': dynamic(() => import('../(dashboard)/overview/page')),
  '/studio/overview': dynamic(() => import('../(dashboard)/overview/page')),
  '/studio/content': dynamic(() => import('../(dashboard)/content/page')),
  '/studio/content-builder': dynamic(() => import('../content-builder/page')),
  '/studio/development': dynamic(() => import('../(dashboard)/development/page')),
  '/studio/integrations': dynamic(() => import('../(dashboard)/integrations/page')),
  '/studio/analytics': dynamic(() => import('../(dashboard)/analytics/page')),
  '/studio/preview': dynamic(() => import('../preview/page')),
  '/studio/settings': dynamic(() => import('../settings/page')),
};

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

export default function StudioLayout() {
  const pathname = usePathname();
  const [chatContent, setChatContent] = useState<React.ReactNode>(null);
  
  // Get the current view component
  const ViewComponent = ViewComponents[pathname as keyof typeof ViewComponents] || (() => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
      <p className="text-gray-400">The page {pathname} does not exist.</p>
    </div>
  ));

  // Load chat component once and preserve it
  useEffect(() => {
    if (!chatContent) {
      import('../chat/page').then((module) => {
        const ChatPage = module.default;
        setChatContent(<ChatPage />);
      });
    }
  }, [chatContent]);

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNavigation />
      
      <LayoutContainer>
        {/* Chat Panel - Always visible on left */}
        <ChatPanel>
          {chatContent || (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <p className="text-sm">Loading chat...</p>
              </div>
            </div>
          )}
        </ChatPanel>
        
        {/* Navigation Panel - Always visible in middle */}
        <NavigationPanel>
          <NavigationSidebar />
        </NavigationPanel>
        
        {/* Main Content Panel - Right side, shows current view */}
        <MainContentPanel>
          <div className="flex flex-col h-full">
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
                className="flex-1 overflow-y-auto"
              >
                <IsolatedErrorBoundary componentName={`View-${pathname.split('/').pop()}`}>
                  <ViewComponent />
                </IsolatedErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </MainContentPanel>
      </LayoutContainer>
    </>
  );
}