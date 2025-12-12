/**
 * Trading Cards Domain Expertise Data
 *
 * Production-ready reference data for grading and valuing trading cards.
 * Covers Pokemon, Sports Cards (Topps, Panini), Magic: The Gathering,
 * and other collectible trading cards.
 *
 * Sources:
 * - PSA (https://www.psacard.com)
 * - BGS Beckett (https://www.beckett.com)
 * - CGC Cards (https://www.cgccards.com)
 * - Cardboard Connection
 * - Sports Card Investor
 */

// ============================================================================
// GRADING COMPANY SCALES
// ============================================================================

/**
 * PSA Grading Scale (1-10, whole numbers only)
 * PSA is the largest and most recognized grading company
 */
export const PSA_GRADING_SCALE: Array<{
  grade: number;
  name: string;
  description: string;
  centering: string;
  corners: string;
  edges: string;
  surface: string;
  priceMultiplier: number;
}> = [
  {
    grade: 10,
    name: 'Gem Mint',
    description: 'Virtually perfect card with sharp corners, original gloss, and perfect centering',
    centering: '55/45 or better front, 60/40 or better back',
    corners: 'Perfect to the naked eye',
    edges: 'Perfect to the naked eye',
    surface: 'No print spots, perfect gloss',
    priceMultiplier: 10.0,
  },
  {
    grade: 9,
    name: 'Mint',
    description: 'Superb condition with only one minor flaw',
    centering: '55/45 or better front, 60/40 or better back',
    corners: 'Mint with one minor flaw',
    edges: 'Mint with one minor flaw',
    surface: 'Minor printing imperfection allowed',
    priceMultiplier: 5.0,
  },
  {
    grade: 8,
    name: 'Near Mint-Mint',
    description: 'Near perfect with slight fraying on corners or minor print imperfection',
    centering: '60/40 or better front, 65/35 or better back',
    corners: 'Slight fraying on one or two corners',
    edges: 'Slight roughness',
    surface: 'Minor printing defects',
    priceMultiplier: 3.0,
  },
  {
    grade: 7,
    name: 'Near Mint',
    description: 'Slight surface wear visible upon close inspection',
    centering: '65/35 or better front, 70/30 or better back',
    corners: 'Slight fraying',
    edges: 'Light roughness',
    surface: 'Minor gloss loss',
    priceMultiplier: 2.0,
  },
  {
    grade: 6,
    name: 'Excellent-Mint',
    description: 'Visible surface wear or printing defects',
    centering: '70/30 or better front, 75/25 or better back',
    corners: 'Fuzzy corners',
    edges: 'Roughness',
    surface: 'Light scratches or print defects',
    priceMultiplier: 1.5,
  },
  {
    grade: 5,
    name: 'Excellent',
    description: 'Minor rounding of corners, surface wear visible',
    centering: '75/25 or better front, 80/20 or better back',
    corners: 'Minor rounding',
    edges: 'Noticeable roughness',
    surface: 'Some loss of original gloss',
    priceMultiplier: 1.2,
  },
  {
    grade: 4,
    name: 'Very Good-Excellent',
    description: 'Rounding on corners, surface scratches',
    centering: '80/20 or better front, 85/15 or better back',
    corners: 'Some rounding',
    edges: 'Visible wear',
    surface: 'Surface wear visible',
    priceMultiplier: 1.0,
  },
  {
    grade: 3,
    name: 'Very Good',
    description: 'Corners show notable wear, light creases may be visible',
    centering: '85/15 or better front, 90/10 or better back',
    corners: 'Rounded',
    edges: 'Heavy wear',
    surface: 'Creases may be present',
    priceMultiplier: 0.7,
  },
  {
    grade: 2,
    name: 'Good',
    description: 'Heavily rounded corners, creases, discoloration',
    centering: '90/10 or better',
    corners: 'Heavily rounded',
    edges: 'Heavy wear',
    surface: 'Creases, staining',
    priceMultiplier: 0.4,
  },
  {
    grade: 1.5,
    name: 'Fair',
    description: 'Significant defects, pronounced wear, may have creases',
    centering: 'Severely off-center',
    corners: 'Very rounded or damaged',
    edges: 'Major wear',
    surface: 'Soiled or stained',
    priceMultiplier: 0.25,
  },
  {
    grade: 1,
    name: 'Poor',
    description: 'Heavily played, significant damage, still complete',
    centering: 'Miscut or extremely off-center',
    corners: 'Major damage',
    edges: 'Major damage',
    surface: 'Heavy creases, tears, or staining',
    priceMultiplier: 0.1,
  },
];

