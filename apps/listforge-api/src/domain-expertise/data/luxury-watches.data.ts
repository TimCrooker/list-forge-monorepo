/**
 * Luxury Watches Domain Expertise Data
 *
 * Production-ready reference data for authenticating and valuing luxury watches.
 * Covers Rolex, Omega, Patek Philippe, Audemars Piguet, and other major brands.
 *
 * Sources:
 * - Bob's Watches (https://www.bobswatches.com)
 * - Chrono24 Magazine
 * - Serial Number Decoder (https://serial-number-decoder.com)
 * - Watch Centre, Tiger River Watches
 */

// ============================================================================
// ROLEX DATA
// ============================================================================

/**
 * Rolex Serial Number Ranges by Year (Sequential Era: 1926-1987)
 * Note: These are approximations compiled by collectors - Rolex never released official data
 */
export const ROLEX_SERIAL_RANGES_SEQUENTIAL: Array<{
  year: number;
  startSerial: number;
  endSerial: number;
  notes?: string;
}> = [
  { year: 1926, startSerial: 28000, endSerial: 30000, notes: 'First documented serials' },
  { year: 1927, startSerial: 30000, endSerial: 32000 },
  { year: 1928, startSerial: 32000, endSerial: 35000 },
  { year: 1929, startSerial: 35000, endSerial: 38000 },
  { year: 1930, startSerial: 38000, endSerial: 42000 },
  { year: 1931, startSerial: 42000, endSerial: 47000 },
  { year: 1932, startSerial: 47000, endSerial: 52000 },
  { year: 1933, startSerial: 52000, endSerial: 58000 },
  { year: 1934, startSerial: 58000, endSerial: 64000 },
  { year: 1935, startSerial: 64000, endSerial: 72000 },
  { year: 1936, startSerial: 72000, endSerial: 83000 },
  { year: 1937, startSerial: 83000, endSerial: 97000 },
  { year: 1938, startSerial: 97000, endSerial: 115000 },
  { year: 1939, startSerial: 115000, endSerial: 134000 },
  { year: 1940, startSerial: 134000, endSerial: 156000 },
  { year: 1941, startSerial: 156000, endSerial: 181000 },
  { year: 1942, startSerial: 181000, endSerial: 209000 },
  { year: 1943, startSerial: 209000, endSerial: 241000 },
  { year: 1944, startSerial: 241000, endSerial: 279000 },
  { year: 1945, startSerial: 279000, endSerial: 320000 },
  { year: 1946, startSerial: 320000, endSerial: 367000 },
  { year: 1947, startSerial: 367000, endSerial: 420000 },
  { year: 1948, startSerial: 420000, endSerial: 480000 },
  { year: 1949, startSerial: 480000, endSerial: 550000 },
  { year: 1950, startSerial: 550000, endSerial: 630000 },
  { year: 1951, startSerial: 630000, endSerial: 720000 },
  { year: 1952, startSerial: 720000, endSerial: 820000 },
  { year: 1953, startSerial: 820000, endSerial: 930000 },
  { year: 1954, startSerial: 930000, endSerial: 999999, notes: 'Reached 999,999' },
  // Rolex reset to 100,000 in early 1950s when reaching 999,999
  { year: 1955, startSerial: 100000, endSerial: 200000, notes: 'Serial reset to 6-digit' },
  { year: 1956, startSerial: 200000, endSerial: 310000 },
  { year: 1957, startSerial: 310000, endSerial: 430000 },
  { year: 1958, startSerial: 430000, endSerial: 560000 },
  { year: 1959, startSerial: 560000, endSerial: 700000 },
  { year: 1960, startSerial: 700000, endSerial: 850000 },
  { year: 1961, startSerial: 850000, endSerial: 999999 },
  { year: 1962, startSerial: 100000, endSerial: 300000, notes: 'Second reset' },
  { year: 1963, startSerial: 300000, endSerial: 600000 },
  { year: 1964, startSerial: 600000, endSerial: 999999 },
  // Move to 7-digit serials in 1963
  { year: 1965, startSerial: 1000000, endSerial: 1300000, notes: '7-digit era begins' },
  { year: 1966, startSerial: 1300000, endSerial: 1600000 },
  { year: 1967, startSerial: 1600000, endSerial: 1900000 },
  { year: 1968, startSerial: 1900000, endSerial: 2200000 },
  { year: 1969, startSerial: 2200000, endSerial: 2500000 },
  { year: 1970, startSerial: 2500000, endSerial: 2800000 },
  { year: 1971, startSerial: 2800000, endSerial: 3100000 },
  { year: 1972, startSerial: 3100000, endSerial: 3400000 },
  { year: 1973, startSerial: 3400000, endSerial: 3700000 },
  { year: 1974, startSerial: 3700000, endSerial: 4000000 },
  { year: 1975, startSerial: 4000000, endSerial: 4300000 },
  { year: 1976, startSerial: 4300000, endSerial: 4600000 },
  { year: 1977, startSerial: 4600000, endSerial: 5000000 },
  { year: 1978, startSerial: 5000000, endSerial: 5500000 },
  { year: 1979, startSerial: 5500000, endSerial: 6000000 },
  { year: 1980, startSerial: 6000000, endSerial: 6500000 },
  { year: 1981, startSerial: 6500000, endSerial: 7000000 },
  { year: 1982, startSerial: 7000000, endSerial: 7500000 },
  { year: 1983, startSerial: 7500000, endSerial: 8000000 },
  { year: 1984, startSerial: 8000000, endSerial: 8500000 },
  { year: 1985, startSerial: 8500000, endSerial: 9000000 },
  { year: 1986, startSerial: 9000000, endSerial: 9500000 },
  { year: 1987, startSerial: 9500000, endSerial: 9999999, notes: 'End of sequential era (mid-1987)' },
];

