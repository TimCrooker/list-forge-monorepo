/**
 * Domain Knowledge Database - Slice 9
 *
 * Contains lookup tables for:
 * - Louis Vuitton factory codes
 * - Hermes year codes (blindstamp)
 * - Rolex reference numbers
 * - Value drivers across categories
 * - Authenticity markers
 *
 * This data enables programmatic decoding of category-specific identifiers
 * that expert resellers would decode manually.
 */

import type { CategoryId, ValueDriver, AuthenticityMarkerDef } from '@listforge/core-types';

// =============================================================================
// LOUIS VUITTON FACTORY CODES
// Format: Two-letter code -> factory location information
// =============================================================================

export interface LVFactoryInfo {
  code: string;
  location: string;
  country: string;
  active: boolean;
}

/**
 * Louis Vuitton factory codes
 * Source: Various authentication guides and LV collector resources
 */
export const LV_FACTORY_CODES: Record<string, LVFactoryInfo> = {
  // France
  AR: { code: 'AR', location: 'France', country: 'France', active: true },
  AS: { code: 'AS', location: 'France', country: 'France', active: true },
  AN: { code: 'AN', location: 'France', country: 'France', active: true },
  AO: { code: 'AO', location: 'France', country: 'France', active: true },
  AA: { code: 'AA', location: 'France', country: 'France', active: true },
  BA: { code: 'BA', location: 'France', country: 'France', active: true },
  BJ: { code: 'BJ', location: 'France', country: 'France', active: true },
  BU: { code: 'BU', location: 'France', country: 'France', active: true },
  CT: { code: 'CT', location: 'France', country: 'France', active: true },
  DK: { code: 'DK', location: 'France', country: 'France', active: true },
  DR: { code: 'DR', location: 'France', country: 'France', active: true },
  DU: { code: 'DU', location: 'France', country: 'France', active: true },
  ET: { code: 'ET', location: 'France', country: 'France', active: true },
  FL: { code: 'FL', location: 'France', country: 'France', active: true },
  GI: { code: 'GI', location: 'France', country: 'France', active: true },
  LA: { code: 'LA', location: 'France', country: 'France', active: true },
  LM: { code: 'LM', location: 'France', country: 'France', active: true },
  LW: { code: 'LW', location: 'France', country: 'France', active: true },
  MB: { code: 'MB', location: 'France', country: 'France', active: true },
  MI: { code: 'MI', location: 'France', country: 'France', active: true },
  MS: { code: 'MS', location: 'France', country: 'France', active: true },
  NO: { code: 'NO', location: 'France', country: 'France', active: true },
  RA: { code: 'RA', location: 'France', country: 'France', active: true },
  RI: { code: 'RI', location: 'France', country: 'France', active: true },
  SF: { code: 'SF', location: 'France', country: 'France', active: true },
  SL: { code: 'SL', location: 'France', country: 'France', active: true },
  SN: { code: 'SN', location: 'France', country: 'France', active: true },
  SP: { code: 'SP', location: 'France', country: 'France', active: true },
  SR: { code: 'SR', location: 'France', country: 'France', active: true },
  TH: { code: 'TH', location: 'France', country: 'France', active: true },
  TJ: { code: 'TJ', location: 'France', country: 'France', active: true },
  TR: { code: 'TR', location: 'France', country: 'France', active: true },
  TS: { code: 'TS', location: 'France', country: 'France', active: true },
  VI: { code: 'VI', location: 'France', country: 'France', active: true },
  VX: { code: 'VX', location: 'France', country: 'France', active: true },

  // Spain
  CA: { code: 'CA', location: 'Spain', country: 'Spain', active: true },
  LO: { code: 'LO', location: 'Spain', country: 'Spain', active: true },
  LB: { code: 'LB', location: 'Spain', country: 'Spain', active: true },
  MA: { code: 'MA', location: 'Spain', country: 'Spain', active: true },
  RC: { code: 'RC', location: 'Spain', country: 'Spain', active: true },
  UB: { code: 'UB', location: 'Spain', country: 'Spain', active: true },

  // USA
  SD: { code: 'SD', location: 'San Dimas, California', country: 'USA', active: false },
  FC: { code: 'FC', location: 'USA', country: 'USA', active: false },
  FH: { code: 'FH', location: 'USA', country: 'USA', active: false },
  OS: { code: 'OS', location: 'USA', country: 'USA', active: false },

  // Italy
  CE: { code: 'CE', location: 'Italy', country: 'Italy', active: true },
  SA: { code: 'SA', location: 'Italy', country: 'Italy', active: true },
  FO: { code: 'FO', location: 'Italy', country: 'Italy', active: true },
  RE: { code: 'RE', location: 'Italy', country: 'Italy', active: true },
  TD: { code: 'TD', location: 'Italy', country: 'Italy', active: true },

  // Germany
  LP: { code: 'LP', location: 'Germany', country: 'Germany', active: true },

  // Switzerland
  FA: { code: 'FA', location: 'Switzerland', country: 'Switzerland', active: true },
  DI: { code: 'DI', location: 'Switzerland', country: 'Switzerland', active: true },
};

