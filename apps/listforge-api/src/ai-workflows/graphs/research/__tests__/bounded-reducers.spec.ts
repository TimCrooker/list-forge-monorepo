/**
 * Unit tests for bounded reducers in research-graph.state.ts
 *
 * These reducers prevent unbounded memory growth during long research runs by:
 * 1. Limiting array sizes to configured maximums
 * 2. Keeping highest-quality items (for scored arrays)
 * 3. Keeping most recent items (for temporal arrays)
 *
 * Critical: The sorting logic for comps is where bugs would cause the worst
 * data quality issues. These tests verify that HIGH-scoring items are kept,
 * not evicted.
 */

import {
  ResearchEvidenceRecord,
  WebSearchResult,
  AmazonProductMatch,
  ValidatedComparable,
  CompValidation,
} from '@listforge/core-types';

// ============================================================================
// Constants (mirrored from research-graph.state.ts)
// ============================================================================

const MAX_WARNINGS = 50;
const MAX_WEB_SEARCH_RESULTS = 50;
const MAX_AMAZON_MATCHES = 20;
const MAX_COMPS = 100;
const MAX_VALIDATED_COMPS = 50;

// ============================================================================
// Type Definitions
// ============================================================================

type ResearchWarning = {
  severity: 'low' | 'medium' | 'high';
  category: 'data_missing' | 'api_failure' | 'low_confidence' | 'rate_limit' | 'other';
  message: string;
  source: string;
  impact?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

// ============================================================================
// Reducer Implementations (copied from research-graph.state.ts)
// ============================================================================

function boundedWarningsReducer(
  existing: ResearchWarning[] | undefined,
  update: ResearchWarning[],
): ResearchWarning[] {
  const merged = [...(existing || []), ...(update || [])];

  // If we exceed max length, keep only the most recent warnings
  if (merged.length > MAX_WARNINGS) {
    return merged.slice(-MAX_WARNINGS);
  }

  return merged;
}

function boundedWebSearchResultsReducer(
  existing: WebSearchResult[] | undefined,
  update: WebSearchResult[],
): WebSearchResult[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_WEB_SEARCH_RESULTS) {
    return merged.slice(-MAX_WEB_SEARCH_RESULTS);
  }

  return merged;
}

function boundedAmazonMatchesReducer(
  existing: AmazonProductMatch[] | undefined,
  update: AmazonProductMatch[],
): AmazonProductMatch[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_AMAZON_MATCHES) {
    // Sort by confidence score (descending) and keep top matches
    return merged
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, MAX_AMAZON_MATCHES);
  }

  return merged;
}

function boundedCompsReducer(
  existing: ResearchEvidenceRecord[] | undefined,
  update: ResearchEvidenceRecord[],
): ResearchEvidenceRecord[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_COMPS) {
    // Sort by validation overall score (descending) and keep top comps
    return merged
      .sort((a, b) => {
        const scoreA = a.validation?.overallScore || 0;
        const scoreB = b.validation?.overallScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, MAX_COMPS);
  }

  return merged;
}

function boundedValidatedCompsReducer(
  existing: ValidatedComparable[] | undefined,
  update: ValidatedComparable[],
): ValidatedComparable[] {
  const merged = [...(existing || []), ...(update || [])];

  if (merged.length > MAX_VALIDATED_COMPS) {
    // Sort by confidence score (descending) and keep top comps
    return merged
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, MAX_VALIDATED_COMPS);
  }

  return merged;
}

// ============================================================================
// Test Helpers
// ============================================================================

function createWarning(
  message: string,
  timestamp: Date = new Date(),
): ResearchWarning {
  return {
    severity: 'medium',
    category: 'other',
    message,
    source: 'test',
    timestamp,
  };
}

function createWebSearchResult(
  query: string,
  timestamp: string = new Date().toISOString(),
): WebSearchResult {
  return {
    query,
    content: `Content for ${query}`,
    sources: ['https://example.com'],
    timestamp,
  };
}

function createAmazonMatch(
  asin: string,
  confidence: number,
): AmazonProductMatch {
  return {
    asin,
    title: `Product ${asin}`,
    confidence,
    source: 'sp-api',
  };
}

