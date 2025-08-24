import { notFound } from 'next/navigation';
import { urlResolver } from '@/lib/services/url-resolution/url-resolver';
import { redirectService } from '@/lib/services/redirect-service';
import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    slug?: string[];
  };
}

export default async function DynamicPage({ params }: PageProps) {
  // Await params as required in Next.js 15
  const resolvedParams = await params;
  
  // Construct the path from slug segments
  const path = resolvedParams.slug ? `/${resolvedParams.slug.join('/')}` : '/';
  
  // Get website ID from environment or use TechVerse Blog for testing
  const websiteId = process.env.DEFAULT_WEBSITE_ID || 'cmepd3enl0000v8egoge0uxu8';
  
  // Log the resolution attempt
  console.log(`Resolving URL: ${path} for website: ${websiteId}`);
  
  try {
    // Try to resolve the URL
    const resolutionResult = await urlResolver.resolveUrl(path, {
      websiteId,
      caseInsensitive: process.env.URL_CASE_INSENSITIVE === 'true'
    });
    
    if (resolutionResult.success && resolutionResult.data) {
      const resolvedPage = resolutionResult.data;
      
      // Check if page is active (published)
      if (!resolvedPage.siteStructure.isActive) {
        console.log(`Soft 404: Page exists but is unpublished - ${path}`);
        notFound();
      }
      
      // Render the page content
      return (
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">
            {resolvedPage.contentItem?.title || 'Untitled Page'}
          </h1>
          
          {resolvedPage.contentItem?.data && (
            <div className="prose max-w-none">
              {typeof resolvedPage.contentItem.data === 'string' 
                ? <p>{resolvedPage.contentItem.data}</p>
                : <pre>{JSON.stringify(resolvedPage.contentItem.data, null, 2)}</pre>
              }
            </div>
          )}
          
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h2 className="text-sm font-semibold text-gray-600 mb-2">Page Information</h2>
            <dl className="text-sm space-y-1">
              <div className="flex">
                <dt className="font-medium text-gray-700 mr-2">Path:</dt>
                <dd className="text-gray-600">{resolvedPage.siteStructure.fullPath}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-gray-700 mr-2">Page ID:</dt>
                <dd className="text-gray-600">{resolvedPage.siteStructure.id}</dd>
              </div>
              {resolvedPage.contentItem && (
                <div className="flex">
                  <dt className="font-medium text-gray-700 mr-2">Content Type:</dt>
                  <dd className="text-gray-600">{resolvedPage.contentItem.type}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      );
    }
    
    // Page not found, check for redirects
    const redirectChain = await redirectService.resolveRedirectChain(websiteId, path);
    
    if (redirectChain.finalPath !== path && !redirectChain.hasLoop) {
      console.log(`Redirecting: ${path} -> ${redirectChain.finalPath} (${redirectChain.hops} hops)`);
      redirect(redirectChain.finalPath);
    }
    
    // No page and no redirect found
    console.log(`Hard 404: ${path}`);
    notFound();
    
  } catch (error) {
    console.error(`Error resolving URL ${path}:`, error);
    notFound();
  }
}