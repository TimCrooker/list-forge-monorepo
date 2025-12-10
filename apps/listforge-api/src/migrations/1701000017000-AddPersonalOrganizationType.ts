import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPersonalOrganizationType1701000017000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add type column to organizations
    await queryRunner.query(`
      ALTER TABLE organizations
      ADD COLUMN type VARCHAR(20) DEFAULT 'team'
      CHECK (type IN ('personal', 'team'))
    `);

    // Add index for filtering by type
    await queryRunner.query(`
      CREATE INDEX idx_organizations_type ON organizations(type)
    `);

    // Update existing single-member orgs to personal (optional)
    // This identifies orgs with only one member
    await queryRunner.query(`
      UPDATE organizations o
      SET type = 'personal'
      WHERE (
        SELECT COUNT(*)
        FROM user_organizations uo
        WHERE uo."organizationId" = o.id
      ) = 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_organizations_type`,
    );
    await queryRunner.query(`ALTER TABLE organizations DROP COLUMN type`);
  }
}
