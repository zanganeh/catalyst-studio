'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ContentType, ContentItem } from '@/lib/content-types/types';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType | null;
  contentItem?: ContentItem | null;
  onSave: (data: Record<string, any>) => void;
  children: React.ReactNode;
}

export function ContentModal({
  open,
  onOpenChange,
  contentType,
  contentItem,
  onSave,
  children,
}: ContentModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);
  
  // Handle save callback from form
  const handleSave = useCallback((data: Record<string, any>) => {
    onSave(data);
    onOpenChange(false);
  }, [onSave, onOpenChange]);
  
  if (!contentType) return null;
  
  const title = contentItem 
    ? `Edit ${contentType.name}`
    : `Create New ${contentType.name}`;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl bg-gray-900/95 backdrop-blur-md border-gray-700"
        onPointerDownOutside={(e) => {
          // Allow closing by clicking backdrop
          onOpenChange(false);
        }}
      >
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <span>{contentType.icon}</span>
            <span>{title}</span>
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>
        
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {/* Form content will be passed as children */}
          {React.cloneElement(children as React.ReactElement, {
            onSubmit: handleSave,
            contentType,
            contentItem,
          })}
        </div>
        
        <DialogFooter className="border-t border-gray-800 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="content-form"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}