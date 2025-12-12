import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Domain Expertise Versions
 *
 * Part of Slice 9.1.5 - Version Control & Publishing
 *
 * Creates:
 * - domain_expertise_versions: Published snapshots for rollback capability
 */
export class AddDomainExpertiseVersions1701000024000 implements MigrationInterface {
  name = 'AddDomainExpertiseVersions1701000024000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create domain_expertise_versions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_expertise_versions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid NOT NULL,
        "version" integer NOT NULL,
        "snapshot" jsonb NOT NULL,
        "changelog" text NOT NULL,
        "publishedBy" uuid NOT NULL,
        "publishedAt" timestamp NOT NULL DEFAULT now(),
        "isActive" boolean NOT NULL DEFAULT false,
        CONSTRAINT "FK_domain_expertise_versions_moduleId"
          FOREIGN KEY ("moduleId")
          REFERENCES "domain_expertise_modules"("id")
          ON DELETE CASCADE
      )
    `);

    // Create indexes for versions
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_expertise_versions_moduleId_version"
      ON "domain_expertise_versions" ("moduleId", "version" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_expertise_versions_moduleId_publishedAt"
      ON "domain_expertise_versions" ("moduleId", "publishedAt" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_expertise_versions_moduleId_isActive"
      ON "domain_expertise_versions" ("moduleId", "isActive")
    `);

    // Add unique constraint to ensure only one active version per module
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_domain_expertise_versions_moduleId_isActive_unique"
      ON "domain_expertise_versions" ("moduleId")
      WHERE "isActive" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_versions_moduleId_isActive_unique"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_versions_moduleId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_versions_moduleId_publishedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_versions_moduleId_version"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_expertise_versions"`);
  }
}
