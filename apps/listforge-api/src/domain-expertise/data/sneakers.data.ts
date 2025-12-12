/**
 * Sneakers Domain Expertise Data
 *
 * Production-ready reference data for authenticating and valuing collectible sneakers.
 * Covers Nike, Jordan, Adidas Yeezy, and other major brands.
 *
 * Sources:
 * - NikeTalk forums (https://niketalk.com)
 * - LegitCheck App (https://legitcheck.app)
 * - StockX, GOAT market data
 * - Official brand resources
 */

// ============================================================================
// NIKE STYLE CODE SYSTEM
// ============================================================================

/**
 * Nike Style Code Structure (9-digit format: XXXXXX-XXX)
 * First 6 digits = Model identifier
 * Last 3 digits = Color code
 *
 * First digit meanings (traditional system - may vary in modern releases):
 */
export const NIKE_STYLE_FIRST_DIGIT: Record<string, { meaning: string; description: string }> = {
  '1': { meaning: 'Regular Production', description: 'Standard inline release' },
  '3': { meaning: 'Modern Production', description: 'Current era numbering (post-2010)' },
  '6': { meaning: 'Special Make Up (SMU)', description: 'Retailer exclusives, regional releases' },
  '8': { meaning: 'ACG Line', description: 'All Conditions Gear outdoor line' },
  '9': { meaning: 'Limited Edition', description: 'Quickstrikes, collaborations' },
};

/**
 * Nike Style Code Second Digit - Category
 */
export const NIKE_STYLE_CATEGORY: Record<string, { category: string; examples: string[] }> = {
  '0': { category: 'Running', examples: ['Air Max', 'Pegasus', 'Vomero'] },
  '1': { category: 'Running/Training', examples: ['Free Run', 'Metcon'] },
  '3': { category: 'Basketball', examples: ['Air Jordan', 'LeBron', 'Kobe'] },
  '4': { category: 'Tennis', examples: ['Court Vision', 'Vapor'] },
  '5': { category: 'Lifestyle/Retro', examples: ['Dunk', 'Air Force 1'] },
  '6': { category: 'ACG/Outdoor', examples: ['ACG collection'] },
  '7': { category: 'Training', examples: ['Trainer', 'Metcon'] },
  '8': { category: 'ACG/Hiking', examples: ['ACG boots'] },
  '9': { category: 'Water/Sandals', examples: ['Aqua Sock', 'Slides'] },
};

/**
 * Nike Color Codes (Last 3 digits of style code)
 * First digit = Primary/Base color
 * Second digit = Logo/Swoosh color
 * Third digit = Variation number
 */
export const NIKE_COLOR_CODE_PRIMARY: Record<string, { color: string; variations: string[] }> = {
  '0': { color: 'Black', variations: ['001 - Black/White', '002 - Black/Red', '003 - Black/Blue', '010 - Pure Black'] },
  '1': { color: 'White', variations: ['100 - Pure White', '101 - White/Black', '102 - White/Red', '105 - White/Grey'] },
  '2': { color: 'Brown/Earth', variations: ['200 - Brown', '201 - Baroque Brown', '220 - Cacao Wow'] },
  '3': { color: 'Green', variations: ['300 - Green', '301 - Lucky Green', '302 - Gorge Green', '318 - Pine Green'] },
  '4': { color: 'Blue', variations: ['400 - Blue', '401 - University Blue', '402 - Royal Blue', '411 - Midnight Navy'] },
  '5': { color: 'Purple', variations: ['500 - Purple', '501 - Court Purple', '555 - Psychic Purple'] },
  '6': { color: 'Red', variations: ['600 - Red', '601 - Varsity Red', '602 - Gym Red', '610 - University Red'] },
  '7': { color: 'Yellow/Gold', variations: ['700 - Yellow', '701 - Tour Yellow', '710 - Metallic Gold'] },
  '8': { color: 'Orange', variations: ['800 - Orange', '801 - Starfish', '808 - Total Orange'] },
  '9': { color: 'Multi/Special', variations: ['900 - Multi-Color', '999 - Special Edition'] },
};

/**
 * Common Nike Color Code Mappings
 */
