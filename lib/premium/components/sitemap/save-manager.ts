import { Operation, SaveRequest, SaveResponse } from './types';
import { NetworkError, SaveError, serializeError } from './errors';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveManagerCallbacks {
  onStatusChange?: (status: SaveStatus) => void;
  onError?: (error: Error) => void;
  onSaveComplete?: (result: SaveResponse) => void;
}

/**
 * Manages debounced saves with exponential backoff retry
 * Singleton pattern for global save management
 */
class SaveManager {
  private pendingOperations: Operation[] = [];
  private saveTimeout: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly debounceMs = 1000;
  private websiteId: string | null = null;
  private callbacks: SaveManagerCallbacks = {};
  private currentStatus: SaveStatus = 'idle';
  private abortController: AbortController | null = null;
  
  /**
   * Initialize the save manager for a specific website
   */
  initialize(websiteId: string, callbacks?: SaveManagerCallbacks) {
    this.websiteId = websiteId;
    this.callbacks = callbacks || {};
    this.updateStatus('idle');
  }
  
  /**
   * Add an operation to the pending queue
   */
  addOperation(operation: Operation) {
    this.pendingOperations.push(operation);
    this.debounceSave();
  }
  
  /**
   * Add multiple operations at once
   */
  addOperations(operations: Operation[]) {
    this.pendingOperations.push(...operations);
    this.debounceSave();
  }
  
  /**
   * Clear all pending operations
   */
  clearPending() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.pendingOperations = [];
    this.retryCount = 0;
    this.updateStatus('idle');
  }
  
  /**
   * Force immediate save of pending operations
   */
  async saveNow(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    if (this.pendingOperations.length > 0) {
      await this.save();
    }
  }
  
  /**
   * Get current save status
   */
  getStatus(): SaveStatus {
    return this.currentStatus;
  }
  
  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.pendingOperations.length;
  }
  
  private updateStatus(status: SaveStatus) {
    this.currentStatus = status;
    this.callbacks.onStatusChange?.(status);
  }
  
  private debounceSave() {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    // Set new timeout
    this.saveTimeout = setTimeout(() => {
      this.save();
    }, this.debounceMs);
  }
  
  private async save() {
    if (!this.websiteId || this.pendingOperations.length === 0) {
      return;
    }
    
    // Move operations to a local variable and clear pending
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    
    this.updateStatus('saving');
    
    // Cancel any previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Create new abort controller for this request
    this.abortController = new AbortController();
    
    try {
      const response = await fetch('/api/premium/sitemap/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteId: this.websiteId,
          operations
        } as SaveRequest),
        signal: this.abortController.signal
      });
      
      if (!response || !response.ok) {
        if (response) {
          const errorData = await response.json();
          
          // Check if this is a retryable error
          if (errorData.retryable || response.status === 409) {
            throw new SaveError(errorData.error || 'Save failed - retrying');
          }
          
          throw new SaveError(errorData.error || `Save failed: ${response.statusText}`);
        } else {
          throw new NetworkError();
        }
      }
      
      const result: SaveResponse = await response.json();
      
      // Reset retry count on success
      this.retryCount = 0;
      this.updateStatus('saved');
      this.callbacks.onSaveComplete?.(result);
      
      // Auto-reset status after a delay
      setTimeout(() => {
        if (this.currentStatus === 'saved') {
          this.updateStatus('idle');
        }
      }, 2000);
      
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, operations will be in new save
        return;
      }
      
      // Handle network errors
      if (!navigator.onLine || (error instanceof TypeError && error.message.includes('fetch'))) {
        error = new NetworkError();
      }
      
      console.error('Save failed:', error);
      
      // Attempt retry with exponential backoff
      if (this.retryCount < this.maxRetries) {
        const delay = Math.min(2000 * Math.pow(2, this.retryCount), 6000); // 2s, 4s, 6s max
        this.retryCount++;
        
        console.log(`Retrying save in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
        
        // Re-add operations to pending for retry
        this.pendingOperations.unshift(...operations);
        
        setTimeout(() => {
          this.save();
        }, delay);
      } else {
        // Max retries reached
        this.updateStatus('error');
        this.callbacks.onError?.(error as Error);
        
        // Keep operations in pending for manual retry
        this.pendingOperations.unshift(...operations);
      }
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * Manual retry after error
   */
  async retry() {
    this.retryCount = 0;
    this.updateStatus('idle');
    await this.save();
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    if (this.abortController) {
      this.abortController.abort();
    }
    this.pendingOperations = [];
    this.callbacks = {};
  }
}

// Export singleton instance
export const saveManager = new SaveManager();