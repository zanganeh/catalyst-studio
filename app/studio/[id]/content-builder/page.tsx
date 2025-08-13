'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the content-builder page
const ContentBuilderPage = dynamic(() => import('../../../content-builder/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading content builder...</div>
    </div>
  )
});

export default function StudioContentBuilderPage() {
  const { website, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading content builder...</p>
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

  // Render the content builder page with website context available
  return <ContentBuilderPage />;
}