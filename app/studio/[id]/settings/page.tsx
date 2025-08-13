'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the settings page
const SettingsPage = dynamic(() => import('../../../settings/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading settings...</div>
    </div>
  )
});

export default function StudioSettingsPage() {
  const { website, isLoading, error, updateWebsite } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website settings...</p>
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

  // Render the settings page with website context available
  return (
    <div className="h-full">
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h1 className="text-xl font-bold text-white">Website Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Configure settings for: {website?.name || 'Untitled Website'}
        </p>
      </div>
      <SettingsPage />
    </div>
  );
}