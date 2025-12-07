import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add ItemResearchRuns - Phase 6 Sub-Phase 8
 *
 * Creates the item_research_runs table for tracking multiple research runs per item.
 * Adds researchRunId column to evidence_bundles for linking evidence to specific runs.
 * Migrates existing WorkflowRun data for items.
 */
export class AddItemResearchRuns1701000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create item_research_runs table
    await queryRunner.query(`
      CREATE TABLE "item_research_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "itemId" uuid NOT NULL,
        "runType" character varying(30) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "pipelineVersion" character varying(50),
        "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        "errorMessage" text,
        "summary" text,
        CONSTRAINT "PK_item_research_runs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_research_runs_itemId" FOREIGN KEY ("itemId")
          REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);

    // Add index on itemId and startedAt
    await queryRunner.query(`
      CREATE INDEX "IDX_item_research_runs_item_started"
      ON "item_research_runs" ("itemId", "startedAt")
    `);

    // Add researchRunId to evidence_bundles
    await queryRunner.query(`
      ALTER TABLE "evidence_bundles"
      ADD COLUMN "researchRunId" uuid
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "evidence_bundles"
      ADD CONSTRAINT "FK_evidence_bundles_researchRunId"
      FOREIGN KEY ("researchRunId")
      REFERENCES "item_research_runs"("id") ON DELETE SET NULL
    `);

    // Add index on researchRunId
    await queryRunner.query(`
      CREATE INDEX "IDX_evidence_bundles_researchRunId"
      ON "evidence_bundles" ("researchRunId")
    `);

    // Migrate existing WorkflowRun data for items to ItemResearchRun
    await queryRunner.query(`
      INSERT INTO "item_research_runs"
        (id, "itemId", "runType", status, "pipelineVersion", "startedAt", "completedAt", "errorMessage")
      SELECT
        id,
        "itemId",
        'initial_intake'::character varying,
        CASE
          WHEN status = 'pending' THEN 'pending'::character varying
          WHEN status = 'running' THEN 'running'::character varying
          WHEN status = 'completed' THEN 'success'::character varying
          WHEN status = 'failed' THEN 'error'::character varying
          ELSE 'pending'::character varying
        END,
        NULL,
        "startedAt",
        "completedAt",
        error
      FROM "workflow_runs"
      WHERE "itemId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove index on researchRunId
    await queryRunner.query(`
      DROP INDEX "IDX_evidence_bundles_researchRunId"
    `);

    // Remove foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "evidence_bundles"
      DROP CONSTRAINT "FK_evidence_bundles_researchRunId"
    `);

    // Remove researchRunId column
    await queryRunner.query(`
      ALTER TABLE "evidence_bundles"
      DROP COLUMN "researchRunId"
    `);

    // Drop index
    await queryRunner.query(`
      DROP INDEX "IDX_item_research_runs_item_started"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "item_research_runs"
    `);
  }
}
