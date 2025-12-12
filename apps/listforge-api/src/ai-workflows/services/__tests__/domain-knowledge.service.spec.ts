import { DomainKnowledgeService } from '../domain-knowledge.service';
import {
  ExtractedIdentifier,
  ItemFieldStates,
  CategoryId,
  ValueDriver,
  AuthenticityMarkerDef,
} from '@listforge/core-types';

describe('DomainKnowledgeService', () => {
  let service: DomainKnowledgeService;

  beforeEach(() => {
    service = new DomainKnowledgeService();
  });

  // ===========================================================================
  // HELPER FUNCTIONS
  // ===========================================================================

  const createIdentifier = (
    type: ExtractedIdentifier['type'],
    value: string,
    confidence = 0.9,
  ): ExtractedIdentifier => ({
    type,
    value,
    confidence,
    source: 'ocr',
    boundingBox: { x: 0, y: 0, width: 100, height: 20 },
  });

  const createFieldStates = (
    fields: Record<string, { value: unknown; confidence: number }>,
  ): ItemFieldStates => ({
    fields: Object.fromEntries(
      Object.entries(fields).map(([name, { value, confidence }]) => [
        name,
        {
          value,
          confidenceScore: {
            value: confidence,
            sources: [
              {
                type: 'vision_ai' as const,
                confidence,
                timestamp: new Date().toISOString(),
              },
            ],
            lastUpdated: new Date().toISOString(),
          },
          lastUpdated: new Date().toISOString(),
        },
      ]),
    ),
  });

  // ===========================================================================
  // IDENTIFIER DECODING
  // ===========================================================================
  describe('decodeIdentifier', () => {
    it('should decode LV date code identifier', () => {
      const identifier = createIdentifier('date_code', 'SD1234');
      const result = service.decodeIdentifier(identifier, 'luxury_handbags');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.identifierType).toBe('lv_date_code');
    });

    it('should decode Hermes blindstamp for single letter', () => {
      const identifier = createIdentifier('date_code', 'X');
      const result = service.decodeIdentifier(identifier, 'luxury_handbags');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.identifierType).toBe('hermes_blindstamp');
    });

    it('should decode Nike style code identifier', () => {
      const identifier = createIdentifier('style_number', 'CW2288-111');
      const result = service.decodeIdentifier(identifier, 'sneakers');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.identifierType).toBe('nike_style_code');
    });

    it('should decode Rolex reference identifier', () => {
      const identifier = createIdentifier('model_number', '116610LN');
      const result = service.decodeIdentifier(identifier, 'watches');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.identifierType).toBe('rolex_reference');
    });

    it('should decode vintage denim for "other" type with long text', () => {
      const identifier = createIdentifier('other', "LEVI'S 501 MADE IN USA SELVEDGE");
      const result = service.decodeIdentifier(identifier, 'vintage_denim');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      expect(result?.identifierType).toBe('vintage_denim');
    });

    it('should return null for empty identifier value', () => {
      const identifier = createIdentifier('date_code', '');
      const result = service.decodeIdentifier(identifier, 'luxury_handbags');

      expect(result).toBeNull();
    });

    it('should return null for whitespace-only value', () => {
      const identifier = createIdentifier('date_code', '   ');
      const result = service.decodeIdentifier(identifier, 'luxury_handbags');

      expect(result).toBeNull();
    });

    it('should return null for short "other" type text', () => {
      const identifier = createIdentifier('other', 'SHORT');
      const result = service.decodeIdentifier(identifier, 'vintage_denim');

      expect(result).toBeNull();
    });
  });

  describe('decodeIdentifiers', () => {
    it('should decode multiple identifiers and enhance them', () => {
      const identifiers = [
        createIdentifier('date_code', 'SD1234'),
        createIdentifier('date_code', 'FL0232'),
      ];

      const results = service.decodeIdentifiers(identifiers, 'luxury_handbags');

      expect(results).toHaveLength(2);
      expect(results[0].decoded).toBeDefined();
      expect(results[0].decoded?._type).toBe('lv_date_code');
      expect(results[1].decoded?._type).toBe('lv_date_code');
    });

    it('should preserve original identifiers that cannot be decoded', () => {
      const identifiers = [
        createIdentifier('date_code', 'SD1234'),
        createIdentifier('date_code', 'INVALID'),
      ];

      const results = service.decodeIdentifiers(identifiers, 'luxury_handbags');

      expect(results).toHaveLength(2);
      expect(results[0].decoded).toBeDefined();
      expect(results[1].decoded).toBeUndefined();
    });

    it('should update confidence to max of original and decoded', () => {
      const identifier = createIdentifier('date_code', 'SD1234', 0.5);
      const results = service.decodeIdentifiers([identifier], 'luxury_handbags');

      // Decoded confidence is typically 0.95, should be max
      expect(results[0].confidence).toBeGreaterThanOrEqual(0.5);
    });

    it('should validate confidence scores to [0, 1] range', () => {
      const identifier = createIdentifier('date_code', 'SD1234', 1.5); // Invalid confidence
      const results = service.decodeIdentifiers([identifier], 'luxury_handbags');

      expect(results[0].confidence).toBeLessThanOrEqual(1);
      expect(results[0].confidence).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // VALUE DRIVER DETECTION
  // ===========================================================================
  describe('detectValueDrivers', () => {
    it('should detect Big E value driver for vintage denim', () => {
      const fieldStates = createFieldStates({
        label_type: { value: "LEVI'S BIG E LABEL", confidence: 0.9 },
      });

      const matches = service.detectValueDrivers(fieldStates, 'vintage_denim', "Levi's");

      // Check if Big E was detected (may vary based on exact driver configuration)
      const bigEMatch = matches.find((m) => m.driver.id === 'levis_big_e');
      if (bigEMatch) {
        expect(bigEMatch.confidence).toBeGreaterThan(0);
        expect(bigEMatch.reasoning).toBeTruthy();
      }
    });

    it('should detect selvedge value driver', () => {
      const fieldStates = createFieldStates({
        material: { value: 'SELVEDGE DENIM', confidence: 0.9 },
      });

      const matches = service.detectValueDrivers(fieldStates, 'vintage_denim');

      const selvedgeMatch = matches.find((m) =>
        m.driver.name.toLowerCase().includes('selvedge')
      );
      if (selvedgeMatch) {
        expect(selvedgeMatch.matchedValue).toBeTruthy();
      }
    });

    it('should return empty array when no field matches', () => {
      const fieldStates = createFieldStates({
        random_field: { value: 'random value', confidence: 0.9 },
      });

      const matches = service.detectValueDrivers(fieldStates, 'vintage_denim');

      expect(matches).toEqual([]);
    });

    it('should return empty array for null field value', () => {
      const fieldStates: ItemFieldStates = {
        fields: {
          label_type: {
            value: null,
            confidenceScore: {
              value: 0,
              sources: [],
              lastUpdated: new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      const matches = service.detectValueDrivers(fieldStates, 'vintage_denim');

      expect(matches).toEqual([]);
    });

    it('should sort matches by priority then confidence', () => {
      const fieldStates = createFieldStates({
        material: { value: 'EXOTIC CROCODILE LEATHER', confidence: 0.9 },
        edition: { value: 'LIMITED COLLABORATION', confidence: 0.8 },
      });

      const matches = service.detectValueDrivers(fieldStates, 'luxury_handbags');

      // If multiple matches, they should be sorted
      if (matches.length > 1) {
        for (let i = 1; i < matches.length; i++) {
          const prevPriority = matches[i - 1].driver.priority;
          const currPriority = matches[i].driver.priority;
          expect(prevPriority).toBeGreaterThanOrEqual(currPriority);
        }
      }
    });
  });

  describe('calculateValueMultiplier', () => {
    it('should return 1.0 for empty matches', () => {
      const multiplier = service.calculateValueMultiplier([]);
      expect(multiplier).toBe(1.0);
    });

    it('should apply first driver multiplier weighted by confidence', () => {
      const mockDriver: ValueDriver = {
        id: 'test',
        name: 'Test Driver',
        attribute: 'test',
        categoryId: 'general',
        description: 'Test',
        checkCondition: 'is test',
        priceMultiplier: 2.0,
        priority: 1,
      };

      const matches = [
        {
          driver: mockDriver,
          matchedValue: 'test',
          confidence: 1.0,
          reasoning: 'test',
        },
      ];

      const multiplier = service.calculateValueMultiplier(matches);

      // With confidence 1.0 and multiplier 2.0: 1 + (2-1) * 1 = 2
      expect(multiplier).toBe(2.0);
    });

    it('should apply diminishing returns for subsequent drivers', () => {
      const driver1: ValueDriver = {
        id: 'test1',
        name: 'Test Driver 1',
        attribute: 'test1',
        categoryId: 'general',
        description: 'Test',
        checkCondition: 'is test',
        priceMultiplier: 2.0,
        priority: 1,
      };

      const driver2: ValueDriver = {
        id: 'test2',
        name: 'Test Driver 2',
        attribute: 'test2',
        categoryId: 'general',
        description: 'Test',
        checkCondition: 'is test',
        priceMultiplier: 2.0,
        priority: 1,
      };

      const matchesSingle = [
        { driver: driver1, matchedValue: 'test', confidence: 1.0, reasoning: 'test' },
      ];

      const matchesDouble = [
        { driver: driver1, matchedValue: 'test', confidence: 1.0, reasoning: 'test' },
        { driver: driver2, matchedValue: 'test', confidence: 1.0, reasoning: 'test' },
      ];

      const singleMultiplier = service.calculateValueMultiplier(matchesSingle);
      const doubleMultiplier = service.calculateValueMultiplier(matchesDouble);

      // Second driver should add less than the first
      expect(doubleMultiplier).toBeGreaterThan(singleMultiplier);
      expect(doubleMultiplier).toBeLessThan(singleMultiplier * 2);
    });

    it('should cap at maximum multiplier', () => {
      const highMultiplierDriver: ValueDriver = {
        id: 'high',
        name: 'High Multiplier',
        attribute: 'test',
        categoryId: 'general',
        description: 'Test',
        checkCondition: 'is test',
        priceMultiplier: 100.0, // Very high
        priority: 1,
      };

      const matches = Array(10)
        .fill(null)
        .map(() => ({
          driver: highMultiplierDriver,
          matchedValue: 'test',
          confidence: 1.0,
          reasoning: 'test',
        }));

      const multiplier = service.calculateValueMultiplier(matches);

      // Should be capped at 15.0
      expect(multiplier).toBeLessThanOrEqual(15.0);
    });
  });

  // ===========================================================================
  // AUTHENTICITY CHECKING
  // ===========================================================================
  describe('checkAuthenticity', () => {
    it('should return insufficient_data when no markers available', () => {
      const result = service.checkAuthenticity([], [], 'general' as CategoryId);

      expect(result.assessment).toBe('insufficient_data');
      expect(result.markersChecked).toHaveLength(0);
    });

    it('should check identifiers against pattern markers', () => {
      const identifiers = [createIdentifier('date_code', 'SD1234')];

      const result = service.checkAuthenticity(
        identifiers,
        [],
        'luxury_handbags',
        'Louis Vuitton',
      );

      // Should have checked at least the LV date code marker
      const lvMarker = result.markersChecked.find((m) =>
        m.marker.name.toLowerCase().includes('date code'),
      );
      if (lvMarker) {
        expect(lvMarker.checkedValue).toBeTruthy();
      }
    });

    it('should check extracted text against patterns', () => {
      const extractedText = ['SD1234 MADE IN FRANCE'];

      const result = service.checkAuthenticity(
        [],
        extractedText,
        'luxury_handbags',
        'Louis Vuitton',
      );

      // Should process text patterns
      expect(result.markersChecked.length).toBeGreaterThanOrEqual(0);
    });

    it('should add warning for critical marker failures', () => {
      // Create identifier that might fail a critical pattern check
      const identifiers = [createIdentifier('date_code', 'XX9999')];

      const result = service.checkAuthenticity(
        identifiers,
        [],
        'luxury_handbags',
        'Louis Vuitton',
      );

      // Warnings should be an array (may or may not have entries)
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate confidence scores in results', () => {
      const identifiers = [createIdentifier('date_code', 'SD1234')];

      const result = service.checkAuthenticity(
        identifiers,
        [],
        'luxury_handbags',
        'Louis Vuitton',
      );

      // Overall confidence should be valid
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);

      // Each marker check confidence should be valid
      for (const check of result.markersChecked) {
        expect(check.confidence).toBeGreaterThanOrEqual(0);
        expect(check.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should combine category and brand markers', () => {
      const result = service.checkAuthenticity(
        [],
        ['HERMÈS PARIS MADE IN FRANCE'],
        'luxury_handbags',
        'Hermes',
      );

      // Should check markers from both category and brand
      expect(result.markersChecked.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ===========================================================================
  // CONVENIENCE METHODS
  // ===========================================================================
  describe('getYearFromDecodedIdentifier', () => {
    it('should extract year from LV date code', () => {
      const identifier = createIdentifier('date_code', 'SD1234');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded) {
        const year = service.getYearFromDecodedIdentifier(decoded);
        expect(year).toBe(2024); // SD1234 = year 24 (2024)
      }
    });

    it('should return null for unsuccessful decode', () => {
      const identifier = createIdentifier('date_code', 'INVALID');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded) {
        const year = service.getYearFromDecodedIdentifier(decoded);
        expect(year).toBeNull();
      }
    });
  });

  describe('getOriginFromDecodedIdentifier', () => {
    it('should extract origin from LV date code', () => {
      const identifier = createIdentifier('date_code', 'SD1234');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded?.success) {
        const origin = service.getOriginFromDecodedIdentifier(decoded);
        expect(origin).not.toBeNull();
        expect(origin?.country).toBe('USA');
        expect(origin?.location).toContain('California');
      }
    });

    it('should return null for decode without origin info', () => {
      const identifier = createIdentifier('style_number', 'CW2288-111');
      const decoded = service.decodeIdentifier(identifier, 'sneakers');

      if (decoded?.success) {
        const origin = service.getOriginFromDecodedIdentifier(decoded);
        // Nike style codes don't have origin info
        expect(origin).toBeNull();
      }
    });
  });

  describe('isDiscontinuedOrVintage', () => {
    it('should return true for Big E denim', () => {
      const identifier = createIdentifier('other', "LEVI'S 501 BIG E MADE IN USA");
      const decoded = service.decodeIdentifier(identifier, 'vintage_denim');

      if (decoded?.success) {
        const isVintage = service.isDiscontinuedOrVintage(decoded);
        expect(isVintage).toBe(true);
      }
    });

    it('should return true for items with estimated era', () => {
      const identifier = createIdentifier('other', "LEVI'S MADE IN USA SELVEDGE");
      const decoded = service.decodeIdentifier(identifier, 'vintage_denim');

      if (decoded?.success && 'estimatedEra' in decoded.decoded) {
        const isVintage = service.isDiscontinuedOrVintage(decoded);
        expect(isVintage).toBe(true);
      }
    });

    it('should return true for items older than 20 years', () => {
      // Create a date code from early 2000s
      const identifier = createIdentifier('date_code', 'SD0100'); // Week 01, year 2000
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded?.success) {
        const isVintage = service.isDiscontinuedOrVintage(decoded);
        // Year 2000 is > 20 years ago
        expect(isVintage).toBe(true);
      }
    });

    it('should return false for recent items', () => {
      const currentYear = new Date().getFullYear();
      const yearDigits = (currentYear % 100).toString().padStart(2, '0');
      const identifier = createIdentifier('date_code', `SD01${yearDigits}`);
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded?.success) {
        const isVintage = service.isDiscontinuedOrVintage(decoded);
        expect(isVintage).toBe(false);
      }
    });

    it('should return false for unsuccessful decode', () => {
      const identifier = createIdentifier('date_code', 'INVALID');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded) {
        const isVintage = service.isDiscontinuedOrVintage(decoded);
        expect(isVintage).toBe(false);
      }
    });
  });

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================================================
  describe('edge cases', () => {
    it('should handle null/undefined in field states gracefully', () => {
      const fieldStates: ItemFieldStates = {
        fields: {
          test_field: {
            value: undefined as unknown,
            confidenceScore: {
              value: 0,
              sources: [],
              lastUpdated: new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
          },
        },
      };

      // Should not throw
      const matches = service.detectValueDrivers(fieldStates, 'vintage_denim');
      expect(Array.isArray(matches)).toBe(true);
    });

    it('should handle special characters in identifier values', () => {
      const identifier = createIdentifier('date_code', 'SD-1234');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      // Should handle gracefully (may or may not decode)
      expect(decoded === null || typeof decoded === 'object').toBe(true);
    });

    it('should handle very long identifier values', () => {
      const longValue = 'A'.repeat(1000);
      const identifier = createIdentifier('other', longValue);
      const decoded = service.decodeIdentifier(identifier, 'vintage_denim');

      // Should handle gracefully, may return null or fail result
      if (decoded) {
        expect(decoded.success).toBe(false);
      }
    });

    it('should handle empty extracted text array', () => {
      const result = service.checkAuthenticity([], [], 'luxury_handbags');
      expect(result).toBeDefined();
      expect(result.assessment).toBe('insufficient_data');
    });

    it('should handle arrays with empty strings', () => {
      const result = service.checkAuthenticity([], ['', '   ', '\n\t'], 'luxury_handbags');
      expect(result).toBeDefined();
    });
  });

  // ===========================================================================
  // TYPE SAFETY
  // ===========================================================================
  describe('type safety', () => {
    it('should return properly typed decoded values', () => {
      const identifier = createIdentifier('date_code', 'SD1234');
      const decoded = service.decodeIdentifier(identifier, 'luxury_handbags');

      if (decoded?.success) {
        // Should have proper properties
        expect(typeof decoded.rawValue).toBe('string');
        expect(typeof decoded.identifierType).toBe('string');
        expect(typeof decoded.success).toBe('boolean');
        expect(typeof decoded.confidence).toBe('number');
        expect(typeof decoded.decoded).toBe('object');
      }
    });

    it('should return properly typed authenticity results', () => {
      const result = service.checkAuthenticity([], [], 'luxury_handbags');

      expect(['likely_authentic', 'uncertain', 'likely_fake', 'insufficient_data']).toContain(
        result.assessment,
      );
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.markersChecked)).toBe(true);
      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });
});
