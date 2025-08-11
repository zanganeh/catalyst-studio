'use client';

import { useState, useEffect } from 'react';
import { isFeatureEnabled, enableFeature, disableFeature } from '@/config/features-stub';
import EnhancedChatPanel from '@/components/chat/enhanced-chat-panel';

export default function TestEnhancedChat() {
  const [flagStatus, setFlagStatus] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFlagStatus(isFeatureEnabled('enhancedChat'));
  }, []);

  const toggleFeature = () => {
    if (flagStatus) {
      disableFeature('enhancedChat');
      setFlagStatus(false);
    } else {
      enableFeature('enhancedChat');
      setFlagStatus(true);
    }
    // Force reload to apply changes
    window.location.reload();
  };

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 p-4 border rounded">
        <h1 className="text-2xl font-bold mb-4">Enhanced Chat Panel Test</h1>
        <div className="mb-4">
          <p>Feature Flag Status: <strong>{flagStatus ? 'ENABLED' : 'DISABLED'}</strong></p>
          <button 
            onClick={toggleFeature}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Feature Flag
          </button>
        </div>
        <div className="mb-4 text-sm text-gray-600">
          <p>When DISABLED: Shows original chat only</p>
          <p>When ENABLED: Shows enhanced chat with additional features</p>
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Chat Panel:</h2>
        <EnhancedChatPanel className="test-enhanced-chat" />
      </div>
    </div>
  );
}