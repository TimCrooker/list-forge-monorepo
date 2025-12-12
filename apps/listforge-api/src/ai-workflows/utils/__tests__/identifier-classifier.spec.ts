import {
  isLikelyIdentifier,
  inferTextRegion,
  classifyTextChunks,
  getIdentifierChunks,
  extractSearchQueries,
  IDENTIFIER_PATTERNS,
} from '../identifier-classifier';

describe('Identifier Classifier', () => {
  describe('isLikelyIdentifier', () => {
    describe('should identify alpha_prefix patterns', () => {
      it('should match AB-12345', () => {
        const result = isLikelyIdentifier('AB-12345');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('alpha_prefix');
      });

      it('should match ABC1234', () => {
        const result = isLikelyIdentifier('ABC1234');
        expect(result.isIdentifier).toBe(true);
      });

      it('should match ABCD12345', () => {
        const result = isLikelyIdentifier('ABCD12345');
        expect(result.isIdentifier).toBe(true);
      });
    });

    describe('should identify numeric_prefix patterns', () => {
      it('should match 12345-AB', () => {
        const result = isLikelyIdentifier('12345-AB');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('numeric_prefix');
      });

      it('should match 1234AB', () => {
        const result = isLikelyIdentifier('1234AB');
        expect(result.isIdentifier).toBe(true);
      });
    });

    describe('should identify date_code patterns (Louis Vuitton style)', () => {
      it('should match A12B34', () => {
        const result = isLikelyIdentifier('A12B34');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('date_code');
      });

      it('should match FL0232', () => {
        const result = isLikelyIdentifier('FL0232');
        expect(result.isIdentifier).toBe(true);
      });
    });

    describe('should identify mixed_model patterns', () => {
      it('should match WL574EGG (New Balance style)', () => {
        const result = isLikelyIdentifier('WL574EGG');
        expect(result.isIdentifier).toBe(true);
      });

      it('should match SM-G991B (Samsung style)', () => {
        const result = isLikelyIdentifier('SM-G991B');
        expect(result.isIdentifier).toBe(true);
      });

      it('should match WH-1000XM4 (Sony style)', () => {
        const result = isLikelyIdentifier('WH-1000XM4');
        expect(result.isIdentifier).toBe(true);
      });
    });

    describe('should identify hyphenated_model patterns', () => {
      it('should match A-1234BC', () => {
        const result = isLikelyIdentifier('A-1234BC');
        expect(result.isIdentifier).toBe(true);
      });

      it('should match SM-G991', () => {
        const result = isLikelyIdentifier('SM-G991');
        expect(result.isIdentifier).toBe(true);
      });
    });

    describe('should identify upc_ean patterns', () => {
      it('should match 12 digit UPC', () => {
        const result = isLikelyIdentifier('012345678901');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('upc_ean');
      });

      it('should match 13 digit EAN', () => {
        const result = isLikelyIdentifier('0123456789012');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('upc_ean');
      });

      it('should match 14 digit GTIN', () => {
        const result = isLikelyIdentifier('01234567890123');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('upc_ean');
      });
    });

    describe('should identify part_number patterns', () => {
      it('should match 123-456-789', () => {
        const result = isLikelyIdentifier('123-456-789');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('part_number');
      });
    });

    describe('should identify sku patterns', () => {
      it('should match SKU12345', () => {
        const result = isLikelyIdentifier('SKU12345');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('sku');
      });

      it('should match SKU-ABC123', () => {
        const result = isLikelyIdentifier('SKU-ABC123');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('sku');
      });

      it('should match SKU:XYZ789', () => {
        const result = isLikelyIdentifier('SKU:XYZ789');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('sku');
      });
    });

    describe('should identify style_number patterns', () => {
      it('should match 574 (shoe style)', () => {
        const result = isLikelyIdentifier('574');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('style_number');
      });

      it('should match 990v5 (versioned style)', () => {
        const result = isLikelyIdentifier('990v5');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('style_number');
      });
    });

    describe('should identify apple_model patterns', () => {
      it('should match A1234', () => {
        const result = isLikelyIdentifier('A1234');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('apple_model');
      });

      it('should match A2141 (MacBook)', () => {
        const result = isLikelyIdentifier('A2141');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('apple_model');
      });
    });

    describe('should identify asin patterns', () => {
      it('should match B0ABCDEFGH (Amazon ASIN)', () => {
        const result = isLikelyIdentifier('B0ABCDEFGH');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('asin');
      });

      it('should match B01234ABCD', () => {
        const result = isLikelyIdentifier('B01234ABCD');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('asin');
      });
    });

    describe('should identify generic_alphanumeric patterns', () => {
      it('should match generic alphanumeric codes', () => {
        const result = isLikelyIdentifier('X8Y9Z0');
        expect(result.isIdentifier).toBe(true);
        expect(result.pattern).toBe('generic_alphanumeric');
      });
    });

    describe('should reject noise and invalid inputs', () => {
      it('should reject pure words without numbers', () => {
        expect(isLikelyIdentifier('leather').isIdentifier).toBe(false);
        expect(isLikelyIdentifier('genuine').isIdentifier).toBe(false);
        expect(isLikelyIdentifier('authentic').isIdentifier).toBe(false);
      });

      it('should reject common noise words', () => {
        expect(isLikelyIdentifier('black').isIdentifier).toBe(false);
        expect(isLikelyIdentifier('small').isIdentifier).toBe(false);
        expect(isLikelyIdentifier('cotton').isIdentifier).toBe(false);
      });

      it('should reject strings that are too short', () => {
        expect(isLikelyIdentifier('AB').isIdentifier).toBe(false);
        expect(isLikelyIdentifier('1').isIdentifier).toBe(false);
      });

      it('should reject strings that are too long', () => {
        const longString = 'A'.repeat(35);
        expect(isLikelyIdentifier(longString).isIdentifier).toBe(false);
      });

      it('should handle whitespace correctly', () => {
        const result = isLikelyIdentifier('  AB-12345  ');
        expect(result.isIdentifier).toBe(true);
      });

      it('should be case-insensitive', () => {
        expect(isLikelyIdentifier('ab-12345').isIdentifier).toBe(true);
        expect(isLikelyIdentifier('AB-12345').isIdentifier).toBe(true);
        expect(isLikelyIdentifier('Ab-12345').isIdentifier).toBe(true);
      });
    });
  });

  describe('inferTextRegion', () => {
    it('should identify label indicators', () => {
      expect(inferTextRegion('Size: Large')).toBe('label');
      expect(inferTextRegion('Made in China')).toBe('label');
      expect(inferTextRegion('Fabric: 100% Cotton')).toBe('label');
    });

    it('should identify tag indicators (care instructions)', () => {
      expect(inferTextRegion('Machine wash cold')).toBe('tag');
      expect(inferTextRegion('Dry clean only')).toBe('tag');
      expect(inferTextRegion('Do not bleach')).toBe('tag');
    });

    it('should identify packaging indicators', () => {
      expect(inferTextRegion('UPC: 012345678901')).toBe('packaging');
      expect(inferTextRegion('SKU: ABC123')).toBe('packaging');
      expect(inferTextRegion('Item # 12345')).toBe('packaging');
    });

    it('should return unknown for unrecognized text', () => {
      expect(inferTextRegion('Random text here')).toBe('unknown');
      expect(inferTextRegion('AB-12345')).toBe('unknown');
    });
  });

  describe('classifyTextChunks', () => {
    it('should classify an array of text chunks', () => {
      const rawText = ['AB-12345', 'Made in China', 'leather'];
      const chunks = classifyTextChunks(rawText, 0.8);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].isLikelyIdentifier).toBe(true); // AB-12345 should be first (identifier)
      expect(chunks[0].text).toBe('AB-12345');
    });

    it('should sort identifiers first, then by confidence', () => {
      const rawText = ['leather', 'AB-12345', 'cotton', 'WL574EGG'];
      const chunks = classifyTextChunks(rawText, 0.8);

      // Identifiers should come first
      expect(chunks[0].isLikelyIdentifier).toBe(true);
      expect(chunks[1].isLikelyIdentifier).toBe(true);
      expect(chunks[2].isLikelyIdentifier).toBe(false);
      expect(chunks[3].isLikelyIdentifier).toBe(false);
    });

    it('should boost confidence for identifiers', () => {
      const rawText = ['AB-12345'];
      const chunks = classifyTextChunks(rawText, 0.8);

      expect(chunks[0].confidence).toBeGreaterThan(0.8);
      expect(chunks[0].confidence).toBeLessThanOrEqual(0.95);
    });

    it('should reduce confidence for non-identifiers', () => {
      const rawText = ['leather'];
      const chunks = classifyTextChunks(rawText, 0.8);

      expect(chunks[0].confidence).toBeLessThan(0.8);
    });

    it('should skip very short text', () => {
      const rawText = ['A', 'AB-12345', ''];
      const chunks = classifyTextChunks(rawText);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe('AB-12345');
    });

    it('should assign matched pattern names', () => {
      const rawText = ['A2141', 'B0ABCDEFGH', '012345678901'];
      const chunks = classifyTextChunks(rawText);

      expect(chunks.find(c => c.text === 'A2141')?.matchedPattern).toBe('apple_model');
      expect(chunks.find(c => c.text === 'B0ABCDEFGH')?.matchedPattern).toBe('asin');
      expect(chunks.find(c => c.text === '012345678901')?.matchedPattern).toBe('upc_ean');
    });
  });

  describe('getIdentifierChunks', () => {
    it('should return only identifier-like chunks', () => {
      const rawText = ['AB-12345', 'leather', 'WL574EGG', 'black'];
      const chunks = classifyTextChunks(rawText);
      const identifiers = getIdentifierChunks(chunks);

      expect(identifiers).toHaveLength(2);
      expect(identifiers.every(c => c.isLikelyIdentifier)).toBe(true);
    });

    it('should respect the limit parameter', () => {
      const rawText = ['AB-12345', 'WL574EGG', 'A2141', 'B0ABCDEFGH', '012345678901', '990v5'];
      const chunks = classifyTextChunks(rawText);
      const identifiers = getIdentifierChunks(chunks, 3);

      expect(identifiers).toHaveLength(3);
    });

    it('should return empty array when no identifiers found', () => {
      const rawText = ['leather', 'black', 'cotton'];
      const chunks = classifyTextChunks(rawText);
      const identifiers = getIdentifierChunks(chunks);

      expect(identifiers).toHaveLength(0);
    });
  });

  describe('extractSearchQueries', () => {
    it('should extract search queries from identifier chunks', () => {
      const rawText = ['AB-12345', 'leather', 'WL574EGG'];
      const chunks = classifyTextChunks(rawText);
      const queries = extractSearchQueries(chunks);

      expect(queries).toContain('AB-12345');
      expect(queries).toContain('WL574EGG');
      expect(queries).not.toContain('leather');
    });

    it('should add hyphen-removed variants', () => {
      const rawText = ['AB-12345'];
      const chunks = classifyTextChunks(rawText);
      const queries = extractSearchQueries(chunks, 10);

      expect(queries).toContain('AB-12345');
      expect(queries).toContain('AB12345');
    });

    it('should deduplicate queries', () => {
      const rawText = ['AB-12345', 'AB-12345'];
      const chunks = classifyTextChunks(rawText);
      const queries = extractSearchQueries(chunks);

      const uniqueQueries = [...new Set(queries)];
      expect(queries.length).toBe(uniqueQueries.length);
    });

    it('should respect the limit parameter', () => {
      const rawText = ['AB-12345', 'WL574EGG', 'A2141', 'B0ABCDEFGH'];
      const chunks = classifyTextChunks(rawText);
      const queries = extractSearchQueries(chunks, 2);

      expect(queries.length).toBeLessThanOrEqual(2);
    });

    it('should skip queries shorter than 3 characters', () => {
      // Use actual classification which should filter properly
      const rawText = ['AB', 'ABC123'];
      const chunks = classifyTextChunks(rawText);
      const queries = extractSearchQueries(chunks);

      // AB is too short to be classified as identifier, ABC123 should be included
      expect(queries).toContain('ABC123');
    });
  });

  describe('IDENTIFIER_PATTERNS', () => {
    it('should have 11 patterns defined', () => {
      expect(IDENTIFIER_PATTERNS).toHaveLength(11);
    });

    it('should have unique pattern names', () => {
      const names = IDENTIFIER_PATTERNS.map(p => p.name);
      const uniqueNames = [...new Set(names)];
      expect(names.length).toBe(uniqueNames.length);
    });

    it('should have valid regex patterns', () => {
      for (const { name, pattern } of IDENTIFIER_PATTERNS) {
        expect(pattern).toBeInstanceOf(RegExp);
        expect(name).toBeTruthy();
      }
    });
  });
});