/**
 * Rolex Letter Prefix Serial Codes (1987-2010)
 * Format: Letter + 6 digits (e.g., R123456)
 * Note: B, I, J, O, Q were never used (reserved for Tudor)
 */
export const ROLEX_SERIAL_LETTER_PREFIXES: Array<{
  letter: string;
  year: number;
  notes?: string;
}> = [
  { letter: 'R', year: 1987, notes: 'First letter prefix, R for Rolex' },
  { letter: 'L', year: 1988 },
  { letter: 'E', year: 1989 },
  { letter: 'X', year: 1990 },
  { letter: 'N', year: 1991 },
  { letter: 'C', year: 1992 },
  { letter: 'S', year: 1993 },
  { letter: 'W', year: 1994 },
  { letter: 'T', year: 1995 },
  { letter: 'U', year: 1996 },
  { letter: 'A', year: 1998 },
  { letter: 'P', year: 1999, notes: 'Some overlap with 2000' },
  { letter: 'K', year: 2001 },
  { letter: 'Y', year: 2002 },
  { letter: 'F', year: 2003, notes: 'Some overlap with 2004' },
  { letter: 'D', year: 2005, notes: 'Some overlap with 2006' },
  { letter: 'Z', year: 2006, notes: 'Last letter prefix used' },
  { letter: 'M', year: 2007, notes: 'Mixed with random serials' },
  { letter: 'V', year: 2008, notes: 'Final letter prefix era' },
  { letter: 'G', year: 2010, notes: 'Transition to random' },
];

/**
 * Rolex Clasp Codes (2000-2010)
 * Format: Two letters + number (e.g., CL10 = October 2004)
 * Number indicates month (1-12)
 * After 2010, codes became random 3-character alphanumeric
 */
export const ROLEX_CLASP_CODES: Record<string, { year: number; notes?: string }> = {
  AB: { year: 2000 },
  DE: { year: 2001 },
  DT: { year: 2002 },
  AD: { year: 2003 },
  CL: { year: 2004 },
  MA: { year: 2005 },
  OP: { year: 2006 },
  EO: { year: 2007 },
  PJ: { year: 2008 },
  LT: { year: 2009 },
  RS: { year: 2010, notes: 'Last datable clasp code' },
};

/**
 * Rolex Reference Number Material Codes (Last Digit)
 */
export const ROLEX_MATERIAL_CODES: Record<string, { material: string; description: string }> = {
  '0': { material: 'Stainless Steel (Oystersteel)', description: '904L stainless steel' },
  '1': { material: 'Stainless Steel + White Gold Bezel', description: 'Steel case with 18k white gold bezel' },
  '3': { material: 'Yellow Rolesor', description: 'Steel and 18k yellow gold combination' },
  '5': { material: 'Everose Rolesor', description: 'Steel and 18k Everose (rose gold) combination' },
  '8': { material: 'Yellow Gold', description: 'Full 18k yellow gold' },
  '9': { material: 'White Gold', description: 'Full 18k white gold' },
};

/**
 * Rolex Bezel Suffix Codes (French Origins)
 * L = Lunette (bezel), N = Noir (black), V = Verte (green), B = Bleu (blue), R = Rouge (red)
 */
