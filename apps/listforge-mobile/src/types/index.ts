// Import and namespace shared types to avoid conflicts
import * as CoreTypes from '@listforge/core-types';
import * as ApiTypes from '@listforge/api-types';
import * as SocketTypes from '@listforge/socket-types';

// Re-export namespaced types
export { CoreTypes, ApiTypes, SocketTypes };

// Mobile-specific types
export interface PendingCapture {
  id: string;
  photos: PendingPhoto[];
  title?: string;
  description?: string;
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  errorMessage?: string;
  retryCount: number;
}

export interface PendingPhoto {
  id: string;
  uri: string;
  order: number;
  uploadStatus: 'pending' | 'uploading' | 'uploaded' | 'error';
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt?: number;
}
