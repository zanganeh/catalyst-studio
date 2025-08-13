'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';

// Dynamically import the deployment page
const DeploymentPage = dynamic(() => import('../../deployment/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading deployment interface...</div>
    </div>
  )
});

export default function StudioDeploymentPage() {
  const { website, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website deployment...</p>
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

  // Render the deployment page with website context available
  return <DeploymentPage />;
}