export const ROLEX_BEZEL_CODES: Record<string, { color: string; nickname?: string; description: string }> = {
  LN: { color: 'Black', description: 'Lunette Noire - Black ceramic bezel' },
  LV: { color: 'Green', nickname: 'Hulk/Starbucks', description: 'Lunette Verte - Green ceramic bezel' },
  LB: { color: 'Blue', description: 'Lunette Bleu - Blue ceramic bezel' },
  BLRO: { color: 'Blue/Red', nickname: 'Pepsi', description: 'Bleu Rouge - Two-tone blue and red bezel' },
  BLNR: { color: 'Blue/Black', nickname: 'Batman/Batgirl', description: 'Bleu Noir - Two-tone blue and black bezel' },
  CHNR: { color: 'Brown/Black', nickname: 'Root Beer', description: 'Chocolate Noir - Brown and black bezel' },
  SP: { color: 'Cerachrom with Sapphire', description: 'Special edition with sapphire-set bezel' },
};

/**
 * Key Rolex Reference Numbers by Collection
 */
export const ROLEX_REFERENCE_FAMILIES: Record<
  string,
  { collection: string; caseSize: number; introduced: number; notes: string }
> = {
  '1266': { collection: 'Submariner Date', caseSize: 41, introduced: 2020, notes: 'Current production' },
  '1246': { collection: 'Submariner No-Date', caseSize: 41, introduced: 2020, notes: 'Current production' },
  '1166': { collection: 'Submariner Date', caseSize: 40, introduced: 2010, notes: 'Discontinued 2020' },
  '1146': { collection: 'Submariner No-Date', caseSize: 40, introduced: 2012, notes: 'Discontinued 2020' },
  '1267': { collection: 'GMT-Master II', caseSize: 40, introduced: 2018, notes: 'Jubilee bracelet option' },
  '1247': { collection: 'Explorer II', caseSize: 42, introduced: 2021, notes: 'Current production' },
  '1260': { collection: 'Sea-Dweller', caseSize: 43, introduced: 2017, notes: 'Cyclops added' },
  '1366': { collection: 'Deepsea', caseSize: 44, introduced: 2018, notes: 'Challenge dial available' },
  '1163': { collection: 'Daytona', caseSize: 40, introduced: 2016, notes: 'Ceramic bezel introduction' },
  '2283': { collection: 'Sky-Dweller', caseSize: 42, introduced: 2012, notes: 'Annual calendar complication' },
  '2281': { collection: 'Yacht-Master II', caseSize: 44, introduced: 2007, notes: 'Regatta chronograph' },
  '1282': { collection: 'Day-Date 40', caseSize: 40, introduced: 2015, notes: 'Precious metals only' },
  '1283': { collection: 'Datejust 41', caseSize: 41, introduced: 2016, notes: 'Current production' },
};

// ============================================================================
// OMEGA DATA
// ============================================================================

/**
 * Omega Serial Number Ranges (Sample - Complete ranges are extensive)
 * Serial numbers are typically 5-9 digits, numeric only (until 2021-2022 alphanumeric)
 */
export const OMEGA_SERIAL_RANGES: Array<{
  year: number;
  startSerial: number;
  endSerial: number;
  notes?: string;
}> = [
  { year: 1895, startSerial: 1000000, endSerial: 1100000, notes: 'Earliest documented' },
  { year: 1902, startSerial: 2000000, endSerial: 2200000 },
  { year: 1912, startSerial: 5000000, endSerial: 5500000 },
  { year: 1924, startSerial: 6000000, endSerial: 6500000 },
  { year: 1935, startSerial: 8000000, endSerial: 8500000 },
  { year: 1944, startSerial: 9500000, endSerial: 10000000 },
  { year: 1950, startSerial: 11000000, endSerial: 12000000 },
  { year: 1956, startSerial: 15000000, endSerial: 16000000 },
  { year: 1960, startSerial: 17000000, endSerial: 18000000 },
  { year: 1965, startSerial: 22000000, endSerial: 24000000 },
  { year: 1970, startSerial: 28000000, endSerial: 31000000 },
  { year: 1975, startSerial: 36000000, endSerial: 39000000 },
  { year: 1980, startSerial: 43000000, endSerial: 45000000 },
  { year: 1985, startSerial: 46000000, endSerial: 48000000 },
  { year: 1990, startSerial: 48500000, endSerial: 50000000 },
  { year: 1995, startSerial: 52000000, endSerial: 56000000 },
  { year: 2000, startSerial: 60000000, endSerial: 70000000 },
  { year: 2005, startSerial: 77000000, endSerial: 82000000 },
  { year: 2010, startSerial: 85000000, endSerial: 90000000, notes: 'Approximate - may vary by model' },
];

