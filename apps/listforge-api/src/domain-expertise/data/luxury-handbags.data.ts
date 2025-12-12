/**
 * Luxury Handbags Domain Expertise Data
 *
 * Real-world accurate data for Louis Vuitton, Hermes, Chanel, and Gucci authentication and valuation.
 * Sources: Sotheby's, Fashionphile, Xupes, industry authentication guides
 */

// =============================================================================
// LOUIS VUITTON FACTORY CODES
// =============================================================================

export const LV_FACTORY_CODES: Record<string, { location: string; country: string; active: boolean; notes?: string }> = {
  // France - Primary Manufacturing
  A0: { location: 'France', country: 'France', active: true },
  A1: { location: 'France', country: 'France', active: true },
  A2: { location: 'France', country: 'France', active: true },
  AA: { location: 'France', country: 'France', active: true },
  AH: { location: 'France', country: 'France', active: true },
  AN: { location: 'France', country: 'France', active: true },
  AR: { location: 'France', country: 'France', active: true },
  AS: { location: 'France', country: 'France', active: true },
  BA: { location: 'France', country: 'France', active: true },
  BJ: { location: 'France', country: 'France', active: true },
  BU: { location: 'France', country: 'France', active: true },
  CT: { location: 'France', country: 'France', active: true },
  CV: { location: 'France', country: 'France', active: true },
  DR: { location: 'France', country: 'France', active: true },
  DU: { location: 'France', country: 'France', active: true },
  DT: { location: 'France', country: 'France', active: true },
  ET: { location: 'France', country: 'France', active: true },
  FL: { location: 'France', country: 'France', active: true },
  GI: { location: 'France', country: 'France', active: true },
  LA: { location: 'France', country: 'France', active: true },
  LM: { location: 'France', country: 'France', active: true },
  LW: { location: 'France', country: 'France', active: true },
  MB: { location: 'France', country: 'France', active: true },
  MI: { location: 'France', country: 'France', active: true },
  MS: { location: 'France', country: 'France', active: true },
  NO: { location: 'France', country: 'France', active: true },
  RA: { location: 'France', country: 'France', active: true },
  RI: { location: 'France', country: 'France', active: true },
  SF: { location: 'France', country: 'France', active: true },
  SL: { location: 'France', country: 'France', active: true },
  SN: { location: 'France', country: 'France', active: true },
  SP: { location: 'France', country: 'France', active: true },
  SR: { location: 'France', country: 'France', active: true },
  TH: { location: 'France', country: 'France', active: true },
  TJ: { location: 'France', country: 'France', active: true },
  TR: { location: 'France', country: 'France', active: true },
  TS: { location: 'France', country: 'France', active: true },
  VI: { location: 'France', country: 'France', active: true },
  VX: { location: 'France', country: 'France', active: true },
  // Spain
  'BC_ES': { location: 'Barcelona, Spain', country: 'Spain', active: true },
  CA: { location: 'Spain', country: 'Spain', active: true },
  GR: { location: 'Spain', country: 'Spain', active: true },
  LB: { location: 'Spain', country: 'Spain', active: true },
  LO: { location: 'Spain', country: 'Spain', active: true },
  'LW_ES': { location: 'Spain', country: 'Spain', active: true },
  'MA_ES': { location: 'Madrid, Spain', country: 'Spain', active: true },
  RC: { location: 'Spain', country: 'Spain', active: true },
  UB: { location: 'Spain', country: 'Spain', active: true },
  // USA (Discontinued - collectible)
  FC: { location: 'USA', country: 'USA', active: false, notes: 'Closed circa 2004' },
  FH: { location: 'USA', country: 'USA', active: false, notes: 'Closed circa 2004' },
  'LA_US': { location: 'Los Angeles, California', country: 'USA', active: false, notes: 'Closed early 2000s' },
  OS: { location: 'USA', country: 'USA', active: false, notes: 'Closed circa 2004' },
  SD: { location: 'San Dimas, California', country: 'USA', active: false, notes: 'Closed 1993, highly collectible' },
  // Italy
  'BC_IT': { location: 'Bologna, Italy', country: 'Italy', active: true },
  BO: { location: 'Italy', country: 'Italy', active: true },
  CE: { location: 'Italy', country: 'Italy', active: true },
  FN: { location: 'Italy', country: 'Italy', active: true },
  FO: { location: 'Italy', country: 'Italy', active: true },
  'MA_IT': { location: 'Milan, Italy', country: 'Italy', active: true },
  OB: { location: 'Italy', country: 'Italy', active: true },
  PL: { location: 'Italy', country: 'Italy', active: true },
  RE: { location: 'Italy', country: 'Italy', active: true },
  SA: { location: 'Italy', country: 'Italy', active: true },
  TD: { location: 'Italy', country: 'Italy', active: true },
  // Germany
  LP: { location: 'Germany', country: 'Germany', active: true },
  // Switzerland
  DI: { location: 'Switzerland', country: 'Switzerland', active: true },
  FA: { location: 'Switzerland', country: 'Switzerland', active: true },
};

