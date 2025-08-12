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
    
    if (multiWebsiteEnabled && dashboardEnabled) {
      // New multi-website experience
      router.push('/dashboard');
    } else {
      // Legacy single-website experience
      router.push('/studio');
    }
  }, [router]);

  return null;
}