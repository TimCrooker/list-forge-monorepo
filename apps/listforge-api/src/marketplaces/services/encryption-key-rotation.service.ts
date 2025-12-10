import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceAccount } from '../entities/marketplace-account.entity';
import { EncryptionService } from './encryption.service';

/**
 * Rotation statistics interface
 */
export interface RotationStatistics {
  totalAccounts: number;
  accountsToRotate: number;
  accountsRotated: number;
  accountsFailed: number;
  errors: Array<{ accountId: string; error: string }>;
  dryRun: boolean;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
}

/**
 * Rotation options interface
 */
export interface RotationOptions {
  dryRun?: boolean;
  batchSize?: number;
  targetVersion?: number;
  onlyVersion?: number; // Only rotate accounts using this specific version
}

/**
 * EncryptionKeyRotationService
 *
 * Manages encryption key rotation for marketplace OAuth tokens.
 *
 * Features:
 * - Batch processing to avoid overwhelming the database
 * - Dry-run mode to preview changes without modifying data
 * - Progress tracking and detailed statistics
 * - Graceful error handling (continues on individual failures)
 * - Target version specification for controlled migration
 *
 * Usage:
 * 1. Add new ENCRYPTION_KEY_V2 to environment
 * 2. Restart app to load new key
 * 3. Run rotation: `npm run cli rotate-encryption-keys [--dry-run]`
 * 4. Monitor progress and verify success
 * 5. After 30 days, remove old ENCRYPTION_KEY_V1
 *
 * @see Phase 4.3: Encryption Key Rotation Strategy
 */
@Injectable()
export class EncryptionKeyRotationService {
  private readonly logger = new Logger(EncryptionKeyRotationService.name);

