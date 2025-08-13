import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AIContext, CreateAIContextInput, UpdateAIContextInput, AppendMessageInput } from '@/types/ai-context';

const API_BASE = '/api/ai-context';

// Query keys
export const aiContextKeys = {
  all: ['ai-context'] as const,
  lists: () => [...aiContextKeys.all, 'list'] as const,
  list: (websiteId: string) => [...aiContextKeys.lists(), websiteId] as const,
  details: () => [...aiContextKeys.all, 'detail'] as const,
  detail: (websiteId: string, sessionId: string) => [...aiContextKeys.details(), websiteId, sessionId] as const,
};

// Fetch all contexts for a website
export function useAIContexts(
  websiteId: string,
  options?: {
    limit?: number;
    offset?: number;
    isActive?: boolean;
  }
) {
  return useQuery({
    queryKey: aiContextKeys.list(websiteId),
    queryFn: async () => {
      const params = new URLSearchParams({
        websiteId,
        ...(options?.limit && { limit: options.limit.toString() }),
        ...(options?.offset && { offset: options.offset.toString() }),
        ...(options?.isActive !== undefined && { isActive: options.isActive.toString() }),
      });
      
      const response = await fetch(`${API_BASE}?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch AI contexts');
      }
      
      const data = await response.json();
      return data.data as {
        contexts: AIContext[];
        total: number;
        limit: number;
        offset: number;
      };
    },
    enabled: !!websiteId,
  });
}

// Fetch specific context
export function useAIContext(websiteId: string, sessionId: string) {
  return useQuery({
    queryKey: aiContextKeys.detail(websiteId, sessionId),
    queryFn: async () => {
      const params = new URLSearchParams({ websiteId });
      const response = await fetch(`${API_BASE}/${sessionId}?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch AI context');
      }
      
      const data = await response.json();
      return data.data as AIContext;
    },
    enabled: !!websiteId && !!sessionId,
  });
}

// Create new AI context
export function useCreateAIContext() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateAIContextInput) => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create AI context');
      }
      
      const data = await response.json();
      return data.data as AIContext;
    },
    onSuccess: (data) => {
      // Invalidate contexts list
      queryClient.invalidateQueries({ queryKey: aiContextKeys.list(data.websiteId) });
      // Set the new context in cache
      queryClient.setQueryData(
        aiContextKeys.detail(data.websiteId, data.sessionId),
        data
      );
    },
  });
}

// Append message to context
export function useAppendMessage(websiteId: string, sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AppendMessageInput) => {
      const params = new URLSearchParams({ websiteId });
      const response = await fetch(`${API_BASE}/${sessionId}/messages?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to append message');
      }
      
      const data = await response.json();
      return data.data as AIContext;
    },
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: aiContextKeys.detail(websiteId, sessionId) });
      
      // Snapshot the previous value
      const previousContext = queryClient.getQueryData<AIContext>(
        aiContextKeys.detail(websiteId, sessionId)
      );
      
      // Optimistically update to the new value
      if (previousContext) {
        queryClient.setQueryData(aiContextKeys.detail(websiteId, sessionId), {
          ...previousContext,
          messages: [...previousContext.messages, input.message],
          updatedAt: new Date(),
        });
      }
      
      // Return a context object with the snapshotted value
      return { previousContext };
    },
    onError: (err, newMessage, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousContext) {
        queryClient.setQueryData(
          aiContextKeys.detail(websiteId, sessionId),
          context.previousContext
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: aiContextKeys.detail(websiteId, sessionId) });
    },
  });
}

// Clear context messages
export function useClearContext(websiteId: string, sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ websiteId });
      const response = await fetch(`${API_BASE}/${sessionId}/messages?${params}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to clear context');
      }
      
      const data = await response.json();
      return data.data as AIContext;
    },
    onSuccess: (data) => {
      // Update the context in cache
      queryClient.setQueryData(
        aiContextKeys.detail(websiteId, sessionId),
        data
      );
      // Invalidate list as well
      queryClient.invalidateQueries({ queryKey: aiContextKeys.list(websiteId) });
    },
  });
}

// Update AI context
export function useUpdateAIContext(websiteId: string, sessionId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateAIContextInput) => {
      const params = new URLSearchParams({ websiteId });
      const response = await fetch(`${API_BASE}/${sessionId}?${params}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update AI context');
      }
      
      const data = await response.json();
      return data.data as AIContext;
    },
    onSuccess: (data) => {
      // Update the context in cache
      queryClient.setQueryData(
        aiContextKeys.detail(websiteId, sessionId),
        data
      );
      // Invalidate list as well
      queryClient.invalidateQueries({ queryKey: aiContextKeys.list(websiteId) });
    },
  });
}

// Delete (soft) AI context
export function useDeleteAIContext() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ websiteId, sessionId }: { websiteId: string; sessionId: string }) => {
      const params = new URLSearchParams({ websiteId });
      const response = await fetch(`${API_BASE}/${sessionId}?${params}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete AI context');
      }
      
      return { websiteId, sessionId };
    },
    onSuccess: ({ websiteId, sessionId }) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: aiContextKeys.detail(websiteId, sessionId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: aiContextKeys.list(websiteId) });
    },
  });
}