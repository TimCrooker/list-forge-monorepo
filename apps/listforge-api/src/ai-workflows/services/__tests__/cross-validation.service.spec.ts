import { CrossValidationService } from '../cross-validation.service';
import {
  FieldDataSource,
  FieldDataSourceType,
  FieldConfidenceScore,
  SourceIndependenceGroup,
} from '@listforge/core-types';

describe('CrossValidationService', () => {
  let service: CrossValidationService;

  beforeEach(() => {
    service = new CrossValidationService();
  });

  // Helper to create a FieldDataSource
  const createSource = (
    type: FieldDataSourceType,
    confidence: number,
    rawValue?: unknown,
  ): FieldDataSource => ({
    type,
    confidence,
    timestamp: new Date().toISOString(),
    rawValue,
  });

  // Helper to create a FieldConfidenceScore
  const createConfidenceScore = (
    value: number,
    sources: FieldDataSource[],
  ): FieldConfidenceScore => ({
    value,
    sources,
    lastUpdated: new Date().toISOString(),
  });

  describe('getSourceGroup', () => {
    it('should return amazon group for amazon-related sources', () => {
      expect(service.getSourceGroup('amazon_catalog')).toBe('amazon');
      expect(service.getSourceGroup('keepa')).toBe('amazon');
      expect(service.getSourceGroup('amazon_sp_api')).toBe('amazon');
    });

    it('should return vision group for vision-related sources', () => {
      expect(service.getSourceGroup('vision_ai')).toBe('vision');
      expect(service.getSourceGroup('vision_analysis_guided')).toBe('vision');
    });

    it('should return text_extraction group for OCR sources', () => {
      expect(service.getSourceGroup('ocr')).toBe('text_extraction');
      expect(service.getSourceGroup('ocr_search')).toBe('text_extraction');
    });

    it('should return ebay group for eBay sources', () => {
      expect(service.getSourceGroup('ebay_sold')).toBe('ebay');
      expect(service.getSourceGroup('ebay_active')).toBe('ebay');
      expect(service.getSourceGroup('ebay_api')).toBe('ebay');
    });

    it('should return web group for web search sources', () => {
      expect(service.getSourceGroup('web_search')).toBe('web');
      expect(service.getSourceGroup('web_search_targeted')).toBe('web');
      expect(service.getSourceGroup('web_search_general')).toBe('web');
      expect(service.getSourceGroup('reverse_image_search')).toBe('web');
    });

    it('should return user group for user input sources', () => {
      expect(service.getSourceGroup('user_input')).toBe('user');
      expect(service.getSourceGroup('user_hint')).toBe('user');
    });

    it('should return upc group for UPC lookup', () => {
      expect(service.getSourceGroup('upc_lookup')).toBe('upc');
    });

    it('should default to web for unknown source types', () => {
      // Cast to bypass TypeScript for testing unknown types
      expect(service.getSourceGroup('unknown_source' as FieldDataSourceType)).toBe('web');
    });
  });

  describe('countIndependentGroups', () => {
    it('should return 0 for empty sources', () => {
      expect(service.countIndependentGroups([])).toBe(0);
    });

    it('should return 1 for sources from same group', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('keepa', 0.85),
      ];
      expect(service.countIndependentGroups(sources)).toBe(1);
    });

    it('should return 2 for sources from different groups', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      expect(service.countIndependentGroups(sources)).toBe(2);
    });

    it('should return 3 for sources from three different groups', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
        createSource('upc_lookup', 0.95),
      ];
      expect(service.countIndependentGroups(sources)).toBe(3);
    });

    it('should not double count sources from same group', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('keepa', 0.85),
        createSource('amazon_sp_api', 0.88),
        createSource('web_search', 0.8),
      ];
      expect(service.countIndependentGroups(sources)).toBe(2); // amazon + web
    });
  });

  describe('getRepresentedGroups', () => {
    it('should return empty array for no sources', () => {
      expect(service.getRepresentedGroups([])).toEqual([]);
    });

    it('should return unique groups represented', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('keepa', 0.85),
        createSource('web_search', 0.8),
        createSource('upc_lookup', 0.95),
      ];
      const groups = service.getRepresentedGroups(sources);
      expect(groups).toHaveLength(3);
      expect(groups).toContain('amazon');
      expect(groups).toContain('web');
      expect(groups).toContain('upc');
    });
  });

  describe('valuesAgree', () => {
    describe('exact matches', () => {
      it('should return true for identical values', () => {
        expect(service.valuesAgree('test', 'test')).toBe(true);
        expect(service.valuesAgree(42, 42)).toBe(true);
        expect(service.valuesAgree(true, true)).toBe(true);
      });

      it('should return true for both null/undefined', () => {
        expect(service.valuesAgree(null, null)).toBe(true);
        expect(service.valuesAgree(undefined, undefined)).toBe(true);
        expect(service.valuesAgree(null, undefined)).toBe(true);
      });

      it('should return false when one is null and other is not', () => {
        expect(service.valuesAgree(null, 'test')).toBe(false);
        expect(service.valuesAgree('test', null)).toBe(false);
        expect(service.valuesAgree(undefined, 42)).toBe(false);
      });
    });

    describe('string comparison', () => {
      it('should be case-insensitive', () => {
        expect(service.valuesAgree('Nike', 'nike')).toBe(true);
        expect(service.valuesAgree('NIKE', 'Nike')).toBe(true);
      });

      it('should trim whitespace', () => {
        expect(service.valuesAgree('  Nike  ', 'Nike')).toBe(true);
        expect(service.valuesAgree('Nike', '  Nike')).toBe(true);
      });

      it('should return false for different strings', () => {
        expect(service.valuesAgree('Nike', 'Adidas')).toBe(false);
      });
    });

    describe('numeric comparison', () => {
      it('should return true for identical numbers', () => {
        expect(service.valuesAgree(100, 100)).toBe(true);
      });

      it('should return true for numbers within 5% tolerance', () => {
        // 100 and 104 -> diff = 4, avg = 102, 4/102 = 0.039 < 0.05
        expect(service.valuesAgree(100, 104)).toBe(true);
        expect(service.valuesAgree(104, 100)).toBe(true);
      });

      it('should return false for numbers outside 5% tolerance', () => {
        // 100 and 110 -> diff = 10, avg = 105, 10/105 = 0.095 > 0.05
        expect(service.valuesAgree(100, 110)).toBe(false);
      });

      it('should handle zero values correctly', () => {
        expect(service.valuesAgree(0, 0)).toBe(true);
        expect(service.valuesAgree(0, 1)).toBe(false);
      });
    });

    describe('array comparison', () => {
      it('should return true for identical arrays', () => {
        expect(service.valuesAgree(['a', 'b'], ['a', 'b'])).toBe(true);
      });

      it('should return true for same elements in different order', () => {
        expect(service.valuesAgree(['a', 'b'], ['b', 'a'])).toBe(true);
      });

      it('should return false for different length arrays', () => {
        expect(service.valuesAgree(['a', 'b'], ['a'])).toBe(false);
      });

      it('should return false for arrays with different elements', () => {
        expect(service.valuesAgree(['a', 'b'], ['a', 'c'])).toBe(false);
      });

      it('should apply string comparison rules to array elements', () => {
        expect(service.valuesAgree(['Nike', 'Adidas'], ['nike', 'adidas'])).toBe(true);
      });
    });

    describe('type mismatches', () => {
      it('should return false for different types', () => {
        expect(service.valuesAgree('100', 100)).toBe(false);
        expect(service.valuesAgree(true, 'true')).toBe(false);
      });
    });
  });

  describe('detectConflicts', () => {
    it('should return empty array when no sources', () => {
      const conflicts = service.detectConflicts('brand', []);
      expect(conflicts).toEqual([]);
    });

    it('should not detect conflicts between sources from same group', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('keepa', 0.85, 'Adidas'), // Different value, same group
      ];
      const conflicts = service.detectConflicts('brand', sources);
      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts between sources from different groups', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Adidas'),
      ];
      const conflicts = service.detectConflicts('brand', sources);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].fieldName).toBe('brand');
      expect(conflicts[0].value1).toBe('Nike');
      expect(conflicts[0].value2).toBe('Adidas');
      expect(conflicts[0].group1).toBe('amazon');
      expect(conflicts[0].group2).toBe('web');
    });

    it('should not detect conflicts when values agree', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'nike'), // Same value, different case
      ];
      const conflicts = service.detectConflicts('brand', sources);
      expect(conflicts).toHaveLength(0);
    });

    it('should skip sources without rawValue', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8), // No rawValue
      ];
      const conflicts = service.detectConflicts('brand', sources);
      expect(conflicts).toHaveLength(0);
    });

    it('should detect multiple conflicts', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Adidas'),
        createSource('upc_lookup', 0.95, 'Puma'),
      ];
      const conflicts = service.detectConflicts('brand', sources);
      // amazon vs web, amazon vs upc, web vs upc = 3 conflicts
      expect(conflicts).toHaveLength(3);
    });

    it('should classify minor conflicts for partial string matches', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike Air Max'),
        createSource('web_search', 0.8, 'Nike Air Max 90'), // Contains the other
      ];
      const conflicts = service.detectConflicts('title', sources);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('minor');
    });

    it('should classify major conflicts for completely different values', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Adidas'),
      ];
      const conflicts = service.detectConflicts('brand', sources);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('major');
    });

    it('should classify numeric conflicts within 20% as minor', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 100),
        createSource('web_search', 0.8, 115), // 15% difference
      ];
      const conflicts = service.detectConflicts('price', sources);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('minor');
    });

    it('should classify numeric conflicts over 20% as major', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 100),
        createSource('web_search', 0.8, 150), // 50% difference
      ];
      const conflicts = service.detectConflicts('price', sources);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].severity).toBe('major');
    });
  });

  describe('calculateCorroborationMultiplier', () => {
    it('should return 0.80 for single source (penalty)', () => {
      const sources = [createSource('amazon_catalog', 0.9)];
      const multiplier = service.calculateCorroborationMultiplier(sources, []);
      expect(multiplier).toBe(0.80);
    });

    it('should return 1.00 for two independent sources (baseline)', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      const multiplier = service.calculateCorroborationMultiplier(sources, []);
      expect(multiplier).toBe(1.00);
    });

    it('should return 1.10 for three independent sources (bonus)', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
        createSource('upc_lookup', 0.95),
      ];
      const multiplier = service.calculateCorroborationMultiplier(sources, []);
      expect(multiplier).toBe(1.10);
    });

    it('should cap multiplier at 1.10 for many sources', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
        createSource('upc_lookup', 0.95),
        createSource('ebay_sold', 0.85),
        createSource('vision_ai', 0.88),
      ];
      const multiplier = service.calculateCorroborationMultiplier(sources, []);
      expect(multiplier).toBe(1.10);
    });

    it('should apply 0.10 penalty per major conflict', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      const majorConflict = {
        fieldName: 'brand',
        value1: 'Nike',
        source1: 'amazon_catalog' as FieldDataSourceType,
        group1: 'amazon' as SourceIndependenceGroup,
        value2: 'Adidas',
        source2: 'web_search' as FieldDataSourceType,
        group2: 'web' as SourceIndependenceGroup,
        severity: 'major' as const,
        timestamp: new Date().toISOString(),
      };
      const multiplier = service.calculateCorroborationMultiplier(sources, [majorConflict]);
      expect(multiplier).toBe(0.90); // 1.00 - 0.10
    });

    it('should apply 0.05 penalty per minor conflict', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      const minorConflict = {
        fieldName: 'title',
        value1: 'Nike Air Max',
        source1: 'amazon_catalog' as FieldDataSourceType,
        group1: 'amazon' as SourceIndependenceGroup,
        value2: 'Nike Air Max 90',
        source2: 'web_search' as FieldDataSourceType,
        group2: 'web' as SourceIndependenceGroup,
        severity: 'minor' as const,
        timestamp: new Date().toISOString(),
      };
      const multiplier = service.calculateCorroborationMultiplier(sources, [minorConflict]);
      expect(multiplier).toBe(0.95); // 1.00 - 0.05
    });

    it('should not go below 0.50 floor', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      // 10 major conflicts = 1.0 penalty
      const conflicts = Array(10).fill(null).map(() => ({
        fieldName: 'brand',
        value1: 'Nike',
        source1: 'amazon_catalog' as FieldDataSourceType,
        group1: 'amazon' as SourceIndependenceGroup,
        value2: 'Adidas',
        source2: 'web_search' as FieldDataSourceType,
        group2: 'web' as SourceIndependenceGroup,
        severity: 'major' as const,
        timestamp: new Date().toISOString(),
      }));
      const multiplier = service.calculateCorroborationMultiplier(sources, conflicts);
      expect(multiplier).toBe(0.50);
    });

    it('should count multiple sources from same group as one', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('keepa', 0.85),
        createSource('amazon_sp_api', 0.88),
      ];
      const multiplier = service.calculateCorroborationMultiplier(sources, []);
      expect(multiplier).toBe(0.80); // Still only 1 independent group
    });
  });

  describe('calculateCrossValidatedConfidence', () => {
    it('should apply multiplier to base confidence', () => {
      const sources = [createSource('amazon_catalog', 0.9)];
      const result = service.calculateCrossValidatedConfidence(0.85, sources, []);
      expect(result.confidence).toBeCloseTo(0.68, 2); // 0.85 * 0.80
      expect(result.multiplier).toBe(0.80);
    });

    it('should cap confidence at 0.98', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
        createSource('upc_lookup', 0.95),
      ];
      const result = service.calculateCrossValidatedConfidence(0.95, sources, []);
      expect(result.confidence).toBe(0.98); // Capped even though 0.95 * 1.10 = 1.045
    });

    it('should calculate agreement score correctly', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      const result = service.calculateCrossValidatedConfidence(0.85, sources, []);
      expect(result.agreementScore).toBe(1.0); // No conflicts
    });

    it('should reduce agreement score with conflicts', () => {
      const sources = [
        createSource('amazon_catalog', 0.9),
        createSource('web_search', 0.8),
      ];
      const conflict = {
        fieldName: 'brand',
        value1: 'Nike',
        source1: 'amazon_catalog' as FieldDataSourceType,
        group1: 'amazon' as SourceIndependenceGroup,
        value2: 'Adidas',
        source2: 'web_search' as FieldDataSourceType,
        group2: 'web' as SourceIndependenceGroup,
        severity: 'major' as const,
        timestamp: new Date().toISOString(),
      };
      const result = service.calculateCrossValidatedConfidence(0.85, sources, [conflict]);
      expect(result.agreementScore).toBe(0); // 1 conflict out of 1 possible cross-group pair
    });
  });

  describe('crossValidateField', () => {
    it('should return complete CrossValidatedField object', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Nike'),
      ];
      const confidenceScore = createConfidenceScore(0.85, sources);

      const result = service.crossValidateField('brand', 'Nike', confidenceScore);

      expect(result.fieldName).toBe('brand');
      expect(result.value).toBe('Nike');
      expect(result.baseConfidence).toBe(0.85);
      expect(result.crossValidatedConfidence).toBe(0.85); // 0.85 * 1.00 (2 groups, no conflicts)
      expect(result.independentGroupCount).toBe(2);
      expect(result.agreementScore).toBe(1.0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.corroborationMultiplier).toBe(1.00);
    });

    it('should detect and include conflicts', () => {
      const sources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Adidas'),
      ];
      const confidenceScore = createConfidenceScore(0.85, sources);

      const result = service.crossValidateField('brand', 'Nike', confidenceScore);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].fieldName).toBe('brand');
    });
  });

  describe('crossValidateAllFields', () => {
    it('should validate all provided fields', () => {
      const brandSources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Nike'),
      ];
      const priceSources = [
        createSource('amazon_catalog', 0.9, 99.99),
        createSource('ebay_sold', 0.85, 99.99),
      ];

      const fields = {
        brand: {
          value: 'Nike',
          confidence: createConfidenceScore(0.85, brandSources),
        },
        price: {
          value: 99.99,
          confidence: createConfidenceScore(0.90, priceSources),
        },
      };

      const result = service.crossValidateAllFields(fields);

      expect(Object.keys(result.fields)).toHaveLength(2);
      expect(result.fields.brand).toBeDefined();
      expect(result.fields.price).toBeDefined();
    });

    it('should count total conflicts across all fields', () => {
      const brandSources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Adidas'),
      ];
      const priceSources = [
        createSource('amazon_catalog', 0.9, 100),
        createSource('ebay_sold', 0.85, 150), // Conflict
      ];

      const fields = {
        brand: {
          value: 'Nike',
          confidence: createConfidenceScore(0.85, brandSources),
        },
        price: {
          value: 100,
          confidence: createConfidenceScore(0.90, priceSources),
        },
      };

      const result = service.crossValidateAllFields(fields);

      expect(result.totalConflicts).toBe(2); // One conflict per field
    });

    it('should count fields with multiple independent sources', () => {
      const brandSources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Nike'),
      ];
      const priceSources = [
        createSource('amazon_catalog', 0.9, 100),
      ];

      const fields = {
        brand: {
          value: 'Nike',
          confidence: createConfidenceScore(0.85, brandSources),
        },
        price: {
          value: 100,
          confidence: createConfidenceScore(0.90, priceSources),
        },
      };

      const result = service.crossValidateAllFields(fields);

      expect(result.fieldsWithMultipleIndependentSources).toBe(1); // Only brand has 2 groups
    });

    it('should calculate average corroboration', () => {
      const brandSources = [
        createSource('amazon_catalog', 0.9, 'Nike'),
        createSource('web_search', 0.8, 'Nike'),
      ];
      const priceSources = [
        createSource('amazon_catalog', 0.9, 100),
      ];

      const fields = {
        brand: {
          value: 'Nike',
          confidence: createConfidenceScore(0.85, brandSources),
        },
        price: {
          value: 100,
          confidence: createConfidenceScore(0.90, priceSources),
        },
      };

      const result = service.crossValidateAllFields(fields);

      // brand: 1.00 (2 groups), price: 0.80 (1 group)
      // Average: (1.00 + 0.80) / 2 = 0.90
      expect(result.averageCorroboration).toBe(0.90);
    });

    it('should return 1.0 average corroboration for empty fields', () => {
      const result = service.crossValidateAllFields({});
      expect(result.averageCorroboration).toBe(1.0);
    });
  });
});