// =============================================================================
// HERMES YEAR CODES (BLINDSTAMP)
// =============================================================================

export const HERMES_YEAR_CODES: Array<{ letter: string; year: number; cycle: number; format: string }> = [
  // Cycle 1 (1945-1970, no bracket) - Historical
  { letter: 'A', year: 1945, cycle: 0, format: 'none' },
  // ... earlier years omitted for brevity

  // Cycle 1 (1971-1996, no bracket)
  { letter: 'A', year: 1971, cycle: 1, format: 'none' },
  { letter: 'B', year: 1972, cycle: 1, format: 'none' },
  { letter: 'C', year: 1973, cycle: 1, format: 'none' },
  { letter: 'D', year: 1974, cycle: 1, format: 'none' },
  { letter: 'E', year: 1975, cycle: 1, format: 'none' },
  { letter: 'F', year: 1976, cycle: 1, format: 'none' },
  { letter: 'G', year: 1977, cycle: 1, format: 'none' },
  { letter: 'H', year: 1978, cycle: 1, format: 'none' },
  { letter: 'I', year: 1979, cycle: 1, format: 'none' },
  { letter: 'J', year: 1980, cycle: 1, format: 'none' },
  { letter: 'K', year: 1981, cycle: 1, format: 'none' },
  { letter: 'L', year: 1982, cycle: 1, format: 'none' },
  { letter: 'M', year: 1983, cycle: 1, format: 'none' },
  { letter: 'N', year: 1984, cycle: 1, format: 'none' },
  { letter: 'O', year: 1985, cycle: 1, format: 'none' },
  { letter: 'P', year: 1986, cycle: 1, format: 'none' },
  { letter: 'Q', year: 1987, cycle: 1, format: 'none' },
  { letter: 'R', year: 1988, cycle: 1, format: 'none' },
  { letter: 'S', year: 1989, cycle: 1, format: 'none' },
  { letter: 'T', year: 1990, cycle: 1, format: 'none' },
  { letter: 'U', year: 1991, cycle: 1, format: 'none' },
  { letter: 'V', year: 1992, cycle: 1, format: 'none' },
  { letter: 'W', year: 1993, cycle: 1, format: 'none' },
  { letter: 'X', year: 1994, cycle: 1, format: 'none' },
  { letter: 'Y', year: 1995, cycle: 1, format: 'none' },
  { letter: 'Z', year: 1996, cycle: 1, format: 'none' },
  // Cycle 2 (1997-2014, in circle ○)
  { letter: 'A', year: 1997, cycle: 2, format: 'circle' },
  { letter: 'B', year: 1998, cycle: 2, format: 'circle' },
  { letter: 'C', year: 1999, cycle: 2, format: 'circle' },
  { letter: 'D', year: 2000, cycle: 2, format: 'circle' },
  { letter: 'E', year: 2001, cycle: 2, format: 'circle' },
  { letter: 'F', year: 2002, cycle: 2, format: 'circle' },
  { letter: 'G', year: 2003, cycle: 2, format: 'circle' },
  { letter: 'H', year: 2004, cycle: 2, format: 'circle' },
  { letter: 'I', year: 2005, cycle: 2, format: 'circle' },
  { letter: 'J', year: 2006, cycle: 2, format: 'circle' },
  { letter: 'K', year: 2007, cycle: 2, format: 'circle' },
  { letter: 'L', year: 2008, cycle: 2, format: 'circle' },
  { letter: 'M', year: 2009, cycle: 2, format: 'circle' },
  { letter: 'N', year: 2010, cycle: 2, format: 'circle' },
  { letter: 'O', year: 2011, cycle: 2, format: 'circle' },
  { letter: 'P', year: 2012, cycle: 2, format: 'circle' },
  { letter: 'Q', year: 2013, cycle: 2, format: 'circle' },
  { letter: 'R', year: 2014, cycle: 2, format: 'circle' },
  // Cycle 3 (2015+, in square □)
  { letter: 'T', year: 2015, cycle: 3, format: 'square' },
  { letter: 'X', year: 2016, cycle: 3, format: 'square' },
  { letter: 'A', year: 2017, cycle: 3, format: 'square' },
  { letter: 'C', year: 2018, cycle: 3, format: 'square' },
  { letter: 'D', year: 2019, cycle: 3, format: 'square' },
  { letter: 'Y', year: 2020, cycle: 3, format: 'square' },
  { letter: 'Z', year: 2021, cycle: 3, format: 'square' },
  { letter: 'U', year: 2022, cycle: 3, format: 'square' },
  { letter: 'B', year: 2023, cycle: 3, format: 'square' },
  { letter: 'E', year: 2024, cycle: 3, format: 'square' },
  { letter: 'O', year: 2025, cycle: 3, format: 'square' },
];