/**
 * Omega Reference Number Eras
 */
export const OMEGA_REFERENCE_ERAS: Array<{
  era: string;
  startYear: number;
  endYear: number;
  format: string;
  example: string;
}> = [
  {
    era: 'Alphanumeric',
    startYear: 1970,
    endYear: 1988,
    format: 'XX.XXX.XXXX',
    example: 'ST.145.0022',
  },
  {
    era: '8-Digit PIC',
    startYear: 1988,
    endYear: 2007,
    format: 'XXXX.XX.XX',
    example: '3570.50.00',
  },
  {
    era: '14-Digit PIC',
    startYear: 2007,
    endYear: 9999,
    format: '311.30.42.30.01.005',
    example: '311.30.42.30.01.005',
  },
];

/**
 * Omega Speedmaster Special References
 * Note: Speedmaster serials run separately from other Omega models
 */
export const OMEGA_SPEEDMASTER_REFS: Record<
  string,
  { name: string; era: string; significance: string }
> = {
  '2998': { name: 'First Speedmaster', era: '1957-1959', significance: 'Original CK2998' },
  '105.003': { name: 'Ed White', era: '1964-1966', significance: 'First watch in space (Gemini 4)' },
  '105.012': { name: 'Pre-Moon', era: '1966-1968', significance: 'Flight qualified for Apollo' },
  '145.012': { name: 'Moon Watch', era: '1968-1969', significance: 'Worn during Apollo 11' },
  '145.022': { name: 'Classic Moon', era: '1969-1988', significance: 'Most common Moon watch reference' },
  '3570.50': { name: 'Moonwatch Professional', era: '1997-2021', significance: 'Long-running production ref' },
  '310.30.42.50.01.001': {
    name: 'Co-Axial Master Chronometer',
    era: '2021-Present',
    significance: 'New caliber 3861',
  },
};

// ============================================================================
// PATEK PHILIPPE DATA
// ============================================================================

/**
 * Patek Philippe Reference Number Structure
 * Format: xxxx/xxxxX-xxx
 */
export const PATEK_FIRST_DIGIT_MEANING: Record<
  string,
  { gender: string; collection: string }
> = {
  '3': { gender: "Men's", collection: 'Classic (Calatrava, Complications)' },
  '4': { gender: "Women's", collection: 'Ladies watches' },
  '5': { gender: "Men's", collection: 'Modern collections (introduced 1996)' },
  '6': { gender: "Men's", collection: 'Contemporary sports/complications' },
  '7': { gender: "Women's", collection: 'Ladies Nautilus, Aquanaut' },
};

/**
 * Patek Philippe Collection Identifiers (Second Digit Pattern)
 */
export const PATEK_COLLECTION_CODES: Record<string, { collection: string; description: string }> = {
  '51': { collection: 'Aquanaut', description: 'Sport watch with tropical strap' },
  '52': { collection: 'Calatrava', description: 'Dress watch collection' },
  '53': { collection: 'Gondolo', description: 'Art Deco-inspired' },
  '57': { collection: 'Nautilus', description: 'Iconic sports watch by Gérald Genta' },
  '59': { collection: 'Nautilus Chronograph', description: 'Nautilus with chronograph' },
  '58': { collection: 'Grand Complications', description: 'Minute repeaters, perpetual calendars' },
  '54': { collection: 'Complications', description: 'Annual calendar, worldtime, etc.' },
};

/**
 * Patek Philippe Material Letter Codes (from French)
 */
export const PATEK_MATERIAL_CODES: Record<string, { material: string; french: string }> = {
  A: { material: 'Stainless Steel', french: 'Acier' },
  J: { material: 'Yellow Gold', french: 'Jaune (Or)' },
  R: { material: 'Rose Gold', french: 'Rose (Or)' },
  G: { material: 'White Gold', french: 'Gris (Or)' },
  P: { material: 'Platinum', french: 'Platine' },
  T: { material: 'Titanium', french: 'Titane' },
};

/**
 * Patek Philippe Iconic References
 */
export const PATEK_ICONIC_REFS: Record<
  string,
  { name: string; collection: string; significance: string; yearIntroduced: number }
