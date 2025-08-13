'use client';

import { WebsiteCard } from './website-card';
import { EmptyState } from './empty-state';
import { GridSkeleton } from './grid-skeleton';
import { useWebsites } from '@/lib/api/hooks/use-websites';

export function WebsiteGrid() {
  const { data: websites = [], isLoading, error, refetch } = useWebsites();

  if (isLoading) {
    return <GridSkeleton />;
  }

  // Display error state if loading failed
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load websites';
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-destructive mb-4">
          <svg 
            className="w-16 h-16 mx-auto"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Failed to load websites</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (websites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {websites.map((website) => (
        <WebsiteCard key={website.id} website={website} />
      ))}
    </div>
  );
}