import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Authenticity Marker Definitions
 *
 * Part of Slice 9.1.3 - Authenticity Markers
 *
 * Creates:
 * - domain_authenticity_marker_definitions: Pattern-based authenticity checks
 */
export class AddAuthenticityMarkerDefinitions1701000022000 implements MigrationInterface {
  name = 'AddAuthenticityMarkerDefinitions1701000022000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create domain_authenticity_marker_definitions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_authenticity_marker_definitions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "checkDescription" text NOT NULL,
        "pattern" varchar(500),
        "patternMaxLength" integer NOT NULL DEFAULT 50,
        "importance" varchar(20) NOT NULL,
        "indicatesAuthentic" boolean NOT NULL DEFAULT true,
        "applicableBrands" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_domain_authenticity_marker_definitions_moduleId"
          FOREIGN KEY ("moduleId")
          REFERENCES "domain_expertise_modules"("id")
          ON DELETE CASCADE
      )
    `);

    // Create indexes for authenticity markers
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_authenticity_marker_definitions_moduleId_importance"
      ON "domain_authenticity_marker_definitions" ("moduleId", "importance")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_authenticity_marker_definitions_moduleId_isActive"
      ON "domain_authenticity_marker_definitions" ("moduleId", "isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_authenticity_marker_definitions_moduleId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_authenticity_marker_definitions_moduleId_importance"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_authenticity_marker_definitions"`);
  }
}
