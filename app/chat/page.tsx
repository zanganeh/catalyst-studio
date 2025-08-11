'use client';

import dynamic from 'next/dynamic';

// Dynamically import the enhanced chat panel to avoid SSR issues
const EnhancedChatPanel = dynamic(() => import('@/components/chat/enhanced-chat-panel'), {
  ssr: false,
  loading: () => <div>Loading enhanced chat...</div>
});

export default function ChatPage() {
  // Always use enhanced chat panel
  return <EnhancedChatPanel />;
}