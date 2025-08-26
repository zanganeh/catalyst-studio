'use client';

import { useState } from 'react';
import { useSitemapStore } from '../../stores/sitemap-store';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'delete' | 'update';
  selectedNodeIds: string[];
}

interface BulkResult {
  type: string;
  totalRequested: number;
  totalSucceeded: number;
  totalFailed: number;
  succeeded: string[];
  failed: Array<{ id: string; error: string }>;
}

export function BulkOperationsDialog({ 
  isOpen, 
  onClose, 
  operation, 
  selectedNodeIds 
}: BulkOperationsDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const { websiteId, nodes, deleteNodes, setSaveStatus } = useSitemapStore();

  if (!isOpen) return null;

  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
  const nodeCount = selectedNodeIds.length;

  const handleConfirm = async () => {
    if (!websiteId) return;
    
    setIsProcessing(true);
    setSaveStatus('saving');
    
    try {
      if (operation === 'delete') {
        const response = await fetch('/api/premium/sitemap/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'DELETE',
            websiteId,
            nodeIds: selectedNodeIds
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Bulk delete failed');
        }

        const bulkResult: BulkResult = await response.json();
        setResult(bulkResult);

        // Update local state for successful deletions
        if (bulkResult.succeeded.length > 0) {
          deleteNodes(bulkResult.succeeded);
        }

        setSaveStatus(bulkResult.failed.length === 0 ? 'saved' : 'error');
      }
      
    } catch (error) {
      console.error('Bulk operation failed:', error);
      setSaveStatus('error');
      setResult({
        type: operation.toUpperCase(),
        totalRequested: nodeCount,
        totalSucceeded: 0,
        totalFailed: nodeCount,
        succeeded: [],
        failed: selectedNodeIds.map(id => ({
          id,
          error: error instanceof Error ? error.message : 'Operation failed'
        }))
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onClose();
  };

  const getOperationTitle = () => {
    switch (operation) {
      case 'delete':
        return 'Delete Items';
      case 'update':
        return 'Update Items';
      default:
        return 'Bulk Operation';
    }
  };

  const getOperationMessage = () => {
    switch (operation) {
      case 'delete':
        return `Are you sure you want to delete ${nodeCount} item${nodeCount === 1 ? '' : 's'}?`;
      case 'update':
        return `Update ${nodeCount} item${nodeCount === 1 ? '' : 's'}?`;
      default:
        return `Process ${nodeCount} item${nodeCount === 1 ? '' : 's'}?`;
    }
  };

  const getConfirmButtonText = () => {
    if (isProcessing) {
      return operation === 'delete' ? 'Deleting...' : 'Updating...';
    }
    return operation === 'delete' ? 'Delete' : 'Update';
  };

  const getConfirmButtonClass = () => {
    const baseClasses = "px-4 py-2 rounded text-white font-medium disabled:opacity-50";
    switch (operation) {
      case 'delete':
        return `${baseClasses} bg-red-600 hover:bg-red-700`;
      default:
        return `${baseClasses} bg-blue-600 hover:bg-blue-700`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{getOperationTitle()}</h2>
        
        {!result ? (
          <>
            <p className="text-gray-600 mb-4">{getOperationMessage()}</p>
            
            {nodeCount <= 10 && (
              <div className="mb-4">
                <h3 className="font-medium mb-2">Selected items:</h3>
                <ul className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                  {selectedNodes.map((node) => (
                    <li key={node.id} className="py-1">
                      • {node.data?.label || 'Unnamed item'}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {operation === 'delete' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. All selected items and their children will be permanently deleted.
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className={getConfirmButtonClass()}
              >
                {getConfirmButtonText()}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Operation Complete</h3>
              <div className="text-sm space-y-1">
                <p><strong>Total requested:</strong> {result.totalRequested}</p>
                <p className="text-green-600"><strong>Succeeded:</strong> {result.totalSucceeded}</p>
                {result.totalFailed > 0 && (
                  <p className="text-red-600"><strong>Failed:</strong> {result.totalFailed}</p>
                )}
              </div>
            </div>

            {result.failed.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-red-600">Failed items:</h4>
                <ul className="text-sm text-red-600 max-h-32 overflow-y-auto space-y-1">
                  {result.failed.map((failure) => {
                    const node = nodes.find(n => n.id === failure.id);
                    return (
                      <li key={failure.id} className="py-1">
                        • {node?.data?.label || failure.id}: {failure.error}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BulkOperationsDialog;