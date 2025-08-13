'use client';

import { useWebsiteContext } from '@/lib/context/website-context';
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

export default function AIPage() {
  const { website, isLoading, error } = useWebsiteContext();
  const params = useParams();
  const websiteId = params?.id as string;

  useEffect(() => {
    // Check if there's initial prompt data in session storage
    if (websiteId && typeof window !== 'undefined') {
      const storedPrompt = sessionStorage.getItem(`ai_prompt_${websiteId}`);
      if (storedPrompt) {
        try {
          const promptData = JSON.parse(storedPrompt);
          // The prompt context will be displayed in the left chat panel
          // Just show a notification here that the AI is ready
          console.log('AI context loaded:', promptData);
        } catch (error) {
          console.error('Failed to parse prompt data:', error);
        }
      }
    }
  }, [websiteId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">
          <p>Loading website context...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          <h2 className="text-xl font-bold mb-2">Error Loading Website</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  // Show AI workspace info - the actual chat is in the left panel
  return (
    <div className="h-full bg-gray-900">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">AI Development Assistant</h1>
            <p className="text-gray-400 mt-1">
              Working on: {website?.name || 'Untitled Website'}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">AI Assistant Active</h2>
          <p className="text-gray-300 mb-4">
            The AI assistant is ready to help you build your {website?.category || 'website'}.
            Use the chat panel on the left to interact with the AI.
          </p>
          
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Ask questions about your project</p>
            <p>• Get code suggestions and implementations</p>
            <p>• Request help with debugging</p>
            <p>• Explore best practices and patterns</p>
          </div>
        </div>

        {website && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Project Details</h3>
            <dl className="space-y-1">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Category:</dt>
                <dd className="text-sm text-gray-300">{website.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Created:</dt>
                <dd className="text-sm text-gray-300">
                  {new Date(website.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Last Modified:</dt>
                <dd className="text-sm text-gray-300">
                  {new Date(website.updatedAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}