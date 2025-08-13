'use client';

import React, { useState, useEffect } from 'react';
import { ContentList } from '@/components/content/content-list';
import { ContentModal } from '@/components/content/content-modal';
import { FormGenerator } from '@/components/content/form-generator';
import { ContentErrorBoundary } from '@/components/content/content-error-boundary';
import { useToast } from '@/components/ui/use-toast';
import { useContentTypes } from '@/lib/context/content-type-context';
import { useProjectContext } from '@/lib/context/project-context';
import {
  useContentItems,
  useContentItem,
  useCreateContentItem,
  useUpdateContentItem,
  useDeleteContentItem,
} from '@/lib/api/content-items';
import type { ContentItem } from '@/types/api';

export default function ContentPage() {
  const { toast } = useToast();
  const { selectedWebsite } = useProjectContext();
  const { contentTypes, isLoading: typesLoading, error: typesError } = useContentTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  
  // Fetch content items with pagination
  const { data: itemsResponse, isLoading: itemsLoading, error: itemsError } = useContentItems({
    websiteId: selectedWebsite?.id,
    page: 1,
    limit: 50,
  });
  
  // Mutations
  const createMutation = useCreateContentItem();
  const updateMutation = useUpdateContentItem();
  const deleteMutation = useDeleteContentItem();
  
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
  
  const handleDeleteContent = async (id: string) => {
    if (confirm('Are you sure you want to delete this content item?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({
          title: 'Content archived',
          description: 'The content item has been successfully archived.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to archive content item. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const handleDuplicateContent = async (item: ContentItem) => {
    if (!selectedWebsite?.id) {
      toast({
        title: 'Error',
        description: 'Please select a website first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const duplicated = await createMutation.mutateAsync({
        contentTypeId: item.contentTypeId,
        websiteId: item.websiteId,
        data: { ...item.data },
        metadata: item.metadata,
        status: 'draft',
      });
      
      toast({
        title: 'Content duplicated',
        description: 'The content item has been successfully duplicated.',
      });
      
      // Open edit modal for the duplicated item
      handleEditContent(duplicated);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to duplicate content item. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const handleSaveContent = async (data: Record<string, unknown>) => {
    if (!selectedWebsite?.id) {
      toast({
        title: 'Error',
        description: 'Please select a website first.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (selectedItem) {
        // Update existing
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          data: { data },
        });
        
        toast({
          title: 'Content updated',
          description: 'Your changes have been saved successfully.',
        });
      } else {
        // Create new
        if (selectedContentTypeId) {
          await createMutation.mutateAsync({
            contentTypeId: selectedContentTypeId,
            websiteId: selectedWebsite.id,
            data,
            status: 'draft',
          });
          
          toast({
            title: 'Content created',
            description: 'New content item has been created successfully.',
          });
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
  
  const isLoading = typesLoading || itemsLoading;
  const error = typesError || itemsError;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load content</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }
  
  if (!selectedWebsite) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Please select a website to manage content</p>
        </div>
      </div>
    );
  }

  return (
    <ContentErrorBoundary>
      <ContentList
        contentItems={itemsResponse?.data || []}
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