import { useEffect } from 'react';
import { useSitemapStore } from '../stores/sitemap-store';

/**
 * Hook to handle keyboard shortcuts for undo/redo functionality
 */
export function useUndoRedoShortcuts() {
  const { undo, redo, canUndo, canRedo } = useSitemapStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      // Detect platform
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      
      // Undo: Ctrl+Z / Cmd+Z
      if (ctrlOrCmd && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      // Redo: Ctrl+Y (Windows/Linux) or Ctrl+Shift+Z / Cmd+Shift+Z (cross-platform)
      else if (
        (ctrlOrCmd && e.key === 'y') || 
        (ctrlOrCmd && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);
}