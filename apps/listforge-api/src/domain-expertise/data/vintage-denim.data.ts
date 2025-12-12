/**
 * Vintage Denim Domain Expertise Data
 *
 * Production-ready reference data for authenticating and valuing vintage denim.
 * Primarily covers Levi's but also includes Lee, Wrangler, and other heritage brands.
 *
 * Sources:
 * - Heddels.com (https://www.heddels.com)
 * - Long John (https://long-john.nl)
 * - Thrifted.com
 * - RopeDye.com
 * - Official Levi Strauss archives
 */

// ============================================================================
// LEVI'S RED TAB ERAS
// ============================================================================

/**
 * Levi's Red Tab Evolution
 * The "Big E" vs "small e" distinction is critical for dating and value
 */
export const LEVIS_RED_TAB_ERAS: Array<{
  era: string;
  startYear: number;
  endYear: number;
  tabStyle: string;
  description: string;
  valueMultiplier: number;
}> = [
  {
    era: 'Pre-Tab',
    startYear: 1873,
    endYear: 1936,
    tabStyle: 'none',
    description: 'No red tab - extremely rare',
    valueMultiplier: 10.0,
  },
  {
    era: 'Single-Sided Big E',
    startYear: 1936,
    endYear: 1954,
    tabStyle: 'LEVI\'S (one side only)',
    description: 'Tab stitched on one side only, lettering faces front',
    valueMultiplier: 5.0,
  },
  {
    era: 'Double-Sided Big E',
    startYear: 1955,
    endYear: 1971,
    tabStyle: 'LEVI\'S (both sides)',
    description: 'Tab stitched on both sides, capital E',
    valueMultiplier: 3.0,
  },
  {
    era: 'Small e Transition',
    startYear: 1971,
    endYear: 1971,
    tabStyle: 'LeVI\'S (mixed)',
    description: 'Brief transition period with mixed caps',
    valueMultiplier: 2.5,
  },
  {
    era: 'Small e Era',
    startYear: 1971,
    endYear: 1983,
    tabStyle: 'Levi\'s',
    description: 'Lowercase e, Made in USA selvedge era',
    valueMultiplier: 2.0,
  },
  {
    era: 'Modern Small e',
    startYear: 1983,
    endYear: 2002,
    tabStyle: 'Levi\'s',
    description: 'Post-selvedge, still Made in USA',
    valueMultiplier: 1.3,
  },
  {
    era: 'Contemporary',
    startYear: 2002,
    endYear: 9999,
    tabStyle: 'Levi\'s',
    description: 'Overseas production, some LVC exceptions',
    valueMultiplier: 1.0,
  },
];

/**
 * Other Levi's Tab Colors and Meanings
 */
export const LEVIS_TAB_COLORS: Record<string, {
  color: string;
  introduced: number;
  meaning: string;
  rarity: string;
}> = {
  red: {
    color: 'Red',
    introduced: 1936,
    meaning: 'Standard mainline denim products',
    rarity: 'Common',
  },
  orange: {
    color: 'Orange',
    introduced: 1960,
    meaning: 'Fashion-forward styles (bell-bottoms, boot cuts, flares)',
    rarity: 'Moderate',
  },
  white: {
    color: 'White',
    introduced: 1960,
    meaning: 'Corduroy jackets/jeans, "Levi\'s for Gals" women\'s line',
    rarity: 'Uncommon',
  },
  black_gold: {
    color: 'Black with Gold Lettering',
    introduced: 1964,
    meaning: 'Sta-Prest collection (permanent press)',
    rarity: 'Uncommon',
  },
  silver: {
    color: 'Silver',
    introduced: 1988,
    meaning: 'Grunge-era jeans, late 80s-early 90s styles',
    rarity: 'Moderate',
  },
  blank: {
    color: 'Blank Red (® only)',
    introduced: 1970,
    meaning: 'Trademark protection, 10% of production',
    rarity: 'Common (not a defect)',
  },
};

