import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Multi-Tenancy Constraints
 *
 * Adds missing foreign key constraints and indexes to improve data integrity
 * and query performance for multi-tenant operations.
 *
 * Changes:
 * 1. FK constraint: chat_sessions.organizationId -> organizations.id
 * 2. FK constraint: workflow_runs.orgId -> organizations.id
 * 3. Index: marketplace_accounts(orgId)
 * 4. Index: workflow_runs(orgId)
 * 5. Index: workflow_runs(orgId, status)
 */
export class AddMultiTenancyConstraints1701000013000 implements MigrationInterface {
  name = 'AddMultiTenancyConstraints1701000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clean up any orphaned chat_sessions before adding FK constraint
    await queryRunner.query(`
      DELETE FROM "chat_sessions"
      WHERE "organizationId" IS NOT NULL
        AND "organizationId" NOT IN (SELECT id FROM "organizations")
    `);

    // Clean up any orphaned workflow_runs before adding FK constraint
    await queryRunner.query(`
      DELETE FROM "workflow_runs"
      WHERE "orgId" IS NOT NULL
        AND "orgId" NOT IN (SELECT id FROM "organizations")
    `);

    // Add FK constraint for chat_sessions.organizationId
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD CONSTRAINT "FK_chat_sessions_organizationId"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE
    `);

    // Add FK constraint for workflow_runs.orgId
    await queryRunner.query(`
      ALTER TABLE "workflow_runs"
      ADD CONSTRAINT "FK_workflow_runs_orgId"
      FOREIGN KEY ("orgId") REFERENCES "organizations"("id")
      ON DELETE CASCADE
    `);

    // Add index for marketplace_accounts.orgId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_accounts_orgId"
      ON "marketplace_accounts" ("orgId")
    `);

    // Add index for workflow_runs.orgId
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workflow_runs_orgId"
      ON "workflow_runs" ("orgId")
    `);

    // Add composite index for workflow_runs(orgId, status) for filtered queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workflow_runs_orgId_status"
      ON "workflow_runs" ("orgId", "status")
    `);

    // Add composite index for workflow_runs(orgId, startedAt) for time-ordered queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_workflow_runs_orgId_startedAt"
      ON "workflow_runs" ("orgId", "startedAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workflow_runs_orgId_startedAt"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workflow_runs_orgId_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_workflow_runs_orgId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_accounts_orgId"
    `);

    // Drop FK constraints
    await queryRunner.query(`
      ALTER TABLE "workflow_runs"
      DROP CONSTRAINT IF EXISTS "FK_workflow_runs_orgId"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "FK_chat_sessions_organizationId"
    `);
  }
}
