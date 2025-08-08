'use client';

import React from 'react';
import { isFeatureEnabled } from '@/config/features';

interface LayoutContainerProps {
  children: React.ReactNode;
}

/**
 * LayoutContainer - Three-column layout wrapper
 * Story 1.1a: Basic structure without styling
 * Protected by feature flag: threeColumnLayout
 */
export function LayoutContainer({ children }: LayoutContainerProps) {
  const isEnabled = isFeatureEnabled('threeColumnLayout');

  // Feature disabled: return children as-is (preserve existing layout)
  if (!isEnabled) {
    return <>{children}</>;
  }

  // Feature enabled: wrap in three-column grid
  // 360px (chat) + 260px (nav) + flex (main)
  return (
    <div className="grid grid-cols-[360px_260px_1fr] h-screen">
      {children}
    </div>
  );
}

/**
 * Individual panel components for the three-column layout
 */
export function ChatPanel({ children }: { children: React.ReactNode }) {
  const isEnabled = isFeatureEnabled('threeColumnLayout');
  
  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div className="border-r border-gray-200 overflow-hidden">
      {children}
    </div>
  );
}

export function NavigationPanel({ children }: { children: React.ReactNode }) {
  const isEnabled = isFeatureEnabled('threeColumnLayout');
  
  if (!isEnabled) {
    return null; // Don't render navigation if layout not enabled
  }

  return (
    <div className="border-r border-gray-200 overflow-y-auto">
      {children || (
        <div className="p-4 text-gray-400">
          {/* Empty shell for navigation - Story 1.1a */}
          <p>Navigation (Coming Soon)</p>
        </div>
      )}
    </div>
  );
}

export function MainContentPanel({ children }: { children: React.ReactNode }) {
  const isEnabled = isFeatureEnabled('threeColumnLayout');
  
  if (!isEnabled) {
    return null; // Don't render main content if layout not enabled
  }

  return (
    <div className="overflow-y-auto">
      {children || (
        <div className="p-4 text-gray-400">
          {/* Empty shell for main content - Story 1.1a */}
          <p>Main Content (Coming Soon)</p>
        </div>
      )}
    </div>
  );
}