// =============================================================================
// HERMES YEAR CODES (BLINDSTAMP)
// Single letter indicates year, cycles every 26 years
// =============================================================================

/**
 * Hermes blindstamp year codes
 * Cycle 1: 1971-1996 (no bracket/square)
 * Cycle 2: 1997-2014 (in circle) - same letters
 * Cycle 3: 2015+ (in square) - new system
 *
 * Note: Post-2014, Hermes uses squares and the letter sequence restarted
 */
export const HERMES_YEAR_CODES_CYCLE1: Record<string, number> = {
  A: 1971, B: 1972, C: 1973, D: 1974, E: 1975, F: 1976, G: 1977, H: 1978,
  I: 1979, J: 1980, K: 1981, L: 1982, M: 1983, N: 1984, O: 1985, P: 1986,
  Q: 1987, R: 1988, S: 1989, T: 1990, U: 1991, V: 1992, W: 1993, X: 1994,
  Y: 1995, Z: 1996,
};

/**
 * Hermes blindstamp cycle 2 (1997-2014, in circle)
 * Same letters but offset by 26 years
 */
export const HERMES_YEAR_CODES_CYCLE2: Record<string, number> = {
  A: 1997, B: 1998, C: 1999, D: 2000, E: 2001, F: 2002, G: 2003, H: 2004,
  I: 2005, J: 2006, K: 2007, L: 2008, M: 2009, N: 2010, O: 2011, P: 2012,
  Q: 2013, R: 2014,
};

/**
 * Hermes blindstamp cycle 3 (2015+, in square)
 * New letter system with square brackets
 */
export const HERMES_YEAR_CODES_CYCLE3: Record<string, number> = {
  T: 2015, X: 2016, A: 2017, C: 2018, D: 2019, Y: 2020, Z: 2021, U: 2022,
  B: 2023, E: 2024, O: 2025,
};

// =============================================================================
// ROLEX REFERENCE NUMBERS
// Maps reference numbers to model information
// =============================================================================

export interface RolexReferenceInfo {
  referenceNumber: string;
  modelFamily: string;
  modelName: string;
  material?: string;
  movement?: string;
  diameter?: string;
  discontinued?: boolean;
  notes?: string;
}

/**
 * Rolex reference number database
 * Popular references with model information
 */
