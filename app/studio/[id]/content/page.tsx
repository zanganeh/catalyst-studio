'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the content page
const ContentPage = dynamic(() => import('../../../(dashboard)/content/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading content manager...</div>
    </div>
  )
});

export default function StudioContentPage() {
  const { website, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website content...</p>
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

  // Render the content page with website context available
  return (
    <div className="h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Content Management</h1>
        <p className="text-sm text-gray-400 mt-1">
          Website: {website?.name || 'Untitled Website'}
        </p>
      </div>
      <ContentPage />
    </div>
  );
}