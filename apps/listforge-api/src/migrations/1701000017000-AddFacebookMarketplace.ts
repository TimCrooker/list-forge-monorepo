import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFacebookMarketplace1701000017000 implements MigrationInterface {
  name = 'AddFacebookMarketplace1701000017000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add FACEBOOK to the marketplace_accounts_marketplace_enum type
    // Using IF NOT EXISTS to make migration idempotent
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum
          WHERE enumlabel = 'FACEBOOK'
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'marketplace_accounts_marketplace_enum'
          )
        ) THEN
          ALTER TYPE marketplace_accounts_marketplace_enum ADD VALUE 'FACEBOOK';
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // To properly reverse this, you would need to:
    // 1. Create a new enum type without FACEBOOK
    // 2. Update all tables using the enum
    // 3. Drop the old type and rename the new one
    // This is complex and risky, so we log a warning instead
    console.warn(
      'Cannot remove FACEBOOK from enum. Manual intervention required if needed.'
    );
  }
}
