'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the integrations page
const IntegrationsPage = dynamic(() => import('../../../(dashboard)/integrations/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading integrations...</div>
    </div>
  )
});

export default function StudioIntegrationsPage() {
  const { website, websiteMetadata, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website integrations...</p>
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

  // Render the integrations page with website context available
  return <IntegrationsPage />;
}