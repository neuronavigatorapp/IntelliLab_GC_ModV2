import { QueuedMutation } from './types';

export class MutationQueue {
  private queue: QueuedMutation[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.loadQueue();
  }

  async addMutation(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: any
  ): Promise<string> {
    const mutation: QueuedMutation = {
      id: this.generateId(),
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries
    };

    this.queue.push(mutation);
    await this.saveQueue();
    
    console.log(`Queued mutation: ${method} ${endpoint}`);
    return mutation.id;
  }

  async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`Processing ${this.queue.length} queued mutations`);

    const mutations = [...this.queue];
    const results: Array<{ success: boolean; mutation: QueuedMutation; error?: string }> = [];

    for (const mutation of mutations) {
      try {
        const success = await this.processMutation(mutation);
        results.push({ success, mutation });
        
        if (success) {
          // Remove from queue on success
          this.queue = this.queue.filter(m => m.id !== mutation.id);
        } else {
          // Increment retry count
          mutation.retryCount++;
          if (mutation.retryCount >= mutation.maxRetries) {
            // Remove from queue after max retries
            this.queue = this.queue.filter(m => m.id !== mutation.id);
            results.push({ success: false, mutation, error: 'Max retries exceeded' });
          }
        }
      } catch (error) {
        console.error('Error processing mutation:', error);
        results.push({ 
          success: false, 
          mutation, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    await this.saveQueue();
    this.processing = false;

    // Emit results
    this.emitQueueProcessed(results);
  }

  private async processMutation(mutation: QueuedMutation): Promise<boolean> {
    try {
      const response = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mutation.data)
      });

      if (response.ok) {
        console.log(`Mutation processed successfully: ${mutation.method} ${mutation.endpoint}`);
        return true;
      } else {
        console.warn(`Mutation failed: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      console.error('Network error processing mutation:', error);
      return false;
    }
  }

  async retryFailed(): Promise<void> {
    const failedMutations = this.queue.filter(m => m.retryCount > 0);
    if (failedMutations.length === 0) {
      return;
    }

    console.log(`Retrying ${failedMutations.length} failed mutations`);
    
    // Reset retry counts
    failedMutations.forEach(m => m.retryCount = 0);
    await this.saveQueue();
    
    // Process queue again
    await this.processQueue();
  }

  getQueueStatus(): {
    total: number;
    pending: number;
    failed: number;
    processing: boolean;
  } {
    const failed = this.queue.filter(m => m.retryCount > 0).length;
    
    return {
      total: this.queue.length,
      pending: this.queue.filter(m => m.retryCount === 0).length,
      failed,
      processing: this.processing
    };
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Mutation queue cleared');
  }

  private generateId(): string {
    return `mutation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveQueue(): Promise<void> {
    try {
      localStorage.setItem('intellilab_mutation_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save mutation queue:', error);
    }
  }

  private loadQueue(): void {
    try {
      const saved = localStorage.getItem('intellilab_mutation_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
        console.log(`Loaded ${this.queue.length} queued mutations`);
      }
    } catch (error) {
      console.error('Failed to load mutation queue:', error);
      this.queue = [];
    }
  }

  private emitQueueProcessed(results: Array<{ success: boolean; mutation: QueuedMutation; error?: string }>): void {
    const event = new CustomEvent('mutation-queue-processed', {
      detail: {
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      }
    });
    window.dispatchEvent(event);
  }

  // Background sync support
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('background-sync');
        console.log('Background sync registered');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }
}

// Global instance
export const mutationQueue = new MutationQueue();