export const ROLEX_REFERENCES: Record<string, RolexReferenceInfo> = {
  // Submariner
  '116610LN': {
    referenceNumber: '116610LN',
    modelFamily: 'Submariner',
    modelName: 'Submariner Date',
    material: 'Stainless Steel',
    diameter: '40mm',
    discontinued: true,
    notes: 'Replaced by 126610LN',
  },
  '116610LV': {
    referenceNumber: '116610LV',
    modelFamily: 'Submariner',
    modelName: 'Submariner Date (Hulk)',
    material: 'Stainless Steel',
    diameter: '40mm',
    discontinued: true,
    notes: 'Green dial and bezel, highly collectible',
  },
  '126610LN': {
    referenceNumber: '126610LN',
    modelFamily: 'Submariner',
    modelName: 'Submariner Date',
    material: 'Stainless Steel',
    diameter: '41mm',
  },
  '126610LV': {
    referenceNumber: '126610LV',
    modelFamily: 'Submariner',
    modelName: 'Submariner Date (Starbucks)',
    material: 'Stainless Steel',
    diameter: '41mm',
    notes: 'Black dial with green bezel',
  },
  '114060': {
    referenceNumber: '114060',
    modelFamily: 'Submariner',
    modelName: 'Submariner No Date',
    material: 'Stainless Steel',
    diameter: '40mm',
    discontinued: true,
  },
  '124060': {
    referenceNumber: '124060',
    modelFamily: 'Submariner',
    modelName: 'Submariner No Date',
    material: 'Stainless Steel',
    diameter: '41mm',
  },

  // GMT-Master II
  '126710BLRO': {
    referenceNumber: '126710BLRO',
    modelFamily: 'GMT-Master II',
    modelName: 'GMT-Master II (Pepsi)',
    material: 'Stainless Steel',
    diameter: '40mm',
    notes: 'Blue/red bezel on Jubilee bracelet',
  },
  '126710BLNR': {
    referenceNumber: '126710BLNR',
    modelFamily: 'GMT-Master II',
    modelName: 'GMT-Master II (Batman)',
    material: 'Stainless Steel',
    diameter: '40mm',
    notes: 'Blue/black bezel',
  },
  '116710LN': {
    referenceNumber: '116710LN',
    modelFamily: 'GMT-Master II',
    modelName: 'GMT-Master II',
    material: 'Stainless Steel',
    diameter: '40mm',
    discontinued: true,
    notes: 'All-black ceramic bezel',
  },

  // Daytona
  '116500LN': {
    referenceNumber: '116500LN',
    modelFamily: 'Daytona',
    modelName: 'Cosmograph Daytona',
    material: 'Stainless Steel',
    diameter: '40mm',
    notes: 'Ceramic bezel, Panda/reverse Panda available',
  },
  '116520': {
    referenceNumber: '116520',
    modelFamily: 'Daytona',
    modelName: 'Cosmograph Daytona',
    material: 'Stainless Steel',
    diameter: '40mm',
    discontinued: true,
    notes: 'Steel bezel, highly collectible',
  },

  // Datejust
  '126334': {
    referenceNumber: '126334',
    modelFamily: 'Datejust',
    modelName: 'Datejust 41',
    material: 'Stainless Steel/White Gold',
    diameter: '41mm',
  },
  '126234': {
    referenceNumber: '126234',
    modelFamily: 'Datejust',
    modelName: 'Datejust 36',
    material: 'Stainless Steel/White Gold',
    diameter: '36mm',
  },

  // Day-Date
  '228239': {
    referenceNumber: '228239',
    modelFamily: 'Day-Date',
    modelName: 'Day-Date 40',
    material: 'White Gold',
    diameter: '40mm',
  },
  '228238': {
    referenceNumber: '228238',
    modelFamily: 'Day-Date',
    modelName: 'Day-Date 40',
    material: 'Yellow Gold',
    diameter: '40mm',
  },

  // Explorer
  '124270': {
    referenceNumber: '124270',
    modelFamily: 'Explorer',
    modelName: 'Explorer',
    material: 'Stainless Steel',
    diameter: '36mm',
  },
  '226570': {
    referenceNumber: '226570',
    modelFamily: 'Explorer II',
    modelName: 'Explorer II',
    material: 'Stainless Steel',
    diameter: '42mm',
  },

  // Yacht-Master
  '126622': {
    referenceNumber: '126622',
    modelFamily: 'Yacht-Master',
    modelName: 'Yacht-Master 40',
    material: 'Stainless Steel/Platinum',
    diameter: '40mm',
  },
};

// =============================================================================
// VALUE DRIVERS
// Price-affecting attributes for specific categories
// =============================================================================

/**
 * Value drivers across all supported categories
 * These represent attributes that significantly increase value
 */
