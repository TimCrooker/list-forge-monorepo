import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Review Recommendation
 *
 * Adds reviewRecommendation column to the items table for
 * confidence-based review routing:
 * - 'approve': Spot-check - high confidence, recommend quick approval
 * - 'review': Full review needed - lower confidence, needs attention
 * - null: No recommendation yet (research not complete)
 */
export class AddReviewRecommendation1701000019000 implements MigrationInterface {
  name = 'AddReviewRecommendation1701000019000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "items"
      ADD COLUMN IF NOT EXISTS "reviewRecommendation" varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "items"
      DROP COLUMN IF EXISTS "reviewRecommendation"
    `);
  }
}
