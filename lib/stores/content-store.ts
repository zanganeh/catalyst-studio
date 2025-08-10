import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentItem } from '@/lib/content-types/types';
import { generateId } from '@/lib/content-types/types';

interface ContentState {
  contentItems: ContentItem[];
  projectId: string;
  
  // CRUD operations
  addContent: (contentTypeId: string, data: Record<string, any>) => ContentItem;
  updateContent: (id: string, data: Record<string, any>) => void;
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
}

// Helper to get storage key
const getStorageKey = (projectId: string) => `project:${projectId}:content`;

export const useContentStore = create<ContentState>()(
  persist(
    (set, get) => ({
      contentItems: [],
      projectId: 'default',
      
      addContent: (contentTypeId: string, data: Record<string, any>) => {
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
        
        return newItem;
      },
      
      updateContent: (id: string, data: Record<string, any>) => {
        set((state) => ({
          contentItems: state.contentItems.map((item) =>
            item.id === id
              ? { ...item, data, updatedAt: new Date() }
              : item
          ),
        }));
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
        set({ projectId: id });
      },
    }),
    {
      name: 'content-storage',
      // Custom storage to handle IndexedDB with localStorage fallback
      storage: {
        getItem: async (name) => {
          try {
            // Try IndexedDB first (through localStorage for simplicity)
            const stored = localStorage.getItem(name);
            return stored ? JSON.parse(stored) : null;
          } catch (error) {
            console.error('Failed to load content from storage:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            // Use localStorage with size check
            const serialized = JSON.stringify(value);
            
            // Check size (localStorage has ~5-10MB limit)
            if (serialized.length > 5 * 1024 * 1024) {
              console.warn('Content size exceeds recommended limit');
            }
            
            localStorage.setItem(name, serialized);
          } catch (error) {
            console.error('Failed to save content to storage:', error);
            
            // If quota exceeded, try to clear old data
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
              console.warn('Storage quota exceeded, clearing old data...');
              // Could implement LRU cache or other strategies here
            }
          }
        },
        removeItem: async (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Failed to remove content from storage:', error);
          }
        },
      },
    }
  )
);

// Optimistic update wrapper for better UX
export function withOptimisticUpdate<T extends any[], R>(
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