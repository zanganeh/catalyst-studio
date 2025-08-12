'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the development page
const DevelopmentPage = dynamic(() => import('../../../(dashboard)/development/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading development tools...</div>
    </div>
  )
});

export default function StudioDevelopmentPage() {
  const { website, websiteMetadata, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website development...</p>
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

  // Render the development page with website context available
  return <DevelopmentPage />;
}