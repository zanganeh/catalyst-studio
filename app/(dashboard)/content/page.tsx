'use client';

import React, { useState } from 'react';
import { ContentList } from '@/components/content/content-list';
import { ContentModal } from '@/components/content/content-modal';
import { FormGenerator } from '@/components/content/form-generator';
import { ContentErrorBoundary } from '@/components/content/content-error-boundary';
import { useContentStore } from '@/lib/stores/content-store';
import { useToast } from '@/components/ui/use-toast';
import { useContentTypes } from '@/lib/context/content-type-context';
import type { ContentItem } from '@/lib/content-types/types';

export default function ContentPage() {
  const contentStore = useContentStore();
  const { toast } = useToast();
  const { contentTypes, isLoading, error } = useContentTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  
  // Get selected content type for modal
  const selectedContentType = contentTypes.find(
    ct => ct.id === (selectedItem?.contentTypeId || selectedContentTypeId)
  );
  
  const handleNewContent = () => {
    // If we have content types, select the first one by default
    if (contentTypes.length > 0 && !selectedContentTypeId) {
      setSelectedContentTypeId(contentTypes[0].id);
    }
    setSelectedItem(null);
    setModalOpen(true);
  };
  
  const handleEditContent = (item: ContentItem) => {
    setSelectedItem(item);
    setSelectedContentTypeId(item.contentTypeId);
    setModalOpen(true);
  };
  
  const handleDeleteContent = (id: string) => {
    if (confirm('Are you sure you want to delete this content item?')) {
      try {
        contentStore.deleteContent(id);
        toast({
          title: 'Content deleted',
          description: 'The content item has been successfully deleted.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to delete content item. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleDuplicateContent = (item: ContentItem) => {
    try {
      const duplicated = contentStore.duplicateContent(item.id);
      if (duplicated) {
        toast({
          title: 'Content duplicated',
          description: 'The content item has been successfully duplicated.',
        });
        // Optionally open the edit modal for the duplicated item
        handleEditContent(duplicated);
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate content item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveContent = async (data: Record<string, unknown>) => {
    try {
      if (selectedItem) {
        // Update existing with rollback support
        const { rollback } = contentStore.updateContent(selectedItem.id, data);
        
        // Simulate backend save (replace with actual API call)
        try {
          // await api.updateContent(selectedItem.id, data);
          toast({
            title: 'Content updated',
            description: 'Your changes have been saved successfully.',
          });
        } catch (error) {
          // Rollback on failure
          rollback();
          throw error;
        }
      } else {
        // Create new with rollback support
        if (selectedContentTypeId) {
          const { rollback } = contentStore.addContent(selectedContentTypeId, data);
          
          // Simulate backend save (replace with actual API call)
          try {
            // await api.createContent(data);
            toast({
              title: 'Content created',
              description: 'New content item has been created successfully.',
            });
          } catch (error) {
            // Rollback on failure
            rollback();
            throw error;
          }
        }
      }
      setModalOpen(false);
      setSelectedItem(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save content. Please check your input and try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load content types</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <ContentErrorBoundary>
      <ContentList
        contentItems={contentStore.contentItems}
        contentTypes={contentTypes}
        onNewContent={handleNewContent}
        onEditContent={handleEditContent}
        onDeleteContent={handleDeleteContent}
        onDuplicateContent={handleDuplicateContent}
      />
      
      <ContentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        contentType={selectedContentType || null}
        contentItem={selectedItem}
        onSave={handleSaveContent}
      >
        {selectedContentType && (
          <FormGenerator
            contentType={selectedContentType}
            contentItem={selectedItem}
            onSubmit={handleSaveContent}
          />
        )}
      </ContentModal>
    </ContentErrorBoundary>
  );
}