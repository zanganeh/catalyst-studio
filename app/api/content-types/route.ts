import { NextRequest } from 'next/server';
import { CreateContentTypeSchema } from '@/lib/api/validation/content-type';
import { handleApiError, ErrorHandlers } from '@/lib/api/errors';
import { successResponse, parseQueryParams } from '@/lib/api/responses';
import * as contentTypeService from '@/lib/services/content-type-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = parseQueryParams(request.url);
    const websiteId = searchParams.get('websiteId') || undefined;
    
    const contentTypes = await contentTypeService.getContentTypes(websiteId);
    
    return successResponse(contentTypes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = CreateContentTypeSchema.safeParse(body);
    if (!validationResult.success) {
      throw ErrorHandlers.badRequest('Invalid request data', validationResult.error.errors);
    }
    
    const contentType = await contentTypeService.createContentType(validationResult.data);
    
    return successResponse(contentType, 201);
  } catch (error) {
    return handleApiError(error);
  }
}