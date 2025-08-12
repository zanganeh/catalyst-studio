import { z } from 'zod';

/**
 * Schema for creating a new website
 */
export const CreateWebsiteSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters'),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be less than 100 characters'),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema for updating an existing website
 */
export const UpdateWebsiteSchema = CreateWebsiteSchema.partial();

/**
 * Schema for query parameters
 */
export const WebsiteQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.enum(['name', 'category', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  category: z.string().optional(),
  search: z.string().optional()
});

export type CreateWebsiteInput = z.infer<typeof CreateWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof UpdateWebsiteSchema>;
export type WebsiteQueryInput = z.infer<typeof WebsiteQuerySchema>;