> = {
  '5711/1A': {
    name: 'Nautilus',
    collection: 'Nautilus',
    significance: 'Most sought-after steel sports watch, discontinued 2021',
    yearIntroduced: 2006,
  },
  '5712/1A': {
    name: 'Nautilus Power Reserve',
    collection: 'Nautilus',
    significance: 'Moon phase, power reserve, date subdial',
    yearIntroduced: 2006,
  },
  '5167A': {
    name: 'Aquanaut',
    collection: 'Aquanaut',
    significance: 'Modern sporty alternative to Nautilus',
    yearIntroduced: 2007,
  },
  '5196': {
    name: 'Calatrava',
    collection: 'Calatrava',
    significance: 'Classic dress watch, Clous de Paris bezel',
    yearIntroduced: 1997,
  },
  '5270': {
    name: 'Perpetual Calendar Chronograph',
    collection: 'Grand Complications',
    significance: 'In-house perpetual calendar movement',
    yearIntroduced: 2011,
  },
  '5980/1A': {
    name: 'Nautilus Chronograph',
    collection: 'Nautilus',
    significance: 'Flyback chronograph, steel sports luxury',
    yearIntroduced: 2006,
  },
};

// ============================================================================
// AUDEMARS PIGUET DATA
// ============================================================================

/**
 * Audemars Piguet Reference Number Structure
 * Format typically: XXXXX.XX.XXXX.XX.XX
 */
export const AP_COLLECTION_PREFIXES: Record<string, { collection: string; description: string }> = {
  '15': { collection: 'Royal Oak', description: 'Iconic octagonal bezel design' },
  '26': { collection: 'Royal Oak Offshore', description: 'Larger, sportier Royal Oak variant' },
  '77': { collection: "Royal Oak Ladies", description: "Women's Royal Oak collection" },
  '67': { collection: 'Royal Oak Concept', description: 'Avant-garde designs' },
  '25': { collection: 'Royal Oak Perpetual Calendar', description: 'RO with perpetual calendar' },
  '11': { collection: 'Code 11.59', description: 'New round case design (2019)' },
};

/**
 * Key Audemars Piguet References
 */
export const AP_ICONIC_REFS: Record<
  string,
  { name: string; significance: string; yearIntroduced: number }
> = {
  '15202ST': {
    name: 'Royal Oak "Jumbo"',
    significance: 'Original 39mm design by Gérald Genta, ultra-thin 2121 movement',
    yearIntroduced: 1972,
  },
  '15500ST': {
    name: 'Royal Oak 41mm',
    significance: 'Current production 41mm Royal Oak',
    yearIntroduced: 2019,
  },
  '15400ST': {
    name: 'Royal Oak 41mm (Previous)',
    significance: 'Popular 41mm size, discontinued',
    yearIntroduced: 2012,
  },
  '26470ST': {
    name: 'Royal Oak Offshore Chronograph',
    significance: '42mm offshore with chronograph',
    yearIntroduced: 2014,
  },
  '15450ST': {
    name: 'Royal Oak 37mm',
    significance: 'Mid-size unisex option',
    yearIntroduced: 2015,
  },
};

// ============================================================================
// VALUE DRIVERS
// ============================================================================