function createComp(
  id: string,
  overallScore: number,
): ResearchEvidenceRecord {
  return {
    id,
    type: 'sold_listing',
    source: 'ebay',
    title: `Item ${id}`,
    relevanceScore: 0.8,
    extractedData: {},
    fetchedAt: new Date().toISOString(),
    validation: {
      isValid: overallScore >= 0.7,
      overallScore,
      criteria: {
        brandMatch: { matches: true, confidence: 0.9 },
        modelMatch: { matches: true, confidence: 0.9 },
        variantMatch: { matches: true, confidence: 0.9 },
        conditionMatch: { matches: true, withinGrade: 0 },
        recency: { valid: true, daysSinceSold: 30, threshold: 90 },
        priceOutlier: { isOutlier: false },
      },
      reasoning: 'Test comp',
    },
  };
}

function createValidatedComp(
  listingId: string,
  confidenceScore: number,
): ValidatedComparable {
  return {
    listingId,
    title: `Listing ${listingId}`,
    price: 100,
    currency: 'USD',
    matchType: 'UPC_EXACT',
    relevanceScore: 0.8,
    validationStatus: 'validated',
    confidenceScore,
    dataSource: 'ebay_sold',
  };
}

// ============================================================================
// Tests: boundedWarningsReducer
// ============================================================================

describe('boundedWarningsReducer', () => {
  describe('basic merge behavior', () => {
    it('should merge existing and update arrays', () => {
      const existing = [createWarning('warning1')];
      const update = [createWarning('warning2')];

      const result = boundedWarningsReducer(existing, update);

      expect(result).toHaveLength(2);
      expect(result[0].message).toBe('warning1');
      expect(result[1].message).toBe('warning2');
    });

    it('should handle undefined existing array', () => {
      const update = [createWarning('warning1')];

      const result = boundedWarningsReducer(undefined, update);

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('warning1');
    });

    it('should handle empty update array', () => {
      const existing = [createWarning('warning1')];
      const update: ResearchWarning[] = [];

      const result = boundedWarningsReducer(existing, update);

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('warning1');
    });
  });

  describe('eviction when exceeding max', () => {
    it('should keep only the most recent MAX_WARNINGS items', () => {
      // Create 30 existing warnings
      const existing = Array.from({ length: 30 }, (_, i) =>
        createWarning(`existing${i}`, new Date(2024, 0, i + 1)),
      );

      // Add 25 new warnings (total = 55, exceeds MAX_WARNINGS = 50)
      const update = Array.from({ length: 25 }, (_, i) =>
        createWarning(`update${i}`, new Date(2024, 1, i + 1)),
      );

      const result = boundedWarningsReducer(existing, update);

      expect(result).toHaveLength(MAX_WARNINGS);
      // Should evict the first 5 warnings and keep the last 50
      expect(result[0].message).toBe('existing5');
      expect(result[49].message).toBe('update24');
    });

    it('should keep most recent warnings when far exceeding max', () => {
      // Create 100 warnings when max is 50
      const existing = Array.from({ length: 60 }, (_, i) =>
        createWarning(`existing${i}`),
      );
      const update = Array.from({ length: 40 }, (_, i) =>
        createWarning(`update${i}`),
      );

      const result = boundedWarningsReducer(existing, update);

      expect(result).toHaveLength(MAX_WARNINGS);
      // Should keep last 50 (10 from existing, all 40 from update)
      expect(result[0].message).toBe('existing50');
      expect(result[49].message).toBe('update39');
    });
  });

  describe('edge cases', () => {
    it('should handle both arrays empty', () => {
      const result = boundedWarningsReducer([], []);
      expect(result).toHaveLength(0);
    });

    it('should handle both arrays undefined', () => {
      const result = boundedWarningsReducer(undefined, []);
      expect(result).toHaveLength(0);
    });

    it('should not slice when exactly at max', () => {
      const existing = Array.from({ length: MAX_WARNINGS }, (_, i) =>
        createWarning(`warning${i}`),
      );

      const result = boundedWarningsReducer(existing, []);

      expect(result).toHaveLength(MAX_WARNINGS);
      expect(result[0].message).toBe('warning0');
    });
  });
});

