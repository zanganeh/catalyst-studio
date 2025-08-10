'use client';

import React, { useState } from 'react';
import { ContentList } from '@/components/content/content-list';
import { ContentModal } from '@/components/content/content-modal';
import { FormGenerator } from '@/components/content/form-generator';
import { useContentStore } from '@/lib/stores/content-store';
import { useProjectContext } from '@/lib/context/project-context';
import { useToast } from '@/components/ui/use-toast';
import type { ContentItem } from '@/lib/content-types/types';

export default function ContentPage() {
  const { context } = useProjectContext();
  const contentStore = useContentStore();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  
  const contentTypes = context.contentTypes || [];
  
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
      } catch (error) {
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate content item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveContent = (data: Record<string, any>) => {
    try {
      if (selectedItem) {
        // Update existing
        contentStore.updateContent(selectedItem.id, data);
        toast({
          title: 'Content updated',
          description: 'Your changes have been saved successfully.',
        });
      } else {
        // Create new
        if (selectedContentTypeId) {
          contentStore.addContent(selectedContentTypeId, data);
          toast({
            title: 'Content created',
            description: 'New content item has been created successfully.',
          });
        }
      }
      setModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save content. Please check your input and try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <>
      <ContentList
        contentItems={contentStore.contentItems}
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
    </>
  );
}