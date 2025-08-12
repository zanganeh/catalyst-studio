import { WebsiteContextProvider } from '@/lib/context/website-context';
import { StudioShell } from '@/components/studio/studio-shell';

export default async function StudioLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Handle optional ID parameter - use 'default' if not provided
  const { id } = await params;
  const websiteId = id || 'default';
  
  return (
    <WebsiteContextProvider websiteId={websiteId}>
      <StudioShell>
        {children}
      </StudioShell>
    </WebsiteContextProvider>
  );
}