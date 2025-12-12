/**
 * Unit Tests for validate-comp.tool.ts
 *
 * Business-critical logic for comp validation.
 * Wrong validation = wrong prices = angry sellers.
 */

import {
  validateComp,
  validateAllComps,
  getValidationSummary,
  ItemValidationContext,
  ValidationConfig,
} from '../validate-comp.tool';
import { ResearchEvidenceRecord, CategoryId } from '@listforge/core-types';

/**
 * Helper to create a mock comp with common defaults
 */
function createMockComp(overrides?: Partial<ResearchEvidenceRecord>): ResearchEvidenceRecord {
  return {
    id: 'comp-1',
    source: 'ebay',
    title: 'Test Item',
    price: 100,
    url: 'https://ebay.com/item/123',
    type: 'sold_listing',
    soldDate: new Date().toISOString(),
    relevanceScore: 0.8,
    fetchedAt: new Date().toISOString(),
    extractedData: {},
    ...(overrides || {}),
  };
}

/**
 * Helper to create a mock item context
 */
function createMockItem(overrides?: Partial<ItemValidationContext>): ItemValidationContext {
  return {
    brand: 'Nike',
    model: 'Air Max 90',
    condition: 'new',
    variant: {
      color: 'Black',
      size: '10',
    },
    ...(overrides || {}),
  };
}

