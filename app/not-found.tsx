import Link from 'next/link';
import { headers } from 'next/headers';

export default function NotFound() {
  const headersList = headers();
  const fourOhFourType = headersList.get('x-404-type') || 'hard';
  const fourOhFourPath = headersList.get('x-404-path') || '';
  const pageId = headersList.get('x-page-id') || '';

  // Log 404 occurrence for monitoring
  if (typeof window === 'undefined') {
    // Server-side logging
    console.log(`404 Page Rendered - Type: ${fourOhFourType}, Path: ${fourOhFourPath}, PageId: ${pageId}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-semibold text-gray-700">
            {fourOhFourType === 'soft' ? 'Page Unavailable' : 'Page Not Found'}
          </h2>
          <p className="mt-2 text-gray-600">
            {fourOhFourType === 'soft'
              ? 'This page exists but is currently unpublished or unavailable.'
              : "The page you're looking for doesn't exist or has been moved."}
          </p>
          {fourOhFourPath && (
            <p className="mt-2 text-sm text-gray-500">
              Requested path: <code className="bg-gray-100 px-2 py-1 rounded">{fourOhFourPath}</code>
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Navigation Options</h3>
          <div className="grid gap-2">
            <Link
              href="/"
              className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Homepage
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested Pages</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="text-blue-600 hover:text-blue-800 hover:underline">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/sitemap" className="text-blue-600 hover:text-blue-800 hover:underline">
                Sitemap
              </Link>
            </li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Debug Info (Dev Only)</h4>
            <dl className="text-xs space-y-1">
              <div className="flex">
                <dt className="font-medium text-yellow-700 mr-2">Type:</dt>
                <dd className="text-yellow-600">{fourOhFourType}</dd>
              </div>
              <div className="flex">
                <dt className="font-medium text-yellow-700 mr-2">Path:</dt>
                <dd className="text-yellow-600">{fourOhFourPath || 'N/A'}</dd>
              </div>
              {pageId && (
                <div className="flex">
                  <dt className="font-medium text-yellow-700 mr-2">Page ID:</dt>
                  <dd className="text-yellow-600">{pageId}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}