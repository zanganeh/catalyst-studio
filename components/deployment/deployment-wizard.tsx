'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CMSProviderSelector } from './cms-provider-selector';
import { DeploymentProgress } from './deployment-progress';
import { ContentMapping } from './content-mapping';
import {
  CMSProvider,
  DeploymentJob,
  DeploymentStatus,
} from '@/lib/deployment/deployment-types';

export type DeploymentStep = 'provider' | 'mapping' | 'deploying' | 'complete';

interface DeploymentWizardProps {
  onComplete?: (job: DeploymentJob) => void;
  onCancel?: () => void;
}

const STEPS: Array<{ id: DeploymentStep; label: string; description: string }> = [
  { id: 'provider', label: 'Select Provider', description: 'Choose your CMS platform' },
  { id: 'mapping', label: 'Content Mapping', description: 'Map content to CMS fields' },
  { id: 'deploying', label: 'Deploy', description: 'Deploy content to CMS' },
  { id: 'complete', label: 'Complete', description: 'Deployment successful' },
];

export function DeploymentWizard({ onComplete, onCancel }: DeploymentWizardProps) {
  const [currentStep, setCurrentStep] = useState<DeploymentStep>('provider');
  const [selectedProvider, setSelectedProvider] = useState<CMSProvider | null>(null);
  const [deploymentJob, setDeploymentJob] = useState<DeploymentJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleProviderSelect = useCallback((provider: CMSProvider) => {
    setSelectedProvider(provider);
    setError(null);
  }, []);

  const handleNextStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      const nextStep = STEPS[currentIndex + 1].id;
      
      if (nextStep === 'deploying' && selectedProvider) {
        // Start deployment when moving to deploying step
        const job: DeploymentJob = {
          id: `deploy-${Date.now()}`,
          providerId: selectedProvider.id,
          status: 'pending',
          progress: 0,
          startedAt: new Date(),
          logs: [],
          retryCount: 0,
          maxRetries: 3,
        };
        setDeploymentJob(job);
      }
      
      setCurrentStep(nextStep);
    }
  }, [currentStep, selectedProvider]);

  const handlePreviousStep = useCallback(() => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  const handleDeploymentComplete = useCallback((job: DeploymentJob) => {
    setDeploymentJob(job);
    if (job.status === 'completed') {
      setCurrentStep('complete');
      onComplete?.(job);
    } else if (job.status === 'failed') {
      setError(job.error || 'Deployment failed');
    }
  }, [onComplete]);

  const handleRetry = useCallback(() => {
    if (deploymentJob && selectedProvider) {
      const retryJob: DeploymentJob = {
        ...deploymentJob,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
        logs: [],
        retryCount: (deploymentJob.retryCount || 0) + 1,
      };
      setDeploymentJob(retryJob);
      setError(null);
      setCurrentStep('deploying');
    }
  }, [deploymentJob, selectedProvider]);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: currentStepIndex === index ? 1.1 : 1,
                    backgroundColor: 
                      currentStepIndex > index ? '#00AA55' :
                      currentStepIndex === index ? '#FF5500' : 
                      'rgba(255,255,255,0.1)',
                  }}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'border-2 transition-colors duration-200',
                    currentStepIndex > index ? 'border-green-500' :
                    currentStepIndex === index ? 'border-[#FF5500]' :
                    'border-white/20'
                  )}
                >
                  {currentStepIndex > index ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                  )}
                </motion.div>
                <span className={cn(
                  'mt-2 text-xs font-medium',
                  currentStepIndex === index ? 'text-white' : 'text-white/60'
                )}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2',
                  currentStepIndex > index ? 'bg-green-500' : 'bg-white/10'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px]"
        >
          {/* Provider Selection Step */}
          {currentStep === 'provider' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Select Your CMS Provider
                </h2>
                <p className="text-white/60">
                  Choose the content management system you want to deploy to
                </p>
              </div>
              
              <CMSProviderSelector
                onProviderSelect={handleProviderSelect}
                selectedProviderId={selectedProvider?.id}
              />
              
              {selectedProvider && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg bg-green-500/10 border border-green-500/30"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-green-400">
                      {selectedProvider.name} selected and connected
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Content Mapping Step */}
          {currentStep === 'mapping' && selectedProvider && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Content Mapping
                </h2>
                <p className="text-white/60">
                  Review and map your content to {selectedProvider.name} fields
                </p>
              </div>
              
              <ContentMapping 
                providerId={selectedProvider.id}
                onMappingComplete={(types) => {
                  console.log(`Mapped ${types.length} content types for sync`);
                }}
              />
            </div>
          )}

          {/* Deployment Step */}
          {currentStep === 'deploying' && deploymentJob && selectedProvider && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Deploying to {selectedProvider.name}
                </h2>
                <p className="text-white/60">
                  Your content is being deployed
                </p>
              </div>
              
              <DeploymentProgress
                job={deploymentJob}
                provider={selectedProvider}
                onComplete={handleDeploymentComplete}
              />
            </div>
          )}

          {/* Completion Step */}
          {currentStep === 'complete' && deploymentJob && selectedProvider && (
            <div className="space-y-6">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white mb-2">
                  Deployment Successful!
                </h2>
                <p className="text-white/60 mb-6">
                  Your content has been deployed to {selectedProvider.name}
                </p>
                
                <div className="p-6 rounded-xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 text-left">
                  <h3 className="text-lg font-semibold text-white mb-4">Deployment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60">Provider</span>
                      <span className="text-white">{selectedProvider.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Deployment ID</span>
                      <span className="text-white font-mono text-sm">{deploymentJob.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Duration</span>
                      <span className="text-white">
                        {deploymentJob.completedAt ? 
                          `${Math.round((deploymentJob.completedAt.getTime() - deploymentJob.startedAt.getTime()) / 1000)}s` :
                          'N/A'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className="text-green-400">Completed</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Button
                      variant="link"
                      className="text-blue-400 hover:text-blue-300 p-0"
                    >
                      View deployed content →
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400">{error}</p>
              {deploymentJob && deploymentJob.retryCount! < deploymentJob.maxRetries! && (
                <Button
                  variant="link"
                  onClick={handleRetry}
                  className="text-red-300 hover:text-red-200 p-0 mt-2"
                >
                  Retry deployment ({deploymentJob.maxRetries! - deploymentJob.retryCount!} attempts remaining)
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={currentStep === 'provider' ? onCancel : handlePreviousStep}
          disabled={currentStep === 'deploying'}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          {currentStep === 'provider' ? 'Cancel' : 'Previous'}
        </Button>
        
        {currentStep !== 'complete' && currentStep !== 'deploying' && (
          <Button
            onClick={handleNextStep}
            disabled={!selectedProvider && currentStep === 'provider'}
            className="bg-[#FF5500] text-white hover:bg-[#FF5500]/80"
          >
            {currentStep === 'mapping' ? 'Start Deployment' : 'Next'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        
        {currentStep === 'complete' && (
          <Button
            onClick={() => {
              setCurrentStep('provider');
              setSelectedProvider(null);
              setDeploymentJob(null);
              setError(null);
            }}
            className="bg-[#FF5500] text-white hover:bg-[#FF5500]/80"
          >
            Deploy Again
          </Button>
        )}
      </div>
    </div>
  );
}