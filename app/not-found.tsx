'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Log 404 for monitoring (client-side)
    console.log('404 Page Rendered');
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-semibold text-gray-700">
            Page Not Found
          </h2>
          <p className="mt-2 text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
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

      </div>
    </div>
  );
}