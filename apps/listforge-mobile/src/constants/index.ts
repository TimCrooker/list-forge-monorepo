export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3000';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
} as const;

export const BARCODE_COOLDOWN_MS = 3000;
export const MAX_PHOTOS_PER_ITEM = 20;
export const MAX_OFFLINE_STORAGE_MB = 500;
export const MAX_OFFLINE_PHOTOS = 500;
export const SYNC_RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000]; // Exponential backoff
export const MAX_RETRY_ATTEMPTS = 5;
