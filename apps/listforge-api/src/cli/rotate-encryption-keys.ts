#!/usr/bin/env ts-node

/**
 * CLI Script: Rotate Encryption Keys
 *
 * Rotates marketplace account OAuth token encryption from one key version to another.
 *
 * Usage:
 *   npm run cli:rotate-keys              # Rotate all accounts to latest key
 *   npm run cli:rotate-keys --dry-run    # Preview changes without modifying data
 *   npm run cli:rotate-keys --version 2  # Rotate to specific version
 *   npm run cli:rotate-keys --only 1     # Only rotate accounts using v1
 *   npm run cli:rotate-keys --help       # Show help
 *
 * Prerequisites:
 *   1. New encryption key must be configured in environment (e.g., ENCRYPTION_KEY_V2)
 *   2. Application must be stopped or no OAuth operations should be in progress
 *   3. Database backup recommended before running without --dry-run
 *
 * Safety:
 *   - Always run with --dry-run first to preview changes
 *   - Processes in batches to avoid overwhelming the database
 *   - Continues on individual failures, reports all errors at end
 *   - Can be safely re-run if interrupted (already-rotated accounts skipped)
 *
 * @see Phase 4.3: Encryption Key Rotation Strategy
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { EncryptionKeyRotationService } from '../marketplaces/services/encryption-key-rotation.service';

interface CliArguments {
  dryRun: boolean;
  targetVersion?: number;
  onlyVersion?: number;
  batchSize: number;
  help: boolean;
}

/**
 * Parse command line arguments
 */
function parseArguments(): CliArguments {
  const args = process.argv.slice(2);

  const parsed: CliArguments = {
    dryRun: false,
    batchSize: 100,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--dry-run':
      case '-d':
        parsed.dryRun = true;
        break;

      case '--version':
      case '-v':
        parsed.targetVersion = parseInt(args[++i], 10);
        if (isNaN(parsed.targetVersion)) {
          throw new Error('--version requires a numeric argument');
        }
        break;

      case '--only':
      case '-o':
        parsed.onlyVersion = parseInt(args[++i], 10);
        if (isNaN(parsed.onlyVersion)) {
          throw new Error('--only requires a numeric argument');
        }
        break;

      case '--batch-size':
      case '-b':
        parsed.batchSize = parseInt(args[++i], 10);
        if (isNaN(parsed.batchSize) || parsed.batchSize < 1) {
          throw new Error('--batch-size requires a positive numeric argument');
        }
        break;

      case '--help':
      case '-h':
        parsed.help = true;
        break;

      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

/**
 * Display help message
 */
function displayHelp(): void {
  console.log(`
Rotate Encryption Keys - Marketplace OAuth Token Re-encryption

USAGE:
  npm run cli:rotate-keys [OPTIONS]

OPTIONS:
  --dry-run, -d              Preview changes without modifying data (recommended first)
  --version <n>, -v <n>      Target version to rotate to (default: latest available)
  --only <n>, -o <n>         Only rotate accounts currently using version <n>
  --batch-size <n>, -b <n>   Number of accounts to process per batch (default: 100)
  --help, -h                 Display this help message

EXAMPLES:
  # Preview rotation to latest key (ALWAYS RUN THIS FIRST)
  npm run cli:rotate-keys --dry-run

  # Rotate all accounts to latest key
  npm run cli:rotate-keys

  # Rotate all accounts to v2 specifically
  npm run cli:rotate-keys --version 2

  # Only rotate accounts still using v1
  npm run cli:rotate-keys --only 1

  # Dry-run rotation of v1 accounts to v2
  npm run cli:rotate-keys --dry-run --only 1 --version 2

WORKFLOW:
  1. Add new ENCRYPTION_KEY_V2 to .env
  2. Restart application to load new key
  3. Run: npm run cli:rotate-keys --dry-run
  4. Review output and verify expectations
  5. Run: npm run cli:rotate-keys
  6. Monitor progress and verify success
  7. After 30 days, remove old ENCRYPTION_KEY_V1 from .env

SAFETY:
  - Database backup recommended before running
  - Stop application or ensure no OAuth operations in progress
  - Can be safely re-run if interrupted
  - Processes in batches to avoid database overload
  - Individual failures don't stop the operation
  - All errors reported at completion

For more information, see: docs/ENCRYPTION_KEY_ROTATION.md
  `);
}

/**
 * Main CLI entry point
 */
async function main() {
  const logger = new Logger('RotateEncryptionKeysCLI');

  try {
    // Parse arguments
    const args = parseArguments();

    if (args.help) {
      displayHelp();
      process.exit(0);
    }

    logger.log('Starting encryption key rotation CLI...');
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Get rotation service
    const rotationService = app.get(EncryptionKeyRotationService);

    // Display current key usage before rotation
    logger.log('\n--- Current Key Usage ---');
    const report = await rotationService.getKeyUsageReport();
    logger.log(`Total active accounts: ${report.totalAccounts}`);
    logger.log(`Key version distribution:`);
    report.versionDistribution.forEach((count, version) => {
      logger.log(`  v${version}: ${count} account(s)`);
    });
    logger.log(`Accounts needing rotation: ${report.accountsNeedingRotation}`);
    logger.log('--- End Report ---\n');

    // Perform rotation
    const stats = await rotationService.rotateKeys({
      dryRun: args.dryRun,
      targetVersion: args.targetVersion,
      onlyVersion: args.onlyVersion,
      batchSize: args.batchSize,
    });

    // Display results
    logger.log('\n=== ROTATION SUMMARY ===');
    logger.log(`Mode: ${stats.dryRun ? 'DRY RUN' : 'LIVE'}`);
    logger.log(`Total accounts: ${stats.totalAccounts}`);
    logger.log(`Accounts to rotate: ${stats.accountsToRotate}`);

    if (!stats.dryRun) {
      logger.log(`Successfully rotated: ${stats.accountsRotated}`);
      logger.log(`Failed: ${stats.accountsFailed}`);

      if (stats.accountsFailed > 0) {
        logger.warn('\nFailed accounts:');
        stats.errors.forEach((error) => {
          logger.error(`  ${error.accountId}: ${error.error}`);
        });
      }
    }

    logger.log(`Duration: ${((stats.duration || 0) / 1000).toFixed(2)}s`);
    logger.log('=== END SUMMARY ===\n');

    if (stats.dryRun && stats.accountsToRotate > 0) {
      logger.log('💡 To perform the rotation, run without --dry-run flag');
    } else if (!stats.dryRun && stats.accountsRotated > 0) {
      logger.log('✅ Rotation complete! Verify your application works correctly.');
      logger.log('   After 30 days of stable operation, you can remove the old encryption key.');
    } else if (stats.accountsToRotate === 0) {
      logger.log('✅ All accounts are already using the target encryption key version.');
    }

    // Close application context
    await app.close();

    // Exit with appropriate code
    if (!stats.dryRun && stats.accountsFailed > 0) {
      logger.error(`❌ Rotation completed with ${stats.accountsFailed} failure(s)`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ Fatal error during key rotation:');
    logger.error(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      logger.debug(error.stack);
    }

    process.exit(1);
  }
}

// Run CLI
main();
