/**
 * Domain Expertise Seed Script - Slice 9.1
 *
 * Seeds the database with comprehensive domain expertise data from research-backed data files.
 * Creates modules, lookup tables, value drivers, decoders, and authenticity markers.
 *
 * Usage: npx ts-node src/domain-expertise/scripts/seed-domain-expertise.ts
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

// Import comprehensive data from research-backed data files
import {
  LV_FACTORY_CODES,
  HERMES_YEAR_CODES,
  CHANEL_SERIAL_ERAS,
  HANDBAG_VALUE_DRIVERS,
  HANDBAG_AUTHENTICITY_MARKERS,
  HANDBAG_DECODERS,
  HANDBAG_LOOKUP_TABLES,
} from '../data/luxury-handbags.data';

import {
  ROLEX_SERIAL_LETTER_PREFIXES,
  ROLEX_CLASP_CODES,
  ROLEX_MATERIAL_CODES,
  ROLEX_BEZEL_CODES,
  ROLEX_REFERENCE_FAMILIES,
  OMEGA_SERIAL_RANGES,
  PATEK_MATERIAL_CODES,
  PATEK_COLLECTION_CODES,
  WATCH_VALUE_DRIVERS,
  WATCH_AUTHENTICITY_MARKERS,
  WATCH_DECODERS,
} from '../data/luxury-watches.data';

import {
  NIKE_COMMON_COLOR_CODES,
  JORDAN_MODEL_CODES,
  JORDAN_COLORWAY_NAMES,
  YEEZY_REGION_CODES,
  YEEZY_MODEL_CODES,
  SNEAKER_VALUE_DRIVERS,
  SNEAKER_AUTHENTICITY_MARKERS,
  SNEAKER_DECODERS,
} from '../data/sneakers.data';

import {
  LEVIS_RED_TAB_ERAS,
  LEVIS_FACTORY_CODES,
  LEVIS_MODEL_NUMBERS,
  CONSTRUCTION_ERAS,
  DENIM_VALUE_DRIVERS,
  DENIM_AUTHENTICITY_MARKERS,
  DENIM_DECODERS,
} from '../data/vintage-denim.data';

import {
  PSA_GRADING_SCALE,
  BGS_GRADING_SCALE,
  CGC_GRADING_SCALE,
  POKEMON_BASE_SET_EDITIONS,
  TOPPS_CHROME_PARALLELS,
  PANINI_PRIZM_PARALLELS,
  TRADING_CARD_VALUE_DRIVERS,
  TRADING_CARD_AUTHENTICITY_MARKERS,
  TRADING_CARD_DECODERS,
} from '../data/trading-cards.data';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

// System user ID for seed data
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Helper: Convert object schema notation to LookupValueField[] array
 * Input: { location: 'string', country: 'string', active: 'boolean' }
 * Output: [{ name: 'location', type: 'string', required: true }, ...]
 */
function convertValueSchema(obj: Record<string, string>): { name: string; type: 'string' | 'number' | 'boolean'; required: boolean }[] {
  return Object.entries(obj).map(([name, typeStr]) => ({
    name,
    type: (typeStr === 'number' || typeStr === 'boolean' ? typeStr : 'string') as 'string' | 'number' | 'boolean',
    required: true,
  }));
}

/**
 * Helper: Map conditionType to valid ValueDriverConditionType
 * The entity only supports: 'contains' | 'equals' | 'regex' | 'range' | 'custom'
 */
function mapConditionType(type: string): 'contains' | 'equals' | 'regex' | 'range' | 'custom' {
  if (type === 'in') return 'custom';
  if (['contains', 'equals', 'regex', 'range', 'custom'].includes(type)) {
    return type as 'contains' | 'equals' | 'regex' | 'range' | 'custom';
  }
  return 'custom';
}

/**
 * Helper: Map importance to valid AuthenticityMarkerImportance
 * The entity only supports: 'critical' | 'important' | 'helpful'
 */
function mapImportance(importance: string): 'critical' | 'important' | 'helpful' {
  if (importance === 'critical') return 'critical';
  if (importance === 'major' || importance === 'important' || importance === 'moderate') return 'important';
  if (importance === 'minor' || importance === 'helpful') return 'helpful';
  return 'important'; // default
}

