import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { put, del } from '@vercel/blob';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

type StorageProvider = 'vercel' | 'spaces' | 's3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;
  private readonly vercelToken: string;
  private readonly s3Client: S3Client | null;
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'vercel') as StorageProvider;

    if (this.provider === 'vercel') {
      this.vercelToken = process.env.BLOB_READ_WRITE_TOKEN || '';
      if (!this.vercelToken) {
        this.logger.warn('BLOB_READ_WRITE_TOKEN not set - storage operations will fail');
      }
      this.s3Client = null;
      this.s3Bucket = '';
      this.s3Region = '';
    } else if (this.provider === 's3') {
      // AWS S3 configuration
      this.s3Bucket = process.env.S3_BUCKET || '';
      this.s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';

      if (!this.s3Bucket) {
        this.logger.warn('S3_BUCKET not set - storage operations will fail');
        this.s3Client = null;
      } else {
        // AWS SDK automatically uses credentials from environment (IAM role, credentials file, or env vars)
        this.s3Client = new S3Client({
          region: this.s3Region,
        });
      }
      this.vercelToken = '';
    } else {
      // DO Spaces configuration (legacy)
      const accessKeyId = process.env.SPACES_KEY || '';
      const secretAccessKey = process.env.SPACES_SECRET || '';
      const spacesEndpoint = process.env.SPACES_ENDPOINT || '';
      this.s3Bucket = process.env.SPACES_BUCKET || '';
      this.s3Region = 'us-east-1';

      if (!accessKeyId || !secretAccessKey || !spacesEndpoint || !this.s3Bucket) {
        this.logger.warn('DO Spaces configuration incomplete - storage operations will fail');
        this.s3Client = null;
      } else {
        this.s3Client = new S3Client({
          endpoint: spacesEndpoint,
          region: this.s3Region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle: false,
        });
      }
      this.vercelToken = '';
    }
  }

  async uploadPhoto(file: Buffer, filename: string): Promise<string> {
    if (this.provider === 'vercel') {
      if (!this.vercelToken) {
        throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
      }

      const blob = await put(filename, file as any, {
        access: 'public',
        token: this.vercelToken,
      });

      return blob.url;
    } else {
      // S3 (AWS or DO Spaces)
      if (!this.s3Client || !this.s3Bucket) {
        throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
      }

      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: filename,
        Body: file,
        ACL: 'public-read',
        ContentType: this.getContentType(filename),
      });

      await this.s3Client.send(command);

      // Construct public URL
      if (this.provider === 's3') {
        // AWS S3: https://bucket-name.s3.region.amazonaws.com/key
        return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${filename}`;
      } else {
        // DO Spaces: https://bucket-name.endpoint/key
        const endpointUrl = process.env.SPACES_ENDPOINT?.replace(/^https?:\/\//, '').replace(/\/$/, '') || '';
        return `https://${this.s3Bucket}.${endpointUrl}/${filename}`;
      }
    }
  }

  async deletePhoto(url: string): Promise<void> {
    if (this.provider === 'vercel') {
      if (!this.vercelToken) {
        throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
      }

      try {
        await del(url, { token: this.vercelToken });
      } catch (error) {
        // Log but don't throw - deletion failures shouldn't break the flow
        this.logger.error(`Failed to delete blob ${url}:`, error);
      }
    } else {
      // S3 (AWS or DO Spaces)
      if (!this.s3Client || !this.s3Bucket) {
        throw new ServiceUnavailableException('File storage is not configured. Please contact support.');
      }

      try {
        // Extract key from URL
        const key = this.extractKeyFromUrl(url);
        if (!key) {
          this.logger.warn(`Could not extract key from URL: ${url}`);
          return;
        }

        const command = new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        });

        await this.s3Client.send(command);
      } catch (error) {
        // Log but don't throw - deletion failures shouldn't break the flow
        this.logger.error(`Failed to delete object ${url}:`, error);
      }
    }
  }

  async getSignedUrl(url: string): Promise<string> {
    // Both Vercel Blob and DO Spaces URLs are public, so we can return as-is
    // If we need signed URLs later, we can use the respective SDKs
    return url;
  }

  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (this.provider === 's3') {
        // AWS S3: https://bucket-name.s3.region.amazonaws.com/key
        // Path is just the key
        return pathParts.join('/');
      } else {
        // DO Spaces: https://bucket-name.region.digitaloceanspaces.com/key
        if (urlObj.hostname.includes(this.s3Bucket)) {
          if (pathParts[0] === this.s3Bucket) {
            pathParts.shift();
          }
          return pathParts.join('/');
        }
        if (pathParts[0] === this.s3Bucket) {
          pathParts.shift();
        }
        return pathParts.join('/');
      }
    } catch {
      return null;
    }
  }
}

