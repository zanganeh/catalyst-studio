import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { siteStructureService } from '@/lib/services/site-structure/site-structure-service';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { z } from 'zod';

// Input validation schemas
const OperationSchema = z.object({
  type: z.enum(['CREATE', 'UPDATE', 'DELETE', 'MOVE']),
  nodeId: z.string().optional(),
  data: z.any().optional(),
  newParentId: z.string().nullable().optional()
});

const SaveRequestSchema = z.object({
  websiteId: z.string(),
  operations: z.array(OperationSchema)
});

// Error type mapping for Prisma errors
const errorMap = {
  'P2002': { status: 409, message: 'Duplicate slug - a page with this URL already exists' },
  'P2025': { status: 404, message: 'Node not found - it may have been deleted' },
  'P2003': { status: 400, message: 'Invalid reference - parent node does not exist' },
  'P2034': { status: 409, message: 'Transaction conflict - please retry' }
};

/**
 * POST /api/premium/sitemap/save
 * Process batch operations on the sitemap
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = SaveRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      );
    }
    
    const { websiteId, operations } = validation.data;
    
    // Process operations in a transaction with Serializable isolation
    const results = await prisma.$transaction(
      async () => {
        const operationResults = [];
        
        for (const op of operations) {
          try {
            let result;
            
            switch (op.type) {
              case 'CREATE':
                // For pages with content, use pageOrchestrator for atomic creation
                if (op.data?.contentTypeCategory === 'page' && op.data?.components) {
                  result = await pageOrchestrator.createPage({
                    title: op.data.title,
                    contentTypeId: op.data.contentTypeId || await getDefaultContentTypeId(websiteId, 'page'),
                    parentId: op.data.parentId,
                    slug: op.data.slug,
                    content: {
                      components: op.data.components || []
                    },
                    metadata: op.data.metadata
                  }, websiteId);
                } else {
                  // For folders or simple nodes, use siteStructureService
                  result = await siteStructureService.create({
                    websiteId,
                    parentId: op.data.parentId,
                    slug: op.data.slug,
                    title: op.data.title,
                    contentItemId: null, // Folders have no content
                    weight: op.data.weight || 0
                  });
                }
                break;
                
              case 'UPDATE':
                if (!op.nodeId) throw new Error('Node ID required for update');
                result = await siteStructureService.update(op.nodeId, {
                  slug: op.data?.slug,
                  title: op.data?.title,
                  weight: op.data?.weight
                });
                break;
                
              case 'DELETE':
                if (!op.nodeId) throw new Error('Node ID required for delete');
                await siteStructureService.delete(op.nodeId);
                result = { deleted: true, nodeId: op.nodeId };
                break;
                
              case 'MOVE':
                if (!op.nodeId) throw new Error('Node ID required for move');
                result = await siteStructureService.moveNode(
                  op.nodeId,
                  op.newParentId || null
                );
                break;
                
              default:
                throw new Error(`Unknown operation type: ${op.type}`);
            }
            
            operationResults.push({
              success: true,
              operation: op.type,
              result
            });
          } catch (opError) {
            // Log individual operation error but continue processing
            console.error(`Operation ${op.type} failed:`, opError);
            operationResults.push({
              success: false,
              operation: op.type,
              error: opError instanceof Error ? opError.message : 'Unknown error'
            });
          }
        }
        
        return operationResults;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 30000
      }
    );
    
    // Check if all operations succeeded
    const allSucceeded = results.every(r => r.success);
    
    return NextResponse.json({
      success: allSucceeded,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Save operation failed:', error);
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const errorInfo = errorMap[error.code as keyof typeof errorMap];
      if (errorInfo) {
        return NextResponse.json(
          { error: errorInfo.message, code: error.code },
          { status: errorInfo.status }
        );
      }
    }
    
    // Handle transaction conflicts specifically
    if (error instanceof Error && error.message.includes('transaction')) {
      return NextResponse.json(
        { error: 'Transaction conflict - please retry', retryable: true },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save sitemap changes' },
      { status: 500 }
    );
  }
}

/**
 * Helper to get default content type ID for a category
 */
async function getDefaultContentTypeId(websiteId: string, category: 'page' | 'component' | 'folder'): Promise<string> {
  const contentType = await prisma.contentType.findFirst({
    where: {
      websiteId,
      category: category
    }
  });
  
  if (!contentType) {
    throw new Error(`No content type found for category: ${category}`);
  }
  
  return contentType.id;
}