import { create } from 'zustand';
import type { ContentItem } from '@/lib/content-types/types';
import { generateId } from '@/lib/content-types/types';

interface ContentState {
  contentItems: ContentItem[];
  projectId: string;
  
  // CRUD operations with rollback support
  addContent: (contentTypeId: string, data: Record<string, unknown>) => { item: ContentItem; rollback: () => void };
  updateContent: (id: string, data: Record<string, unknown>) => { rollback: () => void; previousData: Record<string, unknown> | undefined };
  deleteContent: (id: string) => void;
  getContentByType: (contentTypeId: string) => ContentItem[];
  getContentById: (id: string) => ContentItem | undefined;
  duplicateContent: (id: string) => ContentItem | undefined;
  
  // Batch operations
  clearContent: () => void;
  importContent: (items: ContentItem[]) => void;
  exportContent: () => ContentItem[];
  
  // Project management
  setProjectId: (id: string) => void;
  setContentItems: (items: ContentItem[]) => void;
}

export const useContentStore = create<ContentState>()(
  (set, get) => ({
    contentItems: [],
    projectId: 'default',
    
    addContent: (contentTypeId: string, data: Record<string, unknown>) => {
      const previousState = get().contentItems;
      const newItem: ContentItem = {
        id: generateId(),
        contentTypeId,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        contentItems: [...state.contentItems, newItem],
      }));
      
      return {
        item: newItem,
        rollback: () => set({ contentItems: previousState }),
      };
    },
    
    updateContent: (id: string, data: Record<string, unknown>) => {
      const previousState = get().contentItems;
      const previousItem = previousState.find(item => item.id === id);
      
      set((state) => ({
        contentItems: state.contentItems.map((item) =>
          item.id === id
            ? { ...item, data, updatedAt: new Date() }
            : item
        ),
      }));
      
      return {
        rollback: () => set({ contentItems: previousState }),
        previousData: previousItem?.data,
      };
    },
    
    deleteContent: (id: string) => {
      set((state) => ({
        contentItems: state.contentItems.filter((item) => item.id !== id),
      }));
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
    
    duplicateContent: (id: string) => {
      const state = get();
      const original = state.contentItems.find((item) => item.id === id);
      
      if (!original) return undefined;
      
      const duplicate: ContentItem = {
        ...original,
        id: generateId(),
        data: { ...original.data },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => ({
        contentItems: [...state.contentItems, duplicate],
      }));
      
      return duplicate;
    },
    
    clearContent: () => {
      set({ contentItems: [] });
    },
    
    importContent: (items: ContentItem[]) => {
      set({ contentItems: items });
    },
    
    exportContent: () => {
      return get().contentItems;
    },
    
    setProjectId: (id: string) => {
      // Clear current content when switching projects/websites
      set({ projectId: id, contentItems: [] });
      // Content should be loaded from API when needed
    },
    
    setContentItems: (items: ContentItem[]) => {
      set({ contentItems: items });
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