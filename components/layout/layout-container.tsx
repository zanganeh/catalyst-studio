'use client';

import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/config/features';
import { AnimatedPanel, FloatingShape } from '@/components/glass-morphism';

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
  const [mounted, setMounted] = useState(false);
  const [isLayoutEnabled, setIsLayoutEnabled] = useState(false);
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLayoutEnabled(isFeatureEnabled('threeColumnLayout'));
    setIsBrandingEnabled(isFeatureEnabled('catalystBranding'));
  }, []);

  // Feature disabled or not mounted: return children as-is (preserve existing layout)
  if (!mounted || !isLayoutEnabled) {
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
  const [mounted, setMounted] = useState(false);
  const [isLayoutEnabled, setIsLayoutEnabled] = useState(false);
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(false);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLayoutEnabled(isFeatureEnabled('threeColumnLayout'));
    setIsBrandingEnabled(isFeatureEnabled('catalystBranding'));
    setIsGlassEnabled(isFeatureEnabled('glassMorphism'));
  }, []);
  
  if (!mounted || !isLayoutEnabled) {
    return <>{children}</>;
  }

  return (
    <AnimatedPanel direction="left" delay={0.1}>
      <div className={`border-r overflow-hidden h-full relative ${
        isBrandingEnabled ? 'border-gray-700' : 'border-gray-200'
      } ${
        isGlassEnabled && isBrandingEnabled ? 'backdrop-blur-md bg-gray-900/70' :
        isBrandingEnabled ? 'bg-gray-900' : ''
      }`}>
        {children}
      </div>
    </AnimatedPanel>
  );
}

export function NavigationPanel({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isLayoutEnabled, setIsLayoutEnabled] = useState(false);
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(false);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLayoutEnabled(isFeatureEnabled('threeColumnLayout'));
    setIsBrandingEnabled(isFeatureEnabled('catalystBranding'));
    setIsGlassEnabled(isFeatureEnabled('glassMorphism'));
  }, []);
  
  if (!mounted || !isLayoutEnabled) {
    return null; // Don't render navigation if layout not enabled
  }

  const panelContent = (
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
  );

  return (
    <AnimatedPanel direction="left" delay={0.2}>
      <div className={`border-r overflow-y-auto h-full relative ${
        isBrandingEnabled ? 'border-gray-700' : 'border-gray-200'
      } ${
        isGlassEnabled && isBrandingEnabled ? 'backdrop-blur-md bg-gray-800/50' : 
        isBrandingEnabled ? 'bg-gray-800' : ''
      }`}>
        {isGlassEnabled && <FloatingShape size={80} color="blue" position={{ top: '20%', left: '10%' }} delay={1} />}
        {children || panelContent}
      </div>
    </AnimatedPanel>
  );
}

export function MainContentPanel({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isLayoutEnabled, setIsLayoutEnabled] = useState(false);
  const [isBrandingEnabled, setIsBrandingEnabled] = useState(false);
  const [isGlassEnabled, setIsGlassEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLayoutEnabled(isFeatureEnabled('threeColumnLayout'));
    setIsBrandingEnabled(isFeatureEnabled('catalystBranding'));
    setIsGlassEnabled(isFeatureEnabled('glassMorphism'));
  }, []);
  
  if (!mounted || !isLayoutEnabled) {
    return null; // Don't render main content if layout not enabled
  }

  return (
    <AnimatedPanel direction="right" delay={0.3}>
      <div className={`overflow-y-auto h-full relative ${
        isGlassEnabled && isBrandingEnabled ? 'backdrop-blur-sm bg-gray-950/80' :
        isBrandingEnabled ? 'bg-gray-950' : ''
      }`}>
        {isGlassEnabled && (
          <>
            <FloatingShape size={120} color="orange" position={{ top: '10%', right: '15%' }} delay={0} />
            <FloatingShape size={90} color="green" position={{ bottom: '20%', left: '20%' }} delay={2} />
          </>
        )}
        {children || (
          <div className={`p-4 ${
            isBrandingEnabled ? 'text-gray-400' : 'text-gray-400'
          }`}>
            {/* Empty shell for main content - Story 1.1a */}
            <p>Main Content (Coming Soon)</p>
          </div>
        )}
      </div>
    </AnimatedPanel>
  );
}