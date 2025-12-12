/**
 * Variant Decoders - Slice 9
 *
 * Pure functions that decode category-specific identifiers:
 * - Louis Vuitton date codes
 * - Hermes blindstamps
 * - Nike style codes
 * - Rolex reference numbers
 * - Vintage denim analysis
 *
 * These are pure functions with no external dependencies (except lookup data).
 * All functions return typed DecodedValue results.
 *
 * Security: All functions validate input length before regex matching to prevent ReDoS.
 */

import type {
  DecodedValue,
  DecodedLVDateCode,
  DecodedHermesBlindstamp,
  DecodedNikeStyleCode,
  DecodedRolexReference,
  VintageDenimAnalysis,
  CategoryId,
} from '@listforge/core-types';

import {
  LV_FACTORY_CODES,
  HERMES_YEAR_CODES_CYCLE1,
  HERMES_YEAR_CODES_CYCLE2,
  HERMES_YEAR_CODES_CYCLE3,
  ROLEX_REFERENCES,
} from '../data/domain-knowledge-db';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum input length for date codes (2 letters + 4 digits + buffer) */
const MAX_DATE_CODE_LENGTH = 10;

/** Maximum input length for style codes (6 chars + separator + 3 digits + buffer) */
const MAX_STYLE_CODE_LENGTH = 15;

/** Maximum input length for reference numbers (6 digits + 4 letters + buffer) */
const MAX_REFERENCE_LENGTH = 15;

/** Maximum input length for denim text analysis */
const MAX_DENIM_TEXT_LENGTH = 5000;

/** Week validation bounds */
const MIN_WEEK = 1;
const MAX_WEEK = 52;

/** Year validation bounds */
const MIN_PLAUSIBLE_YEAR = 1980;

/** Vintage threshold - items older than this are considered vintage */
const VINTAGE_AGE_THRESHOLD_YEARS = 20;

/**
 * Confidence score constants for consistent scoring across decoders
 */
