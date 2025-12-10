import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperationFieldsToActivityLog1701000007000 implements MigrationInterface {
  name = 'AddOperationFieldsToActivityLog1701000007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for operation-based logging
    await queryRunner.query(`
      ALTER TABLE "research_activity_logs"
      ADD COLUMN IF NOT EXISTS "operationId" uuid,
      ADD COLUMN IF NOT EXISTS "operationType" varchar(50),
      ADD COLUMN IF NOT EXISTS "eventType" varchar(20),
      ADD COLUMN IF NOT EXISTS "title" varchar(255)
    `);

    // Add index for operationId queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_research_activity_logs_operation"
      ON "research_activity_logs" ("researchRunId", "operationId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_research_activity_logs_operation"
    `);

    // Remove columns
    await queryRunner.query(`
      ALTER TABLE "research_activity_logs"
      DROP COLUMN IF EXISTS "operationId",
      DROP COLUMN IF EXISTS "operationType",
      DROP COLUMN IF EXISTS "eventType",
      DROP COLUMN IF EXISTS "title"
    `);
  }
}