/**
 * BGS/Beckett Grading Scale (1-10 with half-grades and subgrades)
 * BGS uniquely shows four subgrades on the label
 */
export const BGS_GRADING_SCALE: Array<{
  grade: number;
  name: string;
  labelColor: string;
  description: string;
  subgradeRequirements: string;
  priceMultiplier: number;
}> = [
  {
    grade: 10,
    name: 'Pristine (Black Label)',
    labelColor: 'Black',
    description: 'All four subgrades must be 10. Extremely rare and most valuable.',
    subgradeRequirements: 'Centering 10, Corners 10, Edges 10, Surface 10',
    priceMultiplier: 25.0,
  },
  {
    grade: 10,
    name: 'Pristine',
    labelColor: 'Gold',
    description: 'Overall 10 but not all subgrades are 10',
    subgradeRequirements: 'At least 10 overall with mixed 9.5/10 subgrades',
    priceMultiplier: 15.0,
  },
  {
    grade: 9.5,
    name: 'Gem Mint',
    labelColor: 'Gold',
    description: 'Near-perfect card, gold label designation',
    subgradeRequirements: 'At least three 9.5s, fourth no less than 9',
    priceMultiplier: 8.0,
  },
  {
    grade: 9,
    name: 'Mint',
    labelColor: 'Silver',
    description: 'Excellent condition with minor flaws',
    subgradeRequirements: 'Average of subgrades equals 9',
    priceMultiplier: 4.0,
  },
  {
    grade: 8.5,
    name: 'Near Mint-Mint+',
    labelColor: 'Silver',
    description: 'Very good condition with slight imperfections',
    subgradeRequirements: 'Average of subgrades equals 8.5',
    priceMultiplier: 2.5,
  },
  {
    grade: 8,
    name: 'Near Mint-Mint',
    labelColor: 'Silver',
    description: 'Good condition with visible minor flaws',
    subgradeRequirements: 'Average of subgrades equals 8',
    priceMultiplier: 2.0,
  },
  {
    grade: 7.5,
    name: 'Near Mint+',
    labelColor: 'Silver',
    description: 'Slight wear visible',
    subgradeRequirements: 'Average of subgrades equals 7.5',
    priceMultiplier: 1.5,
  },
  {
    grade: 7,
    name: 'Near Mint',
    labelColor: 'Silver',
    description: 'Moderate wear visible',
    subgradeRequirements: 'Average of subgrades equals 7',
    priceMultiplier: 1.3,
  },
];

/**
 * BGS Subgrade Categories and Requirements for 10
 */
export const BGS_SUBGRADE_REQUIREMENTS: Record<string, {
  subgrade: string;
  requirement10: string;
  requirement95: string;
  weight: string;
}> = {
  centering: {
    subgrade: 'Centering',
    requirement10: '50/50 front and 60/40 or better back',
    requirement95: '55/45 front and 65/35 or better back',
    weight: 'Heavily weighted in final grade calculation',
  },
  corners: {
    subgrade: 'Corners',
    requirement10: 'Perfect to naked eye, Mint under magnification',
    requirement95: 'Near-perfect with minimal wear under magnification',
    weight: 'Critical - lowest corner pulls down grade significantly',
  },
  edges: {
    subgrade: 'Edges',
    requirement10: 'Perfect to naked eye, virtually flaw-free under magnification',
    requirement95: 'Near-perfect with minimal chipping or roughness',
    weight: 'Important - edge damage highly visible',
  },
  surface: {
    subgrade: 'Surface',
    requirement10: 'No print spots, perfect gloss, no scratches or metallic print lines',
    requirement95: 'Minimal flaws, excellent gloss retention',
    weight: 'Critical for holofoil/refractor cards',
  },
};

/**
 * CGC Cards Grading Scale (post-July 2023 merger with CSG)
 */
