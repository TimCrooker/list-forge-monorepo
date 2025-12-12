import { searchCompsNode, CompSearchTools } from '../search-comps.node';
import { ResearchGraphState, ItemSnapshot } from '../../research-graph.state';
import { CompResult } from '@listforge/marketplace-adapters';
import { AmazonProductMatch } from '@listforge/core-types';

describe('searchCompsNode - Promise.allSettled error handling', () => {
  // Mock CompResult factory
  const createMockCompResult = (overrides?: Partial<CompResult>): CompResult => ({
    listingId: 'comp-123',
    title: 'Test Product',
    price: 99.99,
    currency: 'USD',
    url: 'https://example.com/listing/123',
    imageUrl: 'https://example.com/image.jpg',
    condition: 'Used',
    soldDate: new Date('2024-01-15'),
    attributes: {},
    ...overrides,
  });

  // Mock AmazonProductMatch factory
  const createMockAmazonMatch = (overrides?: Partial<AmazonProductMatch>): AmazonProductMatch => ({
    asin: 'B001234567',
    title: 'Amazon Test Product',
    brand: 'TestBrand',
    category: 'Electronics',
    imageUrl: 'https://amazon.com/image.jpg',
    salesRank: 1000,
    price: 89.99,
    confidence: 0.95,
    source: 'sp-api',
    matchedBy: 'upc',
    ...overrides,
  });

  // Mock ItemSnapshot
  const mockItem: ItemSnapshot = {
    id: 'item-123',
    title: 'Test Item for Sale',
    description: 'Test description',
    condition: 'new',
    attributes: [],
    media: [
      { id: 'media-1', url: 'https://example.com/photo.jpg', type: 'image' },
    ],
    defaultPrice: null,
    lifecycleStatus: 'draft',
    aiReviewState: 'not_reviewed',
  };

  // Base state for tests
  const baseState: Partial<ResearchGraphState> = {
    itemId: 'item-123',
    researchRunId: 'run-123',
    organizationId: 'org-123',
    item: mockItem,
    productIdentification: {
      confidence: 0.9,
      brand: 'TestBrand',
      model: 'Model-X100',
      upc: '012345678905',
      attributes: {},
    },
    mediaAnalysis: {
      category: 'Electronics',
      attributes: {},
      confidence: 0.85,
    },
  };

  describe('Successful multi-source searches', () => {
    it('should combine results from multiple successful searches', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
          createMockCompResult({ listingId: 'sold-2', price: 100.00, soldDate: new Date('2024-01-12') }),
        ]),
        searchActiveListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'active-1', price: 110.00, soldDate: undefined }),
        ]),
        searchByImage: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'image-1', price: 105.00 }),
        ]),
        searchAmazonProducts: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'B12345', price: 89.99 }),
        ]),
        lookupAmazonByUpc: jest.fn().mockResolvedValue(
          createMockAmazonMatch({ asin: 'B001234567', price: 92.00 }),
        ),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      expect(result.comps).toBeDefined();
      expect(result.comps!.length).toBeGreaterThan(0);
      expect(result.warnings).toBeUndefined(); // No warnings when all succeed

      // Verify we have both sold and active listings
      const soldListings = result.comps!.filter(c => c.type === 'sold_listing');
      const activeListings = result.comps!.filter(c => c.type === 'active_listing');
      expect(soldListings.length).toBeGreaterThan(0);
      expect(activeListings.length).toBeGreaterThan(0);

      // Verify we have both eBay and Amazon comps
      const ebayComps = result.comps!.filter(c => c.source === 'ebay');
      const amazonComps = result.comps!.filter(c => c.source === 'amazon');
      expect(ebayComps.length).toBeGreaterThan(0);
      expect(amazonComps.length).toBeGreaterThan(0);
    });
  });

  describe('Partial failure - one marketplace fails', () => {
    it('should continue when eBay fails but Amazon succeeds', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue(new Error('eBay API timeout')),
        searchActiveListings: jest.fn().mockRejectedValue(new Error('eBay API rate limited')),
        searchByImage: jest.fn().mockRejectedValue(new Error('eBay image search failed')),
        searchAmazonProducts: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'B12345', price: 89.99 }),
          createMockCompResult({ listingId: 'B67890', price: 79.99 }),
        ]),
        lookupAmazonByUpc: jest.fn().mockResolvedValue(
          createMockAmazonMatch({ asin: 'B001234567', price: 92.00 }),
        ),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Should still have Amazon comps
      expect(result.comps).toBeDefined();
      expect(result.comps!.length).toBeGreaterThan(0);
      expect(result.comps!.every(c => c.source === 'amazon')).toBe(true);

      // Should have warnings for eBay failures
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);

      // Check for sold listing failure warning (high severity)
      const soldWarning = result.warnings!.find(w =>
        w.category === 'api_failure' && w.message.includes('sold')
      );
      expect(soldWarning).toBeDefined();
      expect(soldWarning!.severity).toBe('high');
      expect(soldWarning!.impact).toContain('Pricing confidence will be reduced');
    });

    it('should continue when Amazon fails but eBay succeeds', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
        ]),
        searchActiveListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'active-1', price: 110.00, soldDate: undefined }),
        ]),
        searchByImage: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'image-1', price: 105.00 }),
        ]),
        searchAmazonProducts: jest.fn().mockRejectedValue(new Error('Amazon API credentials invalid')),
        lookupAmazonByUpc: jest.fn().mockRejectedValue(new Error('Amazon UPC service unavailable')),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Should still have eBay comps
      expect(result.comps).toBeDefined();
      expect(result.comps!.length).toBeGreaterThan(0);
      expect(result.comps!.every(c => c.source === 'ebay')).toBe(true);

      // Should have warnings for Amazon failures
      expect(result.warnings).toBeDefined();
      const amazonWarnings = result.warnings!.filter(w =>
        w.category === 'api_failure' && w.message.toLowerCase().includes('amazon')
      );
      expect(amazonWarnings.length).toBeGreaterThan(0);

      // Amazon failures should be low or medium severity (not high/critical)
      // Note: Severity determination is case-sensitive in warnings.ts
      expect(amazonWarnings.every(w => w.severity === 'low' || w.severity === 'medium')).toBe(true);
    });
  });

  describe('Warning creation with impact assessment', () => {
    it('should create warnings with appropriate impact messages', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue(new Error('Network timeout')),
        searchActiveListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'active-1', price: 110.00, soldDate: undefined }),
        ]),
        searchByImage: jest.fn().mockResolvedValue([]),
        searchAmazonProducts: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      expect(result.warnings).toBeDefined();

      // Should have a warning for sold listings failure
      const soldWarning = result.warnings!.find(w =>
        w.message.includes('sold') || w.message.includes('Sold')
      );
      expect(soldWarning).toBeDefined();
      expect(soldWarning!.severity).toBe('high');
      expect(soldWarning!.impact).toContain('Pricing confidence will be reduced');
      expect(soldWarning!.category).toBe('api_failure');
    });

    it('should indicate lower impact when other data sources are available', async () => {
      // First call with sold listings, then fail subsequent calls
      let callCount = 0;
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve([
              createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
            ]);
          }
          return Promise.reject(new Error('Subsequent call failed'));
        }),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // If we have some sold listings, subsequent failures should mention other sources available
      const warnings = result.warnings || [];
      if (warnings.length > 0) {
        const failureWarning = warnings.find(w => w.category === 'api_failure');
        if (failureWarning && failureWarning.message.includes('sold')) {
          // When sold data exists from first call, subsequent failures less critical
          expect(failureWarning.impact).toContain('other sources available');
        }
      }
    });
  });

  describe('Impact determination logic', () => {
    it('should prioritize sold listings over active listings in impact assessment', async () => {
      const mockToolsNoSold: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue(new Error('Sold listings unavailable')),
        searchActiveListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'active-1', price: 110.00, soldDate: undefined }),
        ]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const mockToolsNoActive: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
        ]),
        searchActiveListings: jest.fn().mockRejectedValue(new Error('Active listings unavailable')),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const configNoSold = { configurable: { tools: mockToolsNoSold } };
      const configNoActive = { configurable: { tools: mockToolsNoActive } };

      const resultNoSold = await searchCompsNode(baseState as ResearchGraphState, configNoSold);
      const resultNoActive = await searchCompsNode(baseState as ResearchGraphState, configNoActive);

      // No sold listings should be high severity
      const soldWarning = resultNoSold.warnings!.find(w => w.message.includes('sold'));
      expect(soldWarning!.severity).toBe('high');

      // No active listings should be medium severity (less critical)
      const activeWarning = resultNoActive.warnings!.find(w => w.message.includes('active'));
      expect(activeWarning!.severity).toBe('medium');
      expect(activeWarning!.impact).toContain('sold data available');
    });
  });

  describe('All searches failing', () => {
    it('should produce valid empty result with warnings when all searches fail', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue(new Error('eBay sold listings failed')),
        searchActiveListings: jest.fn().mockRejectedValue(new Error('eBay active listings failed')),
        searchByImage: jest.fn().mockRejectedValue(new Error('Image search failed')),
        searchAmazonProducts: jest.fn().mockRejectedValue(new Error('Amazon search failed')),
        lookupAmazonByUpc: jest.fn().mockRejectedValue(new Error('UPC lookup failed')),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Should return valid result structure
      expect(result).toBeDefined();
      expect(result.comps).toEqual([]);
      expect(result.searchQueries).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);

      // Should have warnings for all failures
      const apiFailures = result.warnings!.filter(w => w.category === 'api_failure');
      expect(apiFailures.length).toBeGreaterThan(0);

      // Should also have a data_missing warning for no comps
      const dataMissingWarning = result.warnings!.find(w =>
        w.category === 'data_missing' && w.message.includes('comparable listings')
      );
      expect(dataMissingWarning).toBeDefined();
      expect(dataMissingWarning!.impact).toContain('Cannot calculate pricing');
    });

    it('should not crash and should log all failure reasons', async () => {
      const errorMessages = [
        'Connection timeout',
        'Rate limit exceeded',
        'Invalid API key',
        'Service temporarily unavailable',
        'Malformed request',
      ];

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue(new Error(errorMessages[0])),
        searchActiveListings: jest.fn().mockRejectedValue(new Error(errorMessages[1])),
        searchByImage: jest.fn().mockRejectedValue(new Error(errorMessages[2])),
        searchAmazonProducts: jest.fn().mockRejectedValue(new Error(errorMessages[3])),
        lookupAmazonByUpc: jest.fn().mockRejectedValue(new Error(errorMessages[4])),
      };

      const config = { configurable: { tools: mockTools } };

      // Should not throw error
      await expect(searchCompsNode(baseState as ResearchGraphState, config)).resolves.toBeDefined();

      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Check that error messages are captured in warnings
      expect(result.warnings).toBeDefined();
      const warningMessages = result.warnings!.map(w => w.message).join(' ');

      // At least some error messages should be present
      const capturedErrors = errorMessages.filter(msg => warningMessages.includes(msg));
      expect(capturedErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Query generation edge cases', () => {
    it('should handle empty product identification gracefully', async () => {
      const stateNoProduct: Partial<ResearchGraphState> = {
        ...baseState,
        productIdentification: undefined,
        mediaAnalysis: undefined,
      };

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(stateNoProduct as ResearchGraphState, config);

      // Should use item title as fallback
      expect(result.searchQueries).toBeDefined();
      if (result.searchQueries!.length > 0) {
        expect(result.searchQueries).toContain(mockItem.title);
      }
    });

    it('should filter out very short queries (less than 2 characters)', async () => {
      const stateShortQuery: Partial<ResearchGraphState> = {
        ...baseState,
        productIdentification: {
          confidence: 0.8,
          brand: 'X', // 1 character - should be filtered
          model: 'Y', // 1 character - should be filtered
          attributes: {},
        },
        item: {
          ...mockItem,
          title: 'AB', // 2 characters - minimum valid
        },
      };

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(stateShortQuery as ResearchGraphState, config);

      // Should have some queries (title is 2 chars, valid)
      expect(result.searchQueries).toBeDefined();
      // All queries should be at least 2 characters
      result.searchQueries!.forEach(query => {
        expect(query.trim().length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle queries with special characters', async () => {
      const stateSpecialChars: Partial<ResearchGraphState> = {
        ...baseState,
        productIdentification: {
          confidence: 0.9,
          brand: 'Test&Brand',
          model: 'Model-X/100',
          attributes: {},
        },
      };

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };

      // Should not throw error with special characters
      await expect(searchCompsNode(stateSpecialChars as ResearchGraphState, config))
        .resolves.toBeDefined();

      const result = await searchCompsNode(stateSpecialChars as ResearchGraphState, config);
      expect(result.searchQueries).toBeDefined();
    });

    it('should remove duplicate queries', async () => {
      const stateDuplicates: Partial<ResearchGraphState> = {
        ...baseState,
        productIdentification: {
          confidence: 0.9,
          brand: 'TestBrand',
          model: 'Model-X100',
          attributes: {},
        },
        mediaAnalysis: {
          brand: 'TestBrand', // Duplicate of productIdentification.brand
          category: 'Electronics',
          attributes: {},
          confidence: 0.85,
        },
      };

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(stateDuplicates as ResearchGraphState, config);

      // Check for duplicates
      const queries = result.searchQueries || [];
      const uniqueQueries = new Set(queries);
      expect(queries.length).toBe(uniqueQueries.size);
    });
  });

  describe('Mixed success/failure scenarios', () => {
    it('should handle mix of fulfilled with empty arrays and rejected promises', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([]), // Empty result
        searchActiveListings: jest.fn().mockRejectedValue(new Error('API failed')), // Rejected
        searchByImage: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'image-1', price: 105.00 }),
        ]), // Has results
        searchAmazonProducts: jest.fn().mockResolvedValue([]), // Empty result
        lookupAmazonByUpc: jest.fn().mockResolvedValue(null), // Null result (no match)
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Should have comp from image search
      expect(result.comps).toBeDefined();
      expect(result.comps!.length).toBe(1);
      expect(result.comps![0].id).toBe('image-1');

      // Should have warning for active listings failure
      expect(result.warnings).toBeDefined();
      const activeWarning = result.warnings!.find(w => w.message.includes('active'));
      expect(activeWarning).toBeDefined();

      // Should have warning for no sold listings
      const soldWarning = result.warnings!.find(w =>
        w.category === 'data_missing' && w.message.includes('sold')
      );
      expect(soldWarning).toBeDefined();
    });

    it('should handle non-Error rejection reasons gracefully', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockRejectedValue('String error message'), // Not an Error object
        searchActiveListings: jest.fn().mockRejectedValue({ code: 500, message: 'Server error' }), // Object
        searchByImage: jest.fn().mockRejectedValue(null), // Null
        searchAmazonProducts: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'B12345', price: 89.99 }),
        ]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      // Should not crash
      expect(result).toBeDefined();
      expect(result.comps).toBeDefined();
      expect(result.warnings).toBeDefined();

      // All rejection reasons should be converted to strings in warnings
      result.warnings!.forEach(warning => {
        expect(typeof warning.message).toBe('string');
      });
    });
  });

  describe('Match type tracking', () => {
    it('should assign correct match types based on search method', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
        ]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'image-1', price: 105.00 }),
        ]),
        lookupAmazonByUpc: jest.fn().mockResolvedValue(
          createMockAmazonMatch({ asin: 'B001234567' }),
        ),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(baseState as ResearchGraphState, config);

      expect(result.comps).toBeDefined();

      // Keyword searches with brand+model should have BRAND_MODEL_KEYWORD
      const keywordComp = result.comps!.find(c => c.id === 'sold-1');
      expect(keywordComp?.matchType).toBe('BRAND_MODEL_KEYWORD');

      // Image searches should have IMAGE_SIMILARITY
      const imageComp = result.comps!.find(c => c.id === 'image-1');
      expect(imageComp?.matchType).toBe('IMAGE_SIMILARITY');

      // UPC lookups should have UPC_EXACT
      const upcComp = result.comps!.find(c => c.id === 'B001234567');
      expect(upcComp?.matchType).toBe('UPC_EXACT');
    });

    it('should use GENERIC_KEYWORD when no brand/model available', async () => {
      const stateNoBrandModel: Partial<ResearchGraphState> = {
        ...baseState,
        productIdentification: undefined,
        mediaAnalysis: {
          category: 'Electronics',
          attributes: {},
          confidence: 0.85,
        },
      };

      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
        ]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = { configurable: { tools: mockTools } };
      const result = await searchCompsNode(stateNoBrandModel as ResearchGraphState, config);

      expect(result.comps).toBeDefined();
      const comp = result.comps!.find(c => c.id === 'sold-1');
      expect(comp?.matchType).toBe('GENERIC_KEYWORD');
    });
  });

  describe('Activity logger integration', () => {
    it('should work without activity logger (optional dependency)', async () => {
      const mockTools: CompSearchTools = {
        searchSoldListings: jest.fn().mockResolvedValue([
          createMockCompResult({ listingId: 'sold-1', price: 95.00, soldDate: new Date('2024-01-10') }),
        ]),
        searchActiveListings: jest.fn().mockResolvedValue([]),
        searchByImage: jest.fn().mockResolvedValue([]),
      };

      const config = {
        configurable: {
          tools: mockTools,
          // No activityLogger provided
        }
      };

      // Should not crash without activity logger
      await expect(searchCompsNode(baseState as ResearchGraphState, config))
        .resolves.toBeDefined();
    });
  });

  describe('Tools validation', () => {
    it('should throw error if tools not provided', async () => {
      const config = { configurable: {} };

      await expect(searchCompsNode(baseState as ResearchGraphState, config))
        .rejects.toThrow('CompSearchTools not provided');
    });
  });
});
