import { z } from 'zod';

/**
 * Schema for starting a deployment
 */
export const startDeploymentSchema = z.object({
  websiteId: z.string().min(1, 'Website ID is required'),
  provider: z.object({
    id: z.string().min(1, 'Provider ID is required'),
    name: z.string().min(1, 'Provider name is required'),
    config: z.record(z.unknown()).optional(),
    // Allow additional properties from the provider object
    description: z.string().optional(),
    logo: z.string().optional(),
    connectionStatus: z.string().optional(),
    lastConnected: z.string().optional(),
    connectionExpiry: z.string().optional(),
  }).passthrough(), // Allow additional unknown properties
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