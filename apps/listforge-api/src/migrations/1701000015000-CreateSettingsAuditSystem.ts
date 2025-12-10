import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create settings audit system tables
 *
 * Creates two tables for comprehensive settings audit trail:
 * 1. settings_versions - Stores full snapshots for version history and revert
 * 2. settings_audit_logs - Stores audit entries with field-level diffs
 *
 * Features:
 * - Multi-column indexes for efficient querying
 * - Foreign key relationships with appropriate cascade behavior
 * - JSONB columns for settings snapshots and field diffs
 * - Support for both user-initiated and system-initiated events
 */
export class CreateSettingsAuditSystem1701000015000 implements MigrationInterface {
  name = 'CreateSettingsAuditSystem1701000015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================================================
    // Create settings_versions table
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings_versions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orgId" uuid NOT NULL,
        "settingsType" varchar(30) NOT NULL,
        "versionNumber" integer NOT NULL,
        "settingsSnapshot" jsonb NOT NULL,
        "userId" uuid NULL,
        "isRevert" boolean NOT NULL DEFAULT false,
        "revertedFromVersionId" uuid NULL,
        "revertReason" text NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_settings_versions_orgId"
          FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_settings_versions_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Indexes for settings_versions
    // Index for getting latest version or specific version number
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_versions_org_type_version"
      ON "settings_versions" ("orgId", "settingsType", "versionNumber" DESC)
    `);

    // Index for getting versions by creation date
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_versions_org_type_created"
      ON "settings_versions" ("orgId", "settingsType", "createdAt" DESC)
    `);

    // ============================================================================
    // Create settings_audit_logs table
    // ============================================================================
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "settings_audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "orgId" uuid NOT NULL,
        "userId" uuid NULL,
        "settingsType" varchar(30) NOT NULL,
        "eventType" varchar(30) NOT NULL,
        "message" text NOT NULL,
        "fieldDiffs" jsonb NOT NULL DEFAULT '[]',
        "versionId" uuid NULL,
        "ipAddress" varchar(45) NULL,
        "userAgent" varchar(512) NULL,
        "metadata" jsonb NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_settings_audit_logs_orgId"
          FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_settings_audit_logs_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_settings_audit_logs_versionId"
          FOREIGN KEY ("versionId") REFERENCES "settings_versions"("id") ON DELETE SET NULL
      )
    `);

    // Indexes for settings_audit_logs
    // Index by organization + timestamp (most common query pattern)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_audit_logs_org_timestamp"
      ON "settings_audit_logs" ("orgId", "timestamp" DESC)
    `);

    // Index by organization + settings type + timestamp
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_audit_logs_org_type_timestamp"
      ON "settings_audit_logs" ("orgId", "settingsType", "timestamp" DESC)
    `);

    // Index by user + timestamp (user activity history)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_audit_logs_user_timestamp"
      ON "settings_audit_logs" ("userId", "timestamp" DESC)
      WHERE "userId" IS NOT NULL
    `);

    // Index by event type + timestamp (event type filtering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_audit_logs_event_timestamp"
      ON "settings_audit_logs" ("eventType", "timestamp" DESC)
    `);

    // Composite index for admin queries (org + event type + timestamp)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_settings_audit_logs_org_event_timestamp"
      ON "settings_audit_logs" ("orgId", "eventType", "timestamp" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop settings_audit_logs indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_audit_logs_org_event_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_audit_logs_event_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_audit_logs_user_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_audit_logs_org_type_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_audit_logs_org_timestamp"
    `);

    // Drop settings_audit_logs table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "settings_audit_logs"
    `);

    // Drop settings_versions indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_versions_org_type_created"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_settings_versions_org_type_version"
    `);

    // Drop settings_versions table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "settings_versions"
    `);
  }
}
