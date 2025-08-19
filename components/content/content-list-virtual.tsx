'use client';

import React, { useMemo, useCallback, useTransition, startTransition } from 'react';
import type { ContentItem, ContentType } from '@/lib/content-types/types';
import { ContentCard } from './content-card';
import { Skeleton } from '@/components/ui/skeleton';

interface VirtualContentListProps {
  items: ContentItem[];
  contentTypes: ContentType[];
  onEditContent: (item: ContentItem) => void;
  onDeleteContent: (id: string) => void;
  onDuplicateContent: (item: ContentItem) => void;
  itemHeight?: number;
  containerHeight?: number;
  isLoading?: boolean;
}

/**
 * Virtual scrolling component for large content lists
 * Renders only visible items for better performance
 */
export function VirtualContentList({
  items,
  contentTypes,
  onEditContent,
  onDeleteContent,
  onDuplicateContent,
  itemHeight = 200,
  containerHeight = 600,
  isLoading = false,
}: VirtualContentListProps) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Calculate visible items
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);
  
  const totalHeight = items.length * itemHeight;
  
  // Handle scroll with debouncing and loading state
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    
    // Update scroll position immediately
    startTransition(() => {
      setScrollTop(newScrollTop);
    });
    
    // Set scrolling state
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset scrolling state after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);
  
  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="p-4 bg-gray-800/50 rounded-lg">
          <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700" />
          <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
          <Skeleton className="h-4 w-2/3 bg-gray-700" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-16 bg-gray-700" />
            <Skeleton className="h-8 w-16 bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  );
  
  // Show loading skeleton during initial load
  if (isLoading && items.length === 0) {
    return <LoadingSkeleton />;
  }
  
  // Use regular rendering for small lists
  if (items.length < 50) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const contentType = contentTypes.find(ct => ct.id === item.contentTypeId);
          if (!contentType) return null;
          
          return (
            <ContentCard
              key={item.id}
              item={item}
              contentType={contentType}
              onEdit={() => onEditContent(item)}
              onDelete={() => onDeleteContent(item.id)}
              onDuplicate={() => onDuplicateContent(item)}
            />
          );
        })}
      </div>
    );
  }
  
  // Virtual scrolling for large lists
  return (
    <div 
      className="relative overflow-auto"
      style={{ height: `${containerHeight}px` }}
      onScroll={handleScroll}
      aria-busy={isScrolling || isPending}
      aria-label="Virtual scrolling content list"
    >
      {/* Scroll indicator */}
      {isScrolling && (
        <div className="absolute top-2 right-2 z-10 bg-gray-800/90 px-3 py-1 rounded-full">
          <span className="text-xs text-gray-400">Scrolling...</span>
        </div>
      )}
      
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => {
          const contentType = contentTypes.find(ct => ct.id === item.contentTypeId);
          
          // Show skeleton while scrolling fast or during transitions
          const showSkeleton = (isScrolling || isPending) && !contentType;
          
          if (showSkeleton) {
            return (
              <div
                key={`skeleton-${index}`}
                style={{
                  position: 'absolute',
                  top: `${index * itemHeight}px`,
                  height: `${itemHeight}px`,
                  width: '100%',
                  padding: '1rem',
                }}
              >
                <div className="p-4 bg-gray-800/50 rounded-lg h-full">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-gray-700" />
                  <Skeleton className="h-4 w-full mb-2 bg-gray-700" />
                  <Skeleton className="h-4 w-2/3 bg-gray-700" />
                </div>
              </div>
            );
          }
          
          if (!contentType) return null;
          
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: `${index * itemHeight}px`,
                height: `${itemHeight}px`,
                width: '100%',
                opacity: isScrolling ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <ContentCard
                item={item}
                contentType={contentType}
                onEdit={() => onEditContent(item)}
                onDelete={() => onDeleteContent(item.id)}
                onDuplicate={() => onDuplicateContent(item)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}