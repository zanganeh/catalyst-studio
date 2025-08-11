'use client';

import EnhancedChatPanel from '@/components/chat/enhanced-chat-panel';

export default function TestEnhancedChat() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 p-4 border rounded">
        <h1 className="text-2xl font-bold mb-4">Enhanced Chat Panel Test</h1>
        <div className="mb-4 text-sm text-gray-600">
          <p>Testing the enhanced chat panel with all features enabled</p>
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Chat Panel:</h2>
        <EnhancedChatPanel className="test-enhanced-chat" />
      </div>
    </div>
  );
}