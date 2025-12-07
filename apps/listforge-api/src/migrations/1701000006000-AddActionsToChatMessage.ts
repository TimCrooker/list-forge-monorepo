import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Actions to ChatMessage - Phase 7 Slice 6
 *
 * Adds the actions column to chat_messages table to support action suggestions
 * and application tracking.
 */
export class AddActionsToChatMessage1701000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN "actions" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      DROP COLUMN "actions"
    `);
  }
}
