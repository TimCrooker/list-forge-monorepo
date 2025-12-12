/**
 * Create Missing Version Snapshots Script
 *
 * Creates version snapshots for any published modules that don't have versions yet.
 * This is a one-time script to fix modules that were seeded before version snapshots were implemented.
 *
 * Usage: npx ts-node src/domain-expertise/scripts/create-missing-versions.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../../.env') });

import {
  DomainExpertiseModuleEntity,
  LookupTable,
  LookupEntry,
  ValueDriverDefinition,
  DecoderDefinition,
  AuthenticityMarkerDefinition,
  DomainExpertiseVersion,
  DomainExpertiseSnapshot,
} from '../entities';

// System user ID for seed data
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

async function createDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'listforge',
    password: process.env.DB_PASSWORD || 'listforge',
    database: process.env.DB_NAME || 'listforge_dev',
    entities: [
      DomainExpertiseModuleEntity,
      LookupTable,
      LookupEntry,
      ValueDriverDefinition,
      DecoderDefinition,
      AuthenticityMarkerDefinition,
      DomainExpertiseVersion,
    ],
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
  });

  await dataSource.initialize();
  return dataSource;
}

async function createVersionForModule(dataSource: DataSource, module: DomainExpertiseModuleEntity): Promise<void> {
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);
  const versionRepo = dataSource.getRepository(DomainExpertiseVersion);

  // Load all related entities
  const lookupTables = await lookupTableRepo.find({ where: { moduleId: module.id } });
  const valueDrivers = await valueDriverRepo.find({ where: { moduleId: module.id } });
  const decoders = await decoderRepo.find({ where: { moduleId: module.id } });
  const markers = await markerRepo.find({ where: { moduleId: module.id } });

  // Load all lookup entries for this module's tables
  const lookupEntries: DomainExpertiseSnapshot['lookupEntries'] = [];
  for (const table of lookupTables) {
    const entries = await lookupEntryRepo.find({
      where: { tableId: table.id, isActive: true },
    });
    for (const entry of entries) {
      lookupEntries.push({
        id: entry.id,
        tableId: entry.tableId,
        key: entry.key,
        values: entry.values,
      });
    }
  }

  // Create snapshot
  const snapshot: DomainExpertiseSnapshot = {
    module: {
      name: module.name,
      description: module.description,
      categoryId: module.categoryId,
      applicableBrands: module.applicableBrands,
    },
    decoders: decoders.filter(d => d.isActive).map(d => ({
      id: d.id,
      name: d.name,
      identifierType: d.identifierType,
      description: d.description,
      inputPattern: d.inputPattern,
      inputMaxLength: d.inputMaxLength,
      extractionRules: d.extractionRules,
      lookupTableId: d.lookupTableId,
      lookupKeyGroup: d.lookupKeyGroup,
      validationRules: d.validationRules,
      outputFields: d.outputFields,
      baseConfidence: Number(d.baseConfidence),
      priority: d.priority,
      testCases: d.testCases,
    })),
    lookupTables: lookupTables.filter(t => t.isActive).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      keyField: t.keyField,
      valueSchema: t.valueSchema,
      entryCount: lookupEntries.filter(e => e.tableId === t.id).length,
    })),
    lookupEntries,
    valueDrivers: valueDrivers.filter(v => v.isActive).map(v => ({
      id: v.id,
      name: v.name,
      description: v.description,
      attribute: v.attribute,
      conditionType: v.conditionType,
      conditionValue: v.conditionValue,
      caseSensitive: v.caseSensitive,
      priceMultiplier: Number(v.priceMultiplier),
      priority: v.priority,
      applicableBrands: v.applicableBrands,
    })),
    authenticityMarkers: markers.filter(m => m.isActive).map(m => ({
      id: m.id,
      name: m.name,
      checkDescription: m.checkDescription,
      pattern: m.pattern,
      patternMaxLength: m.patternMaxLength,
      importance: m.importance,
      indicatesAuthentic: m.indicatesAuthentic,
      applicableBrands: m.applicableBrands,
    })),
  };

  // Create version record
  const version = versionRepo.create({
    moduleId: module.id,
    version: module.currentVersion || 1,
    snapshot,
    changelog: 'Initial version (created retroactively)',
    publishedBy: SYSTEM_USER_ID,
    isActive: true,
  });
  await versionRepo.save(version);

  console.log(`  Created version ${module.currentVersion || 1} for module: ${module.name}`);
}

async function main(): Promise<void> {
  console.log('Creating missing version snapshots...\n');

  let dataSource: DataSource | null = null;

  try {
    dataSource = await createDataSource();
    console.log('Connected to database\n');

    const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
    const versionRepo = dataSource.getRepository(DomainExpertiseVersion);

    // Find all published modules
    const publishedModules = await moduleRepo.find({
      where: { status: 'published' },
    });

    if (publishedModules.length === 0) {
      console.log('No published modules found.');
      return;
    }

    console.log(`Found ${publishedModules.length} published modules\n`);

    let created = 0;
    let skipped = 0;

    for (const module of publishedModules) {
      // Check if module already has a version
      const existingVersion = await versionRepo.findOne({
        where: { moduleId: module.id },
      });

      if (existingVersion) {
        console.log(`  Skipping ${module.name} - already has version(s)`);
        skipped++;
        continue;
      }

      await createVersionForModule(dataSource, module);
      created++;
    }

    console.log(`\n✅ Done! Created ${created} version snapshots, skipped ${skipped} modules.`);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('\nDatabase connection closed.');
    }
  }
}

main();