// =============================================================================
// DATABASE CONNECTION
// =============================================================================

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

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedLuxuryHandbagsModule(dataSource: DataSource): Promise<string> {
  console.log('Creating luxury_handbags module...');

  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);

  // Create module with comprehensive description
  const module = moduleRepo.create({
    name: 'Luxury Handbags Authentication',
    description:
      'Comprehensive domain expertise for luxury handbags including Louis Vuitton, Hermes, Chanel, and Gucci. ' +
      'Features 60+ LV factory codes, complete Hermes blindstamp cycles (1971-2025), Chanel serial number eras ' +
      '(1984-present including microchip), Gucci style codes, value drivers for exotic leathers and rare colors, ' +
      'and detailed authenticity markers.',
    categoryId: 'luxury_handbags',
    applicableBrands: ['Louis Vuitton', 'Hermes', 'Chanel', 'Gucci'],
    status: 'draft',
    currentVersion: 0,
    createdBy: SYSTEM_USER_ID,
    lastModifiedBy: SYSTEM_USER_ID,
  });
  await moduleRepo.save(module);

  // Create LV Factory Codes lookup table with enhanced data
  const lvFactoryTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'LV Factory Codes',
    description: 'Louis Vuitton factory codes with location, country, active status, and notes',
    keyField: 'code',
    valueSchema: [
      { name: 'location', type: 'string', required: true },
      { name: 'country', type: 'string', required: true },
      { name: 'active', type: 'boolean', required: true },
      { name: 'notes', type: 'string', required: false },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(lvFactoryTable);

  // Create LV factory entries from enhanced data
  const lvEntries = Object.entries(LV_FACTORY_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: lvFactoryTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(lvEntries);
  console.log(`  Created ${lvEntries.length} LV factory code entries`);

  // Create Hermes Year Codes lookup table with enhanced format info
  const hermesYearTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Hermes Year Codes (Blindstamp)',
    description: 'Hermes blindstamp year codes across 3 cycles: no enclosure (1971-1996), circle (1997-2014), square (2015+)',
    keyField: 'letter_cycle',
    valueSchema: [
      { name: 'letter', type: 'string', required: true },
      { name: 'year', type: 'number', required: true },
      { name: 'cycle', type: 'number', required: true },
      { name: 'format', type: 'string', required: false },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(hermesYearTable);

  // Create Hermes year entries from enhanced data
  const hermesEntries = HERMES_YEAR_CODES.map((entry) =>
    lookupEntryRepo.create({
      tableId: hermesYearTable.id,
      key: `${entry.letter}_${entry.cycle}`,
      values: entry,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(hermesEntries);
  console.log(`  Created ${hermesEntries.length} Hermes year code entries`);

  // Create Chanel Serial Number Eras lookup table
  const chanelSerialTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Chanel Serial Number Eras',
    description: 'Chanel serial number formats by era: 6-digit (1984-86), 7-digit (1986-2005), 8-digit (2005-2021), microchip (2021+)',
    keyField: 'era',
    valueSchema: [
      { name: 'startYear', type: 'number', required: true },
      { name: 'endYear', type: 'number', required: true },
      { name: 'digitCount', type: 'number', required: true },
      { name: 'format', type: 'string', required: true },
      { name: 'notes', type: 'string', required: false },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(chanelSerialTable);

  // Create Chanel serial entries
  const chanelEntries = CHANEL_SERIAL_ERAS.map((entry, idx) =>
    lookupEntryRepo.create({
      tableId: chanelSerialTable.id,
      key: `era_${idx + 1}`,
      values: entry,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(chanelEntries);
  console.log(`  Created ${chanelEntries.length} Chanel serial era entries`);

  // Create decoders from enhanced data
  for (const decoderDef of HANDBAG_DECODERS) {
    const decoder = decoderRepo.create({
      moduleId: module.id,
      name: decoderDef.name,
      identifierType: decoderDef.identifierType,
      description: decoderDef.description,
      inputPattern: decoderDef.inputPattern,
      inputMaxLength: decoderDef.inputMaxLength,
      extractionRules: decoderDef.extractionRules as unknown as DecoderDefinition['extractionRules'],
      lookupTableId: decoderDef.identifierType === 'lv_date_code' ? lvFactoryTable.id :
                     decoderDef.identifierType === 'hermes_blindstamp' ? hermesYearTable.id : undefined,
      lookupKeyGroup: 1,
      validationRules: ((decoderDef as { validationRules?: unknown[] }).validationRules || []) as DecoderDefinition['validationRules'],
      outputFields: decoderDef.outputFields as unknown as DecoderDefinition['outputFields'],
      baseConfidence: decoderDef.baseConfidence,
      priority: decoderDef.priority,
      isActive: true,
      testCases: decoderDef.testCases as unknown as DecoderDefinition['testCases'],
    });
    await decoderRepo.save(decoder);
  }
  console.log(`  Created ${HANDBAG_DECODERS.length} decoders`);

  // Create value drivers from enhanced data
  for (const driver of HANDBAG_VALUE_DRIVERS) {
    await valueDriverRepo.save(
      valueDriverRepo.create({
        moduleId: module.id,
        name: driver.name,
        description: driver.description,
        attribute: driver.attribute,
        conditionType: mapConditionType(driver.conditionType),
        conditionValue: driver.conditionValue,
        caseSensitive: driver.caseSensitive ?? false,
        priceMultiplier: driver.priceMultiplier,
        priority: driver.priority,
        applicableBrands: driver.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${HANDBAG_VALUE_DRIVERS.length} value drivers`);

  // Create authenticity markers from enhanced data
  for (const marker of HANDBAG_AUTHENTICITY_MARKERS) {
    const desc = (marker as { checkDescription?: string; description?: string }).checkDescription
              || (marker as { description?: string }).description
              || '';
    await markerRepo.save(
      markerRepo.create({
        moduleId: module.id,
        name: marker.name,
        checkDescription: desc,
        pattern: marker.pattern,
        patternMaxLength: marker.patternMaxLength || 50,
        importance: mapImportance(marker.importance),
        indicatesAuthentic: marker.indicatesAuthentic,
        applicableBrands: marker.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${HANDBAG_AUTHENTICITY_MARKERS.length} authenticity markers`);

  return module.id;
}

async function seedWatchesModule(dataSource: DataSource): Promise<string> {
  console.log('Creating watches module...');

  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);

  // Create module with comprehensive description
  const module = moduleRepo.create({
    name: 'Luxury Watches Reference Guide',
    description:
      'Comprehensive domain expertise for luxury watches including Rolex, Omega, Patek Philippe, and Audemars Piguet. ' +
      'Features Rolex serial number ranges (sequential 1926-1987, letter prefix 1987-2010, random 2010+), clasp codes, ' +
      'material codes, bezel suffix codes, Omega serial decoding, Patek Philippe reference format decoding, ' +
      'and detailed value drivers for discontinued references, rare dials, and provenance.',
    categoryId: 'watches',
    applicableBrands: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet'],
    status: 'draft',
    currentVersion: 0,
    createdBy: SYSTEM_USER_ID,
    lastModifiedBy: SYSTEM_USER_ID,
  });
  await moduleRepo.save(module);

  // Create Rolex Letter Prefix lookup table
  const rolexLetterTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Rolex Serial Letter Prefixes',
    description: 'Rolex serial number letter prefixes (1987-2010) to year mapping',
    keyField: 'letter',
    valueSchema: [
      { name: 'letter', type: 'string', required: true },
      { name: 'year', type: 'number', required: true },
      { name: 'notes', type: 'string', required: false },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(rolexLetterTable);

  // Create Rolex letter prefix entries
  const rolexLetterEntries = ROLEX_SERIAL_LETTER_PREFIXES.map((entry) =>
    lookupEntryRepo.create({
      tableId: rolexLetterTable.id,
      key: entry.letter,
      values: entry,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(rolexLetterEntries);
  console.log(`  Created ${rolexLetterEntries.length} Rolex letter prefix entries`);

  // Create Rolex Clasp Codes lookup table
  const rolexClaspTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Rolex Clasp Codes',
    description: 'Rolex bracelet clasp codes (2000-2010) to year mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'year', type: 'number', required: true },
      { name: 'notes', type: 'string', required: false },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(rolexClaspTable);

  // Create Rolex clasp code entries
  const rolexClaspEntries = Object.entries(ROLEX_CLASP_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: rolexClaspTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(rolexClaspEntries);
  console.log(`  Created ${rolexClaspEntries.length} Rolex clasp code entries`);

  // Create Rolex Material Codes lookup table
  const rolexMaterialTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Rolex Material Codes',
    description: 'Rolex reference number last digit to material mapping',
    keyField: 'digit',
    valueSchema: [
      { name: 'material', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(rolexMaterialTable);

  // Create Rolex material code entries
  const rolexMaterialEntries = Object.entries(ROLEX_MATERIAL_CODES).map(([digit, info]) =>
    lookupEntryRepo.create({
      tableId: rolexMaterialTable.id,
      key: digit,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(rolexMaterialEntries);
  console.log(`  Created ${rolexMaterialEntries.length} Rolex material code entries`);

  // Create Rolex Bezel Codes lookup table
  const rolexBezelTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Rolex Bezel Suffix Codes',
    description: 'Rolex bezel letter codes (LN, LV, BLRO, BLNR) to color mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'color', type: 'string', required: true },
      { name: 'nickname', type: 'string', required: false },
      { name: 'description', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(rolexBezelTable);

  // Create Rolex bezel code entries
  const rolexBezelEntries = Object.entries(ROLEX_BEZEL_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: rolexBezelTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(rolexBezelEntries);
  console.log(`  Created ${rolexBezelEntries.length} Rolex bezel code entries`);

  // Create Patek Material Codes lookup table
  const patekMaterialTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Patek Philippe Material Codes',
    description: 'Patek Philippe reference letter to material mapping (French origins)',
    keyField: 'letter',
    valueSchema: [
      { name: 'material', type: 'string', required: true },
      { name: 'french', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(patekMaterialTable);

  // Create Patek material code entries
  const patekMaterialEntries = Object.entries(PATEK_MATERIAL_CODES).map(([letter, info]) =>
    lookupEntryRepo.create({
      tableId: patekMaterialTable.id,
      key: letter,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(patekMaterialEntries);
  console.log(`  Created ${patekMaterialEntries.length} Patek Philippe material code entries`);

  // Create decoders from enhanced data
  for (const decoderDef of WATCH_DECODERS) {
    const decoder = decoderRepo.create({
      moduleId: module.id,
      name: decoderDef.name,
      identifierType: decoderDef.identifierType,
      description: decoderDef.description,
      inputPattern: decoderDef.inputPattern,
      inputMaxLength: decoderDef.inputMaxLength,
      extractionRules: decoderDef.extractionRules as unknown as DecoderDefinition['extractionRules'],
      lookupTableId: decoderDef.identifierType === 'clasp_code' ? rolexClaspTable.id : undefined,
      lookupKeyGroup: 1,
      validationRules: ((decoderDef as { validationRules?: unknown[] }).validationRules || []) as DecoderDefinition['validationRules'],
      outputFields: decoderDef.outputFields as unknown as DecoderDefinition['outputFields'],
      baseConfidence: decoderDef.baseConfidence,
      priority: decoderDef.priority,
      isActive: true,
      testCases: decoderDef.testCases as unknown as DecoderDefinition['testCases'],
    });
    await decoderRepo.save(decoder);
  }
  console.log(`  Created ${WATCH_DECODERS.length} decoders`);

  // Create value drivers from enhanced data
  for (const driver of WATCH_VALUE_DRIVERS) {
    await valueDriverRepo.save(
      valueDriverRepo.create({
        moduleId: module.id,
        name: driver.name,
        description: driver.description,
        attribute: driver.attribute,
        conditionType: mapConditionType(driver.conditionType),
        conditionValue: driver.conditionValue,
        caseSensitive: false,
        priceMultiplier: driver.priceMultiplier,
        priority: driver.priority,
        applicableBrands: [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${WATCH_VALUE_DRIVERS.length} value drivers`);

  // Create authenticity markers from enhanced data
  for (const marker of WATCH_AUTHENTICITY_MARKERS) {
    const desc = (marker as { checkDescription?: string; description?: string }).checkDescription
              || (marker as { description?: string }).description
              || '';
    await markerRepo.save(
      markerRepo.create({
        moduleId: module.id,
        name: marker.name,
        checkDescription: desc,
        pattern: marker.pattern,
        patternMaxLength: (marker as { patternMaxLength?: number }).patternMaxLength || 50,
        importance: mapImportance(marker.importance),
        indicatesAuthentic: marker.indicatesAuthentic,
        applicableBrands: marker.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${WATCH_AUTHENTICITY_MARKERS.length} authenticity markers`);

  return module.id;
}

async function seedSneakersModule(dataSource: DataSource): Promise<string> {
  console.log('Creating sneakers module...');

  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);

  // Create module with comprehensive description
  const module = moduleRepo.create({
    name: 'Sneakers Authentication & Valuation',
    description:
      'Comprehensive domain expertise for collectible sneakers including Nike, Jordan, Adidas Yeezy, and New Balance. ' +
      'Features Nike 9-digit style code decoding (model + colorway), Jordan model codes and iconic colorway names, ' +
      'Yeezy serial number region codes (V02, V03, V04, V10), collaboration value premiums (Travis Scott, Off-White, Fragment), ' +
      'and detailed authenticity markers for fake detection.',
    categoryId: 'sneakers',
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy', 'New Balance'],
    status: 'draft',
    currentVersion: 0,
    createdBy: SYSTEM_USER_ID,
    lastModifiedBy: SYSTEM_USER_ID,
  });
  await moduleRepo.save(module);

  // Create Nike Color Codes lookup table
  const nikeColorTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Nike Color Codes',
    description: 'Nike 3-digit color code to colorway name mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'colorway', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(nikeColorTable);

  // Create Nike color code entries
  const nikeColorEntries = Object.entries(NIKE_COMMON_COLOR_CODES).map(([code, colorway]) =>
    lookupEntryRepo.create({
      tableId: nikeColorTable.id,
      key: code,
      values: { colorway },
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(nikeColorEntries);
  console.log(`  Created ${nikeColorEntries.length} Nike color code entries`);

  // Create Jordan Model Codes lookup table
  const jordanModelTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Jordan Model Codes',
    description: 'Jordan style code to model information mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'model', type: 'string', required: true },
      { name: 'year', type: 'number', required: true },
      { name: 'designer', type: 'string', required: true },
      { name: 'significance', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(jordanModelTable);

  // Create Jordan model code entries
  const jordanModelEntries = Object.entries(JORDAN_MODEL_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: jordanModelTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(jordanModelEntries);
  console.log(`  Created ${jordanModelEntries.length} Jordan model code entries`);

  // Create Jordan Colorways lookup table
  const jordanColorwayTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Jordan Iconic Colorways',
    description: 'Famous Jordan colorway nicknames and their style codes',
    keyField: 'nickname',
    valueSchema: [
      { name: 'officialName', type: 'string', required: true },
      { name: 'styleCode', type: 'string', required: true },
      { name: 'year', type: 'number', required: true },
      { name: 'significance', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(jordanColorwayTable);

  // Create Jordan colorway entries
  const jordanColorwayEntries = Object.entries(JORDAN_COLORWAY_NAMES).map(([nickname, info]) =>
    lookupEntryRepo.create({
      tableId: jordanColorwayTable.id,
      key: nickname,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(jordanColorwayEntries);
  console.log(`  Created ${jordanColorwayEntries.length} Jordan colorway entries`);

  // Create Yeezy Region Codes lookup table
  const yeezyRegionTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Yeezy Region Codes',
    description: 'Yeezy serial number suffix to region mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'region', type: 'string', required: true },
      { name: 'serialEnding', type: 'string', required: true },
      { name: 'sizesDisplayed', type: 'string', required: true },
      { name: 'notes', type: 'string', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(yeezyRegionTable);

  // Create Yeezy region code entries
  const yeezyRegionEntries = Object.entries(YEEZY_REGION_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: yeezyRegionTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(yeezyRegionEntries);
  console.log(`  Created ${yeezyRegionEntries.length} Yeezy region code entries`);

  // Create Yeezy Model Codes lookup table
  const yeezyModelTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Yeezy Model Codes',
    description: 'Yeezy style code to model and silhouette mapping',
    keyField: 'code',
    valueSchema: [
      { name: 'model', type: 'string', required: true },
      { name: 'silhouette', type: 'string', required: true },
      { name: 'yearIntroduced', type: 'number', required: true },
    ],
    isActive: true,
  });
  await lookupTableRepo.save(yeezyModelTable);

  // Create Yeezy model code entries
  const yeezyModelEntries = Object.entries(YEEZY_MODEL_CODES).map(([code, info]) =>
    lookupEntryRepo.create({
      tableId: yeezyModelTable.id,
      key: code,
      values: info,
      isActive: true,
    }),
  );
  await lookupEntryRepo.save(yeezyModelEntries);
  console.log(`  Created ${yeezyModelEntries.length} Yeezy model code entries`);

  // Create decoders from enhanced data
  for (const decoderDef of SNEAKER_DECODERS) {
    const decoder = decoderRepo.create({
      moduleId: module.id,
      name: decoderDef.name,
      identifierType: decoderDef.identifierType,
      description: decoderDef.description,
      inputPattern: decoderDef.inputPattern,
      inputMaxLength: decoderDef.inputMaxLength,
      extractionRules: decoderDef.extractionRules as unknown as DecoderDefinition['extractionRules'],
      lookupTableId: decoderDef.identifierType === 'color_code' ? nikeColorTable.id : undefined,
      lookupKeyGroup: 1,
      validationRules: ((decoderDef as { validationRules?: unknown[] }).validationRules || []) as DecoderDefinition['validationRules'],
      outputFields: decoderDef.outputFields as unknown as DecoderDefinition['outputFields'],
      baseConfidence: decoderDef.baseConfidence,
      priority: decoderDef.priority,
      isActive: true,
      testCases: decoderDef.testCases as unknown as DecoderDefinition['testCases'],
    });
    await decoderRepo.save(decoder);
  }
  console.log(`  Created ${SNEAKER_DECODERS.length} decoders`);

  // Create value drivers from enhanced data
  for (const driver of SNEAKER_VALUE_DRIVERS) {
    await valueDriverRepo.save(
      valueDriverRepo.create({
        moduleId: module.id,
        name: driver.name,
        description: driver.description,
        attribute: driver.attribute,
        conditionType: mapConditionType(driver.conditionType),
        conditionValue: driver.conditionValue,
        caseSensitive: false,
        priceMultiplier: driver.priceMultiplier,
        priority: driver.priority,
        applicableBrands: [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${SNEAKER_VALUE_DRIVERS.length} value drivers`);

  // Create authenticity markers from enhanced data
  for (const marker of SNEAKER_AUTHENTICITY_MARKERS) {
    const desc = (marker as { checkDescription?: string; description?: string }).checkDescription
              || (marker as { description?: string }).description
              || '';
    await markerRepo.save(
      markerRepo.create({
        moduleId: module.id,
        name: marker.name,
        checkDescription: desc,
        pattern: marker.pattern,
        patternMaxLength: (marker as { patternMaxLength?: number }).patternMaxLength || 50,
        importance: mapImportance(marker.importance),
        indicatesAuthentic: marker.indicatesAuthentic,
        applicableBrands: marker.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${SNEAKER_AUTHENTICITY_MARKERS.length} authenticity markers`);

  return module.id;
}

async function seedVintageDenimModule(dataSource: DataSource): Promise<string> {
  console.log('Creating vintage_denim module...');

  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);

  // Create module
  const module = moduleRepo.create({
    name: "Vintage Denim Valuation",
    description:
      "Domain expertise for vintage denim including Levi's, Lee, Wrangler. Covers Big E dating, red tab eras, selvedge identification, factory codes, and construction features.",
    categoryId: 'vintage_denim',
    applicableBrands: ["Levi's", 'Levis', 'Lee', 'Wrangler'],
    status: 'draft',
    currentVersion: 0,
    createdBy: SYSTEM_USER_ID,
    lastModifiedBy: SYSTEM_USER_ID,
  });
  await moduleRepo.save(module);

  // ----- Create Lookup Tables -----

  // Levi's Red Tab Eras lookup table
  const tabErasTable = lookupTableRepo.create({
    moduleId: module.id,
    name: "Levi's Red Tab Eras",
    description: 'Tab style to era and value mapping (Big E vs small e)',
    keyField: 'era',
    valueSchema: convertValueSchema({ tab_style: 'string', start_year: 'number', end_year: 'number', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(tabErasTable);

  // Populate tab eras entries
  for (const era of LEVIS_RED_TAB_ERAS) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: tabErasTable.id,
        key: era.era,
        values: {
          tab_style: era.tabStyle,
          start_year: era.startYear,
          end_year: era.endYear,
          description: era.description,
          multiplier: era.valueMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${LEVIS_RED_TAB_ERAS.length} Levi's red tab era entries`);

  // Levi's Factory Codes lookup table
  const factoryTable = lookupTableRepo.create({
    moduleId: module.id,
    name: "Levi's Factory Codes",
    description: 'Button stamp and care label factory code to location mapping',
    keyField: 'code',
    valueSchema: convertValueSchema({ location: 'string', state: 'string', active: 'string' }),
    isActive: true,
  });
  await lookupTableRepo.save(factoryTable);

  // Populate factory code entries
  for (const [code, data] of Object.entries(LEVIS_FACTORY_CODES)) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: factoryTable.id,
        key: code,
        values: {
          location: data.location,
          state: data.state,
          active: data.active,
          notes: data.notes || '',
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${Object.keys(LEVIS_FACTORY_CODES).length} Levi's factory code entries`);

  // Levi's Model Numbers lookup table
  const modelTable = lookupTableRepo.create({
    moduleId: module.id,
    name: "Levi's Model Numbers",
    description: 'Model designations (501, 501XX, Type I, etc.) and their significance',
    keyField: 'model',
    valueSchema: convertValueSchema({ introduced: 'number', description: 'string', significance: 'string' }),
    isActive: true,
  });
  await lookupTableRepo.save(modelTable);

  // Populate model number entries
  for (const [model, data] of Object.entries(LEVIS_MODEL_NUMBERS)) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: modelTable.id,
        key: model,
        values: {
          model: data.model,
          introduced: data.introduced,
          description: data.description,
          significance: data.significance,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${Object.keys(LEVIS_MODEL_NUMBERS).length} Levi's model number entries`);

  // Construction Features lookup table
  const constructionTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Construction Features by Era',
    description: 'Dating features based on construction details (rivets, stitching, etc.)',
    keyField: 'feature',
    valueSchema: convertValueSchema({ change_year: 'number', before: 'string', after: 'string' }),
    isActive: true,
  });
  await lookupTableRepo.save(constructionTable);

  // Populate construction feature entries
  for (const feature of CONSTRUCTION_ERAS) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: constructionTable.id,
        key: feature.feature,
        values: {
          change_year: feature.changeYear,
          before: feature.preDate,
          after: feature.postDate,
          description: feature.description,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${CONSTRUCTION_ERAS.length} construction feature entries`);

  // ----- Create Value Drivers -----
  for (const driver of DENIM_VALUE_DRIVERS) {
    await valueDriverRepo.save(
      valueDriverRepo.create({
        moduleId: module.id,
        name: driver.name,
        description: driver.description,
        attribute: driver.attribute,
        conditionType: mapConditionType(driver.conditionType),
        conditionValue: driver.conditionValue,
        caseSensitive: false,
        priceMultiplier: driver.priceMultiplier,
        priority: driver.priority,
        applicableBrands: driver.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${DENIM_VALUE_DRIVERS.length} value drivers`);

  // ----- Create Decoders -----
  for (const decoder of DENIM_DECODERS) {
    await decoderRepo.save(
      decoderRepo.create({
        moduleId: module.id,
        name: decoder.name,
        identifierType: decoder.identifierType,
        description: decoder.description,
        inputPattern: decoder.inputPattern,
        inputMaxLength: decoder.inputMaxLength,
        extractionRules: decoder.extractionRules as unknown as DecoderDefinition['extractionRules'],
        validationRules: ((decoder as { validationRules?: unknown[] }).validationRules || []) as DecoderDefinition['validationRules'],
        outputFields: decoder.outputFields as unknown as DecoderDefinition['outputFields'],
        baseConfidence: decoder.baseConfidence,
        priority: decoder.priority,
        testCases: decoder.testCases as unknown as DecoderDefinition['testCases'],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${DENIM_DECODERS.length} decoders`);

  // ----- Create Authenticity Markers -----
  for (const marker of DENIM_AUTHENTICITY_MARKERS) {
    const desc = (marker as { checkDescription?: string; description?: string }).checkDescription
              || (marker as { description?: string }).description
              || '';
    await markerRepo.save(
      markerRepo.create({
        moduleId: module.id,
        name: marker.name,
        checkDescription: desc,
        pattern: marker.pattern,
        patternMaxLength: (marker as { patternMaxLength?: number }).patternMaxLength || 50,
        importance: mapImportance(marker.importance),
        indicatesAuthentic: marker.indicatesAuthentic,
        applicableBrands: marker.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${DENIM_AUTHENTICITY_MARKERS.length} authenticity markers`);

  return module.id;
}

async function seedTradingCardsModule(dataSource: DataSource): Promise<string> {
  console.log('Creating trading_cards module...');

  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);

  // Create module
  const module = moduleRepo.create({
    name: 'Trading Cards Grading & Valuation',
    description:
      'Domain expertise for trading cards including Pokemon, Magic: The Gathering, Sports Cards. Covers PSA/BGS/CGC grading scales, editions, parallels, and authenticity verification.',
    categoryId: 'trading_cards',
    applicableBrands: ['Pokemon', 'Magic: The Gathering', 'Yu-Gi-Oh', 'Sports Cards', 'Topps', 'Panini'],
    status: 'draft',
    currentVersion: 0,
    createdBy: SYSTEM_USER_ID,
    lastModifiedBy: SYSTEM_USER_ID,
  });
  await moduleRepo.save(module);

  // ----- Create Lookup Tables -----

  // PSA Grading Scale lookup table
  const psaTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'PSA Grading Scale',
    description: 'Professional Sports Authenticator grading scale (1-10)',
    keyField: 'grade',
    valueSchema: convertValueSchema({ name: 'string', description: 'string', centering: 'string', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(psaTable);

  // Populate PSA entries
  for (const grade of PSA_GRADING_SCALE) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: psaTable.id,
        key: String(grade.grade),
        values: {
          name: grade.name,
          description: grade.description,
          centering: grade.centering,
          corners: grade.corners,
          edges: grade.edges,
          surface: grade.surface,
          multiplier: grade.priceMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${PSA_GRADING_SCALE.length} PSA grading scale entries`);

  // BGS Grading Scale lookup table
  const bgsTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'BGS Grading Scale',
    description: 'Beckett Grading Services scale with subgrades and label colors',
    keyField: 'grade',
    valueSchema: convertValueSchema({ name: 'string', label_color: 'string', subgrades: 'string', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(bgsTable);

  // Populate BGS entries
  for (const grade of BGS_GRADING_SCALE) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: bgsTable.id,
        key: `${grade.grade}_${grade.labelColor}`,
        values: {
          grade: grade.grade,
          name: grade.name,
          label_color: grade.labelColor,
          description: grade.description,
          subgrade_requirements: grade.subgradeRequirements,
          multiplier: grade.priceMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${BGS_GRADING_SCALE.length} BGS grading scale entries`);

  // CGC Grading Scale lookup table
  const cgcTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'CGC Grading Scale',
    description: 'Certified Guaranty Company grading scale',
    keyField: 'grade',
    valueSchema: convertValueSchema({ name: 'string', label_color: 'string', requirements: 'string', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(cgcTable);

  // Populate CGC entries
  for (const grade of CGC_GRADING_SCALE) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: cgcTable.id,
        key: `${grade.grade}_${grade.name}`,
        values: {
          grade: grade.grade,
          name: grade.name,
          label_color: grade.labelColor,
          description: grade.description,
          requirements: grade.requirements,
          multiplier: grade.priceMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${CGC_GRADING_SCALE.length} CGC grading scale entries`);

  // Pokemon Base Set Editions lookup table
  const pokemonEditionsTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Pokemon Base Set Editions',
    description: 'Critical edition identification for Pokemon Base Set (1st Ed, Shadowless, Unlimited)',
    keyField: 'edition',
    valueSchema: convertValueSchema({ identifier: 'string', years: 'string', characteristics: 'string', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(pokemonEditionsTable);

  // Populate Pokemon edition entries
  for (const edition of POKEMON_BASE_SET_EDITIONS) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: pokemonEditionsTable.id,
        key: edition.edition,
        values: {
          identifier: edition.identifier,
          years: edition.years,
          characteristics: edition.characteristics,
          rarity: edition.rarity,
          multiplier: edition.valueMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${POKEMON_BASE_SET_EDITIONS.length} Pokemon edition entries`);

  // Topps Chrome Parallels lookup table
  const toppsTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Topps Chrome Parallels',
    description: 'Topps Chrome refractor parallel hierarchy',
    keyField: 'parallel',
    valueSchema: convertValueSchema({ print_run: 'string', description: 'string', tier: 'number', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(toppsTable);

  // Populate Topps parallel entries
  for (const parallel of TOPPS_CHROME_PARALLELS) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: toppsTable.id,
        key: parallel.parallel,
        values: {
          print_run: parallel.printRun,
          description: parallel.description,
          tier: parallel.rarityTier,
          multiplier: parallel.valueMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${TOPPS_CHROME_PARALLELS.length} Topps Chrome parallel entries`);

  // Panini Prizm Parallels lookup table
  const paniniTable = lookupTableRepo.create({
    moduleId: module.id,
    name: 'Panini Prizm Parallels',
    description: 'Panini Prizm parallel hierarchy',
    keyField: 'parallel',
    valueSchema: convertValueSchema({ print_run: 'string', description: 'string', tier: 'number', multiplier: 'number' }),
    isActive: true,
  });
  await lookupTableRepo.save(paniniTable);

  // Populate Panini parallel entries
  for (const parallel of PANINI_PRIZM_PARALLELS) {
    await lookupEntryRepo.save(
      lookupEntryRepo.create({
        tableId: paniniTable.id,
        key: parallel.parallel,
        values: {
          print_run: parallel.printRun,
          description: parallel.description,
          tier: parallel.rarityTier,
          multiplier: parallel.valueMultiplier,
        },
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${PANINI_PRIZM_PARALLELS.length} Panini Prizm parallel entries`);

  // ----- Create Value Drivers -----
  for (const driver of TRADING_CARD_VALUE_DRIVERS) {
    await valueDriverRepo.save(
      valueDriverRepo.create({
        moduleId: module.id,
        name: driver.name,
        description: driver.description,
        attribute: driver.attribute,
        conditionType: mapConditionType(driver.conditionType),
        conditionValue: driver.conditionValue,
        caseSensitive: false,
        priceMultiplier: driver.priceMultiplier,
        priority: driver.priority,
        applicableBrands: (driver as { applicableTo?: string[] }).applicableTo || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${TRADING_CARD_VALUE_DRIVERS.length} value drivers`);

  // ----- Create Decoders -----
  for (const decoder of TRADING_CARD_DECODERS) {
    await decoderRepo.save(
      decoderRepo.create({
        moduleId: module.id,
        name: decoder.name,
        identifierType: decoder.identifierType,
        description: decoder.description,
        inputPattern: decoder.inputPattern,
        inputMaxLength: decoder.inputMaxLength,
        extractionRules: decoder.extractionRules as unknown as DecoderDefinition['extractionRules'],
        validationRules: ((decoder as { validationRules?: unknown[] }).validationRules || []) as DecoderDefinition['validationRules'],
        outputFields: decoder.outputFields as unknown as DecoderDefinition['outputFields'],
        baseConfidence: decoder.baseConfidence,
        priority: decoder.priority,
        testCases: decoder.testCases as unknown as DecoderDefinition['testCases'],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${TRADING_CARD_DECODERS.length} decoders`);

  // ----- Create Authenticity Markers -----
  for (const marker of TRADING_CARD_AUTHENTICITY_MARKERS) {
    const desc = (marker as { checkDescription?: string; description?: string }).checkDescription
              || (marker as { description?: string }).description
              || '';
    await markerRepo.save(
      markerRepo.create({
        moduleId: module.id,
        name: marker.name,
        checkDescription: desc,
        pattern: marker.pattern,
        patternMaxLength: (marker as { patternMaxLength?: number }).patternMaxLength || 50,
        importance: mapImportance(marker.importance),
        indicatesAuthentic: marker.indicatesAuthentic,
        applicableBrands: marker.applicableBrands || [],
        isActive: true,
      }),
    );
  }
  console.log(`  Created ${TRADING_CARD_AUTHENTICITY_MARKERS.length} authenticity markers`);

  return module.id;
}

async function publishModule(dataSource: DataSource, moduleId: string): Promise<void> {
  const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
  const lookupTableRepo = dataSource.getRepository(LookupTable);
  const lookupEntryRepo = dataSource.getRepository(LookupEntry);
  const valueDriverRepo = dataSource.getRepository(ValueDriverDefinition);
  const decoderRepo = dataSource.getRepository(DecoderDefinition);
  const markerRepo = dataSource.getRepository(AuthenticityMarkerDefinition);
  const versionRepo = dataSource.getRepository(DomainExpertiseVersion);

  // Load the module
  const module = await moduleRepo.findOne({ where: { id: moduleId } });
  if (!module) {
    throw new Error(`Module ${moduleId} not found`);
  }

  // Load all related entities
  const lookupTables = await lookupTableRepo.find({ where: { moduleId } });
  const valueDrivers = await valueDriverRepo.find({ where: { moduleId } });
  const decoders = await decoderRepo.find({ where: { moduleId } });
  const markers = await markerRepo.find({ where: { moduleId } });

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
    moduleId,
    version: 1,
    snapshot,
    changelog: 'Initial seed version',
    publishedBy: SYSTEM_USER_ID,
    isActive: true,
  });
  await versionRepo.save(version);

  // Update module status
  await moduleRepo.update(moduleId, {
    status: 'published',
    currentVersion: 1,
    publishedAt: new Date(),
    lastModifiedBy: SYSTEM_USER_ID,
  });

  console.log(`  Published module ${module.name} (version 1)`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log('Starting Domain Expertise seed...\n');

  let dataSource: DataSource | null = null;

  try {
    dataSource = await createDataSource();
    console.log('Connected to database\n');

    // Clear existing data before seeding
    const moduleRepo = dataSource.getRepository(DomainExpertiseModuleEntity);
    const existingModules = await moduleRepo.count();

    if (existingModules > 0) {
      console.log(`Found ${existingModules} existing modules. Clearing existing data...`);
      // Delete in order to respect foreign key constraints (versions, then modules)
      await dataSource.createQueryBuilder().delete().from(DomainExpertiseVersion).execute();
      await dataSource.createQueryBuilder().delete().from(AuthenticityMarkerDefinition).execute();
      await dataSource.createQueryBuilder().delete().from(DecoderDefinition).execute();
      await dataSource.createQueryBuilder().delete().from(ValueDriverDefinition).execute();
      await dataSource.createQueryBuilder().delete().from(LookupEntry).execute();
      await dataSource.createQueryBuilder().delete().from(LookupTable).execute();
      await dataSource.createQueryBuilder().delete().from(DomainExpertiseModuleEntity).execute();
      console.log('Existing data cleared.\n');
    }

    // Seed all modules
    const luxuryHandbagsId = await seedLuxuryHandbagsModule(dataSource);
    const watchesId = await seedWatchesModule(dataSource);
    const sneakersId = await seedSneakersModule(dataSource);
    const vintageDenimId = await seedVintageDenimModule(dataSource);
    const tradingCardsId = await seedTradingCardsModule(dataSource);

    // Publish all modules
    console.log('\nPublishing modules...');
    await publishModule(dataSource, luxuryHandbagsId);
    await publishModule(dataSource, watchesId);
    await publishModule(dataSource, sneakersId);
    await publishModule(dataSource, vintageDenimId);
    await publishModule(dataSource, tradingCardsId);

    console.log('\n✅ Domain Expertise seed complete!');
    console.log('Created and published 5 modules:');
    console.log('  - Luxury Handbags Authentication');
    console.log('  - Luxury Watches Reference Guide');
    console.log('  - Sneakers Authentication & Valuation');
    console.log('  - Vintage Denim Valuation');
    console.log('  - Trading Cards Grading & Valuation');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('\nDatabase connection closed.');
    }
  }
}

main();
