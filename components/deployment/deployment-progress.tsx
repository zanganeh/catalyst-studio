'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DeploymentJob,
  DeploymentLog,
  CMSProvider,
} from '@/lib/deployment/deployment-types';
// Use real sync engine instead of mock service
import { syncEngine } from '@/lib/sync/engine/SyncEngine';

interface DeploymentProgressProps {
  job: DeploymentJob;
  provider: CMSProvider;
  onComplete: (job: DeploymentJob) => void;
}

export function DeploymentProgress({ job, provider, onComplete }: DeploymentProgressProps) {
  const [currentJob, setCurrentJob] = useState<DeploymentJob>(job);
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const deploymentRef = useRef<{ cancel: () => void } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (job.status === 'pending') {
      startDeployment();
    }
    
    return () => {
      if (deploymentRef.current) {
        deploymentRef.current.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [job.id]);

  useEffect(() => {
    if (currentJob.status === 'running' && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (currentJob.status !== 'running' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentJob.status]);

  const startDeployment = async () => {
    const deployment = syncEngine.startDeployment(
      job,
      provider,
      (updatedJob) => {
        setCurrentJob(updatedJob);
        
        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          onComplete(updatedJob);
        }
      }
    );
    
    deploymentRef.current = deployment;
    
    // Set estimated time based on random duration
    setEstimatedTime(Math.floor(Math.random() * 30) + 30); // 30-60 seconds
  };

  const handleCancel = () => {
    if (deploymentRef.current) {
      deploymentRef.current.cancel();
      const cancelledJob: DeploymentJob = {
        ...currentJob,
        status: 'cancelled',
        completedAt: new Date(),
        logs: [
          ...currentJob.logs,
          {
            timestamp: new Date(),
            level: 'warning',
            message: 'Deployment cancelled by user',
          },
        ],
      };
      setCurrentJob(cancelledJob);
      onComplete(cancelledJob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, estimatedTime - elapsedTime);

  const getStatusIcon = () => {
    switch (currentJob.status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (currentJob.status) {
      case 'pending':
        return 'Preparing deployment...';
      case 'running':
        return 'Deployment in progress...';
      case 'completed':
        return 'Deployment completed successfully!';
      case 'failed':
        return 'Deployment failed';
      case 'cancelled':
        return 'Deployment cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getLogIcon = (level: DeploymentLog['level']) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-yellow-400" />;
      default:
        return <CheckCircle className="h-3 w-3 text-green-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {getStatusText()}
            </h3>
            {currentJob.status === 'running' && (
              <p className="text-sm text-white/60">
                Step {Math.min(Math.floor(currentJob.progress / 25) + 1, 4)} of 4
              </p>
            )}
          </div>
        </div>
        
        {currentJob.status === 'running' && (
          <div className="text-right">
            <p className="text-sm text-white/60">Time remaining</p>
            <p className="text-lg font-mono text-white">
              ~{formatTime(remainingTime)}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Progress</span>
          <span className="text-white font-mono">{currentJob.progress}%</span>
        </div>
        <Progress
          value={currentJob.progress}
          className="h-3 bg-white/10"
          indicatorClassName={cn(
            'transition-all duration-500',
            currentJob.status === 'completed' ? 'bg-green-500' :
            currentJob.status === 'failed' ? 'bg-red-500' :
            'bg-gradient-to-r from-[#FF5500] to-[#FF8833]'
          )}
        />
      </div>

      {/* Deployment Steps */}
      <div className="space-y-3">
        {[
          { name: 'Validating configuration', threshold: 0 },
          { name: 'Connecting to CMS', threshold: 25 },
          { name: 'Uploading content', threshold: 50 },
          { name: 'Finalizing deployment', threshold: 75 },
        ].map((step, index) => {
          const isActive = currentJob.progress >= step.threshold && currentJob.progress < (index < 3 ? [25, 50, 75, 100][index + 1] : 100);
          const isComplete = currentJob.progress >= (index < 3 ? [25, 50, 75, 100][index + 1] : 100);
          
          return (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors duration-200',
                isActive && 'bg-white/5 border border-white/10',
                isComplete && 'bg-green-500/10 border border-green-500/30'
              )}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#FF5500]" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-white/20" />
              )}
              <span className={cn(
                'text-sm',
                isComplete ? 'text-green-400' :
                isActive ? 'text-white' :
                'text-white/40'
              )}>
                {step.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Deployment Logs */}
      <div className="rounded-xl bg-black/30 border border-white/10 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">Deployment Logs</h4>
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {currentJob.logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 text-xs"
              >
                {getLogIcon(log.level)}
                <span className="text-white/40 font-mono">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={cn(
                  'flex-1',
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  'text-white/60'
                )}>
                  {log.message}
                </span>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      {currentJob.status === 'running' && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Cancel Deployment
          </Button>
        </div>
      )}

      {currentJob.status === 'failed' && currentJob.error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Deployment Error</p>
              <p className="text-red-400/80 text-sm mt-1">{currentJob.error}</p>
              {currentJob.retryCount !== undefined && currentJob.maxRetries !== undefined && (
                <p className="text-red-400/60 text-xs mt-2">
                  Retry attempt {currentJob.retryCount} of {currentJob.maxRetries}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}