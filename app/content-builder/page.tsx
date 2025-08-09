'use client';

import { useState, useEffect } from 'react';
import { ContentTypeProvider } from '@/lib/context/content-type-context';
import ContentTypeBuilder from '@/components/content-builder/content-type-builder';
import { isFeatureEnabled } from '@/config/features';
import { Card } from '@/components/ui/card';

export default function ContentBuilderPage() {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check feature flag on client side only
    setIsEnabled(isFeatureEnabled('contentTypeBuilder'));
  }, []);

  // Show loading state during initialization to prevent hydration mismatch
  if (isEnabled === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Content Type Builder</h2>
          <p className="text-muted-foreground">
            This feature is currently not available. Please enable the contentTypeBuilder feature flag to access it.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <ContentTypeProvider>
      <div className="h-screen">
        <ContentTypeBuilder />
      </div>
    </ContentTypeProvider>
  );
}