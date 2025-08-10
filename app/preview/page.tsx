'use client';

import React from 'react';
import { PreviewProvider } from '@/lib/context/preview-context';
import { ProjectContextProvider } from '@/lib/context/project-context';
import { ContentTypeProvider } from '@/lib/context/content-type-context';
import { PreviewFrame } from '@/components/preview/preview-frame';
import { DeviceSelector } from '@/components/preview/device-selector';
import { PreviewControls } from '@/components/preview/preview-controls';
import { PreviewContent } from '@/components/preview/preview-content';
import { PreviewNavigation } from '@/components/preview/preview-navigation';
import { NavigationSidebar } from '@/components/navigation/navigation-sidebar';
import { cn } from '@/lib/utils';
import { useFeatureFlag } from '@/contexts/feature-flag-context';

export default function PreviewPage() {
  const { enabled: isPreviewEnabled } = useFeatureFlag('previewSystem');

  // Temporarily bypass feature flag for testing
  // TODO: Remove this after testing
  const forceEnable = true;

  // Show fallback if feature is disabled
  if (!isPreviewEnabled && !forceEnable) {
    return (
      <div className="flex min-h-screen">
        <NavigationSidebar />
        <main className="flex-1 ml-64">
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Preview System Coming Soon
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                The preview system is currently under development.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ProjectContextProvider>
      <ContentTypeProvider>
        <PreviewProvider>
          <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Navigation Sidebar */}
        <NavigationSidebar />
        
        {/* Main Content Area - Three Column Layout */}
        <div className="flex-1 ml-64 flex flex-col">
          {/* Preview Controls Bar */}
          <PreviewControls />
          
          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Device Selector & Settings */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Device Preview
              </h2>
              
              {/* Device Selector */}
              <DeviceSelector className="mb-6" />
              
              {/* Preview Navigation for multi-page */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Page Navigation
                </h3>
                <PreviewNavigation />
              </div>
              
              {/* Content Generation Controls */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Content Generation
                </h3>
                <PreviewContent autoGenerate={true} />
              </div>
            </div>
            
            {/* Center Panel - Preview Frame */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
              <PreviewFrame className="h-full" />
            </div>
            
            {/* Right Panel - Properties/Info (Future Enhancement) */}
            <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Properties
              </h2>
              
              <div className="space-y-4">
                {/* Device Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Device Information
                  </h3>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Type: <span className="font-medium">Desktop</span></p>
                    <p>Resolution: <span className="font-medium">1920×1080</span></p>
                    <p>Scale: <span className="font-medium">50%</span></p>
                  </div>
                </div>
                
                {/* Performance Metrics */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Performance
                  </h3>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>Load Time: <span className="font-medium text-green-600">0.8s</span></p>
                    <p>Last Update: <span className="font-medium">Just now</span></p>
                    <p>Frame Rate: <span className="font-medium text-green-600">60 fps</span></p>
                  </div>
                </div>
                
                {/* SEO Preview (Future) */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SEO Preview
                  </h3>
                  <div className="space-y-2">
                    <div className="text-blue-600 text-sm font-medium">Page Title</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Meta description preview will appear here...
                    </div>
                  </div>
                </div>
                
                {/* Accessibility Score (Future) */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accessibility
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">85/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        </PreviewProvider>
      </ContentTypeProvider>
    </ProjectContextProvider>
  );
}