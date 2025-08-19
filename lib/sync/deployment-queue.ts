/**
 * Simple in-memory deployment queue with concurrency control
 * In production, this should be replaced with a proper job queue (Bull/BullMQ)
 */

import { prisma } from '@/lib/prisma';

interface QueuedDeployment {
  deploymentId: string;
  websiteId: string;
  provider: any;
  addedAt: Date;
}

class DeploymentQueue {
  private queue: QueuedDeployment[] = [];
  private processing = new Map<string, boolean>(); // websiteId -> isProcessing
  private maxConcurrentPerWebsite = 1;
  
  /**
   * Add a deployment to the queue
   */
  async enqueue(deploymentId: string, websiteId: string, provider: any): Promise<void> {
    // Check if website already has an active deployment
    if (this.processing.get(websiteId)) {
      // Update deployment status to queued
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { 
          status: 'queued',
          deploymentData: {
            logs: [{
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Deployment queued - waiting for previous deployment to complete'
            }]
          } as any
        }
      });
    }
    
    this.queue.push({
      deploymentId,
      websiteId,
      provider,
      addedAt: new Date()
    });
    
    // Process queue
    this.processNext();
  }
  
  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<void> {
    // Find next deployment that can be processed
    const nextDeployment = this.queue.find(
      item => !this.processing.get(item.websiteId)
    );
    
    if (!nextDeployment) {
      return; // No deployments can be processed right now
    }
    
    // Remove from queue
    const index = this.queue.indexOf(nextDeployment);
    this.queue.splice(index, 1);
    
    // Mark website as processing
    this.processing.set(nextDeployment.websiteId, true);
    
    try {
      // Update status to processing
      await prisma.deployment.update({
        where: { id: nextDeployment.deploymentId },
        data: { 
          status: 'processing'
        }
      });
      
      // Process the deployment
      // Note: In production, this would trigger a background job processor
      // For now, we'll just update the status to indicate it's ready for processing
      console.log(`Processing deployment ${nextDeployment.deploymentId} for website ${nextDeployment.websiteId}`);
      
    } catch (error) {
      // Update deployment status on error
      await prisma.deployment.update({
        where: { id: nextDeployment.deploymentId },
        data: { 
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Deployment failed',
          deployedAt: new Date()
        }
      });
    } finally {
      // Mark website as not processing
      this.processing.delete(nextDeployment.websiteId);
      
      // Process next item
      this.processNext();
    }
  }
  
  /**
   * Get queue status
   */
  getStatus(): { queued: number; processing: number } {
    return {
      queued: this.queue.length,
      processing: this.processing.size
    };
  }
  
  /**
   * Cancel a deployment
   */
  async cancel(deploymentId: string): Promise<boolean> {
    const index = this.queue.findIndex(item => item.deploymentId === deploymentId);
    
    if (index !== -1) {
      this.queue.splice(index, 1);
      
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { 
          status: 'cancelled',
          deployedAt: new Date()
        }
      });
      
      return true;
    }
    
    return false;
  }
}

// Singleton instance
export const deploymentQueue = new DeploymentQueue();