export const CGC_GRADING_SCALE: Array<{
  grade: number;
  name: string;
  labelColor: string;
  description: string;
  requirements: string;
  priceMultiplier: number;
}> = [
  {
    grade: 10,
    name: 'Pristine',
    labelColor: 'Gold',
    description: 'Virtually flawless under 10x magnification. Highest possible grade.',
    requirements: 'Centering 50/50, flawless under magnification',
    priceMultiplier: 12.0,
  },
  {
    grade: 10,
    name: 'Gem Mint',
    labelColor: 'Silver',
    description: 'Perfect to naked eye, Mint+ under 10x magnification',
    requirements: 'Centering 55/45 front, 75/25 back, virtually perfect',
    priceMultiplier: 8.0,
  },
  {
    grade: 9.5,
    name: 'Mint+',
    labelColor: 'Silver',
    description: 'Near-perfect with minimal flaws',
    requirements: 'Centering 60/40 front, 75/25 back',
    priceMultiplier: 4.0,
  },
  {
    grade: 9,
    name: 'Mint',
    labelColor: 'Silver',
    description: 'Excellent condition with one minor flaw',
    requirements: 'Centering 65/35 front, 80/20 back',
    priceMultiplier: 2.5,
  },
  {
    grade: 8.5,
    name: 'Near Mint-Mint+',
    labelColor: 'Silver',
    description: 'Very good condition',
    requirements: 'Centering 70/30 front, 85/15 back',
    priceMultiplier: 1.8,
  },
  {
    grade: 8,
    name: 'Near Mint-Mint',
    labelColor: 'Silver',
    description: 'Good condition with visible minor flaws',
    requirements: 'Centering 75/25 front, 90/10 back',
    priceMultiplier: 1.5,
  },
];

// ============================================================================
// POKEMON CARD ERAS & EDITIONS
// ============================================================================

/**
 * Pokemon Base Set Editions (Critical for Value)
 */
export const POKEMON_BASE_SET_EDITIONS: Array<{
  edition: string;
  identifier: string;
  years: string;
  characteristics: string[];
  rarity: string;
  valueMultiplier: number;
}> = [
  {
    edition: '1st Edition Shadowless',
    identifier: '1st Edition stamp + No shadow',
    years: '1999',
    characteristics: [
      '1st Edition stamp on left side of artwork',
      'No drop shadow on right side of art box',
      'Copyright: 1995, 96, 98, 99',
      'Lighter color tones',
    ],
    rarity: 'Extremely Rare',
    valueMultiplier: 50.0,
  },
  {
    edition: 'Shadowless',
    identifier: 'No stamp + No shadow',
    years: '1999',
    characteristics: [
      'No 1st Edition stamp',
      'No drop shadow on right side of art box',
      'Copyright: 1995, 96, 98, 99',
      'Same print quality as 1st Edition',
    ],
    rarity: 'Very Rare',
    valueMultiplier: 15.0,
  },
  {
    edition: 'Unlimited',
    identifier: 'Shadow present',
    years: '1999-2000',
    characteristics: [
      'No 1st Edition stamp',
      'Drop shadow visible on right side of art box',
      'Copyright: 1995, 96, 98 (no 99)',
      'Most common Base Set printing',
    ],
    rarity: 'Common',
    valueMultiplier: 1.0,
  },
  {
    edition: '4th Print/UK Print',
    identifier: 'Shadow + 1999-2000 copyright',
    years: '2000',
    characteristics: [
      'Drop shadow present',
      'Copyright includes 2000',
      'Printed for international markets',
    ],
    rarity: 'Uncommon',
    valueMultiplier: 0.8,
  },
];

/**
 * Pokemon Holo Patterns by Era
 */
export const POKEMON_HOLO_PATTERNS: Record<string, {
  name: string;
  era: string;
  description: string;
  valuePremium: number;
}> = {
  galaxy_star: {
    name: 'Galaxy Star / Cosmos',
    era: '1999-2003 (WOTC)',
    description: 'Stars that change and shimmer when card is tilted',
    valuePremium: 1.0,
  },
  vintage_wotc: {
    name: 'Vintage WOTC Holo',
    era: '1999-2003',
    description: 'Classic Wizards of the Coast holographic pattern',
    valuePremium: 1.5,
  },
  reverse_holo: {
    name: 'Reverse Holo',
    era: '2002-Present',
    description: 'Holographic effect on card body, not artwork',
    valuePremium: 0.5,
  },
  full_art: {
    name: 'Full Art',
    era: '2011-Present',
    description: 'Artwork extends to card edges',
    valuePremium: 2.0,
  },
  secret_rare: {
    name: 'Secret Rare',
    era: '2012-Present',
    description: 'Card number exceeds set total (e.g., 101/100)',
    valuePremium: 3.0,
  },
  gold_star: {
    name: 'Gold Star',
    era: '2004-2007',
    description: 'Gold star next to Pokemon name, extremely rare',
    valuePremium: 10.0,
  },
  illustration_rare: {
    name: 'Illustration Rare',
    era: '2023-Present',
    description: 'Special artwork illustration cards',
    valuePremium: 4.0,
  },
  special_art_rare: {
    name: 'Special Art Rare (SAR)',
    era: '2023-Present',
    description: 'Full bleed alternate artwork',
    valuePremium: 5.0,
  },
};

