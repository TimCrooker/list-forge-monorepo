import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

type StorageProvider = 's3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;
  private readonly s3Client: S3Client | null;
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 's3') as StorageProvider;

    if (this.provider === 's3') {
      // AWS S3 or MinIO configuration
      this.s3Bucket = process.env.S3_BUCKET || '';
      this.s3Region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
      const s3Endpoint = process.env.S3_ENDPOINT; // For local MinIO: http://localhost:9000
      const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID; // For MinIO: minioadmin
      const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY; // For MinIO: minioadmin

      if (!this.s3Bucket) {
        this.logger.warn('S3_BUCKET not set - storage operations will fail');
        this.s3Client = null;
      } else {
        // If endpoint is provided, use it (for MinIO or other S3-compatible services)
        const clientConfig: any = {
          region: this.s3Region,
        };

        if (s3Endpoint) {
          clientConfig.endpoint = s3Endpoint;
          // MinIO requires path-style URLs
          clientConfig.forcePathStyle = true;
          // Use provided credentials or fall back to AWS SDK defaults
          if (s3AccessKeyId && s3SecretAccessKey) {
            clientConfig.credentials = {
              accessKeyId: s3AccessKeyId,
              secretAccessKey: s3SecretAccessKey,
            };
          }
        }
        // Otherwise, AWS SDK automatically uses credentials from environment (IAM role, credentials file, or env vars)

        this.s3Client = new S3Client(clientConfig);
      }
    }
  }

  async uploadPhoto(file: Buffer, filename: string): Promise<string> {
    // S3 (AWS S3 or MinIO)
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
    const s3Endpoint = process.env.S3_ENDPOINT;
    if (s3Endpoint) {
      // MinIO or custom S3-compatible: http://localhost:9000/bucket-name/key
      const endpointUrl = s3Endpoint.replace(/\/$/, '');
      return `${endpointUrl}/${this.s3Bucket}/${filename}`;
    } else {
      // AWS S3: https://bucket-name.s3.region.amazonaws.com/key
      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${filename}`;
    }
  }

  async deletePhoto(url: string): Promise<void> {
    // S3 (AWS S3 or MinIO)
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

  async getSignedUrl(url: string): Promise<string> {
    // S3 URLs are public, so we can return as-is
    // If we need signed URLs later, we can use the AWS SDK
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

      const s3Endpoint = process.env.S3_ENDPOINT;
      if (s3Endpoint) {
        // MinIO or custom S3-compatible: http://localhost:9000/bucket-name/key
        // Path format: /bucket-name/key, so remove first part if it's the bucket name
        if (pathParts[0] === this.s3Bucket) {
          pathParts.shift();
        }
        return pathParts.join('/');
      } else {
        // AWS S3: https://bucket-name.s3.region.amazonaws.com/key
        // Path is just the key
        return pathParts.join('/');
      }
    } catch {
      return null;
    }
  }
}