// =============================================================================
// CHANEL SERIAL NUMBER ERAS
// =============================================================================

export const CHANEL_SERIAL_ERAS: Array<{
  startYear: number;
  endYear: number;
  digitCount: number;
  startsWith: string;
  format: string;
  notes: string;
}> = [
  { startYear: 1984, endYear: 1986, digitCount: 6, startsWith: '0', format: 'numeric', notes: 'First serial numbers, 0XXXXX format' },
  { startYear: 1986, endYear: 1988, digitCount: 7, startsWith: '1', format: 'numeric', notes: '1XXXXXX format' },
  { startYear: 1988, endYear: 1990, digitCount: 7, startsWith: '2', format: 'numeric', notes: '2XXXXXX format' },
  { startYear: 1990, endYear: 1992, digitCount: 7, startsWith: '3', format: 'numeric', notes: '3XXXXXX format' },
  { startYear: 1992, endYear: 1994, digitCount: 7, startsWith: '4', format: 'numeric', notes: '4XXXXXX format' },
  { startYear: 1994, endYear: 1996, digitCount: 7, startsWith: '5', format: 'numeric', notes: '5XXXXXX format' },
  { startYear: 1996, endYear: 1997, digitCount: 7, startsWith: '6', format: 'numeric', notes: '6XXXXXX format' },
  { startYear: 1997, endYear: 1999, digitCount: 7, startsWith: '7', format: 'numeric', notes: 'Hologram stickers introduced' },
  { startYear: 2000, endYear: 2002, digitCount: 7, startsWith: '6', format: 'numeric', notes: '6XXXXXX format (series reset)' },
  { startYear: 2003, endYear: 2004, digitCount: 7, startsWith: '8', format: 'numeric', notes: '8XXXXXX format' },
  { startYear: 2004, endYear: 2005, digitCount: 7, startsWith: '9', format: 'numeric', notes: '9XXXXXX format, last 7-digit era' },
  { startYear: 2005, endYear: 2006, digitCount: 8, startsWith: '10', format: 'numeric', notes: 'Transition to 8-digit' },
  { startYear: 2006, endYear: 2008, digitCount: 8, startsWith: '11-12', format: 'numeric', notes: '11XXXXXX-12XXXXXX' },
  { startYear: 2008, endYear: 2010, digitCount: 8, startsWith: '13-14', format: 'numeric', notes: '13XXXXXX-14XXXXXX' },
  { startYear: 2010, endYear: 2012, digitCount: 8, startsWith: '15-16', format: 'numeric', notes: '15XXXXXX-16XXXXXX' },
  { startYear: 2012, endYear: 2014, digitCount: 8, startsWith: '17-19', format: 'numeric', notes: '17XXXXXX-19XXXXXX' },
  { startYear: 2014, endYear: 2016, digitCount: 8, startsWith: '20-22', format: 'numeric', notes: '20XXXXXX-22XXXXXX' },
  { startYear: 2016, endYear: 2018, digitCount: 8, startsWith: '23-25', format: 'numeric', notes: '23XXXXXX-25XXXXXX' },
  { startYear: 2018, endYear: 2020, digitCount: 8, startsWith: '26-29', format: 'numeric', notes: '26XXXXXX-29XXXXXX' },
  { startYear: 2020, endYear: 2021, digitCount: 8, startsWith: '30-32', format: 'numeric', notes: 'Last sticker era' },
  { startYear: 2021, endYear: 9999, digitCount: 8, startsWith: '', format: 'microchip', notes: 'NFC microchip with alphanumeric code' },
];

