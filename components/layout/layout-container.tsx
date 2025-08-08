'use client';

import React from 'react';
import { isFeatureEnabled } from '@/config/features';

interface LayoutContainerProps {
  children: React.ReactNode;
}

/**
 * LayoutContainer - Three-column layout wrapper
 * Story 1.1a: Basic structure
 * Story 1.1b: Catalyst X branding
 * Protected by feature flags: threeColumnLayout, catalystBranding
 */
export function LayoutContainer({ children }: LayoutContainerProps) {
  const isLayoutEnabled = isFeatureEnabled('threeColumnLayout');
  const isBrandingEnabled = isFeatureEnabled('catalystBranding');

  // Feature disabled: return children as-is (preserve existing layout)
  if (!isLayoutEnabled) {
    return <>{children}</>;
  }

  // Feature enabled: wrap in three-column grid
  // 360px (chat) + 260px (nav) + flex (main)
  return (
    <div className={`grid grid-cols-[360px_260px_1fr] h-screen ${
      isBrandingEnabled ? 'bg-gray-900' : ''
    }`}>
      {children}
    </div>
  );
}

/**
 * Individual panel components for the three-column layout
 */
export function ChatPanel({ children }: { children: React.ReactNode }) {
  const isLayoutEnabled = isFeatureEnabled('threeColumnLayout');
  const isBrandingEnabled = isFeatureEnabled('catalystBranding');
  
  if (!isLayoutEnabled) {
    return <>{children}</>;
  }

  return (
    <div className={`border-r overflow-hidden ${
      isBrandingEnabled ? 'border-gray-700 bg-gray-900' : 'border-gray-200'
    }`}>
      {children}
    </div>
  );
}

export function NavigationPanel({ children }: { children: React.ReactNode }) {
  const isLayoutEnabled = isFeatureEnabled('threeColumnLayout');
  const isBrandingEnabled = isFeatureEnabled('catalystBranding');
  
  if (!isLayoutEnabled) {
    return null; // Don't render navigation if layout not enabled
  }

  return (
    <div className={`border-r overflow-y-auto ${
      isBrandingEnabled ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
    }`}>
      {children || (
        <div className={`p-4 ${
          isBrandingEnabled ? 'text-gray-400' : 'text-gray-400'
        }`}>
          {/* Empty shell for navigation - Story 1.1a */}
          {isBrandingEnabled && (
            <div className="mb-4">
              <div className="w-10 h-10 bg-orange-500 transform rotate-45 rounded mb-4"></div>
            </div>
          )}
          <p>Navigation (Coming Soon)</p>
        </div>
      )}
    </div>
  );
}

export function MainContentPanel({ children }: { children: React.ReactNode }) {
  const isLayoutEnabled = isFeatureEnabled('threeColumnLayout');
  const isBrandingEnabled = isFeatureEnabled('catalystBranding');
  
  if (!isLayoutEnabled) {
    return null; // Don't render main content if layout not enabled
  }

  return (
    <div className={`overflow-y-auto ${
      isBrandingEnabled ? 'bg-gray-950' : ''
    }`}>
      {children || (
        <div className={`p-4 ${
          isBrandingEnabled ? 'text-gray-400' : 'text-gray-400'
        }`}>
          {/* Empty shell for main content - Story 1.1a */}
          <p>Main Content (Coming Soon)</p>
        </div>
      )}
    </div>
  );
}