// ============================================================================
// SELVEDGE & DENIM DATING
// ============================================================================

/**
 * Selvedge Denim Eras
 */
export const SELVEDGE_ERAS: Array<{
  era: string;
  startYear: number;
  endYear: number;
  selvedgeType: string;
  description: string;
}> = [
  {
    era: 'Pre-Red Line',
    startYear: 1873,
    endYear: 1927,
    selvedgeType: 'White/No ID',
    description: 'Selvedge with no color identification',
  },
  {
    era: 'Red Line Selvedge',
    startYear: 1927,
    endYear: 1983,
    selvedgeType: 'Red Line',
    description: 'Cone Mills 10oz red line selvedge for 501s',
  },
  {
    era: 'Faded Red Line',
    startYear: 1950,
    endYear: 1970,
    selvedgeType: 'Pink/Faded Red',
    description: '1950s pairs often show faded red appearing pink',
  },
  {
    era: 'End of Selvedge',
    startYear: 1983,
    endYear: 1985,
    selvedgeType: 'Red Line (final)',
    description: 'Final years of original selvedge production',
  },
  {
    era: 'Wide Loom Era',
    startYear: 1985,
    endYear: 9999,
    selvedgeType: 'None (standard)',
    description: 'Cone Mills switched to wide loom, no selvedge',
  },
];

/**
 * Construction Details by Era
 */
export const CONSTRUCTION_ERAS: Array<{
  feature: string;
  preDate: string;
  postDate: string;
  changeYear: number;
  description: string;
}> = [
  {
    feature: 'Single Back Pocket',
    preDate: 'Before 1902',
    postDate: 'Two pockets',
    changeYear: 1902,
    description: 'Original 501s had only one back pocket',
  },
  {
    feature: 'Exposed Rivets',
    preDate: 'Before 1937',
    postDate: 'Hidden rivets',
    changeYear: 1937,
    description: 'Hidden rivets added after complaints about scratching',
  },
  {
    feature: 'Coin Pocket Selvedge',
    preDate: 'Before 1966',
    postDate: 'No visible selvedge',
    changeYear: 1966,
    description: 'Watch/coin pocket showed selvedge detail inside',
  },
  {
    feature: 'Dual Thread Stitching',
    preDate: '1950s era',
    postDate: 'Single color thread',
    changeYear: 1960,
    description: 'Lemon and tobacco threads gave depth',
  },
  {
    feature: 'Care Labels',
    preDate: 'Before 1971',
    postDate: 'Care labels required',
    changeYear: 1971,
    description: 'Care instruction labels became mandatory',
  },
  {
    feature: 'Chain Stitch Hem',
    preDate: 'Before 1983',
    postDate: 'Lock stitch',
    changeYear: 1983,
    description: 'Chain stitch creates distinctive roping effect',
  },
];

// ============================================================================
// LEVI'S MODEL DESIGNATIONS
// ============================================================================

/**
 * Levi's Model Numbers and Meanings
 */
export const LEVIS_MODEL_NUMBERS: Record<string, {
  model: string;
  introduced: number;
  description: string;
  significance: string;
}> = {
  '501': {
    model: '501',
    introduced: 1890,
    description: 'Original straight leg, button fly',
    significance: 'The original blue jean, most collectible',
  },
  '501XX': {
    model: '501XX',
    introduced: 1890,
    description: 'XX denotes eXXtra strong Amoskeag denim',
    significance: 'Highly collectible, XX last used 1966-68',
  },
  '501STF': {
    model: '501 Shrink-to-Fit',
    introduced: 1950,
    description: 'Unsanforized denim, shrinks to fit',
    significance: 'Traditional raw denim experience',
  },
  '505': {
    model: '505',
    introduced: 1967,
    description: 'Regular fit, zip fly',
    significance: 'First zip fly Levi\'s',
  },
  '517': {
    model: '517',
    introduced: 1969,
    description: 'Boot cut',
    significance: 'Iconic 70s silhouette',
  },
  '701': {
    model: '701',
    introduced: 1934,
    description: 'Original women\'s jean (Lady Levi\'s)',
    significance: 'First women\'s jeans, highly collectible',
  },
  '702': {
    model: '702',
    introduced: 1940,
    description: 'High-waisted women\'s jean',
    significance: 'WWII era women\'s workwear',
  },
  'Type I': {
    model: 'Type I Jacket',
    introduced: 1905,
    description: 'First denim jacket, single pocket, pleated front',
    significance: 'Extremely rare, museum quality',
  },
  'Type II': {
    model: 'Type II Jacket',
    introduced: 1953,
    description: 'Two chest pockets, pleated front',
    significance: 'Highly collectible, 507XX',
  },
  'Type III': {
    model: 'Type III Jacket (Trucker)',
    introduced: 1962,
    description: 'Two chest pockets, V-shaped seams',
    significance: 'Iconic trucker jacket design',
  },
};

