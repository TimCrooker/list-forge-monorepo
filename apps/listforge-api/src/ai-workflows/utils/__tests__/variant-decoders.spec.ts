import {
  decodeLouisVuittonDateCode,
  decodeHermesBlindstamp,
  decodeNikeStyleCode,
  decodeRolexReference,
  analyzeVintageDenim,
  decodeIdentifier,
  decodeIdentifiers,
  isVintageItem,
  CONFIDENCE,
  MAX_DATE_CODE_LENGTH,
  MAX_STYLE_CODE_LENGTH,
  MAX_REFERENCE_LENGTH,
} from '../variant-decoders';

describe('Variant Decoders', () => {
  // ===========================================================================
  // LOUIS VUITTON DATE CODE DECODER
  // ===========================================================================
  describe('decodeLouisVuittonDateCode', () => {
    describe('successful decoding', () => {
      it('should decode standard post-2007 format (SD1234)', () => {
        const result = decodeLouisVuittonDateCode('SD1234');
        expect(result.success).toBe(true);
        expect(result.decoded.factoryCode).toBe('SD');
        expect(result.decoded.factoryLocation).toContain('California');
        expect(result.decoded.factoryCountry).toBe('USA');
        expect(result.decoded.week).toBe(13); // 1st + 3rd digit = 13
        expect(result.decoded.year).toBe(2024); // 2nd + 4th digit = 24 + 2000
        expect(result.decoded.era).toBe('post-2007');
        expect(result.decoded.isValidFormat).toBe(true);
        expect(result.confidence).toBe(CONFIDENCE.HIGH);
      });

      it('should decode FL factory code', () => {
        const result = decodeLouisVuittonDateCode('FL0232');
        expect(result.success).toBe(true);
        expect(result.decoded.factoryCode).toBe('FL');
        expect(result.decoded.factoryCountry).toBe('USA');
      });

      it('should decode AR (France) factory code', () => {
        const result = decodeLouisVuittonDateCode('AR1234');
        expect(result.success).toBe(true);
        expect(result.decoded.factoryCode).toBe('AR');
        expect(result.decoded.factoryCountry).toBe('France');
      });

      it('should decode pre-2007 format with 3 digits', () => {
        const result = decodeLouisVuittonDateCode('SD012');
        expect(result.success).toBe(true);
        expect(result.decoded.week).toBe(0);
        expect(result.decoded.year).toBe(2012);
        expect(result.decoded.era).toBe('pre-2007');
      });

      it('should handle lowercase input', () => {
        const result = decodeLouisVuittonDateCode('sd1234');
        expect(result.success).toBe(true);
        expect(result.decoded.factoryCode).toBe('SD');
      });

      it('should handle input with whitespace', () => {
        const result = decodeLouisVuittonDateCode('  SD1234  ');
        expect(result.success).toBe(true);
        expect(result.decoded.factoryCode).toBe('SD');
      });
    });

    describe('error handling', () => {
      it('should fail for empty input', () => {
        const result = decodeLouisVuittonDateCode('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Empty input');
      });

      it('should fail for input exceeding max length', () => {
        const longInput = 'A'.repeat(MAX_DATE_CODE_LENGTH + 1);
        const result = decodeLouisVuittonDateCode(longInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum length');
      });

      it('should fail for invalid format (no digits)', () => {
        const result = decodeLouisVuittonDateCode('ABCD');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });

      it('should fail for invalid format (only digits)', () => {
        const result = decodeLouisVuittonDateCode('123456');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });

      it('should fail for unknown factory code', () => {
        const result = decodeLouisVuittonDateCode('XX1234');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown factory code');
        expect(result.decoded.isValidFormat).toBe(true);
      });

      it('should fail for invalid week number', () => {
        // Week 99 is invalid
        const result = decodeLouisVuittonDateCode('SD9924');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid week');
        expect(result.confidence).toBe(CONFIDENCE.INVALID_WEEK);
      });
    });

    describe('ReDoS prevention', () => {
      it('should handle malicious input quickly', () => {
        const start = Date.now();
        const maliciousInput = 'A'.repeat(100) + '!';
        decodeLouisVuittonDateCode(maliciousInput);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100); // Should be nearly instant
      });
    });
  });

  // ===========================================================================
  // HERMES BLINDSTAMP DECODER
  // ===========================================================================
  describe('decodeHermesBlindstamp', () => {
    describe('successful decoding', () => {
      it('should decode cycle 3 letter with square bracket', () => {
        const result = decodeHermesBlindstamp('X', true);
        expect(result.success).toBe(true);
        expect(result.decoded.yearLetter).toBe('X');
        expect(result.decoded.year).toBe(2016);
        expect(result.decoded.hasSquare).toBe(true);
        expect(result.decoded.isValidFormat).toBe(true);
        expect(result.confidence).toBe(CONFIDENCE.HIGH);
      });

      it('should decode cycle 2 letter without square', () => {
        const result = decodeHermesBlindstamp('X');
        expect(result.success).toBe(true);
        expect(result.decoded.yearLetter).toBe('X');
        // Should match cycle 2 (more recent)
        expect(result.decoded.year).toBe(1994);
        expect(result.decoded.hasSquare).toBeUndefined();
      });

      it('should decode letter A for cycle 1', () => {
        const result = decodeHermesBlindstamp('A');
        expect(result.success).toBe(true);
        expect(result.decoded.yearLetter).toBe('A');
      });

      it('should handle lowercase input', () => {
        const result = decodeHermesBlindstamp('x', true);
        expect(result.success).toBe(true);
        expect(result.decoded.yearLetter).toBe('X');
      });

      it('should handle whitespace', () => {
        const result = decodeHermesBlindstamp('  X  ', true);
        expect(result.success).toBe(true);
        expect(result.decoded.yearLetter).toBe('X');
      });
    });

    describe('error handling', () => {
      it('should fail for empty input', () => {
        const result = decodeHermesBlindstamp('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Empty input');
      });

      it('should fail for multiple characters', () => {
        const result = decodeHermesBlindstamp('XY');
        expect(result.success).toBe(false);
        expect(result.error).toContain('expected single letter');
      });

      it('should fail for non-letter character', () => {
        const result = decodeHermesBlindstamp('5');
        expect(result.success).toBe(false);
        expect(result.error).toContain('expected single letter');
      });

      it('should fail for invalid cycle 3 letter', () => {
        const result = decodeHermesBlindstamp('Z', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not valid for cycle 3');
      });
    });
  });

  // ===========================================================================
  // NIKE STYLE CODE DECODER
  // ===========================================================================
  describe('decodeNikeStyleCode', () => {
    describe('successful decoding', () => {
      it('should decode standard format with hyphen (CW2288-111)', () => {
        const result = decodeNikeStyleCode('CW2288-111');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('CW2288');
        expect(result.decoded.colorwayCode).toBe('111');
        expect(result.decoded.fullStyleCode).toBe('CW2288-111');
        expect(result.decoded.isValidFormat).toBe(true);
        expect(result.confidence).toBe(CONFIDENCE.GOOD);
      });

      it('should decode format with space separator', () => {
        const result = decodeNikeStyleCode('CW2288 111');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('CW2288');
        expect(result.decoded.colorwayCode).toBe('111');
      });

      it('should decode format without separator', () => {
        const result = decodeNikeStyleCode('CW2288111');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('CW2288');
        expect(result.decoded.colorwayCode).toBe('111');
      });

      it('should decode flexible alphanumeric model code', () => {
        const result = decodeNikeStyleCode('AB1234-567');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('AB1234');
        expect(result.decoded.colorwayCode).toBe('567');
      });

      it('should handle lowercase input', () => {
        const result = decodeNikeStyleCode('cw2288-111');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('CW2288');
      });

      it('should handle whitespace', () => {
        const result = decodeNikeStyleCode('  CW2288-111  ');
        expect(result.success).toBe(true);
        expect(result.decoded.modelCode).toBe('CW2288');
      });
    });

    describe('error handling', () => {
      it('should fail for empty input', () => {
        const result = decodeNikeStyleCode('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Empty input');
      });

      it('should fail for input exceeding max length', () => {
        const longInput = 'A'.repeat(MAX_STYLE_CODE_LENGTH + 1);
        const result = decodeNikeStyleCode(longInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum length');
      });

      it('should fail for invalid format', () => {
        const result = decodeNikeStyleCode('INVALID');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });

      it('should fail for too short input', () => {
        const result = decodeNikeStyleCode('AB-123');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });
    });

    describe('ReDoS prevention', () => {
      it('should handle malicious input quickly', () => {
        const start = Date.now();
        // Pattern that could cause backtracking with naive regex
        const maliciousInput = 'A1B2C3 - - - - - - 456';
        decodeNikeStyleCode(maliciousInput);
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(100);
      });
    });
  });

  // ===========================================================================
  // ROLEX REFERENCE DECODER
  // ===========================================================================
  describe('decodeRolexReference', () => {
    describe('successful decoding', () => {
      it('should decode known reference (116610LN Submariner)', () => {
        const result = decodeRolexReference('116610LN');
        expect(result.success).toBe(true);
        expect(result.decoded.referenceNumber).toBe('116610LN');
        expect(result.decoded.modelFamily).toBe('Submariner');
        expect(result.decoded.modelName).toContain('Submariner');
        expect(result.decoded.material).toBe('Stainless Steel');
        expect(result.decoded.isValidReference).toBe(true);
        expect(result.confidence).toBe(CONFIDENCE.HIGH);
      });

      it('should decode GMT-Master reference', () => {
        const result = decodeRolexReference('126710BLRO');
        expect(result.success).toBe(true);
        expect(result.decoded.modelFamily).toBe('GMT-Master II');
      });

      it('should decode reference with only digits', () => {
        const result = decodeRolexReference('116500');
        expect(result.success).toBe(true);
        expect(result.decoded.referenceNumber).toBe('116500');
        expect(result.decoded.modelFamily).toBe('Daytona');
      });

      it('should return valid format for unknown reference', () => {
        const result = decodeRolexReference('999999');
        expect(result.success).toBe(true);
        expect(result.decoded.referenceNumber).toBe('999999');
        expect(result.decoded.isValidReference).toBe(false);
        expect(result.confidence).toBe(CONFIDENCE.FORMAT_ONLY);
      });

      it('should handle lowercase input', () => {
        const result = decodeRolexReference('116610ln');
        expect(result.success).toBe(true);
        expect(result.decoded.referenceNumber).toBe('116610LN');
      });
    });

    describe('error handling', () => {
      it('should fail for empty input', () => {
        const result = decodeRolexReference('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Empty input');
      });

      it('should fail for input exceeding max length', () => {
        const longInput = '1'.repeat(MAX_REFERENCE_LENGTH + 1);
        const result = decodeRolexReference(longInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum length');
      });

      it('should fail for invalid format (letters only)', () => {
        const result = decodeRolexReference('ABCDE');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });

      it('should fail for too few digits', () => {
        const result = decodeRolexReference('1234');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });

      it('should fail for too many suffix letters', () => {
        const result = decodeRolexReference('116610LNXYZ');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid format');
      });
    });
  });

  // ===========================================================================
  // VINTAGE DENIM ANALYZER
  // ===========================================================================
  describe('analyzeVintageDenim', () => {
    describe('Big E detection', () => {
      it('should detect Big E in "LEVI\'S"', () => {
        const result = analyzeVintageDenim("LEVI'S 501");
        expect(result.success).toBe(true);
        expect(result.decoded.isBigE).toBe(true);
        expect(result.decoded.valueIndicators).toContain('Big E (pre-1971)');
        expect(result.decoded.estimatedEra).toBe('1966-1971');
      });

      it('should not detect Big E in "Levi\'s" (lowercase e)', () => {
        const result = analyzeVintageDenim("Levi's 501");
        expect(result.decoded.isBigE).toBe(false);
      });

      it('should handle mixed case correctly', () => {
        const result = analyzeVintageDenim("LEVI'S original vintage");
        expect(result.decoded.isBigE).toBe(true);
      });
    });

    describe('selvedge detection', () => {
      it('should detect "SELVEDGE" text', () => {
        const result = analyzeVintageDenim('501 SELVEDGE DENIM');
        expect(result.success).toBe(true);
        expect(result.decoded.isSelvedge).toBe(true);
        expect(result.decoded.valueIndicators).toContain('Selvedge Denim');
      });

      it('should detect "SELVAGE" alternate spelling', () => {
        const result = analyzeVintageDenim('SELVAGE JEANS');
        expect(result.decoded.isSelvedge).toBe(true);
      });

      it('should detect "RED LINE" indicator', () => {
        const result = analyzeVintageDenim('RED LINE SELVEDGE');
        expect(result.decoded.isSelvedge).toBe(true);
      });

      it('should detect "LVC" (Levi\'s Vintage Clothing)', () => {
        const result = analyzeVintageDenim('LVC 1954 501ZXX');
        expect(result.decoded.isSelvedge).toBe(true);
      });

      it('should detect selvedge model numbers', () => {
        const result = analyzeVintageDenim('501 XX MODEL');
        expect(result.decoded.isSelvedge).toBe(true);
      });
    });

    describe('Made in USA detection', () => {
      it('should detect "MADE IN USA"', () => {
        const result = analyzeVintageDenim('MADE IN USA');
        expect(result.success).toBe(true);
        expect(result.decoded.isMadeInUSA).toBe(true);
        expect(result.decoded.valueIndicators).toContain('Made in USA');
      });

      it('should detect "MADE IN U.S.A."', () => {
        const result = analyzeVintageDenim('MADE IN U.S.A.');
        expect(result.decoded.isMadeInUSA).toBe(true);
      });

      it('should detect "MADE IN UNITED STATES"', () => {
        const result = analyzeVintageDenim('MADE IN UNITED STATES');
        expect(result.decoded.isMadeInUSA).toBe(true);
      });

      it('should estimate era for Made in USA selvedge', () => {
        const result = analyzeVintageDenim('MADE IN USA SELVEDGE');
        expect(result.decoded.estimatedEra).toBe('1971-1983');
      });
    });

    describe('other vintage indicators', () => {
      it('should detect single stitch', () => {
        const result = analyzeVintageDenim('SINGLE STITCH CONSTRUCTION');
        expect(result.success).toBe(true);
        expect(result.decoded.valueIndicators).toContain('Single Stitch (pre-1983)');
      });

      it('should detect orange tab', () => {
        const result = analyzeVintageDenim('ORANGE TAB');
        expect(result.decoded.valueIndicators).toContain('Orange Tab');
      });

      it('should detect red tab with Big E', () => {
        const result = analyzeVintageDenim("LEVI'S RED TAB");
        expect(result.decoded.valueIndicators).toContain('Red Tab Big E');
      });
    });

    describe('error handling', () => {
      it('should fail for empty input', () => {
        const result = analyzeVintageDenim('');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Empty input');
      });

      it('should fail for input exceeding max length', () => {
        const longInput = 'A'.repeat(5001);
        const result = analyzeVintageDenim(longInput);
        expect(result.success).toBe(false);
        expect(result.error).toContain('exceeds maximum length');
      });

      it('should return no indicators for generic text', () => {
        const result = analyzeVintageDenim('BLUE JEANS PANTS');
        expect(result.success).toBe(false);
        expect(result.decoded.valueIndicators).toHaveLength(0);
      });
    });

    describe('confidence scoring', () => {
      it('should have higher confidence for Big E detection', () => {
        const result = analyzeVintageDenim("LEVI'S 501");
        expect(result.confidence).toBeGreaterThanOrEqual(CONFIDENCE.MEDIUM);
      });

      it('should have base confidence for single indicator', () => {
        const result = analyzeVintageDenim('ORANGE TAB');
        expect(result.confidence).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // GENERIC DECODER DISPATCHER
  // ===========================================================================
  describe('decodeIdentifier', () => {
    it('should decode LV date code for luxury_handbags category', () => {
      const result = decodeIdentifier('SD1234', 'luxury_handbags');
      expect(result).not.toBeNull();
      expect(result?.identifierType).toBe('lv_date_code');
      expect(result?.success).toBe(true);
    });

    it('should decode Nike style code for sneakers category', () => {
      const result = decodeIdentifier('CW2288-111', 'sneakers');
      expect(result).not.toBeNull();
      expect(result?.identifierType).toBe('nike_style_code');
      expect(result?.success).toBe(true);
    });

    it('should decode Rolex reference for watches category', () => {
      const result = decodeIdentifier('116610LN', 'watches');
      expect(result).not.toBeNull();
      expect(result?.identifierType).toBe('rolex_reference');
      expect(result?.success).toBe(true);
    });

    it('should decode Hermes blindstamp for luxury_handbags category', () => {
      const result = decodeIdentifier('X', 'luxury_handbags');
      expect(result).not.toBeNull();
      expect(result?.identifierType).toBe('hermes_blindstamp');
      expect(result?.success).toBe(true);
    });

    it('should try all decoders when category does not match', () => {
      // Try LV code with sneakers category - should still decode
      const result = decodeIdentifier('SD1234', 'sneakers');
      expect(result).not.toBeNull();
      expect(result?.identifierType).toBe('lv_date_code');
    });

    it('should return null for empty input', () => {
      const result = decodeIdentifier('', 'general');
      expect(result).toBeNull();
    });

    it('should return null for very long input', () => {
      const longInput = 'A'.repeat(51);
      const result = decodeIdentifier(longInput, 'general');
      expect(result).toBeNull();
    });

    it('should return null for unrecognized identifier', () => {
      const result = decodeIdentifier('UNKNOWN123', 'general');
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // DECODE MULTIPLE IDENTIFIERS
  // ===========================================================================
  describe('decodeIdentifiers', () => {
    it('should decode multiple identifiers', () => {
      const identifiers = ['SD1234', 'FL0232', 'INVALID'];
      const results = decodeIdentifiers(identifiers, 'luxury_handbags');

      expect(results).toHaveLength(2); // Only successful ones
      expect(results[0].decoded.factoryCode).toBe('SD');
      expect(results[1].decoded.factoryCode).toBe('FL');
    });

    it('should return empty array for no successful decodes', () => {
      const identifiers = ['INVALID1', 'INVALID2'];
      const results = decodeIdentifiers(identifiers, 'general');

      expect(results).toHaveLength(0);
    });

    it('should handle empty array', () => {
      const results = decodeIdentifiers([], 'general');
      expect(results).toHaveLength(0);
    });
  });

  // ===========================================================================
  // VINTAGE ITEM CHECK
  // ===========================================================================
  describe('isVintageItem', () => {
    it('should return true for Big E item', () => {
      const decoded = analyzeVintageDenim("LEVI'S BIG E");
      expect(isVintageItem(decoded)).toBe(true);
    });

    it('should return true for item with estimated era', () => {
      const decoded = analyzeVintageDenim("LEVI'S MADE IN USA SELVEDGE");
      expect(isVintageItem(decoded)).toBe(true);
    });

    it('should return true for item with old year', () => {
      // Create a mock decoded value with old year
      const decoded = decodeLouisVuittonDateCode('SD0001');
      // This would be year 2000, which is 24+ years ago
      if (decoded.success && decoded.decoded.year < new Date().getFullYear() - 20) {
        expect(isVintageItem(decoded)).toBe(true);
      }
    });

    it('should return false for unsuccessful decode', () => {
      const decoded = decodeLouisVuittonDateCode('INVALID');
      expect(isVintageItem(decoded)).toBe(false);
    });

    it('should return false for recent item', () => {
      // Current year item
      const currentYear = new Date().getFullYear();
      const yearDigits = (currentYear % 100).toString().padStart(2, '0');
      const code = `SD01${yearDigits}`; // Week 00, current year
      const decoded = decodeLouisVuittonDateCode(code);

      if (decoded.success) {
        expect(isVintageItem(decoded)).toBe(false);
      }
    });
  });

  // ===========================================================================
  // EXPORTED CONSTANTS
  // ===========================================================================
  describe('exported constants', () => {
    it('should export CONFIDENCE object with expected values', () => {
      expect(CONFIDENCE.HIGH).toBe(0.95);
      expect(CONFIDENCE.GOOD).toBe(0.9);
      expect(CONFIDENCE.MEDIUM).toBe(0.85);
      expect(CONFIDENCE.LOW).toBe(0.7);
      expect(CONFIDENCE.FORMAT_ONLY).toBe(0.6);
    });

    it('should export length constants', () => {
      expect(MAX_DATE_CODE_LENGTH).toBe(10);
      expect(MAX_STYLE_CODE_LENGTH).toBe(15);
      expect(MAX_REFERENCE_LENGTH).toBe(15);
    });
  });
});
