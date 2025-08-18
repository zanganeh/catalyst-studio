import { useState, useEffect, useCallback } from 'react';

export interface SyncState {
  id: string;
  typeKey: string;
  localHash: string | null;
  remoteHash: string | null;
  lastSyncedHash: string | null;
  lastSyncAt: Date | null;
  syncStatus: string | null;
  conflictStatus: string | null;
  syncProgress: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncStateSummary {
  total: number;
  synced: number;
  pending: number;
  conflicted: number;
  syncing: number;
  failed: number;
}

export interface UseSyncStateReturn {
  states: SyncState[];
  summary: SyncStateSummary;
  loading: boolean;
  error: string | null;
  refreshStates: () => Promise<void>;
  getSyncState: (typeKey: string) => Promise<SyncState | null>;
  updateSyncState: (typeKey: string, state: Partial<SyncState>) => Promise<void>;
  getInterruptedSyncs: () => Promise<string[]>;
  getConflictedTypes: () => Promise<string[]>;
  getPendingSyncTypes: () => Promise<string[]>;
}

export function useSyncState(): UseSyncStateReturn {
  const [states, setStates] = useState<SyncState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/sync/state');
      if (!response.ok) {
        throw new Error('Failed to fetch sync states');
      }
      
      const data = await response.json();
      setStates(data.states || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching sync states:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getSyncState = useCallback(async (typeKey: string): Promise<SyncState | null> => {
    try {
      const response = await fetch(`/api/v1/sync/state?typeKey=${encodeURIComponent(typeKey)}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch sync state');
      }
      
      const data = await response.json();
      return data.state;
    } catch (err) {
      console.error(`Error fetching sync state for ${typeKey}:`, err);
      return null;
    }
  }, []);

  const updateSyncState = useCallback(async (typeKey: string, state: Partial<SyncState>) => {
    try {
      const response = await fetch('/api/v1/sync/state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ typeKey, state })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sync state');
      }
      
      // Refresh states after update
      await fetchStates();
    } catch (err) {
      console.error(`Error updating sync state for ${typeKey}:`, err);
      throw err;
    }
  }, [fetchStates]);

  const getInterruptedSyncs = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/v1/sync/state?status=interrupted');
      if (!response.ok) {
        throw new Error('Failed to fetch interrupted syncs');
      }
      
      const data = await response.json();
      return data.types || [];
    } catch (err) {
      console.error('Error fetching interrupted syncs:', err);
      return [];
    }
  }, []);

  const getConflictedTypes = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/v1/sync/state?status=conflicted');
      if (!response.ok) {
        throw new Error('Failed to fetch conflicted types');
      }
      
      const data = await response.json();
      return data.types || [];
    } catch (err) {
      console.error('Error fetching conflicted types:', err);
      return [];
    }
  }, []);

  const getPendingSyncTypes = useCallback(async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/v1/sync/state?status=pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending sync types');
      }
      
      const data = await response.json();
      return data.types || [];
    } catch (err) {
      console.error('Error fetching pending sync types:', err);
      return [];
    }
  }, []);

  // Calculate summary from states
  const summary: SyncStateSummary = {
    total: states.length,
    synced: states.filter(s => s.syncStatus === 'in_sync').length,
    pending: states.filter(s => s.syncStatus === 'pending' || s.syncStatus === 'new' || s.syncStatus === 'modified').length,
    conflicted: states.filter(s => s.conflictStatus === 'detected').length,
    syncing: states.filter(s => s.syncStatus === 'syncing').length,
    failed: states.filter(s => s.syncStatus === 'failed').length
  };

  // Initial fetch
  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  // Auto-refresh for syncing states
  useEffect(() => {
    if (summary.syncing > 0) {
      const interval = setInterval(fetchStates, 2000);
      return () => clearInterval(interval);
    }
  }, [summary.syncing, fetchStates]);

  return {
    states,
    summary,
    loading,
    error,
    refreshStates: fetchStates,
    getSyncState,
    updateSyncState,
    getInterruptedSyncs,
    getConflictedTypes,
    getPendingSyncTypes
  };
}