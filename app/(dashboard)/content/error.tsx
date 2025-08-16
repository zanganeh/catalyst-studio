'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Content page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          Something went wrong!
        </h2>
        <p className="text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred while loading content.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}