  constructor(
    @InjectRepository(MarketplaceAccount)
    private accountRepo: Repository<MarketplaceAccount>,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Rotate encryption keys for all marketplace accounts
   *
   * @param options - Rotation configuration
   * @returns Statistics about the rotation operation
   */
  async rotateKeys(options: RotationOptions = {}): Promise<RotationStatistics> {
    const {
      dryRun = false,
      batchSize = 100,
      targetVersion,
      onlyVersion,
    } = options;

    const stats: RotationStatistics = {
      totalAccounts: 0,
      accountsToRotate: 0,
      accountsRotated: 0,
      accountsFailed: 0,
      errors: [],
      dryRun,
      startedAt: new Date(),
    };

    this.logger.log(`Starting key rotation${dryRun ? ' (DRY RUN)' : ''}...`);

    // Determine target version
    const finalTargetVersion = targetVersion ?? this.encryptionService.getLatestKeyVersion();
    const availableVersions = this.encryptionService.getAvailableKeyVersions();

    this.logger.log(`Available key versions: ${availableVersions.join(', ')}`);
    this.logger.log(`Target version: v${finalTargetVersion}`);

    if (onlyVersion !== undefined) {
      this.logger.log(`Filtering: Only rotating accounts using v${onlyVersion}`);
    }

    try {
      // Get all accounts with encrypted tokens
      const accounts = await this.accountRepo.find({
        where: { status: 'active' },
        order: { createdAt: 'ASC' },
      });

      stats.totalAccounts = accounts.length;
      this.logger.log(`Found ${stats.totalAccounts} active marketplace accounts`);

      // Filter accounts that need rotation
      const accountsToRotate = accounts.filter((account) => {
        if (!account.accessToken) {
          return false; // Skip accounts without tokens
        }

        const currentVersion = this.encryptionService.getVersionFromEncrypted(
          account.accessToken,
        );

        // If onlyVersion is specified, only rotate that version
        if (onlyVersion !== undefined && currentVersion !== onlyVersion) {
          return false;
        }

        // Skip if already at target version
        return currentVersion !== finalTargetVersion;
      });

      stats.accountsToRotate = accountsToRotate.length;

      if (stats.accountsToRotate === 0) {
        this.logger.log('No accounts need key rotation');
        stats.completedAt = new Date();
        stats.duration = stats.completedAt.getTime() - stats.startedAt.getTime();
        return stats;
      }

      this.logger.log(
        `${stats.accountsToRotate} account(s) need rotation to v${finalTargetVersion}`,
      );

      if (dryRun) {
        this.logger.log('DRY RUN: No changes will be made');
        this.logDryRunPreview(accountsToRotate, finalTargetVersion);
        stats.completedAt = new Date();
        stats.duration = stats.completedAt.getTime() - stats.startedAt.getTime();
        return stats;
      }

      // Process in batches
      for (let i = 0; i < accountsToRotate.length; i += batchSize) {
        const batch = accountsToRotate.slice(i, i + batchSize);
        await this.rotateBatch(batch, finalTargetVersion, stats);

        this.logger.log(
          `Progress: ${stats.accountsRotated + stats.accountsFailed}/${stats.accountsToRotate} ` +
          `(${stats.accountsRotated} success, ${stats.accountsFailed} failed)`,
        );
      }

      stats.completedAt = new Date();
      stats.duration = stats.completedAt.getTime() - stats.startedAt.getTime();

      this.logger.log('Key rotation complete');
      this.logger.log(`Total: ${stats.accountsToRotate}, Success: ${stats.accountsRotated}, Failed: ${stats.accountsFailed}`);
      this.logger.log(`Duration: ${(stats.duration / 1000).toFixed(2)}s`);

      if (stats.accountsFailed > 0) {
        this.logger.warn(`${stats.accountsFailed} account(s) failed to rotate`);
        stats.errors.forEach((error) => {
          this.logger.error(`Account ${error.accountId}: ${error.error}`);
        });
      }

      return stats;
    } catch (error) {
      this.logger.error('Fatal error during key rotation', error);
      stats.completedAt = new Date();
      stats.duration = stats.completedAt.getTime() - stats.startedAt.getTime();
      throw error;
    }
  }

  /**
   * Rotate a batch of accounts
   */
  private async rotateBatch(
    accounts: MarketplaceAccount[],
    targetVersion: number,
    stats: RotationStatistics,
  ): Promise<void> {
    const promises = accounts.map((account) =>
      this.rotateAccount(account, targetVersion, stats),
    );

    await Promise.allSettled(promises);
  }

  /**
   * Rotate encryption for a single account
   */
  private async rotateAccount(
    account: MarketplaceAccount,
    targetVersion: number,
    stats: RotationStatistics,
  ): Promise<void> {
    try {
      const currentVersion = this.encryptionService.getVersionFromEncrypted(
        account.accessToken,
      );

      this.logger.debug(
        `Rotating account ${account.id} (${account.marketplace}) from v${currentVersion} to v${targetVersion}`,
      );

      // Re-encrypt access token
      account.accessToken = this.encryptionService.reencrypt(
        account.accessToken,
        targetVersion,
      );

      // Re-encrypt refresh token if present
      if (account.refreshToken) {
        account.refreshToken = this.encryptionService.reencrypt(
          account.refreshToken,
          targetVersion,
        );
      }

      // Save updated account
      await this.accountRepo.save(account);

      stats.accountsRotated++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to rotate account ${account.id}`, errorMessage);

      stats.accountsFailed++;
      stats.errors.push({
        accountId: account.id,
        error: errorMessage,
      });
    }
  }

  /**
   * Log dry-run preview of what would be rotated
   */
  private logDryRunPreview(
    accounts: MarketplaceAccount[],
    targetVersion: number,
  ): void {
    this.logger.log('\n--- DRY RUN PREVIEW ---');

    // Group by current version
    const versionGroups = new Map<number, MarketplaceAccount[]>();
    accounts.forEach((account) => {
      const version = this.encryptionService.getVersionFromEncrypted(
        account.accessToken,
      );
      if (!versionGroups.has(version)) {
        versionGroups.set(version, []);
      }
      versionGroups.get(version)!.push(account);
    });

    // Log summary by version
    versionGroups.forEach((accountList, version) => {
      this.logger.log(`v${version} → v${targetVersion}: ${accountList.length} account(s)`);
      accountList.slice(0, 5).forEach((account) => {
        this.logger.log(
          `  - ${account.id} (${account.marketplace}, org: ${account.orgId})`,
        );
      });
      if (accountList.length > 5) {
        this.logger.log(`  ... and ${accountList.length - 5} more`);
      }
    });

    this.logger.log('--- END PREVIEW ---\n');
  }

  /**
   * Get key rotation status report
   *
   * Returns statistics about current key usage across all accounts
   */
  async getKeyUsageReport(): Promise<{
    totalAccounts: number;
    versionDistribution: Map<number, number>;
    accountsNeedingRotation: number;
  }> {
    const accounts = await this.accountRepo.find({
      where: { status: 'active' },
    });

    const versionDistribution = new Map<number, number>();
    let accountsNeedingRotation = 0;

    const latestVersion = this.encryptionService.getLatestKeyVersion();

    accounts.forEach((account) => {
      if (!account.accessToken) {
        return;
      }

      const version = this.encryptionService.getVersionFromEncrypted(
        account.accessToken,
      );

      versionDistribution.set(version, (versionDistribution.get(version) || 0) + 1);

      if (version !== latestVersion) {
        accountsNeedingRotation++;
      }
    });

    return {
      totalAccounts: accounts.length,
      versionDistribution,
      accountsNeedingRotation,
    };
  }
}