// ============================================================================
// Tests: boundedWebSearchResultsReducer
// ============================================================================

describe('boundedWebSearchResultsReducer', () => {
  describe('basic merge behavior', () => {
    it('should merge existing and update arrays', () => {
      const existing = [createWebSearchResult('query1')];
      const update = [createWebSearchResult('query2')];

      const result = boundedWebSearchResultsReducer(existing, update);

      expect(result).toHaveLength(2);
      expect(result[0].query).toBe('query1');
      expect(result[1].query).toBe('query2');
    });

    it('should handle undefined existing array', () => {
      const update = [createWebSearchResult('query1')];

      const result = boundedWebSearchResultsReducer(undefined, update);

      expect(result).toHaveLength(1);
      expect(result[0].query).toBe('query1');
    });
  });

  describe('eviction when exceeding max', () => {
    it('should keep only the most recent MAX_WEB_SEARCH_RESULTS items', () => {
      // Create 30 existing results
      const existing = Array.from({ length: 30 }, (_, i) =>
        createWebSearchResult(`query${i}`, new Date(2024, 0, i + 1).toISOString()),
      );

      // Add 25 new results (total = 55, exceeds MAX_WEB_SEARCH_RESULTS = 50)
      const update = Array.from({ length: 25 }, (_, i) =>
        createWebSearchResult(`update${i}`, new Date(2024, 1, i + 1).toISOString()),
      );

      const result = boundedWebSearchResultsReducer(existing, update);

      expect(result).toHaveLength(MAX_WEB_SEARCH_RESULTS);
      // Should keep last 50 results
      expect(result[0].query).toBe('query5');
      expect(result[49].query).toBe('update24');
    });

    it('should handle massive overflow gracefully', () => {
      const existing = Array.from({ length: 100 }, (_, i) =>
        createWebSearchResult(`query${i}`),
      );
      const update = Array.from({ length: 50 }, (_, i) =>
        createWebSearchResult(`update${i}`),
      );

      const result = boundedWebSearchResultsReducer(existing, update);

      expect(result).toHaveLength(MAX_WEB_SEARCH_RESULTS);
      // Should keep last 50 (merged array sliced at -50)
      // 100 existing + 50 update = 150 total, keep last 50
      expect(result[0].query).toBe('update0');
      expect(result[49].query).toBe('update49');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const result = boundedWebSearchResultsReducer([], []);
      expect(result).toHaveLength(0);
    });

    it('should preserve order of results', () => {
      const existing = [
        createWebSearchResult('first'),
        createWebSearchResult('second'),
      ];
      const update = [
        createWebSearchResult('third'),
        createWebSearchResult('fourth'),
      ];

      const result = boundedWebSearchResultsReducer(existing, update);

      expect(result.map(r => r.query)).toEqual(['first', 'second', 'third', 'fourth']);
    });
  });
});

// ============================================================================
// Tests: boundedAmazonMatchesReducer
// ============================================================================

