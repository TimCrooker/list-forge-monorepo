import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create ItemResearch - Phase 7 Slice 1
 *
 * Creates the item_research table for storing structured research conclusions
 * including price bands, demand signals, and missing info hints.
 */
export class CreateItemResearch1701000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create item_research table
    await queryRunner.query(`
      CREATE TABLE "item_research" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "itemId" uuid NOT NULL,
        "researchRunId" uuid,
        "data" jsonb NOT NULL,
        "schemaVersion" character varying(20) NOT NULL DEFAULT '1.0.0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "isCurrent" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_item_research" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_research_itemId" FOREIGN KEY ("itemId")
          REFERENCES "items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_item_research_researchRunId" FOREIGN KEY ("researchRunId")
          REFERENCES "item_research_runs"("id") ON DELETE SET NULL
      )
    `);

    // Add index on itemId
    await queryRunner.query(`
      CREATE INDEX "IDX_item_research_itemId"
      ON "item_research" ("itemId")
    `);

    // Add composite index on itemId and createdAt for efficient latest lookup
    await queryRunner.query(`
      CREATE INDEX "IDX_item_research_item_created"
      ON "item_research" ("itemId", "createdAt" DESC)
    `);

    // Add partial index for current research lookup (most common query)
    await queryRunner.query(`
      CREATE INDEX "IDX_item_research_item_current"
      ON "item_research" ("itemId")
      WHERE "isCurrent" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_item_research_item_current"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_item_research_item_created"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_item_research_itemId"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "item_research"
    `);
  }
}
