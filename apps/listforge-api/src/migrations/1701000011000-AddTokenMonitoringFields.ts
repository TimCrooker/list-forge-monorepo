import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add token monitoring fields to marketplace accounts
 * Phase 3.1: Token Lifecycle Management
 *
 * Adds fields to track token expiration monitoring:
 * - lastCheckedAt: Timestamp of last expiration check
 * - autoRefreshAttempts: Counter to prevent infinite refresh loops
 */
export class AddTokenMonitoringFields1701000011000 implements MigrationInterface {
  name = 'AddTokenMonitoringFields1701000011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add lastCheckedAt column to track when token expiration was last checked
    await queryRunner.query(`
      ALTER TABLE "marketplace_accounts"
      ADD COLUMN IF NOT EXISTS "lastCheckedAt" timestamp NULL
    `);

    // Add autoRefreshAttempts column to prevent infinite retry loops
    // Incremented on each automatic refresh attempt, reset on success
    await queryRunner.query(`
      ALTER TABLE "marketplace_accounts"
      ADD COLUMN IF NOT EXISTS "autoRefreshAttempts" integer DEFAULT 0
    `);

    // Add index for efficient querying of accounts needing expiration checks
    // Used by TokenExpirationMonitorService to find expiring tokens
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_accounts_token_expiry"
      ON "marketplace_accounts" ("tokenExpiresAt", "status")
      WHERE "status" = 'active' AND "tokenExpiresAt" IS NOT NULL
    `);

    // Add index for monitoring query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_accounts_last_checked"
      ON "marketplace_accounts" ("lastCheckedAt")
      WHERE "lastCheckedAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_accounts_last_checked"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_accounts_token_expiry"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "marketplace_accounts"
      DROP COLUMN IF EXISTS "autoRefreshAttempts"
    `);

    await queryRunner.query(`
      ALTER TABLE "marketplace_accounts"
      DROP COLUMN IF EXISTS "lastCheckedAt"
    `);
  }
}
