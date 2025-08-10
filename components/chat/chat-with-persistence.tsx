'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { Message } from 'ai';
import { useChatPersistence } from '@/hooks/use-chat-persistence';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatWithPersistenceProps {
  children: ReactNode;
  messages: Message[];
  setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void;
  sessionId?: string;
  enabled?: boolean;
  onMessagesLoaded?: (messages: Message[]) => void;
}

export function ChatWithPersistence({
  children,
  messages,
  setMessages,
  sessionId = 'default',
  enabled = true,
  onMessagesLoaded
}: ChatWithPersistenceProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(true);

  const {
    isLoading,
    isSaving,
    lastSaved,
    saveCount,
    storageStrategy,
    error,
    saveMessages,
    loadMessages,
    clearMessages
  } = useChatPersistence({
    sessionId,
    enabled,
    autoSaveDelay: 500,
    onLoadComplete: (loadedMessages) => {
      if (loadedMessages.length > 0 && setMessages) {
        // Convert our Message format back to AI SDK format
        const aiMessages: Message[] = loadedMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.timestamp ? new Date(msg.timestamp) : undefined
        }));
        
        setMessages(aiMessages);
        onMessagesLoaded?.(aiMessages);
      }
      setIsInitialized(true);
      setTimeout(() => setShowLoadingState(false), 300); // Brief delay for smooth transition
    },
    onLoadError: (err) => {
      console.error('Failed to load persisted messages:', err);
      setIsInitialized(true);
      setShowLoadingState(false);
    }
  });

  // Load messages on mount
  useEffect(() => {
    if (enabled && !isInitialized) {
      loadMessages().then(() => {
        // Messages loaded
      });
    } else if (!enabled) {
      setIsInitialized(true);
      setShowLoadingState(false);
    }
  }, [enabled, isInitialized, loadMessages]);

  // Auto-save messages when they change
  useEffect(() => {
    if (enabled && isInitialized && messages.length > 0) {
      saveMessages(messages);
    }
  }, [enabled, isInitialized, messages, saveMessages]);

  // Show loading state while recovering messages
  if (showLoadingState && enabled) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Skeleton className="h-4 w-48 mx-auto" />
              <Skeleton className="h-3 w-32 mx-auto" />
              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse delay-200" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Recovering conversation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children with persistence active in background
  return (
    <>
      {children}
      
      {/* Persistence Status Indicator (optional, can be hidden) */}
      {enabled && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
          <div className="bg-background/80 backdrop-blur border rounded-lg p-2 text-xs space-y-1 opacity-50">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isSaving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-muted-foreground">
                {storageStrategy} {isSaving && '(saving...)'}
              </span>
            </div>
            {lastSaved && (
              <div className="text-muted-foreground">
                Saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {error && (
              <div className="text-destructive">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// HOC to wrap existing chat components with persistence
export function withChatPersistence<P extends { messages: Message[]; setMessages?: (messages: Message[] | ((messages: Message[]) => Message[])) => void }>(
  Component: React.ComponentType<P>,
  options?: {
    sessionId?: string;
    enabled?: boolean;
  }
) {
  return function ChatWithPersistenceWrapper(props: P) {
    const enabled = options?.enabled ?? true;
    const sessionId = options?.sessionId ?? 'default';

    if (!enabled) {
      return <Component {...props} />;
    }

    return (
      <ChatWithPersistence
        messages={props.messages}
        setMessages={props.setMessages}
        sessionId={sessionId}
        enabled={enabled}
      >
        <Component {...props} />
      </ChatWithPersistence>
    );
  };
}