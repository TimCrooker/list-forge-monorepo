import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Make Chat ItemId Optional (General Purpose Chat)
 *
 * Transforms the chat system from item-only to general-purpose:
 * - Makes itemId nullable (allows general conversations)
 * - Adds conversationType field (item_scoped, general, dashboard, etc.)
 * - Adds title field for user-friendly conversation names
 * - Adds contextSnapshot JSONB for resuming conversations with context
 * - Adds lastActivityAt for sorting conversations
 * - Updates indexes for new query patterns
 * - Backfills existing sessions as 'item_scoped' type
 */
export class MakeChatItemIdOptional1701000010000 implements MigrationInterface {
  name = 'MakeChatItemIdOptional1701000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add new columns with defaults
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD COLUMN IF NOT EXISTS "conversationType" varchar(50) DEFAULT 'general'
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD COLUMN IF NOT EXISTS "title" varchar(200) DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD COLUMN IF NOT EXISTS "contextSnapshot" jsonb DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD COLUMN IF NOT EXISTS "lastActivityAt" timestamp DEFAULT CURRENT_TIMESTAMP
    `);

    // Step 2: Backfill existing sessions
    // Set conversationType to 'item_scoped' for all existing sessions (they all have itemId required by old schema)
    // Note: New column has default 'general', so existing rows have 'general' initially
    await queryRunner.query(`
      UPDATE "chat_sessions"
      SET "conversationType" = 'item_scoped'
      WHERE "itemId" IS NOT NULL
    `);

    // Set lastActivityAt to updatedAt for existing sessions
    await queryRunner.query(`
      UPDATE "chat_sessions"
      SET "lastActivityAt" = "updatedAt"
      WHERE "lastActivityAt" IS NULL
    `);

    // Set title from item.title for existing item-scoped sessions
    await queryRunner.query(`
      UPDATE "chat_sessions" cs
      SET "title" = CONCAT('Item: ', i.title)
      FROM "items" i
      WHERE cs."itemId" = i.id
        AND cs."title" IS NULL
    `);

    // Step 3: Make itemId nullable
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ALTER COLUMN "itemId" DROP NOT NULL
    `);

    // Step 4: Update foreign key constraint to allow null
    // First drop the existing foreign key
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "FK_chat_sessions_itemId"
    `);

    // Recreate with nullable support
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD CONSTRAINT "FK_chat_sessions_itemId"
      FOREIGN KEY ("itemId") REFERENCES "items"("id")
      ON DELETE CASCADE
    `);

    // Step 5: Create new indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_sessions_user_org_type"
      ON "chat_sessions" ("userId", "organizationId", "conversationType")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_chat_sessions_user_activity"
      ON "chat_sessions" ("userId", "organizationId", "lastActivityAt" DESC)
    `);

    // Keep the existing itemId index but make it conditional
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_chat_sessions_itemId"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_itemId"
      ON "chat_sessions" ("itemId")
      WHERE "itemId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop new indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_chat_sessions_user_org_type"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_chat_sessions_user_activity"
    `);

    // Step 2: Restore itemId index to unconditional
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_chat_sessions_itemId"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_itemId"
      ON "chat_sessions" ("itemId")
    `);

    // Step 3: Delete sessions where itemId is null (general conversations)
    // WARNING: This will delete data!
    await queryRunner.query(`
      DELETE FROM "chat_sessions"
      WHERE "itemId" IS NULL
    `);

    // Step 4: Make itemId NOT NULL again
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ALTER COLUMN "itemId" SET NOT NULL
    `);

    // Step 5: Recreate original foreign key
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "FK_chat_sessions_itemId"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      ADD CONSTRAINT "FK_chat_sessions_itemId"
      FOREIGN KEY ("itemId") REFERENCES "items"("id")
      ON DELETE CASCADE
    `);

    // Step 6: Remove new columns
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP COLUMN IF EXISTS "lastActivityAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP COLUMN IF EXISTS "contextSnapshot"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP COLUMN IF EXISTS "title"
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP COLUMN IF EXISTS "conversationType"
    `);
  }
}
