'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import dynamic from 'next/dynamic';
import { AIPanelWithContext } from './ai-panel-with-context';

// Dynamically import the chat page (AI panel)
const ChatPage = dynamic(() => import('../../../chat/page'), {
  loading: () => (
    <div className="p-6">
      <div className="text-gray-400">Loading AI panel...</div>
    </div>
  )
});

export default function AIPage() {
  const { website, websiteMetadata, isLoading, error } = useWebsiteContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website context...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Error Loading Website</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Render the chat/AI page with website context and initial prompt support
  return (
    <AIPanelWithContext>
      <div className="h-full">
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <h1 className="text-xl font-bold text-white">AI Assistant</h1>
          <p className="text-sm text-gray-400 mt-1">
            Context: {websiteMetadata?.name || 'Untitled Website'}
          </p>
        </div>
        <ChatPage />
      </div>
    </AIPanelWithContext>
  );
}