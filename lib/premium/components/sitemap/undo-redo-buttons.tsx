'use client';

import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSitemapStore } from '../../stores/sitemap-store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UndoRedoButtonsProps {
  className?: string;
  showToasts?: boolean;
}

export function UndoRedoButtons({ className, showToasts = false }: UndoRedoButtonsProps) {
  const { undo, redo, canUndo, canRedo } = useSitemapStore((state) => ({
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo
  }));
  
  // Detect platform for keyboard shortcut display
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const undoShortcut = isMac ? '⌘Z' : 'Ctrl+Z';
  const redoShortcut = isMac ? '⌘⇧Z' : 'Ctrl+Y';
  
  const handleUndo = () => {
    if (canUndo) {
      undo();
      if (showToasts) {
        toast.info('Action undone', { duration: 1500 });
      }
    }
  };
  
  const handleRedo = () => {
    if (canRedo) {
      redo();
      if (showToasts) {
        toast.info('Action redone', { duration: 1500 });
      }
    }
  };
  
  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUndo}
              disabled={!canUndo}
              className="h-8 w-8"
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Undo
              <span className="ml-2 text-xs text-muted-foreground">
                {undoShortcut}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRedo}
              disabled={!canRedo}
              className="h-8 w-8"
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Redo
              <span className="ml-2 text-xs text-muted-foreground">
                {redoShortcut}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}