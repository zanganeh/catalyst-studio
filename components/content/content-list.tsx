'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentType, ContentItem } from '@/lib/content-types/types';
import { ContentCard } from './content-card';

interface ContentListProps {
  contentItems: ContentItem[];
  contentTypes: ContentType[];
  onNewContent: (contentTypeId?: string) => void;
  onEditContent: (item: ContentItem) => void;
  onDeleteContent: (id: string) => void;
  onDuplicateContent: (item: ContentItem) => void;
}

export function ContentList({
  contentItems,
  contentTypes,
  onNewContent,
  onEditContent,
  onDeleteContent,
  onDuplicateContent,
}: ContentListProps) {
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('all');
  
  // Filter content items by selected content type
  const filteredItems = useMemo(() => {
    if (!selectedContentTypeId || selectedContentTypeId === 'all') return contentItems;
    return contentItems.filter(item => item.contentTypeId === selectedContentTypeId);
  }, [contentItems, selectedContentTypeId]);
  
  // Get the selected content type
  const selectedContentType = contentTypes.find(ct => ct.id === selectedContentTypeId);
  
  // Handle empty states
  if (contentTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">
            No Content Types Available
          </h3>
          <p className="text-gray-400 mb-4">
            You need to create content types first before you can add content items.
            Please use the Content Type Builder to define your content structure.
          </p>
          <p className="text-sm text-gray-500">
            Go to the Content Builder section to get started.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with content type filter buttons */}
      <div className="border-b p-4 bg-dark-primary border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Content Items</h2>
            <span className="text-sm text-gray-400">({filteredItems.length})</span>
          </div>
          <Button
            onClick={() => onNewContent(selectedContentTypeId === 'all' ? '' : selectedContentTypeId)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            disabled={contentTypes.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add entry
          </Button>
        </div>
        
        {/* Content type filter buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedContentTypeId('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedContentTypeId || selectedContentTypeId === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All Content
            <span className="ml-2 text-xs opacity-70">({contentItems.length})</span>
          </button>
          {contentTypes.map((contentType) => {
            const count = contentItems.filter(item => item.contentTypeId === contentType.id).length;
            return (
              <button
                key={contentType.id}
                onClick={() => setSelectedContentTypeId(contentType.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedContentTypeId === contentType.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{contentType.icon}</span>
                {contentType.pluralName}
                <span className="ml-2 text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-6">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                <Plus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                {selectedContentType 
                  ? `No ${selectedContentType.pluralName} yet`
                  : 'No content yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {selectedContentType 
                  ? `Start creating ${selectedContentType.pluralName.toLowerCase()} to manage your content`
                  : 'Start building your content by creating your first item'}
              </p>
            </div>
            <Button
              onClick={() => onNewContent(selectedContentTypeId)}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {selectedContentType?.name.toLowerCase() || 'entry'}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
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
        )}
      </div>
    </div>
  );
}