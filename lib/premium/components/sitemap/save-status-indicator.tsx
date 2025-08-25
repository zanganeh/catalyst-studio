'use client';

import React from 'react';
import { useSitemapStore } from '@/lib/premium/stores/sitemap-store';
import { useAutoSave } from '@/lib/premium/hooks/use-auto-save';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  RefreshCw,
  Cloud,
  CloudOff
} from 'lucide-react';

export interface SaveStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * Visual indicator for save status
 * Displays current save state and provides retry functionality
 */
export function SaveStatusIndicator({ 
  className,
  showDetails = false 
}: SaveStatusIndicatorProps) {
  const { saveStatus, errorState } = useSitemapStore();
  const { pendingOperations, retry, hasUnsavedChanges } = useAutoSave();
  
  const getStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saved':
        return hasUnsavedChanges ? <Cloud className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return hasUnsavedChanges ? <CloudOff className="h-4 w-4" /> : <Cloud className="h-4 w-4" />;
    }
  };
  
  const getStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return pendingOperations > 0 ? `Saving ${pendingOperations} changes...` : 'Saving...';
      case 'saved':
        return 'All changes saved';
      case 'error':
        return errorState?.message || 'Save failed';
      default:
        return hasUnsavedChanges ? 'Changes pending' : 'Ready';
    }
  };
  
  const getStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'saved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  const handleRetry = () => {
    if (errorState?.retry) {
      errorState.retry();
    } else {
      retry();
    }
  };
  
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center gap-2',
        'px-3 py-2 rounded-lg border',
        'transition-all duration-300 ease-in-out',
        'shadow-sm',
        getStatusColor(),
        className
      )}
    >
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">
          {getStatusText()}
        </span>
      </div>
      
      {saveStatus === 'error' && (
        <button
          onClick={handleRetry}
          className={cn(
            'ml-2 p-1 rounded hover:bg-red-100',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-red-500'
          )}
          title="Retry save"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}
      
      {showDetails && pendingOperations > 0 && (
        <div className="ml-2 text-xs text-gray-500">
          ({pendingOperations} pending)
        </div>
      )}
    </div>
  );
}

/**
 * Minimal save status badge
 */
export function SaveStatusBadge({ className }: { className?: string }) {
  const { saveStatus } = useSitemapStore();
  const { hasUnsavedChanges } = useAutoSave();
  
  if (saveStatus === 'idle' && !hasUnsavedChanges) {
    return null;
  }
  
  const getBadgeColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'bg-blue-500';
      case 'saved':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };
  
  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full',
        getBadgeColor(),
        saveStatus === 'saving' && 'animate-pulse',
        className
      )}
      title={saveStatus}
    />
  );
}