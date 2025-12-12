import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Research Run Control - Research Flow Recovery System
 *
 * Adds pause_requested and paused_at columns to item_research_runs
 * to support user-initiated pause/resume/stop functionality.
 * Note: Status enum update (adding 'paused' and 'cancelled') is handled
 * by TypeORM synchronize in development, but in production this would
 * require an ALTER TYPE statement.
 */
export class AddResearchRunControl1701000009000
  implements MigrationInterface
{
  name = 'AddResearchRunControl1701000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add pause_requested column
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "pause_requested" boolean NOT NULL DEFAULT false
    `);

    // Add paused_at column
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "paused_at" timestamp
    `);

    // Note: In PostgreSQL, updating an enum type requires:
    // ALTER TYPE research_run_status ADD VALUE 'paused';
    // ALTER TYPE research_run_status ADD VALUE 'cancelled';
    // However, TypeORM's synchronize handles this automatically in development.
    // For production, you may need to run these manually or use a raw query here.
    // We'll rely on TypeORM's synchronize for now since it's enabled.
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "paused_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "pause_requested"
    `);
  }
}