export const NIKE_COMMON_COLOR_CODES: Record<string, string> = {
  '001': 'Black/White',
  '002': 'Black/Varsity Red',
  '003': 'Black/Cement Grey',
  '010': 'Black/Black',
  '011': 'Black/Dark Grey',
  '060': 'Anthracite/Cool Grey',
  '100': 'White/White',
  '101': 'White/Black',
  '102': 'White/Varsity Red',
  '105': 'White/Pure Platinum',
  '106': 'Sail/White',
  '110': 'White/White-White',
  '111': 'Summit White',
  '122': 'Phantom/Sail',
  '200': 'Light Chocolate',
  '220': 'Cacao Wow',
  '300': 'Pine Green',
  '301': 'Lucky Green',
  '302': 'Gorge Green',
  '400': 'University Blue',
  '401': 'Royal Blue',
  '411': 'Midnight Navy',
  '500': 'Court Purple',
  '555': 'Psychic Purple',
  '600': 'Varsity Red',
  '601': 'Gym Red',
  '602': 'University Red',
  '610': 'Fire Red',
  '700': 'Tour Yellow',
  '710': 'Metallic Gold',
  '800': 'Total Orange',
  '808': 'Starfish Orange',
};

// ============================================================================
// JORDAN BRAND DATA
// ============================================================================

/**
 * Air Jordan Model Reference Numbers
 */
export const JORDAN_MODEL_CODES: Record<string, {
  model: string;
  year: number;
  designer: string;
  significance: string;
}> = {
  '554724': { model: 'Air Jordan 1 High OG', year: 1985, designer: 'Peter Moore', significance: 'Original banned shoe' },
  '553558': { model: 'Air Jordan 1 Mid', year: 1985, designer: 'Peter Moore', significance: 'Mid-top version' },
  '555088': { model: 'Air Jordan 1 Low', year: 1985, designer: 'Peter Moore', significance: 'Low-top version' },
  '130690': { model: 'Air Jordan 3 Retro', year: 1988, designer: 'Tinker Hatfield', significance: 'First elephant print, visible Air' },
  '308497': { model: 'Air Jordan 4 Retro', year: 1989, designer: 'Tinker Hatfield', significance: 'First international signature shoe' },
  '136027': { model: 'Air Jordan 5 Retro', year: 1990, designer: 'Tinker Hatfield', significance: 'Fighter jet inspiration, shark teeth' },
  '384664': { model: 'Air Jordan 6 Retro', year: 1991, designer: 'Tinker Hatfield', significance: 'First championship shoe' },
  '304775': { model: 'Air Jordan 7 Retro', year: 1992, designer: 'Tinker Hatfield', significance: 'Olympic Dream Team, no Nike Air' },
  '305381': { model: 'Air Jordan 8 Retro', year: 1993, designer: 'Tinker Hatfield', significance: 'Straps, second 3-peat start' },
  '302370': { model: 'Air Jordan 11 Retro', year: 1995, designer: 'Tinker Hatfield', significance: 'Patent leather, iconic silhouette' },
  '130791': { model: 'Air Jordan 12 Retro', year: 1996, designer: 'Tinker Hatfield', significance: 'Rising sun pattern, Flu Game' },
  '414571': { model: 'Air Jordan 13 Retro', year: 1997, designer: 'Tinker Hatfield', significance: 'Hologram, panther inspiration' },
};

/**
 * Iconic Jordan Colorway Names
 */
