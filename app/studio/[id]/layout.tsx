import { WebsiteContextProvider } from '@/lib/context/website-context';
import { StudioShell } from '@/components/studio/studio-shell';

export default function StudioLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  // Handle optional ID parameter - use 'default' if not provided
  const websiteId = params.id || 'default';
  
  return (
    <WebsiteContextProvider websiteId={websiteId}>
      <StudioShell>
        {children}
      </StudioShell>
    </WebsiteContextProvider>
  );
}