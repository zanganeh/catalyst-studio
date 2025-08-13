'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the analytics page
const AnalyticsPage = dynamic(() => import('../../../(dashboard)/analytics/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading analytics...</div>
    </div>
  )
});

export default function StudioAnalyticsPage() {
  const { website, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Error Loading Website</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Render the analytics page with website context available
  return <AnalyticsPage />;
}