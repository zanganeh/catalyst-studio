'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ContentType, ContentItem } from '@/lib/content-types/types';

interface ContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType | null;
  contentItem?: ContentItem | null;
  onSave: (data: Record<string, unknown>) => void;
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  
  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedAlert(true);
    } else {
      onOpenChange(false);
    }
  }, [hasUnsavedChanges, onOpenChange]);
  
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, handleClose]);
  
  // Handle save callback from form
  const handleSave = useCallback((data: Record<string, unknown>) => {
    onSave(data);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  }, [onSave, onOpenChange]);
  
  if (!contentType) return null;
  
  const title = contentItem 
    ? `Edit ${contentType.name}`
    : `Create New ${contentType.name}`;
  
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl bg-gray-900/95 backdrop-blur-md border-gray-700"
        onPointerDownOutside={() => {
          // Allow closing by clicking backdrop
          onOpenChange(false);
        }}
      >
        <DialogHeader className="border-b border-gray-800 pb-4">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <span aria-hidden="true">{contentType.icon}</span>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2">
            {contentItem 
              ? `Edit the fields below to update this ${contentType.name.toLowerCase()}.`
              : `Fill in the form below to create a new ${contentType.name.toLowerCase()}.`
            }
          </DialogDescription>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            aria-label="Close dialog"
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
          } as Record<string, unknown>)}
        </div>
        
        <DialogFooter className="border-t border-gray-800 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
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
    
    {/* Unsaved changes alert */}
    <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
      <AlertDialogContent className="bg-gray-900 border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            You have unsaved changes. Are you sure you want to close without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700">
            Keep Editing
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setHasUnsavedChanges(false);
              setShowUnsavedAlert(false);
              onOpenChange(false);
            }}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}