export const WATCH_VALUE_DRIVERS = [
  // Rarity and Collectibility
  {
    name: 'Discontinued Reference',
    attribute: 'reference_status',
    conditionType: 'equals',
    conditionValue: 'discontinued',
    priceMultiplier: 1.3,
    priority: 100,
    description: 'Reference no longer in production, increased collectibility',
  },
  {
    name: 'Tropical Dial',
    attribute: 'dial_condition',
    conditionType: 'contains',
    conditionValue: 'tropical',
    priceMultiplier: 2.5,
    priority: 95,
    description: 'Dial has naturally aged to brown/chocolate color',
  },
  {
    name: 'Ghost Bezel',
    attribute: 'bezel_condition',
    conditionType: 'contains',
    conditionValue: 'ghost',
    priceMultiplier: 1.8,
    priority: 90,
    description: 'Bezel insert faded to desirable grey/blue patina',
  },
  // Material Premiums
  {
    name: 'Platinum Case',
    attribute: 'case_material',
    conditionType: 'equals',
    conditionValue: 'platinum',
    priceMultiplier: 3.0,
    priority: 85,
    description: 'Platinum is rarest precious metal for watches',
  },
  {
    name: 'White Gold Case',
    attribute: 'case_material',
    conditionType: 'equals',
    conditionValue: 'white_gold',
    priceMultiplier: 2.0,
    priority: 80,
    description: '18k white gold case',
  },
  {
    name: 'Rose/Everose Gold',
    attribute: 'case_material',
    conditionType: 'contains',
    conditionValue: 'rose_gold',
    priceMultiplier: 1.8,
    priority: 75,
    description: 'Rose gold or Rolex Everose gold',
  },
  {
    name: 'Yellow Gold Case',
    attribute: 'case_material',
    conditionType: 'equals',
    conditionValue: 'yellow_gold',
    priceMultiplier: 1.6,
    priority: 70,
    description: '18k yellow gold case',
  },
  // Special Editions
  {
    name: 'Tiffany & Co Stamped Dial',
    attribute: 'dial_stamp',
    conditionType: 'contains',
    conditionValue: 'tiffany',
    priceMultiplier: 3.0,
    priority: 98,
    description: 'Rolex or Patek sold through Tiffany with double signature',
  },
  {
    name: 'Military Issue',
    attribute: 'provenance',
    conditionType: 'contains',
    conditionValue: 'military',
    priceMultiplier: 2.0,
    priority: 92,
    description: 'Military-issued watch with proper documentation',
  },
  {
    name: 'Celebrity Provenance',
    attribute: 'provenance',
    conditionType: 'contains',
    conditionValue: 'celebrity',
    priceMultiplier: 5.0,
    priority: 99,
    description: 'Documented celebrity ownership',
  },
  // Condition
  {
    name: 'Full Set (Box & Papers)',
    attribute: 'accessories',
    conditionType: 'contains',
    conditionValue: 'full_set',
    priceMultiplier: 1.25,
    priority: 60,
    description: 'Original box, papers, warranty card, tags',
  },
  {
    name: 'Papers Only',
    attribute: 'accessories',
    conditionType: 'contains',
    conditionValue: 'papers',
    priceMultiplier: 1.1,
    priority: 55,
    description: 'Has original papers but no box',
  },
  {
    name: 'Original Stickers',
    attribute: 'condition',
    conditionType: 'contains',
    conditionValue: 'stickers',
    priceMultiplier: 1.15,
    priority: 50,
    description: 'Factory protective stickers still present',
  },
  // Dial Variations
  {
    name: 'Rare Dial Color',
    attribute: 'dial_color',
    conditionType: 'custom',
    conditionValue: { expression: 'dial_color in ["salmon", "green", "blue_tiffany", "lacquer"]' },
    priceMultiplier: 1.5,
    priority: 65,
    description: 'Unusual or limited dial color',
  },
  {
    name: 'MOP Dial (Mother of Pearl)',
    attribute: 'dial_material',
    conditionType: 'contains',
    conditionValue: 'mother_of_pearl',
    priceMultiplier: 1.3,
    priority: 62,
    description: 'Mother of pearl dial',
  },
  {
    name: 'Meteorite Dial',
    attribute: 'dial_material',
    conditionType: 'contains',
    conditionValue: 'meteorite',
    priceMultiplier: 1.6,
    priority: 68,
    description: 'Genuine meteorite dial',
  },
];

// ============================================================================
// AUTHENTICITY MARKERS
// ============================================================================