// ============================================================================
// SPORTS CARDS DATA
// ============================================================================

/**
 * Topps Chrome/Refractor Parallel Hierarchy
 */
export const TOPPS_CHROME_PARALLELS: Array<{
  parallel: string;
  printRun: string;
  description: string;
  rarityTier: number;
  valueMultiplier: number;
}> = [
  {
    parallel: 'Superfractor',
    printRun: '1/1',
    description: 'One-of-one gold refractor',
    rarityTier: 1,
    valueMultiplier: 100.0,
  },
  {
    parallel: 'Red Refractor',
    printRun: '/5',
    description: 'Red tinted refractor, 5 copies',
    rarityTier: 2,
    valueMultiplier: 25.0,
  },
  {
    parallel: 'Gold Refractor',
    printRun: '/50',
    description: 'Gold tinted refractor, 50 copies',
    rarityTier: 3,
    valueMultiplier: 10.0,
  },
  {
    parallel: 'Orange Refractor',
    printRun: '/25',
    description: 'Orange tinted refractor',
    rarityTier: 3,
    valueMultiplier: 12.0,
  },
  {
    parallel: 'X-Fractor',
    printRun: '/288',
    description: 'X-pattern refractor',
    rarityTier: 4,
    valueMultiplier: 3.0,
  },
  {
    parallel: 'Prism Refractor',
    printRun: 'Varies',
    description: 'Prism light refraction pattern',
    rarityTier: 4,
    valueMultiplier: 2.5,
  },
  {
    parallel: 'Refractor',
    printRun: '1:12 packs',
    description: 'Standard rainbow refractor',
    rarityTier: 5,
    valueMultiplier: 2.0,
  },
  {
    parallel: 'Base Chrome',
    printRun: 'Unlimited',
    description: 'Standard chromium card',
    rarityTier: 6,
    valueMultiplier: 1.0,
  },
];

/**
 * Panini Prizm Parallel Hierarchy
 */
export const PANINI_PRIZM_PARALLELS: Array<{
  parallel: string;
  printRun: string;
  description: string;
  rarityTier: number;
  valueMultiplier: number;
}> = [
  {
    parallel: 'Gold Vinyl',
    printRun: '1/1',
    description: 'One-of-one gold vinyl surface',
    rarityTier: 1,
    valueMultiplier: 100.0,
  },
  {
    parallel: 'Black Finite',
    printRun: '1/1',
    description: 'One-of-one black parallel',
    rarityTier: 1,
    valueMultiplier: 80.0,
  },
  {
    parallel: 'Gold Prizm',
    printRun: '/10',
    description: 'Gold shimmer, 10 copies',
    rarityTier: 2,
    valueMultiplier: 30.0,
  },
  {
    parallel: 'Green Prizm',
    printRun: '/75',
    description: 'Green shimmer',
    rarityTier: 3,
    valueMultiplier: 8.0,
  },
  {
    parallel: 'Blue Prizm',
    printRun: '/199',
    description: 'Blue shimmer',
    rarityTier: 4,
    valueMultiplier: 4.0,
  },
  {
    parallel: 'Silver Prizm',
    printRun: '1:4 packs',
    description: 'Standard silver shimmer',
    rarityTier: 5,
    valueMultiplier: 2.0,
  },
  {
    parallel: 'Base',
    printRun: 'Unlimited',
    description: 'Standard base card',
    rarityTier: 6,
    valueMultiplier: 1.0,
  },
];

/**
 * Rookie Card Designation Types
 */
