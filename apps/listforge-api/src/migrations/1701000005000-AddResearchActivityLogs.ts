import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add ResearchActivityLogs
 *
 * Creates the research_activity_logs table for storing granular activity events
 * during research execution. These logs provide real-time monitoring and a
 * complete audit trail of all research activities.
 */
export class AddResearchActivityLogs1701000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create research_activity_logs table
    await queryRunner.query(`
      CREATE TABLE "research_activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "researchRunId" uuid NOT NULL,
        "itemId" uuid NOT NULL,
        "type" character varying(50) NOT NULL,
        "message" text NOT NULL,
        "metadata" jsonb,
        "status" character varying(20) NOT NULL,
        "stepId" character varying(50),
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_research_activity_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_research_activity_logs_researchRunId" FOREIGN KEY ("researchRunId")
          REFERENCES "item_research_runs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_research_activity_logs_itemId" FOREIGN KEY ("itemId")
          REFERENCES "items"("id") ON DELETE CASCADE
      )
    `);

    // Add index on researchRunId and timestamp for fast querying by run
    await queryRunner.query(`
      CREATE INDEX "IDX_research_activity_logs_run_timestamp"
      ON "research_activity_logs" ("researchRunId", "timestamp")
    `);

    // Add index on itemId and timestamp for querying all activities for an item
    await queryRunner.query(`
      CREATE INDEX "IDX_research_activity_logs_item_timestamp"
      ON "research_activity_logs" ("itemId", "timestamp")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`
      DROP INDEX "IDX_research_activity_logs_item_timestamp"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_research_activity_logs_run_timestamp"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE "research_activity_logs"
    `);
  }
}
