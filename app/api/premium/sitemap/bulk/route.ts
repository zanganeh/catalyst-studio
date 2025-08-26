import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { siteStructureService } from '@/lib/services/site-structure/site-structure-service';
import { z } from 'zod';

// Input validation schemas
const BulkDeleteSchema = z.object({
  type: z.literal('DELETE'),
  websiteId: z.string(),
  nodeIds: z.array(z.string()).min(1)
});

const BulkUpdateSchema = z.object({
  type: z.literal('UPDATE'),
  websiteId: z.string(),
  updates: z.array(z.object({
    nodeId: z.string(),
    data: z.object({
      status: z.string().optional(),
      weight: z.number().optional(),
      metadata: z.any().optional()
    })
  })).min(1)
});

const BulkRequestSchema = z.union([BulkDeleteSchema, BulkUpdateSchema]);

/**
 * POST /api/premium/sitemap/bulk
 * Process bulk operations on multiple nodes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = BulkRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    if (data.type === 'DELETE') {
      // Bulk delete operation
      const { nodeIds } = data;
      
      const results = await prisma.$transaction(
        async () => {
          const succeeded: string[] = [];
          const failed: Array<{ id: string; error: string }> = [];
          
          for (const nodeId of nodeIds) {
            try {
              // Use the service for proper cascade handling
              await siteStructureService.delete(nodeId);
              succeeded.push(nodeId);
            } catch (error) {
              console.error(`Failed to delete node ${nodeId}:`, error);
              failed.push({
                id: nodeId,
                error: error instanceof Error ? error.message : 'Delete failed'
              });
            }
          }
          
          return { succeeded, failed };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 30000
        }
      );
      
      return NextResponse.json({
        type: 'DELETE',
        totalRequested: nodeIds.length,
        totalSucceeded: results.succeeded.length,
        totalFailed: results.failed.length,
        succeeded: results.succeeded,
        failed: results.failed,
        timestamp: new Date().toISOString()
      });
      
    } else if (data.type === 'UPDATE') {
      // Bulk update operation
      const { updates } = data;
      
      const results = await prisma.$transaction(
        async () => {
          const succeeded: string[] = [];
          const failed: Array<{ id: string; error: string }> = [];
          
          for (const update of updates) {
            try {
              // Update the node using the service
              await siteStructureService.update(update.nodeId, {
                weight: update.data.weight
              });
              
              // If there's content-related updates, handle separately
              if (update.data.status || update.data.metadata) {
                const node = await prisma.siteStructure.findUnique({
                  where: { id: update.nodeId }
                });
                
                if (node?.contentItemId) {
                  await prisma.contentItem.update({
                    where: { id: node.contentItemId },
                    data: {
                      status: update.data.status,
                      metadata: update.data.metadata
                    }
                  });
                }
              }
              
              succeeded.push(update.nodeId);
            } catch (error) {
              console.error(`Failed to update node ${update.nodeId}:`, error);
              failed.push({
                id: update.nodeId,
                error: error instanceof Error ? error.message : 'Update failed'
              });
            }
          }
          
          return { succeeded, failed };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 30000
        }
      );
      
      return NextResponse.json({
        type: 'UPDATE',
        totalRequested: updates.length,
        totalSucceeded: results.succeeded.length,
        totalFailed: results.failed.length,
        succeeded: results.succeeded,
        failed: results.failed,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Bulk operation failed:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2034') {
        return NextResponse.json(
          { error: 'Transaction conflict - please retry', retryable: true },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}