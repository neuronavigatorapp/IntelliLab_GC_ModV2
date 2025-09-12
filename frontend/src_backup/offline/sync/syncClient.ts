import { 
  SyncEnvelope, 
  SyncPullResponse, 
  PushResult, 
  SyncCursor, 
  SyncStatus,
  ConflictResolution 
} from './types';
import { mutationQueue } from './queue';

export class SyncClient {
  private clientId: string;
  private syncCursor: SyncCursor;
  private syncInProgress = false;
  private lastError?: string;

  constructor() {
    this.clientId = this.generateClientId();
    this.syncCursor = this.loadSyncCursor();
  }

  async pullChanges(since?: string): Promise<SyncPullResponse> {
    try {
      const response = await fetch('/api/v1/sync/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ since })
      });

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status} ${response.statusText}`);
      }

      const result: SyncPullResponse = await response.json();
      
      // Update sync cursor
      this.syncCursor.last_sync_at = result.server_time;
      this.saveSyncCursor();

      console.log('Pull successful:', result);
      return result;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Pull failed:', error);
      throw error;
    }
  }

  async pushChanges(changes: Record<string, any[]>, attachments?: any[]): Promise<PushResult> {
    const envelope: SyncEnvelope = {
      client_id: this.clientId,
      since: this.syncCursor.last_sync_at,
      changes,
      attachments
    };

    try {
      const response = await fetch('/api/v1/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelope)
      });

      if (!response.ok) {
        throw new Error(`Push failed: ${response.status} ${response.statusText}`);
      }

      const result: PushResult = await response.json();
      
      // Update sync cursor
      this.syncCursor.last_sync_at = result.server_time;
      this.saveSyncCursor();

      console.log('Push successful:', result);
      return result;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error('Push failed:', error);
      throw error;
    }
  }

  async sync(): Promise<{
    pullResult?: SyncPullResponse;
    pushResult?: PushResult;
    conflicts: ConflictResolution[];
  }> {
    if (this.syncInProgress) {
      throw new Error('Sync already in progress');
    }

    this.syncInProgress = true;
    const conflicts: ConflictResolution[] = [];

    try {
      // Pull changes from server
      const pullResult = await this.pullChanges(this.syncCursor.last_sync_at);

      // Get local changes to push
      const localChanges = await this.getLocalChanges();
      
      let pushResult: PushResult | undefined;
      if (Object.keys(localChanges).length > 0) {
        pushResult = await this.pushChanges(localChanges);
        
        // Handle conflicts
        if (pushResult.conflicts.length > 0) {
          for (const conflict of pushResult.conflicts) {
            const resolution = await this.resolveConflict(conflict);
            conflicts.push(resolution);
          }
        }
      }

      return { pullResult, pushResult, conflicts };
    } finally {
      this.syncInProgress = false;
    }
  }

  async forceSync(): Promise<void> {
    try {
      // Process any queued mutations first
      await mutationQueue.processQueue();
      
      // Perform full sync
      await this.sync();
      
      console.log('Force sync completed');
    } catch (error) {
      console.error('Force sync failed:', error);
      throw error;
    }
  }

  getSyncStatus(): SyncStatus {
    const queueStatus = mutationQueue.getQueueStatus();
    
    return {
      isOnline: navigator.onLine,
      lastSyncAt: this.syncCursor.last_sync_at,
      pendingChanges: queueStatus.total,
      syncInProgress: this.syncInProgress,
      lastError: this.lastError
    };
  }

  private async getLocalChanges(): Promise<Record<string, any[]>> {
    // This would collect changes from local storage/IndexedDB
    // For now, return empty object - implementation depends on data layer
    return {};
  }

  private async resolveConflict(conflict: any): Promise<ConflictResolution> {
    // Default resolution: use server version
    // In a real app, this would show a UI for user to choose
    return {
      entity: conflict.entity,
      id: conflict.id,
      resolution: 'server'
    };
  }

  private generateClientId(): string {
    let clientId = localStorage.getItem('intellilab_client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('intellilab_client_id', clientId);
    }
    return clientId;
  }

  private loadSyncCursor(): SyncCursor {
    try {
      const saved = localStorage.getItem('intellilab_sync_cursor');
      return saved ? JSON.parse(saved) : { entities: {} };
    } catch (error) {
      console.error('Failed to load sync cursor:', error);
      return { entities: {} };
    }
  }

  private saveSyncCursor(): void {
    try {
      localStorage.setItem('intellilab_sync_cursor', JSON.stringify(this.syncCursor));
    } catch (error) {
      console.error('Failed to save sync cursor:', error);
    }
  }

  // Network status monitoring
  setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      console.log('Network online - processing queued mutations');
      mutationQueue.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline');
    });
  }
}

// Global instance
export const syncClient = new SyncClient();