export const ROOKIE_CARD_DESIGNATIONS: Record<string, {
  designation: string;
  description: string;
  valuePremium: number;
}> = {
  rc: {
    designation: 'RC',
    description: 'Official Rookie Card designation',
    valuePremium: 5.0,
  },
  xrc: {
    designation: 'XRC',
    description: 'Extended Rookie Card (non-licensed set)',
    valuePremium: 2.0,
  },
  pre_rookie: {
    designation: 'Pre-Rookie',
    description: 'Card before official MLB/NBA debut',
    valuePremium: 1.5,
  },
  prospect: {
    designation: 'Prospect',
    description: 'Minor league/pre-debut prospect card',
    valuePremium: 1.2,
  },
};

// ============================================================================
// VALUE DRIVERS
// ============================================================================

export const TRADING_CARD_VALUE_DRIVERS = [
  // Grading
  {
    name: 'PSA 10 Gem Mint',
    attribute: 'grade',
    conditionType: 'equals',
    conditionValue: 'PSA_10',
    priceMultiplier: 10.0,
    priority: 100,
    description: 'Highest PSA grade, significant premium',
  },
  {
    name: 'BGS 10 Black Label',
    attribute: 'grade',
    conditionType: 'equals',
    conditionValue: 'BGS_10_BLACK',
    priceMultiplier: 25.0,
    priority: 100,
    description: 'All four subgrades 10, extremely rare',
  },
  {
    name: 'BGS 9.5 Gem Mint',
    attribute: 'grade',
    conditionType: 'equals',
    conditionValue: 'BGS_9.5',
    priceMultiplier: 8.0,
    priority: 95,
    description: 'Gold label BGS Gem Mint',
  },
  {
    name: 'CGC Pristine 10',
    attribute: 'grade',
    conditionType: 'equals',
    conditionValue: 'CGC_PRISTINE_10',
    priceMultiplier: 12.0,
    priority: 98,
    description: 'Highest CGC grade',
  },
  {
    name: 'Raw Near Mint',
    attribute: 'grade',
    conditionType: 'equals',
    conditionValue: 'raw_nm',
    priceMultiplier: 1.0,
    priority: 50,
    description: 'Ungraded, near mint condition',
  },
  // Edition & Print Run
  {
    name: '1st Edition (Pokemon)',
    attribute: 'edition',
    conditionType: 'equals',
    conditionValue: '1st_edition',
    priceMultiplier: 50.0,
    priority: 98,
    applicableTo: ['Pokemon'],
    description: 'First print run with 1st Edition stamp',
  },
  {
    name: 'Shadowless (Pokemon)',
    attribute: 'edition',
    conditionType: 'equals',
    conditionValue: 'shadowless',
    priceMultiplier: 15.0,
    priority: 95,
    applicableTo: ['Pokemon'],
    description: 'No shadow, second most valuable Base Set print',
  },
  {
    name: 'Superfractor (1/1)',
    attribute: 'parallel',
    conditionType: 'equals',
    conditionValue: 'superfractor',
    priceMultiplier: 100.0,
    priority: 100,
    applicableTo: ['Sports'],
    description: 'One-of-one rarest parallel',
  },
  {
    name: 'Gold Refractor (/50)',
    attribute: 'parallel',
    conditionType: 'equals',
    conditionValue: 'gold_refractor',
    priceMultiplier: 10.0,
    priority: 90,
    applicableTo: ['Sports'],
    description: 'Gold numbered refractor',
  },
  {
    name: 'Standard Refractor',
    attribute: 'parallel',
    conditionType: 'equals',
    conditionValue: 'refractor',
    priceMultiplier: 2.0,
    priority: 70,
    applicableTo: ['Sports'],
    description: 'Base refractor parallel',
  },
  // Card Type
  {
    name: 'Rookie Card (RC)',
    attribute: 'card_type',
    conditionType: 'equals',
    conditionValue: 'rookie',
    priceMultiplier: 5.0,
    priority: 85,
    applicableTo: ['Sports'],
    description: 'Official rookie card of player',
  },
  {
    name: 'Auto (Autograph)',
    attribute: 'card_type',
    conditionType: 'contains',
    conditionValue: 'autograph',
    priceMultiplier: 3.0,
    priority: 82,
    description: 'Contains player autograph',
  },
  {
    name: 'Patch/Relic Card',
    attribute: 'card_type',
    conditionType: 'contains',
    conditionValue: 'patch',
    priceMultiplier: 2.0,
    priority: 78,
    applicableTo: ['Sports'],
    description: 'Contains game-worn material',
  },
  {
    name: 'RPM (Rookie Patch Auto)',
    attribute: 'card_type',
    conditionType: 'equals',
    conditionValue: 'rookie_patch_auto',
    priceMultiplier: 8.0,
    priority: 90,
    applicableTo: ['Sports'],
    description: 'Rookie card with patch and autograph',
  },
  // Special Cards
  {
    name: 'Gold Star (Pokemon)',
    attribute: 'rarity',
    conditionType: 'equals',
    conditionValue: 'gold_star',
    priceMultiplier: 10.0,
    priority: 92,
    applicableTo: ['Pokemon'],
    description: 'Extremely rare gold star variant',
  },
  {
    name: 'Secret Rare',
    attribute: 'rarity',
    conditionType: 'equals',
    conditionValue: 'secret_rare',
    priceMultiplier: 3.0,
    priority: 80,
    applicableTo: ['Pokemon', 'Yu-Gi-Oh'],
    description: 'Card number exceeds set size',
  },
  {
    name: 'Full Art',
    attribute: 'card_style',
    conditionType: 'equals',
    conditionValue: 'full_art',
    priceMultiplier: 2.0,
    priority: 75,
    description: 'Extended artwork to card edges',
  },
  // Vintage & Era
  {
    name: 'Vintage (Pre-1980)',
    attribute: 'era',
    conditionType: 'equals',
    conditionValue: 'vintage',
    priceMultiplier: 3.0,
    priority: 85,
    applicableTo: ['Sports'],
    description: 'Pre-1980 cards are considered vintage',
  },
  {
    name: 'WOTC Era (Pokemon)',
    attribute: 'era',
    conditionType: 'equals',
    conditionValue: 'wotc',
    priceMultiplier: 2.0,
    priority: 80,
    applicableTo: ['Pokemon'],
    description: '1999-2003 Wizards of the Coast era',
  },
  {
    name: 'Alpha/Beta (MTG)',
    attribute: 'set',
    conditionType: 'custom',
    conditionValue: { expression: 'set in ["alpha", "beta"]' },
    priceMultiplier: 20.0,
    priority: 95,
    applicableTo: ['Magic: The Gathering'],
    description: 'First MTG print runs, extremely valuable',
  },
];

