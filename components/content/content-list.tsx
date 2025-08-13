'use client';

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  
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
      {/* Header with content type selector */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">Content Items</h2>
          <Select
            value={selectedContentTypeId}
            onValueChange={setSelectedContentTypeId}
          >
            <SelectTrigger className="w-[200px] bg-gray-800/50 border-gray-700 text-white">
              <SelectValue placeholder="All Content Types" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="all" className="text-gray-300 hover:bg-gray-800">
                All Content Types
              </SelectItem>
              {contentTypes.map((contentType) => (
                <SelectItem 
                  key={contentType.id} 
                  value={contentType.id}
                  className="text-gray-300 hover:bg-gray-800"
                >
                  <span className="flex items-center gap-2">
                    <span>{contentType.icon}</span>
                    <span>{contentType.pluralName}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={() => onNewContent(selectedContentTypeId)}
          className="bg-orange-500 hover:bg-orange-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          disabled={contentTypes.length === 0}
          aria-label="Create new content item"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add entry
        </Button>
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