export const JORDAN_COLORWAY_NAMES: Record<string, {
  officialName: string;
  nickname: string;
  styleCode: string;
  year: number;
  significance: string;
}> = {
  'bred': {
    officialName: 'Black/Varsity Red',
    nickname: 'Bred',
    styleCode: '555088-001',
    year: 1985,
    significance: 'Original banned colorway, NBA fine $5000/game',
  },
  'chicago': {
    officialName: 'White/Black-Varsity Red',
    nickname: 'Chicago',
    styleCode: '555088-101',
    year: 1985,
    significance: 'Bulls home colorway, most iconic J1',
  },
  'royal': {
    officialName: 'Black/Royal Blue',
    nickname: 'Royal',
    styleCode: '555088-007',
    year: 1985,
    significance: 'Original 1985 colorway',
  },
  'shadow': {
    officialName: 'Black/Medium Grey',
    nickname: 'Shadow',
    styleCode: '555088-013',
    year: 1985,
    significance: 'OG 1985, understated classic',
  },
  'unc': {
    officialName: 'White/University Blue',
    nickname: 'UNC',
    styleCode: '555088-117',
    year: 1985,
    significance: 'Michael Jordan college colors',
  },
  'concord': {
    officialName: 'White/Black-Concord',
    nickname: 'Concord',
    styleCode: '378037-100',
    year: 1995,
    significance: 'AJ11, "Space Jam" shoe',
  },
  'flu_game': {
    officialName: 'Black/Varsity Red',
    nickname: 'Flu Game',
    styleCode: '130690-065',
    year: 1997,
    significance: 'AJ12, worn during 1997 Finals Game 5',
  },
  'taxi': {
    officialName: 'White/Black-Taxi',
    nickname: 'Taxi',
    styleCode: '130690-109',
    year: 1996,
    significance: 'AJ12, yellow/white iconic colorway',
  },
};

// ============================================================================
// ADIDAS YEEZY DATA
// ============================================================================

/**
 * Yeezy Box Label Region Codes
 */
export const YEEZY_REGION_CODES: Record<string, {
  region: string;
  serialEnding: string;
  sizesDisplayed: string[];
  notes: string;
}> = {
  'V02': { region: 'USA', serialEnding: 'V02', sizesDisplayed: ['US', 'F', 'UK'], notes: 'US market box' },
  'V03': { region: 'USA/Brazil', serialEnding: 'V03', sizesDisplayed: ['US', 'F', 'UK'], notes: 'Alternate US/Brazil' },
  'V04': { region: 'Mexico', serialEnding: 'V04', sizesDisplayed: ['US', 'F', 'UK'], notes: 'Mexican market only' },
  'V10': { region: 'International', serialEnding: 'V10', sizesDisplayed: ['US', 'UK', 'F', 'D', 'J', 'CHN'], notes: '6 sizes = international' },
};

/**
 * Yeezy Model Style Codes
 */
export const YEEZY_MODEL_CODES: Record<string, {
  model: string;
  silhouette: string;
  yearIntroduced: number;
}> = {
  'BB5350': { model: 'Yeezy Boost 350', silhouette: '350 V1', yearIntroduced: 2015 },
  'AQ4832': { model: 'Yeezy Boost 350 Turtle Dove', silhouette: '350 V1', yearIntroduced: 2015 },
  'CP9366': { model: 'Yeezy Boost 350 V2 Bred', silhouette: '350 V2', yearIntroduced: 2017 },
  'CP9654': { model: 'Yeezy Boost 350 V2 Zebra', silhouette: '350 V2', yearIntroduced: 2017 },
  'B37571': { model: 'Yeezy Boost 700 Wave Runner', silhouette: '700', yearIntroduced: 2017 },
  'EG7490': { model: 'Yeezy Boost 350 V2 Yecheil', silhouette: '350 V2', yearIntroduced: 2019 },
  'GW1934': { model: 'Yeezy Slide Bone', silhouette: 'Slide', yearIntroduced: 2019 },
  'HP8739': { model: 'Yeezy Foam Runner', silhouette: 'Foam RNNR', yearIntroduced: 2020 },
};

/**
 * Yeezy Factory Codes
 */
export const YEEZY_FACTORY_CODES: Record<string, { location: string; notes: string }> = {
  'APE': { location: 'China (Primary)', notes: 'Most common factory code' },
  'LW': { location: 'China', notes: 'Alternative factory' },
  'PK': { location: 'China', notes: 'Some 350 V2 production' },
  'A5': { location: 'China', notes: 'Newer production runs' },
};

// ============================================================================
// VALUE DRIVERS
// ============================================================================