// ============================================================================
// AUTHENTICITY MARKERS
// ============================================================================

export const TRADING_CARD_AUTHENTICITY_MARKERS = [
  // Pokemon General
  {
    name: 'Pokemon Black Core Layer',
    pattern: 'black_core_visible',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: 'Black layer visible when card edge is examined',
  },
  {
    name: 'Pokemon 1st Edition Stamp',
    pattern: '1st_edition_stamp_correct_position',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: '1st Edition stamp in correct position outside left of artwork',
  },
  {
    name: 'Pokemon Shadowless Characteristics',
    pattern: 'no_shadow_correct_copyright',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: 'No shadow AND correct 1995,96,98,99 copyright',
  },
  {
    name: 'Pokemon Galaxy Star Holo Pattern',
    pattern: 'galaxy_star_holo_genuine',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: 'Genuine WOTC galaxy star holographic pattern',
  },
  {
    name: 'Pokemon Font Consistency',
    pattern: 'font_matches_authentic_examples',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: 'Font style and size match known authentic cards',
  },
  {
    name: 'Pokemon Texture/Feel',
    pattern: 'card_texture_genuine',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Pokemon'],
    description: 'Card has proper texture and weight',
  },
  // Fake Indicators
  {
    name: 'Oversaturated Colors',
    pattern: 'colors_too_saturated',
    importance: 'important',
    indicatesAuthentic: false,
    applicableBrands: ['Pokemon', 'Sports', 'Magic: The Gathering'],
    description: 'Colors appear too dark or oversaturated compared to authentic',
  },
  {
    name: 'Missing Black Core',
    pattern: 'no_black_core_layer',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Pokemon'],
    description: 'No black layer visible at card edge - definite fake',
  },
  {
    name: 'Wrong Copyright Date',
    pattern: 'copyright_date_incorrect',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Pokemon'],
    description: 'Copyright dates don\'t match edition type',
  },
  {
    name: 'Photoshopped Shadow Removal',
    pattern: 'manipulated_shadowless',
    importance: 'critical',
    indicatesAuthentic: false,
    applicableBrands: ['Pokemon'],
    description: 'Shadow digitally removed from Unlimited print',
  },
  // Sports Cards
  {
    name: 'Refractor Light Pattern',
    pattern: 'refractor_rainbow_genuine',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Sports'],
    description: 'Genuine rainbow refraction when tilted',
  },
  {
    name: 'Serial Number Format',
    pattern: '^\\d+/\\d+$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Sports'],
    description: 'Proper serial number format for numbered cards',
  },
  {
    name: 'Auto Consistency',
    pattern: 'autograph_matches_known_examples',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Sports'],
    description: 'Autograph consistent with known authentic examples',
  },
  // Graded Card Verification
  {
    name: 'PSA Case Genuine',
    pattern: 'psa_case_features_correct',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['All'],
    description: 'PSA case has correct hologram, label, and case features',
  },
  {
    name: 'PSA Cert Number Verifiable',
    pattern: '^\\d{8,10}$',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['All'],
    description: 'PSA certification number verifies on PSA website',
  },
  {
    name: 'BGS Case Genuine',
    pattern: 'bgs_case_subgrades_correct',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['All'],
    description: 'BGS case with correct subgrade label and features',
  },
];

