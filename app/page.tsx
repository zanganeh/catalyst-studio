'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureFlagService, FeatureFlag } from '@/lib/features/feature-flags';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const flagService = FeatureFlagService.getInstance();
    const multiWebsiteEnabled = flagService.isEnabled(FeatureFlag.MULTI_WEBSITE_SUPPORT);
    const dashboardEnabled = flagService.isEnabled(FeatureFlag.DASHBOARD_VIEW);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Feature flags:', {
        multiWebsite: multiWebsiteEnabled,
        dashboard: dashboardEnabled,
        env: {
          NEXT_PUBLIC_MULTI_WEBSITE: process.env.NEXT_PUBLIC_MULTI_WEBSITE,
          NEXT_PUBLIC_DASHBOARD: process.env.NEXT_PUBLIC_DASHBOARD
        }
      });
    }
    
    if (multiWebsiteEnabled && dashboardEnabled) {
      // New multi-website experience
      router.push('/dashboard');
    } else {
      // Legacy single-website experience - redirect to default studio
      router.push('/studio/default');
    }
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Loading...</p>
    </div>
  );
}