export const SNEAKER_VALUE_DRIVERS = [
  // Condition
  {
    name: 'Deadstock (DS)',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'deadstock',
    priceMultiplier: 1.4,
    priority: 100,
    description: 'Brand new, never worn, all original packaging',
  },
  {
    name: 'Very Near Deadstock (VNDS)',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'vnds',
    priceMultiplier: 1.15,
    priority: 95,
    description: 'Worn 1-2 times, no visible wear',
  },
  {
    name: 'Excellent Condition',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'excellent',
    priceMultiplier: 0.85,
    priority: 90,
    description: 'Light wear, no major flaws',
  },
  {
    name: 'Good Condition',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'good',
    priceMultiplier: 0.6,
    priority: 85,
    description: 'Moderate wear, some creasing',
  },
  // Packaging & Extras
  {
    name: 'OG All (Original Everything)',
    attribute: 'accessories',
    conditionType: 'contains',
    conditionValue: 'og_all',
    priceMultiplier: 1.25,
    priority: 80,
    description: 'Original box, laces, hang tags, inserts, receipt',
  },
  {
    name: 'Original Box',
    attribute: 'accessories',
    conditionType: 'contains',
    conditionValue: 'og_box',
    priceMultiplier: 1.1,
    priority: 75,
    description: 'Has original box with matching label',
  },
  {
    name: 'Extra Laces',
    attribute: 'accessories',
    conditionType: 'contains',
    conditionValue: 'extra_laces',
    priceMultiplier: 1.05,
    priority: 70,
    description: 'Includes alternate/extra laces',
  },
  {
    name: 'Special Box',
    attribute: 'box_type',
    conditionType: 'contains',
    conditionValue: 'special_box',
    priceMultiplier: 1.15,
    priority: 72,
    description: 'Special edition box (denim, wood, etc.)',
  },
  // Rarity & Collaboration
  {
    name: 'Travis Scott Collaboration',
    attribute: 'collaboration',
    conditionType: 'contains',
    conditionValue: 'travis_scott',
    priceMultiplier: 3.0,
    priority: 99,
    description: 'Cactus Jack collaboration',
  },
  {
    name: 'Off-White Collaboration',
    attribute: 'collaboration',
    conditionType: 'contains',
    conditionValue: 'off_white',
    priceMultiplier: 2.5,
    priority: 98,
    description: 'Virgil Abloh "The Ten" and subsequent releases',
  },
  {
    name: 'Fragment Design Collaboration',
    attribute: 'collaboration',
    conditionType: 'contains',
    conditionValue: 'fragment',
    priceMultiplier: 2.0,
    priority: 97,
    description: 'Hiroshi Fujiwara Fragment Design',
  },
  {
    name: 'Union LA Collaboration',
    attribute: 'collaboration',
    conditionType: 'contains',
    conditionValue: 'union',
    priceMultiplier: 1.8,
    priority: 96,
    description: 'Union LA exclusive releases',
  },
  {
    name: 'Dior Collaboration',
    attribute: 'collaboration',
    conditionType: 'contains',
    conditionValue: 'dior',
    priceMultiplier: 10.0,
    priority: 100,
    description: 'Air Dior limited luxury collaboration',
  },
  {
    name: 'Sample/Promo',
    attribute: 'release_type',
    conditionType: 'equals',
    conditionValue: 'sample',
    priceMultiplier: 3.0,
    priority: 95,
    description: 'Pre-production sample or promotional pair',
  },
  {
    name: 'Player Exclusive (PE)',
    attribute: 'release_type',
    conditionType: 'equals',
    conditionValue: 'player_exclusive',
    priceMultiplier: 5.0,
    priority: 98,
    description: 'Made exclusively for athletes, never released',
  },
  {
    name: 'Friends & Family (F&F)',
    attribute: 'release_type',
    conditionType: 'equals',
    conditionValue: 'friends_family',
    priceMultiplier: 4.0,
    priority: 97,
    description: 'Limited to friends and family of brand/artist',
  },
  // Age & Vintage
  {
    name: 'OG Release (Original Year)',
    attribute: 'release_type',
    conditionType: 'equals',
    conditionValue: 'og_release',
    priceMultiplier: 2.0,
    priority: 85,
    description: 'Original release year, not retro',
  },
  {
    name: 'Vintage (Pre-2000)',
    attribute: 'era',
    conditionType: 'equals',
    conditionValue: 'vintage',
    priceMultiplier: 1.5,
    priority: 82,
    description: 'Sneakers from before 2000',
  },
  // Size Premium
  {
    name: 'Rare Size (Small)',
    attribute: 'size_rarity',
    conditionType: 'custom',
    conditionValue: { expression: 'size in ["US4", "US4.5", "US5", "US5.5", "US14", "US15", "US16"]' },
    priceMultiplier: 1.2,
    priority: 60,
    description: 'Uncommon sizes have limited supply',
  },
  {
    name: 'Most Common Size',
    attribute: 'size_rarity',
    conditionType: 'custom',
    conditionValue: { expression: 'size in ["US9", "US9.5", "US10", "US10.5", "US11"]' },
    priceMultiplier: 1.0,
    priority: 55,
    description: 'Most common sizes, standard pricing',
  },
];

