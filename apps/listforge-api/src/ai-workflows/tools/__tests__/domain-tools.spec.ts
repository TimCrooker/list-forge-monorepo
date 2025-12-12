/**
 * Domain Knowledge Tools Tests - Slice 1
 *
 * Tests for domain knowledge tools that provide AI reasoning explanation:
 * - decode_identifier: Decode product identifiers
 * - check_authenticity: Run authenticity marker checks
 * - get_value_drivers: Get price-affecting value drivers
 * - explain_pricing: Explain pricing methodology
 * - validate_comp: Validate comparable listings
 */

import {
  decodeIdentifierTool,
  checkAuthenticityTool,
  getValueDriversTool,
  explainPricingTool,
  validateCompTool,
  DecodeIdentifierSchema,
  CheckAuthenticitySchema,
  GetValueDriversSchema,
  ExplainPricingSchema,
  ValidateCompSchema,
} from '../domain.tools';
import { ChatToolDependencies, runWithToolContext } from '../index';
import { StructuredTool } from '@langchain/core/tools';

describe('Domain Knowledge Tools', () => {
  // ============================================================================
  // Mock Dependencies
  // ============================================================================
  const createMockDeps = (overrides: Partial<ChatToolDependencies> = {}): ChatToolDependencies => ({
    getItem: jest.fn(),
    updateItem: jest.fn(),
    searchItems: jest.fn(),
    getLatestResearch: jest.fn(),
    searchComps: jest.fn(),
    startResearchJob: jest.fn(),
    searchEvidence: jest.fn(),
    getDashboardStats: jest.fn(),
    getReviewQueueStats: jest.fn(),
    emitAction: jest.fn(),
    ...overrides,
  });

  const mockContext = {
    userId: 'user-123',
    organizationId: 'org-123',
    sessionId: 'session-123',
    itemId: 'item-123',
  };

  // Helper to run tool with context
  async function invokeWithContext<T>(tool: StructuredTool, input: T): Promise<string> {
    return runWithToolContext(mockContext, async () => {
      return tool.invoke(input as any);
    });
  }

  // ============================================================================
  // Schema Validation Tests
  // ============================================================================
  describe('Schema Validation', () => {
    describe('DecodeIdentifierSchema', () => {
      it('should accept valid identifier types', () => {
        const validTypes = ['date_code', 'style_number', 'serial_number', 'model_number', 'upc', 'other'];

        validTypes.forEach((type) => {
          const result = DecodeIdentifierSchema.safeParse({
            identifierType: type,
            value: 'TEST123',
          });
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid identifier type', () => {
        const result = DecodeIdentifierSchema.safeParse({
          identifierType: 'invalid_type',
          value: 'TEST123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty value', () => {
        const result = DecodeIdentifierSchema.safeParse({
          identifierType: 'date_code',
          value: '',
        });
        expect(result.success).toBe(false);
      });

      it('should accept optional brand and category', () => {
        const result = DecodeIdentifierSchema.safeParse({
          identifierType: 'date_code',
          value: 'SD1234',
          brand: 'Louis Vuitton',
          category: 'luxury_handbags',
        });
        expect(result.success).toBe(true);
      });

      it('should reject value exceeding max length', () => {
        const result = DecodeIdentifierSchema.safeParse({
          identifierType: 'date_code',
          value: 'A'.repeat(101),
        });
        expect(result.success).toBe(false);
      });
    });

    describe('CheckAuthenticitySchema', () => {
      it('should accept valid itemId', () => {
        const result = CheckAuthenticitySchema.safeParse({
          itemId: 'item-123-abc',
        });
        expect(result.success).toBe(true);
      });

      it('should reject empty itemId', () => {
        const result = CheckAuthenticitySchema.safeParse({
          itemId: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject itemId with invalid characters', () => {
        const result = CheckAuthenticitySchema.safeParse({
          itemId: 'item@123!',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('GetValueDriversSchema', () => {
      it('should accept valid itemId', () => {
        const result = GetValueDriversSchema.safeParse({
          itemId: 'item_123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid itemId formats', () => {
        const invalidIds = ['', 'item 123', 'item/123', '../item'];

        invalidIds.forEach((id) => {
          const result = GetValueDriversSchema.safeParse({ itemId: id });
          expect(result.success).toBe(false);
        });
      });
    });

    describe('ExplainPricingSchema', () => {
      it('should accept valid itemId', () => {
        const result = ExplainPricingSchema.safeParse({
          itemId: 'ITEM-456',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('ValidateCompSchema', () => {
      it('should accept required fields only', () => {
        const result = ValidateCompSchema.safeParse({
          itemId: 'item-123',
          compId: 'comp-456',
        });
        expect(result.success).toBe(true);
      });

      it('should accept optional compData', () => {
        const result = ValidateCompSchema.safeParse({
          itemId: 'item-123',
          compId: 'comp-456',
          compData: {
            title: 'Nike Air Jordan 1',
            price: 250.0,
            condition: 'New',
            soldDate: '2024-01-15',
            brand: 'Nike',
            model: 'Air Jordan 1',
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept partial compData', () => {
        const result = ValidateCompSchema.safeParse({
          itemId: 'item-123',
          compId: 'comp-456',
          compData: {
            price: 250.0,
          },
        });
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // decodeIdentifierTool Tests
  // ============================================================================
  describe('decodeIdentifierTool', () => {
    it('should return error when decodeIdentifier dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'SD1234',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should decode identifier successfully', async () => {
      const mockDecodeIdentifier = jest.fn().mockResolvedValue({
        success: true,
        identifierType: 'lv_date_code',
        decoded: {
          factoryCode: 'SD',
          year: 2014,
          month: 3,
          factoryLocation: 'France',
        },
        confidence: 0.95,
        details: 'Louis Vuitton date code from France factory',
      });

      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'SD1234',
        brand: 'Louis Vuitton',
      });

      const parsed = JSON.parse(result);
      expect(parsed.decoded).toBe(true);
      expect(parsed.identifierType).toBe('lv_date_code');
      expect(parsed.interpretation.year).toBe(2014);
      expect(parsed.confidence).toBe('95%');
    });

    it('should handle failed decoding gracefully', async () => {
      const mockDecodeIdentifier = jest.fn().mockResolvedValue({
        success: false,
      });

      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'INVALID',
      });

      const parsed = JSON.parse(result);
      expect(parsed.decoded).toBe(false);
      expect(parsed.message).toContain('Could not decode');
      expect(parsed.suggestion).toBeDefined();
    });

    it('should handle null result from decodeIdentifier', async () => {
      const mockDecodeIdentifier = jest.fn().mockResolvedValue(null);

      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'upc',
        value: '012345678901',
      });

      const parsed = JSON.parse(result);
      expect(parsed.decoded).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const mockDecodeIdentifier = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'SD1234',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Service unavailable');
    });

    it('should have correct tool metadata', () => {
      const deps = createMockDeps();
      const tool = decodeIdentifierTool(deps);

      expect(tool.name).toBe('decode_identifier');
      expect(tool.description).toContain('Decode product identifiers');
      expect(tool.description).toContain('date_code');
      expect(tool.description).toContain('style_number');
    });
  });

  // ============================================================================
  // checkAuthenticityTool Tests
  // ============================================================================
  describe('checkAuthenticityTool', () => {
    it('should return error when checkAuthenticity dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = checkAuthenticityTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('not available');
    });

    it('should return authenticity check result', async () => {
      const mockCheckAuthenticity = jest.fn().mockResolvedValue({
        assessment: 'likely_authentic',
        confidence: 0.85,
        markersChecked: [
          { name: 'Date code format', passed: true, confidence: 0.95, details: 'Valid format' },
          { name: 'Serial number', passed: true, confidence: 0.8, details: 'Matches expected pattern' },
        ],
        summary: '2 of 2 authenticity markers passed with high confidence.',
        warnings: [],
      });

      const deps = createMockDeps({ checkAuthenticity: mockCheckAuthenticity });
      const tool = checkAuthenticityTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasResult).toBe(true);
      expect(parsed.assessment).toBe('likely_authentic');
      expect(parsed.assessmentLabel).toBe('Likely Authentic');
      expect(parsed.markersChecked).toHaveLength(2);
      expect(parsed.markersChecked[0].status).toBe('PASS');
      expect(parsed.disclaimer).toContain('Professional authentication');
    });

    it('should format warnings when present', async () => {
      const mockCheckAuthenticity = jest.fn().mockResolvedValue({
        assessment: 'uncertain',
        confidence: 0.5,
        markersChecked: [
          { name: 'Critical marker', passed: false, confidence: 0.3, details: 'Pattern mismatch' },
        ],
        summary: 'Mixed results.',
        warnings: ['Critical marker failed: Critical marker'],
      });

      const deps = createMockDeps({ checkAuthenticity: mockCheckAuthenticity });
      const tool = checkAuthenticityTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.warnings).toHaveLength(1);
      expect(parsed.warnings[0]).toContain('Critical marker failed');
    });

    it('should handle null result', async () => {
      const mockCheckAuthenticity = jest.fn().mockResolvedValue(null);

      const deps = createMockDeps({ checkAuthenticity: mockCheckAuthenticity });
      const tool = checkAuthenticityTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasResult).toBe(false);
      expect(parsed.suggestion).toBeDefined();
    });

    it('should format all assessment types correctly', async () => {
      const assessments = [
        { assessment: 'likely_authentic', label: 'Likely Authentic' },
        { assessment: 'likely_fake', label: 'Likely Fake' },
        { assessment: 'uncertain', label: 'Uncertain - Manual Review Recommended' },
        { assessment: 'insufficient_data', label: 'Insufficient Data' },
      ] as const;

      for (const { assessment, label } of assessments) {
        const mockCheckAuthenticity = jest.fn().mockResolvedValue({
          assessment,
          confidence: 0.5,
          markersChecked: [],
          summary: 'Test',
          warnings: [],
        });

        const deps = createMockDeps({ checkAuthenticity: mockCheckAuthenticity });
        const tool = checkAuthenticityTool(deps);

        const result = await invokeWithContext(tool, { itemId: 'item-123' });
        const parsed = JSON.parse(result);

        expect(parsed.assessmentLabel).toBe(label);
      }
    });
  });

  // ============================================================================
  // getValueDriversTool Tests
  // ============================================================================
  describe('getValueDriversTool', () => {
    it('should return error when getValueDrivers dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
    });

    it('should return value drivers with combined multiplier', async () => {
      const mockGetValueDrivers = jest.fn().mockResolvedValue([
        {
          driverId: 'driver-1',
          name: 'Travis Scott Collaboration',
          matchedValue: 'Travis Scott x Nike',
          priceMultiplier: 2.5,
          confidence: 0.9,
          reasoning: 'Confirmed Travis Scott collaboration',
        },
        {
          driverId: 'driver-2',
          name: 'Limited Release',
          matchedValue: 'Limited to 5000 pairs',
          priceMultiplier: 1.5,
          confidence: 0.85,
          reasoning: 'Limited production run',
        },
      ]);

      const deps = createMockDeps({ getValueDrivers: mockGetValueDrivers });
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasDrivers).toBe(true);
      expect(parsed.driversFound).toBe(2);
      expect(parsed.valueDrivers).toHaveLength(2);
      expect(parsed.valueDrivers[0].priceMultiplier).toBe('2.50x');
      expect(parsed.combinedEffect.multiplier).toBeDefined();
      expect(parsed.combinedEffect.explanation).toContain('Multiple value drivers');
    });

    it('should handle single value driver', async () => {
      const mockGetValueDrivers = jest.fn().mockResolvedValue([
        {
          driverId: 'driver-1',
          name: 'Big E Label',
          matchedValue: 'Big E',
          priceMultiplier: 3.0,
          confidence: 0.95,
          reasoning: 'Vintage Big E label detected',
        },
      ]);

      const deps = createMockDeps({ getValueDrivers: mockGetValueDrivers });
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.driversFound).toBe(1);
      expect(parsed.combinedEffect.explanation).toContain('Single value driver');
    });

    it('should return appropriate message when no drivers found', async () => {
      const mockGetValueDrivers = jest.fn().mockResolvedValue([]);

      const deps = createMockDeps({ getValueDrivers: mockGetValueDrivers });
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasDrivers).toBe(false);
      expect(parsed.message).toContain('No specific value drivers detected');
      expect(parsed.explanation).toContain('standard attributes');
    });

    it('should cap combined multiplier at 15x', async () => {
      // Create many high-multiplier drivers
      const mockGetValueDrivers = jest.fn().mockResolvedValue([
        { driverId: '1', name: 'Driver 1', matchedValue: 'v1', priceMultiplier: 5.0, confidence: 1.0, reasoning: '' },
        { driverId: '2', name: 'Driver 2', matchedValue: 'v2', priceMultiplier: 5.0, confidence: 1.0, reasoning: '' },
        { driverId: '3', name: 'Driver 3', matchedValue: 'v3', priceMultiplier: 5.0, confidence: 1.0, reasoning: '' },
      ]);

      const deps = createMockDeps({ getValueDrivers: mockGetValueDrivers });
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      // Multiplier should be capped at 15x
      const multiplier = parseFloat(parsed.combinedEffect.multiplier);
      expect(multiplier).toBeLessThanOrEqual(15.0);
    });
  });

  // ============================================================================
  // explainPricingTool Tests
  // ============================================================================
  describe('explainPricingTool', () => {
    it('should fallback to research data when explainPricing not provided', async () => {
      const mockGetLatestResearch = jest.fn().mockResolvedValue({
        id: 'research-123',
        itemId: 'item-123',
        data: {
          generatedAt: new Date().toISOString(),
          priceBands: [
            { label: 'floor', amount: 100, currency: 'USD', confidence: 0.85, reasoning: 'Based on 10 comps' },
            { label: 'target', amount: 150, currency: 'USD', confidence: 0.9, reasoning: 'Median price' },
            { label: 'ceiling', amount: 200, currency: 'USD', confidence: 0.75, reasoning: 'Top quartile' },
          ],
          competitorCount: 15,
          demandSignals: [
            { metric: 'sell_through_rate', value: 0.65, unit: '%', direction: 'stable' },
          ],
        },
      });

      const deps = createMockDeps({ getLatestResearch: mockGetLatestResearch });
      const tool = explainPricingTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasExplanation).toBe(true);
      expect(parsed.priceBands).toHaveLength(3);
      expect(parsed.summary).toBe('Pricing based on comparable sales analysis.');
    });

    it('should return no research message when no data available', async () => {
      const mockGetLatestResearch = jest.fn().mockResolvedValue(null);

      const deps = createMockDeps({ getLatestResearch: mockGetLatestResearch });
      const tool = explainPricingTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasExplanation).toBe(false);
      expect(parsed.suggestion).toContain('trigger_research');
    });

    it('should use explainPricing dependency when available', async () => {
      const mockExplainPricing = jest.fn().mockResolvedValue({
        hasResearch: true,
        priceBands: [
          { label: 'floor', amount: 100, currency: 'USD', confidence: 0.85, reasoning: 'P25 of comps' },
          { label: 'target', amount: 150, currency: 'USD', confidence: 0.9, reasoning: 'Median' },
        ],
        compsUsed: 25,
        validComps: 20,
        outlierFiltering: {
          removed: 5,
          q1: 90,
          q3: 180,
        },
        valueDriversApplied: [
          { name: 'Big E Label', multiplier: 2.0 },
        ],
        marketConditions: {
          sellThroughRate: 0.65,
          competition: 12,
          priceTrend: 'up',
        },
        summary: 'Pricing based on 20 valid comps with value driver adjustment.',
      });

      const deps = createMockDeps({ explainPricing: mockExplainPricing });
      const tool = explainPricingTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasExplanation).toBe(true);
      expect(parsed.methodology.compsAnalyzed).toBe(25);
      expect(parsed.methodology.validComps).toBe(20);
      expect(parsed.methodology.outlierFiltering.removed).toBe(5);
      expect(parsed.valueDriversApplied).toHaveLength(1);
      expect(parsed.marketConditions.sellThroughRate).toBe('65%');
    });

    it('should handle explainPricing returning hasResearch: false', async () => {
      const mockExplainPricing = jest.fn().mockResolvedValue({
        hasResearch: false,
        summary: 'No research available',
      });

      const deps = createMockDeps({ explainPricing: mockExplainPricing });
      const tool = explainPricingTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.hasExplanation).toBe(false);
    });
  });

  // ============================================================================
  // validateCompTool Tests
  // ============================================================================
  describe('validateCompTool', () => {
    it('should return error when validateComp dependency not provided', async () => {
      const deps = createMockDeps();
      const tool = validateCompTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
    });

    it('should validate comp successfully', async () => {
      const mockValidateComp = jest.fn().mockResolvedValue({
        isValid: true,
        overallScore: 0.85,
        criteria: {
          brandMatch: { matches: true, confidence: 0.95, itemBrand: 'Nike', compBrand: 'Nike' },
          modelMatch: { matches: true, confidence: 0.9, itemModel: 'Air Jordan 1', compModel: 'Air Jordan 1' },
          conditionMatch: { matches: true, withinGrade: 0, itemCondition: 'New', compCondition: 'New' },
          variantMatch: { matches: true, confidence: 0.85, details: 'Colorway: Bred matches' },
          recency: { valid: true, daysSinceSold: 15, threshold: 90 },
          priceOutlier: { isOutlier: false, zScore: 0.5 },
        },
        reasoning: 'Brand match: Nike. Model match: Air Jordan 1. Condition: exact match (New).',
      });

      const deps = createMockDeps({ validateComp: mockValidateComp });
      const tool = validateCompTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.hasValidation).toBe(true);
      expect(parsed.isValid).toBe(true);
      expect(parsed.overallScore).toBe('85%');
      expect(parsed.criteria.brand.status).toBe('MATCH');
      expect(parsed.criteria.condition.gradeDistance).toBe(0);
      expect(parsed.criteria.recency.status).toBe('VALID');
      expect(parsed.criteria.priceOutlier.status).toBe('NORMAL');
    });

    it('should show invalid comp with failures', async () => {
      const mockValidateComp = jest.fn().mockResolvedValue({
        isValid: false,
        overallScore: 0.45,
        criteria: {
          brandMatch: { matches: false, confidence: 0.3, itemBrand: 'Nike', compBrand: 'Adidas' },
          modelMatch: { matches: false, confidence: 0.2, itemModel: 'Air Jordan 1', compModel: 'Stan Smith' },
          conditionMatch: { matches: true, withinGrade: 1, itemCondition: 'New', compCondition: 'Like New' },
          variantMatch: { matches: false, confidence: 0.1, details: 'No matching variants' },
          recency: { valid: false, daysSinceSold: 120, threshold: 90 },
          priceOutlier: { isOutlier: true, zScore: 3.2 },
        },
        reasoning: 'Brand mismatch. Model mismatch. Too old: 120 days since sold.',
      });

      const deps = createMockDeps({ validateComp: mockValidateComp });
      const tool = validateCompTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.isValid).toBe(false);
      expect(parsed.verdict).toContain('may not be suitable');
      expect(parsed.criteria.brand.status).toBe('MISMATCH');
      expect(parsed.criteria.recency.status).toBe('TOO_OLD');
      expect(parsed.criteria.priceOutlier.status).toBe('OUTLIER');
    });

    it('should pass compData to dependency', async () => {
      const mockValidateComp = jest.fn().mockResolvedValue({
        isValid: true,
        overallScore: 0.8,
        criteria: {
          brandMatch: { matches: true, confidence: 0.9, itemBrand: 'Nike', compBrand: 'Nike' },
          modelMatch: { matches: true, confidence: 0.9, itemModel: 'Dunk Low', compModel: 'Dunk Low' },
          conditionMatch: { matches: true, withinGrade: 0, itemCondition: 'Used', compCondition: 'Used' },
          variantMatch: { matches: true, confidence: 0.8, details: '' },
          recency: { valid: true, daysSinceSold: 30, threshold: 90 },
          priceOutlier: { isOutlier: false },
        },
        reasoning: 'Good match',
      });

      const deps = createMockDeps({ validateComp: mockValidateComp });
      const tool = validateCompTool(deps);

      const compData = {
        title: 'Nike Dunk Low Panda',
        price: 150.0,
        condition: 'Used',
        brand: 'Nike',
        model: 'Dunk Low',
      };

      await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
        compData,
      });

      expect(mockValidateComp).toHaveBeenCalledWith(
        'item-123',
        'comp-456',
        'org-123',
        compData,
      );
    });

    it('should handle null result from validateComp', async () => {
      const mockValidateComp = jest.fn().mockResolvedValue(null);

      const deps = createMockDeps({ validateComp: mockValidateComp });
      const tool = validateCompTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.hasValidation).toBe(false);
      expect(parsed.message).toContain('Could not validate');
    });
  });

  // ============================================================================
  // Tool Metadata Tests
  // ============================================================================
  describe('Tool Metadata', () => {
    const deps = createMockDeps();

    it('should have correct names', () => {
      expect(decodeIdentifierTool(deps).name).toBe('decode_identifier');
      expect(checkAuthenticityTool(deps).name).toBe('check_authenticity');
      expect(getValueDriversTool(deps).name).toBe('get_value_drivers');
      expect(explainPricingTool(deps).name).toBe('explain_pricing');
      expect(validateCompTool(deps).name).toBe('validate_comp');
    });

    it('should have descriptive descriptions', () => {
      expect(decodeIdentifierTool(deps).description).toContain('Decode product identifiers');
      expect(checkAuthenticityTool(deps).description).toContain('authenticity marker checks');
      expect(getValueDriversTool(deps).description).toContain('value drivers');
      expect(explainPricingTool(deps).description).toContain('price bands');
      expect(validateCompTool(deps).description).toContain('comparable listing');
    });

    it('should have defined schemas', () => {
      expect(decodeIdentifierTool(deps).schema).toBeDefined();
      expect(checkAuthenticityTool(deps).schema).toBeDefined();
      expect(getValueDriversTool(deps).schema).toBeDefined();
      expect(explainPricingTool(deps).schema).toBeDefined();
      expect(validateCompTool(deps).schema).toBeDefined();
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('Error Handling', () => {
    it('should handle dependency throwing error in decodeIdentifier', async () => {
      const mockDecodeIdentifier = jest.fn().mockRejectedValue(new Error('Connection failed'));
      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'SD1234',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Connection failed');
    });

    it('should handle dependency throwing error in checkAuthenticity', async () => {
      const mockCheckAuthenticity = jest.fn().mockRejectedValue(new Error('Service timeout'));
      const deps = createMockDeps({ checkAuthenticity: mockCheckAuthenticity });
      const tool = checkAuthenticityTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Service timeout');
    });

    it('should handle dependency throwing error in getValueDrivers', async () => {
      const mockGetValueDrivers = jest.fn().mockRejectedValue(new Error('Database error'));
      const deps = createMockDeps({ getValueDrivers: mockGetValueDrivers });
      const tool = getValueDriversTool(deps);

      const result = await invokeWithContext(tool, { itemId: 'item-123' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Database error');
    });

    it('should handle dependency throwing error in validateComp', async () => {
      const mockValidateComp = jest.fn().mockRejectedValue(new Error('Validation failed'));
      const deps = createMockDeps({ validateComp: mockValidateComp });
      const tool = validateCompTool(deps);

      const result = await invokeWithContext(tool, {
        itemId: 'item-123',
        compId: 'comp-456',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('Validation failed');
    });

    it('should handle non-Error objects thrown', async () => {
      const mockDecodeIdentifier = jest.fn().mockRejectedValue('String error');
      const deps = createMockDeps({ decodeIdentifier: mockDecodeIdentifier });
      const tool = decodeIdentifierTool(deps);

      const result = await invokeWithContext(tool, {
        identifierType: 'date_code',
        value: 'SD1234',
      });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe(true);
      expect(parsed.message).toContain('String error');
    });
  });
});
