import { z } from 'zod';

// Content status enum
export const ContentStatusSchema = z.enum(['draft', 'published', 'archived']);

// Create content item schema
export const CreateContentItemSchema = z.object({
  contentTypeId: z.string().min(1, 'Content type ID is required'),
  data: z.record(z.any()).refine((data) => Object.keys(data).length > 0, {
    message: 'Data object cannot be empty',
  }),
  status: ContentStatusSchema.optional().default('draft'),
});

// Update content item schema
export const UpdateContentItemSchema = z.object({
  data: z.record(z.any()).optional(),
  status: ContentStatusSchema.optional(),
});

// Query parameters schema with clamping for invalid values
export const ContentItemsQuerySchema = z.object({
  page: z.coerce.number().optional().default(1).transform(val => Math.max(1, val)),
  limit: z.coerce.number().optional().default(20).transform(val => Math.min(100, Math.max(1, val))),
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