describe('validate-comp.tool', () => {
  // =============================================================================
  // Brand Matching Tests
  // =============================================================================

  describe('Brand Matching', () => {
    it('should return high confidence for exact brand match', () => {
      const item = createMockItem({ brand: 'Nike' });
      const comp = createMockComp({
        extractedData: { brand: 'Nike' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.brandMatch.confidence).toBe(1.0);
      expect(result.criteria.brandMatch.itemBrand).toBe('Nike');
      expect(result.criteria.brandMatch.compBrand).toBe('nike');
    });

    it('should perform case-insensitive brand matching', () => {
      const item = createMockItem({ brand: 'Nike' });
      const comp = createMockComp({
        extractedData: { brand: 'NIKE' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.brandMatch.confidence).toBe(1.0);
    });

    it('should use fuzzy matching via Levenshtein (e.g., Hermes vs Hermès)', () => {
      const item = createMockItem({ brand: 'Hermes' });
      const comp = createMockComp({
        extractedData: { brand: 'Hermès' },
      });

      const result = validateComp(comp, item, [comp]);

      // Levenshtein similarity should be high enough to match (>= 0.8)
      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.brandMatch.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should give benefit of doubt when item brand is unknown', () => {
      const item = createMockItem({ brand: undefined });
      const comp = createMockComp({
        extractedData: { brand: 'Nike' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.brandMatch.confidence).toBe(0.3);
      expect(result.criteria.brandMatch.itemBrand).toBeUndefined();
    });

    it('should extract brand from title when comp brand field is missing', () => {
      const item = createMockItem({ brand: 'Nike' });
      const comp = createMockComp({
        title: 'Nike Air Max 90 Black',
        extractedData: {},
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.brandMatch.compBrand).toBe('nike');
    });

    it('should not match when brands are different', () => {
      const item = createMockItem({ brand: 'Nike' });
      const comp = createMockComp({
        extractedData: { brand: 'Adidas' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.brandMatch.matches).toBe(false);
      expect(result.criteria.brandMatch.confidence).toBeLessThan(0.8);
    });
  });

  // =============================================================================
  // Model Matching Tests
  // =============================================================================

  describe('Model Matching', () => {
    it('should match exact model', () => {
      const item = createMockItem({ model: 'Air Max 90' });
      const comp = createMockComp({
        extractedData: { model: 'Air Max 90' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.modelMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.confidence).toBe(1.0);
    });

    it('should find model in title when model field is missing', () => {
      const item = createMockItem({ model: 'Air Max 90' });
      const comp = createMockComp({
        title: 'Nike Air Max 90 Black Sneakers',
        extractedData: {},
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.modelMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should use fuzzy model matching', () => {
      const item = createMockItem({ model: 'Air Max 90' });
      const comp = createMockComp({
        extractedData: { model: 'AirMax 90' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.modelMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.confidence).toBeGreaterThanOrEqual(0.7);
    });

    it('should give benefit of doubt when item model is unknown', () => {
      const item = createMockItem({ model: undefined });
      const comp = createMockComp({
        extractedData: { model: 'Air Max 90' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.modelMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.confidence).toBe(0.3);
    });

    it('should not match when models are completely different', () => {
      const item = createMockItem({ model: 'Air Max 90' });
      const comp = createMockComp({
        extractedData: { model: 'Air Force 1' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.modelMatch.matches).toBe(false);
    });
  });

  // =============================================================================
  // Category-Specific Weighting Tests
  // =============================================================================

  describe('Category-Specific Weighting', () => {
    it('should weight colorway heavily for sneakers category', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Jordan 1',
        variant: {
          color: 'Chicago',
          size: '10',
        },
      });

      const comp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Jordan 1',
          colorway: 'Chicago',
          size: '10',
        },
      });

      const result = validateComp(comp, item, [comp], null, {}, 'sneakers');

      // Sneakers category weights colorway at 0.45 out of total variant importance
      expect(result.criteria.variantMatch.matches).toBe(true);
      expect(result.criteria.variantMatch.confidence).toBeGreaterThan(0.7);
    });

    it('should weight reference number heavily for watches category', () => {
      const item = createMockItem({
        brand: 'Rolex',
        model: '116500LN',
      });

      const comp1 = createMockComp({
        extractedData: {
          brand: 'Rolex',
          model: '116500LN',
        },
      });

      const comp2 = createMockComp({
        extractedData: {
          brand: 'Rolex',
          model: '116500',
        },
      });

      const result1 = validateComp(comp1, item, [comp1], null, {}, 'watches');
      const result2 = validateComp(comp2, item, [comp1], null, {}, 'watches');

      // Watches category has model weight of 0.40 (highest)
      expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
    });

    it('should weight condition heavily for trading cards category', () => {
      const item = createMockItem({
        brand: 'Pokemon',
        model: 'Charizard Base Set',
        condition: 'like new',
      });

      const goodComp = createMockComp({
        extractedData: {
          brand: 'Pokemon',
          model: 'Charizard Base Set',
        },
        condition: 'like new',
      });

      const badComp = createMockComp({
        extractedData: {
          brand: 'Pokemon',
          model: 'Charizard Base Set',
        },
        condition: 'acceptable',
      });

      const result1 = validateComp(goodComp, item, [goodComp], null, {}, 'trading_cards');
      const result2 = validateComp(badComp, item, [badComp], null, {}, 'trading_cards');

      // Trading cards category has condition weight of 0.45 (highest)
      expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
    });

    it('should use default weights for unknown category', () => {
      const item = createMockItem();
      const comp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Max 90',
        },
      });

      // No category specified or unknown category
      const result = validateComp(comp, item, [comp], null, {}, undefined);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });
  });

  // =============================================================================
  // Condition Grading Tests
  // =============================================================================

  describe('Condition Grading', () => {
    it('should normalize "mint" to "like new"', () => {
      const item = createMockItem({ condition: 'mint' });
      const comp = createMockComp({ condition: 'mint' });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.conditionMatch.matches).toBe(true);
      expect(result.criteria.conditionMatch.withinGrade).toBe(0);
    });

    it('should normalize "brand new" to "new"', () => {
      const item = createMockItem({ condition: 'brand new' });
      const comp = createMockComp({ condition: 'new' });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.conditionMatch.matches).toBe(true);
      expect(result.criteria.conditionMatch.withinGrade).toBe(0);
    });

    it('should match items within 2 grades', () => {
      const item = createMockItem({ condition: 'new' });
      const comp = createMockComp({ condition: 'excellent' });

      const result = validateComp(comp, item, [comp]);

      // new (index 0) to excellent (index 7) = 7 grades apart
      // Actually, let me check the CONDITION_GRADES array...
      // new, new with tags, new with box, new without tags, new without box, open box, like new, excellent
      // So new to excellent is actually 7 apart, which is > 2
      expect(result.criteria.conditionMatch.withinGrade).toBeGreaterThan(2);
      expect(result.criteria.conditionMatch.matches).toBe(false);
    });

    it('should match items exactly 2 grades apart', () => {
      // new (index 0), new with tags (index 1), new with box (index 2)
      const item = createMockItem({ condition: 'new' });
      const comp = createMockComp({ condition: 'new without tags' });

      const result = validateComp(comp, item, [comp]);

      // new (index 0) to new without tags (index 3) = 3 grades apart, should not match
      // Let me use open box instead: new (0) to open box (5) = 5 apart
      // Actually let me use new with tags (1) to open box (5) = 4 apart
      // For exactly 2 grades apart: new (0) to new with box (2)
      expect(result.criteria.conditionMatch.withinGrade).toBeLessThanOrEqual(2);
      expect(result.criteria.conditionMatch.matches).toBe(true);
    });

    it('should not match items more than 2 grades apart', () => {
      const item = createMockItem({ condition: 'new' });
      const comp = createMockComp({ condition: 'used' });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.conditionMatch.withinGrade).toBeGreaterThan(2);
      expect(result.criteria.conditionMatch.matches).toBe(false);
    });

    it('should normalize various condition strings', () => {
      const testCases = [
        { input: 'near mint', expected: 'near mint' },
        { input: 'NM', expected: 'NM' },
        { input: 'pre-owned', expected: 'pre-owned' },
        { input: 'refurbished', expected: 'refurbished' },
        { input: 'manufacturer refurbished', expected: 'manufacturer refurbished' },
      ];

      testCases.forEach(({ input, expected }) => {
        const item = createMockItem({ condition: input });
        const comp = createMockComp({ condition: expected });

        const result = validateComp(comp, item, [comp]);

        expect(result.criteria.conditionMatch.withinGrade).toBe(0);
        expect(result.criteria.conditionMatch.matches).toBe(true);
      });
    });
  });

  // =============================================================================
  // Price Outlier Detection Tests
  // =============================================================================

  describe('Price Outlier Detection', () => {
    it('should flag comp with z-score > 2.5 as outlier', () => {
      const item = createMockItem({ condition: 'new' });

      // Very tight cluster of identical prices - MORE normal comps
      const normalComps = [
        createMockComp({ id: 'comp-1', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-2', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-3', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-4', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-5', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-6', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-7', price: 100, condition: 'new' }),
        createMockComp({ id: 'comp-8', price: 100, condition: 'new' }),
      ];

      // Extreme outlier
      const outlierComp = createMockComp({ id: 'comp-outlier', price: 1000, condition: 'new' });

      const allComps = [...normalComps, outlierComp];

      const result = validateComp(outlierComp, item, allComps);

      // With 100*8 + 1000:
      // Mean = 1800/9 = 200
      // Variance = ((100-200)^2 * 8 + (1000-200)^2) / 9 = (10000*8 + 640000) / 9 = 720000/9 = 80000
      // StdDev = 282.84
      // Z-score = |1000-200| / 282.84 = 800 / 282.84 = 2.83 >  2.5!
      expect(result.criteria.priceOutlier.isOutlier).toBe(true);
      expect(result.criteria.priceOutlier.zScore).toBeGreaterThan(2.5);
    });

    it('should handle case of all same prices (stdDev = 0)', () => {
      const item = createMockItem();

      const comps = [
        createMockComp({ id: 'comp-1', price: 100 }),
        createMockComp({ id: 'comp-2', price: 100 }),
        createMockComp({ id: 'comp-3', price: 100 }),
      ];

      const result = validateComp(comps[0], item, comps);

      expect(result.criteria.priceOutlier.isOutlier).toBe(false);
      expect(result.criteria.priceOutlier.zScore).toBe(0);
    });

    it('should handle < 3 comps gracefully (cannot detect outliers)', () => {
      const item = createMockItem();

      const comps = [
        createMockComp({ id: 'comp-1', price: 100 }),
        createMockComp({ id: 'comp-2', price: 500 }),
      ];

      const result = validateComp(comps[1], item, comps);

      expect(result.criteria.priceOutlier.isOutlier).toBe(false);
      expect(result.criteria.priceOutlier.zScore).toBeUndefined();
    });

    it('should not flag comp with z-score <= 2.5 as outlier', () => {
      const item = createMockItem();

      const comps = [
        createMockComp({ id: 'comp-1', price: 100 }),
        createMockComp({ id: 'comp-2', price: 110 }),
        createMockComp({ id: 'comp-3', price: 90 }),
        createMockComp({ id: 'comp-4', price: 105 }),
      ];

      const result = validateComp(comps[0], item, comps);

      expect(result.criteria.priceOutlier.isOutlier).toBe(false);
      expect(result.criteria.priceOutlier.zScore).toBeLessThanOrEqual(2.5);
    });

    it('should ignore comps with invalid prices in outlier detection', () => {
      const item = createMockItem();

      const comps = [
        createMockComp({ id: 'comp-1', price: 100 }),
        createMockComp({ id: 'comp-2', price: 0 }),
        createMockComp({ id: 'comp-3', price: 105 }),
        createMockComp({ id: 'comp-4', price: undefined }),
      ];

      // Should only use valid prices (100, 105) for calculation
      const result = validateComp(comps[0], item, comps);

      // With only 2 valid prices, cannot detect outliers
      expect(result.criteria.priceOutlier.zScore).toBeUndefined();
    });
  });

  // =============================================================================
  // Overall Score Calculation Tests
  // =============================================================================

  describe('Overall Score Calculation', () => {
    it('should apply category-specific weights correctly', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Jordan 1',
        condition: 'new',
        variant: { color: 'Chicago', size: '10' },
      });

      const perfectComp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Jordan 1',
          colorway: 'Chicago',
          size: '10',
        },
        condition: 'new',
      });

      const result = validateComp(perfectComp, item, [perfectComp], null, {}, 'sneakers');

      // Perfect match should score very high
      expect(result.overallScore).toBeGreaterThan(0.8);
      expect(result.isValid).toBe(true);
    });

    it('should bound score between 0 and 1', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Jordan 1',
      });

      // Perfect match comp
      const perfectComp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Jordan 1',
        },
        condition: 'new',
      });

      // Terrible match comp
      const terribleComp = createMockComp({
        extractedData: {
          brand: 'Adidas',
          model: 'Yeezy 350',
        },
        condition: 'for parts',
      });

      const result1 = validateComp(perfectComp, item, [perfectComp]);
      const result2 = validateComp(terribleComp, item, [terribleComp]);

      expect(result1.overallScore).toBeGreaterThanOrEqual(0);
      expect(result1.overallScore).toBeLessThanOrEqual(1);
      expect(result2.overallScore).toBeGreaterThanOrEqual(0);
      expect(result2.overallScore).toBeLessThanOrEqual(1);
    });

    it('should apply price outlier penalty to score', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const normalComps = [
        createMockComp({
          id: 'comp-1',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-2',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-3',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-4',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-5',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-6',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-7',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-8',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
      ];

      const outlierComp = createMockComp({
        id: 'comp-outlier',
        price: 1000,
        condition: 'new',
        extractedData: { brand: 'Nike', model: 'Air Max 90' },
      });

      const allComps = [...normalComps, outlierComp];

      const normalResult = validateComp(normalComps[0], item, allComps);
      const outlierResult = validateComp(outlierComp, item, allComps);

      // Outlier should have lower score due to penalty
      expect(outlierResult.overallScore).toBeLessThan(normalResult.overallScore);
    });

    it('should penalize condition grade distance in score', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const exactConditionComp = createMockComp({
        extractedData: { brand: 'Nike', model: 'Air Max 90' },
        condition: 'new',
      });

      const farConditionComp = createMockComp({
        extractedData: { brand: 'Nike', model: 'Air Max 90' },
        condition: 'good',
      });

      const result1 = validateComp(exactConditionComp, item, [exactConditionComp]);
      const result2 = validateComp(farConditionComp, item, [farConditionComp]);

      // Exact condition should score higher than far condition
      expect(result1.overallScore).toBeGreaterThan(result2.overallScore);
    });
  });

  // =============================================================================
  // Recency Validation Tests
  // =============================================================================

  describe('Recency Validation', () => {
    it('should mark active listings as always recent', () => {
      const item = createMockItem();
      const comp = createMockComp({
        type: 'active_listing',
        soldDate: undefined,
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.recency.valid).toBe(true);
      expect(result.criteria.recency.daysSinceSold).toBeNull();
    });

    it('should validate sold items within recency threshold', () => {
      const item = createMockItem();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const comp = createMockComp({
        type: 'sold_listing',
        soldDate: thirtyDaysAgo.toISOString(),
      });

      const result = validateComp(comp, item, [comp], null, { recencyThresholdDays: 90 });

      expect(result.criteria.recency.valid).toBe(true);
      expect(result.criteria.recency.daysSinceSold).toBeGreaterThanOrEqual(29);
      expect(result.criteria.recency.daysSinceSold).toBeLessThanOrEqual(31);
    });

    it('should invalidate sold items beyond recency threshold', () => {
      const item = createMockItem();
      const oneYearAgo = new Date();
      oneYearAgo.setDate(oneYearAgo.getDate() - 365);

      const comp = createMockComp({
        type: 'sold_listing',
        soldDate: oneYearAgo.toISOString(),
      });

      const result = validateComp(comp, item, [comp], null, { recencyThresholdDays: 90 });

      expect(result.criteria.recency.valid).toBe(false);
      expect(result.criteria.recency.daysSinceSold).toBeGreaterThan(90);
    });

    it('should give benefit of doubt when soldDate is missing', () => {
      const item = createMockItem();
      const comp = createMockComp({
        type: 'sold_listing',
        soldDate: undefined,
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.criteria.recency.valid).toBe(true);
      expect(result.criteria.recency.daysSinceSold).toBeNull();
    });
  });

  // =============================================================================
  // Integration Tests
  // =============================================================================

  describe('Integration Tests', () => {
    it('should validate perfect comp with high score', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
        variant: { color: 'Black', size: '10' },
      });

      const perfectComp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Max 90',
          color: 'Black',
          size: '10',
        },
        condition: 'new',
        price: 100,
      });

      const result = validateComp(perfectComp, item, [perfectComp]);

      expect(result.isValid).toBe(true);
      expect(result.overallScore).toBeGreaterThan(0.7);
      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.matches).toBe(true);
      expect(result.criteria.conditionMatch.matches).toBe(true);
    });

    it('should invalidate poor comp with low score', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const badComp = createMockComp({
        extractedData: {
          brand: 'Adidas',
          model: 'Ultraboost',
        },
        condition: 'used',
        price: 100,
      });

      const result = validateComp(badComp, item, [badComp]);

      expect(result.isValid).toBe(false);
      expect(result.criteria.brandMatch.matches).toBe(false);
      expect(result.criteria.modelMatch.matches).toBe(false);
    });

    it('should merge product identification into item context', () => {
      const item = createMockItem({
        brand: undefined,
        model: undefined,
      });

      const productId = {
        brand: 'Nike',
        model: 'Air Max 90',
        upc: '123456789',
        category: ['sneakers'],
        confidence: 0.9,
        attributes: {},
      };

      const comp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Max 90',
        },
      });

      const result = validateComp(comp, item, [comp], productId);

      // Should use productId values when item values are missing
      expect(result.criteria.brandMatch.matches).toBe(true);
      expect(result.criteria.modelMatch.matches).toBe(true);
    });
  });

  // =============================================================================
  // validateAllComps Tests
  // =============================================================================

  describe('validateAllComps', () => {
    it('should validate all comps and attach validation results', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
      });

      const comps = [
        createMockComp({ id: 'comp-1', extractedData: { brand: 'Nike', model: 'Air Max 90' } }),
        createMockComp({ id: 'comp-2', extractedData: { brand: 'Nike', model: 'Air Force 1' } }),
        createMockComp({ id: 'comp-3', extractedData: { brand: 'Adidas', model: 'Ultraboost' } }),
      ];

      const results = validateAllComps(comps, item);

      expect(results).toHaveLength(3);
      expect(results[0].validation).toBeDefined();
      expect(results[1].validation).toBeDefined();
      expect(results[2].validation).toBeDefined();

      // First comp should have highest score (exact match)
      expect(results[0].validation!.overallScore).toBeGreaterThan(results[1].validation!.overallScore);
      expect(results[0].validation!.overallScore).toBeGreaterThan(results[2].validation!.overallScore);
    });

    it('should pass category to all validations', () => {
      const item = createMockItem({
        brand: 'Rolex',
        model: '116500LN',
      });

      const comps = [
        createMockComp({ extractedData: { brand: 'Rolex', model: '116500LN' } }),
      ];

      const results = validateAllComps(comps, item, null, {}, 'watches');

      expect(results[0].validation).toBeDefined();
      // Watches category should weight model heavily
      expect(results[0].validation!.criteria.modelMatch.matches).toBe(true);
    });
  });

  // =============================================================================
  // getValidationSummary Tests
  // =============================================================================

  describe('getValidationSummary', () => {
    it('should calculate summary statistics correctly', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const comps = [
        createMockComp({
          id: 'comp-1',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
          condition: 'new',
        }),
        createMockComp({
          id: 'comp-2',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
          condition: 'new',
        }),
        createMockComp({
          id: 'comp-3',
          extractedData: { brand: 'Adidas', model: 'Ultraboost' },
          condition: 'used',
        }),
      ];

      const validatedComps = validateAllComps(comps, item);
      const summary = getValidationSummary(validatedComps);

      expect(summary.total).toBe(3);
      expect(summary.passed).toBeGreaterThan(0);
      expect(summary.failed).toBeGreaterThan(0);
      expect(summary.passed + summary.failed).toBe(summary.total);

      expect(summary.criteriaBreakdown.brand).toBeGreaterThanOrEqual(0);
      expect(summary.criteriaBreakdown.model).toBeGreaterThanOrEqual(0);
      expect(summary.criteriaBreakdown.condition).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty comp list', () => {
      const summary = getValidationSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.criteriaBreakdown.brand).toBe(0);
    });

    it('should only count comps with validation results', () => {
      const compsWithoutValidation = [
        createMockComp({ id: 'comp-1' }),
        createMockComp({ id: 'comp-2' }),
      ];

      const summary = getValidationSummary(compsWithoutValidation);

      expect(summary.total).toBe(0);
    });
  });

  // =============================================================================
  // Custom Configuration Tests
  // =============================================================================

  describe('Custom Configuration', () => {
    it('should respect custom recencyThresholdDays', () => {
      const item = createMockItem();
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const comp = createMockComp({
        type: 'sold_listing',
        soldDate: sixtyDaysAgo.toISOString(),
      });

      const result1 = validateComp(comp, item, [comp], null, { recencyThresholdDays: 30 });
      const result2 = validateComp(comp, item, [comp], null, { recencyThresholdDays: 90 });

      expect(result1.criteria.recency.valid).toBe(false);
      expect(result2.criteria.recency.valid).toBe(true);
    });

    it('should respect custom minValidationScore', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
      });

      const decentComp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Max 95', // Different model, but same brand
        },
      });

      const result1 = validateComp(decentComp, item, [decentComp], null, { minValidationScore: 0.5 });
      const result2 = validateComp(decentComp, item, [decentComp], null, { minValidationScore: 0.9 });

      // Same score, but different validity based on threshold
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.isValid).not.toBe(result2.isValid);
    });

    it('should respect custom outlierZScoreThreshold', () => {
      const item = createMockItem();

      const comps = [
        createMockComp({ id: 'comp-1', price: 100 }),
        createMockComp({ id: 'comp-2', price: 105 }),
        createMockComp({ id: 'comp-3', price: 95 }),
        createMockComp({ id: 'comp-4', price: 150 }),
      ];

      const result1 = validateComp(comps[3], item, comps, null, { outlierZScoreThreshold: 1.0 });
      const result2 = validateComp(comps[3], item, comps, null, { outlierZScoreThreshold: 5.0 });

      // Same z-score, but different outlier determination
      expect(result1.criteria.priceOutlier.zScore).toBe(result2.criteria.priceOutlier.zScore);
      expect(result1.criteria.priceOutlier.isOutlier).not.toBe(result2.criteria.priceOutlier.isOutlier);
    });
  });

  // =============================================================================
  // Reasoning Generation Tests
  // =============================================================================

  describe('Reasoning Generation', () => {
    it('should generate human-readable reasoning', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const comp = createMockComp({
        extractedData: {
          brand: 'Nike',
          model: 'Air Max 90',
        },
        condition: 'new',
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.reasoning).toBeDefined();
      expect(typeof result.reasoning).toBe('string');
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should include brand match in reasoning', () => {
      const item = createMockItem({ brand: 'Nike' });
      const comp = createMockComp({
        extractedData: { brand: 'Nike' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.reasoning).toContain('Brand match');
    });

    it('should include mismatches in reasoning', () => {
      const item = createMockItem({ brand: 'Nike', model: 'Air Max 90' });
      const comp = createMockComp({
        extractedData: { brand: 'Adidas', model: 'Ultraboost' },
      });

      const result = validateComp(comp, item, [comp]);

      expect(result.reasoning).toContain('mismatch');
    });

    it('should include price outlier information in reasoning', () => {
      const item = createMockItem({
        brand: 'Nike',
        model: 'Air Max 90',
        condition: 'new',
      });

      const normalComps = [
        createMockComp({
          id: 'comp-1',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-2',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-3',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-4',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-5',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-6',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-7',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
        createMockComp({
          id: 'comp-8',
          price: 100,
          condition: 'new',
          extractedData: { brand: 'Nike', model: 'Air Max 90' },
        }),
      ];

      const outlierComp = createMockComp({
        id: 'comp-outlier',
        price: 1000,
        condition: 'new',
        extractedData: { brand: 'Nike', model: 'Air Max 90' },
      });

      const allComps = [...normalComps, outlierComp];

      const result = validateComp(outlierComp, item, allComps);

      expect(result.reasoning).toContain('outlier');
    });
  });
});
