# API Patterns Documentation

## Overview

This document establishes the standard patterns and conventions for all API routes in the Catalyst Studio application. All APIs should follow these patterns to ensure consistency, maintainability, and a predictable developer experience.

## Route Structure and Naming Conventions

### File Organization

API routes are organized in the `/app/api/` directory following Next.js App Router conventions:

```
/app/api/
├── [module]/
│   ├── route.ts           # Collection operations (GET all, POST new)
│   └── [id]/
│       └── route.ts       # Item operations (GET one, PUT, DELETE)
```

### Naming Conventions

- **Routes**: Use plural nouns for collections (e.g., `/api/websites`, `/api/users`)
- **Parameters**: Use `[id]` for resource identifiers
- **Methods**: Use standard HTTP verbs (GET, POST, PUT, DELETE)

## Request/Response Format Standards

### Standard Response Format

All API responses follow a consistent structure:

```typescript
// Success Response
{
  "data": T  // The requested resource(s)
}

// Error Response
{
  "error": {
    "message": string,    // Human-readable error message
    "code": string,       // Machine-readable error code
    "details"?: any       // Optional additional error details
  }
}

// Paginated Response
{
  "data": T[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

### Status Codes

- `200 OK` - Successful GET or PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate or conflicting data
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

## Error Handling Patterns

### Error Structure

```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `DUPLICATE_ENTRY` - Unique constraint violation
- `FOREIGN_KEY_ERROR` - Referenced resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `INTERNAL_ERROR` - Unexpected server error

### Error Handler Implementation

```typescript
import { handleApiError, ApiError } from '@/lib/api/errors';

export async function GET() {
  try {
    // Your logic here
    const data = await fetchData();
    
    if (!data) {
      throw new ApiError(404, 'Resource not found', 'NOT_FOUND');
    }
    
    return Response.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Validation Approach

### Using Zod for Validation

All request data should be validated using Zod schemas:

```typescript
import { z } from 'zod';

// Define schema
export const CreateResourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().min(1)
});

// Use in route handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateResourceSchema.parse(body);
    
    // Process validated data
    const result = await createResource(validated);
    return Response.json({ data: result }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(
        new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors)
      );
    }
    return handleApiError(error);
  }
}
```

### Validation Best Practices

1. **Input Validation**: Always validate incoming data
2. **Type Safety**: Export TypeScript types from Zod schemas
3. **Error Messages**: Provide clear, actionable error messages
4. **Sanitization**: Strip unknown fields from input
5. **Constraints**: Set appropriate min/max lengths and patterns

## Code Examples

### Complete CRUD Example: Websites API

#### Collection Route (`/app/api/websites/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { getClient } from '@/lib/db/client';
import { CreateWebsiteSchema } from '@/lib/api/validation/website';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { z } from 'zod';

// GET /api/websites - List all websites
export async function GET() {
  try {
    const prisma = getClient();
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ data: websites });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/websites - Create new website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateWebsiteSchema.parse(body);
    
    const prisma = getClient();
    const website = await prisma.website.create({
      data: validated
    });
    
    return Response.json({ data: website }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(
        new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors)
      );
    }
    return handleApiError(error);
  }
}
```

#### Item Route (`/app/api/websites/[id]/route.ts`)

```typescript
import { NextRequest } from 'next/server';
import { getClient } from '@/lib/db/client';
import { UpdateWebsiteSchema } from '@/lib/api/validation/website';
import { handleApiError, ApiError } from '@/lib/api/errors';
import { z } from 'zod';

// GET /api/websites/[id] - Get single website
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getClient();
    const website = await prisma.website.findUnique({
      where: { id: params.id }
    });
    
    if (!website) {
      throw new ApiError(404, 'Website not found', 'NOT_FOUND');
    }
    
    return Response.json({ data: website });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/websites/[id] - Update website
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = UpdateWebsiteSchema.parse(body);
    
    const prisma = getClient();
    const website = await prisma.website.update({
      where: { id: params.id },
      data: validated
    });
    
    return Response.json({ data: website });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/websites/[id] - Delete website
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prisma = getClient();
    await prisma.website.delete({
      where: { id: params.id }
    });
    
    return Response.json({ data: { message: 'Website deleted successfully' } });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Testing Patterns

### Manual Testing with cURL

```bash
# GET all websites
curl http://localhost:3000/api/websites

# GET single website
curl http://localhost:3000/api/websites/123

# POST new website
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -d '{"name":"My Site","category":"blog"}'

# PUT update website
curl -X PUT http://localhost:3000/api/websites/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Site"}'

# DELETE website
curl -X DELETE http://localhost:3000/api/websites/123
```

### Test Script Example

```typescript
// /scripts/test-api.ts
async function testWebsiteAPI() {
  const baseUrl = 'http://localhost:3000/api/websites';
  
  // Test POST
  const createRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Website',
      category: 'test'
    })
  });
  const created = await createRes.json();
  console.log('Created:', created);
  
  // Test GET
  const getRes = await fetch(`${baseUrl}/${created.data.id}`);
  const fetched = await getRes.json();
  console.log('Fetched:', fetched);
  
  // Test validation error
  const invalidRes = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '' })  // Invalid: empty name
  });
  const error = await invalidRes.json();
  console.log('Validation Error:', error);
}
```

## Best Practices

1. **Consistency**: Always follow the established patterns
2. **Type Safety**: Use TypeScript types throughout
3. **Error Handling**: Never expose internal errors to clients
4. **Validation**: Validate all input data
5. **Documentation**: Add JSDoc comments to all public APIs
6. **Security**: Sanitize inputs and validate permissions
7. **Performance**: Use database indexes and pagination for large datasets
8. **Monitoring**: Log errors for debugging and monitoring

## Migration Guide

When creating new API routes:

1. Copy the pattern from existing routes
2. Update the model types and validation schemas
3. Implement all CRUD operations (even if not immediately used)
4. Add comprehensive error handling
5. Document any deviations from the standard pattern
6. Test all operations including error cases

## Future Enhancements

- Authentication middleware integration
- Rate limiting
- API versioning strategy
- OpenAPI/Swagger documentation generation
- Automated testing framework
- Request/response logging middleware