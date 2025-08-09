import { Metadata } from 'next';
import { ChatLayoutClient } from './layout-client';

export const metadata: Metadata = {
  title: 'Chat - Catalyst Studio',
  description: 'AI-powered chat assistant for website creation',
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatLayoutClient>
      {children}
    </ChatLayoutClient>
  );
}