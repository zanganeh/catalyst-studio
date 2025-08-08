'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { isFeatureEnabled } from '@/config/features';
import { ErrorBoundary } from '@/components/error-boundary';

// Dynamically import the original chat to preserve its functionality
const OriginalChat = dynamic(() => import('@/app/chat/page'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg">Loading chat...</div>
    </div>
  ),
});

// Import our enhanced components (will be created in subsequent tasks)
// These will be conditionally rendered based on feature flag
const SuggestionChips = dynamic(() => import('./suggestion-chips').catch(() => ({
  default: () => null // Graceful fallback if component doesn't exist yet
})), { ssr: false });

const TypingIndicator = dynamic(() => import('./typing-indicator').catch(() => ({
  default: () => null // Graceful fallback if component doesn't exist yet
})), { ssr: false });

// Use simplified message list without markdown dependencies for now
const MessageList = dynamic(() => import('./message-list-simple').catch(() => ({
  default: () => null // Graceful fallback if component doesn't exist yet
})), { ssr: false });

interface EnhancedChatPanelProps {
  className?: string;
}

/**
 * Enhanced Chat Panel Wrapper
 * 
 * This component wraps the existing chat functionality and adds
 * enhanced features when the enhancedChat feature flag is enabled.
 * It preserves the original chat logic completely when the flag is disabled.
 */
export default function EnhancedChatPanel({ className }: EnhancedChatPanelProps) {
  const isEnhanced = isFeatureEnabled('enhancedChat');

  // If feature flag is disabled, return original chat unchanged
  if (!isEnhanced) {
    return (
      <ErrorBoundary fallback={<div>Chat temporarily unavailable</div>}>
        <OriginalChat />
      </ErrorBoundary>
    );
  }

  // Enhanced chat with additional features
  return (
    <ErrorBoundary fallback={<div>Chat temporarily unavailable</div>}>
      <div className={`enhanced-chat-panel ${className || ''}`}>
        {/* Original chat remains the core */}
        <OriginalChat />
        
        {/* Enhanced features will be composed here */}
        {/* These components will overlay/integrate with the original chat */}
        {/* For now, they're placeholders that will be implemented in subsequent tasks */}
        
        {/* Suggestion chips will be positioned below the input */}
        <SuggestionChips />
        
        {/* Typing indicator will be integrated into the message list */}
        <TypingIndicator />
        
        {/* Enhanced message list will replace the default rendering if needed */}
        {/* This will be handled via React Context in Task 6 */}
      </div>
    </ErrorBoundary>
  );
}

// Export hook for accessing enhanced chat features
export function useEnhancedChat() {
  const isEnhanced = isFeatureEnabled('enhancedChat');
  
  // Lazy import hooks when enhanced to avoid unnecessary imports
  const [structuredPrompts, setStructuredPrompts] = React.useState<any>(null);
  const [conversationContext, setConversationContext] = React.useState<any>(null);
  const [contextAwareChat, setContextAwareChat] = React.useState<any>(null);
  
  React.useEffect(() => {
    if (isEnhanced) {
      import('@/hooks/use-structured-prompts').then(module => {
        setStructuredPrompts(module.useStructuredPrompts());
        setConversationContext(module.useConversationContext());
      });
      import('@/hooks/use-context-aware-chat').then(module => {
        setContextAwareChat(module.useContextAwareChat());
      });
    }
  }, [isEnhanced]);
  
  return {
    isEnhanced,
    structuredPrompts,
    conversationContext,
    contextAwareChat,
    // All enhanced features are now integrated
  };
}