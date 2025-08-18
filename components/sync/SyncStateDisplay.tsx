'use client';

import React from 'react';
import { useSyncState } from '@/hooks/useSyncState';
import { formatDistanceToNow } from 'date-fns';

export function SyncStateDisplay() {
  const { states, summary, loading, error, refreshStates } = useSyncState();

  if (loading && states.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading sync states: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sync State Summary</h3>
          <button
            onClick={refreshStates}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryItem label="Total" value={summary.total} color="gray" />
          <SummaryItem label="Synced" value={summary.synced} color="green" />
          <SummaryItem label="Pending" value={summary.pending} color="yellow" />
          <SummaryItem label="Syncing" value={summary.syncing} color="blue" />
          <SummaryItem label="Conflicted" value={summary.conflicted} color="orange" />
          <SummaryItem label="Failed" value={summary.failed} color="red" />
        </div>
      </div>

      {/* Detailed States Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Content Type Sync States</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type Key
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conflict
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Sync
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {states.map((state) => (
                <tr key={state.typeKey} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {state.typeKey}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <StatusBadge status={state.syncStatus} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <ConflictBadge status={state.conflictStatus} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {state.lastSyncAt ? (
                      formatDistanceToNow(new Date(state.lastSyncAt), { addSuffix: true })
                    ) : (
                      'Never'
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {state.syncProgress && (
                      <ProgressBar 
                        current={state.syncProgress.currentStep} 
                        total={state.syncProgress.totalSteps} 
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {states.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500">
            No sync states found
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <div className="text-center">
      <div className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs uppercase">{label}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  
  const statusStyles = {
    'in_sync': 'bg-green-100 text-green-800',
    'syncing': 'bg-blue-100 text-blue-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'new': 'bg-purple-100 text-purple-800',
    'modified': 'bg-orange-100 text-orange-800',
    'failed': 'bg-red-100 text-red-800',
    'conflict': 'bg-red-100 text-red-800',
    'deleted': 'bg-gray-100 text-gray-800'
  };

  const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ConflictBadge({ status }: { status: string | null }) {
  if (!status || status === 'none') return null;
  
  const statusStyles = {
    'detected': 'bg-red-100 text-red-800',
    'resolved': 'bg-green-100 text-green-800'
  };

  const style = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = (current / total) * 100;
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">
        {current}/{total}
      </span>
    </div>
  );
}