describe('boundedAmazonMatchesReducer', () => {
  describe('basic merge behavior', () => {
    it('should merge existing and update arrays', () => {
      const existing = [createAmazonMatch('ASIN1', 0.8)];
      const update = [createAmazonMatch('ASIN2', 0.9)];

      const result = boundedAmazonMatchesReducer(existing, update);

      expect(result).toHaveLength(2);
      expect(result.map(m => m.asin)).toContain('ASIN1');
      expect(result.map(m => m.asin)).toContain('ASIN2');
    });

    it('should handle undefined existing array', () => {
      const update = [createAmazonMatch('ASIN1', 0.8)];

      const result = boundedAmazonMatchesReducer(undefined, update);

      expect(result).toHaveLength(1);
      expect(result[0].asin).toBe('ASIN1');
    });
  });

  describe('sorting and eviction', () => {
    it('should sort by confidence (descending) when exceeding max', () => {
      // Create matches with varying confidence scores
      const existing = [
        createAmazonMatch('LOW1', 0.3),
        createAmazonMatch('MED1', 0.6),
        createAmazonMatch('HIGH1', 0.9),
      ];

      const update = [
        createAmazonMatch('LOW2', 0.2),
        createAmazonMatch('MED2', 0.7),
        createAmazonMatch('HIGH2', 0.95),
      ];

      // Create enough to exceed MAX_AMAZON_MATCHES (20)
      const moreMatches = Array.from({ length: 18 }, (_, i) =>
        createAmazonMatch(`FILL${i}`, 0.5),
      );

      const result = boundedAmazonMatchesReducer(
        [...existing, ...moreMatches],
        update,
      );

      expect(result).toHaveLength(MAX_AMAZON_MATCHES);
      // Highest confidence should be first
      expect(result[0].confidence).toBe(0.95);
      expect(result[1].confidence).toBe(0.9);
      // Lowest confidence should be evicted
      expect(result.find(m => m.asin === 'LOW1')).toBeUndefined();
      expect(result.find(m => m.asin === 'LOW2')).toBeUndefined();
    });

    it('should keep highest confidence matches and evict lowest', () => {
      // Create 15 low-confidence matches
      const existing = Array.from({ length: 15 }, (_, i) =>
        createAmazonMatch(`LOW${i}`, 0.1 + i * 0.01),
      );

      // Add 10 high-confidence matches (total = 25, exceeds max = 20)
      const update = Array.from({ length: 10 }, (_, i) =>
        createAmazonMatch(`HIGH${i}`, 0.9 + i * 0.01),
      );

      const result = boundedAmazonMatchesReducer(existing, update);

      expect(result).toHaveLength(MAX_AMAZON_MATCHES);
      // All high-confidence matches should be present
      update.forEach(match => {
        expect(result.find(m => m.asin === match.asin)).toBeDefined();
      });
      // Lowest confidence matches should be evicted
      expect(result.find(m => m.asin === 'LOW0')).toBeUndefined();
      expect(result.find(m => m.asin === 'LOW1')).toBeUndefined();
    });

    it('should handle matches with undefined confidence', () => {
      const existing = [
        createAmazonMatch('DEFINED', 0.8),
        { ...createAmazonMatch('UNDEFINED', 0), confidence: undefined as any },
      ];

      const update = [createAmazonMatch('HIGH', 0.9)];

      const result = boundedAmazonMatchesReducer(existing, update);

      expect(result).toHaveLength(3);
      // When under max, no sorting happens, so order is preserved
      // Undefined confidence is only treated as 0 during sorting
      expect(result[0].asin).toBe('DEFINED');
      expect(result[1].asin).toBe('UNDEFINED');
      expect(result[2].asin).toBe('HIGH');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const result = boundedAmazonMatchesReducer([], []);
      expect(result).toHaveLength(0);
    });

    it('should not sort when under max', () => {
      const existing = [
        createAmazonMatch('A', 0.5),
        createAmazonMatch('B', 0.7),
      ];
      const update = [createAmazonMatch('C', 0.6)];

      const result = boundedAmazonMatchesReducer(existing, update);

      expect(result).toHaveLength(3);
      // Order should be preserved (no sorting needed)
      expect(result[0].asin).toBe('A');
      expect(result[1].asin).toBe('B');
      expect(result[2].asin).toBe('C');
    });

    it('should handle exact max boundary', () => {
      const existing = Array.from({ length: MAX_AMAZON_MATCHES }, (_, i) =>
        createAmazonMatch(`ASIN${i}`, 0.5),
      );

      const result = boundedAmazonMatchesReducer(existing, []);

      expect(result).toHaveLength(MAX_AMAZON_MATCHES);
    });
  });

  describe('sorting correctness - critical for data quality', () => {
    it('should KEEP high-scoring items, not evict them', () => {
      // This is the critical test - verify we keep HIGH scores
      const highQualityMatches = [
        createAmazonMatch('PERFECT', 1.0),
        createAmazonMatch('EXCELLENT', 0.95),
        createAmazonMatch('GREAT', 0.9),
      ];

      const lowQualityMatches = Array.from({ length: 20 }, (_, i) =>
        createAmazonMatch(`POOR${i}`, 0.1 + i * 0.01),
      );

      const result = boundedAmazonMatchesReducer(
        lowQualityMatches,
        highQualityMatches,
      );

      expect(result).toHaveLength(MAX_AMAZON_MATCHES);

      // CRITICAL: High-quality matches MUST be in the result
      expect(result.find(m => m.asin === 'PERFECT')).toBeDefined();
      expect(result.find(m => m.asin === 'EXCELLENT')).toBeDefined();
      expect(result.find(m => m.asin === 'GREAT')).toBeDefined();

      // Lowest quality should be evicted
      expect(result.find(m => m.asin === 'POOR0')).toBeUndefined();
      expect(result.find(m => m.asin === 'POOR1')).toBeUndefined();
      expect(result.find(m => m.asin === 'POOR2')).toBeUndefined();
    });
  });
});