export const VALUE_DRIVERS: ValueDriver[] = [
  // Vintage Denim
  {
    id: 'levis_big_e',
    name: 'Big E Label',
    attribute: 'label_type',
    categoryId: 'vintage_denim',
    applicableBrands: ["Levi's", 'Levis'],
    description: 'Pre-1971 Levi\'s with capital "E" in LEVI\'S logo',
    checkCondition: 'text contains "LEVI\'S" with capital E (not lowercase e)',
    priceMultiplier: 5.0,
    priority: 100,
  },
  {
    id: 'selvedge_denim',
    name: 'Selvedge Denim',
    attribute: 'fabric_type',
    categoryId: 'vintage_denim',
    description: 'Self-edge denim woven on traditional shuttle looms',
    checkCondition: 'visible red/white selvedge line on outseam or cuff',
    priceMultiplier: 2.5,
    priority: 90,
  },
  {
    id: 'made_in_usa_denim',
    name: 'Made in USA',
    attribute: 'country_of_origin',
    categoryId: 'vintage_denim',
    description: 'Vintage denim made in USA (pre-offshore manufacturing)',
    checkCondition: 'label shows "Made in USA" or "Made in U.S.A."',
    priceMultiplier: 1.8,
    priority: 80,
  },

  // Luxury Handbags
  {
    id: 'lv_exotic_leather',
    name: 'Exotic Leather',
    attribute: 'material',
    categoryId: 'luxury_handbags',
    applicableBrands: ['Louis Vuitton', 'Hermes', 'Chanel', 'Gucci'],
    description: 'Exotic leather (python, crocodile, ostrich, alligator)',
    checkCondition: 'material is python, croc, crocodile, ostrich, alligator, lizard',
    priceMultiplier: 3.0,
    priority: 100,
  },
  {
    id: 'hermes_rare_color',
    name: 'Rare Hermes Color',
    attribute: 'color',
    categoryId: 'luxury_handbags',
    applicableBrands: ['Hermes'],
    description: 'Rare/discontinued Hermes colors command premium',
    checkCondition: 'color is rose sakura, blue electrique, bambou, or other rare colorway',
    priceMultiplier: 1.5,
    priority: 85,
  },
  {
    id: 'hermes_phw',
    name: 'Palladium Hardware',
    attribute: 'hardware',
    categoryId: 'luxury_handbags',
    applicableBrands: ['Hermes'],
    description: 'Palladium (silver-tone) hardware vs gold',
    checkCondition: 'hardware is palladium or PHW',
    priceMultiplier: 1.15,
    priority: 70,
  },

  // Sneakers
  {
    id: 'og_release',
    name: 'OG Release',
    attribute: 'edition',
    categoryId: 'sneakers',
    description: 'Original release version (not retro/reissue)',
    checkCondition: 'release is "OG" or original 19XX release',
    priceMultiplier: 2.0,
    priority: 100,
  },
  {
    id: 'limited_collab',
    name: 'Limited Collaboration',
    attribute: 'edition',
    categoryId: 'sneakers',
    description: 'Limited collaboration with designer/celebrity',
    checkCondition: 'collaboration with Off-White, Travis Scott, Union, Sacai, etc.',
    priceMultiplier: 2.5,
    priority: 95,
  },
  {
    id: 'deadstock',
    name: 'Deadstock',
    attribute: 'condition',
    categoryId: 'sneakers',
    description: 'Never worn, original box and tags',
    checkCondition: 'condition is deadstock, DS, or BNIB with tags',
    priceMultiplier: 1.5,
    priority: 80,
  },

  // Watches
  {
    id: 'discontinued_reference',
    name: 'Discontinued Reference',
    attribute: 'model',
    categoryId: 'watches',
    description: 'Watch reference number that is discontinued',
    checkCondition: 'reference number is flagged as discontinued in database',
    priceMultiplier: 1.4,
    priority: 90,
  },
  {
    id: 'full_set',
    name: 'Full Set (Box & Papers)',
    attribute: 'completeness',
    categoryId: 'watches',
    description: 'Complete with original box, papers, warranty card',
    checkCondition: 'includes box AND papers/warranty card',
    priceMultiplier: 1.25,
    priority: 85,
  },
  {
    id: 'rare_dial',
    name: 'Rare Dial',
    attribute: 'dial',
    categoryId: 'watches',
    description: 'Rare dial variant (tropical, MOP, meteorite)',
    checkCondition: 'dial is tropical, mother of pearl, meteorite, or other rare variant',
    priceMultiplier: 1.5,
    priority: 80,
  },

  // Trading Cards
  {
    id: 'psa_10',
    name: 'PSA 10 Grade',
    attribute: 'grade',
    categoryId: 'trading_cards',
    description: 'PSA Gem Mint 10 grade',
    checkCondition: 'grade is PSA 10 or BGS 10 (Black Label)',
    priceMultiplier: 3.0,
    priority: 100,
  },
  {
    id: 'first_edition',
    name: '1st Edition',
    attribute: 'edition',
    categoryId: 'trading_cards',
    description: 'First edition/print run of card',
    checkCondition: '1st Edition stamp or first print run indicator',
    priceMultiplier: 4.0,
    priority: 95,
  },
  {
    id: 'shadowless',
    name: 'Shadowless (Pokemon)',
    attribute: 'variant',
    categoryId: 'trading_cards',
    description: 'Shadowless variant of Pokemon Base Set',
    checkCondition: 'no shadow on right side of artwork frame',
    priceMultiplier: 3.0,
    priority: 90,
  },

  // Electronics
  {
    id: 'sealed_electronics',
    name: 'Factory Sealed',
    attribute: 'condition',
    categoryId: 'electronics_phones',
    description: 'Factory sealed, never opened',
    checkCondition: 'original factory seal intact',
    priceMultiplier: 1.3,
    priority: 85,
  },
];