// =============================================================================
// HERMES VALUE DRIVERS (Colors, Materials, Limited Editions)
// =============================================================================

export const HERMES_RARE_COLORS: string[] = [
  // Ultra-Rare / Discontinued
  'Rose Sakura',
  'Blue Electrique',
  'Bambou',
  'Bleu Paon',
  'Rose Tyrien',
  'Rose Jaipur',
  'Rose Lipstick',
  'Gris Perle',
  'Gris Tourterelle',
  'Vert Criquet',
  'Vert Cypress',
  'Rose Confetti',
  'Blue Atoll',
  'Blue Izmir',
  'Rose Extreme',
  'Lime',
  'Kiwi',
  'Malachite',
  'Turquoise',
];

export const HERMES_PREMIUM_LEATHERS: string[] = [
  'Himalaya', // Niloticus crocodile with gradient effect - MOST VALUABLE
  'Niloticus Crocodile',
  'Porosus Crocodile',
  'Alligator Mississippiensis',
  'Ostrich',
  'Lizard',
  'Veau Doblis', // Suede calfskin
  'Barenia', // Saddle leather
  'Box Calf', // Vintage leather, highly sought after
  'Chevre', // Goatskin
  'Swift',
  'Epsom',
  'Togo',
  'Clemence',
];

export const HERMES_LIMITED_EDITIONS: string[] = [
  'Birkin Faubourg',
  'Shadow Birkin',
  'Birkin Picnic',
  'Cargo Birkin',
  'So Black Birkin',
  'Touch Birkin',
  'Birkin Sellier',
  'Kelly Doll',
  'Kelly Pochette',
  'Kelly Cut',
  'Constance Mini',
  'Constance To Go',
];

// =============================================================================
// GUCCI STYLE CODE PREFIXES
// =============================================================================

export const GUCCI_STYLE_PREFIXES: Record<string, string> = {
  '449': 'GG Supreme Canvas',
  '456': 'Marmont Collection',
  '474': 'Dionysus Collection',
  '476': 'GG Canvas',
  '523': 'Ophidia Collection',
  '524': 'Rajah Collection',
  '547': 'Jackie Collection',
  '575': 'Horsebit Collection',
  '602': 'Small Leather Goods',
  '625': 'Classic GG',
  '658': 'Bamboo Collection',
  '699': 'Flora Collection',
};

// =============================================================================
// LUXURY HANDBAGS VALUE DRIVERS
// =============================================================================

