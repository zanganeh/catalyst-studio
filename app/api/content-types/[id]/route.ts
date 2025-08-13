import { NextRequest } from 'next/server';
import { UpdateContentTypeSchema } from '@/lib/api/validation/content-type';
import { handleApiError, ErrorHandlers } from '@/lib/api/errors';
import { successResponse, noContentResponse } from '@/lib/api/responses';
import * as contentTypeService from '@/lib/services/content-type-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contentType = await contentTypeService.getContentType(id);
    
    if (!contentType) {
      throw ErrorHandlers.notFound('Content type');
    }
    
    return successResponse(contentType);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validationResult = UpdateContentTypeSchema.safeParse(body);
    if (!validationResult.success) {
      throw ErrorHandlers.badRequest('Invalid request data', validationResult.error.errors);
    }
    
    const contentType = await contentTypeService.updateContentType(id, validationResult.data);
    
    return successResponse(contentType);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await contentTypeService.deleteContentType(id);
    
    return noContentResponse();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot delete content type')) {
      return handleApiError(ErrorHandlers.conflict(error.message));
    }
    return handleApiError(error);
  }
}