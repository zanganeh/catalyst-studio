'use client';

import { useEffect } from 'react';
import { useMultipleFeatures } from '@/contexts/feature-flag-context-stub';

/**
 * Catalyst X Branding Component (REFACTORED)
 * Uses centralized FeatureFlagContext
 * Story 1.1b - Applies visual identity when feature flag is enabled
 * PERFORMANCE: Optimized DOM manipulation with cleanup
 */
export function CatalystBranding() {
  const { loading, features } = useMultipleFeatures([
    'catalystBranding',
    'glassMorphism',
    'animations'
  ]);

  useEffect(() => {
    if (loading) return;
    
    // Apply or remove classes based on feature states
    const classes = [];
    const stylesheets: { id: string; href: string; condition: boolean }[] = [];
    
    // Handle Catalyst branding
    if (features.catalystBranding) {
      classes.push('catalyst-branding', 'catalyst-dark');
      stylesheets.push({
        id: 'catalyst-theme',
        href: '/styles/catalyst-theme.css',
        condition: true
      });
    }
    
    // Handle Glass Morphism
    if (features.glassMorphism) {
      classes.push('glass-morphism');
      stylesheets.push({
        id: 'glass-morphism-styles',
        href: '/styles/glass-morphism.css',
        condition: true
      });
    }
    
    // Handle Animations
    if (features.animations) {
      classes.push('animations-enabled');
    }
    
    // Apply classes to body
    document.body.classList.add(...classes);
    
    // Load stylesheets if needed
    stylesheets.forEach(({ id, href, condition }) => {
      if (condition && !document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
    
    // Cleanup function
    return () => {
      document.body.classList.remove(
        'catalyst-branding',
        'catalyst-dark',
        'glass-morphism',
        'animations-enabled'
      );
    };
  }, [loading, features.catalystBranding, features.glassMorphism, features.animations]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Catalyst Logo Component (REFACTORED)
 * Displays the animated X logo
 */
export function CatalystLogo({ size = 60 }: { size?: number }) {
  const { loading, features } = useMultipleFeatures(['catalystBranding']);
  
  if (loading || !features.catalystBranding) {
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
 * Geometric Pattern Background (REFACTORED)
 * Adds the signature Catalyst X pattern
 */
export function CatalystPattern({ children }: { children: React.ReactNode }) {
  const { loading, features } = useMultipleFeatures(['catalystBranding']);
  
  if (loading || !features.catalystBranding) {
    return <>{children}</>;
  }

  return (
    <div className="catalyst-pattern relative">
      {children}
    </div>
  );
}