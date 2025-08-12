'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { WebsiteMetadata } from '@/lib/storage/types';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Clock, Globe } from 'lucide-react';

interface RecentAppsProps {
  maxItems?: number;
  className?: string;
}

export function RecentApps({ maxItems = 12, className = '' }: RecentAppsProps) {
  const [websites, setWebsites] = useState<WebsiteMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();

  // Memoize the storage service instance
  const storageService = useMemo(() => new WebsiteStorageService(), []);

  const loadRecentWebsites = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sites = await storageService.listWebsites();
      
      // Sort by lastModified date (most recent first)
      const sortedSites = sites.sort((a, b) => {
        const dateA = new Date(a.lastModified || a.createdAt).getTime();
        const dateB = new Date(b.lastModified || b.createdAt).getTime();
        return dateB - dateA;
      });
      
      setWebsites(sortedSites);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recent apps';
      console.error('Failed to load recent apps:', error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [storageService]);

  // Subscribe to storage changes for real-time updates
  useEffect(() => {
    loadRecentWebsites();

    // Set up storage event listener for real-time updates
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith('website_')) {
        loadRecentWebsites();
      }
    };

    // Also listen for custom website events
    const handleWebsiteChange = () => {
      loadRecentWebsites();
    };

    // Event listeners for real-time updates
    const websiteEvents = ['website-created', 'website-deleted', 'website-updated'] as const;
    
    window.addEventListener('storage', handleStorageChange);
    websiteEvents.forEach(eventName => {
      window.addEventListener(eventName, handleWebsiteChange);
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      websiteEvents.forEach(eventName => {
        window.removeEventListener(eventName, handleWebsiteChange);
      });
    };
  }, [loadRecentWebsites]);

  const handleWebsiteClick = (websiteId: string) => {
    router.push(`/studio/${websiteId}`);
  };

  const displayedWebsites = showAll ? websites : websites.slice(0, maxItems);
  const hasMoreWebsites = websites.length > maxItems;

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Recent Apps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-secondary/50 rounded-lg p-4 h-32">
                <div className="h-4 bg-secondary rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-secondary rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Recent Apps
          </h2>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>Unable to load recent apps</p>
          <button
            onClick={loadRecentWebsites}
            className="mt-2 text-catalyst-orange hover:text-catalyst-orange-dark hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Recent Apps
          </h2>
        </div>
        <div className="text-center py-12 text-gray-400">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-600" />
          <p>No websites yet. Create your first one above!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
          <Clock className="w-6 h-6 text-catalyst-orange" />
          Recent Apps
        </h2>
        {hasMoreWebsites && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-catalyst-orange hover:text-catalyst-orange-dark flex items-center gap-1"
          >
            View All ({websites.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {showAll && (
          <button
            onClick={() => setShowAll(false)}
            className="text-catalyst-orange hover:text-catalyst-orange-dark"
          >
            Show Less
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedWebsites.map((website) => (
          <button
            key={website.id}
            onClick={() => handleWebsiteClick(website.id)}
            className="group relative bg-gray-900 hover:bg-gray-800 rounded-lg p-4 text-left transition-all hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-catalyst-orange border border-gray-700"
          >
            {/* Icon or Thumbnail */}
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                {website.icon ? (
                  <span className="text-2xl">{website.icon}</span>
                ) : (
                  <Globe className="w-5 h-5 text-catalyst-orange" />
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-catalyst-orange transition-colors" />
            </div>

            {/* Website Name */}
            <h3 className="font-semibold text-base mb-1 line-clamp-1 text-white">
              {website.name}
            </h3>

            {/* Description */}
            {website.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                {website.description}
              </p>
            )}

            {/* Last Modified */}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(website.lastModified || website.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}