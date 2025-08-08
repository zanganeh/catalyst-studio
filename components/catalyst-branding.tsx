'use client';

import { useEffect } from 'react';
import { isFeatureEnabled } from '@/config/features';

/**
 * Catalyst X Branding Component
 * Story 1.1b - Applies visual identity when feature flag is enabled
 */
export function CatalystBranding() {
  useEffect(() => {
    if (isFeatureEnabled('catalystBranding')) {
      // Add branding classes to body
      document.body.classList.add('catalyst-branding', 'catalyst-dark');
      
      // Add theme CSS if not already loaded
      if (!document.getElementById('catalyst-theme')) {
        const link = document.createElement('link');
        link.id = 'catalyst-theme';
        link.rel = 'stylesheet';
        link.href = '/styles/catalyst-theme.css';
        document.head.appendChild(link);
      }
      
      return () => {
        // Cleanup on unmount or when feature is disabled
        document.body.classList.remove('catalyst-branding', 'catalyst-dark');
      };
    }
  }, []);

  // This component doesn't render anything visible
  return null;
}

/**
 * Catalyst Logo Component
 * Displays the animated X logo
 */
export function CatalystLogo({ size = 60 }: { size?: number }) {
  if (!isFeatureEnabled('catalystBranding')) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-4">
      <div 
        className="catalyst-logo bg-white flex items-center justify-center font-bold text-catalyst-orange transform rotate-45 rounded-lg shadow-lg"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.53,
        }}
      >
        <span className="transform -rotate-45">X</span>
      </div>
      <div className="text-white">
        <h1 className="text-2xl font-bold">Catalyst Studio</h1>
        <p className="text-sm opacity-80">AI-Powered Website Builder</p>
      </div>
    </div>
  );
}

/**
 * Geometric Pattern Background
 * Adds the signature Catalyst X pattern
 */
export function CatalystPattern({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled('catalystBranding')) {
    return <>{children}</>;
  }

  return (
    <div className="catalyst-pattern relative">
      {children}
    </div>
  );
}