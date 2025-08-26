import { useEffect, useRef, useCallback } from 'react';
import { useSitemapStore } from '../stores/sitemap-store';
import { saveManager } from '../components/sitemap/save-manager';

export interface UseAutoSaveOptions {
  enabled?: boolean;
  warnOnUnload?: boolean;
  onSaveStart?: () => void;
  onSaveComplete?: () => void;
  onSaveError?: (error: Error) => void;
}

/**
 * Hook to automatically save changes and prevent data loss
 */
export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    enabled = true,
    warnOnUnload = true,
    onSaveStart,
    onSaveComplete,
    onSaveError
  } = options;
  
  const { nodes, edges, saveStatus } = useSitemapStore();
  const previousNodesRef = useRef(nodes);
  const previousEdgesRef = useRef(edges);
  const hasUnsavedChangesRef = useRef(false);
  
  // Track changes and trigger saves
  useEffect(() => {
    if (!enabled) return;
    
    // Check if nodes or edges have changed
    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(previousNodesRef.current);
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(previousEdgesRef.current);
    
    if (nodesChanged || edgesChanged) {
      hasUnsavedChangesRef.current = true;
      previousNodesRef.current = nodes;
      previousEdgesRef.current = edges;
      
      // Changes are already tracked by the store which uses saveManager
      // No need to manually trigger saves here
    }
  }, [nodes, edges, enabled]);
  
  // Update unsaved changes flag based on save status
  useEffect(() => {
    if (saveStatus === 'saved') {
      hasUnsavedChangesRef.current = false;
      onSaveComplete?.();
    } else if (saveStatus === 'saving') {
      onSaveStart?.();
    } else if (saveStatus === 'error') {
      onSaveError?.(new Error('Failed to save changes'));
    }
  }, [saveStatus, onSaveComplete, onSaveStart, onSaveError]);
  
  // Handle beforeunload event to warn about unsaved changes
  useEffect(() => {
    if (!warnOnUnload) return;
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current || saveManager.getPendingCount() > 0) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message; // For Chrome
        return message; // For other browsers
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [warnOnUnload]);
  
  // Force save on component unmount
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current || saveManager.getPendingCount() > 0) {
        // Try to save immediately before unmount
        saveManager.saveNow().catch(console.error);
      }
    };
  }, []);
  
  // Manual save function
  const saveNow = useCallback(async () => {
    try {
      await saveManager.saveNow();
      hasUnsavedChangesRef.current = false;
    } catch (error) {
      console.error('Manual save failed:', error);
      throw error;
    }
  }, []);
  
  // Retry failed saves
  const retry = useCallback(() => {
    saveManager.retry();
  }, []);
  
  return {
    hasUnsavedChanges: hasUnsavedChangesRef.current,
    saveStatus,
    pendingOperations: saveManager.getPendingCount(),
    saveNow,
    retry
  };
}