// ============================================================================
// AUTHENTICITY MARKERS
// ============================================================================

export const SNEAKER_AUTHENTICITY_MARKERS = [
  // Nike/Jordan General
  {
    name: 'Nike Style Code Format',
    pattern: '^[A-Z]{0,2}\\d{4,6}-\\d{3}$',
    patternMaxLength: 15,
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan'],
    description: 'Standard Nike/Jordan style code format (e.g., 554724-001)',
  },
  {
    name: 'Nike Modern Style Code',
    pattern: '^[A-Z]{2}\\d{4}-\\d{3}$',
    patternMaxLength: 12,
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan'],
    description: 'Modern format with letter prefix (e.g., HM4740-001)',
  },
  {
    name: 'Size Tag Font Consistency',
    pattern: 'size_tag_font_check',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan', 'Adidas'],
    description: 'Font on size tag should be consistent, not bold or irregular',
  },
  {
    name: 'Size Tag Sewn (Not Welded)',
    pattern: 'size_tag_sewn_not_welded',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan'],
    description: 'Tag should be sewn to tongue, not heat-welded (on Jordans)',
  },
  {
    name: 'Box Label Matches Shoe Label',
    pattern: 'box_shoe_label_match',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy'],
    description: 'Style code and size on box must match shoe tag',
  },
  {
    name: 'Swoosh Shape & Placement',
    pattern: 'swoosh_correct_curve',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan'],
    description: 'Swoosh should be properly curved, not too thick or straight',
  },
  {
    name: 'Stitching Quality',
    pattern: 'stitching_uniform_tight',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy'],
    description: 'Stitching should be uniform, tight, and clean',
  },
  {
    name: 'Hourglass Shape (Jordan 1)',
    pattern: 'hourglass_shape_present',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Jordan'],
    description: 'Jordan 1s should have curved hourglass shape from back view',
  },
  {
    name: 'No Chemical Smell',
    pattern: 'no_strong_chemical_odor',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy'],
    description: 'Should not have strong glue or chemical odor',
  },
  // Yeezy Specific
  {
    name: 'Yeezy Serial Unique Per Shoe',
    pattern: 'yeezy_serial_unique_lr',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Yeezy'],
    description: 'Left and right shoe must have different last 3 serial digits',
  },
  {
    name: 'Yeezy Serial Region Match',
    pattern: '^.*(V02|V03|V04|V10)$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Yeezy'],
    description: 'Serial ending must match box label region code',
  },
  {
    name: 'Yeezy Made in China',
    pattern: 'made_in_china',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Yeezy'],
    description: 'Authentic Yeezys are made in China only',
  },
  {
    name: 'Yeezy SPLY-350 Text',
    pattern: 'sply_350_correct_font',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Yeezy'],
    description: 'SPLY-350 text should be correctly spaced and sized',
  },
  {
    name: 'Yeezy Boost Pellets',
    pattern: 'boost_pellets_visible',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Yeezy'],
    description: 'Boost foam should have visible pellet texture',
  },
  {
    name: 'Yeezy Invalid Region Code',
    pattern: '^.*(V01|V05|V06|V07|V08|V09|V11)$',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Yeezy'],
    description: 'These region codes do not exist - indicates fake',
  },
  // General Red Flags
  {
    name: 'Mismatched Size Tags',
    pattern: 'left_right_size_mismatch',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy'],
    description: 'Left and right shoe have different size/style info',
  },
  {
    name: 'QR Code Invalid',
    pattern: 'qr_code_invalid_destination',
    importance: 'important',
    indicatesAuthentic: false,
    applicableBrands: ['Nike', 'Jordan', 'Adidas', 'Yeezy'],
    description: 'QR code does not link to official brand page',
  },
  {
    name: 'Wrong Country of Origin',
    pattern: 'wrong_origin_country',
    importance: 'important',
    indicatesAuthentic: false,
    applicableBrands: ['Yeezy'],
    description: 'Yeezy listed as made in Turkey/Korea/Vietnam is fake',
  },
];

