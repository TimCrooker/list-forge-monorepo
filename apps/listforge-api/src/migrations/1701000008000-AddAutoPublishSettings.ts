import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add auto-publish settings and tracking
 * Slice 7: Auto-Publish & Production Polish
 *
 * - Adds autoPublishSettings JSONB column to organizations table
 * - Adds autoPublished boolean column to marketplace_listings table
 */
export class AddAutoPublishSettings1701000008000 implements MigrationInterface {
  name = 'AddAutoPublishSettings1701000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add autoPublishSettings column to organizations
    await queryRunner.query(`
      ALTER TABLE "organizations"
      ADD COLUMN IF NOT EXISTS "autoPublishSettings" jsonb
      DEFAULT '{"enabled":false,"minConfidenceScore":0.90,"minValidatedComps":5,"maxPriceThreshold":null}'
    `);

    // Add autoPublished column to marketplace_listings
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ADD COLUMN IF NOT EXISTS "autoPublished" boolean DEFAULT false
    `);

    // Add index for querying auto-published listings
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_marketplace_listings_auto_published"
      ON "marketplace_listings" ("autoPublished")
      WHERE "autoPublished" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_marketplace_listings_auto_published"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      DROP COLUMN IF EXISTS "autoPublished"
    `);

    await queryRunner.query(`
      ALTER TABLE "organizations"
      DROP COLUMN IF EXISTS "autoPublishSettings"
    `);
  }
}
