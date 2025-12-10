import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Field-Driven Research Support
 *
 * Adds new columns for field-level confidence tracking:
 * - Items: fieldCompletionScore, readyToPublish, canonicalFields
 * - ItemResearchRuns: fieldStates, researchCostUsd, researchMode, researchConstraints
 */
export class AddFieldDrivenResearch1701000016000 implements MigrationInterface {
  name = 'AddFieldDrivenResearch1701000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================================================
    // Items table updates
    // ========================================================================

    // Add field completion score (0-1 decimal)
    await queryRunner.query(`
      ALTER TABLE items
      ADD COLUMN IF NOT EXISTS field_completion_score DECIMAL(3,2)
    `);

    // Add ready to publish flag
    await queryRunner.query(`
      ALTER TABLE items
      ADD COLUMN IF NOT EXISTS ready_to_publish BOOLEAN DEFAULT false
    `);

    // Add canonical fields JSON storage
    await queryRunner.query(`
      ALTER TABLE items
      ADD COLUMN IF NOT EXISTS canonical_fields JSONB
    `);

    // Add index for querying items by readiness
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_items_ready_to_publish
      ON items(organization_id, ready_to_publish)
      WHERE ready_to_publish = true
    `);

    // Add index for low completion score items (need work)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_items_field_completion
      ON items(organization_id, field_completion_score)
      WHERE field_completion_score IS NOT NULL
    `);

    // ========================================================================
    // ItemResearchRuns table updates
    // ========================================================================

    // Add field states JSON storage (core field-driven research data)
    await queryRunner.query(`
      ALTER TABLE item_research_runs
      ADD COLUMN IF NOT EXISTS field_states JSONB
    `);

    // Add research cost tracking
    await queryRunner.query(`
      ALTER TABLE item_research_runs
      ADD COLUMN IF NOT EXISTS research_cost_usd DECIMAL(8,4)
    `);

    // Add research mode
    await queryRunner.query(`
      ALTER TABLE item_research_runs
      ADD COLUMN IF NOT EXISTS research_mode VARCHAR(20) DEFAULT 'balanced'
    `);

    // Add research constraints snapshot
    await queryRunner.query(`
      ALTER TABLE item_research_runs
      ADD COLUMN IF NOT EXISTS research_constraints JSONB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS idx_items_ready_to_publish`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_items_field_completion`);

    // Remove columns from items
    await queryRunner.query(`ALTER TABLE items DROP COLUMN IF EXISTS field_completion_score`);
    await queryRunner.query(`ALTER TABLE items DROP COLUMN IF EXISTS ready_to_publish`);
    await queryRunner.query(`ALTER TABLE items DROP COLUMN IF EXISTS canonical_fields`);

    // Remove columns from item_research_runs
    await queryRunner.query(`ALTER TABLE item_research_runs DROP COLUMN IF EXISTS field_states`);
    await queryRunner.query(`ALTER TABLE item_research_runs DROP COLUMN IF EXISTS research_cost_usd`);
    await queryRunner.query(`ALTER TABLE item_research_runs DROP COLUMN IF EXISTS research_mode`);
    await queryRunner.query(`ALTER TABLE item_research_runs DROP COLUMN IF EXISTS research_constraints`);
  }
}
