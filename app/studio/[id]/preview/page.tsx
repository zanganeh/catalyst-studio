'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the preview page
const PreviewPage = dynamic(() => import('../../../preview/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading preview...</div>
    </div>
  )
});

export default function StudioPreviewPage() {
  const { website, websiteMetadata, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website preview...</p>
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

  // Render the preview page with website context available
  return (
    <div className="h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Website Preview</h1>
        <p className="text-sm text-gray-400 mt-1">
          {websiteMetadata?.name || 'Untitled Website'}
        </p>
      </div>
      <PreviewPage />
    </div>
  );
}