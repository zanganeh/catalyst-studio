'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the overview page
const OverviewPage = dynamic(() => import('../../(dashboard)/overview/page'), {
  loading: () => (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  )
});

export default function StudioPage() {
  const { website, isLoading, error } = useWebsiteContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if website doesn't exist
    if (error && (error.message.includes('not found') || error.message.includes('Referenced record not found'))) {
      console.error('Website not found, redirecting to dashboard:', error.message);
      router.push('/dashboard');
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the overview page with website context available
  return (
    <>
      {website && (
        <div data-testid="website-name" className="sr-only">
          {website.name}
        </div>
      )}
      <OverviewPage />
    </>
  );
}