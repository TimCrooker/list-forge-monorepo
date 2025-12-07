import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Chat Tables - Phase 7 Slice 5
 *
 * Creates the chat_sessions and chat_messages tables for persistent chat functionality.
 */
export class CreateChatTables1701000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create chat_sessions table
    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "itemId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_sessions_itemId" FOREIGN KEY ("itemId")
          REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);

    // Create chat_messages table
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "role" character varying(20) NOT NULL,
        "content" text NOT NULL,
        "toolCalls" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_messages_sessionId" FOREIGN KEY ("sessionId")
          REFERENCES "chat_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Add indexes for chat_sessions
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_item_user"
      ON "chat_sessions" ("itemId", "userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_chat_sessions_org_created"
      ON "chat_sessions" ("organizationId", "createdAt" DESC)
    `);

    // Add indexes for chat_messages
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_session_created"
      ON "chat_messages" ("sessionId", "createdAt" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_chat_messages_session_created"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_chat_sessions_org_created"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_chat_sessions_item_user"
    `);

    // Drop tables (messages first due to foreign key)
    await queryRunner.query(`
      DROP TABLE "chat_messages"
    `);

    await queryRunner.query(`
      DROP TABLE "chat_sessions"
    `);
  }
}