// ============================================================================
// Tests: boundedCompsReducer - MOST CRITICAL
// ============================================================================

describe('boundedCompsReducer', () => {
  describe('basic merge behavior', () => {
    it('should merge existing and update arrays', () => {
      const existing = [createComp('comp1', 0.8)];
      const update = [createComp('comp2', 0.9)];

      const result = boundedCompsReducer(existing, update);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.id)).toContain('comp1');
      expect(result.map(c => c.id)).toContain('comp2');
    });

    it('should handle undefined existing array', () => {
      const update = [createComp('comp1', 0.8)];

      const result = boundedCompsReducer(undefined, update);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('comp1');
    });
  });

  describe('sorting and eviction by validation score', () => {
    it('should sort by validation.overallScore (descending) when exceeding max', () => {
      const existing = [
        createComp('LOW1', 0.3),
        createComp('MED1', 0.6),
        createComp('HIGH1', 0.9),
      ];

      const update = [
        createComp('LOW2', 0.2),
        createComp('MED2', 0.7),
        createComp('HIGH2', 0.95),
      ];

      // Add enough comps to exceed MAX_COMPS (100)
      const moreComps = Array.from({ length: 98 }, (_, i) =>
        createComp(`FILL${i}`, 0.5),
      );

      const result = boundedCompsReducer([...existing, ...moreComps], update);

      expect(result).toHaveLength(MAX_COMPS);
      // Highest score should be first
      expect(result[0].validation?.overallScore).toBe(0.95);
      expect(result[1].validation?.overallScore).toBe(0.9);
      // Lowest scores should be evicted
      expect(result.find(c => c.id === 'LOW1')).toBeUndefined();
      expect(result.find(c => c.id === 'LOW2')).toBeUndefined();
    });

    it('should keep highest quality comps and evict lowest quality', () => {
      // Create 60 low-quality comps
      const existing = Array.from({ length: 60 }, (_, i) =>
        createComp(`LOW${i}`, 0.1 + i * 0.005),
      );

      // Add 50 high-quality comps (total = 110, exceeds max = 100)
      const update = Array.from({ length: 50 }, (_, i) =>
        createComp(`HIGH${i}`, 0.8 + i * 0.003),
      );

      const result = boundedCompsReducer(existing, update);

      expect(result).toHaveLength(MAX_COMPS);
      // All high-quality comps should be present
      update.forEach(comp => {
        expect(result.find(c => c.id === comp.id)).toBeDefined();
      });
      // Lowest quality comps should be evicted
      expect(result.find(c => c.id === 'LOW0')).toBeUndefined();
      expect(result.find(c => c.id === 'LOW1')).toBeUndefined();
    });

    it('should handle comps with undefined validation', () => {
      const existing = [
        createComp('VALID', 0.8),
        { ...createComp('INVALID', 0), validation: undefined },
      ];

      const update = [createComp('HIGH', 0.9)];

      const result = boundedCompsReducer(existing, update);

      expect(result).toHaveLength(3);
      // When under max, no sorting happens, so order is preserved
      // Undefined validation is only treated as score 0 during sorting
      expect(result[0].id).toBe('VALID');
      expect(result[1].id).toBe('INVALID');
      expect(result[2].id).toBe('HIGH');
    });

    it('should handle comps with validation but undefined overallScore', () => {
      const existing = [
        createComp('VALID', 0.8),
        {
          ...createComp('PARTIAL', 0),
          validation: { overallScore: undefined } as any,
        },
      ];

      const update = [createComp('HIGH', 0.9)];

      const result = boundedCompsReducer(existing, update);

      expect(result).toHaveLength(3);
      // When under max, no sorting happens, so order is preserved
      // Undefined overallScore is only treated as 0 during sorting
      expect(result[0].id).toBe('VALID');
      expect(result[1].id).toBe('PARTIAL');
      expect(result[2].id).toBe('HIGH');
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const result = boundedCompsReducer([], []);
      expect(result).toHaveLength(0);
    });

    it('should not sort when under max', () => {
      const existing = [createComp('A', 0.5), createComp('B', 0.7)];
      const update = [createComp('C', 0.6)];

      const result = boundedCompsReducer(existing, update);

      expect(result).toHaveLength(3);
      // Order should be preserved (no sorting needed)
      expect(result[0].id).toBe('A');
      expect(result[1].id).toBe('B');
      expect(result[2].id).toBe('C');
    });

    it('should handle exact max boundary', () => {
      const existing = Array.from({ length: MAX_COMPS }, (_, i) =>
        createComp(`comp${i}`, 0.5),
      );

      const result = boundedCompsReducer(existing, []);

      expect(result).toHaveLength(MAX_COMPS);
    });
  });

  describe('CRITICAL: sorting correctness - prevents data quality disasters', () => {
    it('should KEEP high-scoring comps, not evict them', () => {
      // This is THE critical test for data quality
      const perfectComps = [
        createComp('PERFECT_1', 1.0),
        createComp('PERFECT_2', 0.99),
        createComp('PERFECT_3', 0.98),
        createComp('PERFECT_4', 0.97),
        createComp('PERFECT_5', 0.96),
      ];

      // Create 100 poor quality comps
      const poorComps = Array.from({ length: 100 }, (_, i) =>
        createComp(`POOR${i}`, 0.1 + i * 0.001),
      );

      const result = boundedCompsReducer(poorComps, perfectComps);

      expect(result).toHaveLength(MAX_COMPS);

      // CRITICAL: Perfect comps MUST be in the result
      perfectComps.forEach(comp => {
        const found = result.find(c => c.id === comp.id);
        expect(found).toBeDefined();
        expect(found?.validation?.overallScore).toBe(comp.validation?.overallScore);
      });

      // Lowest quality should be evicted
      expect(result.find(c => c.id === 'POOR0')).toBeUndefined();
      expect(result.find(c => c.id === 'POOR1')).toBeUndefined();
      expect(result.find(c => c.id === 'POOR2')).toBeUndefined();
      expect(result.find(c => c.id === 'POOR3')).toBeUndefined();
      expect(result.find(c => c.id === 'POOR4')).toBeUndefined();
    });

    it('should maintain score ordering after multiple updates', () => {
      // Simulate multiple rounds of updates
      let state = boundedCompsReducer(undefined, [
        createComp('ROUND1_HIGH', 0.9),
        createComp('ROUND1_LOW', 0.3),
      ]);

      state = boundedCompsReducer(state, [
        createComp('ROUND2_HIGHEST', 0.95),
        createComp('ROUND2_MED', 0.6),
      ]);

      state = boundedCompsReducer(state, [
        createComp('ROUND3_PERFECT', 1.0),
        createComp('ROUND3_LOWEST', 0.1),
      ]);

      // Now add enough to trigger eviction
      const filler = Array.from({ length: 98 }, (_, i) =>
        createComp(`FILL${i}`, 0.5),
      );
      state = boundedCompsReducer(state, filler);

      expect(state).toHaveLength(MAX_COMPS);

      // Top items should be the highest scores
      expect(state[0].id).toBe('ROUND3_PERFECT');
      expect(state[1].id).toBe('ROUND2_HIGHEST');
      expect(state[2].id).toBe('ROUND1_HIGH');

      // Lowest scores should be evicted
      expect(state.find(c => c.id === 'ROUND3_LOWEST')).toBeUndefined();
      expect(state.find(c => c.id === 'ROUND1_LOW')).toBeUndefined();
    });

    it('should handle 200 comps correctly, keeping top 100', () => {
      // Extreme load test: 200 comps when max is 100
      const comps = Array.from({ length: 200 }, (_, i) => {
        // Create scores from 0.01 to 1.0
        const score = (i + 1) / 200;
        return createComp(`comp${i}`, score);
      });

      const result = boundedCompsReducer(undefined, comps);

      expect(result).toHaveLength(MAX_COMPS);

      // Should keep top 100 (scores 0.505 to 1.0)
      // comp199 has score 1.0, comp100 has score ~0.505
      expect(result[0].id).toBe('comp199'); // Highest score
      expect(result[0].validation?.overallScore).toBe(1.0);

      expect(result[99].validation?.overallScore).toBeGreaterThanOrEqual(0.5);

      // Bottom 100 should be evicted (scores 0.005 to 0.5)
      expect(result.find(c => c.id === 'comp0')).toBeUndefined();
      expect(result.find(c => c.id === 'comp50')).toBeUndefined();
      expect(result.find(c => c.id === 'comp99')).toBeUndefined();
    });

    it('should handle tie-breaking gracefully', () => {
      // All comps have the same score
      const sameScoreComps = Array.from({ length: 150 }, (_, i) =>
        createComp(`comp${i}`, 0.8),
      );

      const result = boundedCompsReducer(undefined, sameScoreComps);

      expect(result).toHaveLength(MAX_COMPS);
      // With tied scores, first 100 should be kept (stable sort behavior)
      result.forEach(comp => {
        expect(comp.validation?.overallScore).toBe(0.8);
      });
    });
  });
});

