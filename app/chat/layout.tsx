'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { ChatLayoutWrapper } from './layout-wrapper';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log errors to monitoring service in production
        console.error('Chat Error:', error, errorInfo);
      }}
    >
      <ChatLayoutWrapper>
        {children}
      </ChatLayoutWrapper>
    </ErrorBoundary>
  );
}