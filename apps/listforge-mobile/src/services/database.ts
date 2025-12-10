import * as SQLite from 'expo-sqlite';

export interface PendingCaptureRow {
  id: string;
  title?: string;
  description?: string;
  created_at: number;
  sync_status: 'pending' | 'syncing' | 'synced' | 'error';
  error_message?: string;
  retry_count: number;
}

export interface CapturePhotoRow {
  id: string;
  capture_id: string;
  uri: string;
  order_index: number;
  upload_status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

export interface SyncLogRow {
  id: number;
  capture_id: string;
  attempt_at: number;
  success: boolean;
  error_message?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('listforge.db');

    // Create tables
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      -- Pending captures table
      CREATE TABLE IF NOT EXISTS pending_captures (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0
      );

      -- Capture photos table
      CREATE TABLE IF NOT EXISTS capture_photos (
        id TEXT PRIMARY KEY,
        capture_id TEXT NOT NULL,
        uri TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        upload_status TEXT NOT NULL DEFAULT 'pending',
        FOREIGN KEY (capture_id) REFERENCES pending_captures(id) ON DELETE CASCADE
      );

      -- Sync log table
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        capture_id TEXT NOT NULL,
        attempt_at INTEGER NOT NULL,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        FOREIGN KEY (capture_id) REFERENCES pending_captures(id) ON DELETE CASCADE
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_pending_captures_sync_status
        ON pending_captures(sync_status);
      CREATE INDEX IF NOT EXISTS idx_capture_photos_capture_id
        ON capture_photos(capture_id);
      CREATE INDEX IF NOT EXISTS idx_sync_log_capture_id
        ON sync_log(capture_id);
    `);
  }

  // Pending Captures
  async createCapture(capture: Omit<PendingCaptureRow, 'sync_status' | 'retry_count'>) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `INSERT INTO pending_captures (id, title, description, created_at, sync_status, retry_count)
       VALUES (?, ?, ?, ?, 'pending', 0)`,
      capture.id,
      capture.title || null,
      capture.description || null,
      capture.created_at
    );
  }

  async getPendingCaptures(): Promise<PendingCaptureRow[]> {
    await this.ensureInitialized();
    return await this.db!.getAllAsync<PendingCaptureRow>(
      `SELECT * FROM pending_captures WHERE sync_status IN ('pending', 'error') ORDER BY created_at ASC`
    );
  }

  async updateCaptureStatus(
    captureId: string,
    status: 'pending' | 'syncing' | 'synced' | 'error',
    errorMessage?: string
  ) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE pending_captures
       SET sync_status = ?, error_message = ?
       WHERE id = ?`,
      status,
      errorMessage || null,
      captureId
    );
  }

  async incrementRetryCount(captureId: string) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE pending_captures SET retry_count = retry_count + 1 WHERE id = ?`,
      captureId
    );
  }

  async deleteCapture(captureId: string) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `DELETE FROM pending_captures WHERE id = ?`,
      captureId
    );
  }

  // Capture Photos
  async addPhoto(photo: CapturePhotoRow) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `INSERT INTO capture_photos (id, capture_id, uri, order_index, upload_status)
       VALUES (?, ?, ?, ?, 'pending')`,
      photo.id,
      photo.capture_id,
      photo.uri,
      photo.order_index
    );
  }

  async getPhotosForCapture(captureId: string): Promise<CapturePhotoRow[]> {
    await this.ensureInitialized();
    return await this.db!.getAllAsync<CapturePhotoRow>(
      `SELECT * FROM capture_photos WHERE capture_id = ? ORDER BY order_index ASC`,
      captureId
    );
  }

  async updatePhotoStatus(photoId: string, status: 'pending' | 'uploading' | 'uploaded' | 'error') {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `UPDATE capture_photos SET upload_status = ? WHERE id = ?`,
      status,
      photoId
    );
  }

  async deletePhoto(photoId: string) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `DELETE FROM capture_photos WHERE id = ?`,
      photoId
    );
  }

  // Sync Log
  async logSyncAttempt(captureId: string, success: boolean, errorMessage?: string) {
    await this.ensureInitialized();
    await this.db!.runAsync(
      `INSERT INTO sync_log (capture_id, attempt_at, success, error_message)
       VALUES (?, ?, ?, ?)`,
      captureId,
      Date.now(),
      success ? 1 : 0,
      errorMessage || null
    );
  }

  async getSyncHistory(captureId: string): Promise<SyncLogRow[]> {
    await this.ensureInitialized();
    return await this.db!.getAllAsync<SyncLogRow>(
      `SELECT * FROM sync_log WHERE capture_id = ? ORDER BY attempt_at DESC`,
      captureId
    );
  }

  // Storage Management
  async getStorageStats() {
    await this.ensureInitialized();
    const [captureCount, photoCount] = await Promise.all([
      this.db!.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM pending_captures`),
      this.db!.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM capture_photos`),
    ]);

    return {
      captureCount: captureCount?.count || 0,
      photoCount: photoCount?.count || 0,
    };
  }

  async cleanupOldSyncedCaptures(olderThan: number) {
    await this.ensureInitialized();
    // Delete synced captures older than specified timestamp
    await this.db!.runAsync(
      `DELETE FROM pending_captures WHERE sync_status = 'synced' AND created_at < ?`,
      olderThan
    );
  }

  private async ensureInitialized() {
    if (!this.db) {
      await this.init();
    }
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
