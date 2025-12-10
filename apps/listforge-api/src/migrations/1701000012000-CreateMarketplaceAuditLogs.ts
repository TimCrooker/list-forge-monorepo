import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create marketplace audit logs table
 * Phase 4.1: Audit Logging for Account Lifecycle
 *
 * Creates immutable audit log table for tracking all marketplace account
 * lifecycle events (connections, disconnections, token refresh, webhooks, etc.)
 *
 * Features:
 * - Multi-column indexes for efficient querying by org, user, account, and time
 * - Foreign key relationships with cascade deletes
 * - JSONB metadata column for structured event data
 * - Support for both user-initiated and system-initiated events
 */
export class CreateMarketplaceAuditLogs1701000012000 implements MigrationInterface {
  name = 'CreateMarketplaceAuditLogs1701000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create marketplace_audit_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketplace_audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orgId" uuid NOT NULL,
        "userId" uuid NULL,
        "accountId" uuid NULL,
        "marketplace" varchar(20) NULL,
        "eventType" varchar(50) NOT NULL,
        "message" text NOT NULL,
        "metadata" jsonb NULL,
        "ipAddress" varchar(45) NULL,
        "userAgent" varchar(512) NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_marketplace_audit_logs_orgId"
          FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_marketplace_audit_logs_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_marketplace_audit_logs_accountId"
          FOREIGN KEY ("accountId") REFERENCES "marketplace_accounts"("id") ON DELETE SET NULL
      )
    `);

    // Create indexes for efficient querying
    // Index by organization + timestamp (most common query pattern)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_audit_logs_org_timestamp"
      ON "marketplace_audit_logs" ("orgId", "timestamp" DESC)
    `);

    // Index by account + timestamp (account history)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_audit_logs_account_timestamp"
      ON "marketplace_audit_logs" ("accountId", "timestamp" DESC)
      WHERE "accountId" IS NOT NULL
    `);

    // Index by user + timestamp (user activity history)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_audit_logs_user_timestamp"
      ON "marketplace_audit_logs" ("userId", "timestamp" DESC)
      WHERE "userId" IS NOT NULL
    `);

    // Index by event type + timestamp (event type filtering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_audit_logs_event_timestamp"
      ON "marketplace_audit_logs" ("eventType", "timestamp" DESC)
    `);

    // Composite index for common admin queries (org + event type + timestamp)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_audit_logs_org_event_timestamp"
      ON "marketplace_audit_logs" ("orgId", "eventType", "timestamp" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_audit_logs_org_event_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_audit_logs_event_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_audit_logs_user_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_audit_logs_account_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_audit_logs_org_timestamp"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "marketplace_audit_logs"
    `);
  }
}