const CONFIDENCE = {
  /** High confidence - known factory/reference in database */
  HIGH: 0.95,
  /** Good confidence - valid format with some uncertainty */
  GOOD: 0.90,
  /** Medium confidence - valid format, moderate uncertainty */
  MEDIUM: 0.85,
  /** Low confidence - valid format, high uncertainty (e.g., ambiguous cycle) */
  LOW: 0.70,
  /** Format-only confidence - valid format but not in database */
  FORMAT_ONLY: 0.60,
  /** Base confidence for text analysis */
  BASE_TEXT: 0.50,
  /** Invalid week confidence */
  INVALID_WEEK: 0.30,
  /** Implausible year confidence */
  IMPLAUSIBLE_YEAR: 0.40,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create a standardized failure result for any decoder
 * Reduces duplication across decoder functions
 */
function createFailResult<T extends DecodedValue>(
  rawValue: string,
  identifierType: T['identifierType'],
  decoderUsed: string,
  defaultDecoded: T['decoded'],
  error?: string,
): T {
  return {
    rawValue,
    identifierType,
    success: false,
    confidence: 0,
    decoded: defaultDecoded,
    decoderUsed,
    error,
  } as T;
}

/**
 * Validate input length to prevent ReDoS attacks
 * Returns error message if invalid, null if valid
 */
function validateInputLength(input: string, maxLength: number): string | null {
  if (!input || input.length === 0) {
    return 'Empty input';
  }
  if (input.length > maxLength) {
    return `Input exceeds maximum length of ${maxLength} characters`;
  }
  return null;
}

// =============================================================================
// LOUIS VUITTON DATE CODE DECODER
// =============================================================================

/** Default decoded values for LV date code failures */
const LV_DEFAULT_DECODED: DecodedLVDateCode['decoded'] = {
  factoryCode: '',
  factoryLocation: '',
  factoryCountry: '',
  week: 0,
  year: 0,
  era: 'post-2007',
  isValidFormat: false,
};

/**
 * Decode Louis Vuitton date code
 *
 * Pre-2007 format: AA#### or AA### (e.g., "SD0012" = San Dimas, 2000, week 12)
 *   - First 2 letters: factory code
 *   - Digits alternating: week/year (e.g., 0012 = week 01, year 02)
 *
 * Post-2007 format: AA#### (e.g., "SD1234" = San Dimas, week 12, year 2034)
 *   - First 2 letters: factory code
 *   - Digits: week (1st, 3rd) and year (2nd, 4th)
 *
 * @example
 * decodeLouisVuittonDateCode("SD1234")
 * // Returns: { success: true, decoded: { factoryCode: "SD", week: 13, year: 2024, ... } }
 *
 * @param code - Date code string (e.g., "SD1234")
 * @returns Decoded result with factory, week, year information
 */
export function decodeLouisVuittonDateCode(code: string): DecodedLVDateCode {
  // Validate input length FIRST to prevent ReDoS
  const lengthError = validateInputLength(code, MAX_DATE_CODE_LENGTH);
  if (lengthError) {
    return createFailResult<DecodedLVDateCode>(
      code,
      'lv_date_code',
      'decodeLouisVuittonDateCode',
      LV_DEFAULT_DECODED,
      lengthError,
    );
  }

  const normalizedCode = code.toUpperCase().trim();

  // Re-validate after normalization
  if (normalizedCode.length > MAX_DATE_CODE_LENGTH) {
    return createFailResult<DecodedLVDateCode>(
      code,
      'lv_date_code',
      'decodeLouisVuittonDateCode',
      LV_DEFAULT_DECODED,
      'Input exceeds maximum length after normalization',
    );
  }

  // Validate format: exactly 2 letters + 3-4 digits (no backtracking needed)
  const match = normalizedCode.match(/^([A-Z]{2})(\d{3,4})$/);
  if (!match) {
    return createFailResult<DecodedLVDateCode>(
      code,
      'lv_date_code',
      'decodeLouisVuittonDateCode',
      LV_DEFAULT_DECODED,
      'Invalid format: expected 2 letters + 3-4 digits',
    );
  }

  const factoryCode = match[1];
  const digits = match[2];

  // Look up factory
  const factory = LV_FACTORY_CODES[factoryCode];
  if (!factory) {
    return createFailResult<DecodedLVDateCode>(
      code,
      'lv_date_code',
      'decodeLouisVuittonDateCode',
      { ...LV_DEFAULT_DECODED, factoryCode, isValidFormat: true },
      `Unknown factory code: ${factoryCode}`,
    );
  }

  // Decode week and year based on digit count
  let week: number;
  let year: number;
  let era: 'pre-2007' | 'post-2007';

  if (digits.length === 4) {
    // Post-2007 format: WYWY (Week-Year-Week-Year interleaved)
    // e.g., "1234" = week 13, year 24 (2024)
    week = parseInt(digits[0] + digits[2], 10);
    year = 2000 + parseInt(digits[1] + digits[3], 10);
    era = 'post-2007';
  } else {
    // Pre-2007 format: WYY or WWYY
    // e.g., "012" = week 01, year 2 (2002) or "0102" = week 01, year 02
    if (digits.length === 3) {
      week = parseInt(digits[0], 10);
      year = 2000 + parseInt(digits.substring(1), 10);
    } else {
      week = parseInt(digits.substring(0, 2), 10);
      year = 1900 + parseInt(digits.substring(2), 10);
      if (year < MIN_PLAUSIBLE_YEAR) year += 100; // Adjust for 2000s
    }
    era = 'pre-2007';
  }

  const decodedBase = {
    factoryCode,
    factoryLocation: factory.location,
    factoryCountry: factory.country,
    week,
    year,
    era,
    isValidFormat: true,
  };

  // Validate week is reasonable
  if (week < MIN_WEEK || week > MAX_WEEK) {
    return {
      rawValue: code,
      identifierType: 'lv_date_code',
      success: false,
      confidence: CONFIDENCE.INVALID_WEEK,
      decoded: decodedBase,
      decoderUsed: 'decodeLouisVuittonDateCode',
      error: `Invalid week number: ${week} (expected ${MIN_WEEK}-${MAX_WEEK})`,
    };
  }

  // Validate year is reasonable
  const currentYear = new Date().getFullYear();
  if (year < MIN_PLAUSIBLE_YEAR || year > currentYear + 1) {
    return {
      rawValue: code,
      identifierType: 'lv_date_code',
      success: false,
      confidence: CONFIDENCE.IMPLAUSIBLE_YEAR,
      decoded: decodedBase,
      decoderUsed: 'decodeLouisVuittonDateCode',
      error: `Implausible year: ${year} (expected ${MIN_PLAUSIBLE_YEAR}-${currentYear + 1})`,
    };
  }

  return {
    rawValue: code,
    identifierType: 'lv_date_code',
    success: true,
    confidence: CONFIDENCE.HIGH,
    decoded: decodedBase,
    decoderUsed: 'decodeLouisVuittonDateCode',
  };
}

// =============================================================================
// HERMES BLINDSTAMP DECODER
// =============================================================================

/** Default decoded values for Hermes blindstamp failures */
const HERMES_DEFAULT_DECODED: DecodedHermesBlindstamp['decoded'] = {
  yearLetter: '',
  year: 0,
  isValidFormat: false,
};

/**
 * Decode Hermes blindstamp year code
 *
 * Cycle 1 (1971-1996): Single letter A-Z, no enclosure
 * Cycle 2 (1997-2014): Single letter in circle
 * Cycle 3 (2015+): Single letter in square
 *
 * @example
 * decodeHermesBlindstamp("X", true)
 * // Returns: { success: true, decoded: { yearLetter: "X", year: 2016, hasSquare: true } }
 *
 * @param stamp - Single letter blindstamp (e.g., "X")
 * @param hasSquare - Whether stamp was in square brackets (cycle 3)
 * @returns Decoded result with year information
 */
export function decodeHermesBlindstamp(
  stamp: string,
  hasSquare?: boolean,
): DecodedHermesBlindstamp {
  // Validate input length FIRST - blindstamp should be exactly 1 character
  const lengthError = validateInputLength(stamp, 5); // Allow some whitespace
  if (lengthError) {
    return createFailResult<DecodedHermesBlindstamp>(
      stamp,
      'hermes_blindstamp',
      'decodeHermesBlindstamp',
      HERMES_DEFAULT_DECODED,
      lengthError,
    );
  }

  const normalizedStamp = stamp.toUpperCase().trim();

  // Validate format: exactly single letter (no regex needed, just check length and char)
  if (normalizedStamp.length !== 1 || !/^[A-Z]$/.test(normalizedStamp)) {
    return createFailResult<DecodedHermesBlindstamp>(
      stamp,
      'hermes_blindstamp',
      'decodeHermesBlindstamp',
      HERMES_DEFAULT_DECODED,
      'Invalid format: expected single letter A-Z',
    );
  }

  let year: number | undefined;
  let confidence: number = CONFIDENCE.MEDIUM;

  if (hasSquare) {
    // Cycle 3 (2015+)
    year = HERMES_YEAR_CODES_CYCLE3[normalizedStamp];
    if (!year) {
      return createFailResult<DecodedHermesBlindstamp>(
        stamp,
        'hermes_blindstamp',
        'decodeHermesBlindstamp',
        { yearLetter: normalizedStamp, year: 0, isValidFormat: true, hasSquare: true },
        `Letter ${normalizedStamp} not valid for cycle 3 (square)`,
      );
    }
    confidence = CONFIDENCE.HIGH; // Square bracket makes it more certain
  } else {
    // Could be cycle 1 or 2 - try cycle 2 first (more recent)
    year = HERMES_YEAR_CODES_CYCLE2[normalizedStamp];
    if (!year) {
      year = HERMES_YEAR_CODES_CYCLE1[normalizedStamp];
      if (year) {
        confidence = CONFIDENCE.LOW; // Less certain without knowing if it's cycle 1 or 2
      }
    }

    if (!year) {
      return createFailResult<DecodedHermesBlindstamp>(
        stamp,
        'hermes_blindstamp',
        'decodeHermesBlindstamp',
        { yearLetter: normalizedStamp, year: 0, isValidFormat: true },
        `Letter ${normalizedStamp} not found in any cycle`,
      );
    }
  }

  return {
    rawValue: stamp,
    identifierType: 'hermes_blindstamp',
    success: true,
    confidence,
    decoded: {
      yearLetter: normalizedStamp,
      year,
      isValidFormat: true,
      hasSquare,
    },
    decoderUsed: 'decodeHermesBlindstamp',
  };
}

// =============================================================================
// NIKE STYLE CODE DECODER
// =============================================================================

/** Default decoded values for Nike style code failures */
const NIKE_DEFAULT_DECODED: DecodedNikeStyleCode['decoded'] = {
  modelCode: '',
  colorwayCode: '',
  fullStyleCode: '',
  isValidFormat: false,
};

/**
 * Decode Nike style code
 *
 * Standard format: XXXXXX-XXX (e.g., "CW2288-111")
 *   - First 6 characters: Model code (2 letters + 4 digits)
 *   - Last 3 digits after hyphen: Colorway code
 *
 * Alternative formats also supported:
 *   - XXXXXX XXX (space separator)
 *   - XXXXXXXXX (no separator)
 *
 * @example
 * decodeNikeStyleCode("CW2288-111")
 * // Returns: { success: true, decoded: { modelCode: "CW2288", colorwayCode: "111", ... } }
 *
 * @param code - Style code string (e.g., "CW2288-111")
 * @returns Decoded result with model and colorway codes
 */
export function decodeNikeStyleCode(code: string): DecodedNikeStyleCode {
  // Validate input length FIRST to prevent ReDoS
  const lengthError = validateInputLength(code, MAX_STYLE_CODE_LENGTH);
  if (lengthError) {
    return createFailResult<DecodedNikeStyleCode>(
      code,
      'nike_style_code',
      'decodeNikeStyleCode',
      NIKE_DEFAULT_DECODED,
      lengthError,
    );
  }

  const normalizedCode = code.toUpperCase().trim();

  // Re-validate after normalization
  if (normalizedCode.length > MAX_STYLE_CODE_LENGTH) {
    return createFailResult<DecodedNikeStyleCode>(
      code,
      'nike_style_code',
      'decodeNikeStyleCode',
      NIKE_DEFAULT_DECODED,
      'Input exceeds maximum length after normalization',
    );
  }

  // Try specific formats in order (most specific to least specific)
  // Format 1: Standard Nike format - 2 letters + 4 digits + hyphen + 3 digits
  let match = normalizedCode.match(/^([A-Z]{2}\d{4})-(\d{3})$/);

  // Format 2: Space separator - 2 letters + 4 digits + space + 3 digits
  if (!match) {
    match = normalizedCode.match(/^([A-Z]{2}\d{4}) (\d{3})$/);
  }

  // Format 3: No separator - 2 letters + 4 digits + 3 digits (9 chars exactly)
  if (!match) {
    match = normalizedCode.match(/^([A-Z]{2}\d{4})(\d{3})$/);
  }

  // Format 4: Flexible alphanumeric model code (6 chars) with optional single separator
  // NOTE: Use explicit alternatives instead of [-\s]? to prevent ReDoS
  if (!match && normalizedCode.length >= 9 && normalizedCode.length <= 11) {
    // Try with hyphen
    match = normalizedCode.match(/^([A-Z0-9]{6})-(\d{3})$/);
    // Try with space
    if (!match) {
      match = normalizedCode.match(/^([A-Z0-9]{6}) (\d{3})$/);
    }
    // Try without separator
    if (!match) {
      match = normalizedCode.match(/^([A-Z0-9]{6})(\d{3})$/);
    }
  }

  if (!match) {
    return createFailResult<DecodedNikeStyleCode>(
      code,
      'nike_style_code',
      'decodeNikeStyleCode',
      NIKE_DEFAULT_DECODED,
      'Invalid format: expected XXXXXX-XXX pattern (e.g., CW2288-111)',
    );
  }

  const modelCode = match[1];
  const colorwayCode = match[2];
  const fullStyleCode = `${modelCode}-${colorwayCode}`;

  return {
    rawValue: code,
    identifierType: 'nike_style_code',
    success: true,
    confidence: CONFIDENCE.GOOD,
    decoded: {
      modelCode,
      colorwayCode,
      fullStyleCode,
      isValidFormat: true,
    },
    decoderUsed: 'decodeNikeStyleCode',
  };
}

// =============================================================================
// ROLEX REFERENCE DECODER
// =============================================================================

/** Default decoded values for Rolex reference failures */
const ROLEX_DEFAULT_DECODED: DecodedRolexReference['decoded'] = {
  referenceNumber: '',
  isValidReference: false,
};

/**
 * Decode Rolex reference number
 *
 * Format: 5-6 digit number + optional suffix letters (e.g., "116610LN")
 *
 * @example
 * decodeRolexReference("116610LN")
 * // Returns: { success: true, decoded: { modelFamily: "Submariner", modelName: "Submariner Date", ... } }
 *
 * @param reference - Reference number string (e.g., "116610LN")
 * @returns Decoded result with model family and name
 */
export function decodeRolexReference(reference: string): DecodedRolexReference {
  // Validate input length FIRST to prevent ReDoS
  const lengthError = validateInputLength(reference, MAX_REFERENCE_LENGTH);
  if (lengthError) {
    return createFailResult<DecodedRolexReference>(
      reference,
      'rolex_reference',
      'decodeRolexReference',
      ROLEX_DEFAULT_DECODED,
      lengthError,
    );
  }

  const normalizedRef = reference.toUpperCase().trim();

  // Re-validate after normalization
  if (normalizedRef.length > MAX_REFERENCE_LENGTH) {
    return createFailResult<DecodedRolexReference>(
      reference,
      'rolex_reference',
      'decodeRolexReference',
      ROLEX_DEFAULT_DECODED,
      'Input exceeds maximum length after normalization',
    );
  }

  // Validate format: exactly 5-6 digits + 0-4 letters
  const match = normalizedRef.match(/^(\d{5,6})([A-Z]{0,4})$/);
  if (!match) {
    return createFailResult<DecodedRolexReference>(
      reference,
      'rolex_reference',
      'decodeRolexReference',
      ROLEX_DEFAULT_DECODED,
      'Invalid format: expected 5-6 digits + optional letter suffix (e.g., 116610LN)',
    );
  }

  const fullRef = match[0];

  // Look up in database
  const info = ROLEX_REFERENCES[fullRef];
  if (!info) {
    // Valid format but not in our database
    return {
      rawValue: reference,
      identifierType: 'rolex_reference',
      success: true,
      confidence: CONFIDENCE.FORMAT_ONLY, // Lower confidence when not in database
      decoded: {
        referenceNumber: fullRef,
        isValidReference: false,
      },
      decoderUsed: 'decodeRolexReference',
    };
  }

  return {
    rawValue: reference,
    identifierType: 'rolex_reference',
    success: true,
    confidence: CONFIDENCE.HIGH,
    decoded: {
      referenceNumber: info.referenceNumber,
      modelFamily: info.modelFamily,
      modelName: info.modelName,
      material: info.material,
      isValidReference: true,
    },
    decoderUsed: 'decodeRolexReference',
  };
}

// =============================================================================
// VINTAGE DENIM ANALYZER
// =============================================================================

/** Default decoded values for vintage denim analysis failures */
const DENIM_DEFAULT_DECODED: VintageDenimAnalysis['decoded'] = {
  isBigE: false,
  isSelvedge: false,
  isMadeInUSA: false,
  valueIndicators: [],
};

/**
 * Analyze vintage denim for value indicators
 *
 * Checks for:
 * - Big E (pre-1971 Levi's) - capital E in LEVI'S logo
 * - Selvedge denim - red line, LVC line
 * - Made in USA - pre-offshore manufacturing
 * - Single stitch (pre-1983)
 * - Orange/Red tab
 *
 * @example
 * analyzeVintageDenim("LEVI'S 501 MADE IN USA")
 * // Returns: { success: true, decoded: { isBigE: true, isMadeInUSA: true, valueIndicators: [...] } }
 *
 * @param text - Text extracted from label/tags
 * @returns Analysis result with value indicators
 */
export function analyzeVintageDenim(text: string): VintageDenimAnalysis {
  // Validate input length FIRST
  const lengthError = validateInputLength(text, MAX_DENIM_TEXT_LENGTH);
  if (lengthError) {
    return createFailResult<VintageDenimAnalysis>(
      text.substring(0, 100) + (text.length > 100 ? '...' : ''), // Truncate for storage
      'vintage_denim',
      'analyzeVintageDenim',
      DENIM_DEFAULT_DECODED,
      lengthError,
    );
  }

  const normalizedText = text.toUpperCase();
  const valueIndicators: string[] = [];
  let confidence: number = CONFIDENCE.BASE_TEXT;

  // Check for Big E
  // Big E: "LEVI'S" with capital E (pre-1971)
  // Small e: "Levi's" with lowercase e (post-1971)
  // Use simple string includes instead of regex where possible
  const hasBigE = text.includes("LEVI'S") && !text.includes("Levi's");

  if (hasBigE) {
    valueIndicators.push('Big E (pre-1971)');
    confidence = Math.max(confidence, CONFIDENCE.MEDIUM);
  }

  // Check for selvedge indicators
  // Use simple patterns that don't backtrack
  const selvedgePatterns = ['SELVEDGE', 'SELVAGE', 'REDLINE', 'RED LINE', 'LVC', 'VINTAGE CLOTHING'];
  const hasSelvedgeText = selvedgePatterns.some((pattern) => normalizedText.includes(pattern));

  // Check for selvedge model numbers (simple includes, no regex needed)
  const selvedgeModels = ['501 CT', '501CT', '501 XX', '501XX', '501 STF', '501STF'];
  const hasSelvedgeModel = selvedgeModels.some((model) => normalizedText.includes(model));

  const isSelvedge = hasSelvedgeText || hasSelvedgeModel;

  if (isSelvedge) {
    valueIndicators.push('Selvedge Denim');
    confidence = Math.max(confidence, 0.8);
  }

  // Check for Made in USA (simple patterns)
  const usaPatterns = [
    'MADE IN USA',
    'MADE IN U.S.A.',
    'MADE IN U.S.A',
    'MADE IN THE USA',
    'MADE IN THE U.S.A.',
    'MADE IN UNITED STATES',
  ];
  const isMadeInUSA = usaPatterns.some((pattern) => normalizedText.includes(pattern));

  if (isMadeInUSA) {
    valueIndicators.push('Made in USA');
    confidence = Math.max(confidence, 0.75);
  }

  // Estimate era based on indicators
  let estimatedEra: string | undefined;
  if (hasBigE) {
    estimatedEra = '1966-1971';
  } else if (isMadeInUSA && isSelvedge) {
    estimatedEra = '1971-1983';
  } else if (isMadeInUSA) {
    estimatedEra = '1971-2003';
  }

  // Check for other vintage indicators (simple patterns)
  if (normalizedText.includes('SINGLE STITCH')) {
    valueIndicators.push('Single Stitch (pre-1983)');
    confidence = Math.max(confidence, 0.8);
  }

  if (normalizedText.includes('ORANGE TAB')) {
    valueIndicators.push('Orange Tab');
    confidence = Math.max(confidence, CONFIDENCE.LOW);
  }

  if (normalizedText.includes('RED TAB') && hasBigE) {
    valueIndicators.push('Red Tab Big E');
    confidence = Math.max(confidence, CONFIDENCE.MEDIUM);
  }

  return {
    rawValue: text,
    identifierType: 'vintage_denim',
    success: valueIndicators.length > 0,
    confidence,
    decoded: {
      isBigE: hasBigE,
      isSelvedge,
      isMadeInUSA,
      estimatedEra,
      valueIndicators,
    },
    decoderUsed: 'analyzeVintageDenim',
  };
}

// =============================================================================
// GENERIC DECODER DISPATCHER
// =============================================================================

/**
 * Map of category IDs to relevant decoder types
 * Used to prioritize which decoders to try first based on category
 */
const CATEGORY_DECODER_MAP: Record<string, string[]> = {
  luxury_handbags: ['lv_date_code', 'hermes_blindstamp'],
  sneakers: ['nike_style_code'],
  watches: ['rolex_reference'],
  vintage_denim: ['vintage_denim'],
};

/**
 * Maximum identifier length for generic decoding
 * Prevents processing very long strings that are unlikely to be valid identifiers
 */
const MAX_IDENTIFIER_LENGTH = 50;

/**
 * Attempt to decode an identifier based on category context
 *
 * First tries decoders relevant to the specified category, then falls back
 * to pattern-based detection for all decoder types.
 *
 * @example
 * decodeIdentifier("SD1234", "luxury_handbags")
 * // Returns: DecodedLVDateCode with factory/year info
 *
 * @param identifier - The identifier string to decode
 * @param categoryId - Category to help select appropriate decoder
 * @returns Decoded result or null if no decoder matches
 */
export function decodeIdentifier(
  identifier: string,
  categoryId: CategoryId,
): DecodedValue | null {
  // Validate input
  if (!identifier || identifier.length === 0) {
    return null;
  }

  const normalizedId = identifier.trim();

  // Prevent processing very long strings
  if (normalizedId.length > MAX_IDENTIFIER_LENGTH) {
    return null;
  }

  // Try decoders based on category first
  const relevantDecoders = CATEGORY_DECODER_MAP[categoryId] || [];

  for (const decoderType of relevantDecoders) {
    const result = tryDecoder(decoderType, normalizedId);
    if (result?.success) {
      return result;
    }
  }

  // Try all decoders if category-specific ones didn't match
  // This handles cases where category detection might be wrong

  // Try LV date code (2 letters + 3-4 digits)
  if (normalizedId.length >= 5 && normalizedId.length <= 6) {
    const lvResult = decodeLouisVuittonDateCode(normalizedId);
    if (lvResult.success) return lvResult;
  }

  // Try Nike style code (9-10 chars with specific format)
  if (normalizedId.length >= 9 && normalizedId.length <= 11) {
    const nikeResult = decodeNikeStyleCode(normalizedId);
    if (nikeResult.success) return nikeResult;
  }

  // Try Rolex reference (5-10 chars)
  if (normalizedId.length >= 5 && normalizedId.length <= 10) {
    const rolexResult = decodeRolexReference(normalizedId);
    if (rolexResult.success) return rolexResult;
  }

  // Try Hermes (single letter)
  if (normalizedId.length === 1) {
    const hermesResult = decodeHermesBlindstamp(normalizedId);
    if (hermesResult.success) return hermesResult;
  }

  return null;
}

/**
 * Try a specific decoder type on an identifier
 * @internal
 */
function tryDecoder(decoderType: string, identifier: string): DecodedValue | null {
  switch (decoderType) {
    case 'lv_date_code':
      return decodeLouisVuittonDateCode(identifier);
    case 'hermes_blindstamp':
      // Only try single-letter inputs for Hermes
      if (identifier.length === 1) {
        return decodeHermesBlindstamp(identifier);
      }
      return null;
    case 'nike_style_code':
      return decodeNikeStyleCode(identifier);
    case 'rolex_reference':
      return decodeRolexReference(identifier);
    case 'vintage_denim':
      return analyzeVintageDenim(identifier);
    default:
      return null;
  }
}

/**
 * Attempt to decode multiple identifiers
 *
 * @param identifiers - Array of identifier strings
 * @param categoryId - Category context for decoder selection
 * @returns Array of decoded results (only successful decodes)
 */
export function decodeIdentifiers(
  identifiers: string[],
  categoryId: CategoryId,
): DecodedValue[] {
  const results: DecodedValue[] = [];

  for (const identifier of identifiers) {
    const decoded = decodeIdentifier(identifier, categoryId);
    if (decoded?.success) {
      results.push(decoded);
    }
  }

  return results;
}

/**
 * Check if a decoded result indicates a vintage item
 *
 * @param decoded - Decoded value to check
 * @returns true if item appears to be vintage (20+ years old)
 */
export function isVintageItem(decoded: DecodedValue): boolean {
  if (!decoded.success) return false;

  const decodedData = decoded.decoded;

  // Check for explicit vintage indicators
  if ('estimatedEra' in decodedData && decodedData.estimatedEra) {
    return true;
  }

  // Check for Big E (pre-1971)
  if ('isBigE' in decodedData && decodedData.isBigE) {
    return true;
  }

  // Check year if available
  if ('year' in decodedData && typeof decodedData.year === 'number') {
    const year = decodedData.year;
    const currentYear = new Date().getFullYear();
    return year < currentYear - VINTAGE_AGE_THRESHOLD_YEARS;
  }

  return false;
}

// Export constants for testing
export { CONFIDENCE, MAX_DATE_CODE_LENGTH, MAX_STYLE_CODE_LENGTH, MAX_REFERENCE_LENGTH };
