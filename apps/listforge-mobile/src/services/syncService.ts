import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';

import { db } from './database';
import { API_URL, SYNC_RETRY_DELAYS, MAX_RETRY_ATTEMPTS } from '../constants';
import { store } from '../store';
import { setSyncingStatus, setPendingCount, setLastSyncAt } from '../store/slices/syncSlice';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

class SyncService {
  private isSyncing = false;

  async startBackgroundSync() {
    // Register background task
    try {
      await TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        await this.syncAll();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  async stopBackgroundSync() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    } catch (error) {
      console.error('Failed to unregister background sync:', error);
    }
  }

  async syncAll() {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection, skipping sync');
      return;
    }

    this.isSyncing = true;
    store.dispatch(setSyncingStatus(true));

    try {
      const pendingCaptures = await db.getPendingCaptures();
      console.log(`Syncing ${pendingCaptures.length} pending captures`);

      for (const capture of pendingCaptures) {
        // Skip if max retries exceeded
        if (capture.retry_count >= MAX_RETRY_ATTEMPTS) {
          console.log(`Skipping capture ${capture.id} - max retries exceeded`);
          continue;
        }

        try {
          await this.syncCapture(capture.id);
        } catch (error) {
          console.error(`Failed to sync capture ${capture.id}:`, error);
          // Error handling is done in syncCapture method
        }
      }

      // Update pending count
      const stats = await db.getStorageStats();
      store.dispatch(setPendingCount(stats.captureCount));
      store.dispatch(setLastSyncAt(Date.now()));
    } finally {
      this.isSyncing = false;
      store.dispatch(setSyncingStatus(false));
    }
  }

  async syncCapture(captureId: string) {
    console.log(`Syncing capture ${captureId}`);

    // Update status to syncing
    await db.updateCaptureStatus(captureId, 'syncing');

    try {
      // Get capture and photos from database
      const [captures, photos] = await Promise.all([
        db.getPendingCaptures(),
        db.getPhotosForCapture(captureId),
      ]);

      const capture = captures.find((c) => c.id === captureId);
      if (!capture) {
        throw new Error('Capture not found');
      }

      // Create FormData
      const formData = new FormData();

      if (capture.title) {
        formData.append('title', capture.title);
      }
      if (capture.description) {
        formData.append('description', capture.description);
      }

      // Add photos to FormData
      for (const photo of photos) {
        const fileInfo = await FileSystem.getInfoAsync(photo.uri);

        if (!fileInfo.exists) {
          throw new Error(`Photo file not found: ${photo.uri}`);
        }

        // Get file extension from URI
        const uriParts = photo.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('photos', {
          uri: photo.uri,
          name: `photo-${photo.id}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      // Get auth token
      const token = store.getState().auth.token;
      if (!token) {
        throw new Error('No authentication token');
      }

      // Upload to API
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload failed: ${error}`);
      }

      // Mark as synced
      await db.updateCaptureStatus(captureId, 'synced');
      await db.logSyncAttempt(captureId, true);

      console.log(`Successfully synced capture ${captureId}`);

      // Clean up after 24 hours (optional - keep for history)
      // Can be called periodically to free up space
      // await this.cleanupOldCaptures();
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      console.error(`Sync failed for capture ${captureId}:`, errorMessage);

      // Increment retry count
      await db.incrementRetryCount(captureId);
      await db.updateCaptureStatus(captureId, 'error', errorMessage);
      await db.logSyncAttempt(captureId, false, errorMessage);

      // Get updated capture to check retry count
      const captures = await db.getPendingCaptures();
      const capture = captures.find((c) => c.id === captureId);

      if (capture && capture.retry_count < MAX_RETRY_ATTEMPTS) {
        // Schedule retry with exponential backoff
        const delay = SYNC_RETRY_DELAYS[Math.min(capture.retry_count, SYNC_RETRY_DELAYS.length - 1)];
        console.log(`Scheduling retry for capture ${captureId} in ${delay}ms`);

        setTimeout(() => {
          this.syncCapture(captureId);
        }, delay);
      }

      throw error;
    }
  }

  async cleanupOldCaptures() {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    await db.cleanupOldSyncedCaptures(oneDayAgo);
  }

  async getPendingCount(): Promise<number> {
    const stats = await db.getStorageStats();
    return stats.captureCount;
  }
}

export const syncService = new SyncService();
