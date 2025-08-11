'use client';

import React from 'react';
import { Message } from 'ai';
import { ChatWithPersistence } from './chat-with-persistence';

interface ChatPersistenceProps {
  children: React.ReactNode;
  messages: Message[];
  setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  sessionId?: string;
  onMessagesLoaded?: (messages: Message[]) => void;
}

/**
 * Component that enables chat persistence functionality
 */
export function ChatPersistence({
  children,
  messages,
  setMessages,
  sessionId = 'default',
  onMessagesLoaded
}: ChatPersistenceProps) {
  // Persistence is always enabled now
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
 * HOC to add persistence to any chat component
 */
export function withChatPersistence<P extends { 
  messages: Message[]; 
  setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void 
}>(
  Component: React.ComponentType<P>
) {
  return function ChatPersistenceWrapper(props: P) {
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
 * Hook to check if persistence is enabled (always true now)
 */
export function usePersistence() {
  return true;
}