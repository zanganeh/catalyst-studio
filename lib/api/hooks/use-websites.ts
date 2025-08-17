import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Website, CreateWebsiteRequest, UpdateWebsiteRequest } from '@/types/api';

const WEBSITES_QUERY_KEY = 'websites';

// Query keys helper
export const websiteKeys = {
  all: [WEBSITES_QUERY_KEY] as const,
  lists: () => [...websiteKeys.all, 'list'] as const,
  list: () => [...websiteKeys.lists()] as const,
  details: () => [...websiteKeys.all, 'detail'] as const,
  detail: (id: string) => [...websiteKeys.details(), id] as const,
};

/**
 * Fetch all websites
 */
export function useWebsites() {
  return useQuery({
    queryKey: [WEBSITES_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch('/api/websites');
      if (!response.ok) {
        throw new Error('Failed to fetch websites');
      }
      const data = await response.json();
      return data.data as Website[];
    }
  });
}

/**
 * Fetch a single website by ID
 */
export function useWebsite(id: string | undefined) {
  return useQuery({
    queryKey: [WEBSITES_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) throw new Error('Website ID is required');
      
      const response = await fetch(`/api/websites/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Website not found');
      }
      const data = await response.json();
      return data.data as Website;
    },
    enabled: !!id && id !== 'default',
    retry: false // Don't retry if website doesn't exist
  });
}

/**
 * Create a new website
 */
export function useCreateWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (website: CreateWebsiteRequest) => {
      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(website),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create website');
      }

      const data = await response.json();
      return data.data as Website;
    },
    onSuccess: (newWebsite) => {
      // Invalidate and refetch websites list
      queryClient.invalidateQueries({ queryKey: [WEBSITES_QUERY_KEY] });
      
      // Optimistically add the new website to the cache
      queryClient.setQueryData([WEBSITES_QUERY_KEY], (old: Website[] | undefined) => {
        if (!old) return [newWebsite];
        return [newWebsite, ...old];
      });
    },
  });
}

/**
 * Update an existing website
 */
export function useUpdateWebsite(id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (website: UpdateWebsiteRequest) => {
      if (!id) throw new Error('Website ID is required');
      
      const response = await fetch(`/api/websites/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(website),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update website');
      }

      const data = await response.json();
      return data.data as Website;
    },
    onSuccess: (updatedWebsite) => {
      // Update the specific website in cache
      queryClient.setQueryData([WEBSITES_QUERY_KEY, id], updatedWebsite);
      
      // Update the website in the list
      queryClient.setQueryData([WEBSITES_QUERY_KEY], (old: Website[] | undefined) => {
        if (!old) return [];
        return old.map(website => 
          website.id === updatedWebsite.id ? updatedWebsite : website
        );
      });
      
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: [WEBSITES_QUERY_KEY] });
    },
  });
}

/**
 * Delete a website (soft delete)
 */
export function useDeleteWebsite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete website');
      }

      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the website from the list cache
      queryClient.setQueryData([WEBSITES_QUERY_KEY], (old: Website[] | undefined) => {
        if (!old) return [];
        return old.filter(website => website.id !== deletedId);
      });
      
      // Invalidate the specific website query
      queryClient.invalidateQueries({ queryKey: [WEBSITES_QUERY_KEY, deletedId] });
      
      // Invalidate the list query
      queryClient.invalidateQueries({ queryKey: [WEBSITES_QUERY_KEY] });
    },
  });
}