import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrentNodeToResearchRun1701000003000
  implements MigrationInterface
{
  name = 'AddCurrentNodeToResearchRun1701000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      ADD COLUMN IF NOT EXISTS "currentNode" varchar(50)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "item_research_runs"
      DROP COLUMN IF EXISTS "currentNode"
    `);
  }
}