// ============================================================================
// CARE LABEL DATE CODES
// ============================================================================

/**
 * Levi's Care Label Date Code Formats
 */
export const CARE_LABEL_DATE_FORMATS: Array<{
  era: string;
  startYear: number;
  endYear: number;
  format: string;
  example: string;
  description: string;
}> = [
  {
    era: 'No Care Label',
    startYear: 1873,
    endYear: 1971,
    format: 'None',
    example: 'N/A',
    description: 'Pre-1971 jeans have no care labels',
  },
  {
    era: 'Paper Tags',
    startYear: 1971,
    endYear: 1985,
    format: 'M/YY or MM/YY',
    example: '5/74 = May 1974',
    description: 'Paper care tags with month/year',
  },
  {
    era: 'Two-Three Digit',
    startYear: 1971,
    endYear: 1992,
    format: 'Factory-Month-Year',
    example: '524 = Factory 5, Feb 1974',
    description: '2-3 digit codes on fabric labels',
  },
  {
    era: 'Four Digit Code',
    startYear: 1993,
    endYear: 2002,
    format: 'MM/YY',
    example: '1295 = Dec 1995',
    description: '4-digit format: MMYY',
  },
  {
    era: 'Modern',
    startYear: 2002,
    endYear: 9999,
    format: 'Various',
    example: 'Varies by factory',
    description: 'Overseas production, varied formats',
  },
];

/**
 * Known Levi's USA Factory Codes
 */
export const LEVIS_FACTORY_CODES: Record<string, {
  location: string;
  state: string;
  active: string;
  notes?: string;
}> = {
  '2': { location: 'Valencia Street', state: 'CA', active: '1906-1990', notes: 'Original San Francisco factory' },
  '4': { location: 'San Jose', state: 'CA', active: '1979-1990' },
  '5': { location: 'Amarillo', state: 'TX', active: '1965-1999' },
  '6': { location: 'El Paso', state: 'TX', active: '1965-1999' },
  '8': { location: 'Brownsville', state: 'TX', active: '1969-1999' },
  '12': { location: 'Blue Ridge', state: 'GA', active: '1971-1998' },
  '14': { location: 'Little Rock', state: 'AR', active: '1974-1999' },
  '16': { location: 'San Antonio', state: 'TX', active: '1968-2002', notes: 'Last USA factory to close' },
  '522': { location: 'Orange', state: 'CA', active: '1965-1985' },
  '524': { location: 'Murphy', state: 'NC', active: '1968-1995' },
  '526': { location: 'Powell', state: 'TN', active: '1972-1998' },
  '532': { location: 'Sedalia', state: 'MO', active: '1974-1999' },
  '555': { location: 'Valencia St. (Premium)', state: 'CA', active: '1980s', notes: 'Premium line' },
};

// ============================================================================
// VALUE DRIVERS
// ============================================================================

