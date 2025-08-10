'use client';

import React, { useMemo } from 'react';
import type { ContentItem, ContentType } from '@/lib/content-types/types';
import { ContentCard } from './content-card';

interface VirtualContentListProps {
  items: ContentItem[];
  contentTypes: ContentType[];
  onEditContent: (item: ContentItem) => void;
  onDeleteContent: (id: string) => void;
  onDuplicateContent: (item: ContentItem) => void;
  itemHeight?: number;
  containerHeight?: number;
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
}: VirtualContentListProps) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
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
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
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
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => {
          const contentType = contentTypes.find(ct => ct.id === item.contentTypeId);
          if (!contentType) return null;
          
          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: `${index * itemHeight}px`,
                height: `${itemHeight}px`,
                width: '100%',
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