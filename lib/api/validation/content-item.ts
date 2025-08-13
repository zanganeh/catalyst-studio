import { z } from 'zod';

// Content status enum
export const ContentStatusSchema = z.enum(['draft', 'published', 'archived']);

// Create content item schema
export const CreateContentItemSchema = z.object({
  contentTypeId: z.string().min(1, 'Content type ID is required'),
  websiteId: z.string().min(1, 'Website ID is required'),
  slug: z.string().optional(),
  data: z.record(z.any()).refine((data) => Object.keys(data).length > 0, {
    message: 'Data object cannot be empty',
  }),
  metadata: z.record(z.any()).optional(),
  status: ContentStatusSchema.optional().default('draft'),
  publishedAt: z.union([z.string(), z.date(), z.null()]).optional(),
});

// Update content item schema
export const UpdateContentItemSchema = z.object({
  slug: z.string().optional(),
  data: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  status: ContentStatusSchema.optional(),
  publishedAt: z.union([z.string(), z.date(), z.null()]).optional(),
});

// Query parameters schema
export const ContentItemsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  status: ContentStatusSchema.optional(),
  contentTypeId: z.string().optional(),
  websiteId: z.string().optional(),
  sortBy: z.string().optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Bulk operations schemas
export const BulkCreateContentItemsSchema = z.object({
  items: z.array(CreateContentItemSchema).min(1, 'At least one item is required'),
});

export const BulkDeleteContentItemsSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
});

// Validation helper functions
export function validateCreateContentItem(data: unknown) {
  return CreateContentItemSchema.safeParse(data);
}

export function validateUpdateContentItem(data: unknown) {
  return UpdateContentItemSchema.safeParse(data);
}

export function validateContentItemsQuery(params: URLSearchParams) {
  const query = Object.fromEntries(params.entries());
  return ContentItemsQuerySchema.safeParse(query);
}

export function validateBulkCreate(data: unknown) {
  return BulkCreateContentItemsSchema.safeParse(data);
}

export function validateBulkDelete(data: unknown) {
  return BulkDeleteContentItemsSchema.safeParse(data);
}

// Type exports
export type CreateContentItemInput = z.infer<typeof CreateContentItemSchema>;
export type UpdateContentItemInput = z.infer<typeof UpdateContentItemSchema>;
export type ContentItemsQueryInput = z.infer<typeof ContentItemsQuerySchema>;