export const DENIM_VALUE_DRIVERS = [
  // Era & Tab
  {
    name: 'Pre-Tab Era (Pre-1936)',
    attribute: 'tab_type',
    conditionType: 'equals',
    conditionValue: 'none',
    priceMultiplier: 10.0,
    priority: 100,
    applicableBrands: ['Levi\'s'],
    description: 'Extremely rare, no red tab present',
  },
  {
    name: 'Single-Sided Big E',
    attribute: 'tab_type',
    conditionType: 'equals',
    conditionValue: 'single_sided_big_e',
    priceMultiplier: 5.0,
    priority: 98,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1955, tab stitched on one side only',
  },
  {
    name: 'Big E (Capital E)',
    attribute: 'tab_type',
    conditionType: 'equals',
    conditionValue: 'big_e',
    priceMultiplier: 3.0,
    priority: 95,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1971 "LEVI\'S" with capital E',
  },
  {
    name: 'Small e Selvedge Era',
    attribute: 'tab_type',
    conditionType: 'equals',
    conditionValue: 'small_e_selvedge',
    priceMultiplier: 2.0,
    priority: 90,
    applicableBrands: ['Levi\'s'],
    description: '1971-1983 lowercase e with selvedge',
  },
  // Selvedge
  {
    name: 'Red Line Selvedge',
    attribute: 'denim_type',
    conditionType: 'contains',
    conditionValue: 'redline_selvedge',
    priceMultiplier: 2.5,
    priority: 88,
    applicableBrands: ['Levi\'s'],
    description: 'Cone Mills red line selvedge denim',
  },
  {
    name: 'White Line Selvedge (Pre-1927)',
    attribute: 'denim_type',
    conditionType: 'contains',
    conditionValue: 'white_selvedge',
    priceMultiplier: 4.0,
    priority: 92,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1927 selvedge without red line ID',
  },
  // Construction
  {
    name: 'Hidden Rivets',
    attribute: 'construction',
    conditionType: 'contains',
    conditionValue: 'hidden_rivets',
    priceMultiplier: 1.5,
    priority: 80,
    applicableBrands: ['Levi\'s'],
    description: 'Post-1937 hidden rivet construction',
  },
  {
    name: 'Exposed Rivets (Pre-1937)',
    attribute: 'construction',
    conditionType: 'contains',
    conditionValue: 'exposed_rivets',
    priceMultiplier: 4.0,
    priority: 95,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1937 exposed back pocket rivets',
  },
  {
    name: 'Chain Stitch Hem',
    attribute: 'construction',
    conditionType: 'contains',
    conditionValue: 'chain_stitch',
    priceMultiplier: 1.3,
    priority: 75,
    applicableBrands: ['Levi\'s'],
    description: 'Original chain stitch creates roping effect',
  },
  {
    name: 'Single Back Pocket (Pre-1902)',
    attribute: 'construction',
    conditionType: 'equals',
    conditionValue: 'single_pocket',
    priceMultiplier: 8.0,
    priority: 99,
    applicableBrands: ['Levi\'s'],
    description: 'Extremely rare pre-1902 construction',
  },
  // Origin
  {
    name: 'Made in USA',
    attribute: 'origin',
    conditionType: 'equals',
    conditionValue: 'usa',
    priceMultiplier: 1.5,
    priority: 70,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'USA production ended 2002 for most Levi\'s',
  },
  {
    name: 'Valencia Street Factory',
    attribute: 'factory',
    conditionType: 'contains',
    conditionValue: 'valencia',
    priceMultiplier: 1.8,
    priority: 78,
    applicableBrands: ['Levi\'s'],
    description: 'Original San Francisco factory (closed 1990)',
  },
  // Condition
  {
    name: 'Deadstock/NWT',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'deadstock',
    priceMultiplier: 3.0,
    priority: 85,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'Never worn with original tags',
  },
  {
    name: 'Excellent Fade Pattern',
    attribute: 'condition',
    conditionType: 'equals',
    conditionValue: 'excellent_fades',
    priceMultiplier: 1.5,
    priority: 65,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'Well-developed natural fading, no damage',
  },
  {
    name: 'Honey Combs Present',
    attribute: 'wear_patterns',
    conditionType: 'contains',
    conditionValue: 'honeycomb',
    priceMultiplier: 1.2,
    priority: 60,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'Behind-knee fade patterns visible',
  },
  {
    name: 'Whiskers Present',
    attribute: 'wear_patterns',
    conditionType: 'contains',
    conditionValue: 'whiskers',
    priceMultiplier: 1.2,
    priority: 58,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'Hip crease fade patterns visible',
  },
  // Special Models
  {
    name: '501XX Designation',
    attribute: 'model',
    conditionType: 'contains',
    conditionValue: '501xx',
    priceMultiplier: 2.0,
    priority: 82,
    applicableBrands: ['Levi\'s'],
    description: 'eXXtra strong Amoskeag denim designation',
  },
  {
    name: 'Type I Jacket',
    attribute: 'garment_type',
    conditionType: 'equals',
    conditionValue: 'type_i',
    priceMultiplier: 15.0,
    priority: 100,
    applicableBrands: ['Levi\'s'],
    description: 'Extremely rare first denim jacket (pre-1953)',
  },
  {
    name: 'Type II Jacket',
    attribute: 'garment_type',
    conditionType: 'equals',
    conditionValue: 'type_ii',
    priceMultiplier: 5.0,
    priority: 93,
    applicableBrands: ['Levi\'s'],
    description: 'Highly collectible 1953-1962 jacket',
  },
  {
    name: 'Type III Jacket (Vintage)',
    attribute: 'garment_type',
    conditionType: 'equals',
    conditionValue: 'type_iii_vintage',
    priceMultiplier: 2.5,
    priority: 85,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1971 Big E trucker jacket',
  },
  {
    name: 'Women\'s 701 Original',
    attribute: 'model',
    conditionType: 'equals',
    conditionValue: '701',
    priceMultiplier: 3.0,
    priority: 88,
    applicableBrands: ['Levi\'s'],
    description: 'Original Lady Levi\'s from 1934',
  },
];

