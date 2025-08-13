'use client';

import React, { useState, useEffect } from 'react';
import { ContentList } from '@/components/content/content-list';
import { ContentModal } from '@/components/content/content-modal';
import { FormGenerator } from '@/components/content/form-generator';
import { ContentErrorBoundary } from '@/components/content/content-error-boundary';
import { useContentStore } from '@/lib/stores/content-store';
import { useToast } from '@/components/ui/use-toast';
import { useContentTypes } from '@/lib/context/content-type-context';
import { useWebsiteContext } from '@/lib/context/website-context';
import { DEFAULT_WEBSITE_ID } from '@/lib/config/constants';
import type { ContentItem } from '@/lib/content-types/types';

export default function ContentPage() {
  const contentStore = useContentStore();
  const { toast } = useToast();
  const { contentTypes, isLoading, error } = useContentTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedContentTypeId, setSelectedContentTypeId] = useState<string>('');
  
  // Get website ID from context or use default
  let websiteId: string;
  try {
    const { websiteId: contextWebsiteId } = useWebsiteContext();
    websiteId = contextWebsiteId || DEFAULT_WEBSITE_ID;
  } catch {
    // Not in website context, use default
    websiteId = DEFAULT_WEBSITE_ID;
  }
  
  // Load content when component mounts or website changes
  useEffect(() => {
    if (websiteId) {
      contentStore.loadContent(websiteId);
    }
  }, [websiteId]);
  
  // Get selected content type for modal
  const selectedContentType = contentTypes.find(
    ct => ct.id === (selectedItem?.contentTypeId || selectedContentTypeId)
  );
  
  const handleNewContent = (contentTypeId?: string) => {
    // Use the passed contentTypeId or fallback to first content type
    if (contentTypeId) {
      setSelectedContentTypeId(contentTypeId);
    } else if (contentTypes.length > 0 && !selectedContentTypeId) {
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
        await contentStore.deleteContent(id);
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
  
  const handleDuplicateContent = async (item: ContentItem) => {
    try {
      const duplicated = await contentStore.duplicateContent(item.id, websiteId);
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
  
  const handleSaveContent = async (data: Record<string, unknown>) => {
    try {
      if (selectedItem) {
        // Update existing content
        await contentStore.updateContent(selectedItem.id, data, websiteId);
        toast({
          title: 'Content updated',
          description: 'Your changes have been saved successfully.',
        });
      } else {
        // Create new content
        if (selectedContentTypeId) {
          await contentStore.addContent(selectedContentTypeId, data, websiteId);
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
  
  if (isLoading || contentStore.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isLoading ? 'Loading content types...' : 'Loading content...'}
          </p>
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

  if (contentStore.error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load content</p>
          <p className="text-sm text-muted-foreground">{contentStore.error}</p>
          <button 
            onClick={() => contentStore.loadContent(websiteId)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
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