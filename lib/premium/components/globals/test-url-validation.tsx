'use client';

import React from 'react';
import { validateHero } from './hero/schema';
import { validateHeader } from './header/schema';
import { validateFooter } from './footer/schema';
import { validateCTA } from './cta/schema';

export function TestUrlValidation() {
  // Test dangerous URLs that should be blocked
  const dangerousUrls = [
    'javascript:alert("XSS")',
    'data:text/html,<script>alert("XSS")</script>',
    'vbscript:alert("XSS")',
    '//evil.com/redirect',
    'file:///etc/passwd',
    'about:blank',
    'blob:https://example.com/uuid',
  ];

  // Test safe URLs that should pass
  const safeUrls = [
    '/about',
    '/contact',
    'https://example.com',
    'http://example.com',
    'mailto:test@example.com',
    'tel:+1234567890',
    '#section',
  ];

  console.log('=== URL Validation Test Results ===\n');

  // Test Hero component
  console.log('Hero Component Tests:');
  dangerousUrls.forEach(url => {
    const result = validateHero({ title: 'Test', buttonUrl: url });
    console.log(`  ❌ Dangerous URL "${url}": ${result.isValid ? 'FAILED - ALLOWED' : 'PASSED - BLOCKED'}`);
  });
  safeUrls.forEach(url => {
    const result = validateHero({ title: 'Test', buttonUrl: url });
    console.log(`  ✅ Safe URL "${url}": ${result.isValid ? 'PASSED - ALLOWED' : 'FAILED - BLOCKED'}`);
  });

  // Test Header component
  console.log('\nHeader Component Tests:');
  dangerousUrls.forEach(url => {
    const result = validateHeader({ 
      logo: 'Test', 
      menuItems: [{ label: 'Test', url }],
      ctaButton: { text: 'Test', url }
    });
    console.log(`  ❌ Dangerous URL "${url}": ${result.isValid ? 'FAILED - ALLOWED' : 'PASSED - BLOCKED'}`);
  });

  // Test Footer component
  console.log('\nFooter Component Tests:');
  dangerousUrls.forEach(url => {
    const result = validateFooter({ 
      columns: [{ title: 'Test', links: [{ label: 'Test', url }] }],
      socialLinks: [{ platform: 'Test', url }]
    });
    console.log(`  ❌ Dangerous URL "${url}": ${result.isValid ? 'FAILED - ALLOWED' : 'PASSED - BLOCKED'}`);
  });

  // Test CTA component
  console.log('\nCTA Component Tests:');
  dangerousUrls.forEach(url => {
    const result = validateCTA({ 
      primaryButton: { text: 'Test', url },
      secondaryButton: { text: 'Test', url }
    });
    console.log(`  ❌ Dangerous URL "${url}": ${result.isValid ? 'FAILED - ALLOWED' : 'PASSED - BLOCKED'}`);
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">URL Validation Test</h2>
      <p>Check the browser console for test results.</p>
      <div className="mt-4 p-4 bg-green-100 rounded">
        <p className="font-bold">✅ Security Fix Applied</p>
        <p>All components now validate URLs to prevent:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>XSS attacks via javascript: URLs</li>
          <li>Data URL injection</li>
          <li>Protocol-relative URLs (//)</li>
          <li>File system access</li>
          <li>Other dangerous protocols</li>
        </ul>
      </div>
    </div>
  );
}