// ============================================================================
// Tests: boundedValidatedCompsReducer
// ============================================================================

describe('boundedValidatedCompsReducer', () => {
  describe('basic merge behavior', () => {
    it('should merge existing and update arrays', () => {
      const existing = [createValidatedComp('comp1', 0.8)];
      const update = [createValidatedComp('comp2', 0.9)];

      const result = boundedValidatedCompsReducer(existing, update);

      expect(result).toHaveLength(2);
      expect(result.map(c => c.listingId)).toContain('comp1');
      expect(result.map(c => c.listingId)).toContain('comp2');
    });

    it('should handle undefined existing array', () => {
      const update = [createValidatedComp('comp1', 0.8)];

      const result = boundedValidatedCompsReducer(undefined, update);

      expect(result).toHaveLength(1);
      expect(result[0].listingId).toBe('comp1');
    });
  });

  describe('sorting and eviction by confidence score', () => {
    it('should sort by confidenceScore (descending) when exceeding max', () => {
      const existing = [
        createValidatedComp('LOW1', 0.3),
        createValidatedComp('MED1', 0.6),
        createValidatedComp('HIGH1', 0.9),
      ];

      const update = [
        createValidatedComp('LOW2', 0.2),
        createValidatedComp('MED2', 0.7),
        createValidatedComp('HIGH2', 0.95),
      ];

      // Add enough to exceed MAX_VALIDATED_COMPS (50)
      const moreComps = Array.from({ length: 48 }, (_, i) =>
        createValidatedComp(`FILL${i}`, 0.5),
      );

      const result = boundedValidatedCompsReducer(
        [...existing, ...moreComps],
        update,
      );

      expect(result).toHaveLength(MAX_VALIDATED_COMPS);
      // Highest confidence should be first
      expect(result[0].confidenceScore).toBe(0.95);
      expect(result[1].confidenceScore).toBe(0.9);
      // Lowest should be evicted
      expect(result.find(c => c.listingId === 'LOW1')).toBeUndefined();
      expect(result.find(c => c.listingId === 'LOW2')).toBeUndefined();
    });

    it('should keep highest confidence comps and evict lowest', () => {
      // Create 30 low-confidence comps
      const existing = Array.from({ length: 30 }, (_, i) =>
        createValidatedComp(`LOW${i}`, 0.1 + i * 0.01),
      );

      // Add 25 high-confidence comps (total = 55, exceeds max = 50)
      const update = Array.from({ length: 25 }, (_, i) =>
        createValidatedComp(`HIGH${i}`, 0.8 + i * 0.005),
      );

      const result = boundedValidatedCompsReducer(existing, update);

      expect(result).toHaveLength(MAX_VALIDATED_COMPS);
      // All high-confidence comps should be present
      update.forEach(comp => {
        expect(result.find(c => c.listingId === comp.listingId)).toBeDefined();
      });
      // Lowest confidence should be evicted
      expect(result.find(c => c.listingId === 'LOW0')).toBeUndefined();
      expect(result.find(c => c.listingId === 'LOW1')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty arrays', () => {
      const result = boundedValidatedCompsReducer([], []);
      expect(result).toHaveLength(0);
    });

    it('should not sort when under max', () => {
      const existing = [
        createValidatedComp('A', 0.5),
        createValidatedComp('B', 0.7),
      ];
      const update = [createValidatedComp('C', 0.6)];

      const result = boundedValidatedCompsReducer(existing, update);

      expect(result).toHaveLength(3);
      // Order should be preserved (no sorting needed)
      expect(result[0].listingId).toBe('A');
      expect(result[1].listingId).toBe('B');
      expect(result[2].listingId).toBe('C');
    });

    it('should handle exact max boundary', () => {
      const existing = Array.from({ length: MAX_VALIDATED_COMPS }, (_, i) =>
        createValidatedComp(`comp${i}`, 0.5),
      );

      const result = boundedValidatedCompsReducer(existing, []);

      expect(result).toHaveLength(MAX_VALIDATED_COMPS);
    });
  });

  describe('CRITICAL: sorting correctness for validated comps', () => {
    it('should KEEP high-confidence comps, not evict them', () => {
      const perfectComps = [
        createValidatedComp('PERFECT_1', 1.0),
        createValidatedComp('PERFECT_2', 0.99),
        createValidatedComp('PERFECT_3', 0.98),
      ];

      const poorComps = Array.from({ length: 50 }, (_, i) =>
        createValidatedComp(`POOR${i}`, 0.1 + i * 0.01),
      );

      const result = boundedValidatedCompsReducer(poorComps, perfectComps);

      expect(result).toHaveLength(MAX_VALIDATED_COMPS);

      // CRITICAL: Perfect comps MUST be in the result
      perfectComps.forEach(comp => {
        const found = result.find(c => c.listingId === comp.listingId);
        expect(found).toBeDefined();
        expect(found?.confidenceScore).toBe(comp.confidenceScore);
      });

      // Lowest confidence should be evicted
      expect(result.find(c => c.listingId === 'POOR0')).toBeUndefined();
      expect(result.find(c => c.listingId === 'POOR1')).toBeUndefined();
      expect(result.find(c => c.listingId === 'POOR2')).toBeUndefined();
    });

    it('should handle 100 validated comps when max is 50', () => {
      const comps = Array.from({ length: 100 }, (_, i) => {
        const score = (i + 1) / 100;
        return createValidatedComp(`comp${i}`, score);
      });

      const result = boundedValidatedCompsReducer(undefined, comps);

      expect(result).toHaveLength(MAX_VALIDATED_COMPS);

      // Should keep top 50
      expect(result[0].listingId).toBe('comp99');
      expect(result[0].confidenceScore).toBe(1.0);
      expect(result[49].confidenceScore).toBeGreaterThanOrEqual(0.5);

      // Bottom 50 should be evicted
      expect(result.find(c => c.listingId === 'comp0')).toBeUndefined();
      expect(result.find(c => c.listingId === 'comp25')).toBeUndefined();
      expect(result.find(c => c.listingId === 'comp49')).toBeUndefined();
    });
  });
});
