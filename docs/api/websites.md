# Website API Documentation

## Base URL
`/api/websites`

## Endpoints

### GET /api/websites
Retrieve all active websites.

**Response:**
```json
{
  "data": [
    {
      "id": "cuid",
      "name": "My Website",
      "description": "A sample website",
      "category": "Business",
      "metadata": {},
      "icon": "🌐",
      "settings": {
        "primaryColor": "#007bff",
        "features": {
          "blog": true,
          "shop": false
        }
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### GET /api/websites/[id]
Retrieve a specific website by ID.

**Parameters:**
- `id` (string): Website ID

**Response:**
```json
{
  "data": {
    "id": "cuid",
    "name": "My Website",
    "description": "A sample website",
    "category": "Business",
    "metadata": {},
    "icon": "🌐",
    "settings": {
      "primaryColor": "#007bff",
      "features": {
        "blog": true,
        "shop": false
      }
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /api/websites
Create a new website.

**Request Body:**
```json
{
  "name": "My Website",
  "description": "Optional description",
  "category": "Business",
  "metadata": {},
  "icon": "🌐",
  "settings": {
    "primaryColor": "#007bff",
    "features": {
      "blog": true,
      "shop": false
    }
  },
  "isActive": true
}
```

**Response:**
- Status: 201 Created
- Body: Created website object

### PUT /api/websites/[id]
Update an existing website.

**Parameters:**
- `id` (string): Website ID

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "settings": {
    "primaryColor": "#ff0000"
  }
}
```

**Response:**
- Status: 200 OK
- Body: Updated website object

### DELETE /api/websites/[id]
Soft delete a website (sets isActive to false).

**Parameters:**
- `id` (string): Website ID

**Response:**
```json
{
  "data": {
    "message": "Website deleted successfully"
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Common error codes:
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Request validation failed
- `INTERNAL_ERROR` (500): Server error

## React Query Hooks

The following hooks are available for client-side data fetching:

### useWebsites()
Fetch all websites.

```typescript
import { useWebsites } from '@/lib/api/hooks/use-websites';

const { data: websites, isLoading, error } = useWebsites();
```

### useWebsite(id)
Fetch a single website by ID.

```typescript
import { useWebsite } from '@/lib/api/hooks/use-websites';

const { data: website, isLoading, error } = useWebsite('website-id');
```

### useCreateWebsite()
Create a new website.

```typescript
import { useCreateWebsite } from '@/lib/api/hooks/use-websites';

const createMutation = useCreateWebsite();

await createMutation.mutateAsync({
  name: 'New Website',
  category: 'Business'
});
```

### useUpdateWebsite(id)
Update an existing website.

```typescript
import { useUpdateWebsite } from '@/lib/api/hooks/use-websites';

const updateMutation = useUpdateWebsite('website-id');

await updateMutation.mutateAsync({
  name: 'Updated Name'
});
```

### useDeleteWebsite()
Delete a website.

```typescript
import { useDeleteWebsite } from '@/lib/api/hooks/use-websites';

const deleteMutation = useDeleteWebsite();

await deleteMutation.mutateAsync('website-id');
```