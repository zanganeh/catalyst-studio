'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface SyncStatus {
  status: 'in_progress' | 'completed' | 'failed' | 'pending' | 'idle';
  progress: number;
  currentStep: string;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    timestamp: string;
  }>;
  validationResults?: {
    passed: boolean;
    errors: number;
    warnings: number;
    details: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  };
}

export function SyncStatusDisplay() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/sync/status');
        if (response.ok) {
          const data = await response.json();
          setSyncStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (!syncStatus) return null;
    
    switch (syncStatus.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = () => {
    if (!syncStatus) return 'secondary';
    
    switch (syncStatus.status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString();
  };

  const calculateDuration = () => {
    if (!syncStatus?.startedAt) return '--';
    const start = new Date(syncStatus.startedAt).getTime();
    const end = syncStatus.completedAt 
      ? new Date(syncStatus.completedAt).getTime() 
      : Date.now();
    const duration = Math.floor((end - start) / 1000);
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No sync status available</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Sync Status</CardTitle>
          </div>
          <Badge variant={getStatusBadgeVariant() as any}>
            {syncStatus.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <CardDescription>
          Real-time synchronization status and progress
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncStatus.status === 'in_progress' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{syncStatus.progress}%</span>
              </div>
              <Progress value={syncStatus.progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Step:</span>
                <p className="font-medium">{syncStatus.currentStep || '--'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Step:</span>
                <p className="font-medium">
                  {syncStatus.totalSteps > 0 
                    ? `${Math.ceil(syncStatus.progress / (100 / syncStatus.totalSteps))} of ${syncStatus.totalSteps}`
                    : '--'}
                </p>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Started:</span>
            <p className="font-medium">{formatTime(syncStatus.startedAt)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>
            <p className="font-medium">{calculateDuration()}</p>
          </div>
          {syncStatus.estimatedCompletion && (
            <div>
              <span className="text-muted-foreground">Est. Completion:</span>
              <p className="font-medium">{formatTime(syncStatus.estimatedCompletion)}</p>
            </div>
          )}
          {syncStatus.completedAt && (
            <div>
              <span className="text-muted-foreground">Completed:</span>
              <p className="font-medium">{formatTime(syncStatus.completedAt)}</p>
            </div>
          )}
        </div>

        {syncStatus.validationResults && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Validation Results</h4>
            <div className="flex gap-4">
              <Badge variant={syncStatus.validationResults.passed ? 'success' : 'destructive'}>
                {syncStatus.validationResults.passed ? 'Passed' : 'Failed'}
              </Badge>
              {syncStatus.validationResults.errors > 0 && (
                <Badge variant="destructive">
                  {syncStatus.validationResults.errors} Errors
                </Badge>
              )}
              {syncStatus.validationResults.warnings > 0 && (
                <Badge variant="secondary">
                  {syncStatus.validationResults.warnings} Warnings
                </Badge>
              )}
            </div>
          </div>
        )}

        {syncStatus.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Errors</h4>
            <div className="space-y-1">
              {syncStatus.errors.map((error, index) => (
                <Alert key={index} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription className="text-sm">
                    {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}