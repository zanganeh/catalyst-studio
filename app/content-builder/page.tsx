'use client';

import { ContentTypeProvider } from '@/lib/context/content-type-context';
import ContentTypeBuilder from '@/components/content-builder/content-type-builder';

export default function ContentBuilderPage() {
  // Content builder is always available now
  return (
    <ContentTypeProvider>
      <div className="h-screen bg-gradient-to-br from-dark-primary to-dark-secondary">
        <ContentTypeBuilder />
      </div>
    </ContentTypeProvider>
  );
}