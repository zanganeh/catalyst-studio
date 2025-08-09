'use client';

import { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/config/features';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const BaseChat = dynamic(() => import('@/components/chat/base-chat'), {
  ssr: false,
  loading: () => <div>Loading chat...</div>
});

const EnhancedChatPanel = dynamic(() => import('@/components/chat/enhanced-chat-panel'), {
  ssr: false,
  loading: () => <div>Loading enhanced chat...</div>
});

export default function ChatPage() {
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUseEnhanced(isFeatureEnabled('enhancedChat'));
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Return enhanced version if feature flag is enabled
  if (useEnhanced) {
    return <EnhancedChatPanel />;
  }

  // Return base chat for normal mode
  return <BaseChat />;
}