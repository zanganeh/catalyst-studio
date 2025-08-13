'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWebsite, useUpdateWebsite, useDeleteWebsite } from '@/lib/api/hooks/use-websites';
import { Website, UpdateWebsiteRequest } from '@/types/api';

interface WebsiteContextValue {
  websiteId: string;
  website: Website | null;
  isLoading: boolean;
  error: Error | null;
  
  // Operations
  updateWebsite: (updates: UpdateWebsiteRequest) => Promise<void>;
  deleteWebsite: () => Promise<void>;
  switchWebsite: (id: string) => void;
  refreshWebsite: () => Promise<void>;
}

const WebsiteContext = createContext<WebsiteContextValue | null>(null);

// Validate website ID to prevent injection attacks
const validateWebsiteId = (id: string): boolean => {
  return /^[a-zA-Z0-9-_]+$/.test(id) && id.length <= 50;
};

export function WebsiteContextProvider({
  websiteId,
  children
}: {
  websiteId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentWebsiteId, setCurrentWebsiteId] = useState(websiteId);
  
  // Validate website ID on mount
  const validatedWebsiteId = useMemo(() => {
    if (!validateWebsiteId(currentWebsiteId)) {
      console.warn(`Invalid website ID: ${currentWebsiteId}, using default`);
      return 'default';
    }
    return currentWebsiteId;
  }, [currentWebsiteId]);

  // Use React Query hooks
  const { data: website = null, isLoading, error: queryError, refetch } = useWebsite(validatedWebsiteId);
  const updateMutation = useUpdateWebsite(validatedWebsiteId);
  const deleteMutation = useDeleteWebsite();

  // Convert query error to Error object
  const error = queryError instanceof Error ? queryError : queryError ? new Error(String(queryError)) : null;

  // Update website data
  const updateWebsite = useCallback(async (updates: UpdateWebsiteRequest) => {
    try {
      await updateMutation.mutateAsync(updates);
    } catch (err) {
      console.error('Failed to update website:', err);
      throw err;
    }
  }, [updateMutation]);

  // Delete website
  const deleteWebsite = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(validatedWebsiteId);
      // Navigate to dashboard after deletion
      router.push('/dashboard');
    } catch (err) {
      console.error('Failed to delete website:', err);
      throw err;
    }
  }, [deleteMutation, validatedWebsiteId, router]);

  // Switch to different website
  const switchWebsite = useCallback((id: string) => {
    setCurrentWebsiteId(id);
    // Navigate to new website
    router.push(`/studio/${id}`);
  }, [router]);

  // Refresh website data
  const refreshWebsite = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      websiteId: validatedWebsiteId,
      website,
      isLoading,
      error,
      updateWebsite,
      deleteWebsite,
      switchWebsite,
      refreshWebsite
    }),
    [validatedWebsiteId, website, isLoading, error, 
     updateWebsite, deleteWebsite, switchWebsite, refreshWebsite]
  );

  return (
    <WebsiteContext.Provider value={contextValue}>
      {children}
    </WebsiteContext.Provider>
  );
}

export const useWebsiteContext = () => {
  const context = useContext(WebsiteContext);
  if (!context) {
    throw new Error('useWebsiteContext must be used within WebsiteContextProvider');
  }
  return context;
};

// Helper hook for components that need website data but can handle loading/error states
export const useCurrentWebsite = () => {
  const context = useWebsiteContext();
  return {
    website: context.website,
    isLoading: context.isLoading,
    error: context.error
  };
};