// ============================================================================
// DECODER DEFINITIONS
// ============================================================================

export const TRADING_CARD_DECODERS = [
  {
    name: 'PSA Certification Decoder',
    identifierType: 'cert_number',
    description: 'Verifies and decodes PSA certification numbers',
    inputPattern: '^\\d{8,10}$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Cert Verification',
        pattern: '^(\\d{8,10})$',
        method: 'psa_api_lookup',
      },
    ],
    outputFields: ['card_name', 'set', 'year', 'grade', 'population'],
    baseConfidence: 0.95,
    priority: 100,
    testCases: [
      {
        input: '12345678',
        expected: { valid: true },
      },
    ],
  },
  {
    name: 'Pokemon Edition Identifier',
    identifierType: 'edition',
    description: 'Identifies Pokemon card edition from characteristics',
    inputPattern: '^(1st_shadowless|shadowless|unlimited|4th_print)$',
    inputMaxLength: 15,
    extractionRules: [
      {
        name: '1st Edition Check',
        pattern: '1st_edition_stamp',
        method: 'stamp_present_check',
      },
      {
        name: 'Shadow Check',
        pattern: 'shadow_present',
        method: 'shadow_visual_check',
      },
      {
        name: 'Copyright Check',
        pattern: 'copyright_years',
        method: 'copyright_validation',
      },
    ],
    outputFields: ['edition', 'year_range', 'value_multiplier'],
    baseConfidence: 0.9,
    priority: 95,
    testCases: [
      {
        input: '1st_shadowless',
        expected: { edition: '1st Edition Shadowless', value_multiplier: 50.0 },
      },
    ],
  },
  {
    name: 'Sports Card Parallel Identifier',
    identifierType: 'parallel',
    description: 'Identifies Topps Chrome/Prizm parallel type',
    inputPattern: '^(superfractor|gold|red|orange|blue|silver|base)_?(refractor|prizm)?$',
    inputMaxLength: 20,
    extractionRules: [
      {
        name: 'Color Identification',
        pattern: '^(\\w+)_',
        method: 'color_lookup',
      },
      {
        name: 'Type Identification',
        pattern: '_(refractor|prizm)$',
        method: 'type_lookup',
      },
    ],
    outputFields: ['parallel_name', 'print_run', 'rarity_tier', 'value_multiplier'],
    baseConfidence: 0.85,
    priority: 90,
    testCases: [
      {
        input: 'gold_refractor',
        expected: { parallel_name: 'Gold Refractor', print_run: '/50' },
      },
    ],
  },
  {
    name: 'Grading Result Decoder',
    identifierType: 'grade',
    description: 'Parses grading results to standard format',
    inputPattern: '^(PSA|BGS|CGC)\\s*\\d+(\\.5)?$',
    inputMaxLength: 15,
    extractionRules: [
      {
        name: 'Company',
        pattern: '^(PSA|BGS|CGC)',
        method: 'company_lookup',
      },
      {
        name: 'Grade',
        pattern: '(\\d+(\\.5)?)$',
        method: 'grade_parse',
      },
    ],
    outputFields: ['company', 'grade', 'grade_name', 'value_multiplier'],
    baseConfidence: 0.95,
    priority: 85,
    testCases: [
      {
        input: 'PSA 10',
        expected: { company: 'PSA', grade: 10, grade_name: 'Gem Mint' },
      },
      {
        input: 'BGS 9.5',
        expected: { company: 'BGS', grade: 9.5, grade_name: 'Gem Mint' },
      },
    ],
  },
];

