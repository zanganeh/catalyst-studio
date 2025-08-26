import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import { siteStructureService } from '@/lib/services/site-structure/site-structure-service';
import { pageOrchestrator } from '@/lib/services/site-structure/page-orchestrator';
import { z } from 'zod';

// Input validation schemas with enhanced security
const MAX_METADATA_SIZE = 10000; // 10KB limit for metadata
const MAX_PROPS_SIZE = 5000; // 5KB limit for component props
const MAX_JSON_DEPTH = 5; // Maximum nesting depth

// Helper function to check JSON depth
function checkJSONDepth(obj: any, depth = 0): boolean {
  if (depth > MAX_JSON_DEPTH) return false;
  if (typeof obj !== 'object' || obj === null) return true;
  
  for (const value of Object.values(obj)) {
    if (!checkJSONDepth(value, depth + 1)) return false;
  }
  return true;
}

// Secure metadata schema with size and depth validation
const SecureMetadataSchema = z.record(z.unknown()).optional().refine(
  (data) => {
    if (!data) return true;
    const jsonStr = JSON.stringify(data);
    return jsonStr.length <= MAX_METADATA_SIZE && checkJSONDepth(data);
  },
  { message: `Metadata exceeds size limit (${MAX_METADATA_SIZE} bytes) or depth limit (${MAX_JSON_DEPTH})` }
);

// Secure props schema for components
const SecurePropsSchema = z.record(z.unknown()).optional().refine(
  (data) => {
    if (!data) return true;
    const jsonStr = JSON.stringify(data);
    return jsonStr.length <= MAX_PROPS_SIZE && checkJSONDepth(data);
  },
  { message: `Props exceed size limit (${MAX_PROPS_SIZE} bytes) or depth limit (${MAX_JSON_DEPTH})` }
);

const NodeDataSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/i).max(255).optional(),
  parentId: z.string().nullable().optional(),
  weight: z.number().int().min(-1000000).max(1000000).optional(),
  contentTypeId: z.string().optional(),
  contentTypeCategory: z.enum(['page', 'component', 'folder']).optional(),
  components: z.array(z.object({
    id: z.string().max(100),
    type: z.string().max(100),
    props: SecurePropsSchema
  })).max(100).optional(), // Limit to 100 components per page
  metadata: SecureMetadataSchema
});

const OperationSchema = z.object({
  type: z.enum(['CREATE', 'UPDATE', 'DELETE', 'MOVE']),
  nodeId: z.string().optional(),
  data: NodeDataSchema.optional(),
  newParentId: z.string().nullable().optional()
});

const SaveRequestSchema = z.object({
  websiteId: z.string().min(1).max(100), // Basic validation for websiteId format
  operations: z.array(OperationSchema).min(1).max(50) // Limit batch size to prevent DoS
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
                if (!op.data) throw new Error('Data required for create operation');
                
                // Validate contentTypeId if provided
                if (op.data.contentTypeId) {
                  const contentTypeExists = await prisma.contentType.findUnique({
                    where: { id: op.data.contentTypeId }
                  });
                  if (!contentTypeExists) {
                    throw new Error('Invalid content type specified');
                  }
                }
                
                // For pages with content, use pageOrchestrator for atomic creation
                if (op.data.contentTypeCategory === 'page' && op.data.components) {
                  const contentTypeId = op.data.contentTypeId || await getDefaultContentTypeId(websiteId, 'page');
                  if (!contentTypeId) {
                    throw new Error('No valid content type available for page creation');
                  }
                  
                  result = await pageOrchestrator.createPage({
                    title: op.data.title || 'Untitled',
                    contentTypeId,
                    parentId: op.data.parentId === null ? undefined : op.data.parentId,
                    slug: op.data.slug || 'untitled',
                    content: {
                      components: op.data.components || []
                    } as any, // pageOrchestrator expects specific format
                    metadata: (op.data.metadata || {}) as any
                  }, websiteId);
                } else {
                  // For folders or simple nodes, use siteStructureService
                  result = await siteStructureService.create({
                    websiteId,
                    parentId: op.data.parentId || null,
                    slug: op.data.slug || 'untitled',
                    title: op.data.title || 'Untitled',
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
            // Log full error for debugging but sanitize for client
            console.error(`Operation ${op.type} failed:`, opError);
            
            // Sanitize error message for client response
            let clientError = 'Operation failed';
            if (opError instanceof Error) {
              // Only expose safe error messages
              if (opError.message.includes('Invalid content type')) {
                clientError = 'Invalid content type';
              } else if (opError.message.includes('Node ID required')) {
                clientError = opError.message;
              } else if (opError.message.includes('Data required')) {
                clientError = opError.message;
              } else if (opError.message.includes('not found')) {
                clientError = 'Resource not found';
              } else if (opError.message.includes('duplicate')) {
                clientError = 'Duplicate resource';
              }
            }
            
            operationResults.push({
              success: false,
              operation: op.type,
              error: clientError
            });
          }
        }
        
        return operationResults;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000 // Reduced from 30s to 10s to prevent DoS
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