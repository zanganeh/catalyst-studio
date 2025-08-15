'use client';

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  History, 
  Settings,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { DeploymentWizard } from '@/components/deployment/deployment-wizard';
import { DeploymentHistory } from '@/components/deployment/deployment-history';
import { DeploymentResults } from '@/components/deployment/deployment-results';
import { CMSProviderSelector } from '@/components/deployment/cms-provider-selector';
import { DeploymentErrorBoundary } from '@/components/deployment/deployment-error-boundary';
import {
  DeploymentJob,
  CMSProvider,
  DeploymentMetrics,
} from '@/lib/deployment/deployment-types';
import { mockDeploymentService } from '@/lib/deployment/mock-deployment-service';
import { useRouter, useParams, usePathname } from 'next/navigation';

function DeploymentPageContent() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // Extract website ID from params or pathname
  const websiteId = useMemo(() => {
    if (params?.id && typeof params.id === 'string') {
      return params.id;
    }
    // Extract ID from pathname if params not available
    const match = pathname.match(/\/studio\/([^\/]+)/);
    return match ? match[1] : 'default';
  }, [params, pathname]);
  const [activeTab, setActiveTab] = useState('deploy');
  const [lastDeployment, setLastDeployment] = useState<{
    job: DeploymentJob;
    provider: CMSProvider;
    metrics?: DeploymentMetrics;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleDeploymentComplete = (job: DeploymentJob) => {
    // Generate mock metrics for completed deployments
    const metrics: DeploymentMetrics | undefined = job.status === 'completed' ? {
      timeTaken: job.completedAt ? job.completedAt.getTime() - job.startedAt.getTime() : 0,
      contentItemsProcessed: Math.floor(Math.random() * 50) + 10,
      bytesTransferred: Math.floor(Math.random() * 10485760) + 1048576, // 1-10 MB
      successRate: 0.95 + Math.random() * 0.05, // 95-100% success rate
    } : undefined;

    // Find the provider (simplified - in real app would track this better)
    const provider: CMSProvider = {
      id: job.providerId,
      name: job.providerId.charAt(0).toUpperCase() + job.providerId.slice(1),
      description: 'CMS Provider',
      logo: `/images/cms/${job.providerId}-logo.svg`,
      connectionStatus: 'connected',
      config: {},
    };

    setLastDeployment({ job, provider, metrics });
    setShowResults(true);
    
    // Show toast notification (simulated)
    // TODO: Replace with proper toast notification system
    if (job.status === 'completed') {
      // Success notification will be handled by toast component
    } else if (job.status === 'failed') {
      // Error notification will be handled by toast component
    }
  };

  const handleRedeploy = (job: DeploymentJob) => {
    setShowResults(false);
    setActiveTab('deploy');
    // The wizard will handle the re-deployment
  };

  const handleRetry = () => {
    if (lastDeployment) {
      const retryDeployment = mockDeploymentService.retryDeployment(
        lastDeployment.job,
        lastDeployment.provider,
        (updatedJob) => {
          handleDeploymentComplete(updatedJob);
        }
      );
    }
  };

  const handleExportLogs = () => {
    if (lastDeployment) {
      const logs = lastDeployment.job.logs.map(log => 
        `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] ${log.message}`
      ).join('\n');
      
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deployment-${lastDeployment.job.id}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">CMS Deployment</h1>
            <p className="text-gray-400 text-sm mt-1">
              Deploy your website content to various CMS platforms
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/studio/${websiteId}/development`)}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Development
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {showResults && lastDeployment ? (
          <div className="max-w-4xl mx-auto">
            <DeploymentResults
              job={lastDeployment.job}
              provider={lastDeployment.provider}
              metrics={lastDeployment.metrics}
              onRetry={lastDeployment.job.status === 'failed' ? handleRetry : undefined}
              onViewDetails={() => setActiveTab('history')}
              onExportLogs={handleExportLogs}
            />
            
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => setShowResults(false)}
                className="bg-[#FF5500] text-white hover:bg-[#FF5500]/80"
              >
                <Rocket className="mr-2 h-4 w-4" />
                New Deployment
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                  setActiveTab('history');
                }}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <History className="mr-2 h-4 w-4" />
                View History
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-white/5">
              <TabsTrigger 
                value="deploy" 
                className="data-[state=active]:bg-[#FF5500] data-[state=active]:text-white"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Deploy
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="data-[state=active]:bg-[#FF5500] data-[state=active]:text-white"
              >
                <History className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                className="data-[state=active]:bg-[#FF5500] data-[state=active]:text-white"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="deploy" className="mt-8">
              <DeploymentWizard
                websiteId={websiteId}
                onComplete={handleDeploymentComplete}
                onCancel={() => router.push(`/studio/${websiteId}/development`)}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <DeploymentHistory onRedeploy={handleRedeploy} />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">
                    CMS Provider Settings
                  </h2>
                  <p className="text-white/60 mb-6">
                    Manage your CMS provider connections and configurations
                  </p>
                  
                  <CMSProviderSelector
                    onProviderSelect={(provider) => {
                      // Provider configuration handled internally
                    }}
                  />
                </div>
                
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Deployment Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Auto-retry failed deployments</p>
                          <p className="text-white/60 text-sm mt-1">
                            Automatically retry deployments up to 3 times
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#FF5500] focus:ring-[#FF5500]"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">Email notifications</p>
                          <p className="text-white/60 text-sm mt-1">
                            Send email when deployment completes
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-[#FF5500] focus:ring-[#FF5500]"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        mockDeploymentService.clearHistory();
                        window.location.reload();
                      }}
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear All Data
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default function DeploymentPage() {
  // TODO: Remove test mode after fixing E2E test environment hydration issues
  // This is a temporary workaround for Playwright tests with client-side routing
  if (typeof window !== 'undefined' && window.location.search.includes('test=true')) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">CMS Deployment</h1>
          <p className="text-gray-400 text-sm mt-1">
            Deploy your website content to various CMS platforms
          </p>
        </div>
        <div className="flex-1 p-6">
          <DeploymentErrorBoundary fallbackMessage="The deployment interface encountered an error. Please try refreshing the page.">
            <DeploymentPageContent />
          </DeploymentErrorBoundary>
        </div>
      </div>
    );
  }
  
  return (
    <DeploymentErrorBoundary fallbackMessage="The deployment interface encountered an error. Please try refreshing the page.">
      <DeploymentPageContent />
    </DeploymentErrorBoundary>
  );
}