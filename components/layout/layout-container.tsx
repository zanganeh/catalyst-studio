'use client';

import React from 'react';
import { useMultipleFeatures } from '@/contexts/feature-flag-context';
import { AnimatedPanel, FloatingShape } from '@/components/glass-morphism';

interface LayoutContainerProps {
  children: React.ReactNode;
}

/**
 * LayoutContainer - Three-column layout wrapper (REFACTORED)
 * Uses centralized FeatureFlagContext to eliminate duplication
 * Story 1.1a: Basic structure
 * Story 1.1b: Catalyst X branding  
 * Protected by feature flags: threeColumnLayout, catalystBranding
 */
export function LayoutContainer({ children }: LayoutContainerProps) {
  const { loading, features } = useMultipleFeatures(['threeColumnLayout', 'catalystBranding']);

  // Feature disabled or loading: return children as-is (preserve existing layout)
  if (loading || !features.threeColumnLayout) {
    return <>{children}</>;
  }

  // Feature enabled: wrap in three-column grid
  // 360px (chat) + 260px (nav) + flex (main)
  return (
    <div className={`grid grid-cols-[360px_260px_1fr] h-screen ${
      features.catalystBranding ? 'bg-gray-900' : ''
    }`}>
      {children}
    </div>
  );
}

/**
 * ChatPanel - Refactored to use context
 */
export function ChatPanel({ children }: { children: React.ReactNode }) {
  const { loading, features } = useMultipleFeatures([
    'threeColumnLayout',
    'catalystBranding',
    'glassMorphism'
  ]);
  
  if (loading || !features.threeColumnLayout) {
    return <>{children}</>;
  }

  return (
    <AnimatedPanel direction="left" delay={0.1}>
      <div className={`border-r overflow-hidden h-full relative ${
        features.catalystBranding ? 'border-gray-700' : 'border-gray-200'
      } ${
        features.glassMorphism && features.catalystBranding ? 'backdrop-blur-md bg-gray-900/70' :
        features.catalystBranding ? 'bg-gray-900' : ''
      }`}>
        {children}
      </div>
    </AnimatedPanel>
  );
}

/**
 * NavigationPanel - Refactored to use context
 */
export function NavigationPanel({ children }: { children: React.ReactNode }) {
  const { loading, features } = useMultipleFeatures([
    'threeColumnLayout',
    'catalystBranding',
    'glassMorphism'
  ]);
  
  if (loading || !features.threeColumnLayout) {
    return null; // Don't render navigation if layout not enabled
  }

  const panelContent = (
    <div className={`p-4 ${
      features.catalystBranding ? 'text-gray-400' : 'text-gray-400'
    }`}>
      {/* Empty shell for navigation - Story 1.1a */}
      {features.catalystBranding && (
        <div className="mb-4">
          <div className="w-10 h-10 bg-orange-500 transform rotate-45 rounded mb-4"></div>
        </div>
      )}
      <p>Navigation (Coming Soon)</p>
    </div>
  );

  return (
    <AnimatedPanel direction="left" delay={0.2}>
      <div className={`border-r overflow-y-auto h-full relative ${
        features.catalystBranding ? 'border-gray-700' : 'border-gray-200'
      } ${
        features.glassMorphism && features.catalystBranding ? 'backdrop-blur-md bg-gray-800/50' : 
        features.catalystBranding ? 'bg-gray-800' : ''
      }`}>
        {features.glassMorphism && <FloatingShape size={80} color="blue" position={{ top: '20%', left: '10%' }} delay={1} />}
        {children || panelContent}
      </div>
    </AnimatedPanel>
  );
}

/**
 * MainContentPanel - Refactored to use context
 */
export function MainContentPanel({ children }: { children: React.ReactNode }) {
  const { loading, features } = useMultipleFeatures([
    'threeColumnLayout',
    'catalystBranding',
    'glassMorphism'
  ]);
  
  if (loading || !features.threeColumnLayout) {
    return null; // Don't render main content if layout not enabled
  }

  return (
    <AnimatedPanel direction="right" delay={0.3}>
      <div className={`overflow-y-auto h-full relative ${
        features.glassMorphism && features.catalystBranding ? 'backdrop-blur-sm bg-gray-950/80' :
        features.catalystBranding ? 'bg-gray-950' : ''
      }`}>
        {features.glassMorphism && (
          <>
            <FloatingShape size={120} color="orange" position={{ top: '10%', right: '15%' }} delay={0} />
            <FloatingShape size={90} color="green" position={{ bottom: '20%', left: '20%' }} delay={2} />
          </>
        )}
        {children || (
          <div className={`p-4 ${
            features.catalystBranding ? 'text-gray-400' : 'text-gray-400'
          }`}>
            {/* Empty shell for main content - Story 1.1a */}
            <p>Main Content (Coming Soon)</p>
          </div>
        )}
      </div>
    </AnimatedPanel>
  );
}