// ============================================================================
// LOOKUP TABLES
// ============================================================================

export const TRADING_CARD_LOOKUP_TABLES = {
  psa_grades: {
    name: 'PSA Grading Scale',
    description: 'PSA grade to description and value multiplier',
    keyField: 'grade',
    valueSchema: { name: 'string', description: 'string', multiplier: 'number' },
  },
  bgs_grades: {
    name: 'BGS Grading Scale',
    description: 'BGS grade with subgrade requirements',
    keyField: 'grade',
    valueSchema: { name: 'string', label_color: 'string', multiplier: 'number' },
  },
  cgc_grades: {
    name: 'CGC Grading Scale',
    description: 'CGC grade to description and value multiplier',
    keyField: 'grade',
    valueSchema: { name: 'string', description: 'string', multiplier: 'number' },
  },
  pokemon_editions: {
    name: 'Pokemon Base Set Editions',
    description: 'Edition identifier to characteristics',
    keyField: 'edition',
    valueSchema: { identifier: 'string', years: 'string', multiplier: 'number' },
  },
  topps_chrome_parallels: {
    name: 'Topps Chrome Parallels',
    description: 'Parallel name to print run and rarity',
    keyField: 'parallel',
    valueSchema: { print_run: 'string', tier: 'number', multiplier: 'number' },
  },
  panini_prizm_parallels: {
    name: 'Panini Prizm Parallels',
    description: 'Prizm parallel to print run and rarity',
    keyField: 'parallel',
    valueSchema: { print_run: 'string', tier: 'number', multiplier: 'number' },
  },
};

// ============================================================================
// NOTABLE CARD REFERENCES
// ============================================================================

export const ICONIC_CARDS: Record<string, {
  card: string;
  set: string;
  year: number;
  significance: string;
  category: string;
}> = {
  // Pokemon
  charizard_base: {
    card: 'Charizard 4/102',
    set: 'Base Set',
    year: 1999,
    significance: 'Most iconic Pokemon card, 1st Ed Shadowless PSA 10 sold for $420,000+',
    category: 'Pokemon',
  },
  pikachu_illustrator: {
    card: 'Pikachu Illustrator',
    set: 'CoroCoro Promo',
    year: 1998,
    significance: 'Rarest Pokemon card, only 39 exist, sold for $5.275 million',
    category: 'Pokemon',
  },
  // Sports - Basketball
  jordan_fleer: {
    card: 'Michael Jordan #57',
    set: 'Fleer',
    year: 1986,
    significance: 'Most valuable modern basketball card, PSA 10 over $700k',
    category: 'Basketball',
  },
  kobe_chrome: {
    card: 'Kobe Bryant #138 Refractor',
    set: 'Topps Chrome',
    year: 1996,
    significance: 'Iconic Kobe rookie, BGS 10 Pristine extremely rare',
    category: 'Basketball',
  },
  lebron_topps: {
    card: 'LeBron James #221',
    set: 'Topps Chrome',
    year: 2003,
    significance: 'Key LeBron rookie, Refractor highly sought after',
    category: 'Basketball',
  },
  // Sports - Baseball
  mantle_topps: {
    card: 'Mickey Mantle #311',
    set: 'Topps',
    year: 1952,
    significance: 'Most valuable baseball card, PSA 9 sold for $12.6 million',
    category: 'Baseball',
  },
  trout_update: {
    card: 'Mike Trout #US175',
    set: 'Topps Update',
    year: 2011,
    significance: 'Modern era key rookie, Superfractor sold for $3.9 million',
    category: 'Baseball',
  },
  // Sports - Football
  brady_contenders: {
    card: 'Tom Brady #144 Auto',
    set: 'Playoff Contenders',
    year: 2000,
    significance: 'Most valuable football card, BGS 9.5 sold for $3.1 million',
    category: 'Football',
  },
  mahomes_prizm: {
    card: 'Patrick Mahomes #269',
    set: 'Panini Prizm',
    year: 2017,
    significance: 'Key modern football rookie, Gold Prizm highly valuable',
    category: 'Football',
  },
  // MTG
  black_lotus: {
    card: 'Black Lotus',
    set: 'Alpha/Beta',
    year: 1993,
    significance: 'Most valuable MTG card, Alpha PSA 10 sold for $500k+',
    category: 'Magic: The Gathering',
  },
};
