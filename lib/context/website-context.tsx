'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { WebsiteStorageService } from '@/lib/storage/website-storage.service';
import { WebsiteData, WebsiteMetadata } from '@/lib/storage/types';

interface WebsiteContextValue {
  websiteId: string;
  website: WebsiteData | null;
  websiteMetadata: WebsiteMetadata | null;
  isLoading: boolean;
  error: Error | null;
  
  // Operations
  updateWebsite: (updates: Partial<WebsiteData>) => Promise<void>;
  deleteWebsite: () => Promise<void>;
  switchWebsite: (id: string) => Promise<void>;
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
  const [website, setWebsite] = useState<WebsiteData | null>(null);
  const [websiteMetadata, setWebsiteMetadata] = useState<WebsiteMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [storageService] = useState(() => new WebsiteStorageService());
  
  // Validate website ID on mount
  const validatedWebsiteId = useMemo(() => {
    if (!validateWebsiteId(websiteId)) {
      console.warn(`Invalid website ID: ${websiteId}, using default`);
      return 'default';
    }
    return websiteId;
  }, [websiteId]);

  // Load website data
  const loadWebsiteData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Initialize storage service if needed
      await storageService.initializeDB();
      
      // Check if website exists, create default if not
      const websites = await storageService.listWebsites();
      let targetWebsite = websites.find(w => w.id === validatedWebsiteId);
      
      if (!targetWebsite && validatedWebsiteId === 'default') {
        // Create default website for backward compatibility
        const newId = await storageService.createWebsite({
          name: 'My Website',
          createdAt: new Date(),
          lastModified: new Date(),
          storageQuota: 50 * 1024 * 1024, // 50MB default
          category: 'default'
        });
        
        // The returned ID might be different, so fetch the metadata again
        const updatedWebsites = await storageService.listWebsites();
        targetWebsite = updatedWebsites.find(w => w.id === newId);
      }
      
      if (!targetWebsite) {
        throw new Error(`Website with ID "${validatedWebsiteId}" not found`);
      }
      
      // Load website data
      const data = await storageService.getWebsiteData(validatedWebsiteId);
      setWebsite(data);
      setWebsiteMetadata(targetWebsite);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load website'));
      console.error('Failed to load website:', err);
    } finally {
      setIsLoading(false);
    }
  }, [validatedWebsiteId, storageService]);

  // Update website data
  const updateWebsite = useCallback(async (updates: Partial<WebsiteData>) => {
    try {
      await storageService.saveWebsiteData(validatedWebsiteId, updates);
      
      // Update local state
      setWebsite(prev => prev ? { ...prev, ...updates } : null);
      
      // Update metadata last modified
      if (websiteMetadata) {
        await storageService.updateWebsiteMetadata(validatedWebsiteId, {
          lastModified: new Date()
        });
        setWebsiteMetadata(prev => prev ? { ...prev, lastModified: new Date() } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update website'));
      throw err;
    }
  }, [validatedWebsiteId, storageService, websiteMetadata]);

  // Delete website
  const deleteWebsite = useCallback(async () => {
    try {
      await storageService.deleteWebsiteData(validatedWebsiteId);
      setWebsite(null);
      setWebsiteMetadata(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete website'));
      throw err;
    }
  }, [validatedWebsiteId, storageService]);

  // Switch to different website
  const switchWebsite = useCallback(async (newId: string) => {
    // Use Next.js router for client-side navigation
    router.push(`/studio/${newId}`);
  }, [router]);

  // Refresh website data
  const refreshWebsite = useCallback(async () => {
    await loadWebsiteData();
  }, [loadWebsiteData]);

  // Load website data on mount and when ID changes
  useEffect(() => {
    loadWebsiteData();
  }, [loadWebsiteData]);

  // Cleanup storage service on unmount
  useEffect(() => {
    return () => {
      // Clean up any open connections if cleanup method exists
      const serviceWithCleanup = storageService as unknown as { cleanup?: () => void };
      if (serviceWithCleanup.cleanup) {
        serviceWithCleanup.cleanup();
      }
    };
  }, [storageService]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      websiteId: validatedWebsiteId,
      website,
      websiteMetadata,
      isLoading,
      error,
      updateWebsite,
      deleteWebsite,
      switchWebsite,
      refreshWebsite
    }),
    [validatedWebsiteId, website, websiteMetadata, isLoading, error, 
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
export const useWebsite = () => {
  const context = useWebsiteContext();
  return {
    website: context.website,
    metadata: context.websiteMetadata,
    isLoading: context.isLoading,
    error: context.error
  };
};