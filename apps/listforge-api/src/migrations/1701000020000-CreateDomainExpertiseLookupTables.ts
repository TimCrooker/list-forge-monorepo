import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create Domain Expertise Lookup Tables
 *
 * Part of Slice 9.1.1 - Lookup Tables Foundation
 *
 * Creates the foundational tables for the domain expertise system:
 * - domain_lookup_tables: Stores lookup table definitions
 * - domain_lookup_entries: Stores individual lookup entries
 *
 * These tables enable configurable reference data like:
 * - Louis Vuitton factory codes
 * - Hermes year codes (blindstamps)
 * - Rolex reference numbers
 */
export class CreateDomainExpertiseLookupTables1701000020000 implements MigrationInterface {
  name = 'CreateDomainExpertiseLookupTables1701000020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create domain_lookup_tables table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_lookup_tables" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid,
        "name" varchar(100) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "keyField" varchar(50) NOT NULL,
        "valueSchema" jsonb NOT NULL DEFAULT '[]',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create indexes for lookup tables
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_lookup_tables_moduleId"
      ON "domain_lookup_tables" ("moduleId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_lookup_tables_name"
      ON "domain_lookup_tables" ("name")
    `);

    // Create domain_lookup_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_lookup_entries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tableId" uuid NOT NULL,
        "key" varchar(100) NOT NULL,
        "values" jsonb NOT NULL DEFAULT '{}',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_domain_lookup_entries_tableId"
          FOREIGN KEY ("tableId")
          REFERENCES "domain_lookup_tables"("id")
          ON DELETE CASCADE
      )
    `);

    // Create indexes for lookup entries
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_domain_lookup_entries_tableId_key"
      ON "domain_lookup_entries" ("tableId", "key")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_lookup_entries_tableId_isActive"
      ON "domain_lookup_entries" ("tableId", "isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_lookup_entries_tableId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_lookup_entries_tableId_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_lookup_tables_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_lookup_tables_moduleId"`);

    // Drop tables (entries first due to foreign key)
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_lookup_entries"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_lookup_tables"`);
  }
}
