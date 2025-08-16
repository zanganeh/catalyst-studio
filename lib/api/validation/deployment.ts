import { z } from 'zod';

/**
 * Schema for starting a deployment
 */
export const startDeploymentSchema = z.object({
  websiteId: z.string().uuid('Invalid website ID format'),
  provider: z.object({
    id: z.string().min(1, 'Provider ID is required'),
    name: z.string().min(1, 'Provider name is required'),
    config: z.record(z.unknown()).optional(),
  }),
  selectedTypes: z.array(z.string()).optional().default([]),
});

export type StartDeploymentInput = z.infer<typeof startDeploymentSchema>;

/**
 * Schema for deployment status
 */
export const deploymentStatusSchema = z.enum([
  'pending',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

export type DeploymentStatus = z.infer<typeof deploymentStatusSchema>;