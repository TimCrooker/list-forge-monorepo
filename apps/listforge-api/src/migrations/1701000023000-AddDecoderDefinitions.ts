import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Decoder Definitions
 *
 * Part of Slice 9.1.4 - Decoder Definitions
 *
 * Creates:
 * - domain_decoder_definitions: Pattern-based identifier decoders
 */
export class AddDecoderDefinitions1701000023000 implements MigrationInterface {
  name = 'AddDecoderDefinitions1701000023000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create domain_decoder_definitions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "domain_decoder_definitions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "moduleId" uuid NOT NULL,
        "name" varchar(100) NOT NULL,
        "identifierType" varchar(50) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "inputPattern" varchar(500) NOT NULL,
        "inputMaxLength" integer NOT NULL DEFAULT 50,
        "extractionRules" jsonb NOT NULL DEFAULT '[]',
        "lookupTableId" uuid,
        "lookupKeyGroup" integer,
        "validationRules" jsonb NOT NULL DEFAULT '[]',
        "outputFields" jsonb NOT NULL DEFAULT '[]',
        "baseConfidence" decimal(3,2) NOT NULL DEFAULT 0.90,
        "priority" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "testCases" jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_domain_decoder_definitions_moduleId"
          FOREIGN KEY ("moduleId")
          REFERENCES "domain_expertise_modules"("id")
          ON DELETE CASCADE,
        CONSTRAINT "FK_domain_decoder_definitions_lookupTableId"
          FOREIGN KEY ("lookupTableId")
          REFERENCES "domain_lookup_tables"("id")
          ON DELETE SET NULL
      )
    `);

    // Create indexes for decoders
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_decoder_definitions_moduleId_priority"
      ON "domain_decoder_definitions" ("moduleId", "priority" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_decoder_definitions_moduleId_isActive"
      ON "domain_decoder_definitions" ("moduleId", "isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_domain_decoder_definitions_moduleId_identifierType"
      ON "domain_decoder_definitions" ("moduleId", "identifierType")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_decoder_definitions_moduleId_identifierType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_decoder_definitions_moduleId_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_decoder_definitions_moduleId_priority"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_decoder_definitions"`);
  }
}
