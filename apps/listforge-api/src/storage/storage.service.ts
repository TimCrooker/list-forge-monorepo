import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { put, del } from '@vercel/blob';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly token: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    if (!this.token) {
      this.logger.warn('BLOB_READ_WRITE_TOKEN not set - storage operations will fail');
    }
  }

  async uploadPhoto(file: Buffer, filename: string): Promise<string> {
    if (!this.token) {
      throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
    }

    const blob = await put(filename, file as any, {
      access: 'public',
      token: this.token,
    });

    return blob.url;
  }

  async deletePhoto(url: string): Promise<void> {
    if (!this.token) {
      throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
    }

    try {
      await del(url, { token: this.token });
    } catch (error) {
      // Log but don't throw - deletion failures shouldn't break the flow
      this.logger.error(`Failed to delete blob ${url}:`, error);
    }
  }

  async getSignedUrl(url: string): Promise<string> {
    // Vercel Blob URLs are public, so we can return as-is
    // If we need signed URLs later, we can use the blob SDK
    return url;
  }
}