export const WATCH_AUTHENTICITY_MARKERS = [
  // Rolex
  {
    name: 'Rolex Serial Number Format (Sequential)',
    pattern: '^\\d{5,7}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: 'Pre-1987 sequential serial number format',
  },
  {
    name: 'Rolex Serial Number Format (Letter Prefix)',
    pattern: '^[A-Z]\\d{6}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: '1987-2010 letter prefix format (excludes B,I,J,O,Q)',
  },
  {
    name: 'Rolex Serial Number Format (Random)',
    pattern: '^[A-Z0-9]{8}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: 'Post-2010 8-character alphanumeric format',
  },
  {
    name: 'Rolex Invalid Letter Prefix',
    pattern: '^[BIJOQ]\\d{6}$',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Rolex'],
    description: 'B, I, J, O, Q prefixes were reserved for Tudor - fake if on Rolex',
  },
  {
    name: 'Rolex Rehaut Engraving',
    pattern: 'ROLEXROLEXROLEX',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: 'Post-2007 inner bezel ring engraving',
  },
  {
    name: 'Rolex Cyclops 2.5x Magnification',
    pattern: 'date_magnification_2.5x',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: 'Date window should magnify 2.5x, counterfeits often 1.5x',
  },
  {
    name: 'Rolex Crown Logo Laser Etching',
    pattern: 'crown_laser_crystal',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex'],
    description: 'Micro-etched crown at 6 o\'clock on crystal (post-2002)',
  },
  // Omega
  {
    name: 'Omega Serial Number Format',
    pattern: '^\\d{5,9}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Omega'],
    description: '5-9 digit numeric serial (pre-2022)',
  },
  {
    name: 'Omega Modern Alphanumeric Serial',
    pattern: '^[A-Z]\\d{6}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Omega'],
    description: 'Post-2021 alphanumeric format',
  },
  {
    name: 'Omega Reference Format (14-digit PIC)',
    pattern: '^\\d{3}\\.\\d{2}\\.\\d{2}\\.\\d{2}\\.\\d{2}\\.\\d{3}$',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Omega'],
    description: 'Modern 14-digit Product Identification Code',
  },
  // Patek Philippe
  {
    name: 'Patek Philippe Reference Format',
    pattern: '^\\d{4}/\\d{3,4}[A-Z](-\\d{3})?$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Patek Philippe'],
    description: 'Standard Patek reference number format',
  },
  {
    name: 'Patek Philippe Seal',
    pattern: 'patek_philippe_seal',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Patek Philippe'],
    description: 'Post-2009 Patek Philippe Seal certification',
  },
  // Audemars Piguet
  {
    name: 'AP Reference Format',
    pattern: '^\\d{5}[A-Z]{2}',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Audemars Piguet'],
    description: 'AP reference number starting format',
  },
  {
    name: 'AP Tapisserie Dial Pattern',
    pattern: 'tapisserie_grande_petite',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Audemars Piguet'],
    description: 'Signature waffle pattern dial (Grande/Petite Tapisserie)',
  },
  // General markers
  {
    name: 'Movement Serial Matches Case',
    pattern: 'movement_case_serial_match',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet'],
    description: 'Movement and case serials should match records',
  },
  {
    name: 'Smooth Second Hand Sweep',
    pattern: 'second_hand_sweep',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet'],
    description: 'Mechanical watches have smooth sweep, not tick (quartz fakes tick)',
  },
  {
    name: 'Proper Lume Application',
    pattern: 'lume_uniform_application',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Rolex', 'Omega', 'Patek Philippe', 'Audemars Piguet'],
    description: 'Lume should be evenly applied, match indices',
  },
];

// ============================================================================
// DECODER DEFINITIONS
// ============================================================================

