import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: UpdateMarketplaceListingToItem
 *
 * Phase 6 Sub-Phase 7: Update MarketplaceListing to link to Item instead of ListingDraft
 *
 * Changes:
 * 1. Add new divergence columns (title, description, marketplaceCategoryId, marketplaceAttributes)
 * 2. Rename listingDraftId column to itemId
 * 3. Update foreign key constraint
 * 4. Update status enum values (draft→not_listed, pending→listing_pending, live→listed)
 */
export class UpdateMarketplaceListingToItem1701000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add new divergence columns
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ADD COLUMN "title" text NULL,
      ADD COLUMN "description" text NULL,
      ADD COLUMN "marketplaceCategoryId" varchar(100) NULL,
      ADD COLUMN "marketplaceAttributes" jsonb NULL
    `);

    // 2. Update comments for existing and new columns
    await queryRunner.query(`
      COMMENT ON COLUMN "marketplace_listings"."title" IS 'Marketplace-specific title override';
      COMMENT ON COLUMN "marketplace_listings"."description" IS 'Marketplace-specific description override';
      COMMENT ON COLUMN "marketplace_listings"."price" IS 'Marketplace-specific price (can diverge from Item.defaultPrice)';
      COMMENT ON COLUMN "marketplace_listings"."marketplaceCategoryId" IS 'Marketplace-specific category ID';
      COMMENT ON COLUMN "marketplace_listings"."marketplaceAttributes" IS 'Marketplace-specific attributes mapping'
    `);

    // 3. Update status enum - add new values first
    await queryRunner.query(`
      ALTER TYPE "marketplace_listings_status_enum"
      ADD VALUE IF NOT EXISTS 'not_listed';
      ALTER TYPE "marketplace_listings_status_enum"
      ADD VALUE IF NOT EXISTS 'listing_pending';
      ALTER TYPE "marketplace_listings_status_enum"
      ADD VALUE IF NOT EXISTS 'listed'
    `);

    // 4. Migrate existing status values
    await queryRunner.query(`
      UPDATE "marketplace_listings"
      SET "status" = CASE
        WHEN "status" = 'draft' THEN 'not_listed'
        WHEN "status" = 'pending' THEN 'listing_pending'
        WHEN "status" = 'live' THEN 'listed'
        ELSE "status"
      END
    `);

    // 5. Drop old foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      DROP CONSTRAINT IF EXISTS "FK_marketplace_listings_listingDraftId"
    `);

    // 6. Rename column
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      RENAME COLUMN "listingDraftId" TO "itemId"
    `);

    // 7. Add new foreign key constraint to items table
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ADD CONSTRAINT "FK_marketplace_listings_itemId"
      FOREIGN KEY ("itemId") REFERENCES "items"("id")
      ON DELETE CASCADE
    `);

    // 8. Update default value for status
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ALTER COLUMN "status" SET DEFAULT 'not_listed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the migration

    // 1. Update default value back
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ALTER COLUMN "status" SET DEFAULT 'pending'
    `);

    // 2. Drop new foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      DROP CONSTRAINT IF EXISTS "FK_marketplace_listings_itemId"
    `);

    // 3. Rename column back
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      RENAME COLUMN "itemId" TO "listingDraftId"
    `);

    // 4. Restore old foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      ADD CONSTRAINT "FK_marketplace_listings_listingDraftId"
      FOREIGN KEY ("listingDraftId") REFERENCES "listing_drafts"("id")
      ON DELETE CASCADE
    `);

    // 5. Migrate status values back
    await queryRunner.query(`
      UPDATE "marketplace_listings"
      SET "status" = CASE
        WHEN "status" = 'not_listed' THEN 'draft'
        WHEN "status" = 'listing_pending' THEN 'pending'
        WHEN "status" = 'listed' THEN 'live'
        ELSE "status"
      END
    `);

    // 6. Remove new columns
    await queryRunner.query(`
      ALTER TABLE "marketplace_listings"
      DROP COLUMN "title",
      DROP COLUMN "description",
      DROP COLUMN "marketplaceCategoryId",
      DROP COLUMN "marketplaceAttributes"
    `);

    // Note: Cannot remove enum values in PostgreSQL, they will remain in the enum type
  }
}