// =============================================================================
// AUTHENTICITY MARKERS
// Markers used to validate item authenticity
// =============================================================================

/**
 * Authenticity markers for luxury/collectible items
 * Used by checkAuthenticity() to validate items
 */
export const AUTHENTICITY_MARKERS: AuthenticityMarkerDef[] = [
  // Louis Vuitton
  {
    id: 'lv_date_code_format',
    name: 'Date Code Format',
    brands: ['Louis Vuitton'],
    categoryId: 'luxury_handbags',
    checkDescription: 'LV date code should be 2 letters + 4 digits (post-2007) or 2 letters + 3-4 digits (pre-2007)',
    importance: 'critical',
    pattern: '^[A-Z]{2}\\d{3,4}$',
    indicatesAuthentic: true,
  },
  {
    id: 'lv_valid_factory',
    name: 'Valid Factory Code',
    brands: ['Louis Vuitton'],
    categoryId: 'luxury_handbags',
    checkDescription: 'Factory code (first 2 letters) must be a known LV factory',
    importance: 'critical',
    indicatesAuthentic: true,
  },
  {
    id: 'lv_heat_stamp',
    name: 'Heat Stamp Quality',
    brands: ['Louis Vuitton'],
    categoryId: 'luxury_handbags',
    checkDescription: 'Heat stamp should be clean, even depth, proper font',
    importance: 'important',
    indicatesAuthentic: true,
  },

  // Hermes
  {
    id: 'hermes_blindstamp_format',
    name: 'Blindstamp Format',
    brands: ['Hermes'],
    categoryId: 'luxury_handbags',
    checkDescription: 'Hermes blindstamp should be single letter (year) in correct format',
    importance: 'critical',
    pattern: '^[A-Z]$',
    indicatesAuthentic: true,
  },
  {
    id: 'hermes_craftsman_stamp',
    name: 'Craftsman Stamp',
    brands: ['Hermes'],
    categoryId: 'luxury_handbags',
    checkDescription: 'Should have craftsman/artisan stamp unique to maker',
    importance: 'important',
    indicatesAuthentic: true,
  },

  // Rolex
  {
    id: 'rolex_serial_format',
    name: 'Serial Number Format',
    brands: ['Rolex'],
    categoryId: 'watches',
    checkDescription: 'Rolex serial should be engraved between lugs at 6 o\'clock',
    importance: 'critical',
    indicatesAuthentic: true,
  },
  {
    id: 'rolex_reference_format',
    name: 'Reference Number Format',
    brands: ['Rolex'],
    categoryId: 'watches',
    checkDescription: 'Reference number should be valid Rolex format (5-6 digits + optional suffix)',
    importance: 'critical',
    pattern: '^\\d{5,6}[A-Z]{0,4}$',
    indicatesAuthentic: true,
  },
  {
    id: 'rolex_rehaut_engraving',
    name: 'Rehaut Engraving',
    brands: ['Rolex'],
    categoryId: 'watches',
    checkDescription: 'Inner bezel should have ROLEX ROLEX ROLEX engraving (post-2002)',
    importance: 'important',
    indicatesAuthentic: true,
  },

  // Nike/Sneakers
  {
    id: 'nike_style_code_format',
    name: 'Style Code Format',
    brands: ['Nike'],
    categoryId: 'sneakers',
    checkDescription: 'Nike style code should be 6 alphanumeric + hyphen + 3 digits',
    importance: 'important',
    pattern: '^[A-Z]{2}\\d{4}-\\d{3}$',
    indicatesAuthentic: true,
  },
  {
    id: 'nike_size_tag_qr',
    name: 'Size Tag QR Code',
    brands: ['Nike'],
    categoryId: 'sneakers',
    checkDescription: 'Modern Nike shoes have scannable QR on size tag',
    importance: 'helpful',
    indicatesAuthentic: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get value drivers for a specific category
 */
export function getValueDriversForCategory(categoryId: CategoryId): ValueDriver[] {
  return VALUE_DRIVERS.filter((d) => d.categoryId === categoryId).sort((a, b) => b.priority - a.priority);
}

/**
 * Get value drivers for a specific category and brand
 */
export function getValueDriversForCategoryAndBrand(categoryId: CategoryId, brand?: string): ValueDriver[] {
  return VALUE_DRIVERS.filter((d) => {
    if (d.categoryId !== categoryId) return false;
    if (!brand) return !d.applicableBrands; // General drivers only
    if (!d.applicableBrands) return true; // Applies to all brands
    return d.applicableBrands.some((b) => b.toLowerCase() === brand.toLowerCase());
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get authenticity markers for a specific category
 */
export function getAuthenticityMarkersForCategory(categoryId: CategoryId): AuthenticityMarkerDef[] {
  return AUTHENTICITY_MARKERS.filter((m) => m.categoryId === categoryId);
}

/**
 * Get authenticity markers for a specific brand
 */
export function getAuthenticityMarkersForBrand(brand: string): AuthenticityMarkerDef[] {
  return AUTHENTICITY_MARKERS.filter((m) =>
    m.brands.some((b) => b.toLowerCase() === brand.toLowerCase()),
  );
}

/**
 * Look up LV factory info by code
 */
export function getLVFactoryInfo(code: string): LVFactoryInfo | null {
  return LV_FACTORY_CODES[code.toUpperCase()] ?? null;
}

/**
 * Look up Rolex reference info
 */
export function getRolexReferenceInfo(reference: string): RolexReferenceInfo | null {
  return ROLEX_REFERENCES[reference.toUpperCase()] ?? null;
}

/**
 * Decode Hermes year from blindstamp
 * Returns possible years (could be from different cycles)
 */
export function getHermesYearFromBlindstamp(letter: string, hasSquare?: boolean): number | null {
  const upperLetter = letter.toUpperCase();

  if (hasSquare) {
    // Cycle 3 (2015+)
    return HERMES_YEAR_CODES_CYCLE3[upperLetter] ?? null;
  }

  // Could be cycle 1 or 2 - return cycle 2 as more likely for modern items
  const cycle2Year = HERMES_YEAR_CODES_CYCLE2[upperLetter];
  if (cycle2Year) return cycle2Year;

  return HERMES_YEAR_CODES_CYCLE1[upperLetter] ?? null;
}