// ============================================================================
// AUTHENTICITY MARKERS
// ============================================================================

export const DENIM_AUTHENTICITY_MARKERS = [
  // Red Tab
  {
    name: 'Big E Red Tab',
    pattern: 'red_tab_capital_e',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Capital E on red tab indicates pre-1971',
  },
  {
    name: 'Single-Sided Tab Stitching',
    pattern: 'tab_single_side_stitch',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1955 tabs stitched on one side only',
  },
  {
    name: 'Modern Big E (LVC/Europe)',
    pattern: 'big_e_modern_production',
    importance: 'helpful',
    indicatesAuthentic: false,
    applicableBrands: ['Levi\'s'],
    description: 'Recent Big E tabs on LVC/European production - check care label',
  },
  // Selvedge
  {
    name: 'Red Line Selvedge ID',
    pattern: 'selvedge_red_line_visible',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Cone Mills red line on outseam indicates pre-1985',
  },
  {
    name: 'Chain Stitch Hem',
    pattern: 'hem_chain_stitch',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Original chain stitch creates distinctive roping',
  },
  {
    name: 'Lock Stitch Hem',
    pattern: 'hem_lock_stitch',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Post-1983 lock stitch (not wrong, just newer)',
  },
  // Button Details
  {
    name: 'Button Stamp Matches Care Label',
    pattern: 'button_care_label_match',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Factory code on button should match care label',
  },
  {
    name: 'Single Digit Button Stamp',
    pattern: '^\\d$',
    patternMaxLength: 1,
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Single digit indicates mid-1970s or earlier',
  },
  {
    name: 'Underlined 6 Button Stamp',
    pattern: 'button_underlined_6',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Underlined 6 indicates 1970s production',
  },
  {
    name: 'Three Digit Button Stamp',
    pattern: '^\\d{3}$',
    patternMaxLength: 3,
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: '3-digit stamp indicates 1980s-2002',
  },
  // Patch
  {
    name: 'Leather Two Horse Patch',
    pattern: 'patch_leather_two_horse',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Leather patch with Two Horse Brand logo',
  },
  {
    name: 'Paper Patch (Vintage)',
    pattern: 'patch_paper_vintage',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Early paper patches are rare and valuable',
  },
  // Construction
  {
    name: 'Hidden Back Pocket Rivets',
    pattern: 'rivets_hidden_back_pocket',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Post-1937 construction, rivets under denim',
  },
  {
    name: 'Exposed Back Pocket Rivets',
    pattern: 'rivets_exposed_back_pocket',
    importance: 'critical',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Pre-1937 construction, extremely rare',
  },
  {
    name: 'Bar Tacks (Post-1966)',
    pattern: 'bar_tacks_no_rivets',
    importance: 'helpful',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Post-1966 bar tacks replaced back pocket rivets',
  },
  // Care Labels
  {
    name: 'No Care Label Present',
    pattern: 'care_label_absent',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Absence of care label indicates pre-1971',
  },
  {
    name: 'Care Label Date Code Format',
    pattern: '^\\d{2,4}$',
    patternMaxLength: 4,
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s'],
    description: 'Valid date code format on care label',
  },
  // Origin
  {
    name: 'Made in USA Label',
    pattern: 'made_in_usa',
    importance: 'important',
    indicatesAuthentic: true,
    applicableBrands: ['Levi\'s', 'Lee', 'Wrangler'],
    description: 'USA production indicates pre-2002 or LVC',
  },
];