// ============================================================================
// DECODER DEFINITIONS
// ============================================================================

export const SNEAKER_DECODERS = [
  {
    name: 'Nike Style Code Decoder',
    identifierType: 'style_code',
    description: 'Decodes Nike/Jordan style codes to identify model and colorway',
    inputPattern: '^[A-Z]{0,2}\\d{4,6}-\\d{3}$',
    inputMaxLength: 15,
    extractionRules: [
      {
        name: 'Category Code',
        pattern: '^[A-Z]{0,2}(\\d)',
        method: 'category_lookup',
      },
      {
        name: 'Model Code',
        pattern: '^[A-Z]{0,2}(\\d{4,6})',
        method: 'model_lookup',
      },
      {
        name: 'Color Code',
        pattern: '-(\\d{3})$',
        method: 'color_lookup',
      },
    ],
    outputFields: ['model', 'colorway', 'category', 'primary_color'],
    baseConfidence: 0.9,
    priority: 100,
    testCases: [
      {
        input: '554724-001',
        expected: { model: 'Air Jordan 1 High OG', primary_color: 'Black' },
      },
      {
        input: '554724-101',
        expected: { model: 'Air Jordan 1 High OG', primary_color: 'White' },
      },
    ],
  },
  {
    name: 'Yeezy Style Code Decoder',
    identifierType: 'style_code',
    description: 'Decodes Adidas Yeezy style codes',
    inputPattern: '^[A-Z]{1,2}\\d{4,5}$',
    inputMaxLength: 8,
    extractionRules: [
      {
        name: 'Model Series',
        pattern: '^([A-Z]{1,2})',
        method: 'yeezy_model_lookup',
      },
      {
        name: 'Model Number',
        pattern: '^[A-Z]{1,2}(\\d{4,5})$',
        method: 'yeezy_variant_lookup',
      },
    ],
    outputFields: ['model', 'silhouette', 'colorway'],
    baseConfidence: 0.85,
    priority: 90,
    testCases: [
      {
        input: 'CP9654',
        expected: { model: 'Yeezy Boost 350 V2 Zebra', silhouette: '350 V2' },
      },
    ],
  },
  {
    name: 'Yeezy Serial Number Validator',
    identifierType: 'serial_number',
    description: 'Validates Yeezy serial number format and region',
    inputPattern: '^.{10,13}(V02|V03|V04|V10)$',
    inputMaxLength: 17,
    extractionRules: [
      {
        name: 'Region Code',
        pattern: '(V02|V03|V04|V10)$',
        method: 'region_lookup',
      },
      {
        name: 'Unique Identifier',
        pattern: '^(.{10,13})',
        method: 'serial_validation',
      },
    ],
    outputFields: ['region', 'market', 'valid'],
    baseConfidence: 0.95,
    priority: 95,
    testCases: [
      {
        input: 'ABC123456789V10',
        expected: { region: 'International', valid: true },
      },
    ],
  },
  {
    name: 'Nike Color Code Decoder',
    identifierType: 'color_code',
    description: 'Decodes 3-digit Nike color codes',
    inputPattern: '^\\d{3}$',
    inputMaxLength: 3,
    extractionRules: [
      {
        name: 'Primary Color',
        pattern: '^(\\d)',
        method: 'primary_color_lookup',
      },
      {
        name: 'Secondary Color',
        pattern: '^\\d(\\d)',
        method: 'secondary_color_lookup',
      },
      {
        name: 'Variation',
        pattern: '^\\d{2}(\\d)$',
        method: 'variation_number',
      },
    ],
    outputFields: ['primary_color', 'secondary_color', 'variation', 'colorway_name'],
    baseConfidence: 0.8,
    priority: 70,
    testCases: [
      {
        input: '001',
        expected: { primary_color: 'Black', colorway_name: 'Black/White' },
      },
      {
        input: '101',
        expected: { primary_color: 'White', colorway_name: 'White/Black' },
      },
    ],
  },
];

