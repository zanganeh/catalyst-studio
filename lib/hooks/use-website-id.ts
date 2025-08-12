'use client';

import { useParams } from 'next/navigation';

/**
 * Custom hook to extract and validate website ID from route params
 * Returns 'default' if no ID is present or if ID is invalid
 */
export const useWebsiteId = (): string => {
  const params = useParams();
  const id = params?.id as string;
  
  // Validate ID format to prevent injection attacks
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id) || id.length > 50) {
    return 'default';
  }
  
  return id;
};