// ============================================================================
// DECODER DEFINITIONS
// ============================================================================

export const DENIM_DECODERS = [
  {
    name: 'Levi\'s Red Tab Decoder',
    identifierType: 'red_tab',
    description: 'Identifies era from red tab style (Big E vs small e)',
    inputPattern: '^(LEVI\'S|Levi\'s|LeVI\'S|blank)$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Big E Check',
        pattern: 'LEVI\'S',
        method: 'era_lookup_big_e',
      },
      {
        name: 'Small e Check',
        pattern: 'Levi\'s',
        method: 'era_lookup_small_e',
      },
      {
        name: 'Tab Side Check',
        pattern: 'single_or_double',
        method: 'tab_stitching_check',
      },
    ],
    outputFields: ['era', 'year_range', 'value_multiplier'],
    baseConfidence: 0.9,
    priority: 100,
    testCases: [
      {
        input: 'LEVI\'S',
        expected: { era: 'Big E', year_range: '1955-1971' },
      },
      {
        input: 'Levi\'s',
        expected: { era: 'Small e', year_range: '1971-present' },
      },
    ],
  },
  {
    name: 'Levi\'s Care Label Date Decoder',
    identifierType: 'date_code',
    description: 'Decodes care label date codes to production year',
    inputPattern: '^\\d{2,4}$',
    inputMaxLength: 4,
    extractionRules: [
      {
        name: 'Four Digit Format',
        pattern: '^(\\d{2})(\\d{2})$',
        method: 'four_digit_decode',
      },
      {
        name: 'Two-Three Digit Format',
        pattern: '^\\d{2,3}$',
        method: 'legacy_decode',
      },
    ],
    outputFields: ['production_month', 'production_year', 'factory_code'],
    baseConfidence: 0.85,
    priority: 90,
    testCases: [
      {
        input: '1295',
        expected: { production_month: 12, production_year: 1995 },
      },
      {
        input: '574',
        expected: { factory_code: '5', production_month: 7, production_year: 1974 },
      },
    ],
  },
  {
    name: 'Levi\'s Button Stamp Decoder',
    identifierType: 'button_stamp',
    description: 'Decodes button back stamp to determine era and factory',
    inputPattern: '^\\d{1,3}$',
    inputMaxLength: 3,
    extractionRules: [
      {
        name: 'Single Digit',
        pattern: '^(\\d)$',
        method: 'single_digit_era',
      },
      {
        name: 'Three Digit Factory',
        pattern: '^(\\d{3})$',
        method: 'factory_lookup',
      },
    ],
    outputFields: ['era', 'factory', 'year_range'],
    baseConfidence: 0.8,
    priority: 85,
    testCases: [
      {
        input: '6',
        expected: { era: 'pre-1975', factory: 'El Paso' },
      },
      {
        input: '524',
        expected: { factory: 'Murphy, NC', year_range: '1968-1995' },
      },
    ],
  },
  {
    name: 'Selvedge Type Decoder',
    identifierType: 'selvedge',
    description: 'Identifies selvedge type and era',
    inputPattern: '^(red_line|white|pink|none)$',
    inputMaxLength: 10,
    extractionRules: [
      {
        name: 'Red Line',
        pattern: 'red_line',
        method: 'redline_era',
      },
      {
        name: 'White Line',
        pattern: 'white',
        method: 'preredline_era',
      },
      {
        name: 'Faded/Pink',
        pattern: 'pink',
        method: 'faded_era',
      },
    ],
    outputFields: ['selvedge_type', 'era', 'year_range'],
    baseConfidence: 0.85,
    priority: 80,
    testCases: [
      {
        input: 'red_line',
        expected: { selvedge_type: 'Red Line', year_range: '1927-1985' },
      },
    ],
  },
];

