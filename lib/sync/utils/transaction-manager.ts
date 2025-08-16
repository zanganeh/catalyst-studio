/**
 * Transaction management utilities for database operations
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';

/**
 * Execute a function within a database transaction
 * Automatically handles rollback on error
 */
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    try {
      return await fn(tx);
    } catch (error) {
      // Log the error for debugging
      console.error('Transaction failed:', error);
      // Re-throw to trigger rollback
      throw error;
    }
  }, {
    maxWait: 5000, // Maximum time to wait for a transaction slot
    timeout: 30000, // Maximum time a transaction can run
    // SQLite doesn't support isolation levels, removed to fix "Invalid enum value: ReadCommitted" error
  });
}

/**
 * Execute multiple operations in a transaction with retry logic
 */
export async function withRetryTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(fn);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Transaction failed');
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      console.log(`Retrying transaction (attempt ${attempt + 1}/${maxRetries})...`);
    }
  }
  
  throw lastError || new Error('Transaction failed after retries');
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  
  const message = error.message.toLowerCase();
  
  // Retryable database errors
  const retryablePatterns = [
    'deadlock',
    'lock timeout',
    'connection',
    'timeout',
    'temporary',
    'concurrent update',
  ];
  
  return retryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Batch operations for better performance
 */
export async function batchOperation<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }
  
  return results;
}