// ============================================================================
// LOOKUP TABLES
// ============================================================================

export const SNEAKER_LOOKUP_TABLES = {
  nike_style_codes: {
    name: 'Nike Style Codes',
    description: 'Style code to model name mapping',
    keyField: 'style_code',
    valueSchema: { model: 'string', year: 'number', category: 'string' },
  },
  nike_color_codes: {
    name: 'Nike Color Codes',
    description: '3-digit color code to colorway name mapping',
    keyField: 'color_code',
    valueSchema: { colorway: 'string', primary: 'string', secondary: 'string' },
  },
  jordan_colorways: {
    name: 'Jordan Iconic Colorways',
    description: 'Famous Jordan colorway names and style codes',
    keyField: 'nickname',
    valueSchema: { official_name: 'string', style_code: 'string', year: 'number' },
  },
  yeezy_models: {
    name: 'Yeezy Model Codes',
    description: 'Yeezy style code to model mapping',
    keyField: 'style_code',
    valueSchema: { model: 'string', silhouette: 'string', year: 'number' },
  },
  yeezy_region_codes: {
    name: 'Yeezy Region Codes',
    description: 'Serial number suffix to region mapping',
    keyField: 'code',
    valueSchema: { region: 'string', sizes_displayed: 'array' },
  },
};

// ============================================================================
// COLLABORATION REFERENCE
// ============================================================================

export const NOTABLE_COLLABORATIONS: Record<string, {
  partner: string;
  brand: string;
  models: string[];
  era: string;
  valuePremium: number;
}> = {
  'travis_scott': {
    partner: 'Travis Scott / Cactus Jack',
    brand: 'Nike/Jordan',
    models: ['Air Jordan 1 High OG', 'Air Jordan 4', 'Air Jordan 6', 'Dunk Low', 'Air Max 1'],
    era: '2017-Present',
    valuePremium: 3.0,
  },
  'off_white': {
    partner: 'Off-White / Virgil Abloh',
    brand: 'Nike',
    models: ['Air Jordan 1', 'Air Presto', 'Air Max 90', 'Dunk Low', 'Air Force 1'],
    era: '2017-2023',
    valuePremium: 2.5,
  },
  'fragment': {
    partner: 'Fragment Design / Hiroshi Fujiwara',
    brand: 'Nike/Jordan',
    models: ['Air Jordan 1', 'Dunk High', 'Air Trainer 1'],
    era: '2014-Present',
    valuePremium: 2.0,
  },
  'union_la': {
    partner: 'Union LA / Chris Gibbs',
    brand: 'Jordan',
    models: ['Air Jordan 1', 'Air Jordan 4', 'Air Jordan 2'],
    era: '2018-Present',
    valuePremium: 1.8,
  },
  'sacai': {
    partner: 'sacai / Chitose Abe',
    brand: 'Nike',
    models: ['LDWaffle', 'Blazer', 'VaporWaffle', 'Cortez'],
    era: '2019-Present',
    valuePremium: 1.5,
  },
  'dior': {
    partner: 'Dior',
    brand: 'Jordan',
    models: ['Air Jordan 1 High OG'],
    era: '2020',
    valuePremium: 10.0,
  },
  'eminem': {
    partner: 'Eminem / Shady Records',
    brand: 'Jordan',
    models: ['Air Jordan 4'],
    era: '2015-2018',
    valuePremium: 15.0,
  },
};
