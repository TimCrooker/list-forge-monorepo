import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Research Settings
 *
 * Adds researchSettings column to the organizations table for
 * confidence-based review routing (auto-approve, spot-check, full-review).
 *
 * Settings include:
 * - enableAutoApproval: Enable auto-approval (conservative default: false)
 * - autoApproveThreshold: Confidence threshold for auto-approval (0.90)
 * - spotCheckThreshold: Confidence threshold for spot-check (0.70)
 * - minCompsForAutoApproval: Minimum validated comps required (5)
 * - maxAutoApprovalsPerDay: Safety limit on daily auto-approvals (100)
 */
export class AddResearchSettings1701000018000 implements MigrationInterface {
  name = 'AddResearchSettings1701000018000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Research Settings for confidence-based review routing
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "researchSettings" jsonb
      DEFAULT '{"enableAutoApproval":false,"autoApproveThreshold":0.90,"spotCheckThreshold":0.70,"minCompsForAutoApproval":5,"maxAutoApprovalsPerDay":100}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "researchSettings"
    `);
  }
}
