'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Download, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface SyncRecord {
  id: string;
  typeKey: string;
  targetPlatform: string;
  syncDirection: string;
  syncStatus: string;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
}

interface SyncHistoryTableProps {
  typeKey?: string;
  deploymentId?: string;
}

export function SyncHistoryTable({ typeKey, deploymentId }: SyncHistoryTableProps) {
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeKey) params.append('typeKey', typeKey);
      if (deploymentId) params.append('deploymentId', deploymentId);
      if (platform !== 'all') params.append('platform', platform);
      if (status !== 'all') params.append('status', status);
      params.append('limit', '50');
      params.append('offset', (page * 50).toString());
      
      const response = await fetch(`/api/v1/sync/history?${params}`);
      const data = await response.json();
      
      setHistory(data.data || []);
      setHasMore(data.hasMore || false);
      
      // Identify in-progress syncs for polling
      const inProgress = (data.data || [])
        .filter((record: SyncRecord) => record.syncStatus === 'IN_PROGRESS')
        .map((record: SyncRecord) => record.id);
      setPollingIds(new Set(inProgress));
      
    } catch (error) {
      console.error('Failed to fetch sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for in-progress sync status updates
  useEffect(() => {
    if (pollingIds.size === 0) return;
    
    const interval = setInterval(async () => {
      for (const syncId of pollingIds) {
        try {
          const response = await fetch(`/api/v1/sync/${syncId}/status`);
          const data = await response.json();
          
          if (data.status !== 'IN_PROGRESS') {
            // Update the record in history
            setHistory(prev => prev.map(record => 
              record.id === syncId 
                ? { ...record, syncStatus: data.status, completedAt: data.completedAt }
                : record
            ));
            
            // Remove from polling set
            setPollingIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(syncId);
              return newSet;
            });
          }
        } catch (error) {
          console.error(`Failed to poll status for ${syncId}:`, error);
        }
      }
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [pollingIds]);

  useEffect(() => {
    fetchHistory();
  }, [typeKey, deploymentId, platform, status, page]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Convert history to CSV
    const headers = ['Type Key', 'Platform', 'Direction', 'Status', 'Started At', 'Completed At', 'Retries', 'Error'];
    const rows = history.map(record => [
      record.typeKey,
      record.targetPlatform,
      record.syncDirection,
      record.syncStatus,
      new Date(record.startedAt).toLocaleString(),
      record.completedAt ? new Date(record.completedAt).toLocaleString() : '',
      record.retryCount.toString(),
      record.errorMessage || ''
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-history-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PARTIAL':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'IN_PROGRESS':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'SUCCESS': 'default',
      'FAILED': 'destructive',
      'PARTIAL': 'secondary',
      'IN_PROGRESS': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'In progress...';
    
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync History</CardTitle>
        <CardDescription>
          Track all synchronization operations with external systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="optimizely">Optimizely</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>
            
            {typeKey && (
              <Input 
                value={typeKey} 
                disabled 
                className="w-[200px]"
                placeholder="Type Key"
              />
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type Key</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No sync history found
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.typeKey}</TableCell>
                      <TableCell>{record.targetPlatform}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.syncDirection}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.syncStatus)}</TableCell>
                      <TableCell>
                        {formatDuration(record.startedAt, record.completedAt)}
                      </TableCell>
                      <TableCell>{record.retryCount}</TableCell>
                      <TableCell>
                        {new Date(record.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={record.errorMessage || ''}>
                        {record.errorMessage || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPage(p => p + 1)}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for polling sync status
export function useSyncStatus(syncId: string | null) {
  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [progress, setProgress] = useState<number>(0);
  
  useEffect(() => {
    if (!syncId) return;
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/sync/${syncId}/status`);
        const data = await response.json();
        
        setStatus(data.status);
        setProgress(data.progress || 0);
        
        // Stop polling when sync completes
        if (data.status !== 'IN_PROGRESS') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(interval);
  }, [syncId]);
  
  return { status, progress };
}