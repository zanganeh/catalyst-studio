'use client';

import React from 'react';
import { Message } from 'ai';
import { ChatWithPersistence } from './chat-with-persistence';
import { isFeatureEnabled } from '@/config/features-stub';

interface FeatureFlaggedChatPersistenceProps {
  children: React.ReactNode;
  messages: Message[];
  setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  sessionId?: string;
  onMessagesLoaded?: (messages: Message[]) => void;
}

/**
 * Wrapper component that checks the projectPersistence feature flag
 * before enabling chat persistence functionality
 */
export function FeatureFlaggedChatPersistence({
  children,
  messages,
  setMessages,
  sessionId = 'default',
  onMessagesLoaded
}: FeatureFlaggedChatPersistenceProps) {
  const isPersistenceEnabled = isFeatureEnabled('projectPersistence');

  if (!isPersistenceEnabled) {
    // Feature is disabled, render children directly without persistence
    return <>{children}</>;
  }

  // Feature is enabled, wrap with persistence
  return (
    <ChatWithPersistence
      messages={messages}
      setMessages={setMessages}
      sessionId={sessionId}
      enabled={true}
      onMessagesLoaded={onMessagesLoaded}
    >
      {children}
    </ChatWithPersistence>
  );
}

/**
 * HOC to add feature-flagged persistence to any chat component
 */
export function withFeatureFlaggedPersistence<P extends { 
  messages: Message[]; 
  setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void 
}>(
  Component: React.ComponentType<P>
) {
  return function FeatureFlaggedPersistenceWrapper(props: P) {
    const isPersistenceEnabled = isFeatureEnabled('projectPersistence');

    if (!isPersistenceEnabled) {
      return <Component {...props} />;
    }

    return (
      <ChatWithPersistence
        messages={props.messages}
        setMessages={props.setMessages}
        sessionId="default"
        enabled={true}
      >
        <Component {...props} />
      </ChatWithPersistence>
    );
  };
}

/**
 * Hook to check if persistence is enabled
 */
export function usePersistenceFeatureFlag() {
  return isFeatureEnabled('projectPersistence');
}