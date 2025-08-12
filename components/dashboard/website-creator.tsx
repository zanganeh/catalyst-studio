'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AIPromptProcessor } from '@/lib/services/ai-prompt-processor';
import { useToast } from '@/components/ui/use-toast';
import { AIPromptSection } from './ai-prompt-section';

export function WebsiteCreator() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  const handleWebsiteCreation = async (userPrompt: string) => {
    setIsCreating(true);
    
    try {
      const processor = new AIPromptProcessor();
      // Process the prompt first to get metadata
      const processedPrompt = await processor.processPrompt(userPrompt);
      
      // Create website with processed data (reuse processed prompt to avoid double processing)
      const websiteId = await processor.createWebsiteFromPrompt(userPrompt, processedPrompt);
      
      // Store prompt in session for AI panel
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`ai_prompt_${websiteId}`, JSON.stringify({
          original: userPrompt,
          processed: processedPrompt,
          timestamp: Date.now()
        }));
      }
      
      // Show success toast
      toast({
        title: 'Website Created!',
        description: `${processedPrompt.websiteName} is ready for development`,
      });
      
      // Navigate to AI panel with new website
      setTimeout(() => {
        router.push(`/studio/${websiteId}/ai`);
      }, 500);
      
    } catch (error) {
      console.error('Website creation failed:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Unable to create website. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="website-creator">
      <AIPromptSection 
        onWebsiteCreated={handleWebsiteCreation}
        isCreating={isCreating}
      />
    </div>
  );
}