export const HANDBAG_VALUE_DRIVERS = [
  // Hermes-specific
  {
    name: 'Himalaya Leather',
    description: 'Himalaya crocodile - the most valuable Hermes leather, featuring a gradient effect',
    attribute: 'material',
    conditionType: 'contains' as const,
    conditionValue: 'himalaya',
    caseSensitive: false,
    priceMultiplier: 10.0,
    priority: 100,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Exotic Crocodile/Alligator',
    description: 'Niloticus or Porosus crocodile, Alligator Mississippiensis',
    attribute: 'material',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'croc|crocodile|alligator|niloticus|porosus', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 4.0,
    priority: 95,
    applicableBrands: ['Hermes', 'Louis Vuitton', 'Chanel'],
  },
  {
    name: 'Ostrich Leather',
    description: 'Ostrich leather with distinctive quill pattern',
    attribute: 'material',
    conditionType: 'contains' as const,
    conditionValue: 'ostrich',
    caseSensitive: false,
    priceMultiplier: 2.5,
    priority: 90,
    applicableBrands: ['Hermes', 'Louis Vuitton', 'Chanel'],
  },
  {
    name: 'Rare Hermes Color',
    description: 'Discontinued or limited edition Hermes colors',
    attribute: 'color',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'rose sakura|blue electrique|bambou|bleu paon|rose tyrien|vert criquet', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 1.8,
    priority: 85,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Hermes Sellier Construction',
    description: 'Structured Sellier construction (vs Retourne soft)',
    attribute: 'style',
    conditionType: 'contains' as const,
    conditionValue: 'sellier',
    caseSensitive: false,
    priceMultiplier: 1.2,
    priority: 75,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Palladium Hardware',
    description: 'Palladium (silver-tone) hardware - more durable than gold',
    attribute: 'hardware',
    conditionType: 'contains' as const,
    conditionValue: 'palladium',
    caseSensitive: false,
    priceMultiplier: 1.1,
    priority: 70,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Rose Gold Hardware',
    description: 'Rose gold hardware - limited availability',
    attribute: 'hardware',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'rose gold|rghw', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 1.15,
    priority: 72,
    applicableBrands: ['Hermes', 'Chanel'],
  },
  // Chanel-specific
  {
    name: 'Chanel Vintage (Pre-1990)',
    description: 'Vintage Chanel from the Karl Lagerfeld early era',
    attribute: 'era',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'vintage|198\\d|early.*1990', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 2.0,
    priority: 88,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel Caviar Leather',
    description: 'Durable pebbled caviar leather',
    attribute: 'material',
    conditionType: 'contains' as const,
    conditionValue: 'caviar',
    caseSensitive: false,
    priceMultiplier: 1.15,
    priority: 65,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel Lambskin',
    description: 'Soft lambskin leather - classic but delicate',
    attribute: 'material',
    conditionType: 'contains' as const,
    conditionValue: 'lambskin',
    caseSensitive: false,
    priceMultiplier: 1.0,
    priority: 60,
    applicableBrands: ['Chanel'],
  },
  // Louis Vuitton-specific
  {
    name: 'LV Made in USA',
    description: 'Vintage LV made in USA factories (discontinued)',
    attribute: 'origin',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'made in usa|sd\\d{4}|fc\\d{4}|fh\\d{4}', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 1.5,
    priority: 80,
    applicableBrands: ['Louis Vuitton'],
  },
  {
    name: 'LV Limited Edition Collaboration',
    description: 'Limited collaboration (Supreme, Takashi Murakami, Jeff Koons, etc.)',
    attribute: 'collection',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'supreme|murakami|koons|yayoi kusama|virgil|pharrell', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 3.0,
    priority: 92,
    applicableBrands: ['Louis Vuitton'],
  },
  // General
  {
    name: 'Full Set with Box/Dustbag',
    description: 'Complete with original box, dustbag, receipt/card',
    attribute: 'completeness',
    conditionType: 'regex' as const,
    conditionValue: { pattern: 'full set|complete|box.*dustbag|dustbag.*box|original packaging', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 1.25,
    priority: 60,
    applicableBrands: [],
  },
  {
    name: 'Mini/Micro Size',
    description: 'Mini or micro size variants (highly sought after)',
    attribute: 'size',
    conditionType: 'regex' as const,
    conditionValue: { pattern: '\\bmini\\b|\\bmicro\\b|\\bnano\\b|kelly 20|birkin 25|chanel 17', flags: 'i' },
    caseSensitive: false,
    priceMultiplier: 1.3,
    priority: 75,
    applicableBrands: [],
  },
];

// =============================================================================
// LUXURY HANDBAGS AUTHENTICITY MARKERS
// =============================================================================

export const HANDBAG_AUTHENTICITY_MARKERS = [
  // Louis Vuitton
  {
    name: 'LV Date Code Format (Pre-2007)',
    checkDescription: 'Date code: 2 letters (factory) + 3-4 digits (week/year interleaved). Example: SD0054 = San Dimas, week 05, 2004',
    pattern: '^[A-Z]{2}\\d{3,4}$',
    patternMaxLength: 10,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Louis Vuitton'],
  },
  {
    name: 'LV Date Code Format (2007+)',
    checkDescription: 'Date code: 2 letters + 4 digits with week/year interleaved. Example: SD1024 = San Dimas, week 14, 2002',
    pattern: '^[A-Z]{2}\\d{4}$',
    patternMaxLength: 10,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Louis Vuitton'],
  },
  {
    name: 'LV Valid Factory Code',
    checkDescription: 'First 2 letters must be a known LV factory code (see factory code lookup)',
    pattern: null,
    patternMaxLength: 50,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Louis Vuitton'],
  },
  {
    name: 'LV Heat Stamp Quality',
    checkDescription: 'Heat stamp should be clean, even depth, proper LV font. No bleeding, consistent spacing.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Louis Vuitton'],
  },
  {
    name: 'LV Canvas Alignment',
    checkDescription: 'LV monogram canvas should align at seams. Pattern should be symmetrical on front/back.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Louis Vuitton'],
  },
  // Hermes
  {
    name: 'Hermes Blindstamp Format',
    checkDescription: 'Single letter year stamp. Pre-1997: no enclosure. 1997-2014: in circle. 2015+: in square.',
    pattern: '^[A-Z]$',
    patternMaxLength: 5,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Hermes Craftsman Stamp',
    checkDescription: 'Should have unique craftsman/artisan stamp. Each bag made by single artisan.',
    pattern: null,
    patternMaxLength: 50,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Hermes Sangles Closure',
    checkDescription: 'Sangles (straps) should have consistent stitching, proper tension, correct hardware.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Hermes'],
  },
  {
    name: 'Hermes Pearling',
    checkDescription: 'Check pearling (edge stitching) - should be tight, evenly spaced, no fraying.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Hermes'],
  },
  // Chanel
  {
    name: 'Chanel Serial Sticker (Pre-2021)',
    checkDescription: 'Hologram sticker with serial number. Gold speckles, "X" pattern in tape, CC logos on border.',
    pattern: '^\\d{6,8}$',
    patternMaxLength: 15,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel Microchip (2021+)',
    checkDescription: 'NFC-enabled metal plaque with 8-character alphanumeric code. Scannable with Chanel app.',
    pattern: '^[A-Z0-9]{8}$',
    patternMaxLength: 10,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel CC Turn Lock',
    checkDescription: 'CC lock should be crisp, well-defined edges. Letters should not touch. Correct proportions.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel Quilting Pattern',
    checkDescription: 'Diamond quilting should be consistent size, evenly spaced. Puffy, not flat.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Chanel'],
  },
  {
    name: 'Chanel Chain Strap',
    checkDescription: 'Chain links should be heavy, substantial. Leather woven smoothly. No kinks.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'helpful' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Chanel'],
  },
  // Gucci
  {
    name: 'Gucci Serial Tag Format',
    checkDescription: 'Two rows of numbers on leather tag. Top: 6-digit style number. Bottom: 4-6 digit supplier code. NO LETTERS.',
    pattern: '^\\d{5,7}[\\s\\.]?\\d{4,6}$',
    patternMaxLength: 20,
    importance: 'critical' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Gucci'],
  },
  {
    name: 'Gucci QR Code (2016+)',
    checkDescription: 'Small black fabric tag with QR code. Only readable via official Gucci app.',
    pattern: null,
    patternMaxLength: 50,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Gucci'],
  },
  {
    name: 'Gucci Made in Italy Tag',
    checkDescription: 'Rectangular leather tag with "GUCCI" and "made in Italy" in lowercase. Centered, clear font.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'important' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Gucci'],
  },
  {
    name: 'Gucci Controllato Card',
    checkDescription: 'Small card stating item passed quality control. Should match era of bag.',
    pattern: null,
    patternMaxLength: 100,
    importance: 'helpful' as const,
    indicatesAuthentic: true,
    applicableBrands: ['Gucci'],
  },
];

