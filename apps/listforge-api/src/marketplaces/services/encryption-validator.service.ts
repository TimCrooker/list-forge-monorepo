import { Injectable, Logger } from '@nestjs/common';

export interface KeyValidationResult {
  isValid: boolean;
  issues: string[];
  isDevKey: boolean;
  isStrong: boolean;
}

/**
 * EncryptionValidatorService
 *
 * Validates encryption keys for security and format compliance.
 * Detects default development keys and ensures production keys meet requirements.
 */
@Injectable()
export class EncryptionValidatorService {
  private readonly logger = new Logger(EncryptionValidatorService.name);

  // Known insecure default keys (for detection)
  private readonly DEFAULT_DEV_KEYS = [
    '00000000000000000000000000000000', // 32 bytes of zeros
    '00000000000000000000000000000000000000000000000000000000000000000', // 64 hex chars of zeros
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // All F's
    '11111111111111111111111111111111', // All 1's
  ];

  /**
   * Validate encryption key format and strength
   *
   * @param key - The encryption key to validate (hex string)
   * @param isProduction - Whether this is a production environment
   * @returns Validation result with issues
   */
  validateEncryptionKey(key: string | undefined, isProduction = false): KeyValidationResult {
    const issues: string[] = [];
    let isDevKey = false;
    let isStrong = true;

    // Check if key exists
    if (!key) {
      issues.push('Encryption key is not defined');
      return {
        isValid: false,
        issues,
        isDevKey: false,
        isStrong: false,
      };
    }

    // Check format: must be hex string
    if (!/^[0-9A-Fa-f]+$/.test(key)) {
      issues.push('Encryption key must be a valid hexadecimal string');
      isStrong = false;
    }

    // Check length: must be exactly 64 hex chars (32 bytes for AES-256)
    if (key.length !== 64) {
      issues.push(`Encryption key must be exactly 64 hexadecimal characters (256 bits), got ${key.length} characters`);
      isStrong = false;
    }

    // Check if it's a known default dev key
    const normalizedKey = key.toUpperCase();
    if (this.DEFAULT_DEV_KEYS.includes(normalizedKey)) {
      isDevKey = true;
      issues.push('Encryption key is a known default development key (INSECURE)');
      isStrong = false;
    }

    // Check key strength (entropy)
    if (key.length === 64) {
      const strengthResult = this.checkKeyStrength(Buffer.from(key, 'hex'));
      if (!strengthResult.isStrong) {
        issues.push(...strengthResult.issues);
        isStrong = false;
      }
    }

    // In production, being a dev key or weak is a critical error
    if (isProduction && (isDevKey || !isStrong)) {
      issues.push('Production environment detected with insecure encryption key. This is a CRITICAL SECURITY ISSUE.');
    }

    return {
      isValid: issues.length === 0,
      issues,
      isDevKey,
      isStrong,
    };
  }

  /**
   * Check if the key is the default development key
   */
  isDefaultDevKey(key: string): boolean {
    const normalizedKey = key.toUpperCase();
    return this.DEFAULT_DEV_KEYS.includes(normalizedKey);
  }

  /**
   * Check key strength based on entropy and patterns
   *
   * @param keyBuffer - The encryption key as a Buffer
   * @returns Strength result with issues
   */
  checkKeyStrength(keyBuffer: Buffer): { isStrong: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for all zeros
    if (keyBuffer.every(byte => byte === 0)) {
      issues.push('Key contains all zeros (no entropy)');
      return { isStrong: false, issues };
    }

    // Check for all same bytes
    const firstByte = keyBuffer[0];
    if (keyBuffer.every(byte => byte === firstByte)) {
      issues.push('Key contains only repeated bytes (no entropy)');
      return { isStrong: false, issues };
    }

    // Check for simple patterns (ascending/descending sequences)
    let isAscending = true;
    let isDescending = true;
    for (let i = 1; i < keyBuffer.length; i++) {
      if (keyBuffer[i] !== keyBuffer[i - 1] + 1) {
        isAscending = false;
      }
      if (keyBuffer[i] !== keyBuffer[i - 1] - 1) {
        isDescending = false;
      }
    }

    if (isAscending || isDescending) {
      issues.push('Key contains simple sequential pattern (weak)');
      return { isStrong: false, issues };
    }

    // Basic entropy check: count unique bytes
    const uniqueBytes = new Set(keyBuffer).size;
    const entropyRatio = uniqueBytes / keyBuffer.length;

    // For a 32-byte key, we expect at least 20 unique bytes (62.5% uniqueness)
    if (entropyRatio < 0.6) {
      issues.push(`Key has low entropy (only ${uniqueBytes} unique bytes out of ${keyBuffer.length})`);
      return { isStrong: false, issues };
    }

    return { isStrong: true, issues: [] };
  }

  /**
   * Generate a secure random encryption key (for development/testing)
   *
   * @returns A cryptographically secure 256-bit key as hex string
   */
  generateSecureKey(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Log key validation warnings
   */
  logKeyValidation(result: KeyValidationResult, nodeEnv: string): void {
    if (!result.isValid) {
      this.logger.error('='.repeat(80));
      this.logger.error('ENCRYPTION KEY VALIDATION FAILED');
      this.logger.error('='.repeat(80));

      result.issues.forEach((issue, index) => {
        this.logger.error(`${index + 1}. ${issue}`);
      });

      if (nodeEnv === 'production') {
        this.logger.error('');
        this.logger.error('THIS IS A CRITICAL SECURITY ISSUE IN PRODUCTION');
        this.logger.error('APPLICATION WILL NOT START WITH AN INSECURE ENCRYPTION KEY');
      } else {
        this.logger.warn('');
        this.logger.warn('RECOMMENDATION: Generate a secure key using:');
        this.logger.warn('  openssl rand -hex 32');
        this.logger.warn('');
        this.logger.warn('Then add it to your .env file as:');
        this.logger.warn('  ENCRYPTION_KEY=<generated_key>');
      }

      this.logger.error('='.repeat(80));
    } else if (result.isDevKey && nodeEnv !== 'production') {
      this.logger.warn('='.repeat(80));
      this.logger.warn('WARNING: Using default development encryption key');
      this.logger.warn('This is OK for development, but NEVER use this in production!');
      this.logger.warn('Generate a secure key: openssl rand -hex 32');
      this.logger.warn('='.repeat(80));
    } else {
      this.logger.log('Encryption key validation passed ✓');
    }
  }
}
