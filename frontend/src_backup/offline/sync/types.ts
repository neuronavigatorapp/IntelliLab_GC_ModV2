export interface SyncCursor {
  last_sync_at?: string;
  entities: Record<string, string>; // entity_type -> version/etag
}

export interface SyncEnvelope {
  client_id: string;
  since?: string;
  changes: Record<string, any[]>; // entity_type -> changes array
  attachments?: AttachmentMeta[];
}

export interface AttachmentMeta {
  id?: string;
  entity_type: string;
  entity_id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at?: string;
  uploaded_at?: string;
}

export interface PushResult {
  accepted: string[];
  rejected: Array<{
    entity: string;
    id?: string;
    reason: string;
  }>;
  conflicts: Array<{
    entity: string;
    id?: string;
    client_version: number;
    server_version: number;
  }>;
  server_time: string;
}

export interface SyncPullResponse {
  server_time: string;
  changes: Record<string, any[]>;
  versions: Record<string, string>;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAt?: string;
  pendingChanges: number;
  syncInProgress: boolean;
  lastError?: string;
}

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictResolution {
  entity: string;
  id: string;
  resolution: 'client' | 'server' | 'manual';
  resolvedData?: any;
}

export interface OfflineStorage {
  instruments: any[];
  methods: any[];
  qc_records: any[];
  inventory: any[];
  sync_cursor: SyncCursor;
  queued_mutations: QueuedMutation[];
}
