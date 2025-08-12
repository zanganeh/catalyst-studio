'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  CMSProvider,
  CMSProviderId,
  ConnectionStatus,
  CMSProviderConfig,
} from '@/lib/deployment/deployment-types';
import {
  CMS_PROVIDERS,
  getProviderConfigFields,
  validateProviderConfig,
} from '@/lib/deployment/cms-providers';

interface CMSProviderSelectorProps {
  onProviderSelect: (provider: CMSProvider) => void;
  selectedProviderId?: CMSProviderId;
}

const STORAGE_KEY = 'cms-provider-configs';
const CONNECTION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export function CMSProviderSelector({ onProviderSelect, selectedProviderId }: CMSProviderSelectorProps) {
  const [providers, setProviders] = useState<CMSProvider[]>([]);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CMSProviderId | null>(null);
  const [config, setConfig] = useState<CMSProviderConfig>({});
  const [configErrors, setConfigErrors] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadProviderConfigs();
  }, []);

  const loadProviderConfigs = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const configs = stored ? JSON.parse(stored) : {};
    
    const loadedProviders: CMSProvider[] = Object.entries(CMS_PROVIDERS).map(([id, provider]) => {
      const savedConfig = configs[id] || {};
      const lastConnected = savedConfig.lastConnected ? new Date(savedConfig.lastConnected) : undefined;
      const connectionExpiry = savedConfig.connectionExpiry ? new Date(savedConfig.connectionExpiry) : undefined;
      
      let connectionStatus: ConnectionStatus = 'disconnected';
      if (lastConnected && connectionExpiry && connectionExpiry > new Date()) {
        connectionStatus = 'connected';
      } else if (savedConfig.config && Object.keys(savedConfig.config).length > 0) {
        connectionStatus = 'disconnected';
      }
      
      return {
        ...provider,
        config: savedConfig.config || {},
        connectionStatus,
        lastConnected,
        connectionExpiry,
      };
    });
    
    setProviders(loadedProviders);
  };

  const saveProviderConfig = (providerId: CMSProviderId, providerConfig: CMSProviderConfig, connected: boolean) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const configs = stored ? JSON.parse(stored) : {};
    
    configs[providerId] = {
      config: providerConfig,
      lastConnected: connected ? new Date().toISOString() : configs[providerId]?.lastConnected,
      connectionExpiry: connected ? new Date(Date.now() + CONNECTION_EXPIRY_MS).toISOString() : configs[providerId]?.connectionExpiry,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    loadProviderConfigs();
  };

  const handleProviderClick = (providerId: CMSProviderId) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider?.connectionStatus === 'connected') {
      onProviderSelect(provider);
    } else {
      setSelectedProvider(providerId);
      setConfig({});
      setConfigErrors([]);
      setConfigModalOpen(true);
    }
  };

  const handleConfigSubmit = async () => {
    if (!selectedProvider) return;
    
    const validation = validateProviderConfig(selectedProvider, config as Record<string, string>);
    if (!validation.valid) {
      setConfigErrors(validation.errors);
      return;
    }
    
    setIsConnecting(true);
    setConfigErrors([]);
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate random connection success (90% success rate)
    const connectionSuccessful = Math.random() > 0.1;
    
    if (connectionSuccessful) {
      saveProviderConfig(selectedProvider, config, true);
      const provider = providers.find(p => p.id === selectedProvider);
      if (provider) {
        onProviderSelect({
          ...provider,
          config,
          connectionStatus: 'connected',
          lastConnected: new Date(),
          connectionExpiry: new Date(Date.now() + CONNECTION_EXPIRY_MS),
        });
      }
      setConfigModalOpen(false);
    } else {
      setConfigErrors(['Failed to connect to the CMS. Please check your credentials and try again.']);
    }
    
    setIsConnecting(false);
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <X className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Error';
      default:
        return 'Not Connected';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <motion.div
            key={provider.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              onClick={() => handleProviderClick(provider.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProviderClick(provider.id);
                }
              }}
              className={cn(
                'relative w-full p-6 rounded-xl border transition-all duration-200 cursor-pointer',
                'bg-gradient-to-br from-white/5 to-white/10',
                'backdrop-blur-md shadow-lg',
                'hover:from-white/10 hover:to-white/15',
                'hover:shadow-xl hover:border-white/20',
                selectedProviderId === provider.id && 'ring-2 ring-[#FF5500] border-[#FF5500]',
                provider.connectionStatus === 'connected' ? 'border-green-500/50' : 'border-white/10'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/80">
                    {provider.name[0]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(provider.connectionStatus)}
                  <span className="text-xs text-white/60">
                    {getStatusText(provider.connectionStatus)}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">
                {provider.name}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                {provider.description}
              </p>
              
              {provider.connectionStatus === 'connected' && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-400">Ready to deploy</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider(provider.id);
                      setConfig(provider.config);
                      setConfigErrors([]);
                      setConfigModalOpen(true);
                    }}
                    className="h-6 px-2"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {provider.connectionStatus === 'disconnected' && (
                <span className="text-xs text-white/40">Click to configure</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {configModalOpen && selectedProvider && (
          <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
            <DialogContent className="sm:max-w-[500px] bg-[#212121]/95 backdrop-blur-xl border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Configure {CMS_PROVIDERS[selectedProvider].name}
                </DialogTitle>
                <DialogDescription className="text-white/60">
                  Enter your {CMS_PROVIDERS[selectedProvider].name} credentials to enable deployment.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {getProviderConfigFields(selectedProvider).map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="text-white/80">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={config[field.name] || ''}
                      onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                ))}
                
                {configErrors.length > 0 && (
                  <Alert className="bg-red-500/10 border-red-500/30">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-400">
                      {configErrors.map((error, idx) => (
                        <div key={idx}>{error}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfigModalOpen(false)}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfigSubmit}
                  disabled={isConnecting}
                  className="bg-[#FF5500] text-white hover:bg-[#FF5500]/80"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}