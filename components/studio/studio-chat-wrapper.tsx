'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const BaseChat = dynamic(() => import('../chat/base-chat'), {
  ssr: false,
  loading: () => (
    <div className="p-4 h-full flex items-center justify-center">
      <div className="text-gray-500 text-center">
        <p className="text-sm">Loading chat...</p>
      </div>
    </div>
  )
});

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

export function StudioChatWrapper() {
  const params = useParams();
  const websiteId = params?.id as string;
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [hasCheckedPrompt, setHasCheckedPrompt] = useState(false);

  useEffect(() => {
    if (!websiteId || hasCheckedPrompt) return;
    
    // Check for initial prompt data in session storage
    const storedPrompt = sessionStorage.getItem(`ai_prompt_${websiteId}`);
    
    if (storedPrompt) {
      try {
        const promptData: InitialPromptData = JSON.parse(storedPrompt);
        
        // Use the user's original prompt as the initial message
        setInitialMessage(promptData.original);
        
        // Remove from session storage after using
        sessionStorage.removeItem(`ai_prompt_${websiteId}`);
      } catch (error) {
        console.error('Failed to parse prompt data:', error);
      }
    }
    
    setHasCheckedPrompt(true);
  }, [websiteId, hasCheckedPrompt]);

  const handleInitialMessageSent = () => {
    console.log('Initial message sent to AI');
  };
  
  return <BaseChat initialMessage={initialMessage || undefined} onInitialMessageSent={handleInitialMessageSent} />;
}