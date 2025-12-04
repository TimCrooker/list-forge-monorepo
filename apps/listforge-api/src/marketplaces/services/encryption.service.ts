import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service for encrypting/decrypting sensitive data (OAuth tokens)
 * Uses AES-256-GCM encryption
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {}

  /**
   * Get encryption key from environment or generate a default (for dev only)
   */
  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      // In production, this should always be set
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('ENCRYPTION_KEY is required in production');
        throw new InternalServerErrorException('Server configuration error. Please contact support.');
      }
      // For development, use a default key (NOT SECURE - only for dev)
      return crypto.scryptSync('dev-key-change-in-production', 'salt', this.keyLength);
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt a string value
   */
  encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  }

  /**
   * Decrypt an encrypted string value
   */
  decrypt(encrypted: string): string {
    const key = this.getEncryptionKey();
    const combined = Buffer.from(encrypted, 'base64');

    // Extract components
    const salt = combined.slice(0, this.saltLength);
    const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = combined.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength,
    );
    const encryptedData = combined.slice(
      this.saltLength + this.ivLength + this.tagLength,
    );

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedData, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

