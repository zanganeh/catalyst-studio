import { create } from 'zustand';
import type { ContentItem } from '@/lib/content-types/types';
import { generateId } from '@/lib/content-types/types';

// Type for content items that matches the API format
interface ApiContentItem {
  id: string;
  contentTypeId: string;
  websiteId: string;
  slug?: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Transform API content item to internal format
function transformApiToInternal(apiItem: ApiContentItem): ContentItem {
  const title = apiItem.data.title as string || 'Untitled';
  const { title: _, ...fieldData } = apiItem.data;
  
  return {
    id: apiItem.id,
    contentTypeId: apiItem.contentTypeId,
    title,
    data: fieldData,
    createdAt: apiItem.createdAt,
    updatedAt: apiItem.updatedAt,
  };
}

// Transform internal format to API format
function transformInternalToApi(item: ContentItem, websiteId: string): Partial<ApiContentItem> {
  return {
    contentTypeId: item.contentTypeId,
    websiteId,
    data: {
      title: item.title,
      ...item.data,
    },
    status: 'draft',
  };
}

interface ContentState {
  contentItems: ContentItem[];
  projectId: string;
  isLoading: boolean;
  error: string | null;
  
  // API operations
  loadContent: (websiteId: string) => Promise<void>;
  addContent: (contentTypeId: string, data: Record<string, unknown>, websiteId: string) => Promise<ContentItem>;
  updateContent: (id: string, data: Record<string, unknown>, websiteId: string) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  
  // Read operations (local state)
  getContentByType: (contentTypeId: string) => ContentItem[];
  getContentById: (id: string) => ContentItem | undefined;
  duplicateContent: (id: string, websiteId: string) => Promise<ContentItem | undefined>;
  
  // State management
  clearContent: () => void;
  setProjectId: (id: string) => void;
  setError: (error: string | null) => void;
}

export const useContentStore = create<ContentState>()(
  (set, get) => ({
    contentItems: [],
    projectId: 'default',
    isLoading: false,
    error: null,
    
    loadContent: async (websiteId: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await fetch(`/api/content-items?websiteId=${websiteId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load content items');
        }
        
        const result = await response.json();
        const apiItems = result.data || [];
        
        const contentItems = apiItems.map(transformApiToInternal);
        
        set({ contentItems, isLoading: false });
      } catch (error) {
        console.error('Failed to load content:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false 
        });
      }
    },
    
    addContent: async (contentTypeId: string, data: Record<string, unknown>, websiteId: string) => {
      const { title, ...fieldData } = data;
      
      // Create optimistic item
      const optimisticItem: ContentItem = {
        id: generateId(),
        contentTypeId,
        title: (title as string) || 'Untitled',
        data: fieldData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add optimistically
      set((state) => ({
        contentItems: [...state.contentItems, optimisticItem],
      }));
      
      try {
        const payload = transformInternalToApi(optimisticItem, websiteId);
        
        const response = await fetch('/api/content-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create content item');
        }
        
        const result = await response.json();
        const apiItem = result.data;
        const persistedItem = transformApiToInternal(apiItem);
        
        // Replace optimistic item with persisted item
        set((state) => ({
          contentItems: state.contentItems.map(item =>
            item.id === optimisticItem.id ? persistedItem : item
          ),
        }));
        
        return persistedItem;
      } catch (error) {
        // Remove optimistic item on error
        set((state) => ({
          contentItems: state.contentItems.filter(item => item.id !== optimisticItem.id),
          error: error instanceof Error ? error.message : 'Failed to create content',
        }));
        throw error;
      }
    },
    
    updateContent: async (id: string, data: Record<string, unknown>, websiteId: string) => {
      const { title, ...fieldData } = data;
      const previousState = get().contentItems;
      
      // Update optimistically
      set((state) => ({
        contentItems: state.contentItems.map((item) =>
          item.id === id
            ? { 
                ...item, 
                title: (title as string) || item.title,
                data: fieldData, 
                updatedAt: new Date() 
              }
            : item
        ),
      }));
      
      try {
        const response = await fetch(`/api/content-items/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              title: title as string,
              ...fieldData,
            },
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update content item');
        }
        
        const result = await response.json();
        const apiItem = result.data;
        const updatedItem = transformApiToInternal(apiItem);
        
        // Replace with server response
        set((state) => ({
          contentItems: state.contentItems.map(item =>
            item.id === id ? updatedItem : item
          ),
        }));
      } catch (error) {
        // Rollback on error
        set({ 
          contentItems: previousState,
          error: error instanceof Error ? error.message : 'Failed to update content',
        });
        throw error;
      }
    },
    
    deleteContent: async (id: string) => {
      const previousState = get().contentItems;
      
      // Remove optimistically
      set((state) => ({
        contentItems: state.contentItems.filter((item) => item.id !== id),
      }));
      
      try {
        const response = await fetch(`/api/content-items/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete content item');
        }
      } catch (error) {
        // Rollback on error
        set({ 
          contentItems: previousState,
          error: error instanceof Error ? error.message : 'Failed to delete content',
        });
        throw error;
      }
    },
    
    getContentByType: (contentTypeId: string) => {
      const state = get();
      return state.contentItems.filter(
        (item) => item.contentTypeId === contentTypeId
      );
    },
    
    getContentById: (id: string) => {
      const state = get();
      return state.contentItems.find((item) => item.id === id);
    },
    
    duplicateContent: async (id: string, websiteId: string) => {
      const state = get();
      const original = state.contentItems.find((item) => item.id === id);
      
      if (!original) return undefined;
      
      const duplicateData = {
        title: `${original.title} (Copy)`,
        ...original.data,
      };
      
      try {
        return await get().addContent(original.contentTypeId, duplicateData, websiteId);
      } catch (error) {
        console.error('Failed to duplicate content:', error);
        return undefined;
      }
    },
    
    clearContent: () => {
      set({ contentItems: [], error: null });
    },
    
    setProjectId: (id: string) => {
      set({ projectId: id, contentItems: [], error: null });
    },
    
    setError: (error: string | null) => {
      set({ error });
    },
  })
);

// Optimistic update wrapper for better UX
export function withOptimisticUpdate<T extends unknown[], R>(
  fn: (...args: T) => R,
  rollback: () => void
): (...args: T) => R {
  return (...args: T) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error('Operation failed, rolling back:', error);
      rollback();
      throw error;
    }
  };
}