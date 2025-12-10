import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EncryptionValidatorService } from './encryption-validator.service';

/**
 * Service for encrypting/decrypting sensitive data (OAuth tokens)
 * Uses AES-256-GCM encryption with key validation and versioning
 *
 * Key Rotation Strategy:
 * - Supports multiple encryption key versions (v1, v2, etc.)
 * - Encrypted data is prefixed with version: "v2:base64data"
 * - Decryption auto-detects version and uses appropriate key
 * - Backward compatibility: no prefix = v1 (legacy data)
 * - Encryption always uses latest available key version
 *
 * Environment Variables:
 * - ENCRYPTION_KEY or ENCRYPTION_KEY_V1: Primary/legacy key
 * - ENCRYPTION_KEY_V2, ENCRYPTION_KEY_V3, etc.: Newer keys for rotation
 */
@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  // Cache the validation result and key buffers
  private cachedKeys: Map<number, Buffer> = new Map();
  private hasValidated = false;
  private latestKeyVersion: number = 1;

  constructor(
    private configService: ConfigService,
    private validatorService: EncryptionValidatorService,
  ) {}

  /**
   * Load and validate all available encryption keys
   *
   * Checks for ENCRYPTION_KEY (v1 alias) and ENCRYPTION_KEY_V1, V2, V3, etc.
   * Validates each key and caches them for performance.
   */
  private loadEncryptionKeys(): void {
    if (this.hasValidated) {
      return;
    }

    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';

    // Check for v1 key (ENCRYPTION_KEY or ENCRYPTION_KEY_V1)
    const v1Key = this.configService.get<string>('ENCRYPTION_KEY') ||
                  this.configService.get<string>('ENCRYPTION_KEY_V1');

    if (!v1Key) {
      if (isProduction) {
        this.logger.error('ENCRYPTION_KEY or ENCRYPTION_KEY_V1 is required in production');
        throw new InternalServerErrorException('Server configuration error. Please contact support.');
      }

      // For development, use a fallback
      this.logger.warn('Using fallback development encryption key. This is INSECURE and should never be used in production!');
      const fallbackKey = crypto.scryptSync('dev-key-change-in-production', 'salt', this.keyLength);
      this.cachedKeys.set(1, fallbackKey);
      this.latestKeyVersion = 1;
      this.hasValidated = true;
      return;
    }

    // Validate and cache v1 key
    this.validateAndCacheKey(v1Key, 1, isProduction);

    // Check for additional versioned keys (v2, v3, etc.)
    let version = 2;
    let foundHigherVersion = false;

    // Check up to v10 (reasonable limit)
    while (version <= 10) {
      const versionedKey = this.configService.get<string>(`ENCRYPTION_KEY_V${version}`);
      if (versionedKey) {
        this.validateAndCacheKey(versionedKey, version, isProduction);
        foundHigherVersion = true;
        this.latestKeyVersion = version;
      }
      version++;
    }

    if (foundHigherVersion) {
      this.logger.log(`Loaded ${this.cachedKeys.size} encryption key version(s). Latest: v${this.latestKeyVersion}`);
    }

    this.hasValidated = true;
  }

  /**
   * Validate a specific key version and cache it
   */
  private validateAndCacheKey(key: string, version: number, isProduction: boolean): void {
    const validationResult = this.validatorService.validateEncryptionKey(key, isProduction);

    // Log validation results
    this.validatorService.logKeyValidation(validationResult, process.env.NODE_ENV || 'development');

    // In production, refuse to start with invalid or dev keys
    if (isProduction && (!validationResult.isValid || validationResult.isDevKey)) {
      this.logger.error(`FATAL: Cannot start in production with insecure encryption key v${version}`);
      throw new InternalServerErrorException('Server configuration error. Please contact support.');
    }

    // Convert hex string to Buffer
    let keyBuffer: Buffer;
    try {
      keyBuffer = Buffer.from(key, 'hex');
    } catch (error) {
      this.logger.error(`Failed to parse ENCRYPTION_KEY_V${version} as hexadecimal`, error);
      throw new InternalServerErrorException('Server configuration error. Please contact support.');
    }

    // Verify key length
    if (keyBuffer.length !== this.keyLength) {
      this.logger.error(`ENCRYPTION_KEY_V${version} must be exactly ${this.keyLength * 2} hex characters (${this.keyLength} bytes)`);
      if (isProduction) {
        throw new InternalServerErrorException('Server configuration error. Please contact support.');
      }
    }

    // Cache the validated key
    this.cachedKeys.set(version, keyBuffer);
  }

  /**
   * Get a specific encryption key version
   */
  private getEncryptionKey(version: number = this.latestKeyVersion): Buffer {
    this.loadEncryptionKeys();

    const key = this.cachedKeys.get(version);
    if (!key) {
      throw new InternalServerErrorException(`Encryption key v${version} not available`);
    }

    return key;
  }

  /**
   * Get all available key versions
   */
  getAvailableKeyVersions(): number[] {
    this.loadEncryptionKeys();
    return Array.from(this.cachedKeys.keys()).sort((a, b) => a - b);
  }

  /**
   * Get the latest key version number
   */
  getLatestKeyVersion(): number {
    this.loadEncryptionKeys();
    return this.latestKeyVersion;
  }

  /**
   * Validate encryption key configuration
   *
   * Can be called externally (e.g., in onModuleInit) to validate configuration
   * before any encryption operations.
   */
  validateKeyConfiguration(): void {
    // This will trigger validation and throw if invalid in production
    this.loadEncryptionKeys();
    this.logger.log('Encryption service initialized successfully');
  }

  /**
   * Encrypt a string value using the latest key version
   *
   * Returns versioned format: "v2:base64data"
   */
  encrypt(plaintext: string): string {
    const version = this.latestKeyVersion;
    const key = this.getEncryptionKey(version);
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

    const base64Data = combined.toString('base64');

    // Prefix with version
    return `v${version}:${base64Data}`;
  }

  /**
   * Decrypt an encrypted string value
   *
   * Auto-detects version from format:
   * - "v2:base64data" → uses key v2
   * - "base64data" (no prefix) → uses key v1 (backward compatibility)
   */
  decrypt(encrypted: string): string {
    // Parse version prefix
    let version = 1;
    let base64Data = encrypted;

    const versionMatch = encrypted.match(/^v(\d+):(.+)$/);
    if (versionMatch) {
      version = parseInt(versionMatch[1], 10);
      base64Data = versionMatch[2];
    }

    // Get the appropriate key
    const key = this.getEncryptionKey(version);
    const combined = Buffer.from(base64Data, 'base64');

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

  /**
   * Re-encrypt data with a new key version
   *
   * Decrypts with old key, encrypts with new key.
   * Used by key rotation service.
   */
  reencrypt(encrypted: string, targetVersion?: number): string {
    const plaintext = this.decrypt(encrypted);

    if (targetVersion !== undefined) {
      // Temporarily override latestKeyVersion for this operation
      const originalVersion = this.latestKeyVersion;
      this.latestKeyVersion = targetVersion;
      const result = this.encrypt(plaintext);
      this.latestKeyVersion = originalVersion;
      return result;
    }

    return this.encrypt(plaintext);
  }

  /**
   * Extract version from encrypted data
   */
  getVersionFromEncrypted(encrypted: string): number {
    const versionMatch = encrypted.match(/^v(\d+):/);
    return versionMatch ? parseInt(versionMatch[1], 10) : 1;
  }
}