// =============================================================================
// DECODER DEFINITIONS
// =============================================================================

export const HANDBAG_DECODERS = [
  {
    name: 'Louis Vuitton Date Code Decoder',
    identifierType: 'date_code',
    description: 'Decodes LV date codes to factory location and manufacturing date',
    inputPattern: '^[A-Z]{2}\\d{4}$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Factory Code',
        pattern: '^([A-Z]{2})',
        method: 'factory_lookup',
      },
      {
        name: 'Date Extraction (2007+)',
        pattern: '(\\d)(\\d)(\\d)(\\d)$',
        method: 'new_date_format',
      },
    ],
    outputFields: ['factory', 'country', 'week', 'year'],
    baseConfidence: 0.9,
    priority: 100,
    testCases: [
      {
        input: 'SD1234',
        expected: { factory: 'San Dimas', country: 'USA', week: 13, year: 2024 },
      },
    ],
  },
  {
    name: 'Hermes Blindstamp Decoder',
    identifierType: 'blindstamp',
    description: 'Decodes Hermes blindstamp letters to manufacturing year',
    inputPattern: '^[A-Z]$',
    inputMaxLength: 1,
    extractionRules: [
      {
        name: 'Year Lookup',
        pattern: '^([A-Z])$',
        method: 'hermes_year_lookup',
      },
    ],
    outputFields: ['year', 'cycle'],
    baseConfidence: 0.95,
    priority: 100,
    testCases: [
      {
        input: 'A',
        expected: { year: 1971, cycle: 1 },
      },
      {
        input: 'Y',
        expected: { year: 2020, cycle: 2 },
      },
    ],
  },
  {
    name: 'Chanel Serial Number Decoder',
    identifierType: 'serial_number',
    description: 'Decodes Chanel serial numbers to production era',
    inputPattern: '^\\d{6,8}$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Era Detection',
        pattern: '^(\\d+)$',
        method: 'chanel_era_lookup',
      },
    ],
    outputFields: ['era', 'year_range', 'format'],
    baseConfidence: 0.85,
    priority: 90,
    testCases: [
      {
        input: '12345678',
        expected: { era: '8-digit', year_range: '2005-2020' },
      },
    ],
  },
];

// =============================================================================
// LOOKUP TABLE DEFINITIONS
// =============================================================================

export const HANDBAG_LOOKUP_TABLES = {
  lv_factory_codes: {
    name: 'Louis Vuitton Factory Codes',
    description: 'Maps 2-letter factory codes to location and country',
    keyField: 'code',
    valueSchema: { location: 'string', country: 'string', active: 'boolean' },
  },
  hermes_year_codes: {
    name: 'Hermes Year Codes',
    description: 'Maps blindstamp letters to manufacturing year',
    keyField: 'letter',
    valueSchema: { year: 'number', cycle: 'number' },
  },
  chanel_serial_eras: {
    name: 'Chanel Serial Number Eras',
    description: 'Maps serial number digit count to production era',
    keyField: 'digits',
    valueSchema: { year_range: 'string', format: 'string' },
  },
};
