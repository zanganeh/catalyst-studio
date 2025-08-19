import { PrismaClient } from '../generated/prisma'

// Singleton pattern for Prisma client
// This prevents multiple instances during hot reload in development
declare global {
  var prisma: PrismaClient | undefined
}

/**
 * Returns a singleton instance of the Prisma client.
 * In production, creates a single instance.
 * In development, reuses existing instance to prevent connection pool exhaustion.
 */
export function getClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return global.prisma
}

/**
 * Disconnects the Prisma client connection.
 * Useful for cleanup during hot reload or application shutdown.
 */
export async function disconnect(): Promise<void> {
  if (global.prisma) {
    await global.prisma.$disconnect()
    global.prisma = undefined
  }
}

// In development, prevent connection pool exhaustion during hot reload
if (process.env.NODE_ENV !== 'production') {
  if (global.prisma) {
    console.log('Reusing existing Prisma client instance')
  }
}

// Export a default client instance for convenience
export const prisma = getClient()