// ============================================================================
// LOOKUP TABLES
// ============================================================================

export const DENIM_LOOKUP_TABLES = {
  levis_tab_eras: {
    name: 'Levi\'s Red Tab Eras',
    description: 'Tab style to era and value mapping',
    keyField: 'tab_style',
    valueSchema: { era: 'string', start_year: 'number', end_year: 'number', multiplier: 'number' },
  },
  levis_factory_codes: {
    name: 'Levi\'s Factory Codes',
    description: 'Factory code to location mapping',
    keyField: 'code',
    valueSchema: { location: 'string', state: 'string', active: 'string' },
  },
  levis_model_numbers: {
    name: 'Levi\'s Model Numbers',
    description: 'Model number to description mapping',
    keyField: 'model',
    valueSchema: { description: 'string', introduced: 'number', significance: 'string' },
  },
  selvedge_types: {
    name: 'Selvedge Types',
    description: 'Selvedge ID type to era mapping',
    keyField: 'type',
    valueSchema: { era: 'string', start_year: 'number', end_year: 'number' },
  },
  construction_features: {
    name: 'Construction Features by Era',
    description: 'Construction details to date range mapping',
    keyField: 'feature',
    valueSchema: { change_year: 'number', before: 'string', after: 'string' },
  },
};

// ============================================================================
// OTHER HERITAGE BRANDS
// ============================================================================

export const LEE_DATING_FEATURES: Record<string, {
  era: string;
  feature: string;
  description: string;
}> = {
  'hair_on_hide': {
    era: 'Pre-1970s',
    feature: 'Hair-on-Hide Patch',
    description: 'Real leather patch with visible hair texture',
  },
  'union_made_tag': {
    era: 'Pre-1980s',
    feature: 'Union Made Tag',
    description: 'ACWA or UNITE union label present',
  },
  'sanforized_tag': {
    era: 'Pre-1960s',
    feature: 'Sanforized Tag',
    description: 'Pre-shrunk denim certification tag',
  },
};

export const WRANGLER_DATING_FEATURES: Record<string, {
  era: string;
  feature: string;
  description: string;
}> = {
  'w_stitch': {
    era: 'All Eras',
    feature: 'W Stitch on Back Pockets',
    description: 'Signature Wrangler pocket design',
  },
  'blue_bell': {
    era: 'Pre-1947',
    feature: 'Blue Bell Brand',
    description: 'Wrangler predecessor brand name',
  },
  'rodeo_ben': {
    era: '1947-1960s',
    feature: 'Rodeo Ben Design',
    description: 'Named after tailor Rodeo Ben',
  },
};
