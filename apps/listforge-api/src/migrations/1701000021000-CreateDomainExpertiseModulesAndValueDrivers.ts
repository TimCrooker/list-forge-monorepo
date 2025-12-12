import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Domain Expertise Modules and Value Drivers
 *
 * Part of Slice 9.1.2 - Domain Modules + Value Drivers
 *
 * Creates:
 * - domain_expertise_modules: Top-level containers for expertise configuration
 * - domain_value_driver_definitions: Price-affecting attribute definitions
 *
 * Also adds moduleId foreign key to lookup_tables
 */
export class CreateDomainExpertiseModulesAndValueDrivers1701000021000 implements MigrationInterface {
  name = 'CreateDomainExpertiseModulesAndValueDrivers1701000021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create domain_expertise_modules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_expertise_modules" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(150) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "categoryId" varchar(50) NOT NULL,
        "applicableBrands" jsonb NOT NULL DEFAULT '[]',
        "currentVersion" integer NOT NULL DEFAULT 0,
        "status" varchar(20) NOT NULL DEFAULT 'draft',
        "createdBy" uuid NOT NULL,
        "lastModifiedBy" uuid NOT NULL,
        "publishedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for modules
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_expertise_modules_categoryId_status"
      ON "domain_expertise_modules" ("categoryId", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_expertise_modules_status_updatedAt"
      ON "domain_expertise_modules" ("status", "updatedAt" DESC)
    `);

    // Add foreign key constraint from lookup_tables to modules (nullable)
    await queryRunner.query(`
      ALTER TABLE "domain_lookup_tables"
      ADD CONSTRAINT "FK_domain_lookup_tables_moduleId"
      FOREIGN KEY ("moduleId")
      REFERENCES "domain_expertise_modules"("id")
      ON DELETE SET NULL
    `);

    // Create domain_value_driver_definitions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_value_driver_definitions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "attribute" varchar(100) NOT NULL,
        "conditionType" varchar(20) NOT NULL,
        "conditionValue" jsonb NOT NULL,
        "caseSensitive" boolean NOT NULL DEFAULT false,
        "priceMultiplier" decimal(5,2) NOT NULL,
        "priority" integer NOT NULL DEFAULT 0,
        "applicableBrands" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_domain_value_driver_definitions_moduleId"
          FOREIGN KEY ("moduleId")
          REFERENCES "domain_expertise_modules"("id")
          ON DELETE CASCADE
      )
    `);

    // Create indexes for value drivers
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_value_driver_definitions_moduleId_priority"
      ON "domain_value_driver_definitions" ("moduleId", "priority" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_value_driver_definitions_moduleId_isActive"
      ON "domain_value_driver_definitions" ("moduleId", "isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop value driver indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_value_driver_definitions_moduleId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_value_driver_definitions_moduleId_priority"`);

    // Drop value driver table
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_value_driver_definitions"`);

    // Remove foreign key from lookup_tables
    await queryRunner.query(`
      ALTER TABLE "domain_lookup_tables"
      DROP CONSTRAINT IF EXISTS "FK_domain_lookup_tables_moduleId"
    `);

    // Drop module indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_modules_status_updatedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_expertise_modules_categoryId_status"`);

    // Drop modules table
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_expertise_modules"`);
  }
}