export const WATCH_DECODERS = [
  {
    name: 'Rolex Serial Number Decoder',
    identifierType: 'serial_number',
    description: 'Decodes Rolex serial numbers to determine production year',
    inputPattern: '^([A-Z]?\\d{6,8}|\\d{5,7})$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Sequential Era',
        pattern: '^\\d{5,7}$',
        yearRange: [1926, 1987],
        method: 'range_lookup',
      },
      {
        name: 'Letter Prefix Era',
        pattern: '^[A-Z]\\d{6}$',
        yearRange: [1987, 2010],
        method: 'letter_lookup',
      },
      {
        name: 'Random Era',
        pattern: '^[A-Z0-9]{8}$',
        yearRange: [2010, 9999],
        method: 'warranty_card_required',
      },
    ],
    outputFields: ['production_year', 'era', 'serial_location'],
    baseConfidence: 0.85,
    priority: 100,
    testCases: [
      { input: 'R123456', expected: { production_year: 1987, era: 'letter_prefix' } },
      { input: '5500000', expected: { production_year: 1979, era: 'sequential' } },
    ],
  },
  {
    name: 'Rolex Reference Number Decoder',
    identifierType: 'reference_number',
    description: 'Decodes Rolex reference numbers to identify model and materials',
    inputPattern: '^\\d{5,6}[A-Z]{0,4}$',
    inputMaxLength: 12,
    extractionRules: [
      {
        name: 'Model Family',
        pattern: '^(\\d{4})',
        method: 'family_lookup',
      },
      {
        name: 'Material Code',
        pattern: '(\\d)(?=[A-Z]*$)',
        method: 'material_lookup',
      },
      {
        name: 'Bezel Code',
        pattern: '([A-Z]{2,4})$',
        method: 'bezel_lookup',
      },
    ],
    outputFields: ['collection', 'case_size', 'case_material', 'bezel_color'],
    baseConfidence: 0.95,
    priority: 90,
    testCases: [
      {
        input: '126610LN',
        expected: {
          collection: 'Submariner Date',
          case_material: 'Stainless Steel',
          bezel_color: 'Black',
        },
      },
    ],
  },
  {
    name: 'Omega Serial Number Decoder',
    identifierType: 'serial_number',
    description: 'Decodes Omega serial numbers to determine approximate production year',
    inputPattern: '^\\d{5,9}$|^[A-Z]\\d{6}$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Numeric Serial',
        pattern: '^\\d{5,9}$',
        method: 'range_lookup',
      },
      {
        name: 'Modern Alphanumeric',
        pattern: '^[A-Z]\\d{6}$',
        yearRange: [2021, 9999],
        method: 'modern_serial',
      },
    ],
    outputFields: ['production_year', 'model_line'],
    baseConfidence: 0.75,
    priority: 80,
    testCases: [
      { input: '48123456', expected: { production_year: 1995, model_line: 'estimated' } },
    ],
  },
  {
    name: 'Patek Philippe Reference Decoder',
    identifierType: 'reference_number',
    description: 'Decodes Patek Philippe reference numbers',
    inputPattern: '^\\d{4}/\\d{3,4}[A-Z](-\\d{3})?$',
    inputMaxLength: 20,
    extractionRules: [
      {
        name: 'Gender/Collection',
        pattern: '^(\\d)',
        method: 'first_digit_lookup',
      },
      {
        name: 'Collection Code',
        pattern: '^\\d(\\d)',
        method: 'collection_lookup',
      },
      {
        name: 'Material Code',
        pattern: '(\\d{3,4})([A-Z])',
        method: 'material_letter_lookup',
      },
    ],
    outputFields: ['collection', 'gender', 'case_material', 'dial_version'],
    baseConfidence: 0.95,
    priority: 85,
    testCases: [
      {
        input: '5711/1A-010',
        expected: {
          collection: 'Nautilus',
          gender: "Men's",
          case_material: 'Stainless Steel',
        },
      },
    ],
  },
  {
    name: 'Rolex Clasp Code Decoder',
    identifierType: 'clasp_code',
    description: 'Decodes Rolex bracelet clasp codes (2000-2010)',
    inputPattern: '^[A-Z]{2}\\d{1,2}$',
    inputMaxLength: 4,
    extractionRules: [
      {
        name: 'Year Code',
        pattern: '^([A-Z]{2})',
        method: 'clasp_year_lookup',
      },
      {
        name: 'Month',
        pattern: '(\\d{1,2})$',
        method: 'month_direct',
      },
    ],
    outputFields: ['production_year', 'production_month'],
    baseConfidence: 0.9,
    priority: 70,
    testCases: [
      { input: 'CL10', expected: { production_year: 2004, production_month: 10 } },
      { input: 'RS3', expected: { production_year: 2010, production_month: 3 } },
    ],
  },
];

// ============================================================================
// LOOKUP TABLES
// ============================================================================

export const WATCH_LOOKUP_TABLES = {
  rolex_serial_ranges: {
    name: 'Rolex Serial Number Ranges',
    description: 'Serial number to production year mapping (sequential era)',
    keyField: 'serial_range',
    valueSchema: { year: 'number', era: 'string' },
  },
  rolex_letter_prefixes: {
    name: 'Rolex Letter Prefixes',
    description: 'Letter prefix to production year mapping',
    keyField: 'letter',
    valueSchema: { year: 'number' },
  },
  rolex_clasp_codes: {
    name: 'Rolex Clasp Codes',
    description: 'Clasp code to production year mapping',
    keyField: 'code',
    valueSchema: { year: 'number' },
  },
  rolex_materials: {
    name: 'Rolex Material Codes',
    description: 'Reference number last digit to material mapping',
    keyField: 'digit',
    valueSchema: { material: 'string', description: 'string' },
  },
  rolex_bezel_codes: {
    name: 'Rolex Bezel Suffix Codes',
    description: 'Bezel letter codes to color mapping',
    keyField: 'code',
    valueSchema: { color: 'string', nickname: 'string' },
  },
  omega_serial_ranges: {
    name: 'Omega Serial Number Ranges',
    description: 'Serial number to production year mapping',
    keyField: 'serial_range',
    valueSchema: { year: 'number' },
  },
  patek_materials: {
    name: 'Patek Philippe Material Codes',
    description: 'Material letter to material type mapping',
    keyField: 'letter',
    valueSchema: { material: 'string', french: 'string' },
  },
  patek_collections: {
    name: 'Patek Philippe Collection Codes',
    description: 'First two digits to collection mapping',
    keyField: 'code',
    valueSchema: { collection: 'string', description: 'string' },
  },
};
