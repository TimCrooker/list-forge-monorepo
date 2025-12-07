import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Checkpoint to Research Run - Phase 7 Slice 4
 *
 * Adds checkpoint, stepCount, and stepHistory columns to item_research_runs
 * to support LangGraph checkpointing and resume functionality.
 */
export class AddCheckpointToResearchRun1701000004000
  implements MigrationInterface
{
  name = 'AddCheckpointToResearchRun1701000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add checkpoint column (stores LangGraph checkpoint state)
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "checkpoint" jsonb
    `);

    // Add step_count column (tracks number of steps executed)
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "step_count" integer NOT NULL DEFAULT 0
    `);

    // Add step_history column (tracks step-by-step execution history)
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "step_history" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "step_history"
    `);

    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "step_count"
    `);

    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "checkpoint"
    `);
  }
}
