'use client';

import React from 'react';
import { Edit2, Trash2, Copy, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ContentItem, ContentType } from '@/lib/content-types/types';

interface ContentCardProps {
  item: ContentItem;
  contentType: ContentType;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function ContentCard({
  item,
  contentType,
  onEdit,
  onDelete,
  onDuplicate,
}: ContentCardProps) {
  // Extract title from first text field
  const titleField = contentType.fields.find(
    (field) => field.type === 'text' || field.type === 'richText'
  );
  const title = titleField ? item.data[titleField.name] : 'Untitled';
  
  // Extract image from first image field
  const imageField = contentType.fields.find((field) => field.type === 'image');
  const imageUrl = imageField ? item.data[imageField.name] : null;
  
  // Extract description from first rich text field
  const descriptionField = contentType.fields.find((field) => field.type === 'richText');
  const description = descriptionField ? item.data[descriptionField.name] : null;
  
  // Truncate description
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  return (
    <div className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden hover:border-orange-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/10">
      {/* Image preview */}
      {imageUrl && (
        <div className="aspect-video bg-gray-900 relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title || 'Content preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">{contentType.icon}</span>
            <h3 className="text-white font-medium truncate">
              {title || 'Untitled'}
            </h3>
          </div>
          
          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
              <DropdownMenuItem
                onClick={onEdit}
                className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDuplicate}
                className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-400 hover:bg-gray-800 hover:text-red-300 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {truncateText(description, 100)}
          </p>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{contentType.name}</span>
          <span>{formatDate(item.updatedAt)}</span>
        </div>
        
        {/* Status badge (for future use) */}
        <div className="mt-3 flex gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            Published
          </span>
        </div>
      </div>
      
      {/* Hover actions (alternative to dropdown) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            size="sm"
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            onClick={onDuplicate}
            size="sm"
            variant="outline"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="outline"
            className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400 border-gray-700 hover:border-red-500/50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}