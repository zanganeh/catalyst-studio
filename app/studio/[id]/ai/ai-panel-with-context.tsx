'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';

interface InitialPromptData {
  original: string;
  processed: {
    websiteName: string;
    description: string;
    category: string;
    suggestedFeatures: string[];
    technicalRequirements: string[];
    targetAudience: string;
  };
  timestamp: number;
}

interface AIPanelWithContextProps {
  children: React.ReactNode;
}

export function AIPanelWithContext({ children }: AIPanelWithContextProps) {
  const params = useParams();
  const websiteId = params?.id as string;
  const [initialPrompt, setInitialPrompt] = useState<InitialPromptData | null>(null);
  const [showContext, setShowContext] = useState(true);
  
  useEffect(() => {
    if (!websiteId) return;
    
    // Retrieve prompt from session storage
    const storedPrompt = sessionStorage.getItem(`ai_prompt_${websiteId}`);
    
    if (storedPrompt) {
      try {
        const promptData = JSON.parse(storedPrompt);
        setInitialPrompt(promptData);
        
        // Clean up after retrieval (one-time use)
        sessionStorage.removeItem(`ai_prompt_${websiteId}`);
        
        // Auto-hide context after 10 seconds
        setTimeout(() => {
          setShowContext(false);
        }, 10000);
      } catch (error) {
        console.error('Failed to parse prompt data:', error);
      }
    }
  }, [websiteId]);
  
  if (!initialPrompt || !showContext) {
    return <>{children}</>;
  }
  
  return (
    <div className="relative h-full">
      {/* Initial Context Banner */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-b border-indigo-800/50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-white">
                  Continuing from your idea
                </h3>
              </div>
              
              <p className="text-gray-300 mb-3 italic">
                &ldquo;{initialPrompt.original}&rdquo;
              </p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs text-gray-400">Suggested features:</span>
                {initialPrompt.processed.suggestedFeatures.map(feature => (
                  <span 
                    key={feature} 
                    className="px-2 py-1 text-xs bg-indigo-900/30 text-indigo-300 rounded-full border border-indigo-800/50"
                  >
                    {feature}
                  </span>
                ))}
              </div>
              
              {initialPrompt.processed.technicalRequirements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400">Technical needs:</span>
                  {initialPrompt.processed.technicalRequirements.map(req => (
                    <span 
                      key={req} 
                      className="px-2 py-1 text-xs bg-purple-900/30 text-purple-300 rounded-full border border-purple-800/50"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-400">
                <span>Category: {initialPrompt.processed.category}</span>
                <span className="mx-2">•</span>
                <span>Target: {initialPrompt.processed.targetAudience}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowContext(false)}
              className="ml-4 p-1 hover:bg-gray-800 rounded transition-colors"
              aria-label="Close context"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="h-[calc(100%-theme(spacing.32))]">
        {children}
      </div>
    </div>
  );
}

// Helper function to populate AI chat with initial context
export function getInitialAIContext(promptData: InitialPromptData): string {
  const context = `
I'm building a ${promptData.processed.category} website called "${promptData.processed.websiteName}".

Description: ${promptData.processed.description}

Key features needed:
${promptData.processed.suggestedFeatures.map(f => `- ${f}`).join('\n')}

Technical requirements:
${promptData.processed.technicalRequirements.map(r => `- ${r}`).join('\n')}

Target audience: ${promptData.processed.targetAudience}

Please help me get started with the development.
  `.trim();
  
  return context;
}